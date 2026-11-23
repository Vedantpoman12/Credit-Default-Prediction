# Explainability Audit

> Educational artefact, not for real lending decisions.

Global SHAP (`reports/figures/shap_bar.png`, `shap_beeswarm.png`) on 2,000 validation rows, model 2c8471a0552e (40 features + 4 flags).

| Rank | Feature | Mean abs SHAP | Direction | Credit-domain intuition | Surprise? |
|---|---|---|---|---|---|
| 1 | PAY_0 (latest repayment status) | 0.28 | Months of delay sharply raise risk | Recent delinquency is the strongest predictor | No |
| 2 | MAX_DELAY (worst delay in 6 months) | 0.25 | Higher raises risk (monotone) | Severity of past delinquency | No |
| 3 | MONTHS_LATE (months with any delay) | 0.22 | Higher raises risk (monotone) | Persistence of delinquency | No |
| 4 | BILL_AMT1 (latest bill) | 0.10 | Mixed | Ambiguous without the limit; utilisation features carry the clearer signal | Mild |
| 5 | MEAN_STATUS | 0.09 | Higher raises risk | Average repayment status | No |
| 9 | LIMIT_BAL (credit limit) | 0.06 | Higher limit lowers risk | Carries the bank's own past judgement (feedback loop) | Noted |

Three of the top five are engineered delinquency summaries. Local waterfalls: `shap_waterfall_approve.png`, `shap_waterfall_refer.png`, `shap_waterfall_decline.png`; dependence plots for PAY_0, MAX_DELAY, MONTHS_LATE, BILL_AMT1.

**DiCE recourse** (`src/explain/recourse_dice.py`) wraps the full decision policy; AGE is immutable; PAY_0, BILL_AMT1 and PAY_AMT1-3 are actionable within permitted ranges. For the earlier 21-feature model, 3 of 3 counterfactuals flipped a declined applicant to *approve*. For the current model, a declined applicant (p = 0.739, PAY_0 = 2, PAY_2 = 2) got three counterfactuals (PAY_0 to 0 or -1, monthly payments of roughly 4,000-13,000) that move the decision only to *refer*, so the API answers "No verified counterfactual". Partial recourse is not yet reported to the applicant.

**How SHAP relates to the final decision.** SHAP explains the log-odds of the base XGBoost pipeline (`models/xgb_pipeline.joblib`). The deployed decision comes from the ExponentiatedGradient ensemble (4 weighted XGBoost models trained under the fairness constraint), and the returned probability is an isotonic recalibration of that ensemble's score. Features that push the base model's risk up generally push the ensemble up too, but the SHAP values do not add up to the returned probability. Suggested wording: *"These factors explain the model's risk score. The final decision also applies a fairness-constrained model ensemble and a calibrated probability scale."*
