cmake_minimum_required(VERSION 3.20)
project(kernel_development C)

set(CMAKE_C_STANDARD 11)

# Kernel module flags without KBUILD_MODNAME
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -D__KERNEL__ -DMODULE")

# Get actual kernel version
execute_process(COMMAND uname -r OUTPUT_VARIABLE KERNEL_VERSION OUTPUT_STRIP_TRAILING_WHITESPACE)

# Kernel include paths
include_directories(
        /lib/modules/${KERNEL_VERSION}/build/include
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include
        /lib/modules/${KERNEL_VERSION}/build/arch/x86/include/generated
        /lib/modules/${KERNEL_VERSION}/source/include
        # Add system include paths for better syntax checking
        /usr/include
        /usr/include/linux
        /usr/include/asm-generic
        /usr/include/asm
)

# All local .c files
file(GLOB LOCAL_SOURCES "*.c")

# Create a dummy main.c if no sources exist
if(NOT LOCAL_SOURCES)
    file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/main.c" 
        "#include <linux/module.h>\n#include <linux/kernel.h>\n\nstatic int __init hello_init(void) {\n    return 0;\n}\n\nstatic void __exit hello_exit(void) {\n}\n\nmodule_init(hello_init);\nmodule_exit(hello_exit);\nMODULE_LICENSE(\"GPL\");\n")
    set(LOCAL_SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/main.c")
endif()

# Create target for LSP navigation
add_executable(kernel_navigation ${LOCAL_SOURCES})

# Force include essential kernel headers for macro definitions
target_compile_options(kernel_navigation PRIVATE
    -std=gnu89
    -Wall
    -Wundef
    -Wstrict-prototypes
    -fno-strict-aliasing
    -fno-common
    -fshort-wchar
    -Werror-implicit-function-declaration
    -O2
    # Force include kernel headers that define __init, __exit, etc.
    -include ${CMAKE_CURRENT_SOURCE_DIR}/kernel_macros.h
)

# Create a kernel macros header file that includes the real kernel definitions
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/kernel_macros.h" "
#ifndef _KERNEL_MACROS_H
#define _KERNEL_MACROS_H

#define __KERNEL__
#define MODULE
#define KBUILD_BASENAME \"kernel_module\"
#define KBUILD_MODNAME \"kernel_module\"

// Include real kernel headers for macro definitions
#ifdef __has_include
#if __has_include(<linux/init.h>)
#include <linux/init.h>
#endif
#if __has_include(<linux/module.h>)
#include <linux/module.h>
#endif
#if __has_include(<linux/kernel.h>)
#include <linux/kernel.h>
#endif
#if __has_include(<linux/compiler.h>)
#include <linux/compiler.h>
#endif
#endif

#endif /* _KERNEL_MACROS_H */
")