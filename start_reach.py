#!/usr/bin/env python3
import uvicorn
import sys
import os

if __name__ == "__main__":
    print("🎯 Starting Startup Lead Scout - Reach Service on port 8001...")
    print("API Documentation: http://localhost:8001/docs")
    print("Reach endpoint: http://localhost:8001/reach")
    
    # Run uvicorn with the module path
    uvicorn.run("reach_app.main:app", host="0.0.0.0", port=8001, reload=True) 