from typing import List, Dict, Any, Tuple

class ConfidenceScoringAgent:
    """
    Agent 4: Confidence Scoring
    Generates a confidence score (High/Medium/Low) based on the evidence collected.
    """
    
    def score(self, pincode_valid: bool, matches: List[Dict[str, Any]]) -> Tuple[str, str]:
        """
        Returns (confidence_level, evidence_string)
        """
        # Logic Matrix:
        # High: Pincode Valid AND Landmark found within 1000m
        # Medium: Pincode Valid BUT no landmark OR Landmark found but distance > 1000m
        # Low: Pincode Invalid
        
        if not pincode_valid:
            return "Low", "Confidence penalized to Low: Invalid or missing pincode."
            
        if not matches:
            return "Medium", "Confidence is Medium: Valid pincode, but no confirming local landmark found."
            
        closest_distance = matches[0]['distance_meters']
        
        if closest_distance <= 1500.0:
            return "High", f"Confidence is High: Verified pincode and matching landmark is very close ({closest_distance}m)."
        else:
            return "Medium", f"Confidence is Medium: Landmark found but relatively far ({closest_distance}m) from pincode centroid."
