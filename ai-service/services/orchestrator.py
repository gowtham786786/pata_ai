import time
from agents.parser_agent import AddressParserAgent
from agents.pincode_agent import PincodeVerificationAgent
from agents.landmark_agent import LandmarkVerificationAgent
from agents.confidence_agent import ConfidenceScoringAgent
from agents.self_check_agent import SelfCheckAgent

# Instantiate singleton agents
parser_agent = AddressParserAgent()
pincode_agent = PincodeVerificationAgent()
landmark_agent = LandmarkVerificationAgent()
confidence_agent = ConfidenceScoringAgent()
self_check_agent = SelfCheckAgent()

async def run_agent_workflow(raw_address: str) -> dict:
    """
    Orchestrates the 5-Agent workflow for location intelligence, tracking real latency per agent.
    """
    evidence_log = []
    agent_steps = []
    
    def log_step(id, name, t_start, result, detail, status):
        ms = round((time.perf_counter() - t_start) * 1000)
        # Ensure at least 1ms shows for extremely fast operations to prevent 0ms UI glitches
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
    parsed = parser_agent.parse(raw_address)
    parsed_dict = parsed.dict()
    if parsed.pincode: evidence_log.append(f"Agent 1: Extracted Pincode '{parsed.pincode}'.")
    if parsed.landmark: evidence_log.append(f"Agent 1: Extracted Landmark '{parsed.landmark}'.")
    log_step(1, "Agent 1: Address Parser", t1, 
             f"Extracted Pincode: {parsed.pincode or 'None'}", 
             f"Found Landmark: {parsed.landmark or 'None'}", "success")
        
    # --- Agent 2: Pincode Verify ---
    t2 = time.perf_counter()
    fallback_city = parsed.city or parsed.district or parsed.area
    is_valid_pin, pin_data, pin_ev = pincode_agent.verify(parsed.pincode, city=fallback_city)
    evidence_log.append(f"Agent 2: {pin_ev}")
    log_step(2, "Agent 2: Pincode Verifier", t2, 
             f"{pin_ev[:30]}...", pin_ev, "success" if is_valid_pin else "warning")
    
    lat = float(pin_data.get('latitude', 0.0)) if pin_data else 0.0
    lon = float(pin_data.get('longitude', 0.0)) if pin_data else 0.0
    district = pin_data.get('district', parsed.district or 'Unknown') if pin_data else (parsed.district or 'Unknown')
    state = pin_data.get('state', parsed.state or 'Unknown') if pin_data else (parsed.state or 'Unknown')
    
    # --- Agent 3: Landmark Verify ---
    t3 = time.perf_counter()
    matches, lm_ev, fallback_pois = await landmark_agent.verify(parsed.landmark, lat, lon, district)
    evidence_log.append(f"Agent 3: {lm_ev}")
    
    final_lat = lat
    final_lon = lon
    if matches and matches[0]['distance_meters'] < 2000:
         final_lat = float(matches[0]['lat'])
         final_lon = float(matches[0]['lon'])
         evidence_log.append(f"Agent 3: Overriding coords to precise landmark location.")
         
    log_step(3, "Agent 3: Landmark Search", t3, 
             "Landmark correlated via OSM" if matches else "No landmark verified.",
             lm_ev, "success" if matches else "warning")
    
    # Extract boolean flags from pincode agent response
    is_exact_pincode = pin_data.get('is_exact_pincode', False) if pin_data else False
    is_valid_location = is_valid_pin
    
    # --- Agent 4: Confidence Score ---
    t4 = time.perf_counter()
    conf_score, conf_level, conf_ev = confidence_agent.score(is_exact_pincode, is_valid_location, matches)
    evidence_log.append(f"Agent 4: {conf_ev}")
    log_step(4, "Agent 4: Confidence Score", t4, 
             f"Scored: {conf_score}/100 ({conf_level})", conf_ev, "success" if conf_level == "High" else "warning")
    
    # --- Agent 5: Self Check ---
    t5 = time.perf_counter()
    final_score, final_level, check_ev = self_check_agent.review(conf_score, conf_level, is_exact_pincode, is_valid_location, matches, parsed_dict)
    evidence_log.append(f"Agent 5: {check_ev}")
    log_step(5, "Agent 5: Self Check", t5, 
             "Conflicts resolved. Final payload ready.", check_ev, "success")
    
    # Construct normalized address
    norm_parts = []
    if parsed.landmark: norm_parts.append(f"{parsed.landmark}")
    if parsed.area: norm_parts.append(f"{parsed.area}")
    if parsed.road: norm_parts.append(f"{parsed.road}")
    norm_parts.append(district)
    norm_parts.append(state)
    if parsed.pincode: norm_parts.append(parsed.pincode)
    
    normalized = ", ".join([p for p in norm_parts if p]).title()
    
    nearby_landmarks = []
    
    # If we found specific matches, add them
    if matches:
        for m in matches[:3]:
            nearby_landmarks.append({"name": m["name"], "distance_meters": round(m["distance_meters"], 1), "type": m["type"]})
    
    # Always add fallback generic POIs for context
    if fallback_pois:
        for p in fallback_pois[:4]:
            # Don't add if it's already in the list
            if not any(nl["name"] == p["name"] for nl in nearby_landmarks):
                nearby_landmarks.append({"name": p["name"], "distance_meters": round(p["distance_meters"], 1), "type": p["type"]})

    return {
        "originalAddress": raw_address,
        "normalizedAddress": normalized if normalized else "Unable to normalize address.",
        "latitude": final_lat if final_lat != 0.0 else None,
        "longitude": final_lon if final_lon != 0.0 else None,
        "confidence": final_level,
        "confidenceScore": final_score,
        "evidence": evidence_log,
        "agentSteps": agent_steps,
        "nearbyLandmarks": nearby_landmarks
    }
