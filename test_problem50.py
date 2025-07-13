#!/usr/bin/env python3

import json
import requests

# Read the solution code
with open('/home/zerohexer/WebstormProjects/Tmp/KernelOne-main/problem50_solution.c', 'r') as f:
    code = f.read()

# Prepare the request payload
payload = {
    "code": code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

# Send the request
try:
    print("🚀 Testing Problem 50 solution...")
    print(f"📝 Code length: {len(code)} characters")
    
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120
    )
    
    print(f"📊 Response status: {response.status_code}")
    
    # Try to parse JSON response
    try:
        result = response.json()
        print("✅ JSON response received:")
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError:
        print("❌ Non-JSON response:")
        print(response.text)
        
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {e}")