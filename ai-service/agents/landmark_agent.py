from utils.overpass_client import search_nearby_landmarks
from typing import List, Dict, Any, Tuple

class LandmarkVerificationAgent:
    """
    Agent 3: Landmark Verification
    Queries the Overpass API using the extracted landmark and the pincode centroid.
    """
    
    async def verify(self, landmark: str, lat: float, lon: float) -> Tuple[List[Dict[str, Any]], str]:
        """
        Returns (list_of_matches, evidence_string)
        """
        if not landmark:
            return [], "No landmark extracted to verify."
            
        if lat == 0.0 or lon == 0.0:
            return [], f"Cannot verify landmark '{landmark}' because centroid is missing."
            
        matches = await search_nearby_landmarks(lat, lon, landmark)
        
        if not matches:
            return [], f"Landmark '{landmark}' not found within 3km of pincode centroid."
            
        top_match = matches[0]
        evidence = f"Landmark '{top_match['name']}' found {top_match['distance_meters']}m away from pincode centroid."
        
        return matches, evidence
