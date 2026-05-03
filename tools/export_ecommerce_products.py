from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


DEFAULT_REVIEW_PATH = "/Users/ananyagyana/Desktop/Sports_and_Outdoors_5.json"
DEFAULT_OUTPUT_PATH = "src/data/ecommerceProducts.ts"

SPORT_KEYWORDS = {
  "cricket": ["cricket", "bat", "wicket", "bowler", "stumps", "helmet"],
  "football": ["football", "soccer", "goal", "cleat", "shin", "ball"],
  "basketball": ["basketball", "hoop", "court", "dunk"],
  "tennis": ["tennis", "racket", "racquet", "string", "serve", "court"],
  "badminton": ["badminton", "shuttle", "shuttlecock"],
  "cycling": ["cycling", "cycle", "bike", "bicycle", "helmet"],
  "swimming": ["swim", "swimming", "goggle", "pool", "snorkel", "cap"],
  "gym": ["fitness", "gym", "weight", "yoga", "exercise", "training"],
}

CATEGORY_KEYWORDS = {
  "equipment": ["bat", "ball", "racket", "racquet", "goggle", "glove", "shoe", "helmet", "tool"],
  "clothing": ["shirt", "jersey", "shorts", "pant", "sock", "cap", "jacket", "wear"],
  "accessories": ["bag", "bottle", "strap", "cover", "case", "watch", "support", "brace"],
}

BRANDS = [
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
  "Wilson",
  "Nike",
]

EXCLUDED_KEYWORDS = [
  "ammo",
  "ammunition",
  "ar-15",
  "firearm",
  "glock",
  "gun",
  "holster",
  "knife",
  "magazine",
  "pistol",
  "rifle",
  "scope",
  "shooting",
]


def stable_index(value: str, size: int) -> int:
  digest = hashlib.md5(value.encode("utf-8")).hexdigest()
  return int(digest[:8], 16) % size


def score_labels(text: str, rules: dict[str, list[str]], fallback_key: str) -> str:
  scores = {label: 0 for label in rules}
  for label, keywords in rules.items():
    for keyword in keywords:
      scores[label] += len(re.findall(rf"\b{re.escape(keyword)}\b", text))

  best_label = max(scores, key=scores.get)
  if scores[best_label] > 0:
    return best_label

  labels = list(rules)
  return labels[stable_index(fallback_key, len(labels))]


def derive_price(product_id: str, sport_id: str, category: str, rating_count: int) -> int:
  base_prices = {
    "cricket": 1999,
    "football": 1499,
    "basketball": 1799,
    "tennis": 2499,
    "badminton": 1699,
    "cycling": 2299,
    "swimming": 1299,
    "gym": 1799,
  }
  multipliers = {"equipment": 1.2, "clothing": 0.8, "accessories": 0.65}
  offset = 175 * stable_index(product_id, 24)
  popularity_bump = min(rating_count, 200) * 4
  return int(round((base_prices[sport_id] + offset + popularity_bump) * multipliers[category]))


def derive_name(product_id: str, brand: str, sport_id: str, category: str) -> str:
  category_label = {
    "equipment": "Performance Equipment",
    "clothing": "Training Apparel",
    "accessories": "Gear Accessory",
  }[category]
  return f"{brand} {sport_id.title()} {category_label} {product_id[-4:]}"


def aggregate_reviews(review_path: Path, max_reviews: int | None) -> dict[str, dict[str, Any]]:
  products: dict[str, dict[str, Any]] = defaultdict(
    lambda: {"rating_sum": 0.0, "rating_count": 0, "texts": []}
  )

  with review_path.open("r", encoding="utf-8") as source:
    for index, line in enumerate(source):
      if max_reviews is not None and index >= max_reviews:
        break

      review = json.loads(line)
      product_id = str(review.get("asin", "")).strip()
      if not product_id:
        continue

      rating = float(review.get("overall") or 0)
      summary = str(review.get("summary") or "")
      review_text = str(review.get("reviewText") or "")

      product = products[product_id]
      product["rating_sum"] += rating
      product["rating_count"] += 1
      if len(product["texts"]) < 25:
        product["texts"].append(f"{summary} {review_text}")

  return products


def build_products(review_path: Path, limit: int, max_reviews: int | None) -> list[dict[str, Any]]:
  aggregate = aggregate_reviews(review_path, max_reviews)
  ranked_products = sorted(
    aggregate.items(),
    key=lambda item: (item[1]["rating_count"], item[1]["rating_sum"] / item[1]["rating_count"]),
    reverse=True,
  )

  products = []
  for product_id, data in ranked_products:
    text_blob = " ".join(data["texts"]).lower()
    if any(re.search(rf"\b{re.escape(keyword)}\b", text_blob) for keyword in EXCLUDED_KEYWORDS):
      continue

    sport_id = score_labels(text_blob, SPORT_KEYWORDS, f"{product_id}-sport")
    category = score_labels(text_blob, CATEGORY_KEYWORDS, f"{product_id}-category")
    brand = BRANDS[stable_index(f"{product_id}-{sport_id}", len(BRANDS))]
    rating_count = int(data["rating_count"])
    rating = round(data["rating_sum"] / rating_count, 1)
    price = derive_price(product_id, sport_id, category, rating_count)
    name = derive_name(product_id, brand, sport_id, category)

    products.append(
      {
        "id": product_id,
        "sportId": sport_id,
        "name": name,
        "category": category,
        "price": price,
        "brand": brand,
        "rating": rating,
        "image": "",
        "description": f"Amazon Sports and Outdoors item with {rating_count} review interactions used for recommender training.",
        "tags": ["amazon-sports-outdoors", f"reviews:{rating_count}"],
      }
    )

    if len(products) == limit:
      break

  return products


def write_typescript(products: list[dict[str, Any]], output_path: Path, review_path: Path) -> None:
  output_path.parent.mkdir(parents=True, exist_ok=True)
  payload = json.dumps(products, indent=2)
  output_path.write_text(
    "\n".join(
      [
        "// Generated by tools/export_ecommerce_products.py.",
        f"// Source: {review_path}",
        "// The source contains reviews and ASINs; display metadata is deterministically derived.",
        "",
        f"export const ecommerceProducts = {payload} satisfies import(\"./sportsData\").Product[];",
        "",
      ]
    ),
    encoding="utf-8",
  )


def main() -> None:
  parser = argparse.ArgumentParser(description="Export Amazon Sports review data into frontend shop products.")
  parser.add_argument("--reviews-path", default=DEFAULT_REVIEW_PATH)
  parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH)
  parser.add_argument("--limit", type=int, default=80)
  parser.add_argument("--max-reviews", type=int, default=None)
  args = parser.parse_args()

  review_path = Path(args.reviews_path).expanduser()
  output_path = Path(args.output)

  if not review_path.exists():
    raise FileNotFoundError(f"Review dataset not found: {review_path}")

  products = build_products(review_path=review_path, limit=args.limit, max_reviews=args.max_reviews)
  write_typescript(products=products, output_path=output_path, review_path=review_path)
  print(f"Exported {len(products)} ecommerce products to {output_path}")


if __name__ == "__main__":
  main()
