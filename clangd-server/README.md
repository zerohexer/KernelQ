# Clangd Language Server for Kernel Development

This directory contains the clangd WebSocket proxy server that enables LSP (Language Server Protocol) integration with CodeMirror 6 for kernel development.

## Features

- **Real-time C/C++ analysis** with clangd language server
- **Kernel-specific configuration** with proper compiler flags
- **WebSocket proxy** for browser compatibility  
- **Auto-completion** with kernel APIs and system headers
- **Error diagnostics** with clang-tidy integration
- **Hover documentation** for functions and types
- **Go-to-definition** and symbol navigation

## Requirements

- **clangd** (version 11 or higher)
- **Node.js** (for the WebSocket proxy)
- **Linux kernel headers** (optional, for better analysis)

## Installation

### Install clangd

**Ubuntu/Debian:**
```bash
sudo apt install clangd
```

**macOS:**
```bash
brew install llvm
```

**Other platforms:**
Download from: https://clangd.llvm.org/installation

### Verify Installation
```bash
npm run clangd:check
```

## Usage

### Start the Clangd Server
```bash
npm run clangd:start
```

### Start Both React App and Clangd Server
```bash
npm run dev:with-lsp
```

### Manual Setup
```bash
# Terminal 1: Start clangd server
npm run clangd:start

# Terminal 2: Start React app
npm start
```

## Configuration

The clangd server is configured with kernel-specific settings:

### Compiler Flags
- `-D__KERNEL__` - Kernel space compilation
- `-DMODULE` - Loadable kernel module
- `-std=gnu89` - GNU C89 standard (kernel requirement)
- `-Wall -Wundef -Wstrict-prototypes` - Kernel warnings
- `-fno-strict-aliasing -fno-common` - Kernel-safe optimizations

### Include Paths
- `/usr/src/linux/include` - Kernel headers
- `/usr/src/linux/arch/x86/include` - Architecture-specific headers

### Features Enabled
- **Background indexing** for fast symbol lookup
- **Clang-tidy** for code quality checks
- **Function argument placeholders** for autocompletion
- **Header insertion** with include-what-you-use
- **Detailed completion** with documentation

## Troubleshooting

### Clangd Not Found
```bash
# Check if clangd is in PATH
which clangd

# Install if missing
sudo apt install clangd  # Ubuntu/Debian
brew install llvm        # macOS
```

### Connection Issues
- Ensure port 3000 is available
- Check firewall settings
- Verify WebSocket connection in browser dev tools

### Performance Issues
- Close other heavy applications
- Consider reducing clangd worker threads
- Clear browser cache and reload

### Kernel Headers Missing
```bash
# Install kernel development headers
sudo apt install linux-headers-$(uname -r)  # Ubuntu/Debian
```

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    stdin/stdout    ┌─────────────────┐
│   CodeMirror    │ ←──────────────→ │  Proxy Server   │ ←──────────────→ │     clangd      │
│   (Browser)     │  JSON-RPC over  │   (Node.js)     │    LSP Protocol   │ (Language Server)│
└─────────────────┘     WebSocket    └─────────────────┘                   └─────────────────┘
```

1. **CodeMirror** sends LSP requests via WebSocket
2. **Proxy Server** translates WebSocket ↔ stdio for clangd
3. **Clangd** analyzes code and returns completions/diagnostics

## Development

### Server Configuration
Edit `clangd-proxy.js` to modify:
- Port number (default: 3000)
- Clangd arguments
- Working directory setup

### Editor Integration
Modify `CodeMirrorKernelEditor.js` to adjust:
- LSP initialization options
- Kernel compiler flags  
- Include paths

## Files

- `clangd-proxy.js` - WebSocket to stdio proxy server
- `start-clangd.js` - Startup script with clangd detection
- `workspace/` - Clangd working directory (auto-created)
- `workspace/compile_commands.json` - Clang compilation database