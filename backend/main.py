from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import identify

app = FastAPI(
    title="BioDex API",
    description="AI-powered animal identification for BioDex",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(identify.router)


@app.get("/")
async def root():
    return {"message": "BioDex API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
