import numpy as np
import pandas as pd

from src.config import CFG
import pytest

from src.data.split import load_split, verify_checksums
from src.features.pipeline import FeatureBuilder, SentinelCleaner, Winsorizer, build_pipeline


def _sample() -> pd.DataFrame:
    X, _, _ = load_split("train")
    return X.head(2000)


def test_sentinels_become_nan_with_flags():
    X = pd.DataFrame({"EDUCATION": [0, 1, 5, 6], "MARRIAGE": [0, 1, 2, 3]})
    out = SentinelCleaner(CFG["primary"]["sentinels"]).transform(X)
    assert out["EDUCATION"].isna().sum() == 3
    assert out["EDUCATION_sentinel"].tolist() == [1, 0, 1, 1]
    assert out["MARRIAGE_sentinel"].tolist() == [1, 0, 0, 0]


def test_no_nan_after_transform():
    X = _sample()
    out = build_pipeline().fit_transform(X)
    assert not out.isna().any().any()


def test_winsorizer_caps_from_train_only():
    train = pd.DataFrame({"a": np.arange(100, dtype=float)})
    other = pd.DataFrame({"a": [-1000.0, 1e6]})
    w = Winsorizer(["a"], (0.01, 0.99)).fit(train)
    out = w.transform(other)
    assert out["a"].tolist() == [train["a"].quantile(0.01), train["a"].quantile(0.99)]


def test_no_leakage_from_transform_data():
    X = _sample()
    pipe = build_pipeline().fit(X)
    caps = pipe.named_steps["winsor"].upper_.copy()
    medians = pipe.named_steps["impute"].medians_.copy()
    shifted = X * 10
    pipe.transform(shifted)
    pd.testing.assert_series_equal(caps, pipe.named_steps["winsor"].upper_)
    pd.testing.assert_series_equal(medians, pipe.named_steps["impute"].medians_)


def test_age_and_sex_not_model_features():
    out = build_pipeline().fit_transform(_sample())
    assert "AGE" not in out.columns and "SEX" not in out.columns


def test_checksums_match_and_test_split_is_locked():
    verify_checksums("train")
    verify_checksums("val")
    with pytest.raises(PermissionError):
        load_split("test")


def test_feature_builder_is_bounded_and_stateless():
    X = _sample()
    edge = X.head(3).copy()
    edge[["BILL_AMT2", "BILL_AMT3", "BILL_AMT4", "BILL_AMT5", "BILL_AMT6"]] = [0, -500, 0, 0, 0]
    out = FeatureBuilder().transform(pd.concat([X, edge]))
    engineered = [c for c in out.columns if c not in X.columns]
    assert len(engineered) == 19
    assert np.isfinite(out[engineered].to_numpy()).all()
    assert out.filter(like="PAY_RATIO").stack().between(0, 5).all() and out["PAID_TO_BILLED"].between(0, 5).all()
    assert out["MONTHS_LATE"].between(0, 6).all()
    pd.testing.assert_frame_equal(FeatureBuilder().transform(X.head(5)), FeatureBuilder().fit(X).transform(X.head(5)))
