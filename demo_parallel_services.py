#!/usr/bin/env python3
"""
Demo script showing both Analyze and Reach services working in parallel
"""
import requests
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor

def test_analyze_service(idea):
    """Test the Analyze service"""
    try:
        print(f"🔍 Testing Analyze Service with idea: '{idea}'")
        response = requests.post(
            "http://localhost:8000/analyze",
            json={"idea": idea},
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Analyze Service: SUCCESS")
            data = response.json()
            print(f"   Summary: {data.get('summary', '')[:100]}...")
            return {"service": "analyze", "status": "success", "data": data}
        else:
            print(f"❌ Analyze Service: FAILED ({response.status_code})")
            return {"service": "analyze", "status": "failed", "error": response.text}
            
    except requests.exceptions.ConnectionError:
        print("❌ Analyze Service: Not running (connection refused)")
        return {"service": "analyze", "status": "not_running"}
    except Exception as e:
        print(f"❌ Analyze Service: Error - {e}")
        return {"service": "analyze", "status": "error", "error": str(e)}

def test_reach_service(idea):
    """Test the Reach service"""
    try:
        print(f"🎯 Testing Reach Service with idea: '{idea}'")
        response = requests.post(
            "http://localhost:8001/reach", 
            json={"idea": idea},
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Reach Service: SUCCESS")
            data = response.json()
            posts_count = len(data.get('relevant_posts', []))
            users_count = len(data.get('key_users', []))
            print(f"   Found {posts_count} posts, {users_count} users")
            return {"service": "reach", "status": "success", "data": data}
        else:
            print(f"❌ Reach Service: FAILED ({response.status_code})")
            return {"service": "reach", "status": "failed", "error": response.text}
            
    except requests.exceptions.ConnectionError:
        print("❌ Reach Service: Not running (connection refused)")
        return {"service": "reach", "status": "not_running"}
    except Exception as e:
        print(f"❌ Reach Service: Error - {e}")
        return {"service": "reach", "status": "error", "error": str(e)}

def parallel_test(idea):
    """Run both services in parallel"""
    print("\n" + "="*60)
    print("🚀 PARALLEL SERVICE TEST")
    print("="*60)
    print(f"Testing idea: '{idea}'")
    print("Running both services simultaneously...\n")
    
    start_time = time.time()
    
    # Run both services in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as executor:
        analyze_future = executor.submit(test_analyze_service, idea)
        reach_future = executor.submit(test_reach_service, idea)
        
        # Get results
        analyze_result = analyze_future.result()
        reach_result = reach_future.result()
    
    end_time = time.time()
    total_time = end_time - start_time
    
    print(f"\n⏱️  Total parallel execution time: {total_time:.2f} seconds")
    
    # Summary
    print("\n📊 RESULTS SUMMARY:")
    print("-" * 40)
    
    services_working = 0
    if analyze_result["status"] == "success":
        services_working += 1
        print("✅ Analyze Service: Working perfectly")
    else:
        print(f"❌ Analyze Service: {analyze_result['status']}")
    
    if reach_result["status"] == "success": 
        services_working += 1
        print("✅ Reach Service: Working perfectly")
    else:
        print(f"❌ Reach Service: {reach_result['status']}")
    
    print(f"\n🎯 {services_working}/2 services operational")
    
    if services_working == 2:
        print("🎉 PERFECT! Both services are independent and working in parallel!")
    elif services_working == 1:
        print("⚠️  One service is down, but the other continues working (fault tolerance!)")
    else:
        print("🔧 Both services need attention. Check if they're running.")
    
    return analyze_result, reach_result

def check_service_health():
    """Check if services are running"""
    print("🏥 HEALTH CHECK")
    print("-" * 30)
    
    try:
        analyze_health = requests.get("http://localhost:8000/", timeout=5)
        if analyze_health.status_code == 200:
            print("✅ Analyze Service (port 8000): Healthy")
        else:
            print("⚠️  Analyze Service (port 8000): Responding but unhealthy")
    except:
        print("❌ Analyze Service (port 8000): Not responding")
    
    try:
        reach_health = requests.get("http://localhost:8001/", timeout=5)
        if reach_health.status_code == 200:
            print("✅ Reach Service (port 8001): Healthy")
        else:
            print("⚠️  Reach Service (port 8001): Responding but unhealthy")
    except:
        print("❌ Reach Service (port 8001): Not responding")

if __name__ == "__main__":
    print("🎪 STARTUP LEAD SCOUT - PARALLEL SERVICES DEMO")
    print("=" * 60)
    
    # Health check first
    check_service_health()
    
    # Test ideas
    test_ideas = [
        "smart pet collar with GPS tracking",
        "AI-powered meal planning app for busy professionals", 
        "sustainable packaging solution for e-commerce"
    ]
    
    for idea in test_ideas:
        analyze_result, reach_result = parallel_test(idea)
        
        # Optional: Show detailed results
        print(f"\n📄 Want to see detailed results? Check the API responses!")
        input("Press Enter to continue to next test...\n")
    
    print("\n🎊 DEMO COMPLETE!")
    print("This proves both services work independently in parallel!")
    print("\nTo start the services:")
    print("  Terminal 1: python start_analyze.py")
    print("  Terminal 2: python start_reach.py")
    print("\nAPI Documentation:")
    print("  Analyze: http://localhost:8000/docs")
    print("  Reach: http://localhost:8001/docs") 