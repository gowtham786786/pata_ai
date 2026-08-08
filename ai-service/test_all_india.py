import asyncio
import httpx
import time
import json
import random
import csv
import os

API_URL = "http://127.0.0.1:8000/api/v1/geocode"
DATASET_PATH = "../datasets/pincode_data.csv"

def generate_test_addresses(count=200):
    addresses = []
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}")
        return [
            "Opp SBI Bank, MG Road, Bangalore, 560001",
            "Near Charminar, Hyderabad, 500002"
        ]
        
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    sampled_rows = random.sample(rows, min(count, len(rows)))
    
    for row in sampled_rows:
        village = row.get('village_locality_name', '')
        district = row.get('district', '')
        state = row.get('state', '')
        pincode = row.get('pincode', '')
        
        # Construct a somewhat messy address
        address = f"{village}, {district}, {state} {pincode}"
        addresses.append(address.strip(', '))
        
    return addresses

async def run_tests():
    addresses = generate_test_addresses(200)
    print(f"Starting All-India Geocoding Test for {len(addresses)} Addresses...")
    start_time = time.time()
    
    success_count = 0
    high_conf_count = 0
    results = []
    
    # We must run sequentially to respect Nominatim's 1 req/sec policy
    async with httpx.AsyncClient() as client:
        for addr in addresses:
            try:
                # Add delay
                await asyncio.sleep(1.1)
                response = await client.post(API_URL, json={"address": addr}, timeout=15.0)
                
                if response.status_code == 200:
                    res = response.json()
                    conf = res.get("confidence", "Unknown")
                    score = res.get("confidenceScore", 0)
                    lat = res.get("latitude")
                    lon = res.get("longitude")
                    
                    if lat and lon:
                        success_count += 1
                        if conf in ["High", "Very High"]:
                            high_conf_count += 1
                        print(f"[SUCCESS] {addr[:40]}... | Conf: {conf} ({score})")
                    else:
                        print(f"[FAIL] {addr[:40]}... | Could not resolve.")
                    results.append(res)
                else:
                    print(f"[ERROR] HTTP {response.status_code} for {addr[:40]}...")
            except Exception as e:
                print(f"[ERROR] {str(e)} for {addr[:40]}...")

    total_time = time.time() - start_time
    
    print("\n" + "="*50)
    print("TEST REPORT")
    print("="*50)
    print(f"Total Addresses Tested: {len(addresses)}")
    print(f"Successful Geocodes: {success_count}/{len(addresses)} ({(success_count/len(addresses))*100:.1f}%)")
    print(f"High Confidence Matches: {high_conf_count}/{len(addresses)} ({(high_conf_count/len(addresses))*100:.1f}%)")
    print(f"Total Test Duration: {total_time:.1f} seconds")
    
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print("\nDetailed results saved to test_results.json")

if __name__ == "__main__":
    asyncio.run(run_tests())
