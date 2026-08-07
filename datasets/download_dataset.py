import os
import pandas as pd

def download_and_prepare_dataset():
    url = "https://raw.githubusercontent.com/sanand0/pincode/master/data/IN.csv"
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, 'pincode_data.csv')
    
    print(f"Downloading dataset from {url}...")
    
    # Download using pandas
    try:
        df = pd.read_csv(url, dtype=str)
        print(f"Downloaded {len(df)} records. Processing...")
        
        # The 'key' column contains 'IN/110001'. Extract the pincode.
        df['pincode'] = df['key'].apply(lambda x: str(x).split('/')[-1] if pd.notnull(x) else '')
        
        # Rename columns to match what our system expects
        df.rename(columns={
            'place_name': 'place_name',
            'admin_name1': 'state',
            'latitude': 'latitude',
            'longitude': 'longitude'
        }, inplace=True)
        
        # Geonames IN.csv from this source doesn't have district
        df['district'] = ''
        
        # Drop rows without latitude or longitude
        df.dropna(subset=['latitude', 'longitude'], inplace=True)
        
        # Save the required columns
        columns_to_save = ['pincode', 'place_name', 'state', 'district', 'latitude', 'longitude']
        df[columns_to_save].to_csv(output_path, index=False)
        
        print(f"Successfully saved {len(df)} cleaned records to {output_path}")
        
    except Exception as e:
        print(f"Failed to download or process dataset: {e}")

if __name__ == "__main__":
    download_and_prepare_dataset()
