import requests
from typing import Dict, Any, Tuple

class ReferenceResolverAgent:
    """
    Agent 2: Reference Resolver (formerly Pincode Verifier)
    Geocodes parsed pincode+city+locality via Nominatim structured query to get a ground-truth reference record.
    Always returns a reference coordinate.
    """
    
    def resolve(self, pincode: str, parsed_city: str = None, parsed_locality: str = None) -> Tuple[bool, Dict[str, Any], str]:
        # Helper to do the request
        def do_geocode(query_parts):
            query = ", ".join([p for p in query_parts if p])
            try:
                headers = {"User-Agent": "PataAI-Backend-Agent"}
                resp = requests.get(f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&addressdetails=1", headers=headers, timeout=5)
                if resp.status_code == 200 and len(resp.json()) > 0:
                    return resp.json()[0]
            except Exception:
                pass
            return None

        api_data = None
        evidence = ""
        
        # Try full query first
        if pincode or parsed_city or parsed_locality:
            parts = [pincode, parsed_locality, parsed_city, "India"]
            api_data = do_geocode(parts)
            evidence = f"Geocoded dynamically via Nominatim: {', '.join([p for p in parts if p])}"
            
        # Fallback 1: Try without locality
        if not api_data and (pincode or parsed_city):
            parts = [pincode, parsed_city, "India"]
            api_data = do_geocode(parts)
            evidence = f"Geocoded dynamically via Nominatim (Locality omitted): {', '.join([p for p in parts if p])}"
            
        # Fallback 2: Try with just pincode
        if not api_data and pincode:
            parts = [pincode, "India"]
            api_data = do_geocode(parts)
            evidence = f"Geocoded dynamically via Nominatim (Pincode fallback): {', '.join([p for p in parts if p])}"

        if api_data:
            addr = api_data.get('address', {})
            ref_pincode = addr.get('postcode', '')
            ref_city = addr.get('city', addr.get('town', addr.get('county', '')))
            ref_locality = addr.get('suburb', addr.get('neighbourhood', addr.get('village', '')))
            
            pin_data = {
                'pincode': pincode,
                'valid': True,
                'reference_latitude': float(api_data['lat']),
                'reference_longitude': float(api_data['lon']),
                'ref_city': ref_city,
                'ref_locality': ref_locality,
                'ref_pincode': ref_pincode
            }
            return True, pin_data, evidence

        # Extreme Fallback (if all API calls fail or timeout)
        return False, {
            "pincode": pincode, 
            "valid": False, 
            "reference_latitude": 20.5937, # Default to India centroid if absolutely everything fails
            "reference_longitude": 78.9629, 
        }, "Failed to resolve reference coordinate, using India centroid fallback."
