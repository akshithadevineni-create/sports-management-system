from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.request import urlopen

BASE_URL = "http://127.0.0.1:8000"


def call_api(path: str, params: dict[str, str | int]) -> dict:
  url = f"{BASE_URL}{path}?{urlencode(params)}"
  with urlopen(url) as response:
    return json.loads(response.read().decode("utf-8"))


if __name__ == "__main__":
  print("GET /recommend")
  print(
    json.dumps(
      call_api("/recommend", {"user_id": "AIXZKN4ACSKI", "top_n": 10}),
      indent=2,
    )
  )

  print("\nGET /similar")
  print(
    json.dumps(
      call_api("/similar", {"product_id": "1881509818", "top_n": 5}),
      indent=2,
    )
  )

