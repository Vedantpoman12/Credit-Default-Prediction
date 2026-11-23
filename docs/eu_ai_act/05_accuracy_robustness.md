# 05 Accuracy and Robustness

> Educational artefact, not for real lending decisions. Not deployed.

| Metric | Validation | Test (once) | Target |
|---|---|---|---|
| ROC-AUC | 0.7833 (base model 0.7826 [0.7639, 0.7996]) | 0.7803 [0.7621, 0.7977] | >= 0.75 |
| PR-AUC | 0.5351 | 0.5326 [0.5035, 0.5675] | - |
| ECE (served probability) | 0.0001 (in-sample) | 0.0140 | <= 0.05 |
| TPR gap (deployed EG eps 0.01) | 0.0454 | **0.1530** | <= 0.05 |
| Median latency (HTTP, 500 req) | 37-42 ms (p99 < 50 ms) | - | <= 50 ms |

Model 2c8471a0552e; test evaluated once on 2026-11-23 (decision #24). The fairness target is met on validation but **not** on test.

**Drift stress tests** (`reports/drift/inject_drift.json`)
| Scenario | Max feature PSI | Score PSI | Label PSI | AUC | TPR gap | Decline rate | Flagged |
|---|---|---|---|---|---|---|---|
| Baseline | 0.000 | 0.000 | 0.000 | 0.783 | 0.045 | 8.0% | no |
| (a) Income proxy -50% (LIMIT_BAL, PAY_AMT) | 1.213 | 0.432 | 0.000 | 0.766 | 0.077 | 9.8% | yes (act) |
| (b) Base rate 22.1% -> 40% | 0.028 | 0.034 | 0.153 | 0.781 | 0.082 | 12.5% | yes (label PSI, investigate) |

In both scenarios AUC stays above 0.75, but the fairness gap breaks the 0.05 limit, so drift has to trigger a fairness re-audit and not only a performance check. Scenario (b) is invisible to input PSI and is detected only once outcomes are labelled.

**Traceability:** `src/monitoring/inject_drift.py`, `src/monitoring/psi.py`, `tests/test_psi.py`, `scripts/latency_test.py`.
