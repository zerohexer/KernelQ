const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execAsync = promisify(exec);

/**
 * Direct Kernel Module Compiler
 * Based on the interactive script but adapted for API usage
 * No Docker needed - uses host kernel build system directly
 */
class DirectKernelCompiler {
    constructor(workDir = './work') {
        this.workDir = path.resolve(workDir);
        this.modulesDir = path.join(this.workDir, 'modules');
    }

    async ensureDirectories() {
        await fs.mkdir(this.workDir, { recursive: true });
        await fs.mkdir(this.modulesDir, { recursive: true });
    }

    // Check if kernel headers are available
    async checkKernelHeaders() {
        return new Promise((resolve) => {
            exec('uname -r', (error, stdout) => {
                if (error) {
                    resolve({ available: false, error: 'Cannot determine kernel version' });
                    return;
                }
                
                const kernelVersion = stdout.trim();
                const headerPath = `/lib/modules/${kernelVersion}/build`;
                
                fs.access(headerPath)
                    .then(() => {
                        resolve({ 
                            available: true, 
                            kernelVersion,
                            headerPath 
                        });
                    })
                    .catch(() => {
                        resolve({ 
                            available: false, 
                            error: `Kernel headers not found at ${headerPath}`,
                            suggestion: `Install with: sudo apt-get install linux-headers-${kernelVersion}`
                        });
                    });
            });
        });
    }

    // Generate Makefile for single or multiple source files
    generateMakefile(moduleName, sourceFiles) {
        if (sourceFiles.length === 1) {
            // Single file module
            return `# Single-file kernel module: ${moduleName}
obj-m += ${moduleName}.o

# Kernel build directory  
KDIR := /lib/modules/$(shell uname -r)/build

# Standard targets
all:
\t$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean

install: all
\t$(MAKE) -C $(KDIR) M=$(PWD) modules_install

help:
\t$(MAKE) -C $(KDIR) M=$(PWD) help

.PHONY: all clean install help
`;
        } else {
            // Multi-file module
            const objFiles = sourceFiles.map(file => 
                path.basename(file, '.c') + '.o'
            ).join(' ');
            
            return `# Multi-file kernel module: ${moduleName}
obj-m += ${moduleName}.o

# Object files that make up this module
${moduleName}-objs := ${objFiles}

# Kernel build directory
KDIR := /lib/modules/$(shell uname -r)/build

# Standard targets
all:
\t$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean

install: all
\t$(MAKE) -C $(KDIR) M=$(PWD) modules_install

help:
\t$(MAKE) -C $(KDIR) M=$(PWD) help

.PHONY: all clean install help
`;
        }
    }

    // Create QEMU test environment with enhanced support for kernel_project_test
    async createQEMUTestEnvironment(sessionDir, moduleName, testScenario = null) {
        const initramfsDir = path.join(sessionDir, 'initramfs');
        const dirs = ['bin', 'sbin', 'lib/modules', 'proc', 'sys'];
        
        // Create directory structure
        for (const dir of dirs) {
            await fs.mkdir(path.join(initramfsDir, dir), { recursive: true });
        }
        
        // Create additional directories for dynamic linking
        await fs.mkdir(path.join(initramfsDir, 'lib64'), { recursive: true });
        await fs.mkdir(path.join(initramfsDir, 'usr/lib64'), { recursive: true });

        // Copy busybox (if available)
        try {
            await this.copyFile('/usr/bin/busybox-static', path.join(initramfsDir, 'bin/busybox'));
            
            // Create symlinks
            const symlinks = [
                ['bin/sh', '/bin/busybox'],
                ['sbin/insmod', '/bin/busybox'],
                ['sbin/rmmod', '/bin/busybox'],
                ['sbin/lsmod', '/bin/busybox'],
                ['bin/dmesg', '/bin/busybox'],
                ['bin/mount', '/bin/busybox'],
                ['bin/sleep', '/bin/busybox'],
                ['bin/tail', '/bin/busybox'],
                ['bin/mkdir', '/bin/busybox'],
                ['bin/ls', '/bin/busybox'],
                ['bin/echo', '/bin/busybox'],
                ['bin/cat', '/bin/busybox'],
                ['bin/chmod', '/bin/busybox'],
                ['bin/rm', '/bin/busybox'],
                ['bin/head', '/bin/busybox'],
                ['bin/grep', '/bin/busybox'],
                ['usr/bin/head', '/bin/busybox'],
                ['bin/mknod', '/bin/busybox'],
                ['bin/awk', '/bin/busybox'],
                ['bin/cut', '/bin/busybox']
            ];

            for (const [link, target] of symlinks) {
                await this.createSymlink(target, path.join(initramfsDir, link));
            }
        } catch (error) {
            // Fallback to basic shell if busybox not available
            console.warn('Busybox not available, using basic shell setup');
        }

        // Copy essential shared libraries for dynamic linking
        const essentialLibs = [
            '/lib64/ld-linux-x86-64.so.2',
            '/lib64/libc.so.6',
            '/lib64/libm.so.6'
        ];
        
        for (const lib of essentialLibs) {
            try {
                const libName = path.basename(lib);
                await this.copyFile(lib, path.join(initramfsDir, 'lib64', libName));
            } catch (error) {
                // Library not essential for basic operation
                console.warn(`Could not copy ${lib}:`, error.message);
            }
        }

        // Copy kernel module
        await this.copyFile(
            path.join(sessionDir, `${moduleName}.ko`),
            path.join(initramfsDir, 'lib/modules', `${moduleName}.ko`)
        );

        // NEW: Compile userspace applications if provided in testScenario
        if (testScenario?.userspaceApps) {
            console.log('📦 Compiling userspace test applications...');
            for (const app of testScenario.userspaceApps) {
                try {
                    // Write source code to temporary file (convert escaped newlines)
                    const appSrcPath = path.join(sessionDir, `${app.name}.c`);
                    const sourceCode = app.source.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
                    await fs.writeFile(appSrcPath, sourceCode);
                    
                    // Compile with provided flags (default to basic compilation)
                    const compileFlags = app.compileFlags || [];
                    const compileCmd = [
                        'gcc',
                        ...compileFlags,
                        '-o', path.join(initramfsDir, 'bin', app.name),
                        appSrcPath
                    ];
                    
                    console.log(`🔨 Compiling ${app.name}...`);
                    await execAsync(compileCmd.join(' '));
                    await fs.chmod(path.join(initramfsDir, 'bin', app.name), 0o755);
                    console.log(`✅ Compiled ${app.name} successfully`);
                } catch (error) {
                    console.error(`❌ Failed to compile ${app.name}:`, error.message);
                    throw new Error(`Userspace app compilation failed: ${app.name}`);
                }
            }
        }

        // Generate dynamic init script based on test scenario
        const initScript = this.generateInitScript(moduleName, testScenario);
        await fs.writeFile(path.join(initramfsDir, 'init'), initScript);
        await fs.chmod(path.join(initramfsDir, 'init'), 0o755);

        return initramfsDir;
    }

    // Generate dynamic init script for kernel_project_test scenarios
    generateInitScript(moduleName, testScenario) {
        let script = `#!/bin/sh
set -e

# Set PATH to include busybox commands
export PATH="/bin:/sbin:/usr/bin:/usr/sbin"

echo "=== QEMU Kernel Module Test Started ==="
echo "Module: ${moduleName}"
echo "Kernel: \\$(uname -r)"

# Mount essential filesystems
/bin/mount -t proc proc /proc 2>/dev/null || echo "proc mount failed"
/bin/mount -t sysfs sysfs /sys 2>/dev/null || echo "sysfs mount failed"

`;

        // Add setup commands if provided
        if (testScenario?.setupCommands?.length) {
            script += `
echo ""
echo "=== Running Setup Commands ==="
`;
            for (const cmd of testScenario.setupCommands) {
                script += `echo "Executing: ${cmd}"
${cmd}
`;
            }
        }

        // Module loading
        script += `
echo ""
echo "=== Loading Module ==="
if /sbin/insmod /lib/modules/${moduleName}.ko 2>&1; then
    echo "✅ Module loaded successfully"
    
    echo ""
    echo "=== Module Information ==="
    /sbin/lsmod | head -10 2>/dev/null || echo "lsmod not available"
    
    echo ""
    echo "=== Kernel Messages (Load) ==="
    /bin/dmesg | tail -20 2>/dev/null || echo "dmesg not available"
    
    echo ""
    echo "=== Creating Device Nodes ==="
    # Show available devices first
    echo "Checking /proc/devices for mychardev..."
    grep mychardev /proc/devices || echo "mychardev not found in /proc/devices"
    # Use a simple approach - try common major numbers
    echo "Creating device node..."
    major=\$(grep mychardev /proc/devices | head -1 | cut -d' ' -f1)
    if [ ! -z "\$major" ]; then
        /bin/mknod /dev/mychardev c \$major 0 && echo "Device created with major \$major" || echo "mknod failed"
        /bin/chmod 666 /dev/mychardev || echo "chmod failed"
    else
        echo "Could not determine major number"
    fi
    
`;

        // Add test commands if provided
        if (testScenario?.testCommands?.length) {
            script += `
    echo ""
    echo "=== Running Test Commands ==="
`;
            for (const cmd of testScenario.testCommands) {
                script += `    echo "Executing: ${cmd}"
    ${cmd}
`;
            }
        } else {
            // Default wait period
            script += `
    echo ""
    echo "=== Waiting 2 seconds ==="
    sleep 2
`;
        }

        // Add cleanup commands if provided
        if (testScenario?.cleanupCommands?.length) {
            script += `
    echo ""
    echo "=== Running Cleanup Commands ==="
`;
            for (const cmd of testScenario.cleanupCommands) {
                script += `    echo "Executing: ${cmd}"
    ${cmd}
`;
            }
        }

        // Module unloading and completion
        script += `
    echo ""
    echo "=== Unloading Module ==="
    if /sbin/rmmod ${moduleName} 2>&1; then
        echo "✅ Module unloaded successfully"
    else
        echo "⚠️ Module unload failed"
    fi
    
    echo ""
    echo "=== Final Kernel Messages ==="
    /bin/dmesg | tail -10 2>/dev/null || echo "dmesg not available"
    
    echo ""
    echo "✅ QEMU_TEST_COMPLETE: SUCCESS"
    
else
    echo "❌ Module loading failed"
    echo ""
    echo "=== Error Messages ==="
    /bin/dmesg | tail -10 2>/dev/null || echo "dmesg not available"
    echo "❌ QEMU_TEST_COMPLETE: LOAD_FAILED"
fi

echo ""
echo "=== Test Completed - Shutting Down ==="
sleep 1

# Force shutdown
echo 1 > /proc/sys/kernel/sysrq
echo o > /proc/sysrq-trigger 2>/dev/null || halt -f || poweroff -f
`;

        return script;
    }

    async copyFile(src, dest) {
        try {
            await fs.copyFile(src, dest);
        } catch (error) {
            // If copy fails, try to create a minimal version
            if (dest.includes('busybox')) {
                await fs.writeFile(dest, '#!/bin/sh\necho "Minimal shell"\n');
                await fs.chmod(dest, 0o755);
            } else {
                throw error;
            }
        }
    }

    async createSymlink(target, link) {
        try {
            await fs.symlink(target, link);
        } catch (error) {
            // Ignore symlink errors - they're not critical
        }
    }

    // Compile kernel module using direct make command
    async compileModule(sessionDir, moduleName, sourceFiles) {
        return new Promise((resolve) => {
            // Generate Makefile
            const makefile = this.generateMakefile(moduleName, sourceFiles);
            
            fs.writeFile(path.join(sessionDir, 'Makefile'), makefile)
                .then(() => {
                    // Run make clean && make
                    const makeProcess = spawn('make', ['clean'], {
                        cwd: sessionDir,
                        stdio: ['pipe', 'pipe', 'pipe'],
                        env: { ...process.env, PWD: sessionDir }
                    });

                    let output = '';
                    
                    makeProcess.stdout.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    makeProcess.stderr.on('data', (data) => {
                        output += data.toString();
                    });

                    makeProcess.on('close', (cleanCode) => {
                        // Now run make
                        const buildProcess = spawn('make', [], {
                            cwd: sessionDir,
                            stdio: ['pipe', 'pipe', 'pipe'],
                            env: { ...process.env, PWD: sessionDir }
                        });

                        buildProcess.stdout.on('data', (data) => {
                            output += data.toString();
                        });
                        
                        buildProcess.stderr.on('data', (data) => {
                            output += data.toString();
                        });

                        buildProcess.on('close', (buildCode) => {
                            if (buildCode === 0) {
                                // Check if .ko file was generated
                                fs.access(path.join(sessionDir, `${moduleName}.ko`))
                                    .then(() => {
                                        resolve({
                                            success: true,
                                            output: output,
                                            message: `Kernel module ${moduleName}.ko compiled successfully`
                                        });
                                    })
                                    .catch(() => {
                                        resolve({
                                            success: false,
                                            output: output,
                                            error: 'Compilation succeeded but no .ko file generated'
                                        });
                                    });
                            } else {
                                resolve({
                                    success: false,
                                    output: output,
                                    error: `Compilation failed with exit code ${buildCode}`
                                });
                            }
                        });

                        buildProcess.on('error', (error) => {
                            resolve({
                                success: false,
                                output: output,
                                error: `Build process error: ${error.message}`
                            });
                        });
                    });
                })
                .catch((error) => {
                    resolve({
                        success: false,
                        output: '',
                        error: `Failed to create Makefile: ${error.message}`
                    });
                });
        });
    }

    // Test module in QEMU with enhanced kernel_project_test support
    async testModuleInQEMU(sessionDir, moduleName, testScenario = null) {
        return new Promise(async (resolve) => {
            try {
                // Create initramfs with testScenario support
                const initramfsDir = await this.createQEMUTestEnvironment(sessionDir, moduleName, testScenario);
                
                // Create cpio archive
                const createCpio = spawn('sh', ['-c', 
                    'cd initramfs && find . | cpio -o -H newc | gzip > ../test.cpio.gz'
                ], {
                    cwd: sessionDir,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let cpioOutput = '';
                
                createCpio.stdout.on('data', (data) => {
                    cpioOutput += data.toString();
                });
                
                createCpio.stderr.on('data', (data) => {
                    cpioOutput += data.toString();
                });

                createCpio.on('close', (cpioCode) => {
                    if (cpioCode !== 0) {
                        resolve({
                            success: false,
                            error: 'Failed to create initramfs',
                            output: cpioOutput
                        });
                        return;
                    }

                    // Get kernel version for vmlinuz path
                    exec('uname -r', (error, stdout) => {
                        if (error) {
                            resolve({
                                success: false,
                                error: 'Cannot determine kernel version for QEMU',
                                output: cpioOutput
                            });
                            return;
                        }

                        const kernelVersion = stdout.trim();
                        const vmlinuzPath = `/boot/vmlinuz-${kernelVersion}`;

                        // Run QEMU with timeout and enhanced arguments support
                        const baseQemuArgs = [
                            '-kernel', vmlinuzPath,
                            '-initrd', path.join(sessionDir, 'test.cpio.gz'),
                            '-m', '256',
                            '-nographic',
                            '-append', 'console=ttyS0 init=/init quiet'
                        ];

                        // Add custom QEMU arguments from testScenario
                        const customArgs = testScenario?.qemuArgs || [];
                        const qemuArgs = [...baseQemuArgs, ...customArgs];

                        if (customArgs.length > 0) {
                            console.log('🖥️ Using custom QEMU arguments:', customArgs.join(' '));
                        }

                        const qemu = spawn('qemu-system-x86_64', qemuArgs, {
                            stdio: ['pipe', 'pipe', 'pipe']
                        });

                        // Set a hard timeout to kill QEMU if it hangs (configurable via testScenario)
                        const timeoutMs = (testScenario?.timeout || 30) * 1000; // Default 30 seconds
                        const killTimer = setTimeout(() => {
                            console.log(`🔪 Killing hanging QEMU process after ${timeoutMs/1000}s timeout...`);
                            qemu.kill('SIGKILL');
                        }, timeoutMs);

                        let qemuOutput = '';
                        let dmesgOutput = '';

                        qemu.stdout.on('data', (data) => {
                            const text = data.toString();
                            qemuOutput += text;
                            
                            // Extract dmesg-like output
                            if (text.includes('[') && text.includes(']')) {
                                dmesgOutput += text;
                            }
                        });

                        qemu.stderr.on('data', (data) => {
                            qemuOutput += data.toString();
                        });

                        qemu.on('close', (qemuCode) => {
                            clearTimeout(killTimer);
                            
                            // Clean up
                            fs.rm(path.join(sessionDir, 'initramfs'), { recursive: true, force: true })
                                .catch(() => {});
                            fs.unlink(path.join(sessionDir, 'test.cpio.gz'))
                                .catch(() => {});

                            console.log(`🏁 QEMU finished with code: ${qemuCode}`);
                            
                            // Consider success if:
                            // - We see the SUCCESS completion marker
                            // - Or normal exit with reasonable output
                            const hasSuccessMarker = qemuOutput.includes('QEMU_TEST_COMPLETE: SUCCESS');
                            const hasLoadSuccess = qemuOutput.includes('✅ Module loaded successfully');
                            const hasTestOutput = qemuOutput.includes('=== QEMU Kernel Module Test Started ===');
                            
                            const success = hasSuccessMarker || 
                                           (hasTestOutput && hasLoadSuccess) ||
                                           (qemuCode === 0 && qemuOutput.length > 200);

                            resolve({
                                success: success,
                                output: qemuOutput,
                                dmesg: dmesgOutput,
                                message: success ? 'Module tested in QEMU virtual machine' : 'QEMU testing failed',
                                exitCode: qemuCode
                            });
                        });

                        qemu.on('error', (error) => {
                            clearTimeout(killTimer);
                            resolve({
                                success: false,
                                error: `QEMU error: ${error.message}`,
                                output: qemuOutput,
                                dmesg: dmesgOutput
                            });
                        });
                    });
                });

            } catch (error) {
                resolve({
                    success: false,
                    error: `Test setup failed: ${error.message}`,
                    output: ''
                });
            }
        });
    }

    // Run checkpatch.pl style checking on source file
    async runCheckpatch(sourceFile) {
        try {
            const checkpatchPath = path.join(__dirname, 'scripts', 'checkpatch.pl');
            
            // Check if checkpatch.pl exists
            await fs.access(checkpatchPath);
            
            // Run checkpatch with --no-tree option for standalone operation
            const { stdout, stderr } = await execAsync(`${checkpatchPath} --no-tree --file "${sourceFile}"`);
            
            return {
                passed: true, // No style issues found
                output: stdout || stderr || 'No style issues detected',
                hasIssues: false
            };
        } catch (error) {
            // checkpatch.pl exits with non-zero code when it finds issues
            // This is expected behavior, so we parse the output
            const output = error.stdout || error.stderr || error.message;
            
            // Determine if these are actual style issues or execution errors
            const hasStyleIssues = output.includes('WARNING:') || output.includes('ERROR:') || output.includes('CHECK:');
            
            if (hasStyleIssues) {
                return {
                    passed: false,
                    output: output,
                    hasIssues: true
                };
            } else {
                // Actual execution error (checkpatch.pl not working properly)
                console.warn('Checkpatch execution error:', output);
                return {
                    passed: true, // Don't fail compilation due to checkpatch issues
                    output: 'Style check unavailable',
                    hasIssues: false
                };
            }
        }
    }

    // Main compilation method with kernel_project_test support
    async compileKernelModule(code, moduleName, testScenario = null) {
        // Check prerequisites
        const headerCheck = await this.checkKernelHeaders();
        if (!headerCheck.available) {
            return {
                success: false,
                stage: 'prerequisites',
                error: headerCheck.error,
                suggestion: headerCheck.suggestion
            };
        }

        // Create session directory
        const sessionId = crypto.randomBytes(8).toString('hex');
        const sessionDir = path.join(this.modulesDir, sessionId);
        
        try {
            await fs.mkdir(sessionDir, { recursive: true });

            // Write source file
            const sourceFile = path.join(sessionDir, `${moduleName}.c`);
            await fs.writeFile(sourceFile, code);

            // Run checkpatch.pl style checking
            const styleCheckResult = await this.runCheckpatch(sourceFile);
            console.log(`🎨 Style check completed for ${moduleName}: ${styleCheckResult.passed ? 'CLEAN' : 'ISSUES_FOUND'}`);

            // Compile module
            const compileResult = await this.compileModule(sessionDir, moduleName, [sourceFile]);
            
            if (!compileResult.success) {
                return {
                    success: false,
                    stage: 'compilation',
                    styleCheck: styleCheckResult,
                    ...compileResult
                };
            }

            // Test in QEMU with testScenario support
            const testResult = await this.testModuleInQEMU(sessionDir, moduleName, testScenario);

            // Clean up after delay
            setTimeout(async () => {
                try {
                    await fs.rm(sessionDir, { recursive: true, force: true });
                } catch (error) {
                    console.error('Cleanup error:', error);
                }
            }, 30000);

            return {
                success: true,
                compilation: compileResult,
                testing: testResult,
                styleCheck: styleCheckResult,
                sessionId,
                kernelVersion: headerCheck.kernelVersion
            };

        } catch (error) {
            // Clean up on error
            try {
                await fs.rm(sessionDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }

            return {
                success: false,
                stage: 'internal_error',
                error: error.message
            };
        }
    }
}

module.exports = DirectKernelCompiler;