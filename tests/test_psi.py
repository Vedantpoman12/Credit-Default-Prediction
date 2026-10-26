import numpy as np
import pandas as pd

from src.monitoring.psi import categorical_psi, psi, psi_table, status


def test_identical_distribution_is_zero():
    x = np.random.default_rng(42).normal(size=5000)
    assert psi(x, x) < 1e-6


def test_shift_is_detected():
    rng = np.random.default_rng(42)
    ref, cur = rng.normal(size=5000), rng.normal(1.0, 1, size=5000)
    assert psi(ref, cur) > 0.25


def test_status_bands():
    assert status(0.05) == "ok" and status(0.2) == "investigate" and status(0.3) == "act"


def test_table_columns():
    rng = np.random.default_rng(42)
    ref = pd.DataFrame({"a": rng.normal(size=1000), "b": rng.normal(size=1000)})
    cur = ref.assign(b=ref.b + 2)
    t = psi_table(ref, cur)
    assert list(t.columns) == ["feature", "psi", "status"]
    assert t.iloc[0]["feature"] == "b" and t.iloc[0]["status"] == "act"


def test_categorical_psi_detects_base_rate_rise():
    ref = np.r_[np.zeros(780), np.ones(220)]
    cur = np.r_[np.zeros(600), np.ones(400)]
    assert categorical_psi(ref, ref) < 1e-6
    assert categorical_psi(ref, cur) > 0.1
