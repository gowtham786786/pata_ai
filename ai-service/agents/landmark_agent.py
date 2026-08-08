from utils.overpass_client import search_nearby_landmarks, search_generic_pois, search_nominatim
from typing import List, Dict, Any, Tuple
from thefuzz import fuzz

class OSMSearchAgent:
    """
    Agent 3: OSM Search Agent
    Queries OpenStreetMap using Nominatim for exact matches (villages, roads, cities)
    and Overpass for nearby POIs/landmarks.
    """
    
    METRO_DISTRICTS = ["bengaluru", "mumbai", "new delhi", "chennai", "hyderabad", "kolkata", "pune"]

    async def search(self, entities: Any, lat: float, lon: float) -> Tuple[List[Dict[str, Any]], str, List[Dict[str, Any]], str]:
        """
        Returns (list_of_matches, evidence_string, fallback_pois, match_type)
        match_type can be 'Village Match', 'Road Match', 'Landmark Match', 'None'
        """
        fallback_pois = []
        match_type = "None"
        
        # We fetch fallback POIs first so we always have them to return to the UI if lat/lon is valid
        if lat != 0.0 and lon != 0.0:
            district_str = str(entities.district) if entities.district else ""
            if any(m in district_str.lower() for m in self.METRO_DISTRICTS):
                radius = 1500
            else:
                radius = 3000
            fallback_pois = await search_generic_pois(lat, lon, radius)

        state = entities.state or entities.district or ""
        
        # Strategy 1: Nominatim Search for Village / Town
        if entities.village or entities.town:
            target = entities.village or entities.town
            matches = await search_nominatim(target, state)
            if matches:
                # Rank by string similarity
                for m in matches:
                    m['similarity'] = fuzz.token_sort_ratio(target.lower(), m['name'].lower())
                matches.sort(key=lambda x: -x['similarity'])
                
                if matches[0]['similarity'] > 60:
                    evidence = f"Village/Town '{target}' verified exactly via OSM Nominatim."
                    return matches, evidence, fallback_pois, "Village Match"
                    
        # Strategy 2: Nominatim Search for Road / Area
        if entities.road or entities.area:
            target = entities.road or entities.area
            # Sometimes road needs the city/district to resolve correctly
            city_or_state = entities.city or entities.district or state
            matches = await search_nominatim(target, city_or_state)
            if matches:
                for m in matches:
                    m['similarity'] = fuzz.token_sort_ratio(target.lower(), m['name'].lower())
                matches.sort(key=lambda x: -x['similarity'])
                
                if matches[0]['similarity'] > 60:
                    evidence = f"Road/Area '{target}' verified exactly via OSM Nominatim."
                    return matches, evidence, fallback_pois, "Road Match"
                    
        # Strategy 3: Overpass Search for Landmark (Needs fallback lat/lon from pincode)
        if entities.landmark and lat != 0.0 and lon != 0.0:
            target = entities.landmark
            matches = await search_nearby_landmarks(lat, lon, target, radius)
            if matches:
                for m in matches:
                    m['similarity'] = fuzz.token_sort_ratio(target.lower(), m['name'].lower())
                matches.sort(key=lambda x: (-x['similarity'], x['distance_meters']))
                
                top_match = matches[0]
                if top_match['similarity'] > 50:
                    evidence = f"Landmark '{top_match['name']}' found {top_match['distance_meters']:.1f}m away from pincode centroid."
                    return matches, evidence, fallback_pois, "Landmark Match"
                    
        return [], "No exact OSM matches found for extracted entities.", fallback_pois, "None"
