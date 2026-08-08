from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities

class ConfidenceEngine:
    """
    Agent 6: Confidence Engine
    Assigns final confidence and decides whether to guess or ask the user.
    """
    
    def evaluate(self, candidates: List[Dict[str, Any]], parsed: ExtractedEntities, passed_self_check: bool, audit_reason: str) -> Tuple[Dict[str, Any], str, str]:
        """
        Returns (best_candidate, confidence_level, explanation)
        """
        if not candidates:
            return None, "LOW", "No candidates available to geocode safely."
            
        best = candidates[0]
        score = best.get('total_score', 0)
        
        # If Self Check failed, we automatically downgrade to LOW or AMBIGUOUS
        if not passed_self_check:
            if "AMBIGUOUS" in audit_reason:
                return best, "LOW", f"LOW CONFIDENCE / REVIEW REQUIRED: {audit_reason}"
            return best, "LOW", f"LOW CONFIDENCE / REVIEW REQUIRED: {audit_reason}"
            
        if score >= 85:
            confidence = "HIGH"
            explanation = f"Marker placed with HIGH confidence (Score: {score}/100) using OpenStreetMap."
            return best, confidence, explanation
            
        elif score >= 60:
            confidence = "MEDIUM"
            explanation = f"Marker placed with MEDIUM confidence / REVIEW RECOMMENDED (Score: {score}/100)."
            return best, confidence, explanation
            
        else:
            confidence = "LOW"
            explanation = f"LOW CONFIDENCE / REVIEW REQUIRED: Score too low ({score}/100) to safely geocode."
            return best, confidence, explanation
