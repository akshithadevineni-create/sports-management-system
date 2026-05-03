from __future__ import annotations

from typing import Callable

import numpy as np
import pandas as pd

from .hybrid import HybridRecommender
from .collab_model import CollaborativeFilteringRecommender
from .content_model import ContentBasedRecommender


def evaluate_models(
  content_model: ContentBasedRecommender,
  collab_model: CollaborativeFilteringRecommender,
  hybrid_model: HybridRecommender,
  train_df: pd.DataFrame,
  test_df: pd.DataFrame,
  top_k: int = 10,
  relevance_threshold: float = 4.0,
  max_ranking_users: int = 500,
) -> pd.DataFrame:
  content_rmse, content_mae = _evaluate_rating_predictions(
    test_df,
    lambda user_id, product_ids: content_model.score_candidates(user_id, train_df, product_ids),
    rating_column="content_rating",
  )
  collab_rmse, collab_mae = _evaluate_rating_predictions(
    test_df,
    lambda user_id, product_ids: collab_model.score_candidates(user_id, product_ids),
    rating_column="collab_rating",
  )
  hybrid_rmse, hybrid_mae = _evaluate_rating_predictions(
    test_df,
    lambda user_id, product_ids: hybrid_model.score_candidates(user_id, product_ids),
    rating_column="final_rating",
  )

  content_ranking = _evaluate_ranking_metrics(
    test_df,
    lambda user_id: content_model.recommend_for_user(user_id, train_df, top_n=top_k),
    top_k=top_k,
    relevance_threshold=relevance_threshold,
    max_users=max_ranking_users,
  )
  collab_ranking = _evaluate_ranking_metrics(
    test_df,
    lambda user_id: collab_model.recommend_for_user(user_id, top_n=top_k),
    top_k=top_k,
    relevance_threshold=relevance_threshold,
    max_users=max_ranking_users,
  )
  hybrid_ranking = _evaluate_ranking_metrics(
    test_df,
    lambda user_id: hybrid_model.recommend_for_user(user_id, top_n=top_k),
    top_k=top_k,
    relevance_threshold=relevance_threshold,
    max_users=max_ranking_users,
  )

  return pd.DataFrame(
    [
      {
        "model": "content_only",
        "rmse": content_rmse,
        "mae": content_mae,
        "precision@10": content_ranking["precision@10"],
        "recall@10": content_ranking["recall@10"],
        "ndcg@10": content_ranking["ndcg@10"],
      },
      {
        "model": "collab_only",
        "rmse": collab_rmse,
        "mae": collab_mae,
        "precision@10": collab_ranking["precision@10"],
        "recall@10": collab_ranking["recall@10"],
        "ndcg@10": collab_ranking["ndcg@10"],
      },
      {
        "model": "hybrid",
        "rmse": hybrid_rmse,
        "mae": hybrid_mae,
        "precision@10": hybrid_ranking["precision@10"],
        "recall@10": hybrid_ranking["recall@10"],
        "ndcg@10": hybrid_ranking["ndcg@10"],
      },
    ]
  )


def _evaluate_rating_predictions(
  test_df: pd.DataFrame,
  scoring_fn: Callable[[str, list[str]], pd.DataFrame],
  rating_column: str,
) -> tuple[float, float]:
  y_true: list[float] = []
  y_pred: list[float] = []

  for user_id, frame in test_df.groupby("user_id"):
    candidate_ids = frame["product_id"].astype(str).tolist()
    scored_df = scoring_fn(str(user_id), candidate_ids)
    if scored_df.empty:
      continue

    predicted_map = scored_df.set_index("product_id")[rating_column].astype(float).to_dict()
    for row in frame.itertuples(index=False):
      if row.product_id not in predicted_map:
        continue
      y_true.append(float(row.rating))
      y_pred.append(float(predicted_map[row.product_id]))

  if not y_true:
    return float("nan"), float("nan")

  errors = np.array(y_true) - np.array(y_pred)
  rmse = float(np.sqrt(np.mean(np.square(errors))))
  mae = float(np.mean(np.abs(errors)))
  return rmse, mae


def _evaluate_ranking_metrics(
  test_df: pd.DataFrame,
  recommend_fn: Callable[[str], pd.DataFrame],
  top_k: int = 10,
  relevance_threshold: float = 4.0,
  max_users: int = 500,
) -> dict[str, float]:
  relevant_test_df = test_df[test_df["rating"] >= relevance_threshold]
  if relevant_test_df.empty:
    return {"precision@10": 0.0, "recall@10": 0.0, "ndcg@10": 0.0}

  precision_scores: list[float] = []
  recall_scores: list[float] = []
  ndcg_scores: list[float] = []

  ground_truth = {
    user_id: dict(zip(frame["product_id"].astype(str), frame["rating"].astype(float), strict=False))
    for user_id, frame in relevant_test_df.groupby("user_id")
  }

  evaluation_user_ids = list(ground_truth.keys())
  if len(evaluation_user_ids) > max_users:
    rng = np.random.default_rng(42)
    evaluation_user_ids = list(rng.choice(evaluation_user_ids, size=max_users, replace=False))

  for user_id in evaluation_user_ids:
    relevant_items = ground_truth[user_id]
    recommended_df = recommend_fn(str(user_id))
    recommended_ids = recommended_df["product_id"].astype(str).head(top_k).tolist()
    hits = sum(1 for product_id in recommended_ids if product_id in relevant_items)

    precision_scores.append(hits / top_k)
    recall_scores.append(hits / len(relevant_items))
    ndcg_scores.append(_ndcg_at_k(recommended_ids, relevant_items, top_k))

  return {
    "precision@10": float(np.mean(precision_scores)),
    "recall@10": float(np.mean(recall_scores)),
    "ndcg@10": float(np.mean(ndcg_scores)),
  }


def _ndcg_at_k(recommended_ids: list[str], relevant_items: dict[str, float], top_k: int) -> float:
  dcg = 0.0
  for rank, product_id in enumerate(recommended_ids[:top_k], start=1):
    rating = relevant_items.get(product_id)
    if rating is None:
      continue
    gain = (2 ** rating) - 1
    dcg += gain / np.log2(rank + 1)

  ideal_ratings = sorted(relevant_items.values(), reverse=True)[:top_k]
  if not ideal_ratings:
    return 0.0

  idcg = 0.0
  for rank, rating in enumerate(ideal_ratings, start=1):
    gain = (2 ** rating) - 1
    idcg += gain / np.log2(rank + 1)

  return float(dcg / idcg) if idcg else 0.0
