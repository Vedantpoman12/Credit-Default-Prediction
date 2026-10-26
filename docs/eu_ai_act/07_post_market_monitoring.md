# 07 Post-Market Monitoring

> Educational artefact, not for real lending decisions. Not deployed.

| Check | Frequency | Threshold | Action |
|---|---|---|---|
| Feature and score PSI vs training reference (10 quantile bins) | weekly | 0.10 investigate, 0.25 act | Incident; investigate the data pipeline |
| Evidently data and prediction drift report from `logs/decisions.jsonl` | weekly | dataset drift detected | Review |
| Label PSI and default rate once outcomes mature | monthly | 0.10 / 0.25 | Recalibrate or retrain |
| TPR gap on labelled outcomes | monthly | > 0.05 | Fairness re-audit, retrain |
| Decline / refer rate trend | weekly | +/- 5 points | Investigate |

Current live log (509 requests): every feature PSI < 0.05 (ok).

**Retraining:** a candidate is promoted only after the performance gate AND the fairness gate AND a fresh fairness re-audit (see `docs/retraining_policy.md`). CI enforces both gates on every push.

**Traceability:** `src/monitoring/drift_report.py`, `reports/drift/`, `.github/workflows/ci.yml`, `scripts/evaluate_gates.py`.
