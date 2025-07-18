// KERNEL DEVELOPMENT SPECIALIZATIONS - Independent Learning Areas
const phaseSystem = {
    foundations: {
        name: "Foundations",
        icon: "🏗️",
        description: "C programming essentials for kernel development",
        level: 1,
        unlocked: true,
        concepts: [
            { name: 'C Basics & Syntax', difficulty: 1, essential: true, topics: ['Variables', 'Control flow', 'Functions'] },
            { name: 'Pointers & Memory', difficulty: 2, essential: true, topics: ['Pointer arithmetic', 'Memory layout', 'Stack vs heap'] },
            { name: 'Structures & Unions', difficulty: 2, essential: true, topics: ['Struct packing', 'Bit fields', 'Memory alignment'] },
            { name: 'Function Pointers', difficulty: 3, essential: true, topics: ['Callbacks', 'Jump tables', 'Dynamic dispatch'] },
            { name: 'Preprocessor Directives', difficulty: 2, essential: true, topics: ['Macros', 'Conditional compilation', 'Header guards'] },
            { name: 'Static vs Dynamic Memory', difficulty: 3, essential: true, topics: ['malloc/free', 'Memory leaks', 'Fragmentation'] },
            { name: 'Bit Operations', difficulty: 3, essential: true, topics: ['Bitwise operators', 'Bit manipulation', 'Flags'] },
            { name: 'Inline Assembly Basics', difficulty: 4, essential: false, topics: ['GCC inline asm', 'Constraints', 'Clobbers'] }
        ],
        skills: ['C programming', 'Memory management', 'Low-level programming'],
        prerequisites: [],
        objectives: 'Build solid C foundation required for professional kernel programming',
        industryRelevance: 'Essential for all kernel roles at tech companies'
    },
    
    kernel_core: {
        name: "Kernel Core",
        icon: "🔧", 
        description: "Kernel architecture and module development",
        level: 2,
        unlocked: true,
        concepts: [
            { name: 'Kernel vs User Space', difficulty: 2, essential: true, topics: ['Address spaces', 'Privilege levels', 'System boundaries'] },
            { name: 'System Calls', difficulty: 3, essential: true, topics: ['syscall interface', 'Context switching', 'Parameter passing'] },
            { name: 'Kernel Module Basics', difficulty: 2, essential: true, topics: ['Module structure', 'init/exit functions', 'License requirements'] },
            { name: 'Module Loading/Unloading', difficulty: 2, essential: true, topics: ['insmod/rmmod', 'Module dependencies', 'Symbol resolution'] },
            { name: 'printk() and Logging', difficulty: 1, essential: true, topics: ['Log levels', 'Rate limiting', 'Debugging output'] },
            { name: 'Module Parameters', difficulty: 3, essential: true, topics: ['Parameter types', 'Permissions', 'Runtime modification'] },
            { name: 'Kernel Build System', difficulty: 3, essential: true, topics: ['Kbuild', 'Makefiles', 'Cross-compilation'] },
            { name: 'proc filesystem', difficulty: 3, essential: false, topics: ['proc entries', 'seq_file', 'User interaction'] }
        ],
        skills: ['Module development', 'Kernel debugging', 'System architecture'],
        prerequisites: [],
        objectives: 'Create and load kernel modules with confidence, understand kernel-user boundary',
        industryRelevance: 'Required for driver development roles'
    },

    memory_mgmt: {
        name: "Memory Management",
        icon: "💾",
        description: "Kernel memory allocation and virtual memory",
        level: 3,
        unlocked: true,
        concepts: [
            { name: 'kmalloc() vs vmalloc()', difficulty: 3, essential: true, topics: ['Physical vs virtual', 'Performance implications', 'Size limits'] },
            { name: 'GFP Flags', difficulty: 4, essential: true, topics: ['Allocation contexts', 'Atomic vs blocking', 'Zone modifiers'] },
            { name: 'DMA Memory', difficulty: 5, essential: true, topics: ['Coherent DMA', 'Streaming DMA', 'IOMMU'] },
            { name: 'Memory Mapping', difficulty: 5, essential: true, topics: ['mmap implementation', 'Page faults', 'VMA operations'] },
            { name: 'Page Allocation', difficulty: 6, essential: true, topics: ['Buddy allocator', 'Page reclaim', 'Memory compaction'] },
            { name: 'NUMA Awareness', difficulty: 7, essential: false, topics: ['Node topology', 'Local allocation', 'Migration'] },
            { name: 'Memory Barriers', difficulty: 6, essential: true, topics: ['Ordering guarantees', 'SMP safety', 'Compiler barriers'] },
            { name: 'Copy to/from User', difficulty: 4, essential: true, topics: ['Access checks', 'Page faults', 'Kernel hardening'] }
        ],
        skills: ['Memory allocation', 'DMA programming', 'Performance optimization'],
        prerequisites: [],
        objectives: 'Efficiently manage memory in kernel space like professional drivers',
        industryRelevance: 'Critical for NVIDIA GPU drivers, Intel graphics, storage systems'
    },

    drivers: {
        name: "Device Drivers",  
        icon: "⚡",
        description: "Hardware interaction and device driver development",
        level: 3,
        unlocked: true,
        concepts: [
            { name: 'Character Devices', difficulty: 4, essential: true, topics: ['cdev structure', 'File operations', 'Device nodes'] },
            { name: 'Block Devices', difficulty: 6, essential: true, topics: ['Request queues', 'BIO handling', 'Multiqueue'] },
            { name: 'Network Devices', difficulty: 7, essential: true, topics: ['netdev structure', 'Packet handling', 'NAPI'] },
            { name: 'PCI Device Handling', difficulty: 6, essential: true, topics: ['PCI enumeration', 'Configuration space', 'MSI/MSI-X'] },
            { name: 'Interrupt Handling', difficulty: 5, essential: true, topics: ['IRQ sharing', 'Top/bottom halves', 'Threaded IRQs'] },
            { name: 'Device Tree', difficulty: 6, essential: false, topics: ['DT bindings', 'Platform devices', 'Resource management'] },
            { name: 'Platform Drivers', difficulty: 5, essential: true, topics: ['Platform bus', 'Resource allocation', 'Power management'] },
            { name: 'USB Drivers', difficulty: 7, essential: false, topics: ['USB subsystem', 'URBs', 'Endpoint handling'] }
        ],
        skills: ['Hardware interfacing', 'Driver architecture', 'Real-world development'],
        prerequisites: [],
        objectives: 'Build production-quality device drivers for real hardware',
        industryRelevance: 'Core skill for hardware companies like Intel, NVIDIA, AMD'
    },

    synchronization: {
        name: "Synchronization & Concurrency",
        icon: "🔐",
        description: "Multi-core programming and race condition prevention",
        level: 4,
        unlocked: true,
        concepts: [
            { name: 'Atomic Operations', difficulty: 5, essential: true, topics: ['Hardware atomics', 'Memory ordering', 'Lock-free counters'] },
            { name: 'Spinlocks', difficulty: 4, essential: true, topics: ['Raw spinlocks', 'IRQ safety', 'Lock contention'] },
            { name: 'Mutexes & Semaphores', difficulty: 5, essential: true, topics: ['Sleeping locks', 'Priority inheritance', 'RT considerations'] },
            { name: 'RCU (Read-Copy-Update)', difficulty: 8, essential: true, topics: ['Grace periods', 'Callbacks', 'Synchronization'] },
            { name: 'Memory Ordering', difficulty: 7, essential: true, topics: ['Acquire/release', 'Weak ordering', 'Barriers'] },
            { name: 'Lock-free Programming', difficulty: 9, essential: false, topics: ['CAS operations', 'ABA problem', 'Hazard pointers'] },
            { name: 'Per-CPU Variables', difficulty: 6, essential: true, topics: ['CPU locality', 'Preemption safety', 'Statistics'] },
            { name: 'Workqueues', difficulty: 5, essential: true, topics: ['Deferred work', 'System workqueues', 'Custom workqueues'] }
        ],
        skills: ['Concurrency control', 'Performance optimization', 'Multi-core programming'],
        prerequisites: [],
        objectives: 'Write race-condition-free code suitable for high-performance systems',
        industryRelevance: 'Essential for scalable systems at Google, Facebook, server companies'
    },

    networking: {
        name: "Network Programming",
        icon: "🌐",
        description: "Network protocols and high-performance networking",
        level: 4,
        unlocked: true,
        concepts: [
            { name: 'Socket Buffers (skb)', difficulty: 6, essential: true, topics: ['skb structure', 'Data manipulation', 'Memory management'] },
            { name: 'Netfilter Hooks', difficulty: 7, essential: true, topics: ['Packet filtering', 'NAT', 'Connection tracking'] },
            { name: 'Network Namespaces', difficulty: 8, essential: false, topics: ['Isolation', 'Virtualization', 'Container networking'] },
            { name: 'Traffic Control', difficulty: 7, essential: false, topics: ['QoS', 'Scheduling', 'Shaping'] },
            { name: 'eBPF Programming', difficulty: 9, essential: false, topics: ['BPF bytecode', 'Verifier', 'Maps'] },
            { name: 'Network Device Drivers', difficulty: 8, essential: true, topics: ['DMA rings', 'NAPI polling', 'Hardware offloads'] },
            { name: 'Protocol Implementation', difficulty: 8, essential: false, topics: ['Custom protocols', 'Socket families', 'Protocol stacks'] },
            { name: 'XDP (eXpress Data Path)', difficulty: 9, essential: false, topics: ['Bypass networking', 'User-space drivers', 'DPDK integration'] }
        ],
        skills: ['Network programming', 'Protocol development', 'High-performance networking'],
        prerequisites: [],
        objectives: 'Develop high-performance networking components',
        industryRelevance: 'Critical for cloud providers, CDN companies, network equipment vendors'
    },

    filesystems: {
        name: "Filesystems & Storage",
        icon: "📁", 
        description: "Filesystem implementation and storage subsystems",
        level: 5,
        unlocked: true,
        concepts: [
            { name: 'VFS (Virtual File System)', difficulty: 7, essential: true, topics: ['VFS layer', 'Super blocks', 'Dentries'] },
            { name: 'Inode Operations', difficulty: 6, essential: true, topics: ['File metadata', 'Inode caching', 'Extended attributes'] },
            { name: 'File Operations', difficulty: 6, essential: true, topics: ['read/write', 'mmap', 'locking'] },
            { name: 'Block I/O Layer', difficulty: 8, essential: true, topics: ['Bio submission', 'Request merging', 'I/O scheduling'] },
            { name: 'Buffered I/O', difficulty: 7, essential: true, topics: ['Page cache', 'Writeback', 'Read-ahead'] },
            { name: 'Direct I/O', difficulty: 8, essential: false, topics: ['O_DIRECT', 'Alignment', 'Performance'] },
            { name: 'Filesystem Design', difficulty: 9, essential: false, topics: ['Journaling', 'B-trees', 'Copy-on-write'] },
            { name: 'Storage Performance', difficulty: 8, essential: false, topics: ['I/O patterns', 'Caching strategies', 'SSD optimization'] }
        ],
        skills: ['Filesystem development', 'Storage optimization', 'I/O performance'],
        prerequisites: [],
        objectives: 'Design and implement efficient storage solutions',
        industryRelevance: 'Important for storage companies, database vendors, cloud storage'
    },

    security: {
        name: "Security & Hardening",
        icon: "🛡️",
        description: "Kernel security and exploit mitigation",
        level: 6,
        unlocked: true,
        concepts: [
            { name: 'Kernel Address Sanitizer', difficulty: 6, essential: true, topics: ['KASAN', 'Use-after-free', 'Buffer overflows'] },
            { name: 'SMEP/SMAP', difficulty: 7, essential: true, topics: ['Hardware features', 'Exploit mitigation', 'User page access'] },
            { name: 'Control Flow Integrity', difficulty: 8, essential: false, topics: ['CFI', 'ROP/JOP protection', 'Compiler support'] },
            { name: 'Kernel Guard', difficulty: 7, essential: true, topics: ['Stack canaries', 'Fortify source', 'Bounds checking'] },
            { name: 'LSM (Linux Security Modules)', difficulty: 8, essential: false, topics: ['SELinux', 'AppArmor', 'Security hooks'] },
            { name: 'Secure Boot', difficulty: 7, essential: false, topics: ['UEFI', 'Code signing', 'Trust chain'] },
            { name: 'TEE (Trusted Execution)', difficulty: 9, essential: false, topics: ['ARM TrustZone', 'Intel SGX', 'Secure enclaves'] },
            { name: 'Vulnerability Analysis', difficulty: 8, essential: true, topics: ['Static analysis', 'Fuzzing', 'CVE assessment'] }
        ],
        skills: ['Security assessment', 'Exploit mitigation', 'Secure coding'],
        prerequisites: [],
        objectives: 'Write secure kernel code and identify vulnerabilities',
        industryRelevance: 'Critical for security companies, government contractors, enterprise vendors'
    },

    performance: {
        name: "Performance & Optimization",
        icon: "⚡",
        description: "Advanced performance tuning and optimization",
        level: 7,
        unlocked: true,
        concepts: [
            { name: 'CPU Cache Optimization', difficulty: 8, essential: true, topics: ['Cache hierarchies', 'False sharing', 'Prefetching'] },
            { name: 'Branch Prediction', difficulty: 7, essential: true, topics: ['Likely/unlikely', 'Profile-guided optimization', 'Branch patterns'] },
            { name: 'NUMA Optimization', difficulty: 8, essential: true, topics: ['Memory locality', 'CPU affinity', 'Balancing'] },
            { name: 'Lock Contention Analysis', difficulty: 7, essential: true, topics: ['Lockstat', 'Lock hierarchies', 'Scalability'] },
            { name: 'ftrace & perf', difficulty: 7, essential: true, topics: ['Function tracing', 'Performance counters', 'Flame graphs'] },
            { name: 'Hardware Performance Counters', difficulty: 8, essential: false, topics: ['PMU events', 'Sampling', 'Analysis'] },
            { name: 'Microarchitecture Tuning', difficulty: 9, essential: false, topics: ['CPU pipelines', 'Instruction latency', 'Throughput'] },
            { name: 'Real-time Constraints', difficulty: 8, essential: false, topics: ['RT kernel', 'Latency', 'Determinism'] }
        ],
        skills: ['Performance analysis', 'Optimization techniques', 'Profiling'],
        prerequisites: [],
        objectives: 'Optimize kernel code for maximum performance',
        industryRelevance: 'Essential for HPC, gaming, financial trading systems'
    },

    professional: {
        name: "Professional Development",
        icon: "🎓",
        description: "Enterprise-level kernel development and contribution",
        level: 8,
        unlocked: true,
        concepts: [
            { name: 'Kernel Contribution Process', difficulty: 6, essential: true, topics: ['LKML', 'Git workflow', 'Patch submission'] },
            { name: 'Code Review Standards', difficulty: 5, essential: true, topics: ['Coding style', 'Review process', 'Maintainer trees'] },
            { name: 'Regression Testing', difficulty: 7, essential: true, topics: ['Test automation', 'Bisection', 'CI systems'] },
            { name: 'Bisection & Debugging', difficulty: 7, essential: true, topics: ['git bisect', 'Crash analysis', 'Bug reporting'] },
            { name: 'Enterprise Integration', difficulty: 8, essential: true, topics: ['Vendor kernels', 'Backporting', 'Support lifecycle'] },
            { name: 'Vendor-specific Features', difficulty: 8, essential: false, topics: ['Hardware enablement', 'Platform support', 'Drivers'] },
            { name: 'Kernel Maintenance', difficulty: 9, essential: false, topics: ['Stable trees', 'Long-term support', 'Security updates'] },
            { name: 'Community Engagement', difficulty: 5, essential: true, topics: ['Conferences', 'Mailing lists', 'Mentoring'] }
        ],
        skills: ['Open source contribution', 'Enterprise development', 'Team collaboration'],
        prerequisites: [],
        objectives: 'Ready to contribute to Linux kernel and work at major tech companies',
        industryRelevance: 'Prepares for senior roles at NVIDIA, Intel, Canonical, SUSE, Red Hat'
    },

    gpu_drivers: {
        name: "GPU Drivers",
        icon: "🎮",
        description: "GPU driver development with real Linux kernel code",
        level: 9,
        unlocked: true,
        concepts: [
            { name: 'AMD GPU Architecture', difficulty: 9, essential: true, topics: ['AMDGPU driver', 'GEM/TTM', 'Command submission'] },
            { name: 'GPU Memory Management', difficulty: 8, essential: true, topics: ['VRAM allocation', 'GTT domains', 'Page tables'] },
            { name: 'DRM Framework', difficulty: 8, essential: true, topics: ['DRM subsystem', 'Mode setting', 'Atomic operations'] },
            { name: 'GPU Scheduling', difficulty: 9, essential: true, topics: ['Hardware queues', 'Context switching', 'Preemption'] },
            { name: 'Power Management', difficulty: 8, essential: true, topics: ['Dynamic clocking', 'Thermal management', 'Power states'] },
            { name: 'Display Pipeline', difficulty: 8, essential: false, topics: ['CRTC', 'Planes', 'Connectors'] },
            { name: 'Compute/OpenCL', difficulty: 9, essential: false, topics: ['Compute queues', 'HSA', 'ROCm integration'] },
            { name: 'GPU Firmware', difficulty: 9, essential: false, topics: ['Microcode loading', 'PSP', 'SMU communication'] }
        ],
        skills: ['GPU architecture', 'Graphics programming', 'Hardware acceleration'],
        prerequisites: [],
        objectives: 'Contribute to real GPU drivers like AMD AMDGPU or Intel i915',
        industryRelevance: 'Direct path to AMD, NVIDIA, Intel graphics teams'
    }
};

export default phaseSystem;