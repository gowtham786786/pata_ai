import pandas as pd
import os
import time

# Global variable to hold the pincode data in memory
PINCODE_DB = None

def load_pincode_data():
    """
    Loads the All India Pincode Directory CSV into memory.
    This runs once at FastAPI startup to ensure sub-500ms processing.
    """
    global PINCODE_DB
    
    # Path robust against execution CWD
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, '../data/pincode_data.csv')
    
    try:
        start_time = time.time()
        print(f"Loading pincode dataset from {dataset_path}...")
        
        if not os.path.exists(dataset_path):
            print("WARNING: Pincode dataset not found. Using an empty dataset for now.")
            # Create an empty dataframe with expected columns for safety
            PINCODE_DB = pd.DataFrame(columns=['pincode', 'district', 'state', 'latitude', 'longitude'])
            return

        # Load CSV into Pandas DataFrame, forcing pincode to string
        PINCODE_DB = pd.read_csv(dataset_path, dtype={'pincode': str})
        
        # Clean the pincode column of hidden whitespace or characters
        if 'pincode' in PINCODE_DB.columns:
            PINCODE_DB['pincode'] = PINCODE_DB['pincode'].str.strip()
            # Optimize by setting index to pincode for O(1) lookups
            PINCODE_DB.set_index('pincode', inplace=True)
            
        duration = time.time() - start_time
        print(f"Successfully loaded {len(PINCODE_DB)} pincode records in {duration:.2f} seconds.")
        
    except Exception as e:
        print(f"Error loading pincode data: {e}")
        PINCODE_DB = pd.DataFrame()

def get_pincode_info(pincode: str) -> dict:
    """Helper function to fetch pincode info quickly"""
    global PINCODE_DB
    
    if PINCODE_DB is None or PINCODE_DB.empty:
        return None
        
    try:
        # If there are multiple entries for the same pincode, return the first one
        if pincode in PINCODE_DB.index:
            data = PINCODE_DB.loc[pincode]
            if isinstance(data, pd.DataFrame):
                return data.iloc[0].to_dict()
            return data.to_dict()
    except KeyError:
        pass
        
    return None
