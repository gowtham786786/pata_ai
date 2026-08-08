import pandas as pd
import os
import time
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Global variable to hold the pincode data in memory
PINCODE_DB = None
PLACE_DB = None

def init_firebase():
    if not firebase_admin._apps:
        env_path = os.path.join(os.path.dirname(__file__), '../../backend/.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
            
        project_id = os.environ.get('FIREBASE_PROJECT_ID', 'pataai')
        cred = credentials.ApplicationDefault()
        
        private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
        client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')
        
        if private_key and client_email:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key.replace('\\n', '\n'),
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            
        firebase_admin.initialize_app(cred, {'projectId': project_id})
    return firestore.client()

def load_pincode_data():
    """
    Loads the All India Pincode Directory from local CSV into memory.
    This bypasses Firebase to prevent Quota Exceeded errors and is much faster.
    """
    global PINCODE_DB
    global PLACE_DB
    
    try:
        start_time = time.time()
        csv_path = os.path.join(os.path.dirname(__file__), '../../datasets/pincode_data.csv')
        print(f"Loading pincode dataset from {csv_path}...")
        
        if not os.path.exists(csv_path):
            print(f"WARNING: CSV not found at {csv_path}. Using an empty dataset.")
            PINCODE_DB = pd.DataFrame(columns=['pincode', 'place_name', 'state', 'district', 'latitude', 'longitude'])
            PLACE_DB = pd.DataFrame()
            return
            
        # Load from local CSV
        df = pd.read_csv(csv_path)
        
        # Rename columns to match expected schema if necessary, or just rely on CSV headers
        # The CSV has: pincode, village_locality_name, state, district, latitude, longitude
        df.rename(columns={'village_locality_name': 'place_name'}, inplace=True)
        
        # Ensure pincode is a string and clean whitespace
        if 'pincode' in df.columns:
            df['pincode'] = df['pincode'].astype(str).str.strip()
            
        # Create Pincode Index (Primary)
        PINCODE_DB = df.copy()
        PINCODE_DB.set_index('pincode', inplace=True)
        
        # Create Place Index (Secondary) for fallback queries
        # We lowercase the place names for easier searching
        if 'place_name' in df.columns:
            PLACE_DB = df.copy()
            PLACE_DB['place_name_lower'] = PLACE_DB['place_name'].astype(str).str.lower()
            # Drop duplicates to keep the first match for a city
            PLACE_DB.drop_duplicates(subset=['place_name_lower'], keep='first', inplace=True)
            PLACE_DB.set_index('place_name_lower', inplace=True)
            
        duration = time.time() - start_time
        print(f"Successfully loaded {len(PINCODE_DB)} pincode records from CSV in {duration:.2f} seconds.")
        
    except Exception as e:
        print(f"Error loading pincode data from Firebase: {e}")
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
