#!/usr/bin/env python3

import json
import requests
import time

# Test with a minimal implementation that should trigger timeout behavior
minimal_code = """// SPDX-License-Identifier: GPL-2.0
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DEVICE_NAME "mychardev"

static dev_t device_number;
static struct class *device_class;
static struct device *device_struct;
static struct cdev device_cdev;

static char device_buffer[1024];
static size_t buffer_size = 0;

static int device_open(struct inode *inode, struct file *file)
{
    return 0;
}

static int device_release(struct inode *inode, struct file *file)
{
    return 0;
}

static ssize_t device_read(struct file *file, char __user *buffer, size_t count, loff_t *offset)
{
    size_t to_read = min(count, buffer_size - *offset);
    
    if (*offset >= buffer_size)
        return 0;
    
    if (copy_to_user(buffer, device_buffer + *offset, to_read))
        return -EFAULT;
    
    *offset += to_read;
    return to_read;
}

static ssize_t device_write(struct file *file, const char __user *buffer, size_t count, loff_t *offset)
{
    size_t to_write = min(count, sizeof(device_buffer) - *offset);
    
    if (*offset >= sizeof(device_buffer))
        return -ENOSPC;
    
    if (copy_from_user(device_buffer + *offset, buffer, to_write))
        return -EFAULT;
    
    *offset += to_write;
    
    if (*offset > buffer_size)
        buffer_size = *offset;
    
    return to_write;
}

static const struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init mydriver_init(void)
{
    int ret;
    
    pr_info("mychardev: driver loaded\\n");
    
    ret = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("mychardev: Failed to allocate chrdev region\\n");
        return ret;
    }
    
    cdev_init(&device_cdev, &fops);
    ret = cdev_add(&device_cdev, device_number, 1);
    if (ret < 0) {
        unregister_chrdev_region(device_number, 1);
        return ret;
    }
    
    pr_info("mychardev: device registered successfully\\n");
    return 0;
}

static void __exit mydriver_exit(void)
{
    pr_info("mychardev: driver unloaded\\n");
    cdev_del(&device_cdev);
    unregister_chrdev_region(device_number, 1);
}

module_init(mydriver_init);
module_exit(mydriver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Student");
MODULE_DESCRIPTION("Advanced Character Device Driver");
MODULE_VERSION("1.0");"""

payload = {
    "code": minimal_code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

print("🔍 Testing minimal code that should hit 60s timeout...")
start_time = time.time()

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120  # Frontend timeout longer than backend
    )
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    result = response.json()
    
    print(f"⏱️ Total execution time: {execution_time:.2f} seconds")
    print(f"📊 Result: {result.get('overallResult')} - Score: {result.get('score', 0)}/100")
    
    # Check for timeout behavior
    if 'compilationResult' in result and 'directResults' in result['compilationResult']:
        direct = result['compilationResult']['directResults']
        if 'testing' in direct:
            testing = direct['testing']
            qemu_output = testing.get('output', '')
            
            has_timeout_kill = "Killing hanging QEMU process" in qemu_output
            timeout_duration = None
            
            # Look for timeout duration
            for line in qemu_output.split('\n'):
                if "Killing hanging QEMU process after" in line:
                    try:
                        # Extract timeout value
                        parts = line.split("after ")[1].split("s timeout")[0]
                        timeout_duration = float(parts)
                    except:
                        pass
            
            print(f"\n🕰️ TIMEOUT ANALYSIS:")
            print(f"   Timeout kill occurred: {'⚠️ YES' if has_timeout_kill else '✅ NO'}")
            if timeout_duration:
                print(f"   Timeout duration used: {timeout_duration}s")
                if timeout_duration == 60.0:
                    print(f"   ✅ CORRECT: Using 60s timeout from problem definition")
                elif timeout_duration == 15.0:
                    print(f"   ❌ WRONG: Using default 15s timeout (testScenario not passed)")
                else:
                    print(f"   ⚠️ UNEXPECTED: Using {timeout_duration}s timeout")
            
            # Check if we see the timeout configuration debug message in output
            for line in qemu_output.split('\n'):
                if "QEMU timeout configuration" in line:
                    print(f"   🔧 Debug: {line}")
    
    if execution_time > 50:
        print(f"\n⚠️ Long execution time ({execution_time:.1f}s) suggests timeout issues")
    else:
        print(f"\n✅ Reasonable execution time ({execution_time:.1f}s)")
        
except Exception as e:
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"❌ Error after {execution_time:.2f}s: {e}")

print(f"\n💡 If timeout is 15s instead of 60s, the testScenario isn't being passed correctly")
print(f"💡 If timeout is 60s, then the frontend/backend timeout mismatch is the issue")