from utils.pincode_loader import get_pincode_info
from typing import Dict, Any, Tuple

class PincodeVerificationAgent:
    """
    Agent 2: Pincode Verification
    Searches the in-memory pincode CSV, validates against extracted data, and returns the centroid.
    """
    
    def verify(self, pincode: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Returns (is_valid, centroid_data, evidence_string)
        """
        if not pincode:
            return False, {}, "No pincode extracted from address."
            
        data = get_pincode_info(pincode)
        
        if not data:
            return False, {}, f"Pincode {pincode} not found in database or invalid."
            
        # We assume the CSV has 'latitude' and 'longitude', 'district', 'state'
        lat = float(data.get('latitude', 0.0))
        lon = float(data.get('longitude', 0.0))
        
        if lat == 0.0 and lon == 0.0:
            return False, data, f"Pincode {pincode} found, but no geographic centroid available."
            
        evidence = f"Pincode {pincode} verified: Maps to {data.get('district', 'Unknown District')}, {data.get('state', 'Unknown State')}."
        return True, data, evidence
