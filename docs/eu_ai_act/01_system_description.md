# 01 System Description

> Educational artefact, not for real lending decisions. Not deployed.

| Item | Value |
|---|---|
| Name | Credit Default Prediction with Fairness Constraints (BTECH CAP 501) |
| Purpose | Estimate the probability that a credit-card client defaults next month and recommend approve / refer / decline |
| Inputs | 21 features: credit limit, education, marital status, 6 months of repayment status, bill and payment amounts; optional age band (fairness threshold lookup only) |
| Outputs | Calibrated default probability, risk band, decision, human-review flag, top-5 SHAP contributions, model and policy version |
| Model | Class-weighted XGBoost (Optuna, 25 trials) -> isotonic calibration -> Fairlearn ThresholdOptimizer (true-positive-rate parity across age bands) |
| Interface | FastAPI: POST /score, POST /recourse, GET /model-info, GET /health; Docker image |
| Users | Course assessors; hypothetically, credit officers who review every "refer" |

**Traceability:** `src/api/main.py`, `src/fairness/policy.py`, `models/model_info.json`.
