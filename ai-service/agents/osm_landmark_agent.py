import re
from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities
from utils.overpass_client import _execute_overpass_query
from thefuzz import fuzz

class OSMLandmarkAgent:
    """
    Agent 3: OSM Landmark Intelligence
    Identifies relationships, generates multiple queries, searches geographically, and ranks landmarks.
    """
    
    RELATION_KEYWORDS = {
        "opposite": "opposite", "opp": "opposite", "opp.": "opposite", "eduruga": "opposite", "saamne": "opposite",
        "near": "near", "daggara": "near", "paas": "near", "nr": "near", "nr.": "near",
        "behind": "behind", "piche": "behind",
        "next to": "next to", "beside": "beside",
        "in front of": "in front of", "inside": "inside"
    }

    def _extract_relation_and_landmark(self, raw_landmark: str) -> Tuple[str, str]:
        if not raw_landmark:
            return "unknown", ""
            
        lower_lm = raw_landmark.lower().strip()
        
        # Sort keys by length descending to match longest first (e.g., 'next to' before 'near')
        sorted_keys = sorted(self.RELATION_KEYWORDS.keys(), key=len, reverse=True)
        
        for key in sorted_keys:
            if lower_lm.startswith(key + " "):
                clean = lower_lm[len(key):].strip()
                return self.RELATION_KEYWORDS[key], clean.title()
            elif lower_lm.startswith(key + "."):
                clean = lower_lm[len(key)+1:].strip()
                return self.RELATION_KEYWORDS[key], clean.title()
                
        return "unknown", raw_landmark.strip().title()

    def _normalize_name(self, name: str) -> str:
        name_lower = name.lower()
        if "sbi" in name_lower and "bank" not in name_lower:
            name_lower = name_lower.replace("sbi", "state bank of india")
        elif "sbi bank" in name_lower:
            name_lower = name_lower.replace("sbi bank", "state bank of india")
            
        replacements = {
            "rd": "road", "rd.": "road",
            "st": "saint", "st.": "saint",
            "govt": "government", "govt.": "government",
            "hosp": "hospital", "hosp.": "hospital",
            "sch": "school", "sch.": "school"
        }
        
        tokens = name_lower.split()
        normalized_tokens = [replacements.get(t, t) for t in tokens]
        return " ".join(normalized_tokens).title()

    async def search(self, entities: ExtractedEntities, ref_lat: str, ref_lon: str) -> dict:
        evidence = []
        queries_attempted = []
        candidates = []
        
        if not ref_lat or not ref_lon:
            return {
                "agent": "landmark_search",
                "status": "error",
                "relationship": "unknown",
                "reference_landmark": entities.landmark,
                "candidates": [],
                "evidence": ["No reference coordinates available to search OSM."],
                "queries_attempted": []
            }

        lat = float(ref_lat)
        lon = float(ref_lon)
        radius_meters = 5000  # Expand to 5km to ensure we find landmarks
        
        # 1. Parse Landmark and Relation
        relation = entities.relation or "unknown"
        clean_landmark = ""
        
        if entities.landmark:
            extracted_rel, extracted_lm = self._extract_relation_and_landmark(entities.landmark)
            if extracted_rel != "unknown":
                relation = extracted_rel
            clean_landmark = extracted_lm
        
        if not clean_landmark and entities.locality:
            clean_landmark = entities.locality
            
        if not clean_landmark:
            return {
                "agent": "landmark_search",
                "status": "not_found",
                "relationship": relation,
                "reference_landmark": None,
                "candidates": [],
                "evidence": ["No landmark or locality provided to search."],
                "queries_attempted": []
            }
            
        evidence.append(f"Parsed landmark '{clean_landmark}' with relationship '{relation}'")
        
        # 2. Generate Queries
        normalized_lm = self._normalize_name(clean_landmark)
        search_terms = []
        if normalized_lm != clean_landmark:
            search_terms.append(normalized_lm)
            evidence.append(f"Generated normalized query '{normalized_lm}'")
        search_terms.append(clean_landmark)
        
        # Deduplicate
        search_terms = list(dict.fromkeys(search_terms))
        evidence.append(f"Searching within {radius_meters}m radius of validated area")
        
        # 3. Search OSM
        all_results = []
        for term in search_terms:
            queries_attempted.append(term)
            safe_term = term.replace('"', '').replace("'", "")
            query = f"""
            [out:json][timeout:10];
            (
              node["name"~"(?i){safe_term}"](around:{radius_meters},{lat},{lon});
              way["name"~"(?i){safe_term}"](around:{radius_meters},{lat},{lon});
              relation["name"~"(?i){safe_term}"](around:{radius_meters},{lat},{lon});
            );
            out center limit 15;
            """
            res = await _execute_overpass_query(query, lat, lon)
            if res:
                all_results.extend(res)
                
        # 4. Fallback search by category if exact name not found
        if not all_results:
            lower_lm = clean_landmark.lower()
            category = ""
            if "bank" in lower_lm: category = "bank"
            elif "hospital" in lower_lm: category = "hospital"
            elif "school" in lower_lm: category = "school"
            elif "college" in lower_lm: category = "college"
            elif "temple" in lower_lm or "mosque" in lower_lm or "church" in lower_lm: category = "place_of_worship"
            elif "police" in lower_lm: category = "police"
            
            if category:
                queries_attempted.append(f"category:{category}")
                evidence.append(f"Name search failed. Triggered category fallback: '{category}'")
                fallback_query = f"""
                [out:json][timeout:10];
                (
                  node["amenity"~"{category}"](around:{radius_meters},{lat},{lon});
                  way["amenity"~"{category}"](around:{radius_meters},{lat},{lon});
                );
                out center limit 15;
                """
                res = await _execute_overpass_query(fallback_query, lat, lon)
                if res:
                    all_results.extend(res)
        
        # 5. Deduplicate and Rank Results
        seen_coords = set()
        for r in all_results:
            # Round coords to 4 decimals to deduplicate very close points (approx 10 meters)
            coord_key = f"{round(r['lat'], 4)}_{round(r['lon'], 4)}"
            if coord_key not in seen_coords:
                seen_coords.add(coord_key)
                name_sim = fuzz.token_sort_ratio(normalized_lm.lower(), r.get('name', '').lower())
                r['match_score'] = name_sim
                candidates.append(r)
                
        if not candidates:
            evidence.append("No reliable OSM candidate found in the validated search area.")
            return {
                "agent": "landmark_search",
                "status": "not_found",
                "relationship": relation,
                "reference_landmark": clean_landmark,
                "candidates": [],
                "evidence": evidence,
                "queries_attempted": queries_attempted
            }
            
        # Sort candidates by match_score desc, then distance asc
        candidates.sort(key=lambda x: (-x.get('match_score', 0), x.get('distance_meters', 9999)))
        
        evidence.append(f"Found {len(candidates)} candidate landmarks")
        
        best_cand = candidates[0]
        evidence.append(f"Ranked '{best_cand.get('name', 'Unknown')}' as top candidate")
        evidence.append(f"Distance from reference coordinate: {round(best_cand.get('distance_meters', 0)/1000, 2)} km")
        evidence.append("Landmark consistency: HIGH" if best_cand.get('match_score', 0) > 80 else "Landmark consistency: MEDIUM")
        
        return {
            "agent": "landmark_search",
            "status": "candidates_found",
            "relationship": relation,
            "reference_landmark": clean_landmark,
            "candidates": candidates,
            "evidence": evidence,
            "queries_attempted": queries_attempted
        }
