from typing import Tuple, List, Dict, Any

class SelfCheckAgent:
    """
    Agent 5: Self-Check / Composer
    Selects the most precise coordinate available, reports the FULL composite score,
    and maps the score to a confidence tier.
    """
    
    def compose(self, candidates: List[Dict[str, Any]], parsed_data: Any) -> Tuple[Dict[str, Any], str, str]:
        """
        Returns (best_candidate, confidence_tier, audit_reason)
        """
        if not candidates:
            return None, "LOW", "Failed to resolve any location."

        # The candidates are already sorted by total_score desc in Agent 4
        best = candidates[0]
        score = best.get('total_score', 0)
        source = best.get('source', 'Unknown')
        
        # Priority order is naturally handled by the scoring engine giving higher points to landmark matches,
        # but if we didn't find a landmark, we fallback to the highest scoring candidate (which is the dummy reference centroid)
        
        # Determine tier
        if score >= 80:
            tier = "HIGH"
            audit_reason = f"High confidence match ({score}/100) using {source}."
        elif score >= 50:
            tier = "MEDIUM"
            audit_reason = f"Medium confidence match ({score}/100) using {source}."
        else:
            tier = "LOW"
            audit_reason = f"LOW CONFIDENCE / MANUAL REVIEW REQUIRED: Score too low ({score}/100). Falling back to {source}."

        return best, tier, audit_reason
