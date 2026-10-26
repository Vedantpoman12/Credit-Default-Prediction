import json

import joblib
import pandas as pd
from evidently import DataDefinition, Dataset, Report
from evidently.presets import DataDriftPreset

from src.config import CFG, path
from src.data.split import load_split
from src.monitoring.psi import psi_table

FEATURES = CFG["primary"]["features"]


def main() -> None:
    X, _, _ = load_split("train")
    policy = joblib.load(path("models") / "policy.joblib")
    reference = X.assign(default_probability=policy.predict_proba(X).round(4))
    logs = pd.read_json(path("logs"), lines=True)
    current = logs[FEATURES + ["default_probability"]]
    definition = DataDefinition(numerical_columns=FEATURES + ["default_probability"])
    report = Report([DataDriftPreset()])
    result = report.run(Dataset.from_pandas(current, data_definition=definition), Dataset.from_pandas(reference, data_definition=definition))
    out = path("reports") / "drift"
    out.mkdir(parents=True, exist_ok=True)
    result.save_html(str(out / "evidently_drift_report.html"))
    table = psi_table(reference, current)
    table.to_csv(out / "psi_live_vs_train.csv", index=False)
    print(f"{len(logs)} logged decisions; decision mix: {json.dumps(logs['decision'].value_counts().to_dict())}")
    print(table.head(8).to_string(index=False))


if __name__ == "__main__":
    main()
