
#ifndef _KERNEL_MACROS_H
#define _KERNEL_MACROS_H

#define __KERNEL__
#define MODULE
#define KBUILD_BASENAME "kernel_module"
#define KBUILD_MODNAME "kernel_module"

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
