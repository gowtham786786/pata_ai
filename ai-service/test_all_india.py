import asyncio
import httpx
import time
import json
import random

# Core Requested Addresses
TARGET_ADDRESSES = [
    "Opp SBI Bank, MG Road, Bangalore, 560001",
    "Near Charminar, Hyderabad, 500002",
    "Gateway of India, Mumbai, 400001",
    "Near India Gate, New Delhi, 110001",
    "Marina Beach, Chennai, 600005",
    "Kanaka Durga Temple, Vijayawada, 520001",
    "Jagannath Temple, Puri, 752001",
    "Mysore Palace, Mysuru, 570001",
    "Clock Tower, Jaipur, 302001",
    "Near Railway Station, Patna, 800001"
]

# Random sample to hit 100 limit (for testing brevity, we'll run 15 right now, you can expand to 100)
ADDITIONAL_ADDRESSES = [
    "Hawa Mahal, Jaipur, 302002",
    "Near Taj Mahal, Agra, 282001",
    "Victoria Memorial, Kolkata, 700071",
    "Red Fort, Delhi, 110006",
    "Golden Temple, Amritsar, 143006"
]

ALL_ADDRESSES = TARGET_ADDRESSES + ADDITIONAL_ADDRESSES

API_URL = "http://127.0.0.1:8000/api/v1/geocode"

async def test_geocode(client, address):
    try:
        response = await client.post(API_URL, json={"address": address}, timeout=10.0)
        if response.status_code == 200:
            return response.json()
        return {"originalAddress": address, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"originalAddress": address, "error": str(e)}

async def run_tests():
    print(f"Starting All-India Geocoding Test for {len(ALL_ADDRESSES)} Addresses...")
    start_time = time.time()
    
    success_count = 0
    high_conf_count = 0
    results = []
    
    async with httpx.AsyncClient() as client:
        tasks = [test_geocode(client, addr) for addr in ALL_ADDRESSES]
        responses = await asyncio.gather(*tasks)
        
    for res in responses:
        addr = res.get("originalAddress")
        if "error" in res:
            print(f"[FAIL] {addr} | Error: {res['error']}")
        else:
            conf = res.get("confidence", "Unknown")
            score = res.get("confidenceScore", 0)
            lat = res.get("latitude")
            lon = res.get("longitude")
            ms = res.get("processingTimeMs", 0)
            
            if lat and lon:
                success_count += 1
                if conf == "High":
                    high_conf_count += 1
                print(f"[SUCCESS] {addr} | Conf: {conf} ({score}/100) | Time: {ms}ms | Coords: {lat:.4f}, {lon:.4f}")
            else:
                print(f"[FAIL] {addr} | Could not resolve coordinates.")
                
            results.append(res)
            
    total_time = time.time() - start_time
    avg_time = (total_time / len(ALL_ADDRESSES)) * 1000
    
    print("\n" + "="*50)
    print("TEST REPORT")
    print("="*50)
    print(f"Total Addresses Tested: {len(ALL_ADDRESSES)}")
    print(f"Successful Geocodes: {success_count}/{len(ALL_ADDRESSES)} ({(success_count/len(ALL_ADDRESSES))*100:.1f}%)")
    print(f"High Confidence Matches: {high_conf_count}/{len(ALL_ADDRESSES)} ({(high_conf_count/len(ALL_ADDRESSES))*100:.1f}%)")
    print(f"Average Response Time: {avg_time:.1f} ms")
    
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print("\nDetailed results saved to test_results.json")

if __name__ == "__main__":
    asyncio.run(run_tests())
