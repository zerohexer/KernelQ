#!/usr/bin/env python3

import json
import requests

# Create a problematic code that would cause QEMU to hang
hanging_code = '''// SPDX-License-Identifier: GPL-2.0
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DEVICE_NAME "mychardev"
#define CLASS_NAME "myclass"

static dev_t device_number;
static struct class *device_class;
static struct device *device_struct;
static struct cdev device_cdev;

static int device_open(struct inode *inode, struct file *file)
{
    // This will cause userspace test to hang/fail
    while(1) {
        // Infinite loop - should cause timeout
        msleep(1000);
    }
    return 0;
}

static int device_release(struct inode *inode, struct file *file)
{
    return 0;
}

static ssize_t device_read(struct file *file, char __user *buffer, size_t length, loff_t *offset)
{
    return 0;
}

static ssize_t device_write(struct file *file, const char __user *buffer, size_t length, loff_t *offset)
{
    return length;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init mydriver_init(void)
{
    int result;

    pr_info("mychardev: driver loaded\\n");

    result = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (result < 0)
        return result;

    cdev_init(&device_cdev, &fops);
    cdev_add(&device_cdev, device_number, 1);

    device_class = class_create(CLASS_NAME);
    device_struct = device_create(device_class, NULL, device_number, NULL, DEVICE_NAME);

    pr_info("mychardev: device successfully registered with major %d\\n", MAJOR(device_number));
    return 0;
}

static void __exit mydriver_exit(void)
{
    pr_info("mychardev: driver unloaded\\n");
    device_destroy(device_class, device_number);
    class_destroy(device_class);
    cdev_del(&device_cdev);
    unregister_chrdev_region(device_number, 1);
}

module_init(mydriver_init);
module_exit(mydriver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Student");
MODULE_DESCRIPTION("Advanced Character Device Driver");
MODULE_VERSION("1.0");'''

print("🔬 TESTING TIMEOUT BEHAVIOR")
print("Testing with code that should cause QEMU to hang...")

payload = {
    "code": hanging_code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120  # 2 minute timeout
    )
    
    result = response.json()
    
    print(f"📊 Overall Result: {result.get('overallResult')}")
    print(f"📈 Score: {result.get('score', 0)}/{result.get('maxScore', 100)}")
    
    # Check QEMU output for timeout indicators
    if 'compilationResult' in result and 'directResults' in result['compilationResult']:
        direct = result['compilationResult']['directResults']
        if 'testing' in direct:
            testing = direct['testing']
            qemu_output = testing.get('output', '')
            
            has_timeout_kill = "Killing hanging QEMU process" in qemu_output
            has_success_marker = "QEMU_TEST_COMPLETE: SUCCESS" in qemu_output
            has_device_test = "SUCCESS: Device opened successfully" in qemu_output
            
            print(f"\n🔍 TIMEOUT TEST ANALYSIS:")
            print(f"   Timeout kill detected: {'⚠️  YES' if has_timeout_kill else '✅ NO'}")
            print(f"   Success marker found: {'✅ YES' if has_success_marker else '❌ NO'}")
            print(f"   Device test reached: {'✅ YES' if has_device_test else '❌ NO'}")
            
            if has_timeout_kill and result.get('overallResult') == 'ACCEPTED':
                print(f"   🚨 FALSE POSITIVE: Timeout caused incorrect PASS")
            elif has_timeout_kill and result.get('overallResult') != 'ACCEPTED':
                print(f"   ✅ CORRECT: Timeout correctly detected as failure")
            else:
                print(f"   ✅ NORMAL: No timeout issues")
                
            # Show timeout-related output
            print(f"\n📝 TIMEOUT-RELATED OUTPUT:")
            lines = qemu_output.split('\n')
            for line in lines[-20:]:  # Last 20 lines
                if any(keyword in line for keyword in ["Killing", "timeout", "hanging", "SUCCESS:", "ERROR:"]):
                    print(f"   {line.strip()}")
                    
except Exception as e:
    print(f"❌ Error: {e}")

print(f"\n💡 This test helps determine if timeout kills cause false positives.")