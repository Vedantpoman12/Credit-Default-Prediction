# Credit Default Prediction with Fairness Constraints

> **⚠ NOT FOR REAL LENDING. Educational artefact, not for real lending decisions.**

Class-weighted, monotone XGBoost tuned with Optuna, with a Fairlearn ExponentiatedGradient equal-opportunity constraint across age bands and an isotonic-calibrated probability. Includes SHAP and DiCE explanations, a Dockerised FastAPI service, PSI/Evidently drift monitoring, and CI with a performance gate and a fairness gate.

## Results
Current model (2c8471a0552e: 40 features, monotone constraints, Optuna 100 trials x 5-fold, ExponentiatedGradient eps 0.01, isotonic-calibrated ensemble score):

| Metric | Validation | Test (once, 2026-11-23) | Target |
|---|---|---|---|
| ROC-AUC | 0.783 [0.764, 0.800] | 0.780 [0.762, 0.798] | >= 0.75 |
| PR-AUC | 0.535 | 0.533 [0.504, 0.568] | - |
| ECE (served probability) | 0.0001 (in-sample) | 0.014 | <= 0.05 |
| TPR gap (age bands, n >= 30) | 0.045 | **0.153 (fails)** | <= 0.05 |
| Median /score latency (HTTP, 500 req) | 37-42 ms | - | <= 50 ms |

The fairness target is met on validation but not on the test set: under-25s are flagged most (test TPR 0.732 vs 0.579 for 55-64). Nothing was retuned on the test set. See `docs/MODEL_CARD.md` and `docs/decisions_log.md` #23-#26.

## Quick start
```bash
make setup          # venv + pinned requirements (macOS also needs: brew install libomp)
make data           # checksums + frozen 70/15/15 splits
make eda            # figures in reports/figures
make train          # baselines, XGBoost/Optuna, calibration, evaluation, fairness, gates
make explain        # SHAP plots + DiCE recourse
make test           # pytest
make serve          # API: http://localhost:8000/docs (legacy built-in GUI at /)
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
frontend/          Next.js web app (login, dashboard) - see frontend/README.md
docker/, .github/workflows/ci.yml
```
## Web app
The main UI is the Next.js app in [`frontend/`](frontend/README.md): sign-in, applicant scoring with SHAP factors and DiCE recourse, recent decisions with search, and the model & fairness dashboard, in light and dark themes.

```bash
make serve                        # terminal 1: FastAPI on :8000
cd frontend && npm install && npm run dev   # terminal 2: http://localhost:3000
```
`docker compose up --build` runs both. The FastAPI service still serves its original single-page GUI at `/` as a fallback.

See `PROJECT_SUMMARY.txt` for the full walkthrough.
