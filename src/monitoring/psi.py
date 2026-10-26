import numpy as np
import pandas as pd

EPS = 1e-4


def psi(reference: np.ndarray, current: np.ndarray, bins: int = 10) -> float:
    reference, current = np.asarray(reference, float), np.asarray(current, float)
    edges = np.unique(np.quantile(reference, np.linspace(0, 1, bins + 1)))
    if len(edges) < 2:
        return 0.0
    edges[0], edges[-1] = -np.inf, np.inf
    ref = np.histogram(reference, edges)[0] / len(reference) + EPS
    cur = np.histogram(current, edges)[0] / len(current) + EPS
    ref, cur = ref / ref.sum(), cur / cur.sum()
    return float(np.sum((cur - ref) * np.log(cur / ref)))


def categorical_psi(reference: np.ndarray, current: np.ndarray) -> float:
    cats = np.union1d(np.unique(reference), np.unique(current))
    ref = pd.Series(reference).value_counts(normalize=True).reindex(cats, fill_value=0).to_numpy() + EPS
    cur = pd.Series(current).value_counts(normalize=True).reindex(cats, fill_value=0).to_numpy() + EPS
    return float(np.sum((cur - ref) * np.log(cur / ref)))


def status(value: float) -> str:
    if value < 0.1:
        return "ok"
    return "investigate" if value <= 0.25 else "act"


def psi_table(reference: pd.DataFrame, current: pd.DataFrame, columns: list[str] | None = None) -> pd.DataFrame:
    cols = columns or [c for c in reference.columns if c in current.columns]
    rows = [{"feature": c, "psi": round(psi(reference[c], current[c]), 4)} for c in cols]
    table = pd.DataFrame(rows).assign(status=lambda d: d.psi.map(status))
    return table.sort_values("psi", ascending=False).reset_index(drop=True)
