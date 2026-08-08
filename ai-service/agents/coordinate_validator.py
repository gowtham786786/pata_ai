import httpx
from typing import Tuple, Dict, Any
from thefuzz import fuzz

NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

class CoordinateValidationAgent:
    """
    Agent 1.5: Validates user-provided coordinates by reverse-geocoding them 
    and checking if the resulting location matches the textual address.
    """
    
    async def validate(self, lat: float, lon: float, parsed_entities: Any) -> Tuple[bool, Dict[str, str]]:
        """
        Reverse-geocodes lat/lon and compares with parsed text.
        Returns:
            is_conflict (bool): True if the coordinates don't match the text.
            details (dict): Conflict details for the UI.
        """
        headers = {
            'User-Agent': 'PataAI-Location-Intelligence/1.0 (gowtham@example.com)'
        }
        params = {
            'lat': lat,
            'lon': lon,
            'format': 'json',
            'addressdetails': 1
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=headers, timeout=5.0)
                
            if response.status_code != 200:
                # If API fails, we can't be sure, so assume no conflict to avoid blocking the user
                return False, {}
                
            data = response.json()
            address_data = data.get('address', {})
            display_name = data.get('display_name', 'Unknown Location')
            
            rev_state = address_data.get('state', '').lower()
            rev_district = address_data.get('state_district', '').lower().replace(' district', '')
            rev_city = address_data.get('city', address_data.get('town', '')).lower()
            rev_village = address_data.get('village', '').lower()
            
            # Check for conflict
            is_conflict = False
            reasons = []
            
            text_state = (parsed_entities.state or '').lower()
            if text_state and text_state not in rev_state:
                if fuzz.partial_ratio(text_state, rev_state) < 70:
                    is_conflict = True
                    reasons.append(f"State mismatch: Text says '{text_state.title()}', but coordinates point to '{rev_state.title() or 'Unknown State'}'.")
                    
            text_district = (parsed_entities.district or '').lower()
            if text_district and rev_district and text_district not in rev_district:
                 if fuzz.partial_ratio(text_district, rev_district) < 70:
                     # Soft conflict for district
                     is_conflict = True
                     reasons.append(f"District mismatch: Text says '{text_district.title()}', but coordinates point to '{rev_district.title()}'.")
            
            if is_conflict:
                return True, {
                    "reverseAddress": display_name,
                    "reason": " ".join(reasons)
                }
                
            return False, {}
            
        except Exception as e:
            print(f"Coordinate validation failed: {e}")
            return False, {}
