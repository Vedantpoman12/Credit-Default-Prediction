# Data Card

> Educational artefact, not for real lending decisions.

| Field | Primary | Sandbox |
|---|---|---|
| Name | Default of Credit Card Clients (Taiwan) | Credit Card Approval Prediction |
| Source | UCI ML Repository (Yeh & Lien, 2009) | Kaggle, rikdifos |
| Licence | CC BY 4.0 | [TO FILL] |
| Rows | 30,000 | 36,457 matched clients |
| Label | default payment next month (22.1%) | ever 60+ days past due (1.69%) |
| Sensitive | AGE 21-79, SEX (binary) | CODE_GENDER, DAYS_BIRTH -> AGE |
| Use here | Model training and evaluation | Fairness method development (sex and age) |

**Splits (primary):** stratified 70/15/15, seed 42 -> 21,000 / 4,500 / 4,500. Sensitive attributes are in separate aligned files, with SHA-256 checksums.

**Age-band distribution (full data):** <25 2,685 (27.2% default); 25-34 13,011 (20.3%); 35-44 9,018 (21.9%); 45-54 4,233 (23.9%); 55-64 943 (26.8%); 65+ 110 (25.5%).

**Quality:** EDUCATION 0/5/6 = 345, MARRIAGE 0 = 54 (sentinels); utilisation > 1 = 2,115; negative BILL_AMT1 = 590; no invalid ages.

**Limitations:** one bank, one country, 2005; binary sex; very few 65+ applicants; PAY codes -2/-1/0 are undocumented in the original codebook.

**Traceability:** `src/data/`, `reports/data_quality_issues.csv`, `data/raw/CHECKSUMS.txt`, `data/processed/SPLIT_CHECKSUMS.json`.
