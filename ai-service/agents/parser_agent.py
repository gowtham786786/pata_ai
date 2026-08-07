import re
from models.schemas import ExtractedEntities

class AddressParserAgent:
    """
    Agent 1: Parses messy Indian addresses.
    Handles Hinglish (opp, near, ke samne, pas) and extracts structured entities.
    """
    
    HINGLISH_MAP = {
        "samne": "opposite",
        "saamne": "opposite",
        "opp": "opposite",
        "opp.": "opposite",
        "pas": "near",
        "paas": "near",
        "piche": "behind",
        "peeche": "behind",
        "bagal me": "next to",
        "bagal": "next to",
        "ke paas": "near",
        "ke samne": "opposite",
        "gali": "street",
        "marg": "road",
        "bhavan": "building",
        "nagar": "area",
        "colony": "area",
        "vihar": "area",
        "gaon": "village"
    }

    # Known Indian States for extraction
    INDIAN_STATES = [
        "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
        "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
        "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
        "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
        "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
        "delhi", "puducherry", "jammu", "kashmir", "chandigarh"
    ]

    def parse(self, raw_address: str) -> ExtractedEntities:
        # Clean address
        address = raw_address.lower().strip()
        address = re.sub(r'[^\w\s\.,-]', ' ', address)
        
        # Normalize Hinglish
        for hin, eng in self.HINGLISH_MAP.items():
            address = re.sub(rf'\b{hin}\b', eng, address)
            
        entities = ExtractedEntities()
        
        # 1. Pincode
        pincode_match = re.search(r'\b\d{6}\b', address)
        if pincode_match:
            entities.pincode = pincode_match.group()
            address = address.replace(entities.pincode, '')
            
        # 2. State
        for state in self.INDIAN_STATES:
            if state in address:
                entities.state = state.title()
                address = address.replace(state, '')
                break
                
        # 3. Landmark & Nearby Place
        landmark_match = re.search(r'(?:near|opposite|behind|next to)\s+([a-z0-9\s]+?)(?:,|$)', address)
        if landmark_match:
            entities.landmark = landmark_match.group(1).strip()
            # If the landmark is very long, it might contain the road or city, we'll keep it simple
            
        fallback_match = re.search(r'\b([a-z\s]+(?:bank|mall|hospital|school|college|temple|mosque|church|station|gate|palace|tower))\b', address)
        if fallback_match and not entities.landmark:
            entities.landmark = fallback_match.group(1).strip()

        # 4. Road / Street
        road_match = re.search(r'\b([a-z0-9\s]+(?:road|rd|street|st|marg|highway))\b', address)
        if road_match:
            entities.road = road_match.group(1).strip()
            
        # 5. Area / Locality (words ending in nagar, colony, vihar, enclave)
        area_match = re.search(r'\b([a-z0-9\s]+(?:nagar|colony|vihar|enclave|layout|phase|block|sector\s\d+))\b', address)
        if area_match:
            entities.area = area_match.group(1).strip()

        # 6. City Extraction (heuristic: last remaining word before state/pincode, or known cities)
        # For a robust implementation, the Pincode Verification Agent will fetch the exact city/district
        # But we can try to extract explicit commas
        parts = [p.strip() for p in address.split(',') if p.strip()]
        if parts:
            # Often the last or second to last part is the city
            potential_city = parts[-1]
            if len(potential_city) > 2 and not any(k in potential_city for k in ['near', 'opp', 'road']):
                entities.city = potential_city.title()
        
        return entities
