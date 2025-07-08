cmake_minimum_required(VERSION 3.20)
project(KernelOne_Development C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Get actual kernel version
execute_process(COMMAND uname -r OUTPUT_VARIABLE KERNEL_VERSION OUTPUT_STRIP_TRAILING_WHITESPACE)

# Kernel development flags
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -D__KERNEL__ -DMODULE")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wundef -Wstrict-prototypes -Wno-trigraphs")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-strict-aliasing -fno-common -fshort-wchar")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror-implicit-function-declaration")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-format-security -std=gnu89")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -mno-sse -mno-mmx -mno-sse2 -mno-3dnow -mno-avx")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -m64 -falign-jumps=1 -falign-loops=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -mno-80387 -mno-fp-ret-in-387")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -mpreferred-stack-boundary=3")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=x86-64")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -maccumulate-outgoing-args")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_X86_64")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_CFI=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_CFI_SIGNAL_FRAME=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_CFI_SECTIONS=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_FXSAVEQ=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_SSSE3=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_CRC32=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_AVX=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_AVX2=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_AVX512=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_SHA1_NI=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DCONFIG_AS_SHA256_NI=1")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -pipe -Wno-sign-compare")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-asynchronous-unwind-tables")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -mindirect-branch=thunk-extern")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -mindirect-branch-register")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-jump-tables")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-delete-null-pointer-checks")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-frame-address")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-format-truncation")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-format-overflow")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-int-in-bool-context")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -O2")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wframe-larger-than=2048")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fstack-protector-strong")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-unused-but-set-variable")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-unused-const-variable")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-omit-frame-pointer")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-optimize-sibling-calls")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wdeclaration-after-statement")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wno-pointer-sign")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-strict-overflow")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-merge-all-constants")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fmerge-constants")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fno-stack-check")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fconserve-stack")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror=implicit-int")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror=strict-prototypes")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror=date-time")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror=incompatible-pointer-types")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror=designated-init")

# Kernel include paths (comprehensive)
include_directories(
        /lib/modules/${KERNEL_VERSION}/build/include
        /lib/modules/${KERNEL_VERSION}/build/include/linux
        /lib/modules/${KERNEL_VERSION}/build/include/uapi
        /lib/modules/${KERNEL_VERSION}/build/include/generated
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include/generated
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include/uapi
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include/generated/uapi
        /lib/modules/${KERNEL_VERSION}/source/include
        /lib/modules/${KERNEL_VERSION}/source/arch/x86/include
        /lib/modules/${KERNEL_VERSION}/source/include/uapi
        /lib/modules/${KERNEL_VERSION}/source/arch/x86/include/uapi
)

# Add preprocessor definitions for better IntelliSense
add_definitions(
        -D__KERNEL__
        -DMODULE
        -DKBUILD_BASENAME="kernel_module"
        -DKBUILD_MODNAME="kernel_module"
        -DCONFIG_X86_64=1
        -DCONFIG_64BIT=1
        -DCONFIG_MMU=1
        -DCONFIG_PREEMPT_VOLUNTARY=1
        -DCONFIG_HZ=1000
        -DCONFIG_GENERIC_HARDIRQS=1
        -DCONFIG_TRACE_IRQFLAGS_SUPPORT=1
        -DCONFIG_LOCKDEP_SUPPORT=1
        -DCONFIG_STACKTRACE_SUPPORT=1
        -DCONFIG_HAVE_LATENCYTOP_SUPPORT=1
        -DCONFIG_FAST_CMPXCHG_LOCAL=1
        -DCONFIG_X86_CMPXCHG64=1
        -DCONFIG_X86_DEBUGCTLMSR=1
        -DCONFIG_CPU_SUP_INTEL=1
        -DCONFIG_CPU_SUP_AMD=1
        -DCONFIG_X86_MCE=1
        -DCONFIG_X86_LOCAL_APIC=1
        -DCONFIG_X86_IO_APIC=1
        -DCONFIG_ACPI=1
        -DCONFIG_PCI=1
        -DCONFIG_SYSFS=1
        -DCONFIG_PROC_FS=1
        -DCONFIG_SLAB=1
        -DCONFIG_MODULES=1
        -DCONFIG_MODULE_UNLOAD=1
        -DCONFIG_MODVERSIONS=1
        -DCONFIG_KALLSYMS=1
        -DCONFIG_PRINTK=1
        -DCONFIG_BUG=1
        -DCONFIG_ELF_CORE=1
        -DCONFIG_BASE_FULL=1
        -DCONFIG_FUTEX=1
        -DCONFIG_EPOLL=1
        -DCONFIG_SIGNALFD=1
        -DCONFIG_TIMERFD=1
        -DCONFIG_EVENTFD=1
        -DCONFIG_SHMEM=1
        -DCONFIG_AIO=1
        -DCONFIG_ADVISE_SYSCALLS=1
        -DCONFIG_MEMBARRIER=1
        -DCONFIG_EMBEDDED=1
        -DCONFIG_HAVE_PERF_EVENTS=1
        -DCONFIG_PERF_USE_VMALLOC=1
        -DCONFIG_VM_EVENT_COUNTERS=1
        -DCONFIG_SLUB_DEBUG=1
        -DCONFIG_SLUB=1
        -DCONFIG_PROFILING=1
        -DCONFIG_TRACEPOINTS=1
        -DCONFIG_KPROBES=1
        -DCONFIG_JUMP_LABEL=1
        -DCONFIG_UPROBES=1
        -DCONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS=1
        -DCONFIG_ARCH_USE_BUILTIN_BSWAP=1
        -DCONFIG_HAVE_IOREMAP_PROT=1
        -DCONFIG_HAVE_KPROBES=1
        -DCONFIG_HAVE_KRETPROBES=1
        -DCONFIG_HAVE_OPTPROBES=1
        -DCONFIG_HAVE_KPROBES_ON_FTRACE=1
        -DCONFIG_HAVE_FUNCTION_TRACER=1
        -DCONFIG_HAVE_FUNCTION_GRAPH_TRACER=1
        -DCONFIG_HAVE_DYNAMIC_FTRACE=1
        -DCONFIG_HAVE_FTRACE_MCOUNT_RECORD=1
        -DCONFIG_HAVE_SYSCALL_TRACEPOINTS=1
        -DCONFIG_HAVE_C_RECORDMCOUNT=1
        -DCONFIG_TRACING=1
        -DCONFIG_GENERIC_TRACER=1
        -DCONFIG_FTRACE=1
        -DCONFIG_FUNCTION_TRACER=1
        -DCONFIG_FUNCTION_GRAPH_TRACER=1
        -DCONFIG_DYNAMIC_FTRACE=1
        -DCONFIG_FTRACE_MCOUNT_RECORD=1
        -DCONFIG_FTRACE_SYSCALLS=1
        -DCONFIG_BRANCH_PROFILE_NONE=1
        -DCONFIG_STACK_TRACER=1
        -DCONFIG_BLK_DEV_IO_TRACE=1
        -DCONFIG_KPROBE_EVENTS=1
        -DCONFIG_UPROBE_EVENTS=1
        -DCONFIG_PROBE_EVENTS=1
        -DCONFIG_DYNAMIC_EVENTS=1
        -DCONFIG_FTRACE_STARTUP_TEST=1
        -DCONFIG_MMIOTRACE=1
        -DCONFIG_TRACING_MAP=1
        -DCONFIG_HIST_TRIGGERS=1
        -DCONFIG_TRACE_ENUM_MAP_FILE=1
        -DCONFIG_PRINTK_TIME=1
        -DCONFIG_CONSOLE_LOGLEVEL_DEFAULT=7
        -DCONFIG_MESSAGE_LOGLEVEL_DEFAULT=4
        -DCONFIG_BOOT_PRINTK_DELAY=1
        -DCONFIG_DYNAMIC_DEBUG=1
)

# Find all C files in the project
file(GLOB_RECURSE KERNEL_SOURCES 
    "${CMAKE_CURRENT_SOURCE_DIR}/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/problems/**/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/examples/**/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/tests/**/*.c"
)

# Create a library target for better IntelliSense
add_library(kernel_navigation STATIC ${KERNEL_SOURCES})

# Set target properties
set_target_properties(kernel_navigation PROPERTIES
    C_STANDARD 11
    C_STANDARD_REQUIRED ON
    C_EXTENSIONS OFF
)

# Create individual targets for each problem to help with navigation
file(GLOB PROBLEM_DIRS "${CMAKE_CURRENT_SOURCE_DIR}/problems/*/")
foreach(PROBLEM_DIR ${PROBLEM_DIRS})
    get_filename_component(PROBLEM_NAME ${PROBLEM_DIR} NAME)
    file(GLOB PROBLEM_SOURCES "${PROBLEM_DIR}*.c")
    if(PROBLEM_SOURCES)
        add_library(${PROBLEM_NAME} STATIC ${PROBLEM_SOURCES})
        set_target_properties(${PROBLEM_NAME} PROPERTIES
            C_STANDARD 11
            C_STANDARD_REQUIRED ON
            C_EXTENSIONS OFF
        )
    endif()
endforeach()

# Create compile commands for better IDE support
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Add custom target to generate compile_commands.json
add_custom_target(compile_commands ALL
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CMAKE_BINARY_DIR}/compile_commands.json"
        "${CMAKE_SOURCE_DIR}/compile_commands.json"
    DEPENDS kernel_navigation
    COMMENT "Copying compile_commands.json to source directory"
)

# Add custom commands for kernel module compilation
add_custom_target(kernel_build
    COMMAND echo "Building kernel modules..."
    COMMAND find ${CMAKE_CURRENT_SOURCE_DIR} -name "*.c" -path "*/problems/*" -exec dirname {} \; | sort -u | xargs -I {} bash -c 'if [ -f "{}/Makefile" ]; then make -C {} clean && make -C {}; fi'
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Building actual kernel modules"
)

# Add custom target for kernel module testing
add_custom_target(kernel_test
    COMMAND echo "Testing kernel modules..."
    COMMAND find ${CMAKE_CURRENT_SOURCE_DIR} -name "*.ko" -path "*/problems/*" -exec echo "Found module: {}" \;
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Testing compiled kernel modules"
)

# Print configuration info
message(STATUS "Kernel Development Configuration:")
message(STATUS "  Kernel Version: ${KERNEL_VERSION}")
message(STATUS "  Build Directory: ${CMAKE_BINARY_DIR}")
message(STATUS "  Source Directory: ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "  C Compiler: ${CMAKE_C_COMPILER}")
message(STATUS "  C Flags: ${CMAKE_C_FLAGS}")
message(STATUS "  Export Compile Commands: ${CMAKE_EXPORT_COMPILE_COMMANDS}")

# Create .clangd configuration for better IDE support
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/.clangd"
"CompileFlags:
  Add: [-D__KERNEL__, -DMODULE, -std=gnu89, -Wall, -Wundef, -Wstrict-prototypes, -Wno-trigraphs, -fno-strict-aliasing, -fno-common, -fshort-wchar, -Werror-implicit-function-declaration, -Wno-format-security, -mno-sse, -mno-mmx, -mno-sse2, -mno-3dnow, -mno-avx, -m64, -falign-jumps=1, -falign-loops=1, -mno-80387, -mno-fp-ret-in-387, -mpreferred-stack-boundary=3, -march=x86-64, -maccumulate-outgoing-args, -DCONFIG_X86_64, -pipe, -Wno-sign-compare, -fno-asynchronous-unwind-tables, -mindirect-branch=thunk-extern, -mindirect-branch-register, -fno-jump-tables, -fno-delete-null-pointer-checks, -Wno-frame-address, -Wno-format-truncation, -Wno-format-overflow, -Wno-int-in-bool-context, -O2, -Wframe-larger-than=2048, -fstack-protector-strong, -Wno-unused-but-set-variable, -Wno-unused-const-variable, -fno-omit-frame-pointer, -fno-optimize-sibling-calls, -Wdeclaration-after-statement, -Wno-pointer-sign, -fno-strict-overflow, -fno-merge-all-constants, -fmerge-constants, -fno-stack-check, -fconserve-stack, -Werror=implicit-int, -Werror=strict-prototypes, -Werror=date-time, -Werror=incompatible-pointer-types, -Werror=designated-init]
  Remove: [-mno-sse*, -mno-mmx*, -mno-3dnow*, -mno-avx*, -mindirect-branch*, -fno-jump-tables*, -fstack-protector-strong*]
Diagnostics:
  Suppress: ['misc-definitions-in-headers', 'readability-identifier-naming', 'clang-diagnostic-gnu-designator']
  ClangTidy:
    Add: ['cert-*', 'performance-*', 'readability-*']
    Remove: ['readability-identifier-naming', 'cert-dcl37-c', 'cert-dcl51-cpp']
Index:
  Background: Build
Completion:
  AllScopes: true
Hover:
  ShowAKA: true
InlayHints:
  Enabled: true
  ParameterNames: true
  DeducedTypes: true
")

# Create .vscode configuration for better IDE support
file(MAKE_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/.vscode")
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/.vscode/c_cpp_properties.json"
"{
    \"version\": 4,
    \"configurations\": [
        {
            \"name\": \"Linux Kernel Development\",
            \"includePath\": [
                \"\${workspaceFolder}/**\",
                \"/lib/modules/${KERNEL_VERSION}/build/include\",
                \"/lib/modules/${KERNEL_VERSION}/build/include/linux\",
                \"/lib/modules/${KERNEL_VERSION}/build/include/uapi\",
                \"/lib/modules/${KERNEL_VERSION}/build/include/generated\",
                \"/lib/modules/${KERNEL_VERSION}/build/arch/x86/include\",
                \"/lib/modules/${KERNEL_VERSION}/build/arch/x86/include/generated\",
                \"/lib/modules/${KERNEL_VERSION}/build/arch/x86/include/uapi\",
                \"/lib/modules/${KERNEL_VERSION}/build/arch/x86/include/generated/uapi\",
                \"/lib/modules/${KERNEL_VERSION}/source/include\",
                \"/lib/modules/${KERNEL_VERSION}/source/arch/x86/include\",
                \"/lib/modules/${KERNEL_VERSION}/source/include/uapi\",
                \"/lib/modules/${KERNEL_VERSION}/source/arch/x86/include/uapi\"
            ],
            \"defines\": [
                \"__KERNEL__\",
                \"MODULE\",
                \"KBUILD_BASENAME=\\\"kernel_module\\\"\",
                \"KBUILD_MODNAME=\\\"kernel_module\\\"\",
                \"CONFIG_X86_64=1\",
                \"CONFIG_64BIT=1\",
                \"CONFIG_MMU=1\",
                \"CONFIG_MODULES=1\",
                \"CONFIG_PRINTK=1\",
                \"CONFIG_SLAB=1\",
                \"CONFIG_PROC_FS=1\",
                \"CONFIG_SYSFS=1\"
            ],
            \"compilerPath\": \"/usr/bin/gcc\",
            \"cStandard\": \"gnu89\",
            \"cppStandard\": \"gnu++17\",
            \"intelliSenseMode\": \"linux-gcc-x64\",
            \"compileCommands\": \"\${workspaceFolder}/compile_commands.json\"
        }
    ]
}
")

# Create .vscode settings for better development experience
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/.vscode/settings.json"
"{
    \"C_Cpp.default.configurationProvider\": \"ms-vscode.cmake-tools\",
    \"C_Cpp.default.compileCommands\": \"\${workspaceFolder}/compile_commands.json\",
    \"C_Cpp.default.cStandard\": \"gnu89\",
    \"C_Cpp.default.intelliSenseMode\": \"linux-gcc-x64\",
    \"C_Cpp.errorSquiggles\": \"Enabled\",
    \"C_Cpp.autocomplete\": \"Default\",
    \"C_Cpp.suggestSnippets\": true,
    \"C_Cpp.enhancedColorization\": \"Enabled\",
    \"files.associations\": {
        \"*.h\": \"c\",
        \"*.c\": \"c\",
        \"module.h\": \"c\",
        \"kernel.h\": \"c\",
        \"init.h\": \"c\",
        \"fs.h\": \"c\",
        \"device.h\": \"c\",
        \"cdev.h\": \"c\",
        \"uaccess.h\": \"c\",
        \"slab.h\": \"c\",
        \"mutex.h\": \"c\",
        \"spinlock.h\": \"c\",
        \"interrupt.h\": \"c\",
        \"wait.h\": \"c\",
        \"workqueue.h\": \"c\",
        \"timer.h\": \"c\",
        \"jiffies.h\": \"c\",
        \"proc_fs.h\": \"c\",
        \"seq_file.h\": \"c\"
    },
    \"editor.tabSize\": 8,
    \"editor.insertSpaces\": false,
    \"editor.detectIndentation\": false,
    \"editor.rulers\": [80, 120],
    \"editor.wordWrap\": \"wordWrapColumn\",
    \"editor.wordWrapColumn\": 120,
    \"files.trimTrailingWhitespace\": true,
    \"files.insertFinalNewline\": true,
    \"files.trimFinalNewlines\": true
}
")

message(STATUS "Created IDE configuration files:")
message(STATUS "  .clangd - for clangd language server")
message(STATUS "  .vscode/c_cpp_properties.json - for VS Code C/C++ extension")
message(STATUS "  .vscode/settings.json - for VS Code workspace settings")
message(STATUS "")
message(STATUS "To use this configuration:")
message(STATUS "  1. mkdir build && cd build")
message(STATUS "  2. cmake ..")
message(STATUS "  3. make")
message(STATUS "  4. Open project in VS Code or any IDE that supports compile_commands.json")
message(STATUS "")
message(STATUS "For kernel module compilation:")
message(STATUS "  make kernel_build")
message(STATUS "")
message(STATUS "For kernel module testing:")
message(STATUS "  make kernel_test")