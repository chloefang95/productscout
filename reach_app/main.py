import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional
import requests

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
REDDIT_CLIENT_ID = os.getenv('REDDIT_APP_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_APP_SECRET')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'StartupLeadScout/1.0')

app = FastAPI(title="Startup Lead Scout - Reach Service", version="1.0.0")

# Allow CORS for local frontend and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReachRequest(BaseModel):
    idea: str

class RedditPost(BaseModel):
    id: str
    title: str
    author: str
    subreddit: str
    score: int
    num_comments: int
    url: str
    reddit_url: str
    created_utc: float
    selftext: Optional[str] = None

class RedditComment(BaseModel):
    id: str
    author: str
    body: str
    score: int
    subreddit: str
    post_title: str
    reddit_url: str
    created_utc: float

class RedditUser(BaseModel):
    username: str
    comment_karma: int
    link_karma: int
    created_utc: float
    reddit_url: str
    is_verified: bool
    relevance_score: float

class ReachResponse(BaseModel):
    relevant_posts: List[RedditPost]
    active_comments: List[RedditComment]
    key_users: List[RedditUser]
    search_strategy: str
    recommended_subreddits: List[str]

class PerplexityClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "accept": "application/json"
        }
    
    def get_search_strategy(self, idea: str) -> dict:
        """Use Perplexity to determine Reddit search strategy"""
        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": """You are a Reddit search strategist. Given a startup idea, determine the best search approach.
                
                Return a JSON response with:
                1. "keywords": comma-separated search terms
                2. "subreddits": list of 5-10 relevant subreddit names (without r/ prefix)
                3. "user_personas": types of users to look for
                4. "search_timeframe": "week", "month", or "year"
                5. "content_types": "posts", "comments", or "both"
                
                Example format:
                {
                  "keywords": "smart pet collar, GPS tracking, pet health",
                  "subreddits": ["dogs", "cats", "pets", "pettech", "dogtraining"],
                  "user_personas": ["pet owners", "veterinarians", "pet tech enthusiasts"],
                  "search_timeframe": "month", 
                  "content_types": "both"
                }"""},
                {"role": "user", "content": f"Create a Reddit search strategy for this startup idea: {idea}"}
            ]
        }
        
        try:
            resp = requests.post(
                "https://api.perplexity.ai/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60
            )
            resp.raise_for_status()
            result = resp.json()["choices"][0]["message"]["content"]
            
            # Try to extract JSON from the response
            import json
            import re
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback parsing
                return {
                    "keywords": result.split('\n')[0] if result else idea,
                    "subreddits": ["startups", "entrepreneur", "business"],
                    "user_personas": ["entrepreneurs", "early adopters"],
                    "search_timeframe": "month",
                    "content_types": "both"
                }
        except Exception as e:
            print(f"Strategy generation failed: {e}")
            # Fallback strategy
            return {
                "keywords": idea,
                "subreddits": ["startups", "entrepreneur", "business"],
                "user_personas": ["entrepreneurs", "early adopters"],
                "search_timeframe": "month",
                "content_types": "both"
            }

class RedditClient:
    def __init__(self, client_id: str, client_secret: str, user_agent: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.user_agent = user_agent
        self.access_token = None
        self.base_url = "https://www.reddit.com"
        self._authenticate()
    
    def _authenticate(self):
        """Get Reddit OAuth token"""
        auth_url = "https://www.reddit.com/api/v1/access_token"
        auth = (self.client_id, self.client_secret)
        headers = {"User-Agent": self.user_agent}
        data = {"grant_type": "client_credentials"}
        
        try:
            resp = requests.post(auth_url, auth=auth, headers=headers, data=data)
            resp.raise_for_status()
            self.access_token = resp.json()["access_token"]
        except Exception as e:
            print(f"Reddit authentication failed: {e}")
    
    def _make_request(self, endpoint: str, params: dict = None):
        """Make authenticated Reddit API request"""
        if not self.access_token:
            self._authenticate()
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": self.user_agent
        }
        
        url = f"https://oauth.reddit.com{endpoint}"
        try:
            resp = requests.get(url, headers=headers, params=params or {})
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"Reddit API request failed: {e}")
            return None
    
    def search_posts(self, query: str, subreddit: str = None, limit: int = 25, time_filter: str = "month"):
        """Search Reddit posts"""
        if subreddit:
            endpoint = f"/r/{subreddit}/search"
            params = {"q": query, "restrict_sr": "true", "sort": "hot", "t": time_filter, "limit": limit}
        else:
            endpoint = "/search"
            params = {"q": query, "sort": "hot", "t": time_filter, "limit": limit, "type": "link"}
        
        data = self._make_request(endpoint, params)
        if not data:
            return []
        
        posts = []
        for item in data.get("data", {}).get("children", []):
            post_data = item.get("data", {})
            posts.append(RedditPost(
                id=post_data.get("id", ""),
                title=post_data.get("title", ""),
                author=post_data.get("author", ""),
                subreddit=post_data.get("subreddit", ""),
                score=post_data.get("score", 0),
                num_comments=post_data.get("num_comments", 0),
                url=post_data.get("url", ""),
                reddit_url=f"https://reddit.com{post_data.get('permalink', '')}",
                created_utc=post_data.get("created_utc", 0),
                selftext=post_data.get("selftext", "")
            ))
        return posts
    
    def get_user_info(self, username: str):
        """Get Reddit user information"""
        endpoint = f"/user/{username}/about"
        data = self._make_request(endpoint)
        
        if not data or "data" not in data:
            return None
        
        user_data = data["data"]
        return RedditUser(
            username=username,
            comment_karma=user_data.get("comment_karma", 0),
            link_karma=user_data.get("link_karma", 0),
            created_utc=user_data.get("created_utc", 0),
            reddit_url=f"https://reddit.com/user/{username}",
            is_verified=user_data.get("is_verified", False),
            relevance_score=0.0  # Will be calculated by Perplexity
        )

@app.get("/")
def read_root():
    return {"message": "Reach Service - Hello World from FastAPI!", "service": "reach"}

@app.post("/reach", response_model=ReachResponse)
def reach_analysis(request: ReachRequest):
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="Perplexity API key not set.")
    
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Reddit API credentials not set.")
    
    # Initialize clients
    perplexity = PerplexityClient(PERPLEXITY_API_KEY)
    reddit = RedditClient(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT)
    
    try:
        # Step 1: Get search strategy from Perplexity
        strategy = perplexity.get_search_strategy(request.idea)
        print(f"Search strategy: {strategy}")
        
        # Step 2: Search Reddit using the strategy
        all_posts = []
        for subreddit in strategy.get("subreddits", [])[:5]:  # Limit to avoid rate limits
            posts = reddit.search_posts(
                query=strategy.get("keywords", request.idea),
                subreddit=subreddit,
                limit=10,
                time_filter=strategy.get("search_timeframe", "month")
            )
            all_posts.extend(posts)
        
        # Step 3: Also do global search
        global_posts = reddit.search_posts(
            query=strategy.get("keywords", request.idea),
            limit=15,
            time_filter=strategy.get("search_timeframe", "month")
        )
        all_posts.extend(global_posts)
        
        # Step 4: Get unique users from posts
        unique_users = set()
        for post in all_posts:
            if post.author and post.author != "[deleted]":
                unique_users.add(post.author)
        
        # Step 5: Get user information for top users (limit to avoid rate limits)
        key_users = []
        for username in list(unique_users)[:10]:
            user_info = reddit.get_user_info(username)
            if user_info:
                key_users.append(user_info)
        
        # For now, return mock comments - will implement comment search in next iteration
        active_comments = []
        
        return ReachResponse(
            relevant_posts=all_posts[:20],  # Limit results
            active_comments=active_comments,
            key_users=key_users,
            search_strategy=f"Strategy: {strategy.get('keywords', '')} in subreddits: {', '.join(strategy.get('subreddits', []))}",
            recommended_subreddits=strategy.get("subreddits", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reach analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 