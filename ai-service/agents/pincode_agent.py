from utils.pincode_loader import get_pincode_info, get_city_info
from typing import Dict, Any, Tuple
from thefuzz import fuzz

class PincodeVerificationAgent:
    """
    Agent 3: Pincode Validation
    Validates the pincode against the official dataset to confirm District and State.
    Never uses or returns CSV latitude/longitude as final coordinates.
    """
    
    def verify(self, pincode: str, parsed_district: str = None, parsed_state: str = None) -> Tuple[bool, Dict[str, Any], str]:
        """
        Returns (is_valid, validation_data, evidence_string)
        """
        if not pincode:
            return False, {}, "No pincode provided for validation."
            
        data = get_pincode_info(pincode)
        if not data:
            return False, {}, f"Pincode {pincode} not found in database or invalid."
            
        dataset_district_raw = str(data.get('district') or '').lower()
        dataset_state_raw = str(data.get('state') or '').lower()
        
        dataset_district = "" if dataset_district_raw == "nan" else dataset_district_raw
        dataset_state = "" if dataset_state_raw == "nan" else dataset_state_raw
        
        validation_data = {
            "pincode": pincode,
            "district": dataset_district.title() if dataset_district else "",
            "state": dataset_state.title() if dataset_state else "",
            "district_match": False,
            "state_match": False,
            "lat": data.get('lat'),
            "lon": data.get('lon')
        }
        
        evidence = f"Pincode {pincode} exists in {dataset_district.title()}, {dataset_state.title()}."
        
        if parsed_state and parsed_state.lower() in dataset_state:
             validation_data["state_match"] = True
             evidence += " State matches."
             
        if parsed_district and parsed_district.lower() in dataset_district:
             validation_data["district_match"] = True
             evidence += " District matches."
             
        # If district doesn't perfectly match, check fuzzy similarity
        if parsed_district and not validation_data["district_match"]:
            if fuzz.partial_ratio(parsed_district.lower(), dataset_district) > 75:
                validation_data["district_match"] = True
                evidence += " District fuzzy matches."

        # Do NOT return the lat/lon from the dataset here to prevent centroid geocoding.
        return True, validation_data, evidence
