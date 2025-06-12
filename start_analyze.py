#!/usr/bin/env python3
import uvicorn
import sys
import os

if __name__ == "__main__":
    print("🚀 Starting Startup Lead Scout - Analyze Service on port 8000...")
    print("API Documentation: http://localhost:8000/docs")
    print("Analyze endpoint: http://localhost:8000/analyze")
    
    # Run uvicorn with the module path
    uvicorn.run("analyze_app.main:app", host="0.0.0.0", port=8000, reload=True) 