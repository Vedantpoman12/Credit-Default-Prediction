# 08 Fundamental-Rights Impact Assessment

> Educational artefact, not for real lending decisions. Not deployed.

**Who is affected:** credit applicants, especially young applicants (<25) and older applicants (55+, small groups), and women and men equally (sex is excluded and not a constraint target).

**Historical bias:** labels come from a single bank's 2005 outcomes. Credit limits (LIMIT_BAL, the second-strongest feature) reflect that bank's earlier decisions and can carry its biases forward. Young applicants have a higher observed default rate (27.2%).

| Harm | Evidence | Mitigation | Residual risk |
|---|---|---|---|
| Unequal error burden by age | Unconstrained TPR gap 0.0852 (val), 0.2149 (test) | ExponentiatedGradient TPR parity (eps 0.01): 0.0454 (val), 0.1530 (test) | **Target missed on test**; <25 flagged most (TPR 0.732, FPR 0.294) |
| Disparate treatment through group thresholds | Earlier policies needed the age band at serving | Deployed EG policy needs no age at serving; age used only in training the constraint and for audit | Low |
| Small groups unprotected | 65+ n=16 (test) | Reported, warned | Not constrained |
| Opaque decisions | - | SHAP top-5 and DiCE recourse | SHAP explains the raw score, not the final threshold |
| Drift erodes fairness | Gap rises to 0.077-0.082 under injected drift | PSI monitoring, mandatory re-audit | Detection lag for label drift |

**Traceability:** `reports/tradeoff_table.csv`, `reports/final_results.json`, `reports/drift/inject_drift.json`, `docs/ethics_audit.md`.
