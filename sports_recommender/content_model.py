from __future__ import annotations

from typing import Optional, Sequence

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors


class ContentBasedRecommender:
  """TF-IDF content model over product metadata text."""

  def __init__(self) -> None:
    self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    self.nearest_neighbors = NearestNeighbors(metric="cosine", algorithm="brute")
    self.products_df: Optional[pd.DataFrame] = None
    self.item_matrix = None
    self.product_index: dict[str, int] = {}
    self.default_scores: dict[str, float] = {}

  def fit(self, products_df: pd.DataFrame) -> "ContentBasedRecommender":
    fitted_products = products_df.copy().reset_index(drop=True)
    fitted_products["metadata_text"] = (
      fitted_products[["category", "brand", "sport_type"]]
      .fillna("unknown")
      .astype(str)
      .agg(" ".join, axis=1)
    )

    self.item_matrix = self.vectorizer.fit_transform(fitted_products["metadata_text"])
    self.nearest_neighbors.fit(self.item_matrix)
    self.products_df = fitted_products
    self.product_index = {
      product_id: idx for idx, product_id in enumerate(fitted_products["product_id"])
    }
    self.default_scores = (
      fitted_products.set_index("product_id")["popularity_score"].astype(float).to_dict()
      if "popularity_score" in fitted_products.columns
      else {product_id: 0.0 for product_id in fitted_products["product_id"]}
    )
    return self

  def similar_products(self, product_id: str, top_n: int = 10) -> pd.DataFrame:
    self._ensure_fitted()
    if product_id not in self.product_index:
      raise KeyError(f"Unknown product_id: {product_id}")

    query_index = self.product_index[product_id]
    max_neighbors = min(top_n + 1, len(self.products_df))
    distances, indices = self.nearest_neighbors.kneighbors(
      self.item_matrix[query_index],
      n_neighbors=max_neighbors,
    )

    rows: list[dict[str, float | str]] = []
    for distance, index in zip(distances[0], indices[0], strict=False):
      candidate_product_id = str(self.products_df.iloc[index]["product_id"])
      if candidate_product_id == product_id:
        continue
      rows.append(
        {
          "product_id": candidate_product_id,
          "name": self.products_df.iloc[index]["name"],
          "score": float(1 - distance),
          "category": self.products_df.iloc[index]["category"],
          "brand": self.products_df.iloc[index]["brand"],
          "price": float(self.products_df.iloc[index]["price"]),
        }
      )
      if len(rows) >= top_n:
        break

    return pd.DataFrame(rows)

  def score_candidates(
    self,
    user_id: str,
    ratings_df: pd.DataFrame,
    candidate_product_ids: Optional[Sequence[str]] = None,
  ) -> pd.DataFrame:
    self._ensure_fitted()
    candidate_ids = self._resolve_candidates(candidate_product_ids)
    user_history = ratings_df[ratings_df["user_id"] == user_id]

    if user_history.empty:
      return self._popularity_scores(candidate_ids)

    rated_products = user_history[user_history["product_id"].isin(self.product_index)]
    if rated_products.empty:
      return self._popularity_scores(candidate_ids)

    rated_indices = [self.product_index[product_id] for product_id in rated_products["product_id"]]
    weights = rated_products["rating"].astype(float).to_numpy()
    weights = weights / weights.sum()

    weighted_item_matrix = self.item_matrix[rated_indices].multiply(weights[:, None])
    user_profile = weighted_item_matrix.sum(axis=0)
    similarities = cosine_similarity(user_profile, self.item_matrix).ravel()

    rows: list[dict[str, float | str]] = []
    for product_id in candidate_ids:
      if product_id not in self.product_index:
        continue
      index = self.product_index[product_id]
      score = float(np.clip(similarities[index], 0.0, 1.0))
      rows.append(
        {
          "product_id": product_id,
          "content_score": score,
          "content_rating": 1.0 + (4.0 * score),
        }
      )

    return pd.DataFrame(rows)

  def recommend_for_user(
    self,
    user_id: str,
    ratings_df: pd.DataFrame,
    top_n: int = 10,
    exclude_seen: bool = True,
  ) -> pd.DataFrame:
    self._ensure_fitted()
    seen_items = set(ratings_df.loc[ratings_df["user_id"] == user_id, "product_id"]) if exclude_seen else set()
    candidate_ids = [product_id for product_id in self.products_df["product_id"] if product_id not in seen_items]
    scored_df = self.score_candidates(user_id, ratings_df, candidate_ids)

    if scored_df.empty:
      return scored_df

    result_df = scored_df.merge(
      self.products_df[["product_id", "name", "category", "brand", "price"]],
      on="product_id",
      how="left",
    )
    result_df["score"] = result_df["content_score"]
    return result_df.sort_values("score", ascending=False).head(top_n).reset_index(drop=True)

  def predict_rating(self, user_id: str, product_id: str, ratings_df: pd.DataFrame) -> float:
    scored_df = self.score_candidates(user_id, ratings_df, [product_id])
    if scored_df.empty:
      return 1.0 + (4.0 * self.default_scores.get(product_id, 0.0))
    return float(scored_df.iloc[0]["content_rating"])

  def _resolve_candidates(self, candidate_product_ids: Optional[Sequence[str]]) -> list[str]:
    self._ensure_fitted()
    if candidate_product_ids is None:
      return self.products_df["product_id"].astype(str).tolist()
    return [str(product_id) for product_id in candidate_product_ids]

  def _popularity_scores(self, candidate_ids: Sequence[str]) -> pd.DataFrame:
    rows = []
    for product_id in candidate_ids:
      score = float(np.clip(self.default_scores.get(product_id, 0.0), 0.0, 1.0))
      rows.append(
        {
          "product_id": product_id,
          "content_score": score,
          "content_rating": 1.0 + (4.0 * score),
        }
      )
    return pd.DataFrame(rows)

  def _ensure_fitted(self) -> None:
    if self.products_df is None or self.item_matrix is None:
      raise RuntimeError("ContentBasedRecommender.fit must be called before inference")

