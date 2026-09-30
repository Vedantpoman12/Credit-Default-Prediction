import pandas as pd
import os

# Project root and data directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SPLITS_DIR = os.path.join(DATA_DIR, 'splits')


def resolve_filepath(filename, fallback_filename=None):
    """
    Search for a file in DATA_DIR, BASE_DIR, or parent directory.
    """
    candidates = [
        os.path.join(DATA_DIR, filename),
        os.path.join(BASE_DIR, filename),
        os.path.join(os.path.dirname(BASE_DIR), filename)
    ]
    if fallback_filename:
        candidates.extend([
            os.path.join(DATA_DIR, fallback_filename),
            os.path.join(BASE_DIR, fallback_filename),
            os.path.join(os.path.dirname(BASE_DIR), fallback_filename)
        ])
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def load_taiwan_dataset(filename="default_of_credit_card_clients.csv"):
    """
    Load the Default of Credit Card Clients (Taiwan) dataset.
    Detects whether the file has UCI metadata on row 0 or direct headers.
    """
    filepath = resolve_filepath(filename, "default of credit card clients.csv")
    if not filepath:
        print(f"Warning: {filename} not found.")
        return None
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        first_line = f.readline().strip()
    
    # If the first line is UCI metadata (e.g., ',X1,X2...'), header is on row 1
    header_row = 1 if ('X1' in first_line and 'LIMIT_BAL' not in first_line) else 0
    df = pd.read_csv(filepath, header=header_row)
    print(f"Loaded Taiwan dataset with shape: {df.shape}")
    return df


def load_lending_club_dataset(accepted_file="accepted_2007_to_2018Q4.csv", rejected_file="rejected_2007_to_2018Q4.csv"):
    """
    Load the Lending Club dataset (Accepted and Rejected loans).
    """
    accepted_path = resolve_filepath(accepted_file)
    rejected_path = resolve_filepath(rejected_file)
    
    accepted_df = pd.read_csv(accepted_path, low_memory=False) if accepted_path else None
    rejected_df = pd.read_csv(rejected_path, low_memory=False) if rejected_path else None
    
    if accepted_df is not None:
        print(f"Loaded Lending Club (Accepted) dataset with shape: {accepted_df.shape}")
    else:
        print(f"Warning: {accepted_file} not found.")
        
    return accepted_df, rejected_df


def load_credit_record_dataset(app_file="application_record.csv", credit_file="credit_record.csv"):
    """
    Load the Credit Card Approval Prediction dataset.
    """
    app_path = resolve_filepath(app_file)
    credit_path = resolve_filepath(credit_file)
    
    app_df = pd.read_csv(app_path) if app_path else None
    credit_df = pd.read_csv(credit_path) if credit_path else None
    
    if app_df is not None and credit_df is not None:
        print(f"Loaded Application Record with shape: {app_df.shape}")
        print(f"Loaded Credit Record with shape: {credit_df.shape}")
    else:
        print("Warning: Application or Credit record file not found.")
        
    return app_df, credit_df


def load_primary_dataset(filename="merged_credit_data.csv"):
    """
    Load the preprocessed primary merged credit dataset.
    """
    filepath = resolve_filepath(filename)
    if not filepath:
        print(f"Warning: {filename} not found.")
        return None
    df = pd.read_csv(filepath)
    print(f"Loaded Primary merged dataset with shape: {df.shape}")
    return df


def load_splits(dataset="primary", format="xy"):
    """
    Load stratified train, validation, and frozen test splits.
    
    Args:
        dataset: "primary" or "taiwan"
        format: "xy" to return (X_train, y_train, X_val, y_val, X_test, y_test)
                "df" to return (train_df, val_df, test_df)
    """
    split_dir = os.path.join(SPLITS_DIR, dataset.lower())
    if not os.path.exists(split_dir):
        raise FileNotFoundError(f"Split directory {split_dir} does not exist. Run split_data.py first.")
    
    if format == "xy":
        X_train = pd.read_csv(os.path.join(split_dir, "X_train.csv"))
        y_train = pd.read_csv(os.path.join(split_dir, "y_train.csv")).squeeze()
        X_val = pd.read_csv(os.path.join(split_dir, "X_val.csv"))
        y_val = pd.read_csv(os.path.join(split_dir, "y_val.csv")).squeeze()
        X_test = pd.read_csv(os.path.join(split_dir, "X_test_frozen.csv"))
        y_test = pd.read_csv(os.path.join(split_dir, "y_test_frozen.csv")).squeeze()
        return X_train, y_train, X_val, y_val, X_test, y_test
    elif format == "df":
        train_df = pd.read_csv(os.path.join(split_dir, "train.csv"))
        val_df = pd.read_csv(os.path.join(split_dir, "val.csv"))
        test_df = pd.read_csv(os.path.join(split_dir, "test_frozen.csv"))
        return train_df, val_df, test_df
    else:
        raise ValueError("format must be either 'xy' or 'df'")


if __name__ == "__main__":
    print("Testing data_loader functions...")
    taiwan_df = load_taiwan_dataset()
    primary_df = load_primary_dataset()
    
    print("\nTesting split loader (Primary xy)...")
    X_train, y_train, X_val, y_val, X_test, y_test = load_splits("primary", format="xy")
    print(f"Primary X_train: {X_train.shape}, y_train: {y_train.shape}, default rate: {y_train.mean():.4f}")
    print(f"Primary X_val:   {X_val.shape}, y_val: {y_val.shape}, default rate: {y_val.mean():.4f}")
    print(f"Primary X_test:  {X_test.shape}, y_test: {y_test.shape}, default rate: {y_test.mean():.4f}")
