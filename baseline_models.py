import argparse
from pathlib import Path

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


PROJECT_DIR = Path(__file__).resolve().parent
SPLITS_DIR = PROJECT_DIR / "data" / "splits"
EXPERIMENT_NAME = "Credit_Default_Baseline_Models"


def load_training_validation_data(dataset):
    split_dir = SPLITS_DIR / dataset
    X_train = pd.read_csv(split_dir / "X_train.csv")
    y_train = pd.read_csv(split_dir / "y_train.csv").squeeze("columns")
    X_val = pd.read_csv(split_dir / "X_val.csv")
    y_val = pd.read_csv(split_dir / "y_val.csv").squeeze("columns")

    if not X_train.columns.equals(X_val.columns):
        raise ValueError("Training and validation feature columns do not match.")
    if not set(pd.unique(y_train)).issubset({0, 1}) or not set(
        pd.unique(y_val)
    ).issubset({0, 1}):
        raise ValueError("The target columns must contain only binary labels 0 and 1.")

    return X_train, y_train, X_val, y_val


def build_preprocessor(X_train):
    numeric_features = X_train.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [
        column for column in X_train.columns if column not in numeric_features
    ]

    transformers = []
    if numeric_features:
        transformers.append(("numeric", StandardScaler(), numeric_features))
    if categorical_features:
        transformers.append(
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features,
            )
        )

    return ColumnTransformer(transformers=transformers)


def log_validation_metrics(model, X_val, y_val):
    y_val_pred = model.predict(X_val)
    positive_class_index = np.flatnonzero(model.classes_ == 1)
    if len(positive_class_index) != 1:
        raise ValueError("The fitted model does not expose class 1 probabilities.")
    y_val_proba = model.predict_proba(X_val)[:, positive_class_index[0]]

    metrics = {
        "val_roc_auc": roc_auc_score(y_val, y_val_proba),
        "val_f1_score": f1_score(y_val, y_val_pred, zero_division=0),
    }
    mlflow.log_metrics(metrics)
    print(f"Validation ROC-AUC: {metrics['val_roc_auc']:.4f}")
    print(f"Validation F1-Score: {metrics['val_f1_score']:.4f}")
    print(
        classification_report(
            y_val, y_val_pred, labels=[0, 1], zero_division=0
        )
    )


def run_baselines(dataset):
    X_train, y_train, X_val, y_val = load_training_validation_data(dataset)
    preprocessor = build_preprocessor(X_train)

    mlflow.set_experiment(EXPERIMENT_NAME)
    mlflow.sklearn.autolog(log_models=True)

    baselines = (
        (
            "Majority_Class_Baseline",
            Pipeline(
                [
                    ("preprocessor", preprocessor),
                    ("classifier", DummyClassifier(strategy="most_frequent")),
                ]
            ),
            {"model_type": "DummyClassifier", "strategy": "most_frequent"},
        ),
        (
            "Logistic_Regression_Baseline",
            Pipeline(
                [
                    ("preprocessor", preprocessor),
                    (
                        "classifier",
                        LogisticRegression(max_iter=1000, class_weight="balanced"),
                    ),
                ]
            ),
            {
                "model_type": "LogisticRegression",
                "max_iter": 1000,
                "class_weight": "balanced",
            },
        ),
    )

    for run_name, model, parameters in baselines:
        with mlflow.start_run(run_name=run_name):
            mlflow.log_param("dataset", dataset)
            mlflow.log_params(parameters)
            model.fit(X_train, y_train)
            log_validation_metrics(model, X_val, y_val)


def main():
    parser = argparse.ArgumentParser(
        description="Train and track validation baselines using frozen data splits."
    )
    parser.add_argument(
        "--dataset",
        choices=("primary", "taiwan"),
        default="primary",
        help="Which prepared dataset split to use (default: primary).",
    )
    args = parser.parse_args()
    run_baselines(args.dataset)


if __name__ == "__main__":
    main()
