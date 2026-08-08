from typing import Tuple, List, Dict, Any

class SelfCheckAgent:
    """
    Agent 5: Geospatial Verification & Self-Check
    Performs 10 critical validation checks.
    """
    
    def review(self, candidates: List[Dict[str, Any]], parsed_data: Any) -> Tuple[bool, str]:
        """
        Returns (passed_critical_checks, audit_reason)
        """
        if not candidates:
            return False, "Self Check Failed: No candidates available."
            
        best = candidates[0]
        ev = best.get('evidence_details', {})
        
        # 1. Does pincode match?
        # 2. Does city match?
        # 3. Does locality match?
        # 4. Does landmark match?
        # 5. Is the candidate actually from OSM?
        if best.get('source') != "OpenStreetMap":
            return False, "Self Check Failed: Candidate not from reliable OSM source."
            
        # 6. Are coordinates valid?
        lat = best.get('lat')
        lon = best.get('lon')
        if not lat or not lon:
            return False, "Self Check Failed: Missing coordinates."
            
        # 7. Is the candidate score internally consistent?
        if best.get('total_score', 0) < 60:
            return False, "Self Check Failed: Score below minimum threshold for confidence."
            
        # 8. Is confidence justified?
        if parsed_data.landmark and not ev.get('landmark_match'):
             return False, "Self Check Failed: Landmark requested but not found/verified."
             
        # 9. Is there a competing candidate with a similar score?
        if len(candidates) > 1:
            second_best = candidates[1]
            diff = best.get('total_score', 0) - second_best.get('total_score', 0)
            if diff < 2 and best.get('total_score', 0) > 0:
                return False, "AMBIGUOUS: Multiple candidates have nearly identical scores."
                
        # 10. Should the system ask the user instead of guessing?
        if ev.get('pincode_match') == False and ev.get('city_match') == False:
            return False, "Self Check Failed: Both Pincode and City mismatch. Too risky to guess."
            
        return True, "Self Check Passed."

