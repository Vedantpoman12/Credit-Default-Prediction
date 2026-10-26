from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_config(name: str = "config.yaml") -> dict[str, Any]:
    with open(ROOT / "config" / name) as f:
        return yaml.safe_load(f)


CFG = load_config()


def path(key: str) -> Path:
    return ROOT / CFG["paths"][key]
