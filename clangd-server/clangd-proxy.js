/**
 * Clangd WebSocket Proxy Server
 * Bridges WebSocket clients to clangd language server over stdio
 * Based on the approach from: https://github.com/FurqanSoftware/codemirror-languageserver
 */

const WebSocket = require('ws');
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.CLANGD_PORT || 3002;
const CLANGD_COMMAND = process.env.CLANGD_COMMAND || 'clangd';

class ClangdProxy {
    constructor() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });
        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New WebSocket connection from:', req.connection.remoteAddress);
            
            // Extract query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const stack = url.searchParams.get('stack') || 'clangd11';
            
            console.log('📦 Requested stack:', stack);
            
            this.handleClangdConnection(ws, stack);
        });

        this.wss.on('error', (error) => {
            console.error('❌ WebSocket Server Error:', error);
        });
    }

    handleClangdConnection(ws, stack) {
        console.log('🚀 Starting clangd process...');
        
        // Create clangd working directory
        const workingDir = path.join(__dirname, 'workspace');
        if (!fs.existsSync(workingDir)) {
            fs.mkdirSync(workingDir, { recursive: true });
        }
        
        // Store workingDir on the WebSocket instance so it's accessible in message handlers
        ws.workingDir = workingDir;

        // Generate compile_commands.json using CMake if available
        const compileCommandsPath = path.join(workingDir, 'compile_commands.json');
        
        try {
            // Try to generate compile_commands.json from CMake
            const buildDir = path.join(workingDir, 'build');
            
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir, { recursive: true });
            }
            
            console.log('🔧 Generating compile_commands.json from CMake...');
            execSync(`cd "${buildDir}" && cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..`, { stdio: 'pipe' });
            
            // Copy compile_commands.json to workspace root
            const cmakeCompileCommands = path.join(buildDir, 'compile_commands.json');
            if (fs.existsSync(cmakeCompileCommands)) {
                fs.copyFileSync(cmakeCompileCommands, compileCommandsPath);
                console.log('✅ Generated compile_commands.json from CMake');
            } else {
                throw new Error('CMake did not generate compile_commands.json');
            }
        } catch (error) {
            console.log('⚠️ CMake generation failed, using fallback compile_commands.json');
            console.log('   Error:', error.message);
            
            // Fallback to manual compile_commands.json
            const compileCommands = [{
                directory: workingDir,
                command: `clang -D__KERNEL__ -DMODULE -DKBUILD_BASENAME=\\"kernel_module\\" -DKBUILD_MODNAME=\\"kernel_module\\" -std=gnu89 -Wall -Wundef -Wstrict-prototypes -fno-strict-aliasing -fno-common -fshort-wchar -Werror-implicit-function-declaration -O2 -c main.c`,
                file: path.join(workingDir, 'main.c')
            }];
            
            fs.writeFileSync(compileCommandsPath, JSON.stringify(compileCommands, null, 2));
        }

        // Spawn clangd process
        const clangdArgs = [
            '--background-index',
            '--clang-tidy',
            '--completion-style=detailed',
            '--function-arg-placeholders',
            '--header-insertion=iwyu',
            '--pch-storage=memory',
            '--log=verbose',
            `--compile-commands-dir=${workingDir}`
        ];

        const clangd = spawn(CLANGD_COMMAND, clangdArgs, {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log('✅ Clangd process started with PID:', clangd.pid);

        // Handle clangd process events
        clangd.on('error', (error) => {
            console.error('❌ Failed to start clangd:', error);
            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Failed to start clangd: ' + error.message
                }
            }));
            ws.close();
        });

        clangd.stderr.on('data', (data) => {
            console.log('🔍 Clangd stderr:', data.toString());
        });

        // Set up communication channels
        this.setupClangdCommunication(ws, clangd);

        // Handle client disconnect
        ws.on('close', () => {
            console.log('🔌 Client disconnected, terminating clangd');
            clangd.kill('SIGTERM');
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clangd.kill('SIGTERM');
        });
    }

    setupClangdCommunication(ws, clangd) {
        // Buffer for incoming data from clangd
        let buffer = Buffer.alloc(0);

        // Handle messages from clangd to client
        clangd.stdout.on('data', (data) => {
            // Use Buffer.concat to properly handle binary data
            buffer = Buffer.concat([buffer, data]);
            
            while (true) {
                // Look for complete LSP message
                const headerEnd = buffer.indexOf('\r\n\r\n');
                if (headerEnd === -1) break;

                const headers = buffer.subarray(0, headerEnd).toString('utf8');
                const contentLengthMatch = headers.match(/Content-Length: (\d+)/);
                
                if (!contentLengthMatch) {
                    console.error('❌ Invalid LSP message: no Content-Length header');
                    buffer = buffer.subarray(headerEnd + 4);
                    continue;
                }

                const contentLength = parseInt(contentLengthMatch[1]);
                const messageStart = headerEnd + 4;
                const messageEnd = messageStart + contentLength;

                if (buffer.length < messageEnd) break; // Wait for complete message

                const messageContent = buffer.subarray(messageStart, messageEnd).toString('utf8');
                buffer = buffer.subarray(messageEnd);

                try {
                    // Parse and forward to WebSocket client
                    const message = JSON.parse(messageContent);
                    
                    // Handle textDocument/definition responses that might cause frontend crashes
                    if (message.id && ws.definitionRequestId === message.id && message.result !== undefined) {
                        console.log('🔍 Processing textDocument/definition response');
                        
                        // If result is null, send safe null response
                        if (message.result === null) {
                            console.log('🔧 Clangd returned null definition - sending safe response');
                            ws.send(JSON.stringify(message));
                            continue;
                        }
                        
                        // Check if it's a definition response with problematic structure
                        if (Array.isArray(message.result)) {
                            if (message.result.length === 0) {
                                // Empty array - convert to null to prevent frontend crashes
                                console.log('🔧 Converting empty definition array to null');
                                const safeMessage = {
                                    ...message,
                                    result: null
                                };
                                ws.send(JSON.stringify(safeMessage));
                                continue;
                            } else if (message.result.some(item => !item || (!item.uri && !item.targetUri))) {
                                // Array with invalid items - filter out bad ones
                                console.log('🔧 Filtering invalid definition results');
                                const filteredResult = message.result.filter(item => item && (item.uri || item.targetUri));
                                const safeMessage = {
                                    ...message,
                                    result: filteredResult.length > 0 ? filteredResult : null
                                };
                                ws.send(JSON.stringify(safeMessage));
                                continue;
                            }
                        } else if (message.result && !message.result.uri && !message.result.targetUri) {
                            // Single invalid result - send null
                            console.log('🔧 Converting invalid definition result to null');
                            const safeMessage = {
                                ...message,
                                result: null
                            };
                            ws.send(JSON.stringify(safeMessage));
                            continue;
                        }
                        
                        // Clear the tracked request ID
                        delete ws.definitionRequestId;
                    }
                    
                    // Skip large completion messages to avoid JSON parsing issues
                    if (message.result && message.result.items && message.result.items.length > 50) {
                        console.log('📤 Skipping large completion response with', message.result.items.length, 'items');
                        // Send a simplified completion response
                        const simplifiedResponse = {
                            ...message,
                            result: {
                                isIncomplete: true,
                                items: message.result.items.slice(0, 20) // Only first 20 items
                            }
                        };
                        ws.send(JSON.stringify(simplifiedResponse));
                    } else {
                        // Only log non-completion messages to reduce noise
                        if (message.method !== 'textDocument/completion' && 
                            !(message.result && message.result.items)) {
                            console.log('📤 Clangd -> Client:', message.method || `response(${message.id})`);
                        }
                        ws.send(messageContent);
                    }
                } catch (error) {
                    console.error('❌ Failed to parse LSP message:', error.message);
                    
                    // For completion responses, send empty result to avoid breaking
                    try {
                        const errorResponse = {
                            id: 0, // Default ID
                            jsonrpc: "2.0",
                            result: {
                                isIncomplete: true,
                                items: []
                            }
                        };
                        ws.send(JSON.stringify(errorResponse));
                        console.log('✅ Sent empty completion fallback');
                    } catch (sendError) {
                        console.error('❌ Failed to send fallback response:', sendError);
                    }
                }
            }
        });

        // Handle messages from client to clangd
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Client -> Clangd:', message.method || `request(${message.id})`);
                
                // Store request methods to know what responses to filter
                if (message.method === 'textDocument/definition') {
                    ws.definitionRequestId = message.id;
                }
                
                // Handle textDocument/didOpen to write files to workspace
                if (message.method === 'textDocument/didOpen' && message.params && message.params.textDocument) {
                    const doc = message.params.textDocument;
                    const uri = doc.uri;
                    const fileName = uri.split('/').pop();
                    const filePath = path.join(ws.workingDir, fileName);
                    
                    // Write file content to workspace so clangd can access it
                    try {
                        fs.writeFileSync(filePath, doc.text);
                        console.log('💾 Wrote file to workspace:', fileName);
                    } catch (writeError) {
                        console.warn('⚠️ Failed to write file to workspace:', fileName, writeError);
                    }
                }
                
                // Handle textDocument/didChange to update files in workspace  
                if (message.method === 'textDocument/didChange' && message.params && message.params.textDocument) {
                    const doc = message.params.textDocument;
                    const uri = doc.uri;
                    const fileName = uri.split('/').pop();
                    const filePath = path.join(ws.workingDir, fileName);
                    
                    // Update file content in workspace
                    if (message.params.contentChanges && message.params.contentChanges.length > 0) {
                        const change = message.params.contentChanges[0];
                        if (change.text !== undefined) {
                            try {
                                fs.writeFileSync(filePath, change.text);
                                console.log('🔄 Updated file in workspace:', fileName);
                            } catch (writeError) {
                                console.warn('⚠️ Failed to update file in workspace:', fileName, writeError);
                            }
                        }
                    }
                }
                
                // Filter out requests for non-source files (like Makefile)
                if (message.method && message.method.startsWith('textDocument/') && message.params && message.params.textDocument) {
                    const uri = message.params.textDocument.uri;
                    const fileName = uri.split('/').pop();
                    const ext = fileName.split('.').pop().toLowerCase();
                    const name = fileName.toLowerCase();
                    
                    // Skip Makefile and other build files
                    if (name === 'makefile' || name.startsWith('makefile.') || 
                        ['mk', 'make', 'cmake'].includes(ext)) {
                        console.log('🚫 Skipping non-source file for clangd:', fileName);
                        
                        // Send empty response to avoid hanging the client
                        if (message.id) {
                            ws.send(JSON.stringify({
                                jsonrpc: '2.0',
                                id: message.id,
                                result: null
                            }));
                        }
                        return;
                    }
                }
                
                // Add LSP headers and send to clangd
                const messageStr = data.toString();
                const headers = `Content-Length: ${Buffer.byteLength(messageStr, 'utf8')}\r\n\r\n`;
                clangd.stdin.write(headers + messageStr);
            } catch (error) {
                console.error('❌ Failed to process client message:', error);
            }
        });
    }

    start() {
        this.server.listen(PORT, () => {
            console.log(`🚀 Clangd WebSocket Proxy Server running on port ${PORT}`);
            console.log(`📡 Connect via: ws://localhost:${PORT}/?stack=clangd11`);
            console.log(`🔧 Using clangd command: ${CLANGD_COMMAND}`);
        });

        this.server.on('error', (error) => {
            console.error('❌ Server Error:', error);
        });
    }
}

// Start the server
const proxy = new ClangdProxy();
proxy.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down clangd proxy server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down clangd proxy server...');
    process.exit(0);
});