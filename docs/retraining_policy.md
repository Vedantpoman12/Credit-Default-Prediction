# Retraining and Monitoring Policy

> Educational artefact, not for real lending decisions.

**Triggers**
| Signal | ok | investigate | act |
|---|---|---|---|
| Feature PSI (per feature, vs training reference) | < 0.10 | 0.10-0.25 | > 0.25 |
| Score PSI (default_probability) | < 0.10 | 0.10-0.25 | > 0.25 |
| Label PSI (observed default rate, once outcomes mature) | < 0.10 | 0.10-0.25 | > 0.25 |
| TPR gap on newly labelled data | <= 0.05 | - | > 0.05 |

Monitoring is run by `make drift`. Its outputs are `reports/drift/evidently_drift_report.html`, `psi_live_vs_train.csv` and `inject_drift.json`.

**Roles:** ML engineer (runs monitoring weekly, opens the incident); Model risk owner (approves retraining and promotion); Fairness reviewer (re-audit sign-off).

**Blocking rule:** every retrained model is promoted to the registry only if it passes **all three**:
1. Performance gate: ROC-AUC >= 0.75 on the frozen validation split (`scripts/evaluate_gates.py --gate performance`).
2. Fairness gate: equal-opportunity TPR gap <= 0.05 (`--gate fairness`).
3. A fresh fairness re-audit: rerun `src.fairness.proxy_analysis`, `src.fairness.tradeoff`, and update `docs/ethics_audit.md`, with sign-off from the fairness reviewer.

**Rollback:** redeploy the previous image tag (`docker run <user>/credit-default-fair:<previous-sha>`), restore `models/` from the previous git tag, confirm `/model-info` shows the old `model_version`, and record the incident in `docs/decisions_log.md`.
