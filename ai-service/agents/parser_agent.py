import re
from models.schemas import ExtractedEntities

class AddressParserAgent:
    """
    Agent 1: Parses messy Indian addresses into structured JSON format.
    Extracts structured entities as per the new Address Intelligence Architecture.
    """
    
    INDIAN_STATES = [
        "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
        "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
        "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
        "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
        "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
        "delhi", "puducherry", "jammu", "kashmir", "chandigarh"
    ]
    
    RELATION_KEYWORDS = {
        "opposite": "opposite", "opp": "opposite", "opp.": "opposite", "eduruga": "opposite", "saamne": "opposite",
        "near": "near", "daggara": "near", "paas": "near",
        "behind": "behind", "piche": "behind",
        "next to": "next to", "beside": "beside",
        "in front of": "in front of"
    }

    def parse(self, raw_address: str) -> ExtractedEntities:
        entities = ExtractedEntities(raw_address=raw_address)
        address = raw_address.lower().strip()
        
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
            entities.house_number = house_match.group(1).strip()
            
        # 4. Landmark and Relation
        relation_pattern = r'\b(' + '|'.join(self.RELATION_KEYWORDS.keys()) + r')\b\s+([a-z0-9\s]+?)(?:,|$| near| opp)'
        landmark_match = re.search(relation_pattern, address)
        if landmark_match:
            rel = landmark_match.group(1).strip()
            entities.relation = self.RELATION_KEYWORDS.get(rel, rel)
            entities.landmark = landmark_match.group(2).strip().title()
        else:
            # Fallback for "Landmark ke opposite" (Hindi/Hinglish style)
            reverse_pattern = r'([a-z0-9\s]+?)\s+(?:ke\s+)?\b(' + '|'.join(self.RELATION_KEYWORDS.keys()) + r')\b'
            rev_match = re.search(reverse_pattern, address)
            if rev_match:
                lm = rev_match.group(1).strip().title()
                if len(lm) > 3:
                    entities.landmark = lm
                    rel = rev_match.group(2).strip()
                    entities.relation = self.RELATION_KEYWORDS.get(rel, rel)
                    
        # 5. Street / Road
        road_match = re.search(r'\b([a-z0-9\s]+(?:road|rd|street|st|marg|highway))\b', address)
        if road_match:
            entities.street = road_match.group(1).strip().title()
            
        # 6. Locality
        area_match = re.search(r'\b([a-z0-9\s]+(?:nagar|colony|vihar|enclave|layout|phase|block|sector\s\d+))\b', address)
        if area_match:
            entities.locality = area_match.group(1).strip().title()
            
        # 7. District
        district_match = re.search(r'\b([a-z0-9\s]+(?:district|dist))\b', address)
        if district_match:
            entities.district = district_match.group(1).replace('district', '').replace('dist', '').strip().title()

        # 8. City fallback
        # Try to identify city by looking at the last remaining significant token
        address_clean = re.sub(r'[^\w\s,]', ' ', address)
        parts = [p.strip() for p in address_clean.split(',') if p.strip()]
        if parts:
            potential_city = parts[-1]
            if len(potential_city) > 2 and not any(k in potential_city for k in self.RELATION_KEYWORDS.keys()):
                entities.city = potential_city.title()
                
        # 9. Language and Transliteration (Heuristic)
        # If the original address contains Telugu/Hindi scripts
        if re.search(r'[\u0c00-\u0c7f]', raw_address):
            entities.language = "Telugu"
            entities.transliterated = False
        elif re.search(r'[\u0900-\u097f]', raw_address):
            entities.language = "Hindi"
            entities.transliterated = False
        elif re.search(r'\b(ke|paas|eduruga|daggara|saamne)\b', raw_address.lower()):
            entities.language = "Hinglish/Telugu-English"
            entities.transliterated = True
        else:
            entities.language = "English"
            entities.transliterated = False
            
        entities.confidence = 0.95 if entities.landmark and entities.pincode else 0.70
                
        return entities
