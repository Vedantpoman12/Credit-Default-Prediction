# Decisions Log

> Educational artefact, not for real lending decisions.

| # | Date | Decision | Reason | Alternatives considered |
|---|------|----------|--------|-------------------------|
| 1 | 2026-10-26 | Primary dataset = UCI "Default of Credit Card Clients" (Taiwan, 30,000 rows, 22.1% default). Fairness sandbox = Kaggle credit-card-approval (application + credit records, explicit sex and age). | These are the datasets available in the repo; they replace Give Me Some Credit and German Credit from the plan. | Download GMSC / German Credit. |
| 2 | 2026-10-26 | AGE and SEX are audit-only, never model features. Age bands (<25, 25-34, 35-44, 45-54, 55-64, 65+) are the protected attribute. | Age is both a feature and the protected attribute; using it would let the model discriminate directly. | Train once with age to compare. |
| 3 | 2026-10-26 | EDUCATION in {0,5,6} and MARRIAGE = 0 treated as sentinels (NaN + flag). Age outside 18-100 is invalid. | Undocumented codes in the UCI codebook (the equivalent of the 96/98 sentinels). | Keep as categories. |
| 4 | 2026-10-26 | Winsorise amounts at the 1st/99th train percentiles; median-impute with missing indicators; all fitted on train only. | Utilisation > 1 (2,115 rows) and negative bills (590) are mostly errors or edge cases. | Log transform. |
| 5 | 2026-10-26 | Order: Optuna tuning -> isotonic calibration on validation -> fairness mitigation. | Plan rule; ECE reported on the deployed policy. | - |
| 6 | 2026-10-26 | Calibration method chosen by 5-fold out-of-fold ECE on validation (isotonic 0.0116 vs Platt 0.0160). | In-sample ECE of isotonic (0.0003) is optimistic because it is fitted and scored on the same rows. | In-sample ECE. |
| 7 | 2026-10-26 | Groups with n < 30 (65+ band, n=17 in validation) are reported but excluded from gap metrics and the gate. | The plan asks to warn when n < 30; a TPR from three positives is not meaningful. | Merge 55-64 and 65+. |
| 8 | 2026-10-26 | Deployed policy = ThresholdOptimizer (TPR parity, balanced-accuracy objective) on raw XGBoost scores; API takes age_band for threshold lookup only. | ExponentiatedGradient did not reach TPR gap <= 0.05 on validation (best 0.100); ThresholdOptimizer reached 0.015. | Deploy ExponentiatedGradient (preferred by the plan because it needs no serving-time attribute). |
| 9 | 2026-10-26 | Randomised fairness policies are made deterministic with a per-applicant uniform draw from a hash of the input row. | Same input gives same decision (API determinism, CI reproducibility) while keeping the randomised policy's group rates. | Threshold pmf at 0.5 (broke parity: gap 0.147). |
| 10 | 2026-10-26 | Decision bands: flag + calibrated probability -> approve (<0.30, not flagged), decline (>=0.60, flagged), otherwise refer to a human. | Disagreement zone between score and fairness flag goes to human review. | Fixed thresholds on probability only. |
| 11 | 2026-10-26 | Drift scenario (a) uses LIMIT_BAL + PAY_AMT1-6 as income proxy (no income column); scenario (b) raises the base rate 22.1% -> 40% (same ~1.8x ratio as 6.7% -> 12%). | Dataset differences. | - |
| 12 | 2026-10-26 | Python 3.14 environment and python:3.14-slim Docker image instead of 3.10. | Only Python 3.14 available locally; pinned packages require >= 3.11. | - |
| 13 | 2026-10-26 | Test set evaluated once. Result TPR gap 0.0519 (> 0.05). Not retuned. | Test-set-once protocol. | - |
