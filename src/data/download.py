"""Fetch raw datasets if absent and write SHA-256 checksums to data/raw/CHECKSUMS.txt."""
import hashlib
import subprocess
from pathlib import Path

import pandas as pd

from src.config import CFG, path

UCI_TAIWAN_XLS = "https://archive.ics.uci.edu/ml/machine-learning-databases/00350/default%20of%20credit%20card%20clients.xls"
KAGGLE_SANDBOX = "rikdifos/credit-card-approval-prediction"


def sha256(file: Path) -> str:
    h = hashlib.sha256()
    with open(file, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_primary(raw: Path) -> None:
    csv = raw / CFG["primary"]["file"]
    if csv.exists():
        return
    xls = raw / "default of credit card clients.xls"
    if not xls.exists():
        pd.read_excel(UCI_TAIWAN_XLS).to_excel(xls, index=False)
    pd.read_excel(xls).to_csv(csv, index=False)


def fetch_sandbox(raw: Path) -> None:
    files = [raw / CFG["sandbox"]["application"], raw / CFG["sandbox"]["credit"]]
    if all(f.exists() for f in files):
        return
    subprocess.run(["kaggle", "datasets", "download", "-d", KAGGLE_SANDBOX, "-p", str(raw), "--unzip"], check=True)


def main() -> None:
    raw = path("raw")
    raw.mkdir(parents=True, exist_ok=True)
    fetch_primary(raw)
    fetch_sandbox(raw)
    lines = [f"{sha256(f)}  {f.name}" for f in sorted(raw.iterdir()) if f.is_file() and f.name != "CHECKSUMS.txt"]
    (raw / "CHECKSUMS.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
