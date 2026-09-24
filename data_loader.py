import pandas as pd
import os

# Get the path to the parent directory where the CSV files are located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_taiwan_dataset(filename="default_of_credit_card_clients.csv"):
    """
    Load the Default of Credit Card Clients (Taiwan) dataset.
    The dataset usually contains an extra header row, so we skip it using header=1.
    """
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found.")
        return None
    
    # header=1 skips the first row which is usually the extra header
    df = pd.read_csv(filepath, header=1)
    print(f"Loaded Taiwan dataset with shape: {df.shape}")
    return df

def load_lending_club_dataset(accepted_file="accepted_2007_to_2018Q4.csv", rejected_file="rejected_2007_to_2018Q4.csv"):
    """
    Load the Lending Club dataset (Accepted and Rejected loans).
    """
    accepted_path = os.path.join(BASE_DIR, accepted_file)
    rejected_path = os.path.join(BASE_DIR, rejected_file)
    
    accepted_df = pd.read_csv(accepted_path, low_memory=False) if os.path.exists(accepted_path) else None
    rejected_df = pd.read_csv(rejected_path, low_memory=False) if os.path.exists(rejected_path) else None
    
    if accepted_df is not None:
        print(f"Loaded Lending Club (Accepted) dataset with shape: {accepted_df.shape}")
    else:
        print(f"Warning: {accepted_path} not found.")
        
    return accepted_df, rejected_df

def load_credit_record_dataset(app_file="application_record.csv", credit_file="credit_record.csv"):
    """
    Load the Credit Card Approval Prediction dataset.
    """
    app_path = os.path.join(BASE_DIR, app_file)
    credit_path = os.path.join(BASE_DIR, credit_file)
    
    app_df = pd.read_csv(app_path) if os.path.exists(app_path) else None
    credit_df = pd.read_csv(credit_path) if os.path.exists(credit_path) else None
    
    if app_df is not None and credit_df is not None:
        print(f"Loaded Application Record with shape: {app_df.shape}")
        print(f"Loaded Credit Record with shape: {credit_df.shape}")
    else:
        print(f"Warning: Application or Credit record file not found.")
        
    return app_df, credit_df

if __name__ == "__main__":
    # Example usage:
    print("Loading Taiwan Dataset...")
    taiwan_df = load_taiwan_dataset()
    
    print("\nLoading Lending Club Dataset...")
    accepted_df, rejected_df = load_lending_club_dataset()
    
    print("\nLoading Credit Card Approval Dataset...")
    app_df, credit_df = load_credit_record_dataset()

