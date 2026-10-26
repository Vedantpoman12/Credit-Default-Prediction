"""Stratified 70/15/15 frozen splits with a separate aligned sensitive-attribute file and checksums."""
import hashlib
import json

import pandas as pd
from sklearn.model_selection import train_test_split

from src.config import CFG, path
from src.data.load import age_band, load_primary

SPLITS = ("train", "val", "test")
CHECKSUM_FILE = "SPLIT_CHECKSUMS.json"


def _digest(file) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def make_splits() -> dict[str, str]:
    p = CFG["primary"]
    df = load_primary()
    seed, s = CFG["seed"], CFG["split"]
    train, rest = train_test_split(df, train_size=s["train"], stratify=df[p["target"]], random_state=seed)
    val, test = train_test_split(rest, test_size=s["test"] / (s["val"] + s["test"]), stratify=rest[p["target"]], random_state=seed)
    out = path("processed")
    out.mkdir(parents=True, exist_ok=True)
    sums = {}
    for name, part in zip(SPLITS, (train, val, test)):
        sensitive = pd.DataFrame({"age_band": age_band(part["AGE"]), "AGE": part["AGE"], "SEX": part["SEX"]}, index=part.index)
        part[p["features"] + [p["target"]]].to_parquet(out / f"{name}.parquet")
        sensitive.to_parquet(out / f"{name}_sensitive.parquet")
        for f in (f"{name}.parquet", f"{name}_sensitive.parquet"):
            sums[f] = _digest(out / f)
    (out / CHECKSUM_FILE).write_text(json.dumps(sums, indent=2))
    return sums


def verify_checksums(split: str | None = None) -> None:
    out = path("processed")
    expected = json.loads((out / CHECKSUM_FILE).read_text())
    files = [f for f in expected if split is None or f.startswith(f"{split}.") or f.startswith(f"{split}_")]
    bad = [f for f in files if _digest(out / f) != expected[f]]
    if bad:
        raise RuntimeError(f"Frozen split checksum mismatch: {bad}")


def load_split(name: str) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    if name == "test":
        raise PermissionError("The test split is only read by scripts/final_test_eval.py")
    return _read(name)


def _read(name: str) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    verify_checksums(name)
    out, p = path("processed"), CFG["primary"]
    df = pd.read_parquet(out / f"{name}.parquet")
    sens = pd.read_parquet(out / f"{name}_sensitive.parquet")
    assert df.index.equals(sens.index)
    return df[p["features"]], df[p["target"]], sens


if __name__ == "__main__":
    for k, v in make_splits().items():
        print(k, v)
