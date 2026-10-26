# Ethics Audit

> Educational artefact, not for real lending decisions.

**Sensitive-attribute policy.** AGE and SEX are stored in a separate, index-aligned file (`data/processed/*_sensitive.parquet`) and are never in the model's feature matrix (`tests/test_features.py::test_age_and_sex_not_model_features`). Age bands are used only for fairness metrics, the ThresholdOptimizer threshold lookup, and DiCE immutability.

**Proxy findings** (`reports/proxy_table.csv`, flag |association| > 0.4)
- Taiwan: no feature exceeds 0.4. The strongest are MARRIAGE vs age (Cramér's V 0.297) and LIMIT_BAL vs age (Spearman 0.194). All kept, and MARRIAGE is noted as a weak proxy.
- Sandbox: OCCUPATION_TYPE vs sex (V 0.501) and NAME_INCOME_TYPE vs age (V 0.467; pensioners) are flagged. In a production model they should be reviewed or removed.

**Data minimisation.** Only the 21 repayment and credit-limit features plus education and marital status are used. No ID is used, and the age band is collected only because the deployed fairness policy needs it.

**Historical bias.** The labels reflect a 2005 bank's past lending and collection practices. Young borrowers (<25) default more often (27.2% vs 20.3% for 25-34), so an unconstrained model catches more of their defaults (validation TPR 0.70 vs 0.59). That is higher scrutiny of young applicants.

**Why equal opportunity.** Demographic parity would force equal decline rates even though base rates differ by age band, and that would distort risk. Equal opportunity asks that true defaulters are identified at the same rate in every band, so no age group carries extra error burden at a fixed level of real risk. Equalised odds is reported as well, but it was not enforced because enforcing both rates costs more accuracy.
