from collections.abc import Callable

import numpy as np


def ece(y: np.ndarray, p: np.ndarray, n_bins: int = 15) -> float:
    y, p = np.asarray(y), np.asarray(p)
    bins = np.minimum((p * n_bins).astype(int), n_bins - 1)
    total = 0.0
    for b in range(n_bins):
        m = bins == b
        if m.any():
            total += m.mean() * abs(y[m].mean() - p[m].mean())
    return float(total)


def bootstrap_ci(metric: Callable, y: np.ndarray, p: np.ndarray, n: int = 500, seed: int = 42) -> tuple[float, float, float]:
    y, p = np.asarray(y), np.asarray(p)
    rng = np.random.default_rng(seed)
    stats = []
    for _ in range(n):
        idx = rng.integers(0, len(y), len(y))
        if y[idx].min() != y[idx].max():
            stats.append(metric(y[idx], p[idx]))
    return float(metric(y, p)), float(np.percentile(stats, 2.5)), float(np.percentile(stats, 97.5))
