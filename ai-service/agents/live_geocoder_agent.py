import httpx
import asyncio
from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities

class LiveGeocoderAgent:
    """
    Agent 4: Live Geocoder
    Queries Nominatim OpenStreetMap using the full structured address.
    Returns potential coordinates (Latitude, Longitude, Bounding Box).
    """
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    async def search(self, entities: ExtractedEntities) -> Tuple[List[Dict[str, Any]], str]:
        """
        Builds a query string from entities and searches OSM.
        Returns (list_of_candidates, evidence)
        """
        # Build query strictly from most specific to least specific
        parts = []
        if entities.house_no: parts.append(entities.house_no)
        if entities.building: parts.append(entities.building)
        if entities.road: parts.append(entities.road)
        if entities.locality: parts.append(entities.locality)
        if entities.village: parts.append(entities.village)
        if entities.town: parts.append(entities.town)
        if entities.city: parts.append(entities.city)
        if entities.district: parts.append(entities.district)
        if entities.state: parts.append(entities.state)
        
        # If pincode is the ONLY entity provided, allow searching by it
        if not parts and entities.pincode:
            parts.append(entities.pincode)
            
        query = ", ".join([p for p in parts if p])
        if not query:
            return [], "No address entities available to geocode."

        headers = {
            'User-Agent': 'PataAI-Enterprise/2.0 (admin@pataai.com)'
        }
        
        params = {
            'q': query,
            'format': 'json',
            'addressdetails': 1,
            'limit': 5,
            'countrycodes': 'in'
        }
        
        # If pincode exists, it often helps Nominatim
        if entities.pincode:
            # Adding pincode directly to 'q' can sometimes fail in Nominatim if the pincode boundary isn't perfectly mapped.
            # We'll try the full query first.
            pass
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.NOMINATIM_URL, params=params, headers=headers, timeout=5.0)
                
            if response.status_code == 200:
                results = response.json()
                if results:
                    candidates = []
                    for r in results:
                        candidates.append({
                            "lat": float(r.get('lat')),
                            "lon": float(r.get('lon')),
                            "display_name": r.get('display_name'),
                            "osm_id": r.get('osm_id'),
                            "category": r.get('category'),
                            "type": r.get('type'),
                            "importance": r.get('importance', 0.0),
                            "address": r.get('address', {})
                        })
                    
                    evidence = f"Found {len(candidates)} candidates via Live Geocoder for query: '{query}'."
                    return candidates, evidence
                else:
                    return [], f"No candidates found via Live Geocoder for query: '{query}'."
            else:
                 return [], f"Live Geocoder API failed with status {response.status_code}."
                 
        except Exception as e:
            return [], f"Live Geocoder encountered an error: {str(e)}"
