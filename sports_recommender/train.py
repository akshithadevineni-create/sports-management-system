from __future__ import annotations

from pathlib import Path
import argparse
import os

import pandas as pd

from .collab_model import CollaborativeFilteringRecommender
from .content_model import ContentBasedRecommender
from .evaluation import evaluate_models
from .hybrid import HybridRecommender
from .preprocessing import PreparedData, prepare_data

DEFAULT_REVIEW_PATH = os.getenv("SPORTS_REVIEWS_PATH", "/Users/ananyagyana/Desktop/Sports_and_Outdoors_5.json")
DEFAULT_METADATA_PATH = os.getenv("SPORTS_METADATA_PATH")
DEFAULT_ARTIFACT_PATH = Path(os.getenv("SPORTS_ARTIFACT_PATH", "artifacts/hybrid_recommender.pkl"))


def train_hybrid_system(
  review_path: str | None = DEFAULT_REVIEW_PATH,
  metadata_path: str | None = DEFAULT_METADATA_PATH,
  artifact_path: str | Path | None = DEFAULT_ARTIFACT_PATH,
  alpha: float = 0.6,
  cold_start_threshold: int = 3,
  top_k: int = 10,
  max_ranking_users: int = 500,
  build_lightfm_views_flag: bool = True,
) -> tuple[HybridRecommender, pd.DataFrame, PreparedData]:
  prepared = prepare_data(
    review_path=review_path,
    metadata_path=metadata_path,
    build_lightfm_views_flag=build_lightfm_views_flag,
  )

  content_model = ContentBasedRecommender().fit(prepared.products_df)
  collab_model = CollaborativeFilteringRecommender().fit(
    prepared.train_df,
    prepared.test_df,
    prepared.products_df,
  )
  hybrid_model = HybridRecommender(
    content_model=content_model,
    collab_model=collab_model,
    alpha=alpha,
    cold_start_threshold=cold_start_threshold,
  ).fit(prepared.products_df, prepared.train_df)

  comparison_table = evaluate_models(
    content_model=content_model,
    collab_model=collab_model,
    hybrid_model=hybrid_model,
    train_df=prepared.train_df,
    test_df=prepared.test_df,
    top_k=top_k,
    max_ranking_users=max_ranking_users,
  )

  if artifact_path:
    hybrid_model.save(artifact_path)

  return hybrid_model, comparison_table, prepared


def main() -> None:
  parser = argparse.ArgumentParser(description="Train the hybrid sports recommender")
  parser.add_argument("--reviews-path", default=DEFAULT_REVIEW_PATH)
  parser.add_argument("--metadata-path", default=DEFAULT_METADATA_PATH)
  parser.add_argument("--artifact-path", default=str(DEFAULT_ARTIFACT_PATH))
  parser.add_argument("--alpha", type=float, default=0.6)
  parser.add_argument("--top-k", type=int, default=10)
  parser.add_argument("--max-ranking-users", type=int, default=500)
  parser.add_argument("--cold-start-threshold", type=int, default=3)
  parser.add_argument("--skip-lightfm", action="store_true")
  args = parser.parse_args()

  recommender, comparison_table, prepared = train_hybrid_system(
    review_path=args.reviews_path,
    metadata_path=args.metadata_path,
    artifact_path=args.artifact_path,
    alpha=args.alpha,
    cold_start_threshold=args.cold_start_threshold,
    top_k=args.top_k,
    max_ranking_users=args.max_ranking_users,
    build_lightfm_views_flag=not args.skip_lightfm,
  )

  print("\nPrepared dataset")
  print(f"  metadata_source: {prepared.metadata_source}")
  print(f"  ratings: {len(prepared.ratings_df):,}")
  print(f"  users: {prepared.ratings_df['user_id'].nunique():,}")
  print(f"  products: {prepared.products_df['product_id'].nunique():,}")
  print("\nModel comparison")
  print(comparison_table.to_string(index=False, float_format=lambda value: f"{value:.4f}"))

  sample_user = str(prepared.train_df.iloc[0]["user_id"])
  sample_product = str(prepared.products_df.iloc[0]["product_id"])
  print("\nSample recommendation call")
  print(recommender.recommend_for_user(sample_user, top_n=5)[["product_id", "name", "score"]].to_string(index=False))
  print("\nSample similar-products call")
  print(recommender.similar_products(sample_product, top_n=5)[["product_id", "name", "score"]].to_string(index=False))


if __name__ == "__main__":
  main()
