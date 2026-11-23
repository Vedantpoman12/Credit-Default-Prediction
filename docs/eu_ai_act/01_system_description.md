# 01 System Description

> Educational artefact, not for real lending decisions. Not deployed.

| Item | Value |
|---|---|
| Name | Credit Default Prediction with Fairness Constraints (BTECH CAP 501) |
| Purpose | Estimate the probability that a credit-card client defaults next month and recommend approve / refer / decline |
| Inputs | 21 features: credit limit, education, marital status, 6 months of repayment status, bill and payment amounts; optional age band (logged and used by DiCE only; the deployed policy does not need it) |
| Outputs | Calibrated default probability, risk band, decision, human-review flag, top-5 SHAP contributions, model and policy version |
| Model | Class-weighted, monotone XGBoost (Optuna, 100 trials x 5-fold) -> Fairlearn ExponentiatedGradient (eps 0.01, true-positive-rate parity across age bands) -> isotonic recalibration of the ensemble score |
| Interface | FastAPI: POST /score, POST /recourse, GET /model-info, GET /health; Docker image |
| Users | Course assessors; hypothetically, credit officers who review every "refer" |

**Traceability:** `src/api/main.py`, `src/fairness/policy.py`, `models/model_info.json`.
