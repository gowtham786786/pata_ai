import re
from models.schemas import ExtractedEntities

class AddressParserAgent:
    """
    Agent 1: Parses messy Indian addresses.
    Extracts structured entities: State, District, Taluk, Village, Locality, Road, House No, Landmark, Pincode, Coordinates.
    """
    
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
        entities = ExtractedEntities()
        address = raw_address.lower().strip()
        
        # 0. Extract Coordinates
        coord_match = re.search(r'([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)', address)
        if coord_match:
            lat_str, lon_str = coord_match.groups()
            try:
                lat = float(lat_str)
                lon = float(lon_str)
                if 6 <= lat <= 38 and 68 <= lon <= 98:
                    entities.latitude = lat
                    entities.longitude = lon
                    address = address.replace(coord_match.group(0), '')
            except ValueError:
                pass
                
        # Clean address for regex matching
        address = re.sub(r'[^\w\s\.,-]', ' ', address)
        
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
                
        # 3. House No / Plot No
        house_match = re.search(r'\b(?:house no|h no|plot no|flat no|door no|#|no\.?)\s*[:#-]?\s*([a-z0-9/-]+)\b', address)
        if house_match:
            entities.house_no = house_match.group(1).strip()
            
        # 4. Landmark
        landmark_match = re.search(r'(?:near|opp\.?|opposite|behind|next to|saamne|piche|paas)\s+([a-z0-9\s]+?)(?:,|$)', address)
        if landmark_match:
            entities.landmark = landmark_match.group(1).strip()
            
        # 5. Road
        road_match = re.search(r'\b([a-z0-9\s]+(?:road|rd|street|st|marg|highway))\b', address)
        if road_match:
            entities.road = road_match.group(1).strip()
            
        # 6. Area / Locality
        area_match = re.search(r'\b([a-z0-9\s]+(?:nagar|colony|vihar|enclave|layout|phase|block|sector\s\d+))\b', address)
        if area_match:
            entities.locality = area_match.group(1).strip()

        # 7. Village
        village_match = re.search(r'\b([a-z0-9\s]+(?:village|gaon|palli|halli|puram|pur|abad))\b', address)
        if village_match:
            entities.village = village_match.group(1).strip()
            
        # 8. Taluk / Mandal
        taluk_match = re.search(r'\b([a-z0-9\s]+(?:mandal|taluka|taluk|tehsil))\b', address)
        if taluk_match:
            entities.taluk = taluk_match.group(1).strip()

        # 9. District
        district_match = re.search(r'\b([a-z0-9\s]+(?:district|dist))\b', address)
        if district_match:
            entities.district = district_match.group(1).replace('district', '').replace('dist', '').strip().title()

        # 10. City fallback
        parts = [p.strip() for p in address.split(',') if p.strip()]
        if parts:
            potential_city = parts[-1]
            if len(potential_city) > 2 and not any(k in potential_city for k in ['near', 'opp', 'road']):
                entities.city = potential_city.title()
                
        return entities
