from typing import List, Dict, Any, Tuple

class ScoringEngine:
    """
    Scoring Engine
    Generates a 0-100 score based on match heuristics.
    """
    
    def score_candidates(self, candidates: List[Dict[str, Any]], parsed_pincode: str) -> List[Dict[str, Any]]:
        """
        Assigns a score to each candidate.
        Weights:
        - State Match: 10
        - District Match: 15
        - Village/Taluk Match: 25
        - Road Match: 15
        - Pincode Match: 10
        - Landmark Match: 15
        - OSM Importance: 10
        """
        for cand in candidates:
            score = 0
            matches = cand.get('reverse_matches', {})
            
            if matches.get('state_match'): score += 10
            if matches.get('district_match'): score += 15
            if matches.get('village_match'): score += 25
            if matches.get('road_match'): score += 15
            
            # Pincode check
            cand_pincode = cand.get('address', {}).get('postcode')
            if parsed_pincode and cand_pincode and parsed_pincode == cand_pincode:
                score += 10
                matches['pincode_match'] = True
                
            # Landmark check
            if cand.get('landmark_match'):
                score += 15
                
            # OSM Importance (0.0 to 1.0) -> map to 10 points
            importance = cand.get('importance', 0.0)
            score += min(10, int(importance * 10))
            
            cand['total_score'] = min(100, score)
            
        # Sort by highest score
        candidates.sort(key=lambda x: -x.get('total_score', 0))
        return candidates
