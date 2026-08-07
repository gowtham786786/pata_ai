from utils.pincode_loader import get_pincode_info, get_city_info
from typing import Dict, Any, Tuple

class PincodeVerificationAgent:
    """
    Agent 2: Pincode Verification
    Searches the in-memory pincode CSV, validates against extracted data, and returns the centroid.
    If pincode is missing, uses city or district to estimate search area.
    """
    
    def verify(self, pincode: str, city: str = None) -> Tuple[bool, Dict[str, Any], str]:
        """
        Returns (is_valid, centroid_data, evidence_string)
        """
        data = None
        evidence = ""
        is_exact = False
        
        if pincode:
            data = get_pincode_info(pincode)
            if data:
                is_exact = True
                evidence = f"Pincode {pincode} verified: Maps to {data.get('district', 'Unknown District')}, {data.get('state', 'Unknown State')}."
            else:
                evidence = f"Pincode {pincode} not found in database or invalid."
                
        # Fallback to City if Pincode is missing or invalid
        if not data and city:
            data = get_city_info(city)
            if data:
                is_exact = False # It's a fallback match, confidence will be slightly lower
                evidence += f" Fallback: Found centroid for city '{city}' in {data.get('state', 'Unknown State')}."
                
        if not data:
            return False, {}, evidence if evidence else "No pincode or recognizable city extracted from address."
            
        lat = float(data.get('latitude', 0.0))
        lon = float(data.get('longitude', 0.0))
        
        if lat == 0.0 and lon == 0.0:
            return False, data, f"Location found, but no geographic centroid available."
            
        data['is_exact_pincode'] = is_exact
        return True, data, evidence
