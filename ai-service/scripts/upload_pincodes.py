import os
import sys
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Make sure we can import from ai-service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load env variables (assuming .env is in backend or root, we'll try to find it)
env_path = os.path.join(os.path.dirname(__file__), '../../backend/.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

def init_firebase():
    if not firebase_admin._apps:
        # Check for service account JSON or use default ADC
        project_id = os.environ.get('FIREBASE_PROJECT_ID', 'pataai')
        cred = credentials.ApplicationDefault()
        
        # If running locally without ADC but with env vars, we might need a cert
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

def upload_data():
    db = init_firebase()
    
    csv_path = os.path.join(os.path.dirname(__file__), '../../datasets/pincode_data.csv')
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print("Loading CSV...")
    df = pd.read_csv(csv_path, dtype={'pincode': str})
    
    collection_ref = db.collection('pincodes')
    
    print(f"Uploading {len(df)} records to Firestore in batches...")
    
    batch = db.batch()
    count = 0
    total_uploaded = 0
    
    for _, row in df.iterrows():
        # Handle NaN values explicitly
        data = {}
        for k, v in row.to_dict().items():
            if pd.isna(v):
                data[k] = None
            else:
                data[k] = v
                
        pincode = data.get('pincode', '')
        if not isinstance(pincode, str):
            pincode = str(pincode)
        pincode = pincode.strip()
        
        if not pincode or pincode == 'None':
            continue
            
        doc_ref = collection_ref.document(pincode)
        batch.set(doc_ref, data)
        count += 1
        
        # Firestore limit is 500 writes per batch
        if count >= 450:
            batch.commit()
            total_uploaded += count
            print(f"Uploaded {total_uploaded} records...")
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
        total_uploaded += count
        
    print(f"Success! Uploaded {total_uploaded} records to the 'pincodes' collection.")

if __name__ == '__main__':
    upload_data()
