from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities
from utils.overpass_client import search_nearby_landmarks, search_generic_pois
from thefuzz import fuzz
from utils.pincode_loader import init_firebase

class LandmarkVerifierEngine:
    """
    Landmark Verification Engine
    Uses Overpass API to verify if the landmark mentioned in the text actually exists near the candidate coordinates.
    Also checks the internal 'corrections' database for manually verified landmarks.
    """
    
    def __init__(self):
        try:
            self.db = init_firebase()
        except Exception:
            self.db = None

    async def _check_verified_corrections(self, parsed: ExtractedEntities) -> Dict[str, Any]:
        if not self.db or not parsed.pincode or not parsed.landmark:
            return None
            
        try:
            # Query verified corrections in the same pincode
            docs = self.db.collection('corrections').where('pincode', '==', parsed.pincode).where('status', '==', 'verified').stream()
            
            best_match = None
            best_score = 0
            
            for doc in docs:
                data = doc.to_dict()
                landmark_text = data.get('landmark_text', '')
                if not landmark_text:
                    continue
                    
                score = fuzz.token_sort_ratio(parsed.landmark.lower(), landmark_text.lower())
                if score > 80: # High threshold for verified corrections
                    if score > best_score:
                        best_score = score
                        best_match = data
                        
            return best_match
        except Exception as e:
            print(f"Error querying corrections: {e}")
            return None

    async def verify(self, candidates: List[Dict[str, Any]], parsed: ExtractedEntities) -> Tuple[List[Dict[str, Any]], str]:
        """
        Enhances candidates with landmark verification data.
        Returns (candidates, evidence_log)
        """
        if not candidates:
            return [], "No candidates to verify landmarks for."
            
        evidence_logs = []
        
        # 1. Check Verified Corrections First (Cost Tiering / Self-Improving Loop)
        verified_correction = await self._check_verified_corrections(parsed)
        if verified_correction:
            # Found a verified manual correction! Apply it to all candidates (or just override the top one)
            # Actually, we should just return a single overridden candidate.
            lat = verified_correction.get('corrected_geocode', {}).get('lat')
            lon = verified_correction.get('corrected_geocode', {}).get('lon')
            if lat and lon:
                override_cand = candidates[0].copy()
                override_cand['lat'] = lat
                override_cand['lon'] = lon
                override_cand['landmark_match'] = True
                override_cand['matched_landmark'] = {
                    "name": verified_correction.get('landmark_text'),
                    "distance_meters": 0.0,
                    "type": "verified_correction"
                }
                override_cand['source'] = "verified_correction"
                evidence_logs.append(f"Matched from a previous confirmed correction for '{parsed.landmark}' (Pincode: {parsed.pincode}).")
                # Add generic POIs for the map UI
                override_cand['nearby_pois'] = await search_generic_pois(lat, lon, radius_meters=1000)
                # Override candidates with just this one, as it's a verified absolute truth
                return [override_cand], " | ".join(evidence_logs)

        for idx, cand in enumerate(candidates[:2]): # Only check top 2 candidates to save time
            lat = cand['lat']
            lon = cand['lon']
            
            # 2. Check if user provided a landmark
            if parsed.landmark:
                # Search within 2km radius
                landmarks = await search_nearby_landmarks(lat, lon, parsed.landmark, radius_meters=2000)
                if landmarks:
                    # Check similarity
                    best_match = None
                    best_score = 0
                    for lm in landmarks:
                        score = fuzz.token_sort_ratio(parsed.landmark.lower(), lm['name'].lower())
                        if score > best_score:
                            best_score = score
                            best_match = lm
                            
                    if best_score > 60:
                        cand['landmark_match'] = True
                        cand['matched_landmark'] = best_match
                        evidence_logs.append(f"Landmark '{best_match['name']}' found {best_match['distance_meters']:.1f}m away for Candidate {idx+1}.")
                    else:
                        cand['landmark_match'] = False
                        evidence_logs.append(f"Landmark '{parsed.landmark}' not found near Candidate {idx+1}.")
                else:
                    cand['landmark_match'] = False
                    evidence_logs.append(f"Landmark '{parsed.landmark}' not found near Candidate {idx+1}.")
            else:
                 cand['landmark_match'] = None # No landmark provided
                 
            # 2. Always fetch generic POIs for the map UI
            cand['nearby_pois'] = await search_generic_pois(lat, lon, radius_meters=1000)
            
        return candidates, " | ".join(evidence_logs)
