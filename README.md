# Credit Default Prediction with Fairness Constraints

> **⚠ NOT FOR REAL LENDING. Educational artefact (BTECH CAP 501), not for real lending decisions.**

Class-weighted XGBoost, tuned with Optuna and isotonic-calibrated, with a Fairlearn equal-opportunity constraint across age bands. Includes SHAP and DiCE explanations, a Dockerised FastAPI service, PSI/Evidently drift monitoring, and CI with a performance gate and a fairness gate.

## Results
| Metric | Validation | Test (evaluated once) | Target |
|---|---|---|---|
| ROC-AUC | 0.786 [0.769, 0.801] | 0.781 [0.762, 0.798] | >= 0.75 |
| ECE | 0.012 | 0.014 | <= 0.05 |
| TPR gap (age bands) | 0.015 | 0.052 | <= 0.05 |
| Median latency | 10.3 ms | - | <= 50 ms |

## Quick start
```bash
make setup          # venv + pinned requirements (macOS also needs: brew install libomp)
make data           # checksums + frozen 70/15/15 splits
make eda            # figures in reports/figures
make train          # baselines, XGBoost/Optuna, calibration, evaluation, fairness, gates
make explain        # SHAP plots + DiCE recourse
make test           # pytest
make serve          # GUI: http://localhost:8000   API docs: http://localhost:8000/docs
make latency drift  # latency test, drift report + drift injection
make final          # one-time test-set evaluation (refuses to run twice)
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

## Layout
```
config/            config.yaml, gates.yaml
data/raw           raw datasets + CHECKSUMS.txt
data/processed     frozen splits, *_sensitive.parquet, SPLIT_CHECKSUMS.json
src/data           download, load, split, eda
src/features       sklearn transformers (sentinels, age fixer, winsorizer, imputer)
src/models         baselines, xgb+optuna, calibration, evaluation, model_info
src/fairness       metrics, proxy analysis, sandbox, primary mitigation, trade-off, policy object
src/explain        SHAP, DiCE recourse
src/api            FastAPI app, schemas, decision policy, static/index.html (GUI)
src/monitoring     PSI, Evidently report, drift injection
scripts/           error export, latency test, CI gates, final test evaluation
docs/              decisions log, audits, policies, EU AI Act package, model/data cards, presentation
docker/, .github/workflows/ci.yml
```
## GUI
Run `make serve` (or the Docker image) and open **http://localhost:8000**:
- **Score applicant**: form with example presets; shows the decision, calibrated default probability, risk meter, human-review flag and top-5 SHAP factors; *How could they be approved?* runs DiCE recourse.
- **Recent decisions**: the last 50 logged decisions from `logs/decisions.jsonl`.
- **Model & fairness**: validation metrics, CI gate results and TPR by age band.

See `PROJECT_SUMMARY.txt` for the full walkthrough.
lovable
