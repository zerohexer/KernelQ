#!/usr/bin/env python3

import json
import requests

# Read the fixed solution code
with open('/home/zerohexer/WebstormProjects/Tmp/KernelOne-main/problem50_solution_fixed.c', 'r') as f:
    code = f.read()

# Prepare the request payload
payload = {
    "code": code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

# Send the request
try:
    print("🚀 Testing Problem 50 fixed solution...")
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
        print(f"Overall Result: {result.get('overallResult', 'Unknown')}")
        print(f"Success: {result.get('success', False)}")
        print(f"Score: {result.get('score', 0)}/{result.get('maxScore', 100)}")
        
        if 'compilationResult' in result:
            comp_result = result['compilationResult']
            print(f"\nCompilation Success: {comp_result.get('success', False)}")
            if 'directResults' in comp_result:
                direct = comp_result['directResults']
                if 'testing' in direct:
                    testing = direct['testing']
                    print(f"Testing Success: {testing.get('success', False)}")
                    if 'output' in testing:
                        print(f"Testing Output (first 500 chars): {testing['output'][:500]}...")
        
        if result.get('success'):
            print("\n🎉 SUCCESS! Problem 50 is now working!")
        else:
            print("\n❌ Still failing - checking details...")
            
    except json.JSONDecodeError:
        print("❌ Non-JSON response:")
        print(response.text[:1000])
        
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {e}")