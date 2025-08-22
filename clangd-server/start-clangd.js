#!/usr/bin/env node

/**
 * Clangd Server Startup Script
 * Checks for clangd installation and starts the WebSocket proxy
 */

const { spawn, exec } = require('child_process');
const path = require('path');

function checkClangdInstalled() {
    return new Promise((resolve) => {
        exec('which clangd', (error, stdout, stderr) => {
            if (error) {
                console.log('🔍 Checking for clangd installation...');
                exec('clangd --version', (versionError, versionStdout) => {
                    if (versionError) {
                        console.log('❌ Clangd not found. Please install clangd:');
                        console.log('   Ubuntu/Debian: sudo apt install clangd');
                        console.log('   macOS: brew install llvm');
                        console.log('   Or download from: https://clangd.llvm.org/installation');
                        resolve(false);
                    } else {
                        console.log('✅ Clangd found:', versionStdout.trim());
                        resolve(true);
                    }
                });
            } else {
                console.log('✅ Clangd found at:', stdout.trim());
                exec('clangd --version', (versionError, versionStdout) => {
                    if (!versionError) {
                        console.log('📋 Version:', versionStdout.split('\n')[0]);
                    }
                });
                resolve(true);
            }
        });
    });
}

async function startClangdServer() {
    console.log('🚀 Starting Clangd Language Server for Kernel Development...\n');

    const clangdInstalled = await checkClangdInstalled();
    if (!clangdInstalled) {
        process.exit(1);
    }

    console.log('\n🔧 Starting WebSocket proxy server...');
    
    const proxyPath = path.join(__dirname, 'clangd-proxy.js');
    const proxy = spawn('node', [proxyPath], {
        stdio: 'inherit',
        env: {
            ...process.env,
            CLANGD_PORT: process.env.CLANGD_PORT || '3000',
            CLANGD_COMMAND: process.env.CLANGD_COMMAND || 'clangd'
        }
    });

    proxy.on('error', (error) => {
        console.error('❌ Failed to start clangd proxy:', error);
        process.exit(1);
    });

    proxy.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ Clangd proxy exited with code ${code}`);
        }
        process.exit(code);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        proxy.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down...');
        proxy.kill('SIGTERM');
    });
}

if (require.main === module) {
    startClangdServer();
}

module.exports = { startClangdServer, checkClangdInstalled };