from utils.pincode_loader import get_pincode_info
from typing import Dict, Any, Tuple
from thefuzz import fuzz

class PincodeVerificationAgent:
    """
    Agent 2: Pincode Verifier
    Check pincode existence, state/city consistency, and returns reference area.
    """
    
    def verify(self, pincode: str, parsed_city: str = None, parsed_state: str = None) -> Tuple[bool, Dict[str, Any], str]:
        if not pincode:
            return False, {
                "pincode": None, "valid": False, "state_match": False, "city_match": False,
                "reference_latitude": None, "reference_longitude": None, "issues": ["No pincode provided"]
            }, "No pincode provided for validation."
            
        data = get_pincode_info(pincode)
        if not data:
            return False, {
                "pincode": pincode, "valid": False, "state_match": False, "city_match": False,
                "reference_latitude": None, "reference_longitude": None, "issues": ["Pincode not found in dataset"]
            }, f"Pincode {pincode} not found in database or invalid."
            
        dataset_district = str(data.get('district') or '').lower()
        dataset_state = str(data.get('state') or '').lower()
        
        issues = []
        state_match = False
        city_match = False
        
        if parsed_state and parsed_state.lower() in dataset_state:
            state_match = True
        elif parsed_state:
            issues.append("Input state differs from verified pincode state.")
             
        if parsed_city:
            if fuzz.partial_ratio(parsed_city.lower(), dataset_district) > 75 or fuzz.partial_ratio(parsed_city.lower(), str(data.get('place_name') or '').lower()) > 75:
                city_match = True
            else:
                issues.append("Input pincode differs from verified locality/city.")
                
        validation_data = {
            "pincode": pincode,
            "valid": True,
            "state_match": state_match,
            "city_match": city_match,
            "reference_latitude": str(data.get('latitude', '')),
            "reference_longitude": str(data.get('longitude', '')),
            "issues": issues
        }
        
        evidence = f"Pincode {pincode} verified."
        if issues:
            evidence += " " + " ".join(issues)
            
        return True, validation_data, evidence
