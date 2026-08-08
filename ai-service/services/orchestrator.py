import time
from typing import Optional

from agents.parser_agent import AddressParserAgent
from agents.normalizer_agent import NormalizerAgent
from agents.pincode_agent import PincodeVerificationAgent
from agents.live_geocoder_agent import LiveGeocoderAgent
from agents.reverse_geocoder_agent import ReverseGeocoderAgent
from agents.landmark_verifier import LandmarkVerifierEngine
from agents.scoring_engine import ScoringEngine
from agents.decision_engine import DecisionEngine
from agents.coordinate_validator import CoordinateValidationAgent

# Instantiate singletons
parser_agent = AddressParserAgent()
normalizer_agent = NormalizerAgent()
pincode_agent = PincodeVerificationAgent()
live_geocoder = LiveGeocoderAgent()
reverse_geocoder = ReverseGeocoderAgent()
landmark_verifier = LandmarkVerifierEngine()
scoring_engine = ScoringEngine()
decision_engine = DecisionEngine()
coordinate_validator = CoordinateValidationAgent()

async def run_agent_workflow(raw_address: str, force_source: Optional[str] = None) -> dict:
    """
    Orchestrates the Production-Grade Geocoding Pipeline.
    """
    evidence_log = []
    agent_steps = []
    
    def log_step(id, name, t_start, result, detail, status):
        ms = round((time.perf_counter() - t_start) * 1000)
        if ms == 0: ms = 1
        agent_steps.append({
            "id": id,
            "name": name,
            "result": result,
            "detail": detail,
            "timeMs": ms,
            "status": status
        })

    # --- Agent 1: Parse ---
    t1 = time.perf_counter()
    parsed_raw = parser_agent.parse(raw_address)
    evidence_log.append(f"Agent 1: Extracted entities from raw address.")
    log_step(1, "Agent 1: Address Parser", t1, "Extracted entities...", "Parsed structure from text", "success")

    # --- Agent 1.5: Coordinate Validator ---
    if parsed_raw.latitude and parsed_raw.longitude and not force_source:
        t_val = time.perf_counter()
        is_conflict, conflict_details = await coordinate_validator.validate(parsed_raw.latitude, parsed_raw.longitude, parsed_raw)
        if is_conflict:
            return {
                "status": "conflict",
                "conflictDetails": {
                    "textAddress": raw_address,
                    "reverseAddress": conflict_details.get("reverseAddress"),
                    "coordinates": f"{parsed_raw.latitude}, {parsed_raw.longitude}",
                    "reason": conflict_details.get("reason")
                },
                "originalAddress": raw_address,
                "normalizedAddress": "",
                "latitude": None,
                "longitude": None,
                "locationSource": "Unknown",
                "explanation": "",
                "confidence": "Low",
                "confidenceScore": 0,
                "evidence": [],
                "agentSteps": [],
                "nearbyLandmarks": [],
                "parsedEntities": parsed_raw.model_dump()
            }
        log_step(1.5, "Agent 1.5: Coordinate Validator", t_val, "Validated", "Coordinates match textual address.", "success")

    # --- Agent 2: Normalize ---
    t2 = time.perf_counter()
    parsed = normalizer_agent.normalize(parsed_raw)
    evidence_log.append(f"Agent 2: Normalized spelling, typos, and Hinglish.")
    log_step(2, "Agent 2: Entity Normalizer", t2, "Cleaned entities...", "Spellings and abbreviations normalized", "success")

    # Early Exit for User Coordinates if forced or validated
    if parsed.latitude and parsed.longitude and force_source != "text":
        return {
            "status": "success",
            "originalAddress": raw_address,
            "normalizedAddress": "User Provided Coordinates",
            "latitude": parsed.latitude,
            "longitude": parsed.longitude,
            "locationSource": "Coordinates (User)",
            "explanation": "Marker placed using user-provided GPS coordinates.",
            "confidence": "High",
            "confidenceScore": 100,
            "evidence": evidence_log + ["Decision Engine: Prioritized user coordinates."],
            "agentSteps": agent_steps,
            "nearbyLandmarks": [],
            "parsedEntities": parsed.model_dump()
        }

    # --- Agent 3: Pincode Verify ---
    t3 = time.perf_counter()
    is_valid_pin, pin_data, pin_ev = pincode_agent.verify(parsed.pincode, parsed_district=parsed.district, parsed_state=parsed.state)
    evidence_log.append(f"Agent 3: {pin_ev}")
    log_step(3, "Agent 3: Pincode Validator", t3, "Validated against directory", pin_ev, "success" if is_valid_pin else "warning")
    
    # --- Agent 4: Live Geocoder ---
    t4 = time.perf_counter()
    candidates, geo_ev = await live_geocoder.search(parsed)
    evidence_log.append(f"Agent 4: {geo_ev}")
    log_step(4, "Agent 4: Live Geocoder", t4, f"Found {len(candidates)} candidates", geo_ev, "success" if candidates else "warning")

    # --- Agent 5: Reverse Geocoder ---
    t5 = time.perf_counter()
    candidates, rev_ev = await reverse_geocoder.verify_candidates(candidates, parsed)
    evidence_log.append(f"Agent 5: Reverse geocoded top candidates.")
    if rev_ev: evidence_log.append(rev_ev)
    log_step(5, "Agent 5: Reverse Geocoder", t5, "Verified candidates", "Checked returned state/district against parsed text", "success" if candidates else "warning")

    # --- Landmark Verification Engine ---
    t6 = time.perf_counter()
    candidates, lm_ev = await landmark_verifier.verify(candidates, parsed)
    evidence_log.append(f"Landmark Verifier: {lm_ev}")
    log_step(6, "Landmark Verifier", t6, "Checked Overpass POIs", lm_ev, "success")

    # --- Scoring Engine ---
    t7 = time.perf_counter()
    candidates = scoring_engine.score_candidates(candidates, parsed.pincode)
    log_step(7, "Scoring Engine", t7, "Scored candidates", "Calculated weighted scores based on entity matches", "success")

    # --- Decision Engine ---
    t8 = time.perf_counter()
    best_cand, conf_level, explanation = decision_engine.evaluate(candidates, parsed)
    
    if not best_cand:
        log_step(8, "Decision Engine", t8, "Review Required", explanation, "error")
        
        fallback_lat = None
        fallback_lon = None
        fallback_source = "Unknown"
        fallback_norm = "Unable to safely geocode."
        
        if is_valid_pin and pin_data.get('lat') and pin_data.get('lon'):
            fallback_lat = float(pin_data.get('lat'))
            fallback_lon = float(pin_data.get('lon'))
            fallback_source = "Pincode Centroid"
            fallback_norm = f"Pincode {parsed.pincode} Centroid"
            explanation += " Falling back to pincode centroid."
            
        return {
            "status": "success",
            "originalAddress": raw_address,
            "normalizedAddress": fallback_norm,
            "latitude": fallback_lat,
            "longitude": fallback_lon,
            "locationSource": fallback_source,
            "explanation": explanation,
            "confidence": conf_level,
            "confidenceScore": candidates[0]['total_score'] if candidates else 0,
            "evidence": evidence_log,
            "agentSteps": agent_steps,
            "nearbyLandmarks": [],
            "parsedEntities": parsed.model_dump() if 'parsed' in locals() else parsed_raw.model_dump()
        }
        
    log_step(8, "Decision Engine", t8, f"Selected Best Candidate (Score: {best_cand.get('total_score')})", explanation, "success")

    # Format nearby landmarks for UI
    nearby_landmarks = []
    if best_cand.get('matched_landmark'):
        nearby_landmarks.append(best_cand['matched_landmark'])
        
    for poi in best_cand.get('nearby_pois', []):
        if len(nearby_landmarks) < 4 and not any(nl['name'] == poi['name'] for nl in nearby_landmarks):
            nearby_landmarks.append(poi)

    return {
        "status": "success",
        "originalAddress": raw_address,
        "normalizedAddress": best_cand.get('display_name', 'Resolved Address'),
        "latitude": best_cand.get('lat'),
        "longitude": best_cand.get('lon'),
        "locationSource": best_cand.get('source', 'Live Geocoder'),
        "explanation": explanation,
        "confidence": conf_level,
        "confidenceScore": best_cand.get('total_score'),
        "evidence": evidence_log,
        "agentSteps": agent_steps,
        "nearbyLandmarks": nearby_landmarks,
        "parsedEntities": parsed.model_dump()
    }
