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
                ['sbin/lspci', '/bin/busybox'],  // GPU testing support
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
                ['bin/cut', '/bin/busybox'],
                ['bin/basename', '/bin/busybox'],  // GPU driver binding detection
                ['bin/readlink', '/bin/busybox']   // GPU driver binding detection
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

        // Add GCC development tools to QEMU environment for direct header validation
        try {
            await this.setupGccEnvironment(initramfsDir);
        } catch (error) {
            console.warn('⚠️  GCC setup failed, QEMU will run without development tools:', error.message);
        }

        // Copy ALL kernel modules (.ko files) from session directory
        try {
            const sessionFiles = await fs.readdir(sessionDir);
            const koFiles = sessionFiles.filter(f => f.endsWith('.ko'));

            if (koFiles.length === 0) {
                throw new Error('No .ko files found in session directory');
            }

            console.log(`📦 Copying ${koFiles.length} kernel module(s) to QEMU environment...`);
            for (const koFile of koFiles) {
                await this.copyFile(
                    path.join(sessionDir, koFile),
                    path.join(initramfsDir, 'lib/modules', koFile)
                );
                console.log(`  ✅ Copied: ${koFile}`);
            }
        } catch (error) {
            console.error('❌ Failed to copy kernel modules:', error.message);
            throw error;
        }

        // Copy header files for gcc compilation tests
        try {
            const headerFiles = await fs.readdir(sessionDir);
            for (const file of headerFiles) {
                if (file.endsWith('.h')) {
                    await this.copyFile(
                        path.join(sessionDir, file),
                        path.join(initramfsDir, 'lib/modules', file)
                    );
                    console.log(`📄 Copied header file: ${file}`);
                }
            }
        } catch (error) {
            console.warn('Header file copy warning:', error.message);
        }

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

        // Get list of all .ko files to determine module loading order
        const sessionFiles = await fs.readdir(sessionDir);
        const koFiles = sessionFiles.filter(f => f.endsWith('.ko'));

        // Generate dynamic init script based on test scenario
        const initScript = this.generateInitScript(moduleName, koFiles, testScenario);
        await fs.writeFile(path.join(initramfsDir, 'init'), initScript);
        await fs.chmod(path.join(initramfsDir, 'init'), 0o755);

        return initramfsDir;
    }

    // Helper function: Get QEMU args for different GPU device types
    // This makes problem creation easier - problems can use this helper
    // or specify qemuArgs directly for maximum flexibility
    getGPUQemuArgs(deviceType) {
        const gpuDevices = {
            // Simple framebuffer device (beginner-friendly)
            // Teaches: PCI probe, BAR mapping, framebuffer basics
            // Use for: Problem 41 - Basic GPU driver initialization
            'bochs': ['-device', 'bochs-display,addr=05.0', '-vga', 'none'],

            // Full virtio GPU with DRM/GEM support (intermediate)
            // Teaches: DRM device registration, GEM objects, command submission
            // Use for: Problem 42-44 - DRM/GEM patterns (AMD/NVIDIA/Intel generic)
            'virtio-gpu': ['-device', 'virtio-gpu-pci,addr=05.0', '-vga', 'none'],

            // VirtIO GPU with VGA compatibility (advanced)
            // Teaches: KMS/modesetting, legacy VGA + modern DRM
            // Use for: Problem 45+ - Advanced display management
            'virtio-vga': ['-device', 'virtio-vga,addr=05.0'],

            // VMware SVGA (alternative pattern)
            // Teaches: Different vendor approach, SVGA registers
            // Use for: Optional problems showing vendor diversity
            'vmware': ['-vga', 'vmware']
        };

        return gpuDevices[deviceType] || [];
    }

    // Helper function: Detect if this is a GPU driver problem
    // Checks module names and test commands for GPU-related keywords
    isGPUDriverProblem(koFiles, testScenario) {
        // Check module names for GPU keywords
        const hasGPUModule = koFiles.some(ko =>
            ko.includes('gpu') ||
            ko.includes('drm') ||
            ko.includes('display') ||
            ko.includes('video') ||
            ko.includes('graphics')
        );

        // Check test commands for GPU-related operations
        const hasGPUCommands = testScenario?.testCommands?.some(cmd =>
            cmd.includes('lspci') ||
            cmd.includes('/dev/dri') ||
            cmd.includes('/dev/fb') ||
            cmd.includes('drm') ||
            cmd.includes('VGA') ||
            cmd.includes('graphics')
        );

        return hasGPUModule || hasGPUCommands;
    }

    // Generate truly generic init script for kernel_project_test scenarios
    generateInitScript(moduleName, koFiles, testScenario) {
        // Determine module loading order
        // If multiple modules exist, load dependencies first
        let moduleLoadOrder = koFiles.map(ko => ko.replace('.ko', ''));

        // Special case: If we have both kernel_vector and sensor_vector,
        // load kernel_vector first (dependency)
        if (moduleLoadOrder.includes('kernel_vector') && moduleLoadOrder.includes('sensor_vector')) {
            moduleLoadOrder = ['kernel_vector', 'sensor_vector'];
        }

        // Detect if this is a GPU driver problem
        const isGPUProblem = this.isGPUDriverProblem(koFiles, testScenario);

        // Start with the boilerplate for any QEMU test
        let script = `#!/bin/sh
# Removed 'set -e' to prevent script from dying on any command failure
# Instead we use explicit error handling for critical operations
export PATH="/bin:/sbin:/usr/bin:/usr/sbin"

echo "=== QEMU Kernel Module Test Started ==="
echo "Module: ${moduleName}"
/bin/mount -t proc proc /proc 2>/dev/null || echo "proc mount failed"
/bin/mount -t sysfs sysfs /sys 2>/dev/null || echo "sysfs mount failed"
echo ""
`;

        // **GPU-SPECIFIC: Enumerate PCI devices BEFORE loading driver**
        // This helps students understand the hardware environment
        // and verify GPU device is present
        if (isGPUProblem) {
            script += `
echo "=== GPU Testing: PCI Device Enumeration ==="
echo "Scanning for VGA/Display devices..."
/sbin/lspci 2>/dev/null | grep -i "VGA\\|Display\\|3D" || echo "No VGA devices found"
echo ""
echo "PCI device tree:"
ls -la /sys/bus/pci/devices/ 2>/dev/null | head -10 || echo "PCI sysfs not available"
echo ""
`;
        }

        // **GENERIC PART 1: Run any setup commands defined in the problem**
        if (testScenario?.setupCommands?.length) {
            script += `echo "=== Running Setup Commands ==="
`;
            for (const cmd of testScenario.setupCommands) {
                script += `echo "-> Executing: ${cmd.replace(/"/g, '\\"')}"
${cmd} || echo "Setup command failed: ${cmd.replace(/"/g, '\\"')}"
`;
            }
        }

        // **GENERIC PART 2: Load ALL modules in dependency order**
        script += `
echo ""
echo "=== Loading Modules ==="
`;

        // Generate insmod commands for all modules
        for (let i = 0; i < moduleLoadOrder.length; i++) {
            const mod = moduleLoadOrder[i];
            const isLast = (i === moduleLoadOrder.length - 1);

            script += `echo "Loading module: ${mod}.ko"
if /sbin/insmod /lib/modules/${mod}.ko 2>&1; then
    echo "✅ Module ${mod} loaded successfully"
else
    echo "❌ Failed to load ${mod}.ko"
    /bin/dmesg | tail -10 2>/dev/null
    echo "❌ QEMU_TEST_COMPLETE: LOAD_FAILED"
    poweroff -f
    exit 1
fi
`;
        }

        script += `/bin/dmesg | tail -15 2>/dev/null || echo "dmesg not available"
`;

        // **GPU-SPECIFIC: Verify driver binding AFTER loading**
        // This shows students if their driver properly claimed the PCI device
        if (isGPUProblem) {
            script += `
echo ""
echo "=== GPU Testing: Driver Binding Verification ==="
echo "Checking if driver bound to PCI device..."
for dev in /sys/bus/pci/devices/*; do
    if [ -e "$dev/driver" ]; then
        DRIVER=$(basename $(readlink $dev/driver))
        DEVICE=$(basename $dev)
        echo "Device $DEVICE bound to driver: $DRIVER"
    fi
done
echo ""
echo "DRM devices:"
ls -la /dev/dri/ 2>/dev/null || echo "No DRM devices found"
echo ""
echo "Framebuffer devices:"
ls -la /dev/fb* 2>/dev/null || echo "No framebuffer devices found"
echo ""
`;
        }

        // **GENERIC PART 3: Run any test commands defined in the problem**
        if (testScenario?.testCommands?.length) {
            script += `
echo ""
echo "=== Running Test Commands ==="
`;
            for (const cmd of testScenario.testCommands) {
                script += `${cmd}
`;
            }
        }

        // **GENERIC PART 4: Run cleanup commands if defined**
        if (testScenario?.cleanupCommands?.length) {
            script += `
echo ""
echo "=== Running Cleanup Commands ==="
`;
            for (const cmd of testScenario.cleanupCommands) {
                script += `echo "-> Executing: ${cmd.replace(/"/g, '\\"')}"
${cmd} || echo "⚠️ Cleanup command failed but continuing: ${cmd.replace(/"/g, '\\"')}"
`;
            }
        }

        // **GENERIC PART 5: Unload ALL modules in reverse order**
        script += `
echo ""
echo "=== Unloading Modules ==="
`;

        // Unload modules in reverse order (dependencies last)
        const reverseOrder = [...moduleLoadOrder].reverse();
        for (const mod of reverseOrder) {
            script += `echo "Unloading module: ${mod}"
/sbin/rmmod ${mod} 2>&1 && echo "✅ Module ${mod} unloaded successfully" || echo "⚠️ Module ${mod} unload failed"
`;
        }

        script += `/bin/dmesg | tail -20 2>/dev/null || echo "dmesg not available after unload"
echo "✅ QEMU_TEST_COMPLETE: SUCCESS"

echo ""
echo "=== Test Completed - Shutting Down ==="
echo "FINAL_MARKER: SCRIPT_FINISHED_ATTEMPTING_SHUTDOWN"
sleep 1
poweroff -f
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

    // Setup GCC environment with cc1 for direct header validation
    async setupGccEnvironment(initramfsDir) {
        try {
            console.log('🔧 Setting up GCC environment for header validation...');

            // Create necessary directories for development tools
            const devDirs = [
                'usr/bin',
                'usr/lib64',
                'usr/lib64/gcc',
                'usr/lib64/gcc/x86_64-suse-linux',
                'usr/lib64/gcc/x86_64-suse-linux/7',
                'tmp'
            ];
            
            for (const dir of devDirs) {
                await fs.mkdir(path.join(initramfsDir, dir), { recursive: true });
            }

            // Copy TCC (Tiny C Compiler) - ultra fast, self-contained validation
            try {
                const tccPath = '/home/zerohexer/.local/bin/tcc';
                await this.copyFile(tccPath, path.join(initramfsDir, 'usr/bin/tcc'));
                await fs.chmod(path.join(initramfsDir, 'usr/bin/tcc'), 0o755);
                console.log(`✅ Copied TCC (345KB self-contained binary) - ultra fast!`);
                console.log('🎉 TCC-only environment setup completed (~20x faster than GCC)');
            } catch (error) {
                console.warn('⚠️  TCC setup failed, continuing without development tools:', error.message);
            }
            
        } catch (error) {
            console.warn('⚠️  TCC environment setup failed:', error.message);
        }
    }

    // Helper method to copy directories recursively
    async copyDirectoryRecursive(src, dest) {
        try {
            await fs.mkdir(dest, { recursive: true });
            const entries = await fs.readdir(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                
                if (entry.isDirectory()) {
                    await this.copyDirectoryRecursive(srcPath, destPath);
                } else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
        } catch (error) {
            // Ignore errors in directory copying - not critical
            console.warn(`Directory copy warning ${src} -> ${dest}: ${error.message}`);
        }
    }

    // Compile kernel module using direct make command
    async compileModule(sessionDir, moduleName, sourceFiles) {
        return new Promise(async (resolve) => {
            // Check if Makefile already exists (from multi-file project)
            const makefilePath = path.join(sessionDir, 'Makefile');
            let makefileExists = false;
            
            try {
                await fs.access(makefilePath);
                makefileExists = true;
                console.log('📋 Using provided Makefile');
            } catch (error) {
                // Makefile doesn't exist, we'll generate one
                console.log('📋 Generating default Makefile');
            }
            
            // Generate Makefile only if it doesn't exist
            const setupMakefile = makefileExists ? 
                Promise.resolve() : 
                fs.writeFile(makefilePath, this.generateMakefile(moduleName, sourceFiles));
            
            setupMakefile
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

                        buildProcess.on('close', async (buildCode) => {
                            if (buildCode === 0) {
                                // Check if .ko files were generated
                                try {
                                    const sessionFiles = await fs.readdir(sessionDir);
                                    const koFiles = sessionFiles.filter(f => f.endsWith('.ko'));

                                    if (koFiles.length === 0) {
                                        resolve({
                                            success: false,
                                            output: output,
                                            error: 'Compilation succeeded but no .ko files generated'
                                        });
                                    } else {
                                        console.log(`✅ Compilation successful: ${koFiles.length} module(s) built: ${koFiles.join(', ')}`);
                                        resolve({
                                            success: true,
                                            output: output,
                                            message: `Kernel module(s) compiled successfully: ${koFiles.join(', ')}`
                                        });
                                    }
                                } catch (error) {
                                    resolve({
                                        success: false,
                                        output: output,
                                        error: `Failed to verify .ko files: ${error.message}`
                                    });
                                }
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
                            '-m', '1024',  // Increased memory for GCC compilation
                            '-nographic',
                            '-append', 'console=ttyS0 init=/init loglevel=7 printk.console_loglevel=7'
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
                        const timeoutMs = (testScenario?.timeout || 15) * 1000; // Default 15 seconds
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
                            // - Or script completed successfully (even if QEMU hung on exit)
                            // - Or normal exit with reasonable output
                            const hasSuccessMarker = qemuOutput.includes('QEMU_TEST_COMPLETE: SUCCESS');
                            const hasLoadSuccess = qemuOutput.includes('✅ Module loaded successfully');
                            const hasTestOutput = qemuOutput.includes('=== QEMU Kernel Module Test Started ===');
                            const hasFinalMarker = qemuOutput.includes('FINAL_MARKER: SCRIPT_FINISHED_ATTEMPTING_SHUTDOWN');
                            
                            // If we have final marker + success marker, it's definitely successful
                            // even if QEMU hung during shutdown
                            const success = hasSuccessMarker || 
                                           (hasFinalMarker && hasLoadSuccess && hasTestOutput) ||
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
    // Supports both legacy single-file format and new multi-file format
    async compileKernelModule(codeOrFiles, moduleName, testScenario = null) {
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

            let sourceFiles = [];
            let styleCheckResult = { passed: true, output: 'No style check needed', hasIssues: false };

            // Handle both legacy single-file and new multi-file formats
            if (typeof codeOrFiles === 'string') {
                // Legacy single-file format
                const sourceFile = path.join(sessionDir, `${moduleName}.c`);
                await fs.writeFile(sourceFile, codeOrFiles);
                sourceFiles = [sourceFile];
                
                // Run checkpatch.pl style checking
                styleCheckResult = await this.runCheckpatch(sourceFile);
                console.log(`🎨 Style check completed for ${moduleName}: ${styleCheckResult.passed ? 'CLEAN' : 'ISSUES_FOUND'}`);
            } else if (Array.isArray(codeOrFiles)) {
                // New multi-file format
                console.log(`📁 Multi-file compilation for ${moduleName} (${codeOrFiles.length} files)`);
                
                // Extract ALL module names from Makefile
                let actualModuleName = moduleName;
                const makefileContent = codeOrFiles.find(f => f.name === 'Makefile')?.content;
                if (makefileContent) {
                    // Match ALL obj-m entries (handles multiple modules like "obj-m += kernel_vector.o sensor_vector.o")
                    const objMMatches = makefileContent.matchAll(/obj-m\s*\+=\s*([\w\s]+\.o)/g);
                    const allModules = [];

                    for (const match of objMMatches) {
                        // Split by whitespace and extract module names
                        const modules = match[1].split(/\s+/).filter(m => m.endsWith('.o')).map(m => m.replace('.o', ''));
                        allModules.push(...modules);
                    }

                    if (allModules.length > 0) {
                        actualModuleName = allModules[allModules.length - 1]; // Use last module as primary
                        console.log(`📁 Multi-file: Found ${allModules.length} module(s) in Makefile: ${allModules.join(', ')}`);
                        console.log(`📁 Multi-file: Using '${actualModuleName}' as primary module name`);
                    }
                }
                
                for (const file of codeOrFiles) {
                    const filePath = path.join(sessionDir, file.name);
                    await fs.writeFile(filePath, file.content);
                    
                    // Set appropriate permissions
                    if (file.name === 'Makefile') {
                        await fs.chmod(filePath, 0o644);
                    }
                    
                    // Collect C source files for compilation
                    if (file.name.endsWith('.c')) {
                        sourceFiles.push(filePath);
                    }
                }
                
                // Update moduleName for the rest of the compilation process
                moduleName = actualModuleName;
                
                // Run style check on all C files
                const styleResults = [];
                for (const sourceFile of sourceFiles) {
                    const result = await this.runCheckpatch(sourceFile);
                    styleResults.push(result);
                }
                
                // Combine style check results
                const hasIssues = styleResults.some(r => r.hasIssues);
                styleCheckResult = {
                    passed: !hasIssues,
                    output: styleResults.map(r => r.output).join('\n'),
                    hasIssues
                };
                
                console.log(`🎨 Style check completed for ${moduleName}: ${styleCheckResult.passed ? 'CLEAN' : 'ISSUES_FOUND'}`);
            } else {
                throw new Error('Invalid input format: expected string (legacy) or array (multi-file)');
            }

            // Compile module
            const compileResult = await this.compileModule(sessionDir, moduleName, sourceFiles);
            
            if (!compileResult.success) {
                return {
                    success: false,
                    stage: 'compilation',
                    styleCheck: styleCheckResult,
                    ...compileResult
                };
            }

            // TEMPORARY: Test KERN_INFO vs KERN_ERR theory - run QEMU for all problems
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
