# 🚀 Kernel Learning Problem Framework

**Easy problem creation and management for the Kernel Learning platform**

## 🎯 **What This Framework Solves**

Previously, creating or editing problems required:
- ❌ **Dual editing**: Manual changes to both `UltimateKernelAcademy.js` (918KB) and `backend/leetcode-style-validator.js`
- ❌ **Manual sync**: Keeping frontend requirements in sync with backend validation
- ❌ **Error-prone**: Easy to miss updates in either frontend or backend
- ❌ **Hard to scale**: Adding 100+ problems to massive files

Now with this framework:
- ✅ **Single source**: One JSON file per problem
- ✅ **Auto-sync**: Generators create both frontend and backend code
- ✅ **Easy editing**: Simple CLI tools and clear file structure
- ✅ **Version control**: Individual problem files for better git history

---

## 📁 **Directory Structure**

```
problems/
├── schema.json                 # JSON schema for problem validation
├── foundations/               # Beginner problems
│   ├── 001-hello-world.json
│   ├── 002-variables.json
│   └── ...
├── intermediate/              # Intermediate problems
├── advanced/                  # Advanced problems
├── expert/                    # Expert problems
├── professional/              # Professional problems
├── kernel_core/               # Core kernel subsystems
├── drivers/                   # Device driver development
├── synchronization/           # Concurrency and locking
├── filesystems/               # Filesystem development
├── memory_mgmt/               # Memory management
├── networking/                # Network programming
├── performance/               # Performance optimization
└── security/                  # Security modules

scripts/
├── generate-frontend.js       # Generates frontend code
└── generate-backend.js        # Generates backend code

tools/
└── problem-cli.js             # CLI for problem management
```

---

## 🔧 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Create a New Problem**
```bash
npm run problem:create
```

### **3. List All Problems**
```bash
npm run problem:list
```

### **4. Edit Existing Problem**
```bash
npm run problem:edit
```

### **5. Generate Frontend/Backend Code**
```bash
npm run problem:build
```

---

## 📝 **Problem JSON Format**

Each problem is defined in a single JSON file with this structure:

### **Basic Problem Structure**
```json
{
  "id": 1,
  "title": "Hello Kernel World",
  "phase": "foundations",
  "difficulty": 1,
  "xp": 10,
  "description": "Create your first kernel module...",
  "starter": "#include <linux/module.h>\\n...",
  "concepts": ["module_init", "module_exit", "printk"],
  "skills": ["Basic kernel programming", "Module lifecycle"],
  
  "inputOutput": {
    "expectedOutput": ["Hello from the kernel!", "Goodbye from the kernel!"],
    "requirements": [
      "Use exact function names: hello_init, hello_exit",
      "Print exact messages for validation",
      "Must include MODULE_LICENSE(\"GPL\")"
    ]
  },
  
  "validation": {
    "exactRequirements": {
      "functionNames": ["hello_init", "hello_exit"],
      "variables": [
        { "name": "my_var", "type": "int", "value": 42 }
      ],
      "outputMessages": [
        "Hello from the kernel!",
        "Goodbye from the kernel!"
      ],
      "requiredIncludes": ["linux/module.h", "linux/kernel.h"],
      "mustContain": ["printk"],
      "moduleInfo": {
        "license": "GPL"
      }
    },
    "testCases": [
      {
        "id": "exact_functions",
        "name": "Exact Function Names",
        "type": "symbol_check",
        "critical": true,
        "expected": ["hello_init", "hello_exit"]
      }
    ]
  },
  
  "multiPart": {
    "part": 1,
    "totalParts": 4,
    "nextProblemId": 14,
    "previousProblemId": null
  }
}
```

---

## 🛠️ **CLI Commands**

### **Create New Problem**
```bash
npm run problem:create
```
Interactive wizard that guides you through:
- Problem title and description
- Phase and difficulty selection
- Starter code input
- Validation requirements
- Test case creation

### **Edit Existing Problem**
```bash
npm run problem:edit
```
- Prompts for problem ID
- Shows current values
- Allows editing of any field
- Validates changes

### **List All Problems**
```bash
npm run problem:list
```
Shows table of all problems with:
- ID, Phase, Difficulty, Title
- Total problem count
- Organized by phase

### **Validate All Problems**
```bash
npm run problem:validate
```
- Validates all JSON files against schema
- Reports errors and warnings
- Shows validation summary

### **Build Frontend/Backend**
```bash
npm run problem:build            # Build both
npm run problem:build-frontend   # Frontend only
npm run problem:build-backend    # Backend only
```

---

## 🔗 **Multi-Part Problem Series**

The framework supports multi-part problems with **synced progression** - each part builds on the previous part's completed solution.

### **Multi-Part Schema**
```json
{
  "id": 12,
  "title": "Device Driver Development - Part 1: Basic Module",
  "problemId": "device_driver_part1",
  "multiPart": {
    "part": 1,
    "totalParts": 4,
    "previousProblemId": null,
    "nextProblemId": 13
  },
  "starter": "// Fresh starter code for Part 1"
}
```

### **Synced Progression Example**

**Part 1 (Fresh Start):**
```c
#include <linux/module.h>
#include <linux/kernel.h>

// TODO: Create init function
// TODO: Create exit function
```

**Part 2 (Builds on Part 1):**
```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>

// From Part 1 - COMPLETED CODE:
static int __init mydevice_init(void) {
    printk(KERN_INFO "MyDevice driver loaded\n");
    
    // TODO: Add device registration here
    return 0;
}

static void __exit mydevice_exit(void) {
    printk(KERN_INFO "MyDevice driver unloaded\n");
}
```

**Part 3 (Builds on Parts 1-2):**
```c
// From Parts 1-2 - COMPLETED CODE:
[All previous working code included]

// Part 3 additions:
// TODO: Add file operations
// TODO: Add cdev management
```

### **Creating Multi-Part Series**

1. **Create Part 1** (fresh start):
```bash
node tools/problem-cli.js create foundations "Driver - Part 1: Basic"
```

2. **Solve Part 1** yourself to get the completed solution

3. **Create Part 2** using Part 1's solution as starter code:
```json
{
  "multiPart": {
    "part": 2,
    "totalParts": 4,
    "previousProblemId": 12,
    "nextProblemId": 14
  },
  "starter": "// From Part 1 - COMPLETED CODE:\n[Part 1 solution]\n\n// Part 2 additions:\n// TODO: New features"
}
```

4. **Repeat** for remaining parts

### **Multi-Part Benefits**
- 🔄 **Real Development Feel**: Mimics incremental software development
- 🎯 **Focus on New Concepts**: Students don't rewrite existing code
- 🚀 **Confidence Building**: Success in previous parts carries forward
- 💡 **Professional Workflow**: Teaches how real drivers are developed
- 🔗 **Automatic Navigation**: Frontend shows "Part X/Y" and next/previous buttons

---

## 🔄 **How It Works**

### **1. Problem Definition**
- Each problem is a JSON file in the appropriate phase directory
- JSON schema validates the structure
- Auto-generated IDs prevent conflicts

### **2. Frontend Generation**
The `generate-frontend.js` script:
- Loads all problem JSON files
- Validates each against the schema
- Converts validation requirements to frontend `inputOutput.requirements`
- Generates `src/generated-problems.js`

### **3. Backend Generation**
The `generate-backend.js` script:
- Loads problems with validation requirements
- Converts to backend test definition format
- Generates `backend/generated-test-definitions.js`
- Creates integration patch for validator

### **4. Auto-Sync**
- Frontend `inputOutput.requirements` are generated from `validation.exactRequirements`
- Backend test definitions are generated from the same source
- Ensures perfect sync between frontend and backend

---

## 📊 **Frontend Integration**

### **Generated File**
`src/generated-problems.js` contains:
```javascript
// Auto-generated from problems/ directory
// DO NOT EDIT THIS FILE DIRECTLY - Edit problems/*.json instead

const problemBank = [
  {
    id: 1,
    title: "Hello Kernel World",
    difficulty: 1,
    xp: 10,
    phase: "foundations",
    description: "Create your first kernel module...",
    starter: "#include <linux/module.h>...",
    concepts: ["module_init", "module_exit"],
    skills: ["Basic kernel programming"],
    inputOutput: {
      expectedOutput: ["Hello from the kernel!", "Goodbye from the kernel!"],
      requirements: [
        "Use required function names: hello_init, hello_exit",
        "Print exact message format for backend validation compatibility",
        "Must include: linux/module.h, linux/kernel.h",
        "Must include MODULE_LICENSE(\"GPL\")"
      ]
    }
  }
  // ... more problems
];

export default problemBank;
```

### **Usage in UltimateKernelAcademy.js**
```javascript
// Replace the existing problemBank with:
import problemBank from "./generated-problems.js";
```

---

## 🔧 **Backend Integration**

### **Generated File**
`backend/generated-test-definitions.js` contains:
```javascript
// Auto-generated from problems/ directory
// DO NOT EDIT THIS FILE DIRECTLY - Edit problems/*.json instead

const generatedTestDefinitions = new Map();

generatedTestDefinitions.set(1, {
    name: 'Hello Kernel World',
    category: 'foundations',
    exactRequirements: {
        functionNames: ['hello_init', 'hello_exit'],
        outputMessages: ['Hello from the kernel!', 'Goodbye from the kernel!'],
        requiredIncludes: ['linux/module.h', 'linux/kernel.h'],
        moduleInfo: { license: 'GPL' }
    },
    testCases: [
        {
            id: 'exact_functions',
            name: 'Exact Function Names',
            type: 'symbol_check',
            critical: true,
            expected: ['hello_init', 'hello_exit']
        }
    ]
});

module.exports = generatedTestDefinitions;
```

### **Integration Steps**

1. **Import in `leetcode-style-validator.js` constructor:**
```javascript
const generatedTestDefinitions = require("./generated-test-definitions.js");
this.loadGeneratedDefinitions(generatedTestDefinitions);
```

2. **Add method to validator class:**
```javascript
loadGeneratedDefinitions(generatedDefinitions) {
    for (const [problemId, definition] of generatedDefinitions) {
        this.testDefinitions.set(problemId, definition);
        console.log(`✅ Loaded generated test definition for problem ${problemId}: ${definition.name}`);
    }
}
```

---

## 🎯 **Problem Validation Types**

### **Test Case Types**
- **`symbol_check`**: Validates required function names exist
- **`output_match`**: Validates expected output messages
- **`variable_check`**: Validates required variable names
- **`code_analysis`**: Validates code patterns and prohibits certain patterns
- **`structure_check`**: Validates module structure and compilation

### **Exact Requirements**
- **`functionNames`**: Required function names (e.g., `["hello_init", "hello_exit"]`)
- **`variables`**: Required variables with type and value
- **`outputMessages`**: Expected dmesg output patterns
- **`requiredIncludes`**: Required header files
- **`mustContain`**: Required code patterns
- **`structures`**: Required struct definitions
- **`moduleInfo`**: Module metadata (license, author, etc.)

---

## 🚀 **Workflow Examples**

### **Adding a New Problem**
```bash
# 1. Create the problem
npm run problem:create

# 2. Edit the generated JSON file if needed
vim problems/foundations/042-new-problem.json

# 3. Generate frontend/backend code
npm run problem:build

# 4. Test the changes
npm run problem:validate
```

### **Editing an Existing Problem**
```bash
# 1. Edit via CLI
npm run problem:edit

# 2. Or edit JSON file directly
vim problems/foundations/001-hello-world.json

# 3. Rebuild
npm run problem:build

# 4. Validate
npm run problem:validate
```

### **Bulk Problem Migration**
```bash
# 1. Extract current problems to JSON format
node scripts/extract-problems.js

# 2. Validate all extracted problems
npm run problem:validate

# 3. Generate new frontend/backend code
npm run problem:build

# 4. Update imports in main files
# Frontend: import problemBank from "./generated-problems.js"
# Backend: Add loadGeneratedDefinitions() call
```

---

## 📋 **Schema Validation**

Problems are validated against `problems/schema.json`:

### **Required Fields**
- `id`: Unique integer identifier
- `title`: Problem title string
- `phase`: Learning phase (foundations, intermediate, etc.)
- `difficulty`: Integer 1-10
- `xp`: Experience points awarded
- `description`: Problem description
- `starter`: Template code

### **Optional Fields**
- `concepts`: Array of learning concepts
- `skills`: Array of skills developed
- `validation`: Backend validation configuration
- `multiPart`: Multi-part problem information
- `frontendTests`: Frontend-only tests
- `legacy`: Legacy compatibility fields

---

## 🔍 **Troubleshooting**

### **Schema Validation Errors**
```bash
# Check specific validation errors
npm run problem:validate

# Common issues:
# - Missing required fields
# - Invalid difficulty range (1-10)
# - Invalid phase name
# - Malformed JSON
```

### **Generation Errors**
```bash
# Check if all problems are valid
npm run problem:validate

# Regenerate with verbose output
DEBUG=1 npm run problem:build
```

### **File Not Found**
```bash
# List all problems to check IDs
npm run problem:list

# Check if problem exists in correct phase directory
ls problems/foundations/
```

---

## 🎛️ **Advanced Usage**

### **Custom Validation**
Add custom test cases to the `validation.testCases` array:

```json
{
  "id": "custom_validation",
  "name": "Custom Check",
  "type": "code_analysis",
  "critical": true,
  "expectedSymbols": ["required_function"],
  "prohibitedSymbols": ["banned_function"]
}
```

### **Multi-Part Problems**
Create problem sequences with the `multiPart` field:

```json
{
  "problemId": "device-driver-sequence",
  "multiPart": {
    "part": 1,
    "totalParts": 4,
    "nextProblemId": 14,
    "previousProblemId": null
  }
}
```

### **Frontend-Only Tests**
Add JavaScript validation for frontend-only checks:

```json
{
  "frontendTests": [
    {
      "name": "Code Structure",
      "checkFunction": "(code) => code.includes('module_init')"
    }
  ]
}
```

---

## 🔧 **Development**

### **Adding New Features**
1. Update `problems/schema.json` with new fields
2. Modify generators in `scripts/` to handle new fields
3. Update CLI in `tools/problem-cli.js` for new functionality
4. Test with `npm run problem:validate`

### **Extending Validation**
1. Add new test case types to schema
2. Implement handling in backend generator
3. Update backend validator to support new types

### **Custom Phases**
1. Add new phase to schema enum
2. Create directory in `problems/`
3. Update CLI to include new phase

---

## 📈 **Migration Guide**

### **From Manual to Framework**

1. **Extract Existing Problems**
```bash
# Create extraction script (custom implementation needed)
node scripts/extract-existing-problems.js
```

2. **Validate Extracted Problems**
```bash
npm run problem:validate
```

3. **Generate New Code**
```bash
npm run problem:build
```

4. **Update Main Files**
```javascript
// Frontend: src/UltimateKernelAcademy.js
import problemBank from "./generated-problems.js";

// Backend: backend/leetcode-style-validator.js
const generatedTestDefinitions = require("./generated-test-definitions.js");
this.loadGeneratedDefinitions(generatedTestDefinitions);
```

5. **Test Integration**
```bash
# Start frontend
npm start

# Start backend
cd backend && npm start

# Test problem validation
```

---

## 💡 **Best Practices**

### **Problem Creation**
- Use descriptive titles and clear descriptions
- Include relevant concepts and skills
- Provide good starter code with TODO comments
- Test validation requirements thoroughly

### **Validation Design**
- Mark critical tests as `critical: true`
- Use exact matching for output messages
- Include all required headers in `requiredIncludes`
- Test both positive and negative cases

### **Maintenance**
- Run `npm run problem:validate` regularly
- Keep JSON files properly formatted
- Use semantic versioning for major changes
- Document custom validation logic

---

## 🤝 **Contributing**

1. Create problems in appropriate phase directories
2. Follow the JSON schema structure
3. Test with validation tools
4. Generate and test frontend/backend integration
5. Submit pull requests with problem changes

---

## 📞 **Support**

For issues with the framework:
1. Check `npm run problem:validate` output
2. Review generated files for errors
3. Verify JSON schema compliance
4. Check console output for detailed error messages

**Framework successfully transforms problem management from manual dual-editing to automated single-source-of-truth system! 🎉**