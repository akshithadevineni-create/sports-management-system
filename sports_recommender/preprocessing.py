from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional
import hashlib
import json
import re

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler

try:
  from lightfm.data import Dataset as LightFMDataset
except ImportError:  # pragma: no cover - handled at runtime after installing requirements
  LightFMDataset = None

CORE_SPORT_TYPES = ["cricket", "football", "tennis", "swimming", "fitness"]
CATEGORY_OPTIONS = ["equipment", "apparel", "accessories", "training", "recovery"]
BRAND_OPTIONS = [
  "Nivia",
  "Cosco",
  "SG",
  "Yonex",
  "Speedo",
  "Puma",
  "Decathlon",
  "Adidas",
  "Reebok",
  "Spartan",
]

SPORT_KEYWORDS = {
  "cricket": ["cricket", "bat", "wicket", "bowler", "stumps", "helmet"],
  "football": ["football", "soccer", "goal", "cleat", "shin", "ball"],
  "tennis": ["tennis", "racket", "racquet", "string", "serve", "court"],
  "swimming": ["swim", "swimming", "goggle", "pool", "snorkel", "cap"],
  "fitness": ["fitness", "gym", "weight", "yoga", "exercise", "training"],
}

CATEGORY_KEYWORDS = {
  "equipment": ["bat", "ball", "racket", "racquet", "goggle", "glove", "shoe"],
  "apparel": ["shirt", "jersey", "shorts", "pant", "sock", "cap", "jacket"],
  "accessories": ["bag", "bottle", "strap", "cover", "case", "watch"],
  "training": ["trainer", "drill", "agility", "cone", "resistance", "band"],
  "recovery": ["massage", "foam", "brace", "support", "therapy", "recovery"],
}


@dataclass
class PreparedData:
  ratings_df: pd.DataFrame
  products_df: pd.DataFrame
  train_df: pd.DataFrame
  test_df: pd.DataFrame
  metadata_source: str
  lightfm_views: Optional[dict[str, Any]] = None


def _stable_index(value: str, size: int) -> int:
  digest = hashlib.md5(value.encode("utf-8")).hexdigest()
  return int(digest[:8], 16) % size


def _read_tabular_file(path: Path) -> pd.DataFrame:
  if path.suffix.lower() == ".csv":
    return pd.read_csv(path)
  if path.suffix.lower() in {".json", ".jsonl"}:
    return pd.read_json(path, lines=True)
  raise ValueError(f"Unsupported file format for {path}")


def load_review_data(review_path: Optional[str]) -> tuple[pd.DataFrame, str]:
  path = Path(review_path) if review_path else None
  if path and path.exists():
    raw_df = _read_tabular_file(path)
    source = "provided"
  else:
    ratings_df, products_df = generate_mock_dataset()
    merged_df = ratings_df.merge(products_df, on="product_id", how="left")
    return merged_df, "mock"

  column_mapping = {
    "reviewerID": "user_id",
    "asin": "product_id",
    "overall": "rating",
    "reviewText": "review_text",
    "summary": "summary",
  }
  raw_df = raw_df.rename(columns=column_mapping)

  for column in ["user_id", "product_id", "rating"]:
    if column not in raw_df.columns:
      raise ValueError(f"Review dataset is missing required column: {column}")

  standardized_df = raw_df.copy()
  standardized_df["user_id"] = standardized_df["user_id"].astype(str)
  standardized_df["product_id"] = standardized_df["product_id"].astype(str)
  standardized_df["rating"] = pd.to_numeric(standardized_df["rating"], errors="coerce")
  standardized_df["review_text"] = (
    standardized_df["review_text"] if "review_text" in standardized_df.columns else ""
  )
  standardized_df["summary"] = standardized_df["summary"] if "summary" in standardized_df.columns else ""
  standardized_df["review_text"] = standardized_df["review_text"].fillna("").astype(str)
  standardized_df["summary"] = standardized_df["summary"].fillna("").astype(str)

  standardized_df = standardized_df.dropna(subset=["user_id", "product_id"])
  mean_rating = standardized_df["rating"].mean()
  standardized_df["rating"] = standardized_df["rating"].fillna(mean_rating).clip(1, 5)

  return standardized_df[["user_id", "product_id", "rating", "review_text", "summary"]], source


def load_metadata_data(metadata_path: Optional[str]) -> Optional[pd.DataFrame]:
  path = Path(metadata_path) if metadata_path else None
  if not path or not path.exists():
    return None

  metadata_df = _read_tabular_file(path)
  metadata_df = metadata_df.rename(
    columns={
      "asin": "product_id",
      "title": "name",
      "sport": "sport_type",
    }
  )

  if "product_id" not in metadata_df.columns:
    raise ValueError("Metadata file must contain a product_id or asin column")

  metadata_df["product_id"] = metadata_df["product_id"].astype(str)
  metadata_df["name"] = metadata_df["name"] if "name" in metadata_df.columns else metadata_df["product_id"]
  metadata_df["category"] = metadata_df["category"] if "category" in metadata_df.columns else "equipment"
  metadata_df["brand"] = metadata_df["brand"] if "brand" in metadata_df.columns else "Unknown"
  metadata_df["sport_type"] = metadata_df["sport_type"] if "sport_type" in metadata_df.columns else "fitness"
  metadata_df["name"] = metadata_df["name"].fillna(metadata_df["product_id"]).astype(str)
  metadata_df["category"] = metadata_df["category"].fillna("equipment").astype(str)
  metadata_df["brand"] = metadata_df["brand"].fillna("Unknown").astype(str)
  metadata_df["sport_type"] = metadata_df["sport_type"].fillna("fitness").astype(str)
  metadata_df["price"] = pd.to_numeric(metadata_df.get("price"), errors="coerce")

  keep_columns = ["product_id", "name", "category", "brand", "sport_type", "price"]
  return metadata_df[keep_columns].drop_duplicates(subset=["product_id"])


def infer_metadata_from_reviews(ratings_df: pd.DataFrame) -> pd.DataFrame:
  product_text = (
    ratings_df.assign(full_text=(ratings_df["summary"] + " " + ratings_df["review_text"]).str.lower())
    .groupby("product_id")
    .agg(
      review_blob=("full_text", lambda values: " ".join(values.head(25))),
      avg_rating=("rating", "mean"),
      rating_count=("rating", "size"),
    )
    .reset_index()
  )

  records: list[dict[str, Any]] = []
  for row in product_text.itertuples(index=False):
    sport_type = _infer_label(
      row.review_blob,
      SPORT_KEYWORDS,
      fallback_options=CORE_SPORT_TYPES,
      stable_key=f"{row.product_id}-sport",
    )
    category = _infer_label(
      row.review_blob,
      CATEGORY_KEYWORDS,
      fallback_options=CATEGORY_OPTIONS,
      stable_key=f"{row.product_id}-category",
    )
    brand = BRAND_OPTIONS[_stable_index(f"{row.product_id}-{sport_type}", len(BRAND_OPTIONS))]
    price = _derive_price(row.product_id, sport_type, category)
    name = f"{brand} {sport_type.title()} {category.title()} {row.product_id[-4:]}"

    records.append(
      {
        "product_id": row.product_id,
        "name": name,
        "category": category,
        "brand": brand,
        "sport_type": sport_type,
        "price": price,
        "avg_rating": float(row.avg_rating),
        "rating_count": int(row.rating_count),
      }
    )

  return pd.DataFrame(records)


def _infer_label(
  text: str,
  rules: dict[str, list[str]],
  fallback_options: list[str],
  stable_key: str,
) -> str:
  scores = {label: 0 for label in rules}
  for label, keywords in rules.items():
    for keyword in keywords:
      scores[label] += len(re.findall(rf"\b{re.escape(keyword)}\b", text))

  best_label = max(scores, key=scores.get)
  if scores[best_label] > 0:
    return best_label

  return fallback_options[_stable_index(stable_key, len(fallback_options))]


def _derive_price(product_id: str, sport_type: str, category: str) -> float:
  base_price = {
    "cricket": 1999,
    "football": 1499,
    "tennis": 2499,
    "swimming": 1299,
    "fitness": 1799,
  }[sport_type]
  category_multiplier = {
    "equipment": 1.2,
    "apparel": 0.8,
    "accessories": 0.6,
    "training": 1.0,
    "recovery": 0.9,
  }[category]
  offset = 250 * _stable_index(product_id, 18)
  return round((base_price + offset) * category_multiplier, 2)


def enrich_products(products_df: pd.DataFrame, ratings_df: pd.DataFrame) -> pd.DataFrame:
  ratings_summary = (
    ratings_df.groupby("product_id")
    .agg(avg_rating=("rating", "mean"), rating_count=("rating", "size"))
    .reset_index()
  )

  products_df = products_df.merge(ratings_summary, on="product_id", how="left", suffixes=("", "_derived"))

  if "avg_rating_derived" in products_df.columns:
    products_df["avg_rating"] = products_df["avg_rating"].fillna(products_df.pop("avg_rating_derived"))
  elif "avg_rating" not in products_df.columns:
    products_df["avg_rating"] = ratings_df["rating"].mean()

  if "rating_count_derived" in products_df.columns:
    products_df["rating_count"] = products_df["rating_count"].fillna(products_df.pop("rating_count_derived"))
  elif "rating_count" not in products_df.columns:
    products_df["rating_count"] = 1

  products_df["name"] = products_df["name"].fillna(products_df["product_id"])
  products_df["category"] = products_df["category"].fillna("equipment")
  products_df["brand"] = products_df["brand"].fillna("Unknown")
  products_df["sport_type"] = products_df["sport_type"].fillna("fitness")
  products_df["price"] = pd.to_numeric(products_df["price"], errors="coerce")
  products_df["price"] = products_df["price"].fillna(products_df["price"].median())
  products_df["avg_rating"] = products_df["avg_rating"].fillna(ratings_df["rating"].mean())
  products_df["rating_count"] = products_df["rating_count"].fillna(1)

  price_scaler = MinMaxScaler()
  products_df["price_normalized"] = price_scaler.fit_transform(products_df[["price"]])

  category_encoder = LabelEncoder()
  brand_encoder = LabelEncoder()
  products_df["category_encoded"] = category_encoder.fit_transform(products_df["category"])
  products_df["brand_encoded"] = brand_encoder.fit_transform(products_df["brand"])

  popularity_raw = 0.7 * products_df["avg_rating"] + 0.3 * np.log1p(products_df["rating_count"])
  popularity_scaler = MinMaxScaler()
  products_df["popularity_score"] = popularity_scaler.fit_transform(popularity_raw.to_frame())

  return products_df.drop_duplicates(subset=["product_id"]).reset_index(drop=True)


def split_interactions(
  ratings_df: pd.DataFrame,
  test_size: float = 0.2,
  random_state: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame]:
  rng = np.random.default_rng(random_state)
  train_parts: list[pd.DataFrame] = []
  test_parts: list[pd.DataFrame] = []

  for _, user_frame in ratings_df.groupby("user_id"):
    if len(user_frame) == 1:
      train_parts.append(user_frame)
      continue

    shuffled = user_frame.sample(frac=1.0, random_state=int(rng.integers(0, 1_000_000)))
    tentative_test_size = max(1, int(round(len(shuffled) * test_size)))
    if tentative_test_size >= len(shuffled):
      tentative_test_size = len(shuffled) - 1

    test_parts.append(shuffled.iloc[:tentative_test_size])
    train_parts.append(shuffled.iloc[tentative_test_size:])

  train_df = pd.concat(train_parts, ignore_index=True)
  test_df = pd.concat(test_parts, ignore_index=True) if test_parts else ratings_df.iloc[0:0].copy()
  return train_df, test_df


def build_lightfm_dataset_views(
  ratings_df: pd.DataFrame,
  products_df: pd.DataFrame,
) -> Optional[dict[str, Any]]:
  if LightFMDataset is None:
    return None

  dataset = LightFMDataset()
  item_feature_tokens = [
    f"brand:{brand}" for brand in products_df["brand"].unique()
  ] + [
    f"category:{category}" for category in products_df["category"].unique()
  ] + [
    f"sport:{sport}" for sport in products_df["sport_type"].unique()
  ]

  dataset.fit(
    users=ratings_df["user_id"].unique(),
    items=products_df["product_id"].unique(),
    item_features=item_feature_tokens,
  )

  interactions, weights = dataset.build_interactions(
    (
      (row.user_id, row.product_id, float(row.rating))
      for row in ratings_df[["user_id", "product_id", "rating"]].itertuples(index=False)
    )
  )
  item_features = dataset.build_item_features(
    (
      (
        row.product_id,
        [
          f"brand:{row.brand}",
          f"category:{row.category}",
          f"sport:{row.sport_type}",
        ],
      )
      for row in products_df[["product_id", "brand", "category", "sport_type"]].itertuples(index=False)
    )
  )

  user_mapping, item_mapping, _, item_feature_mapping = dataset.mapping()
  return {
    "dataset": dataset,
    "interactions": interactions,
    "weights": weights,
    "item_features": item_features,
    "user_mapping": user_mapping,
    "item_mapping": item_mapping,
    "item_feature_mapping": item_feature_mapping,
  }


def prepare_data(
  review_path: Optional[str] = None,
  metadata_path: Optional[str] = None,
  test_size: float = 0.2,
  random_state: int = 42,
  min_user_ratings: int = 1,
  min_item_ratings: int = 1,
  build_lightfm_views_flag: bool = True,
) -> PreparedData:
  reviews_df, review_source = load_review_data(review_path)

  # Mock generation returns a pre-joined dataframe so we split it back out here.
  if {"category", "brand", "sport_type", "price", "name"}.issubset(reviews_df.columns):
    metadata_source = "mock"
    metadata_df = reviews_df[
      ["product_id", "name", "category", "brand", "sport_type", "price"]
    ].drop_duplicates(subset=["product_id"])
    ratings_df = reviews_df[["user_id", "product_id", "rating", "review_text", "summary"]].copy()
  else:
    ratings_df = reviews_df.copy()
    metadata_df = load_metadata_data(metadata_path)
    metadata_source = "provided" if metadata_df is not None else "derived"
    if metadata_df is None:
      metadata_df = infer_metadata_from_reviews(ratings_df)

  if min_user_ratings > 1:
    valid_users = ratings_df["user_id"].value_counts()
    ratings_df = ratings_df[ratings_df["user_id"].isin(valid_users[valid_users >= min_user_ratings].index)]

  if min_item_ratings > 1:
    valid_items = ratings_df["product_id"].value_counts()
    ratings_df = ratings_df[ratings_df["product_id"].isin(valid_items[valid_items >= min_item_ratings].index)]

  products_df = metadata_df[metadata_df["product_id"].isin(ratings_df["product_id"].unique())].copy()
  products_df = enrich_products(products_df, ratings_df)
  train_df, test_df = split_interactions(ratings_df, test_size=test_size, random_state=random_state)
  lightfm_views = build_lightfm_dataset_views(ratings_df, products_df) if build_lightfm_views_flag else None

  return PreparedData(
    ratings_df=ratings_df.reset_index(drop=True),
    products_df=products_df.reset_index(drop=True),
    train_df=train_df.reset_index(drop=True),
    test_df=test_df.reset_index(drop=True),
    metadata_source="mock" if review_source == "mock" else metadata_source,
    lightfm_views=lightfm_views,
  )


def generate_mock_dataset(
  num_users: int = 500,
  num_products: int = 200,
  seed: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame]:
  rng = np.random.default_rng(seed)
  sports = np.array(CORE_SPORT_TYPES)
  categories = np.array(CATEGORY_OPTIONS)
  brands = np.array(BRAND_OPTIONS)

  products: list[dict[str, Any]] = []
  for index in range(num_products):
    product_id = f"P{index + 1:04d}"
    sport_type = str(rng.choice(sports))
    category = str(rng.choice(categories))
    brand = str(rng.choice(brands))
    base_price = _derive_price(product_id, sport_type, category)
    products.append(
      {
        "product_id": product_id,
        "name": f"{brand} {sport_type.title()} {category.title()} {index + 1}",
        "category": category,
        "brand": brand,
        "sport_type": sport_type,
        "price": base_price,
      }
    )

  products_df = pd.DataFrame(products)

  ratings: list[dict[str, Any]] = []
  for user_index in range(num_users):
    user_id = f"U{user_index + 1:04d}"
    preferred_sports = rng.choice(sports, size=2, replace=False)
    num_interactions = int(rng.integers(12, 26))
    interacted_products = rng.choice(products_df["product_id"], size=num_interactions, replace=False)

    for product_id in interacted_products:
      product = products_df.loc[products_df["product_id"] == product_id].iloc[0]
      affinity = 1.0 if product["sport_type"] in preferred_sports else 0.0
      noise = rng.normal(0, 0.8)
      rating = np.clip(3.0 + affinity + noise, 1.0, 5.0)
      ratings.append(
        {
          "user_id": user_id,
          "product_id": product_id,
          "rating": round(float(rating), 1),
          "review_text": f"Useful {product['sport_type']} {product['category']} item from {product['brand']}.",
          "summary": f"{product['sport_type'].title()} gear",
        }
      )

  ratings_df = pd.DataFrame(ratings)
  return ratings_df, products_df
