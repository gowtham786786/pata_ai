import time
import httpx
from typing import Optional
from models.schemas import ExtractedEntities

from agents.parser_agent import AddressParserAgent
from agents.reference_resolver import ReferenceResolverAgent
from agents.osm_landmark_agent import LandmarkSearchAgent
from agents.scoring_engine import ScoringEngine
from agents.self_check_agent import SelfCheckAgent

# Instantiate singletons
parser_agent = AddressParserAgent()
reference_resolver = ReferenceResolverAgent()
landmark_agent = LandmarkSearchAgent()
scoring_engine = ScoringEngine()
self_check = SelfCheckAgent()

async def run_agent_workflow(raw_address: str, force_source: Optional[str] = None) -> dict:
    """
    Orchestrates the 5-Agent Production-Grade Geocoding Pipeline.
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

    is_coordinate = False
    
    # Coordinate Input Flow Check
    if "," in raw_address:
        parts = [p.strip() for p in raw_address.split(',')]
        if len(parts) == 2:
            try:
                lat = float(parts[0])
                lon = float(parts[1])
                is_coordinate = True
            except ValueError:
                pass
                
    if force_source == 'coordinates':
        is_coordinate = True

    if is_coordinate:
        # Pre-Agent Flow: Reverse Geocode to generate parsed representation
        evidence_log.append("Detected raw coordinates input. Executing Reverse-Geocoding.")
        lat, lon = [float(p.strip()) for p in raw_address.split(',')]
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json", headers={"User-Agent": "PataAI-Backend-Agent"})
            data = resp.json() if resp.status_code == 200 else {}
            
        addr = data.get('address', {})
        parsed = ExtractedEntities(
            raw_address=raw_address,
            pincode=addr.get('postcode'),
            city=addr.get('city', addr.get('town', addr.get('county'))),
            locality=addr.get('suburb', addr.get('neighbourhood', addr.get('village')))
        )
        pin_data = {
            'reference_latitude': lat,
            'reference_longitude': lon,
            'ref_pincode': addr.get('postcode'),
            'ref_city': addr.get('city', addr.get('town', addr.get('county'))),
            'ref_locality': addr.get('suburb', addr.get('neighbourhood', addr.get('village')))
        }
        
        t1 = time.perf_counter()
        log_step(1, "Agent 1: Address Parser (Skipped)", t1, "Used Reverse-Geocoding", "Coordinates provided", "success")
        
        t2 = time.perf_counter()
        log_step(2, "Agent 2: Reference Resolver (Skipped)", t2, "Used Explicit Coordinates", "Coordinates provided", "success")
        
    else:
        # --- Agent 1: Address Parser ---
        t1 = time.perf_counter()
        parsed = parser_agent.parse(raw_address)
        evidence_log.append("Agent 1: Extracted and normalized landmark, locality, city and pincode")
        log_step(1, "Agent 1: Address Parser", t1, "Extracted structured fields", "Parsed structured JSON", "success")

        # --- Agent 2: Reference Resolver ---
        t2 = time.perf_counter()
        is_valid_pin, pin_data, pin_ev = reference_resolver.resolve(parsed.pincode, parsed_city=parsed.city, parsed_locality=parsed.locality)
        evidence_log.append(f"Agent 2: {pin_ev}")
        log_step(2, "Agent 2: Reference Resolver", t2, "Reference location established", pin_ev, "success" if is_valid_pin else "warning")

    ref_lat = pin_data.get('reference_latitude')
    ref_lon = pin_data.get('reference_longitude')
    
    # --- Agent 3: Landmark Search Intelligence ---
    t3 = time.perf_counter()
    agent3_result = await landmark_agent.search(parsed, ref_lat, ref_lon)
    candidates = agent3_result.get('candidates', [])
    for ev in agent3_result.get('evidence', []):
        evidence_log.append(f"Agent 3: {ev}")
        
    relation = agent3_result.get('relationship', 'unknown')
    parsed.relation = relation if relation != "unknown" else parsed.relation
    
    log_status = "success" if agent3_result['status'] == 'candidates_found' else ("warning" if agent3_result['status'] == 'not_found' else "error")
    geo_ev = f"Found {len(candidates)} candidate landmarks" if candidates else "No candidates found via OpenStreetMap/Firebase."
    queries_attempted = " and ".join(agent3_result.get('queries_attempted', []))
    log_step(3, "Agent 3: Landmark Search", t3, geo_ev, queries_attempted if queries_attempted else "No queries attempted", log_status)

    # --- Agent 4: Scorer ---
    t4 = time.perf_counter()
    candidates = scoring_engine.score_candidates(candidates, parsed, pin_data)
    best_score = candidates[0].get('total_score', 0) if candidates else 0
    log_step(4, "Agent 4: Scorer", t4, f"Top Candidate scored {best_score}%", "Partial credit 100-point scale applied", "success")

    # --- Agent 5: Self-Check / Composer ---
    t5 = time.perf_counter()
    best_cand, conf_level, audit_reason = self_check.compose(candidates, parsed)
    evidence_log.append(f"Agent 5: {audit_reason}")
    log_step(5, "Agent 5: Composer", t5, f"Confidence: {conf_level} ({best_score}%)", audit_reason, "success" if conf_level == "HIGH" else "warning")

    # Format nearby landmarks for UI
    nearby_landmarks = []
    if candidates:
        for cand in candidates[:5]:
            nearby_landmarks.append({
                "name": cand.get("name", "Unknown"),
                "distance_from_ref": cand.get("distance_meters", 0),
                "type": cand.get("type", "node")
            })

    return {
        "status": "success",
        "originalAddress": raw_address,
        "normalizedAddress": best_cand.get('name', 'Resolved Address') if best_cand else 'Unknown',
        "latitude": best_cand.get('lat') if best_cand else None,
        "longitude": best_cand.get('lon') if best_cand else None,
        "locationSource": best_cand.get('source', 'Unknown') if best_cand else "Unknown",
        "explanation": audit_reason,
        "confidence": conf_level,
        "confidenceScore": best_cand.get('total_score', 0) if best_cand else 0,
        "evidence": evidence_log,
        "agentSteps": agent_steps,
        "nearbyLandmarks": nearby_landmarks,
        "parsedEntities": parsed.model_dump(),
        "candidates": candidates
    }
