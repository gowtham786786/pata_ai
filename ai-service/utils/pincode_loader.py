import pandas as pd
import os
import time

# Global variable to hold the pincode data in memory
PINCODE_DB = None
PLACE_DB = None

def load_pincode_data():
    """
    Loads the All India Pincode Directory CSV into memory.
    This runs once at FastAPI startup to ensure sub-500ms processing.
    """
    global PINCODE_DB
    global PLACE_DB
    
    # Path robust against execution CWD
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, '../../datasets/pincode_data.csv')
    
    try:
        start_time = time.time()
        print(f"Loading pincode dataset from {dataset_path}...")
        
        if not os.path.exists(dataset_path):
            print("WARNING: Pincode dataset not found. Using an empty dataset for now.")
            # Create an empty dataframe with expected columns for safety
            PINCODE_DB = pd.DataFrame(columns=['pincode', 'place_name', 'state', 'district', 'latitude', 'longitude'])
            PLACE_DB = pd.DataFrame()
            return

        # Load CSV into Pandas DataFrame, forcing pincode to string
        df = pd.read_csv(dataset_path, dtype={'pincode': str})
        
        # Clean the pincode column of hidden whitespace or characters
        if 'pincode' in df.columns:
            df['pincode'] = df['pincode'].str.strip()
            
        # Create Pincode Index (Primary)
        PINCODE_DB = df.copy()
        PINCODE_DB.set_index('pincode', inplace=True)
        
        # Create Place Index (Secondary) for fallback queries
        # We lowercase the place names for easier searching
        if 'place_name' in df.columns:
            PLACE_DB = df.copy()
            PLACE_DB['place_name_lower'] = PLACE_DB['place_name'].str.lower()
            # Drop duplicates to keep the first match for a city
            PLACE_DB.drop_duplicates(subset=['place_name_lower'], keep='first', inplace=True)
            PLACE_DB.set_index('place_name_lower', inplace=True)
            
        duration = time.time() - start_time
        print(f"Successfully loaded {len(PINCODE_DB)} pincode records in {duration:.2f} seconds.")
        
    except Exception as e:
        print(f"Error loading pincode data: {e}")
        PINCODE_DB = pd.DataFrame()
        PLACE_DB = pd.DataFrame()

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

def get_city_info(city_name: str) -> dict:
    """Helper function to fetch centroid for a city when pincode is missing"""
    global PLACE_DB
    
    if PLACE_DB is None or PLACE_DB.empty or not city_name:
        return None
        
    try:
        city_lower = city_name.lower().strip()
        if city_lower in PLACE_DB.index:
            data = PLACE_DB.loc[city_lower]
            if isinstance(data, pd.DataFrame):
                return data.iloc[0].to_dict()
            return data.to_dict()
    except KeyError:
        pass
        
    return None
