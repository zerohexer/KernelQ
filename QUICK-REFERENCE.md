# Quick Reference - Problem Creation & Validation

## 🚀 Quick Start - Creating a New Problem

### 1. Create Problem File
```bash
# Create new problem (replace XX with problem number)
cp problems/foundations/template.json problems/foundations/XX.json
```

### 2. Essential Fields to Update
```json
{
  "id": XX,
  "title": "Your Problem Title",
  "description": "What the student needs to implement",
  "starter": "// Template code with TODO comments",
  "validation": {
    "exactRequirements": {
      "functionNames": ["required_init", "required_exit"],
      "variables": [{"name": "my_var", "type": "int", "value": 42}],
      "outputMessages": ["Expected output line"],
      "mustContain": ["#define", "printk"]
    },
    "testCases": [
      // See test case examples below
    ]
  }
}
```

### 3. Generate & Test
```bash
# Generate backend/frontend definitions
npm run problem:build

# Start backend (Terminal 1)
cd backend && npm start

# Start frontend (Terminal 2)
npm start

# Test your problem at http://localhost:3000
```

## 🧪 Test Case Templates

### Code Analysis (Anti-Cheat)
```json
{
  "id": "implementation_check",
  "name": "Proper Implementation",
  "type": "code_analysis",
  "critical": true,
  "expectedSymbols": [
    "#define MY_MACRO(x)",
    "printk(KERN_INFO",
    "my_function("
  ],
  "prohibitedSymbols": [
    "// TODO:",
    "template_pattern"
  ]
}
```

### Output Validation
```json
{
  "id": "output_check",
  "name": "Correct Output",
  "type": "output_match",
  "critical": true,
  "expected": [
    {"pattern": "Exact message", "exact": true},
    {"pattern": "Value: \\d+", "exact": false, "regex": true}
  ]
}
```

### Symbol Checking
```json
{
  "id": "symbol_check",
  "name": "Required Functions",
  "type": "symbol_check",
  "critical": true,
  "expected": ["my_init", "my_exit", "my_variable"]
}
```

## ⚠️ Anti-Cheat Checklist

### ✅ Must Have for Every Problem
- [ ] `code_analysis` test to detect template code
- [ ] `expectedSymbols` with specific implementation patterns
- [ ] `prohibitedSymbols` with TODO comments
- [ ] Critical tests that must pass for acceptance

### Example Anti-Cheat Test
```json
{
  "id": "anti_template",
  "name": "No Template Code",
  "type": "code_analysis", 
  "critical": true,
  "expectedSymbols": [
    "actual_implementation_call()",
    "specific_printk_message"
  ],
  "prohibitedSymbols": [
    "// TODO:",
    "/* TODO",
    "your_implementation_here"
  ]
}
```

## 🔧 Common Patterns

### Macro Problems
```json
"expectedSymbols": [
  "#define SAFE_MACRO(x) do {",
  "} while(0)",
  "SAFE_MACRO(my_var)"
]
```

### Structure Problems  
```json
"expectedSymbols": [
  "struct my_struct {",
  "my_struct.field_name",
  "sizeof(struct my_struct)"
]
```

### Pointer Problems
```json
"expectedSymbols": [
  "int *ptr",
  "*ptr =",
  "&variable"
]
```

## 🐛 Troubleshooting

### Problem: Template Code Shows "Accepted"
**Fix**: Add stricter `code_analysis` tests
```json
{
  "type": "code_analysis",
  "critical": true,
  "expectedSymbols": ["very_specific_implementation"],
  "prohibitedSymbols": ["// TODO:", "template"]
}
```

### Problem: Correct Code Shows "Wrong Answer" 
**Fix**: Check `expectedSymbols` for exact matches
```bash
# Debug backend validation
node -e "
const validator = require('./backend/leetcode-style-validator.js');
// Add debug code here
"
```

### Problem: Backend Timeout
**Fix**: Simplify test cases or increase timeout
```javascript
// In frontend, increase timeout:
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
```

## 📝 Validation Best Practices

### 1. Function Names
```json
"functionNames": ["problem_init", "problem_exit"]
// NOT: ["init", "exit"] (too generic)
```

### 2. Variable Requirements  
```json
"variables": [
  {"name": "specific_name", "type": "int", "value": 42}
]
// Validates both declaration and usage
```

### 3. Output Messages
```json
"outputMessages": [
  "Module loaded successfully",  // Exact match
  "Value: \\d+"                 // Regex pattern
]
```

### 4. Critical vs Non-Critical
```json
"critical": true   // MUST pass for acceptance
"critical": false  // Feedback only, doesn't block
```

## 🔄 Update Workflow

### When Changing Existing Problems
```bash
# 1. Update JSON file
vim problems/foundations/XX.json

# 2. Regenerate definitions
npm run problem:build

# 3. Test changes
# Submit both template and correct code

# 4. Verify anti-cheat works
# Template should show "Wrong Answer"
# Correct code should show "Accepted"
```

### When Adding New Problems
```bash
# 1. Create problem file
# 2. npm run problem:build
# 3. Restart backend/frontend
# 4. Test thoroughly
```

## 📊 Testing Commands

```bash
# Validate problem schema
npm run problem:validate XX

# Build all definitions
npm run problem:build

# Test specific problem
node test-problem-XX.js

# Check backend logs
tail -f backend/logs/validation.log
```

---

## 🎯 Remember

1. **Always test with template code first** - it should fail
2. **Test with correct implementation** - it should pass  
3. **Use specific patterns in expectedSymbols** - avoid generic matches
4. **Set critical: true for anti-cheat tests** - prevents false positives
5. **Include helpful error messages** - guides student learning