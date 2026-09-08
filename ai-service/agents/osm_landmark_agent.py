import re
import math
from typing import List, Dict, Any, Tuple
from models.schemas import ExtractedEntities
from utils.overpass_client import _execute_overpass_query
try:
    from thefuzz import fuzz
except ImportError:
    try:
        from rapidfuzz import fuzz
    except ImportError:
        class DummyFuzz:
            @staticmethod
            def ratio(a, b): return 100 if str(a).lower() == str(b).lower() else 0
            @staticmethod
            def partial_ratio(a, b): return 100 if str(a).lower() in str(b).lower() or str(b).lower() in str(a).lower() else 0
            @staticmethod
            def token_sort_ratio(a, b): return 100 if str(a).lower() == str(b).lower() else 0
        fuzz = DummyFuzz()

class LandmarkSearchAgent:
    """
    Agent 3: Landmark Search Intelligence (formerly OSMLandmarkAgent)
    Identifies relationships, queries OSM and Firebase Mock, returns best candidates + raw fuzzy scores.
    """
    
    RELATION_KEYWORDS = {
        "opposite": "opposite", "opp": "opposite", "opp.": "opposite", "eduruga": "opposite", "saamne": "opposite",
        "near": "near", "daggara": "near", "paas": "near", "nr": "near", "nr.": "near",
        "behind": "behind", "piche": "behind",
        "next to": "next to", "beside": "beside",
        "in front of": "in front of", "inside": "inside"
    }

    MOCK_FIREBASE_LANDMARKS = [
        {"name": "apollo hospital", "lat": 17.4124, "lon": 78.4143, "source": "Firebase Alias", "distance_meters": 0},
        {"name": "mg road", "lat": 12.9738, "lon": 77.6119, "source": "Firebase Alias", "distance_meters": 0},
        {"name": "ramnagar colony", "lat": 17.4101, "lon": 78.5020, "source": "Firebase Alias", "distance_meters": 0},
    ]

    def _extract_relation_and_landmark(self, raw_landmark: str) -> Tuple[str, str]:
        if not raw_landmark:
            return "unknown", ""
            
        lower_lm = raw_landmark.lower().strip()
        sorted_keys = sorted(self.RELATION_KEYWORDS.keys(), key=len, reverse=True)
        for key in sorted_keys:
            if lower_lm.startswith(key + " "):
                clean = lower_lm[len(key):].strip()
                return self.RELATION_KEYWORDS[key], clean.title()
            elif lower_lm.startswith(key + "."):
                clean = lower_lm[len(key)+1:].strip()
                return self.RELATION_KEYWORDS[key], clean.title()
                
        return "unknown", raw_landmark.strip().title()

    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        R = 6371e3
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    async def search(self, entities: ExtractedEntities, ref_lat: float, ref_lon: float) -> dict:
        evidence = []
        queries_attempted = []
        candidates = []
        
        radius_meters = 5000
        
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
            evidence.append("No landmark or locality provided to search. Continuing pipeline anyway.")
            return {
                "agent": "landmark_search",
                "status": "not_found",
                "relationship": relation,
                "reference_landmark": None,
                "candidates": [],
                "evidence": evidence,
                "queries_attempted": []
            }
            
        evidence.append(f"Parsed landmark '{clean_landmark}' with relationship '{relation}'")
        search_terms = [clean_landmark]
        
        all_results = []
        
        # 1. Search Mock Firebase
        queries_attempted.append("Firebase Alias Table")
        for fb_cand in self.MOCK_FIREBASE_LANDMARKS:
            dist = self._calculate_distance(ref_lat, ref_lon, fb_cand['lat'], fb_cand['lon'])
            if dist <= radius_meters:
                c = dict(fb_cand)
                c['distance_meters'] = dist
                c['source'] = 'Firebase'
                all_results.append(c)

        # 2. Search OSM
        for term in search_terms:
            queries_attempted.append(term)
            safe_term = term.replace('"', '').replace("'", "")
            query = f"""
            [out:json][timeout:10];
            (
              node["name"~"(?i){safe_term}"](around:{radius_meters},{ref_lat},{ref_lon});
              way["name"~"(?i){safe_term}"](around:{radius_meters},{ref_lat},{ref_lon});
              relation["name"~"(?i){safe_term}"](around:{radius_meters},{ref_lat},{ref_lon});
            );
            out center limit 15;
            """
            res = await _execute_overpass_query(query, ref_lat, ref_lon)
            if res:
                all_results.extend(res)
                
        # 3. Deduplicate and Calculate Raw Fuzzy Match
        seen_coords = set()
        for r in all_results:
            coord_key = f"{round(r['lat'], 4)}_{round(r['lon'], 4)}"
            if coord_key not in seen_coords:
                seen_coords.add(coord_key)
                
                # Use rapidfuzz token_sort_ratio for raw match
                name_sim = fuzz.token_sort_ratio(clean_landmark.lower(), r.get('name', '').lower())
                r['match_score'] = name_sim
                if 'source' not in r:
                    r['source'] = 'OpenStreetMap'
                candidates.append(r)
                
        # We NO LONGER discard. Just sort by match score desc
        candidates.sort(key=lambda x: (-x.get('match_score', 0), x.get('distance_meters', 9999)))
        
        evidence.append(f"Found {len(candidates)} candidate landmarks")
        status = "candidates_found" if candidates else "not_found"
        
        return {
            "agent": "landmark_search",
            "status": status,
            "relationship": relation,
            "reference_landmark": clean_landmark,
            "candidates": candidates,
            "evidence": evidence,
            "queries_attempted": queries_attempted
        }
