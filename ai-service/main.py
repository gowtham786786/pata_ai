from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time

from models.schemas import GeocodeRequest, GeocodeResponse
from utils.pincode_loader import load_pincode_data

from services.orchestrator import run_agent_workflow

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event: Load dataset into memory
    print("Initializing AI Service...")
    load_pincode_data()
    yield
    # Shutdown event: Cleanup resources if needed
    print("Shutting down AI Service...")

app = FastAPI(
    title="Pata AI Service",
    description="Multi-agent Location Intelligence for Last-Mile Delivery",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware (Allow Node.js backend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Node.js backend IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Pata AI Multi-Agent Backend"}

@app.post("/api/v1/geocode", response_model=GeocodeResponse)
async def geocode_address(request: GeocodeRequest):
    start_time = time.time()
    
    try:
        # Execute the 5-Agent workflow
        final_result = await run_agent_workflow(request.address)
        
        # Add processing time profiling
        final_result["processingTimeMs"] = int((time.time() - start_time) * 1000)
        
        return final_result
        
    except Exception as e:
        print(f"Error during geocoding: {str(e)}")
        raise HTTPException(status_code=500, detail="AI Processing Failed")
