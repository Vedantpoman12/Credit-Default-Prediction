import hashlib
import json
from datetime import datetime, timezone

import joblib

from src.config import CFG, path
from src.data.split import load_split

INFO = path("models") / "model_info.json"


def file_hash(p) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:12]


def main() -> None:
    models, reports = path("models"), path("reports")
    policy = joblib.load(models / "policy.joblib")
    fairness = json.loads((reports / "fairness_candidates.json").read_text())
    calibration = json.loads((reports / "calibration.json").read_text())
    validation = json.loads((reports / "validation_metrics.json").read_text())
    split_sums = json.loads((path("processed") / "SPLIT_CHECKSUMS.json").read_text())
    previous = json.loads(INFO.read_text()) if INFO.exists() else {}
    info = {
        "notice": "Educational artefact, not for real lending decisions",
        "model_version": file_hash(models / "policy.joblib"),
        "policy_version": f"{policy.kind}-refer{CFG['policy']['refer_low']}-{CFG['policy']['refer_high']}",
        "policy_kind": policy.kind,
        "requires_age_band": policy.needs_sensitive,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "training_data_checksum": split_sums["train.parquet"],
        "features": CFG["primary"]["features"],
        "metrics": {
            "val_roc_auc": validation["roc_auc"], "val_pr_auc": validation["pr_auc"],
            "val_ece_uncalibrated": calibration["results"]["uncalibrated"]["ece"],
            "val_ece_calibrated_oof": calibration["results"][f"{calibration['selected']}_oof"]["ece"],
            "calibration_method": calibration["selected"],
            "deployed_policy_val": fairness["results"][fairness["selected"]],
        },
        "fairness_gates": previous.get("fairness_gates"),
    }
    INFO.write_text(json.dumps(info, indent=2))
    Xv, _, sv = load_split("val")
    Xv.join(sv[["AGE"]]).sample(1000, random_state=CFG["seed"]).to_parquet(models / "dice_reference.parquet")
    print(json.dumps({k: info[k] for k in ("model_version", "policy_version", "requires_age_band")}))


if __name__ == "__main__":
    main()
