# 04 Testing Methodology

> Educational artefact, not for real lending decisions. Not deployed.

| Test | Method | Data |
|---|---|---|
| Discrimination | ROC-AUC, PR-AUC with 500-sample bootstrap 95% CIs | validation; test once |
| Calibration | ECE (15 bins), Brier; 5-fold out-of-fold ECE for method selection; reliability diagrams | validation; test once |
| Thresholds | Precision/recall/F1 at 0.2-0.6, F1-stable band (0.19-0.33), cost curve (FP=1, FN=5; optimum 0.14) | validation |
| Fairness | MetricFrame per age band: selection rate, TPR, FPR, precision, n; DP, equal-opportunity and equalised-odds gaps (groups n < 30 excluded with warning) | validation; test once |
| Leakage | Transformers fitted on train only (unit tests); AUC ~0.79 is consistent with the literature for this dataset (no leakage signal above 0.90) | - |
| Service | API contract tests, determinism, 500-request latency test | - |
| CI gates | AUC >= 0.75 and TPR gap <= 0.05 on frozen validation | validation |

**Test-set-once protocol:** `scripts/final_test_eval.py` writes `reports/final_test.lock` (timestamp, git commit, model version) and refuses to run again. It was run once on 2026-10-26: ROC-AUC 0.7808 [0.7623, 0.7984], PR-AUC 0.5342 [0.5041, 0.5658], ECE 0.0145, Brier 0.1350, TPR gap 0.0519.

**Traceability:** `src/models/evaluate.py`, `src/models/calibrate.py`, `src/fairness/metrics.py`, `scripts/final_test_eval.py`, `tests/`.
