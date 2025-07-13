#!/usr/bin/env python3

import json
import requests
import time

# Test the minimal code that should trigger the read failure but not timeout
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

print("🔧 Testing frontend timeout fix...")
print("Expected behavior:")
print("- Frontend should use 70s timeout (60s + 10s buffer)")  
print("- Should NOT show 'Backend Unavailable'")
print("- Should show actual validation result (likely WRONG_ANSWER)")

start_time = time.time()

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120  # Give plenty of time
    )
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    result = response.json()
    
    print(f"\n⏱️ Execution time: {execution_time:.2f} seconds")
    print(f"📊 Result: {result.get('overallResult')} - Score: {result.get('score', 0)}/100")
    
    # Check if it's using fallback mode
    has_fallback = any(key in result for key in ['fallbackMode', 'error']) and \
                   result.get('compilationResult', {}).get('output', '').startswith('Fallback validation')
    
    print(f"\n🔍 FRONTEND FIX ANALYSIS:")
    print(f"   Using fallback mode: {'❌ YES (BAD)' if has_fallback else '✅ NO (GOOD)'}")
    print(f"   Real backend used: {'✅ YES' if result.get('realBackend') else '❌ NO'}")
    
    if has_fallback:
        print(f"   💡 Frontend timeout still too short - needs debugging")
    else:
        print(f"   🎉 Frontend timeout fix working!")
        
    # Check for specific output patterns
    compilation = result.get('compilationResult', {})
    if compilation.get('output'):
        if 'Fallback validation' in compilation['output']:
            print(f"   ⚠️ Still seeing fallback validation output")
        else:
            print(f"   ✅ Real compilation output detected")
    
    print(f"\n📝 Backend response type: {'Real backend' if result.get('realBackend') else 'Fallback'}")
    
except Exception as e:
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"❌ Request failed after {execution_time:.2f}s: {e}")
    print(f"💡 This might indicate frontend timeout is still too short")

print(f"\n💡 Check browser console for frontend timeout debug messages!")
print(f"💡 Look for: '🔍 Frontend timeout lookup', '📊 Problem 50 requires', '⏱️ Final frontend timeout'")