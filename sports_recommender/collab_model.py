from __future__ import annotations

from typing import Optional, Sequence

import numpy as np
import pandas as pd

try:
  from surprise import Dataset as SurpriseDataset
  from surprise import Reader, SVD, accuracy
except ImportError:  # pragma: no cover - handled after requirements installation
  SurpriseDataset = None
  Reader = None
  SVD = None
  accuracy = None


class CollaborativeFilteringRecommender:
  """Collaborative filtering model using Surprise SVD."""

  def __init__(
    self,
    n_factors: int = 100,
    n_epochs: int = 20,
    random_state: int = 42,
  ) -> None:
    self.n_factors = n_factors
    self.n_epochs = n_epochs
    self.random_state = random_state
    self.algo = None
    self.products_df: Optional[pd.DataFrame] = None
    self.train_df: Optional[pd.DataFrame] = None
    self.metrics: dict[str, float] = {}
    self.global_mean = 3.0
    self.seen_items_by_user: dict[str, set[str]] = {}

  def fit(
    self,
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    products_df: pd.DataFrame,
  ) -> "CollaborativeFilteringRecommender":
    if SurpriseDataset is None or Reader is None or SVD is None or accuracy is None:
      raise ImportError("Install scikit-surprise to train the collaborative filtering model")

    reader = Reader(rating_scale=(1, 5))
    surprise_train = SurpriseDataset.load_from_df(
      train_df[["user_id", "product_id", "rating"]],
      reader,
    )
    trainset = surprise_train.build_full_trainset()

    self.algo = SVD(
      n_factors=self.n_factors,
      n_epochs=self.n_epochs,
      random_state=self.random_state,
    )
    self.algo.fit(trainset)

    surprise_testset = list(test_df[["user_id", "product_id", "rating"]].itertuples(index=False, name=None))
    predictions = self.algo.test(surprise_testset)
    self.metrics = {
      "rmse": float(accuracy.rmse(predictions, verbose=False)),
      "mae": float(accuracy.mae(predictions, verbose=False)),
    }
    self.products_df = products_df.copy().reset_index(drop=True)
    self.train_df = train_df.copy().reset_index(drop=True)
    self.global_mean = float(train_df["rating"].mean())
    self.seen_items_by_user = {
      user_id: set(frame["product_id"].astype(str))
      for user_id, frame in self.train_df.groupby("user_id")
    }
    return self

  def score_candidates(
    self,
    user_id: str,
    candidate_product_ids: Sequence[str],
  ) -> pd.DataFrame:
    self._ensure_fitted()
    rows: list[dict[str, float | str]] = []
    for product_id in candidate_product_ids:
      predicted_rating = self.predict_rating(user_id, product_id)
      normalized_score = float(np.clip((predicted_rating - 1.0) / 4.0, 0.0, 1.0))
      rows.append(
        {
          "product_id": str(product_id),
          "collab_rating": predicted_rating,
          "collab_score": normalized_score,
        }
      )
    return pd.DataFrame(rows)

  def recommend_for_user(
    self,
    user_id: str,
    top_n: int = 10,
    exclude_seen: bool = True,
  ) -> pd.DataFrame:
    self._ensure_fitted()
    seen_items = self.seen_items_by_user.get(user_id, set()) if exclude_seen else set()
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
    result_df["score"] = result_df["collab_score"]
    return result_df.sort_values("score", ascending=False).head(top_n).reset_index(drop=True)

  def predict_rating(self, user_id: str, product_id: str) -> float:
    self._ensure_fitted()
    estimate = float(self.algo.predict(str(user_id), str(product_id)).est)
    return float(np.clip(estimate, 1.0, 5.0))

  def _ensure_fitted(self) -> None:
    if self.algo is None or self.products_df is None:
      raise RuntimeError("CollaborativeFilteringRecommender.fit must be called before inference")

