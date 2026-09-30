# Credit Default Prediction

This repository contains code for a credit default prediction project, with a focus on fairness constraints.

## Setup

To set up the project locally:

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment
4. Install dependencies: `pip install -r requirements.txt`

## Development Phase 1

- Initialized Python virtual environment.
- Added core dependencies for data manipulation, machine learning, and fairness constraints (`pandas`, `scikit-learn`, `fairlearn`, `aif360`).
- Configured `.gitignore` for Python projects.

## Development Phase 2: Stratified 70/15/15 Data Splitting

Creates split_data.py to partition datasets into 70% Train, 15% Validation, and 15% Test sets.
Applies stratified sampling (stratify=y) using random_state=42 to strictly preserve class ratios across severe imbalanced splits.
Freezes test sets (test_frozen.csv) to prevent data leakage until final model evaluation.
Adds split loader utility functions in data_loader.py.
Generates outputs in data/splits/primary/ and data/splits/taiwan/ alongside top-level convenience files in data/.

