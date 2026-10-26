# 03 Data Governance

> Educational artefact, not for real lending decisions. Not deployed.

| Item | Primary (Taiwan, UCI) | Sandbox (Credit Card Approval, Kaggle) |
|---|---|---|
| Size | 30,000 rows, 22.1% default | 36,457 matched clients, 1.69% default |
| Licence | CC BY 4.0 | [TO FILL] |
| Sensitive attributes | AGE (21-79), SEX | CODE_GENDER, DAYS_BIRTH |
| Integrity | SHA-256 in `data/raw/CHECKSUMS.txt` | same |

**Quality issues found** (`reports/data_quality_issues.csv`)
| Issue | Evidence | Remediation |
|---|---|---|
| Undocumented codes | EDUCATION 0/5/6: 345; MARRIAGE 0: 54 | NaN + flag, median imputation fitted on train |
| Balance over limit / negative bills | utilisation > 1: 2,115; BILL_AMT1 < 0: 590 | 1st/99th percentile winsorisation fitted on train |
| Small protected group | 65+: 110 rows (0.37%) | n < 30 warning; excluded from gap metrics |

**Bias examination:** default rate by age band ranges from 20.3% (25-34) to 27.2% (<25). Proxy analysis found no Taiwan feature with |association| > 0.4.
**Minimisation:** AGE and SEX are excluded from model features; no IDs are used.
**Splits:** stratified 70/15/15 (seed 42): 21,000 / 4,500 / 4,500, stored as parquet with SHA-256 checksums in `SPLIT_CHECKSUMS.json`. Loading fails if a checksum changes, and the test split can only be read by the final evaluation script.

**Traceability:** `src/data/download.py`, `src/data/split.py`, `src/data/eda.py`, `src/fairness/proxy_analysis.py`, `tests/test_features.py`.
