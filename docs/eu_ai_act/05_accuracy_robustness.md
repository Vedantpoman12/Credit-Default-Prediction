# 05 Accuracy and Robustness

> Educational artefact, not for real lending decisions. Not deployed.

| Metric | Validation | Test (once) | Target |
|---|---|---|---|
| ROC-AUC | 0.7858 [0.7687, 0.8014] | 0.7808 [0.7623, 0.7984] | >= 0.75 |
| PR-AUC | 0.5417 [0.5086, 0.5751] | 0.5342 [0.5041, 0.5658] | - |
| ECE | 0.0116 (out-of-fold) | 0.0145 | <= 0.05 |
| TPR gap (deployed) | 0.0153 | 0.0519 | <= 0.05 |
| Median latency (in-process, 500 req) | 10.25 ms (p95 10.73, p99 11.38) | - | <= 50 ms |

**Drift stress tests** (`reports/drift/inject_drift.json`)
| Scenario | Max feature PSI | Score PSI | Label PSI | AUC | TPR gap | Decline rate | Flagged |
|---|---|---|---|---|---|---|---|
| Baseline | 0.000 | 0.000 | 0.000 | 0.786 | 0.015 | 10.0% | no |
| (a) Income proxy -50% (LIMIT_BAL, PAY_AMT) | 1.213 | 0.371 | 0.000 | 0.767 | 0.138 | 10.8% | yes (act) |
| (b) Base rate 22.1% -> 40% | 0.028 | 0.035 | 0.153 | 0.782 | 0.085 | 15.1% | yes (label PSI, investigate) |

In both scenarios AUC stays above 0.75, but the fairness gap breaks the 0.05 limit, so drift has to trigger a fairness re-audit and not only a performance check. Scenario (b) is invisible to input PSI and is detected only once outcomes are labelled.

**Traceability:** `src/monitoring/inject_drift.py`, `src/monitoring/psi.py`, `tests/test_psi.py`, `scripts/latency_test.py`.
