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
        "bagal": "next to"
    }

    def parse(self, raw_address: str) -> ExtractedEntities:
        address = raw_address.lower().strip()
        
        # Normalize Hinglish
        for hin, eng in self.HINGLISH_MAP.items():
            # Use regex for word boundaries
            address = re.sub(rf'\b{hin}\b', eng, address)
            
        entities = ExtractedEntities()
        
        # 1. Extract Pincode (6 consecutive digits in India)
        pincode_match = re.search(r'\b\d{6}\b', address)
        if pincode_match:
            entities.pincode = pincode_match.group()
            # Remove pincode from string to prevent false matches later
            address = address.replace(entities.pincode, '')
            
        # 2. Extract potential Landmarks (Looking for keywords like near, opposite, behind, next to)
        # E.g. "near sbi bank", "opposite city mall"
        landmark_match = re.search(r'(?:near|opposite|behind|next to)\s+([a-z0-9\s]+?)(?:,|$)', address)
        if landmark_match:
            entities.landmark = landmark_match.group(1).strip()
            
        # If no explicit keyword, look for common landmark suffixes
        if not entities.landmark:
            fallback_match = re.search(r'\b([a-z\s]+(?:bank|mall|hospital|school|college|temple|mosque|church|station))\b', address)
            if fallback_match:
                entities.landmark = fallback_match.group(1).strip()
                
        # 3. Simple Extraction for City/State based on common patterns or a dictionary in a real scenario
        # For hackathon, we assume the string might contain recognizable tier-1/2 cities if we don't have pincode
        # This will be enhanced by the Pincode Verification Agent.
        
        return entities
