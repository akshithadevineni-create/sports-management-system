from __future__ import annotations

from pathlib import Path
import pickle

import pandas as pd

from .collab_model import CollaborativeFilteringRecommender
from .content_model import ContentBasedRecommender


class HybridRecommender:
  """Hybrid recommender that blends content and collaborative scores."""

  def __init__(
    self,
    content_model: ContentBasedRecommender,
    collab_model: CollaborativeFilteringRecommender,
    alpha: float = 0.6,
    cold_start_threshold: int = 3,
  ) -> None:
    self.content_model = content_model
    self.collab_model = collab_model
    self.alpha = alpha
    self.cold_start_threshold = cold_start_threshold
    self.products_df: pd.DataFrame | None = None
    self.train_df: pd.DataFrame | None = None

  def fit(self, products_df: pd.DataFrame, train_df: pd.DataFrame) -> "HybridRecommender":
    self.products_df = products_df.copy().reset_index(drop=True)
    self.train_df = train_df.copy().reset_index(drop=True)
    return self

  def similar_products(self, product_id: str, top_n: int = 10) -> pd.DataFrame:
    return self.content_model.similar_products(product_id, top_n=top_n)

  def score_candidates(
    self,
    user_id: str,
    candidate_product_ids: list[str] | tuple[str, ...],
  ) -> pd.DataFrame:
    self._ensure_fitted()
    content_scores = self.content_model.score_candidates(user_id, self.train_df, candidate_product_ids)
    interaction_count = int((self.train_df["user_id"] == user_id).sum())

    if interaction_count < self.cold_start_threshold:
      result_df = content_scores.copy()
      result_df["final_score"] = result_df["content_score"]
      result_df["final_rating"] = result_df["content_rating"]
      result_df["mode"] = "content_fallback"
      return result_df

    collab_scores = self.collab_model.score_candidates(user_id, candidate_product_ids)
    merged_df = content_scores.merge(collab_scores, on="product_id", how="outer").fillna(0.0)
    merged_df["final_score"] = (
      self.alpha * merged_df["content_score"] + (1.0 - self.alpha) * merged_df["collab_score"]
    )
    merged_df["final_rating"] = (
      self.alpha * merged_df["content_rating"] + (1.0 - self.alpha) * merged_df["collab_rating"]
    )
    merged_df["mode"] = "hybrid"
    return merged_df

  def recommend_for_user(
    self,
    user_id: str,
    top_n: int = 10,
    exclude_seen: bool = True,
  ) -> pd.DataFrame:
    self._ensure_fitted()
    seen_items = set(self.train_df.loc[self.train_df["user_id"] == user_id, "product_id"]) if exclude_seen else set()
    candidate_ids = [
      product_id for product_id in self.products_df["product_id"].astype(str)
      if product_id not in seen_items
    ]
    scored_df = self.score_candidates(user_id, candidate_ids)
    result_df = scored_df.merge(
      self.products_df[["product_id", "name", "category", "brand", "price"]],
      on="product_id",
      how="left",
    )
    result_df["score"] = result_df["final_score"]
    return result_df.sort_values("score", ascending=False).head(top_n).reset_index(drop=True)

  def predict_rating(self, user_id: str, product_id: str) -> float:
    scored_df = self.score_candidates(user_id, [product_id])
    if scored_df.empty:
      return self.content_model.predict_rating(user_id, product_id, self.train_df)
    return float(scored_df.iloc[0]["final_rating"])

  def save(self, path: str | Path) -> None:
    artifact_path = Path(path)
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    with artifact_path.open("wb") as artifact_file:
      pickle.dump(self, artifact_file)

  @classmethod
  def load(cls, path: str | Path) -> "HybridRecommender":
    with Path(path).open("rb") as artifact_file:
      return pickle.load(artifact_file)

  def _ensure_fitted(self) -> None:
    if self.products_df is None or self.train_df is None:
      raise RuntimeError("HybridRecommender.fit must be called before inference")

