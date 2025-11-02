from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="Third Degree API",
    description="Party RSVP Webapp API",
    version="1.0.0"
)

# CORS middleware for frontend communication
# In production, set ALLOWED_ORIGINS environment variable to your GitHub Pages domain
# Example: ALLOWED_ORIGINS=https://yourusername.github.io,https://yourusername.github.io/thirddegree
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Third Degree API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
from app.routes import auth, parties, rsvp
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(parties.router, prefix="/api/parties", tags=["parties"])
app.include_router(rsvp.router, prefix="/api/rsvp", tags=["rsvp"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
