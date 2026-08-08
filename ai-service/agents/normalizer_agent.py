import re
from models.schemas import ExtractedEntities

class NormalizerAgent:
    """
    Agent 2: Entity Extraction & Normalizer.
    Normalizes spellings, abbreviations, typos, and Hinglish.
    """
    
    HINGLISH_MAP = {
        "samne": "opposite",
        "saamne": "opposite",
        "opp": "opposite",
        "opp.": "opposite",
        "pas": "near",
        "paas": "near",
        "piche": "behind",
        "peeche": "behind",
        "bagal me": "next to",
        "bagal": "next to",
        "ke paas": "near",
        "ke samne": "opposite",
        "gali": "street",
        "marg": "road",
        "bhavan": "building",
        "nagar": "area",
        "colony": "area",
        "vihar": "area",
        "gaon": "village",
        "rd": "road",
        "st": "street",
        "dist": "district",
        "distt": "district",
        "ap": "andhra pradesh",
        "ts": "telangana",
        "up": "uttar pradesh",
        "mp": "madhya pradesh"
    }

    def _normalize_string(self, text: str) -> str:
        if not text:
            return text
        text = text.lower().strip()
        # Replace mapping
        for hin, eng in self.HINGLISH_MAP.items():
            text = re.sub(rf'\b{hin}\b', eng, text)
        return text.title()

    def normalize(self, entities: ExtractedEntities) -> ExtractedEntities:
        entities.house_no = self._normalize_string(entities.house_no)
        entities.building = self._normalize_string(entities.building)
        entities.road = self._normalize_string(entities.road)
        entities.landmark = self._normalize_string(entities.landmark)
        entities.locality = self._normalize_string(entities.locality)
        entities.village = self._normalize_string(entities.village)
        entities.taluk = self._normalize_string(entities.taluk)
        entities.district = self._normalize_string(entities.district)
        entities.state = self._normalize_string(entities.state)
        return entities
