import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')

app = FastAPI(title="Startup Lead Scout - Analyze Service", version="1.0.0")

# Allow CORS for local frontend and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now - can be restricted later
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    idea: str

class AnalyzeResponse(BaseModel):
    summary: str
    pain_points: str
    features: str

@app.get("/")
def read_root():
    return {"message": "Analyze Service - Hello World from FastAPI!", "service": "analyze"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_idea(request: AnalyzeRequest):
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="API key not set.")

    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
        "accept": "application/json"
    }

    # 1. Extract keywords from the idea
    extract_keywords_payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "Extract the most relevant keywords and phrases from the following startup idea for searching on Reddit. Return a comma-separated list of keywords only."},
            {"role": "user", "content": request.idea}
        ]
    }
    try:
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=extract_keywords_payload,
            timeout=60
        )
        resp.raise_for_status()
        keywords = resp.json()["choices"][0]["message"]["content"]
        print("Extracted keywords:", keywords)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract keywords: {e}")

    # 2. Search Reddit using those keywords
    reddit_search_payload = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "user",
                "content": f"Search Reddit discussions about {keywords}. I need detailed, specific insights from actual Reddit users including: specific product names mentioned, exact pain points users complain about, detailed feature requests, pricing concerns, brand comparisons, and real user experiences. Focus on finding authentic Reddit conversations from subreddits like r/technology, r/entrepreneur, r/startups, and relevant product-specific communities."
            }
        ],
        "search_domain_filter": ["reddit.com"],
        "web_search_options": {
            "search_context_size": "high"
        }
    }
    try:
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=reddit_search_payload,
            timeout=60
        )
        resp.raise_for_status()
        reddit_results = resp.json()["choices"][0]["message"]["content"]
        print("Reddit search results:", reddit_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search Reddit: {e}")

    # 3. Summarize findings
    summarize_payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "You are an expert Reddit analyst who extracts detailed, actionable insights from Reddit discussions for startup validation. Always structure your response with exactly these three sections: 1. SUMMARY:, 2. PAIN POINTS:, 3. FEATURES:. Include specific product names, brands, pricing details, and exact user quotes when available."},
            {"role": "user", "content": f"Based on this Reddit research about '{request.idea}', provide a comprehensive structured analysis:\n\n{reddit_results}\n\nFormat your response with exactly these three sections:\n\n1. SUMMARY: [Provide detailed overview of Reddit sentiment, specific subreddits mentioned, popular brands/products discussed, and overall market reception. Include specific examples and user experiences.]\n\n2. PAIN POINTS: [List specific, detailed complaints users have mentioned. Include exact issues like battery life, pricing concerns, subscription fees, accuracy problems, etc. Format as bullet points with specific details.]\n\n3. FEATURES: [List detailed feature requests and suggestions from Reddit users. Include specific functionality, integrations, improvements, and innovations users want. Format as bullet points with comprehensive descriptions.]\n\nMake each section rich with specific details, product names, pricing information, and authentic Reddit user insights."}
        ]
    }
    try:
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=summarize_payload,
            timeout=60
        )
        resp.raise_for_status()
        summary_text = resp.json()["choices"][0]["message"]["content"]
        print("Summary text:", summary_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize Reddit findings: {e}")

    # Try to split the summary into sections
    summary, pain_points, features = "", "", ""
    try:
        # Try to parse sections by keywords with improved regex
        import re
        # Look for SUMMARY: section
        summary_match = re.search(r"SUMMARY:\s*(.*?)(?=PAIN POINTS:|FEATURES:|$)", summary_text, re.IGNORECASE | re.DOTALL)
        # Look for PAIN POINTS: section  
        pain_points_match = re.search(r"PAIN POINTS:\s*(.*?)(?=FEATURES:|$)", summary_text, re.IGNORECASE | re.DOTALL)
        # Look for FEATURES: section
        features_match = re.search(r"FEATURES:\s*(.*)", summary_text, re.IGNORECASE | re.DOTALL)
        
        if summary_match:
            summary = summary_match.group(1).strip()
        if pain_points_match:
            pain_points = pain_points_match.group(1).strip()
        if features_match:
            features = features_match.group(1).strip()
            
        # Fallback if structured parsing fails
        if not summary and not pain_points and not features:
            # Try the old parsing method as fallback
            summary_match = re.search(r"summary[\s\-:]*([\s\S]*?)(?:pain points|features|$)", summary_text, re.IGNORECASE)
            pain_points_match = re.search(r"pain points[\s\-:]*([\s\S]*?)(?:features|$)", summary_text, re.IGNORECASE)
            features_match = re.search(r"features[\s\-:]*([\s\S]*)", summary_text, re.IGNORECASE)
            summary = summary_match.group(1).strip() if summary_match else summary_text
            pain_points = pain_points_match.group(1).strip() if pain_points_match else "Not found in results."
            features = features_match.group(1).strip() if features_match else "Not found in results."
    except Exception:
        summary = summary_text
        pain_points = "Could not extract pain points."
        features = "Could not extract features."

    return AnalyzeResponse(
        summary=summary,
        pain_points=pain_points,
        features=features
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 