#!/usr/bin/env python3

import json
import requests

# Read the final solution code
with open('/home/zerohexer/WebstormProjects/Tmp/KernelOne-main/problem50_solution_final.c', 'r') as f:
    code = f.read()

# Prepare the request payload
payload = {
    "code": code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

# Send the request
try:
    print("🚀 Testing Problem 50 FINAL solution...")
    print(f"📝 Code length: {len(code)} characters")
    
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=180
    )
    
    print(f"📊 Response status: {response.status_code}")
    
    result = response.json()
    
    print(f"Overall Result: {result.get('overallResult', 'Unknown')}")
    print(f"Success: {result.get('success', False)}")
    print(f"Score: {result.get('score', 0)}/{result.get('maxScore', 100)}")
    
    if 'compilationResult' in result:
        comp_result = result['compilationResult']
        print(f"\nCompilation Success: {comp_result.get('success', False)}")
        
        if 'directResults' in comp_result and 'testing' in comp_result['directResults']:
            testing = comp_result['directResults']['testing']
            print(f"Testing Success: {testing.get('success', False)}")
            
            if testing.get('success'):
                print("🎉 QEMU Testing PASSED!")
                print(f"Testing output preview: {testing.get('output', '')[:200]}...")
            else:
                print("❌ QEMU Testing failed")
                print(f"Testing error: {testing.get('error', 'Unknown')}")
                
    if result.get('overallResult') == 'ACCEPTED':
        print("\n🎉🎉🎉 PROBLEM 50 SOLVED SUCCESSFULLY! 🎉🎉🎉")
        print("✅ The fix for qemuArgs is working!")
    else:
        print(f"\n⚠️ Still issues: {result.get('overallResult')}")
        
except Exception as e:
    print(f"❌ Error: {e}")