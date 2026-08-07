from utils.overpass_client import search_nearby_landmarks, search_generic_pois
from typing import List, Dict, Any, Tuple
from thefuzz import fuzz

class LandmarkVerificationAgent:
    """
    Agent 3: Landmark Verification
    Queries the Overpass API using the extracted landmark and the pincode centroid.
    Implements adaptive radius, fuzzy matching, and fallback POIs.
    """
    
    METRO_DISTRICTS = ["bengaluru", "mumbai", "new delhi", "chennai", "hyderabad", "kolkata", "pune"]

    async def verify(self, landmark: str, lat: float, lon: float, district: str = "") -> Tuple[List[Dict[str, Any]], str, List[Dict[str, Any]]]:
        """
        Returns (list_of_matches, evidence_string, fallback_pois)
        """
        fallback_pois = []
        if lat == 0.0 or lon == 0.0:
            return [], f"Cannot verify landmark '{landmark}' because centroid is missing.", []

        # 1. Determine Adaptive Radius
        district_str = str(district) if district else ""
        dist_lower = district_str.lower()
        if any(m in dist_lower for m in self.METRO_DISTRICTS):
            radius = 1500  # Metro
        else:
            radius = 3000  # City / General
            
        # We fetch fallback POIs first so we always have them to return to the UI
        fallback_pois = await search_generic_pois(lat, lon, radius)

        if not landmark:
            return [], "No landmark extracted to verify.", fallback_pois
            
        # 2. Search specific landmark
        matches = await search_nearby_landmarks(lat, lon, landmark, radius)
        
        if not matches:
            return [], f"Landmark '{landmark}' not found within {radius}m.", fallback_pois
            
        # 3. Fuzzy Matching & Ranking
        # Calculate Levenshtein similarity to rank matches better
        for match in matches:
            match['similarity'] = fuzz.token_sort_ratio(landmark.lower(), match['name'].lower())
            
        # Sort by best similarity, then closest distance
        matches.sort(key=lambda x: (-x['similarity'], x['distance_meters']))
            
        top_match = matches[0]
        evidence = f"Landmark '{top_match['name']}' found {top_match['distance_meters']:.1f}m away (Similarity: {top_match['similarity']}%)"
        
        return matches, evidence, fallback_pois
