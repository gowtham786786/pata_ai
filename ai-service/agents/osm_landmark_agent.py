from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities
from utils.overpass_client import _execute_overpass_query

class OSMLandmarkAgent:
    """
    Agent 3: OSM Landmark Finder
    Uses the reference coordinate (usually pincode centroid) to search OpenStreetMap (Overpass) for candidates.
    """
    
    async def search(self, entities: ExtractedEntities, ref_lat: str, ref_lon: str) -> Tuple[List[Dict[str, Any]], str]:
        if not ref_lat or not ref_lon:
            return [], "No reference coordinates available to start OSM search."
            
        lat = float(ref_lat)
        lon = float(ref_lon)
        
        radius_meters = 3000  # 3km search radius around pincode centroid
        
        # We will search for the specific landmark, OR just generic POIs in the locality if no landmark
        clean_keyword = ""
        if entities.landmark:
            clean_keyword = entities.landmark.replace('"', '').replace("'", "")
        elif entities.locality:
            clean_keyword = entities.locality.replace('"', '').replace("'", "")
            
        if clean_keyword:
            query = f"""
            [out:json][timeout:10];
            (
              node["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
              way["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
              relation["name"~"(?i){clean_keyword}"](around:{radius_meters},{lat},{lon});
            );
            out center limit 15;
            """
        else:
            # Fallback to general generic POIs
            query = f"""
            [out:json][timeout:10];
            (
              node["amenity"~"bank|hospital|school|place_of_worship|police|post_office"](around:{radius_meters},{lat},{lon});
              way["amenity"~"bank|hospital|school|place_of_worship|police|post_office"](around:{radius_meters},{lat},{lon});
            );
            out center limit 15;
            """
            
        results = await _execute_overpass_query(query, lat, lon)
        
        candidates = []
        for r in results:
            candidates.append({
                "osm_id": r.get('osm_id', 'unknown'),
                "name": r.get('name'),
                "lat": r.get('lat'),
                "lon": r.get('lon'),
                "type": r.get('type'),
                "distance_from_ref": r.get('distance_meters'),
                "source": "OpenStreetMap"
            })
            
        evidence = f"Found {len(candidates)} candidate landmarks via OpenStreetMap."
        return candidates, evidence
