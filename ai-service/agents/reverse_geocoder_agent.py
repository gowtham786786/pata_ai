import httpx
from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities
from thefuzz import fuzz

class ReverseGeocoderAgent:
    """
    Agent 5: Reverse Geocoder
    Performs Reverse Geocoding on candidates provided by Agent 4.
    Verifies if returned State, District, Village, Road match the parsed address.
    """
    
    NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

    async def verify_candidates(self, candidates: List[Dict[str, Any]], parsed: ExtractedEntities) -> Tuple[List[Dict[str, Any]], str]:
        """
        Enhances candidates with reverse-geocoded verification flags.
        """
        if not candidates:
            return [], "No candidates to reverse geocode."
            
        headers = {
            'User-Agent': 'PataAI-Enterprise/2.0 (admin@pataai.com)'
        }
        
        verified_candidates = []
        evidence_logs = []
        
        async with httpx.AsyncClient() as client:
            for idx, cand in enumerate(candidates[:3]): # Limit to top 3 to save time/API calls
                params = {
                    'lat': cand['lat'],
                    'lon': cand['lon'],
                    'format': 'json',
                    'addressdetails': 1
                }
                try:
                    response = await client.get(self.NOMINATIM_REVERSE_URL, params=params, headers=headers, timeout=5.0)
                    if response.status_code == 200:
                        data = response.json()
                        address_data = data.get('address', {})
                        
                        rev_state = str(address_data.get('state') or '').lower()
                        rev_district = str(address_data.get('state_district') or '').lower().replace(' district', '')
                        rev_city = (address_data.get('city') or address_data.get('town') or '').lower()
                        rev_village = (address_data.get('village') or address_data.get('suburb') or '').lower()
                        rev_road = (address_data.get('road') or '').lower()
                        rev_pincode = (address_data.get('postcode') or '')
                        
                        # Match flags
                        matches = {
                            "state_match": False,
                            "district_match": False,
                            "village_match": False,
                            "road_match": False,
                            "pincode_match": False
                        }
                        
                        if parsed.state and parsed.state.lower() in rev_state:
                            matches['state_match'] = True
                            
                        if parsed.district and parsed.district.lower() in rev_district:
                            matches['district_match'] = True
                        elif parsed.district and fuzz.partial_ratio(parsed.district.lower(), rev_district) > 80:
                            matches['district_match'] = True
                            
                        if parsed.village and parsed.village.lower() in rev_village:
                            matches['village_match'] = True
                        elif parsed.village and fuzz.partial_ratio(parsed.village.lower(), rev_village) > 80:
                            matches['village_match'] = True
                            
                        if parsed.road and parsed.road.lower() in rev_road:
                            matches['road_match'] = True
                        elif parsed.road and fuzz.partial_ratio(parsed.road.lower(), rev_road) > 80:
                            matches['road_match'] = True
                            
                        if parsed.pincode and parsed.pincode == rev_pincode:
                            matches['pincode_match'] = True
                            
                        cand['reverse_address'] = data.get('display_name', '')
                        cand['reverse_matches'] = matches
                        verified_candidates.append(cand)
                        
                        match_count = sum(1 for v in matches.values() if v)
                        evidence_logs.append(f"Candidate {idx+1} verified: {match_count}/5 entities matched via reverse geocoding.")
                    
                except Exception as e:
                    evidence_logs.append(f"Reverse geocode failed for Candidate {idx+1}: {str(e)}")
                    verified_candidates.append(cand)
                    
        return verified_candidates, " | ".join(evidence_logs)
