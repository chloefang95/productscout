# Startup Lead Scout - Separated Services Architecture

## Overview

The application now consists of **two completely independent services** that can run in parallel without any interference:

### 🔍 Analyze Service (Port 8000)
- **Purpose**: Uses Perplexity to analyze Reddit discussions and provide insights
- **Endpoint**: `POST /analyze`
- **Port**: 8000
- **Dependencies**: Only Perplexity API

### 🎯 Reach Service (Port 8001)
- **Purpose**: Uses Perplexity as mastermind + Reddit API to find actual posts, comments, and users
- **Endpoint**: `POST /reach`
- **Port**: 8001
- **Dependencies**: Perplexity API + Reddit API

## Architecture Benefits

✅ **Complete Isolation**: Services cannot interfere with each other  
✅ **Independent Deployment**: Update one service without affecting the other  
✅ **Fault Tolerance**: If one service crashes, the other continues working  
✅ **Parallel Development**: Teams can work on different services simultaneously  
✅ **Easy Scaling**: Scale services independently based on usage  

## Quick Start

### 1. Setup Environment Variables

Both services need their respective `.env` files:

**analyze_app/.env**:
```
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**reach_app/.env**:
```
PERPLEXITY_API_KEY=your_perplexity_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=StartupLeadScout/1.0
```

### 2. Start Services

**Option A: Start Both Services Simultaneously**
```bash
# Terminal 1: Start Analyze Service
python start_analyze.py

# Terminal 2: Start Reach Service  
python start_reach.py
```

**Option B: Start Individual Services**
```bash
# Only Analyze Service
cd analyze_app && python main.py

# Only Reach Service
cd reach_app && python main.py
```

### 3. Test the Services

**Analyze Service**:
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"idea": "smart pet collar with GPS tracking"}'
```

**Reach Service**:
```bash
curl -X POST "http://localhost:8001/reach" \
  -H "Content-Type: application/json" \
  -d '{"idea": "smart pet collar with GPS tracking"}'
```

## Frontend Integration

Update your frontend to call both services:

```javascript
// Analyze feature (left column)
const analyzeResponse = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idea: userInput })
});

// Reach feature (right column)
const reachResponse = await fetch('http://localhost:8001/reach', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idea: userInput })
});
```

## Service Details

### Analyze Service Response
```json
{
  "summary": "Overall sentiment and discussion summary",
  "pain_points": "Specific issues users mentioned",
  "features": "Features users suggested or wanted"
}
```

### Reach Service Response
```json
{
  "relevant_posts": [
    {
      "id": "abc123",
      "title": "Post title",
      "author": "username",
      "subreddit": "pets",
      "score": 150,
      "num_comments": 45,
      "url": "external_url",
      "reddit_url": "https://reddit.com/r/pets/comments/abc123",
      "created_utc": 1640995200.0
    }
  ],
  "active_comments": [...],
  "key_users": [
    {
      "username": "pet_expert",
      "comment_karma": 15000,
      "link_karma": 5000,
      "reddit_url": "https://reddit.com/user/pet_expert",
      "relevance_score": 0.85
    }
  ],
  "search_strategy": "Strategy details",
  "recommended_subreddits": ["pets", "dogs", "technology"]
}
```

## Production Deployment

For production, you can:

1. **Docker Compose** (Recommended):
```yaml
version: '3.8'
services:
  analyze-service:
    build: ./analyze_app
    ports: ["8000:8000"]
  
  reach-service:
    build: ./reach_app
    ports: ["8001:8001"]
```

2. **Separate Servers**: Deploy each service on different servers/containers

3. **Load Balancer**: Use nginx to route `/analyze` → service 1, `/reach` → service 2

## Monitoring

Each service has its own:
- Health check endpoint: `GET /`
- API documentation: `/docs`
- Metrics endpoint (can be added)
- Logs (independent log files)

This architecture ensures your services are truly independent and production-ready! 🚀 
