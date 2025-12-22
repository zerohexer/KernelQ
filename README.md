# KernelQ - Interactive Linux Kernel Learning Platform

![KernelQ Logo](public/kernelq-logo.png)

## What Makes KernelQ Special

- **Real Kernel Compilation** - Code compiles with actual GCC and kernel headers  
- **QEMU Virtual Machine Testing** - Modules load and run in real Linux VMs with dmesg validation
- **LeetCode-Style Validation** - Comprehensive testing with anti-hardcoding detection
- **Multi-File Architecture** - Teaches proper header/source separation
- **Progressive Problem Bank** - Curated challenges from foundations to driver development

---

## Architecture Overview

```
Frontend (React)          Backend (Node.js)         Problem System
├── Multi-File Editor      ├── Real Compilation      ├── JSON-Based Problems
├── Test Results View      ├── QEMU Testing          ├── Auto-Generation  
├── Problem Browser        ├── Validation Engine     ├── Schema Validation
└── Progress Tracking      └── Anti-Cheat System     └── CLI Tools
```

---

## Quick Start

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install linux-headers-$(uname -r) qemu-system-x86 build-essential nodejs npm

# openSUSE
sudo zypper install kernel-devel qemu nodejs npm
```

### Installation

```bash
git clone https://github.com/zerohexer/KernelQ.git
cd KernelQ
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

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

---

## Project Structure

```
KernelQ/
├── src/                          # React Frontend
│   ├── components/               # UI components
│   │   ├── Challenge/            # Challenge interface
│   │   ├── Editor/               # Code editor (Monaco-based)
│   │   ├── ProblemBank/          # Problem browser
│   │   └── Navigation/           
│   ├── hooks/                    # Custom React hooks
│   └── data/                     # Generated problem data
│
├── problems/                     # Problem Definitions (Source of Truth)
│   ├── schema.json               # Validation schema
│   ├── foundations/              # Foundation problems (1-31)
│   └── kernel_core/              # Advanced problems (100+)
│
├── backend/                      # Compilation & Testing Backend
│   ├── server.js                 # API server
│   ├── leetcode-style-validator.js
│   ├── direct-kernel-compiler.js
│   └── work/                     # QEMU workspace
│
└── scripts/                      # Code Generation Tools
    ├── generate-frontend.js
    └── generate-backend.js
```

---

## Learning Curriculum

### Progressive Phases

1. **Foundations** - C programming in kernel context: variables, arrays, functions, pointers, memory management
2. **Kernel Core** - /proc filesystem, character devices, platform drivers, PCI interaction
3. **Memory Management** - kmalloc/kfree, slab allocators, memory mapping
4. **Device Drivers** - Real hardware interaction patterns
5. **Synchronization** - Mutexes, spinlocks, atomic operations

### Problem Structure

Problems use multi-file projects with header/source separation:

```
Header File Requirements          Source File Requirements
• extern declarations             • Variable definitions
• Function prototypes             • Function implementations
• Include guards                  • Module init/exit
```

---

## Validation System

### Multi-Layer Testing

1. **Code Analysis** - Security scanning, symbol validation, anti-hardcoding detection
2. **Real Compilation** - GCC with kernel headers, Makefile generation
3. **QEMU Testing** - Module loading, dmesg output capture, behavioral validation
4. **Result Reporting** - Pass/fail per test case with detailed feedback

### Problem Definition Format

```json
{
  "id": 2,
  "title": "Variables and Data Types",
  "phase": "foundations",
  "difficulty": 2,
  "xp": 20,
  "validation": {
    "testCases": [
      {
        "id": "header_declarations",
        "name": "Header Variable Declarations", 
        "type": "code_analysis",
        "expectedSymbols": ["extern int my_int"]
      },
      {
        "id": "output_test",
        "name": "Runtime Output",
        "type": "output_matching",
        "expectedOutput": ["Integer: 42"]
      }
    ]
  }
}
```

---

## Development

### Problem Management

```bash
# Generate frontend/backend from JSON problems
node scripts/generate-frontend.js
node scripts/generate-backend.js

# Validate problem definitions
npm run validate-problems
```

### Adding New Problems

1. Create JSON file in `/problems/<phase>/`
2. Follow schema validation requirements
3. Include test cases covering code analysis and runtime behavior
4. Run generation scripts
5. Test with real compilation and QEMU

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Monaco Editor |
| Backend | Node.js, Express.js |
| Compilation | GCC, kernel headers |
| Testing | QEMU, dmesg parsing |
| Problems | JSON schema, auto-generation |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Test with real backend validation
4. Submit pull request

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

*Built for the Linux kernel development community*
