# KernelQ - Interactive Linux Kernel Learning Platform

![KernelQ Logo](public/kernelq-logo.png)

## What Makes KernelQ Special

- **Real Kernel Compilation** - Students write code that compiles with actual GCC and kernel headers  
- **QEMU Virtual Machine Testing** - Modules load and run in real Linux VMs with dmesg output
- **Advanced Validation System** - LeetCode-style testing with comprehensive anti-cheat detection
- **Multi-File Architecture** - Teaches proper header/source separation with visual feedback
- **Interactive Problem Bank** - Curated challenges from foundations to advanced driver development
- **Real-Time Test Results** - LeetCode-style test result display with detailed feedback

---

## Modern Architecture

```
Frontend (React)          Backend (Node.js)         Problem System
├── Premium UI 2.0         ├── Real Compilation      ├── JSON-Based Problems
├── Multi-File Editor      ├── QEMU Testing          ├── Auto-Generation  
├── Test Results View      ├── LeetCode Validation   ├── Schema Validation
├── Problem Bank           ├── Security Scanning     └── CLI Tools
└── Glass Morphism         └── Anti-Cheat System
```

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|-------------|
| **Compilation Backend** | Real kernel compilation + testing | Node.js + QEMU + GCC validation |
| **Problem Framework** | JSON-based curriculum management | Auto-generation, schema validation |
| **Validation Engine** | LeetCode-style testing system | Multi-layer validation, anti-cheat detection |

---

## Quick Start

### Prerequisites
```bash
# Linux system (Ubuntu 20.04+ or openSUSE recommended)
sudo apt-get update
sudo apt-get install linux-headers-$(uname -r) qemu-system-x86 build-essential nodejs npm

# For openSUSE:
sudo zypper install kernel-devel qemu nodejs npm
```

### Installation
```bash
# Clone repository
git clone https://github.com/zerohexer/KernelQ.git
cd KernelQ

# Install dependencies
npm install
cd backend && npm install && cd ..
```

### Start Development Environment
```bash
# Terminal 1: Backend server
cd backend && npm start

# Terminal 2: Frontend development server  
npm start
```

### Access KernelQ
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

---

## Project Structure

```
KernelQ/
├── src/                                    # Modern React Frontend
│   ├── components/                         # Modular component architecture
│   │   ├── Challenge/                      # Challenge interface components
│   │   │   ├── ChallengeView.js           # Main challenge interface
│   │   │   └── TestResultsView.js         # LeetCode-style results
│   │   ├── Editor/                        # Code editor components  
│   │   │   ├── MultiFileEditor.js         # Multi-file project editor
│   │   │   └── SemanticCodeEditor.js      # Monaco editor wrapper
│   │   ├── Navigation/                    # Navigation components
│   │   ├── ProblemBank/                   # Problem browser
│   │   └── Layout/                        # Layout utilities
│   ├── hooks/                             # Custom React hooks
│   │   ├── useUserProfile.js              # User progress tracking
│   │   ├── useCodeEditor.js               # Editor state management
│   │   └── useUIState.js                  # UI state management
│   ├── styles/                            # Premium styling system
│   │   └── PremiumStyles.js               # Apple-inspired design system
│   ├── data/                              # Generated data files
│   │   ├── generated-problems.js          # Auto-generated problem bank
│   │   ├── ConceptDatabase.js             # Learning concepts
│   │   └── PhaseSystem.js                 # Learning phases
│   └── UltimateKernelAcademy.js           # Main application component
│
├── problems/                              # Problem Definitions (Source of Truth)
│   ├── schema.json                        # Problem validation schema
│   ├── foundations/                       # Foundation problems (1-4)
│   │   ├── 001-hello-world-multifile.json
│   │   ├── 002-variables-and-data-types.json
│   │   ├── 003-arrays-and-loops.json
│   │   └── 004-functions-and-pointers.json
│   └── kernel_core/                       # Advanced problems
│       └── 080-simple-driver-creation.json
│
├── backend/                               # Compilation & Testing Backend
│   ├── server.js                          # Main API server
│   ├── leetcode-style-validator.js        # Comprehensive validation
│   ├── direct-kernel-compiler.js          # Real GCC compilation
│   ├── generated-test-definitions.js      # Auto-generated tests
│   └── work/                              # QEMU workspace
│
├── scripts/                               # Code Generation Tools
│   ├── generate-frontend.js               # Frontend code generation
│   └── generate-backend.js                # Backend test generation
│
└── public/                                # Static assets
    └── kernelq-logo.png                   # Brand assets
```

---

## Learning Experience

### Progressive Curriculum
1. **Foundations** - Multi-file modules, variables, functions, pointers
2. **Kernel Core** - Character devices, driver development
3. **Memory Management** - kmalloc/kfree, memory mapping
4. **Device Drivers** - Real hardware interaction
5. **Synchronization** - Mutexes, spinlocks, atomic operations

### Premium UI Features
- **Glass Morphism Design** - Apple-inspired visual aesthetics
- **Tabbed Interface** - Code editor and test results in separate tabs
- **Multi-File Projects** - Header/source file separation with visual guidance
- **Smart Requirements** - Clear separation of header vs source file requirements
- **Test Results View** - LeetCode-style pass/fail feedback with detailed messages

### Learning Methodology
```
Header File Requirements               Source File Requirements
• Declare variable: my_int (int)       • Define variable: my_int (int) = 42
• Declare function: print_array        • Implement function: variables_init
                                      • Output: "Integer: 42"
                                      • Include: <linux/module.h>
```

---

## Advanced Validation System

### Multi-Layer Testing Architecture

1. **Pre-Compilation Analysis**
   - Security pattern detection
   - Anti-cheat template detection  
   - Required symbol validation
   - Code structure analysis

2. **Real Kernel Compilation**
   - GCC compilation with kernel headers
   - Multi-file project compilation
   - Makefile generation and build
   - Binary analysis and validation

3. **QEMU Virtual Machine Testing**
   - Custom Linux VM environment
   - Real module loading/unloading
   - Actual dmesg output capture
   - Performance and memory analysis

4. **LeetCode-Style Results**
   - Structured test case feedback
   - Pass/fail status with detailed messages
   - Execution time tracking
   - Overall acceptance scoring

### Problem Definition System
```json
{
  "id": 2,
  "title": "Variables and Data Types",
  "phase": "foundations",
  "difficulty": 2,
  "xp": 20,
  "description": "Learn to work with different data types in kernel space...",
  "files": [
    {
      "name": "variables.h",
      "content": "#ifndef VARIABLES_H\\n#define VARIABLES_H\\n...",
      "readOnly": false,
      "language": "h"
    }
  ],
  "validation": {
    "exactRequirements": {
      "functionNames": ["variables_init", "variables_exit"],
      "variables": [
        { "name": "my_int", "type": "int", "value": 42 }
      ],
      "outputMessages": ["Integer: 42", "Character: K"],
      "requiredIncludes": ["linux/module.h", "linux/kernel.h"]
    },
    "testCases": [
      {
        "id": "header_declarations",
        "name": "Header Variable Declarations", 
        "type": "code_analysis",
        "critical": true,
        "expectedSymbols": ["extern int my_int"],
        "prohibitedSymbols": []
      }
    ]
  }
}
```

---

## Development Workflow

### Problem Management
```bash
# Generate frontend/backend from JSON problems
node scripts/generate-frontend.js
node scripts/generate-backend.js

# Validate problem definitions
npm run validate-problems

# Test specific problem
curl -X POST http://localhost:3001/api/validate-solution-comprehensive \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "problemId": 2}'
```

### Adding New Problems
1. Create JSON file in appropriate `/problems/phase/` directory
2. Follow schema validation requirements
3. Include comprehensive test cases
4. Run generation scripts to update frontend/backend
5. Test with real compilation and QEMU

---

## UI/UX Highlights

### Premium Design System
- **Glass Morphism Effects** - Translucent panels with backdrop blur
- **Smooth Animations** - 60fps transitions and micro-interactions  
- **Adaptive Color System** - Context-aware color coding for different requirement types
- **Professional Typography** - SF Pro Display font system
- **Responsive Layout** - Works on desktop, tablet, and mobile

### User Experience Features
- **Real-Time Validation** - Instant feedback as students type
- **Smart Error Messages** - Helpful hints and debugging suggestions
- **Progress Tracking** - XP system with skill mastery indicators
- **Multi-Tab Interface** - Organized code editing and result viewing
- **File Management** - Visual file tabs with proper syntax highlighting

---

## Technical Specifications

### Frontend Stack
- **React 18** - Modern hooks-based architecture
- **Monaco Editor** - VS Code-quality code editing
- **Glass Morphism CSS** - Apple-inspired visual design
- **Responsive Design** - Mobile-first approach

### Backend Stack  
- **Node.js** - High-performance API server
- **QEMU** - Real Linux kernel virtual machine testing
- **GCC Toolchain** - Actual kernel compilation
- **Express.js** - RESTful API framework

### Problem System
- **JSON Schema** - Structured problem definitions
- **Auto-Generation** - Frontend/backend code generation
- **Multi-File Support** - Header/source file projects
- **Validation Engine** - Comprehensive testing framework

---

## Educational Impact

### Skills Developed
- **Real Kernel Development** - Industry-standard tools and practices
- **Multi-File Architecture** - Proper C/C++ project organization  
- **Memory Management** - Safe kernel memory allocation/deallocation
- **Device Driver Development** - Hardware abstraction and interaction
- **Debugging Techniques** - QEMU, dmesg analysis, kernel debugging

### Career Preparation
- **NVIDIA** - GPU driver development, CUDA interfaces
- **Intel** - CPU microcode, hardware abstraction layers
- **Canonical/Red Hat** - Linux distribution kernel maintenance
- **Meta/Google** - Container runtime and virtualization
- **Embedded Systems** - IoT device kernel development

---

## Contributing

### Getting Started
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow existing code organization patterns
4. Test with real backend validation
5. Submit pull request with detailed description

### Problem Creation Guidelines
- Use JSON schema validation
- Include comprehensive anti-cheat measures
- Test with both correct and incorrect solutions
- Provide clear learning objectives
- Follow progressive difficulty curve

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Get Started Today!

```bash
git clone https://github.com/zerohexer/KernelQ.git
cd KernelQ
npm install && cd backend && npm install && cd ..
# Terminal 1: cd backend && npm start
# Terminal 2: npm start
# Open http://localhost:3000
```

**Transform your kernel development skills with KernelQ's premium learning experience!**

---

*Built with ❤️ for the Linux kernel development community*
