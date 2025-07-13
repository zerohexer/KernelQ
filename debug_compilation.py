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
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120
    )
    
    result = response.json()
    
    print("=== FULL COMPILATION DETAILS ===")
    if 'compilationResult' in result:
        comp_result = result['compilationResult']
        print(f"Compilation Success: {comp_result.get('success')}")
        print(f"Compilation Error: {comp_result.get('error')}")
        print(f"Compilation Output: {comp_result.get('output')}")
        
        if 'directResults' in comp_result:
            direct = comp_result['directResults']
            print(f"\nDirect Results Success: {direct.get('success')}")
            print(f"Direct Results Stage: {direct.get('stage')}")
            
            if 'compilation' in direct:
                compilation = direct['compilation']
                print(f"\nDirect Compilation Success: {compilation.get('success')}")
                print(f"Direct Compilation Output: {compilation.get('output')}")
                print(f"Direct Compilation Error: {compilation.get('error')}")
                
            if 'testing' in direct:
                testing = direct['testing']
                print(f"\nTesting Success: {testing.get('success')}")
                print(f"Testing Output: {testing.get('output')}")
                print(f"Testing Error: {testing.get('error')}")
    
    # Print raw JSON for debugging
    print("\n=== RAW JSON RESPONSE ===")
    print(json.dumps(result, indent=2))
        
except Exception as e:
    print(f"❌ Error: {e}")