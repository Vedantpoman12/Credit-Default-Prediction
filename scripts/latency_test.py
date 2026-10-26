import argparse
import sys
import time

import numpy as np
import pandas as pd

from src.config import CFG


def payloads(n: int) -> list[dict]:
    from src.data.split import load_split

    X, _, sens = load_split("val")
    rows = X.join(sens["age_band"]).sample(n, replace=True, random_state=CFG["seed"])
    return [{k: (v.item() if hasattr(v, "item") else v) for k, v in r.items()} for r in rows.to_dict("records")]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=None, help="e.g. http://localhost:8000; default runs in-process")
    ap.add_argument("-n", type=int, default=500)
    ap.add_argument("--max-median-ms", type=float, default=50.0)
    args = ap.parse_args()
    if args.url:
        import httpx
        client = httpx.Client(base_url=args.url)
    else:
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app).__enter__()
    data = [p for p in payloads(args.n) if p["age_band"] != "unknown"]
    times = []
    for p in data:
        start = time.perf_counter()
        r = client.post("/score", json=p)
        times.append((time.perf_counter() - start) * 1000)
        r.raise_for_status()
    t = np.array(times)
    print(f"n={len(t)} median={np.median(t):.2f} ms  p95={np.percentile(t, 95):.2f} ms  p99={np.percentile(t, 99):.2f} ms")
    sys.exit(1 if np.median(t) > args.max_median_ms else 0)


if __name__ == "__main__":
    main()
