from __future__ import annotations

from pathlib import Path
import os

from fastapi import FastAPI, HTTPException, Query

from .hybrid import HybridRecommender
from .train import DEFAULT_ARTIFACT_PATH, DEFAULT_METADATA_PATH, DEFAULT_REVIEW_PATH, train_hybrid_system

app = FastAPI(title="Sports Hybrid Recommendation API", version="1.0.0")


def _load_or_train_recommender() -> HybridRecommender:
  artifact_path = Path(os.getenv("SPORTS_ARTIFACT_PATH", str(DEFAULT_ARTIFACT_PATH)))
  if artifact_path.exists():
    return HybridRecommender.load(artifact_path)

  recommender, _, _ = train_hybrid_system(
    review_path=os.getenv("SPORTS_REVIEWS_PATH", DEFAULT_REVIEW_PATH),
    metadata_path=os.getenv("SPORTS_METADATA_PATH", DEFAULT_METADATA_PATH),
    artifact_path=artifact_path,
  )
  return recommender


@app.on_event("startup")
def startup_event() -> None:
  app.state.recommender = _load_or_train_recommender()


@app.get("/recommend")
def recommend(
  user_id: str = Query(..., description="Raw user identifier from the interaction dataset"),
  top_n: int = Query(10, ge=1, le=50),
) -> dict:
  recommender: HybridRecommender = app.state.recommender
  recommendations = recommender.recommend_for_user(user_id=user_id, top_n=top_n)

  return {
    "user_id": user_id,
    "top_n": top_n,
    "recommendations": _response_records(recommendations),
  }


@app.get("/similar")
def similar(
  product_id: str = Query(..., description="Raw product identifier from the catalog"),
  top_n: int = Query(10, ge=1, le=50),
) -> dict:
  recommender: HybridRecommender = app.state.recommender

  if product_id not in recommender.content_model.product_index:
    raise HTTPException(status_code=404, detail=f"Unknown product_id: {product_id}")

  similar_products = recommender.similar_products(product_id=product_id, top_n=top_n)
  return {
    "product_id": product_id,
    "top_n": top_n,
    "recommendations": _response_records(similar_products),
  }


def _response_records(dataframe) -> list[dict]:
  if dataframe.empty:
    return []

  response_df = dataframe.copy()
  score_column = "score" if "score" in response_df.columns else "final_score"
  return [
    {
      "product_id": str(row["product_id"]),
      "name": str(row["name"]),
      "score": round(float(row[score_column]), 6),
      "category": str(row["category"]),
      "brand": str(row["brand"]),
      "price": round(float(row["price"]), 2),
    }
    for _, row in response_df.iterrows()
  ]

