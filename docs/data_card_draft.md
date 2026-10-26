# Data Card (draft)

> Educational artefact, not for real lending decisions.

**Primary: Default of Credit Card Clients (Taiwan).** UCI Machine Learning Repository (Yeh & Lien, 2009). Licence CC BY 4.0. 30,000 clients of a Taiwanese bank, April-September 2005, 23 features, label "default payment next month" (22.1% positive).

**Sandbox: Credit Card Approval Prediction.** Kaggle (rikdifos). Licence: [TO FILL] (check the Kaggle dataset page). 438,557 application rows + 1,048,575 monthly credit-status rows; 36,457 matched clients; label = ever 60+ days past due (1.69% positive).

**Limitations**
- Age: Taiwan ages 21-79; the 65+ band has 110 people (0.37%), too small for reliable group metrics. No applicants under 21.
- Geography/time: one Taiwanese bank in 2005 (primary); unknown country for the sandbox. Not representative of microfinance borrowers elsewhere or today.
- Undocumented codes (EDUCATION 0/5/6, MARRIAGE 0) and negative bills.
- Sex is recorded as binary only.
