from pydantic import BaseModel, Field
from typing import List, Optional

class GeocodeRequest(BaseModel):
    address: str = Field(..., description="The raw, messy Indian address input by the user")

class ExtractedEntities(BaseModel):
    landmark: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class LandmarkEvidence(BaseModel):
    name: str
    distance_meters: float
    type: str

class GeocodeResponse(BaseModel):
    originalAddress: str
    normalizedAddress: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: str = Field(..., description="High, Medium, or Low")
    evidence: List[str] = []
    agentSteps: List[dict] = []
    nearbyLandmarks: List[LandmarkEvidence] = []
    processingTimeMs: Optional[int] = None
