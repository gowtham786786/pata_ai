import time
from typing import Optional

from agents.parser_agent import AddressParserAgent
from agents.pincode_agent import PincodeVerificationAgent
from agents.osm_landmark_agent import OSMLandmarkAgent
from agents.scoring_engine import ScoringEngine
from agents.self_check_agent import SelfCheckAgent
from agents.confidence_engine import ConfidenceEngine

# Instantiate singletons
parser_agent = AddressParserAgent()
pincode_agent = PincodeVerificationAgent()
osm_agent = OSMLandmarkAgent()
scoring_engine = ScoringEngine()
self_check = SelfCheckAgent()
confidence_engine = ConfidenceEngine()

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

    # --- Agent 1: Address Parser ---
    t1 = time.perf_counter()
    parsed = parser_agent.parse(raw_address)
    evidence_log.append("Agent 1: Extracted landmark, locality, city and pincode")
    log_step(1, "Agent 1: Address Parser", t1, "Extracted landmark, locality, city and pincode", "Parsed structured JSON", "success")

    # --- Agent 2: Pincode Verifier ---
    t2 = time.perf_counter()
    is_valid_pin, pin_data, pin_ev = pincode_agent.verify(parsed.pincode, parsed_city=parsed.city, parsed_state=parsed.state)
    evidence_log.append(f"Agent 2: {pin_ev}")
    log_step(2, "Agent 2: Pincode Verifier", t2, "Pincode validated", pin_ev, "success" if is_valid_pin else "warning")
    
    ref_lat = pin_data.get('reference_latitude')
    ref_lon = pin_data.get('reference_longitude')
    
    if not ref_lat or not ref_lon:
        log_step(3, "Agent 3: OSM Landmark Finder", t2, "Skipped", "No reference coordinate available", "error")
        return build_fallback_response(raw_address, parsed, agent_steps, evidence_log, "No reference pincode coordinate available.")

    # --- Agent 3: OSM Landmark Finder ---
    t3 = time.perf_counter()
    candidates, geo_ev = await osm_agent.search(parsed, ref_lat, ref_lon)
    evidence_log.append(f"Agent 3: {geo_ev}")
    log_step(3, "Agent 3: OSM Landmark Finder", t3, f"Found {len(candidates)} candidate landmarks", geo_ev, "success" if candidates else "warning")
    
    if not candidates:
        return build_fallback_response(raw_address, parsed, agent_steps, evidence_log, "No candidates found via Overpass OSM.", float(ref_lat), float(ref_lon))

    # --- Agent 4: Candidate Ranker / Scoring Engine ---
    t4 = time.perf_counter()
    candidates = scoring_engine.score_candidates(candidates, parsed, float(ref_lat), float(ref_lon))
    best_score = candidates[0].get('total_score', 0)
    log_step(4, "Agent 4: Candidate Ranker", t4, f"Candidate scored {best_score}%", "Deterministically scored candidates", "success")

    # --- Agent 5: Geospatial Verifier / Self Check ---
    t5 = time.perf_counter()
    passed_check, audit_reason = self_check.review(candidates, parsed)
    evidence_log.append(f"Agent 5: {audit_reason}")
    log_step(5, "Agent 5: Geospatial Verifier", t5, "Location evidence verified" if passed_check else audit_reason, "Checked consistency", "success" if passed_check else "warning")

    # --- Agent 6: Confidence Engine ---
    t6 = time.perf_counter()
    best_cand, conf_level, explanation = confidence_engine.evaluate(candidates, parsed, passed_check, audit_reason)
    log_step(6, "Agent 6: Confidence Engine", t6, f"Confidence: {conf_level} ({best_score}%)", explanation, "success" if conf_level == "HIGH" else "warning")

    # --- Agent 7: Response Builder ---
    t7 = time.perf_counter()
    log_step(7, "Agent 7: Response Builder", t7, "Final location generated", "Pipeline complete", "success")

    # Format nearby landmarks for UI
    nearby_landmarks = candidates[:5] if candidates else []

    return {
        "status": "success",
        "originalAddress": raw_address,
        "normalizedAddress": best_cand.get('name', 'Resolved Address') if best_cand else 'Unknown',
        "latitude": best_cand.get('lat') if best_cand else None,
        "longitude": best_cand.get('lon') if best_cand else None,
        "locationSource": best_cand.get('source', 'OpenStreetMap') if best_cand else "Unknown",
        "explanation": explanation,
        "confidence": conf_level,
        "confidenceScore": best_cand.get('total_score', 0) if best_cand else 0,
        "evidence": evidence_log,
        "agentSteps": agent_steps,
        "nearbyLandmarks": nearby_landmarks,
        "parsedEntities": parsed.model_dump(),
        "candidates": candidates
    }

def build_fallback_response(raw_address: str, parsed, agent_steps, evidence_log, reason: str, ref_lat: float = None, ref_lon: float = None):
    return {
        "status": "success",
        "originalAddress": raw_address,
        "normalizedAddress": "Approximate Location (Pincode Centroid)" if ref_lat else "Unable to safely geocode",
        "latitude": ref_lat,
        "longitude": ref_lon,
        "locationSource": "Pincode Centroid" if ref_lat else "Unknown",
        "explanation": f"LOW CONFIDENCE / REVIEW REQUIRED: {reason} Showing approximate location based on Pincode." if ref_lat else f"LOW CONFIDENCE / REVIEW REQUIRED: {reason}",
        "confidence": "LOW",
        "confidenceScore": 30 if ref_lat else 0,
        "evidence": evidence_log,
        "agentSteps": agent_steps,
        "nearbyLandmarks": [{
            "name": "Pincode Centroid (Fallback)",
            "distance_from_ref": 0,
            "type": "node"
        }] if ref_lat else [],
        "parsedEntities": parsed.model_dump(),
        "candidates": [{
            "name": "Pincode Centroid (Fallback)",
            "lat": ref_lat,
            "lon": ref_lon,
            "distance_from_ref": 0,
            "source": "Pincode Centroid",
            "type": "node",
            "total_score": 30
        }] if ref_lat else []
    }
