from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities

class DecisionEngine:
    """
    Decision Engine
    Evaluates the highest scored candidate and determines confidence level.
    """
    
    def evaluate(self, candidates: List[Dict[str, Any]], parsed: ExtractedEntities) -> Tuple[Dict[str, Any], str, str]:
        """
        Returns (best_candidate, confidence_level, explanation)
        """
        if not candidates:
            return None, "Manual Review Required", "No candidates found."
            
        best = candidates[0]
        score = best.get('total_score', 0)
        
        if score >= 85:
            confidence = "High" if score < 95 else "Very High"
            explanation = f"Marker placed with {confidence} confidence (Score: {score}/100) using Live Geocoder. Multiple entities matched."
            return best, confidence, explanation
            
        elif score >= 70:
            confidence = "Medium"
            explanation = f"Marker placed with Medium confidence (Score: {score}/100). Some entities matched, but uncertainty remains."
            return best, confidence, explanation
            
        else:
            confidence = "Low"
            explanation = f"System score is too low ({score}/100). Cannot safely place marker without risking high error. Manual Review Required."
            return None, confidence, explanation
