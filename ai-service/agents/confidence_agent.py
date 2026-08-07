from typing import List, Dict, Any, Tuple

class ConfidenceScoringAgent:
    """
    Agent 4: Confidence Scoring
    Generates a numeric confidence score (0-100) and level (High/Medium/Low).
    """
    
    def score(self, is_exact_pincode: bool, is_valid_location: bool, matches: List[Dict[str, Any]]) -> Tuple[int, str, str]:
        """
        Returns (numeric_score, confidence_level, evidence_string)
        """
        score = 0
        
        # 1. Base Pincode/Location Match
        if is_exact_pincode:
            score += 40
        elif is_valid_location:
            score += 25 # Fallback city match is worth something, but not full points
            
        # 2. Landmark Match Quality
        if matches:
            top_match = matches[0]
            sim = top_match.get('similarity', 0)
            dist = top_match.get('distance_meters', 9999)
            
            # Similarity points (max 30)
            if sim >= 90:
                score += 30
            elif sim >= 70:
                score += 20
            elif sim >= 50:
                score += 10
                
            # Distance points (max 30)
            if dist <= 500:
                score += 30
            elif dist <= 1500:
                score += 20
            elif dist <= 3000:
                score += 10
                
        # Determine Level
        if score >= 85:
            level = "High"
        elif score >= 50:
            level = "Medium"
        else:
            level = "Low"
            
        evidence = f"Confidence Score: {score}/100 ({level}). Exact Pincode: {is_exact_pincode}, Landmark Matches: {len(matches)}."
        return score, level, evidence
