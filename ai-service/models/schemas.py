from pydantic import BaseModel, Field
from typing import List, Optional

class GeocodeRequest(BaseModel):
    address: str = Field(..., description="The raw, messy Indian address input by the user")
    force_source: Optional[str] = Field(None, description="Force source: 'coordinates' or 'text'")

class ExtractedEntities(BaseModel):
    raw_address: Optional[str] = None
    landmark: Optional[str] = None
    relation: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    language: Optional[str] = "English"
    transliterated: Optional[bool] = False
    confidence: Optional[float] = 0.0

class LandmarkEvidence(BaseModel):
    name: str
    distance_from_ref: float
    type: str

class GeocodeResponse(BaseModel):
    status: str = Field("success", description="'success' or 'conflict'")
    conflictDetails: Optional[dict] = Field(None, description="Details if status is conflict")
    originalAddress: str
    normalizedAddress: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    locationSource: str = Field("Unknown", description="Coordinates (User), OpenStreetMap, Road Match, Village Match, Pincode Centroid")
    explanation: str = Field("", description="Explain why the marker was placed there.")
    
    confidence: str = Field(..., description="High, Medium, or Low")
    confidenceScore: int = Field(0, description="0-100 confidence score based on match quality")
    evidence: List[str] = []
    agentSteps: List[dict] = []
    nearbyLandmarks: List[LandmarkEvidence] = []
    parsedEntities: dict = Field({}, description="Extracted entities")
    processingTimeMs: Optional[int] = None
