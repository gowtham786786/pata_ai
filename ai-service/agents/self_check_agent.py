from typing import Tuple, List

class SelfCheckAgent:
    """
    Agent 5: Self Check Agent
    Reviews all outputs before final response. Flags conflicting info and never silently guesses.
    """
    
    def review(self, initial_score: int, initial_level: str, is_exact_pincode: bool, is_valid_location: bool, matches: List, parsed_data: dict) -> Tuple[int, str, str]:
        """
        Returns (final_score, final_level, audit_reason)
        """
        
        # Rule 1: No silent guessing. If pincode is completely missing and no landmark is found, fail safely.
        if not is_exact_pincode and not is_valid_location and not matches:
            return 0, "Low", "Self Check Flag: Insufficient data to locate safely. No silent guess allowed."
            
        # Rule 2: If the address had a landmark, but Overpass found literally nothing, it's a conflict
        # between user intent and ground truth. Downgrade High to Medium to be safe.
        if parsed_data.get('landmark') and not matches and initial_level == "High":
             return min(initial_score, 80), "Medium", "Self Check Flag: Initial High confidence downgraded. Landmark specified but not verifiable."
             
        return initial_score, initial_level, "Self Check Agent passed all validations."
