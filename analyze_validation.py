#!/usr/bin/env python3

import json
import requests
import time

def test_code(code, description):
    print(f"\n{'='*50}")
    print(f"🧪 TESTING: {description}")
    print(f"{'='*50}")
    
    payload = {
        "code": code,
        "moduleName": "mychardev", 
        "problemId": "50"
    }
    
    start_time = time.time()
    try:
        response = requests.post(
            'http://localhost:3001/api/validate-solution-comprehensive',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=300  # 5 minute timeout
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        result = response.json()
        
        print(f"⏱️  Total execution time: {execution_time:.2f} seconds")
        print(f"📊 Overall Result: {result.get('overallResult')}")
        print(f"📈 Score: {result.get('score', 0)}/{result.get('maxScore', 100)}")
        
        # Analyze compilation results
        if 'compilationResult' in result:
            comp_result = result['compilationResult']
            print(f"🔨 Compilation: {'✅ SUCCESS' if comp_result.get('success') else '❌ FAILED'}")
            
            if 'directResults' in comp_result:
                direct = comp_result['directResults']
                if 'testing' in direct:
                    testing = direct['testing']
                    print(f"🖥️  QEMU Testing: {'✅ SUCCESS' if testing.get('success') else '❌ FAILED'}")
                    
                    # Analyze QEMU output for clues about what happened
                    qemu_output = testing.get('output', '')
                    
                    # Check for timeout indicators
                    has_timeout_kill = "Killing hanging QEMU process" in qemu_output
                    has_success_marker = "QEMU_TEST_COMPLETE: SUCCESS" in qemu_output
                    has_load_success = "✅ Module loaded successfully" in qemu_output
                    has_device_test = "SUCCESS: Device opened successfully" in qemu_output
                    has_test_completion = "All device tests passed" in qemu_output
                    has_poweroff = "poweroff" in qemu_output.lower()
                    
                    print(f"\n🔍 QEMU ANALYSIS:")
                    print(f"   Timeout kill detected: {'⚠️  YES' if has_timeout_kill else '✅ NO'}")
                    print(f"   Success marker found: {'✅ YES' if has_success_marker else '❌ NO'}")
                    print(f"   Module load success: {'✅ YES' if has_load_success else '❌ NO'}")
                    print(f"   Device test success: {'✅ YES' if has_device_test else '❌ NO'}")
                    print(f"   Test completion: {'✅ YES' if has_test_completion else '❌ NO'}")
                    print(f"   Clean poweroff: {'✅ YES' if has_poweroff else '❌ NO'}")
                    
                    # Determine if this is a legitimate pass or timeout-induced pass
                    if has_timeout_kill:
                        if has_success_marker and has_test_completion:
                            print(f"   🎯 VERDICT: LEGITIMATE PASS (test completed before timeout)")
                        elif has_device_test and has_load_success:
                            print(f"   🎯 VERDICT: LIKELY LEGITIMATE (key tests passed before timeout)")
                        else:
                            print(f"   ⚠️  VERDICT: SUSPICIOUS (timeout may have caused false positive)")
                    else:
                        print(f"   ✅ VERDICT: CLEAN EXECUTION (no timeout issues)")
                    
                    # Show key output snippets
                    print(f"\n📝 KEY OUTPUT SNIPPETS:")
                    lines = qemu_output.split('\n')
                    for line in lines:
                        if any(keyword in line for keyword in [
                            "SUCCESS:", "ERROR:", "device opened", "device tests passed", 
                            "Module loaded", "QEMU_TEST_COMPLETE", "Killing hanging"
                        ]):
                            print(f"   {line.strip()}")
                    
                    print(f"\n📏 QEMU output length: {len(qemu_output)} characters")
                    
        # Show test breakdown
        if 'testResults' in result:
            passed_tests = [t for t in result['testResults'] if t.get('status') == 'PASSED']
            failed_tests = [t for t in result['testResults'] if t.get('status') != 'PASSED']
            
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            for test in passed_tests:
                print(f"   • {test.get('name', test.get('id'))}")
                
            if failed_tests:
                print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
                for test in failed_tests:
                    print(f"   • {test.get('name', test.get('id'))}: {test.get('status')}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Test Code 1: Full implementation with device class
code1 = '''// SPDX-License-Identifier: GPL-2.0
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
#define BUFFER_SIZE 1024

static dev_t device_number;
static struct class *device_class;
static struct device *device_struct;
static struct cdev device_cdev;

static char *device_buffer;
static int buffer_size;
static int open_count;

static int device_open(struct inode *inode, struct file *file)
{
    open_count++;
    pr_info("mychardev: device opened (count: %d)\\n", open_count);
    return 0;
}

static int device_release(struct inode *inode, struct file *file)
{
    open_count--;
    pr_info("mychardev: device closed (count: %d)\\n", open_count);
    return 0;
}

static ssize_t device_read(struct file *file, char __user *buffer, size_t length, loff_t *offset)
{
    int bytes_to_read;

    if (*offset >= buffer_size)
        return 0;

    bytes_to_read = buffer_size - *offset;
    if (bytes_to_read > length)
        bytes_to_read = length;

    if (copy_to_user(buffer, device_buffer + *offset, bytes_to_read))
        return -EFAULT;

    *offset += bytes_to_read;
    pr_info("mychardev: read %d bytes\\n", bytes_to_read);
    return bytes_to_read;
}

static ssize_t device_write(struct file *file, const char __user *buffer, size_t length, loff_t *offset)
{
    int bytes_to_write;

    if (*offset >= BUFFER_SIZE)
        return -ENOSPC;

    bytes_to_write = BUFFER_SIZE - *offset;
    if (bytes_to_write > length)
        bytes_to_write = length;

    if (copy_from_user(device_buffer + *offset, buffer, bytes_to_write))
        return -EFAULT;

    *offset += bytes_to_write;
    if (*offset > buffer_size)
        buffer_size = *offset;

    pr_info("mychardev: written %d bytes\\n", bytes_to_write);
    return bytes_to_write;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
    .llseek = default_llseek,
};

static int __init mydriver_init(void)
{
    int result;

    pr_info("mychardev: driver loaded\\n");

    device_buffer = kmalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!device_buffer)
        return -ENOMEM;
    memset(device_buffer, 0, BUFFER_SIZE);

    result = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (result < 0) {
        kfree(device_buffer);
        return result;
    }

    cdev_init(&device_cdev, &fops);
    device_cdev.owner = THIS_MODULE;

    result = cdev_add(&device_cdev, device_number, 1);
    if (result < 0) {
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return result;
    }

    device_class = class_create(CLASS_NAME);
    if (IS_ERR(device_class)) {
        cdev_del(&device_cdev);
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return PTR_ERR(device_class);
    }

    device_struct = device_create(device_class, NULL, device_number, NULL, DEVICE_NAME);
    if (IS_ERR(device_struct)) {
        class_destroy(device_class);
        cdev_del(&device_cdev);
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return PTR_ERR(device_struct);
    }

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
    kfree(device_buffer);

    pr_info("mychardev: cleanup completed\\n");
}

module_init(mydriver_init);
module_exit(mydriver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Student");
MODULE_DESCRIPTION("Advanced Character Device Driver");
MODULE_VERSION("1.0");'''

# Test Code 2: Minimal implementation without device class
code2 = '''// SPDX-License-Identifier: GPL-2.0
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DEVICE_NAME "mychardev"

// Required variables
static dev_t device_number;
static struct class *device_class;
static struct device *device_struct;
static struct cdev device_cdev;

// Device buffer
static char device_buffer[1024];
static size_t buffer_size = 0;

// File operations - minimal working versions
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
    
    // Just allocate device number - minimal approach
    ret = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("mychardev: Failed to allocate chrdev region\\n");
        return ret;
    }
    
    // Initialize and add cdev
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
MODULE_VERSION("1.0");'''

if __name__ == "__main__":
    print("🔬 VALIDATION ANALYSIS: Problem 50")
    print("Analyzing whether timeout affects validation accuracy...")
    
    # Test both codes
    result1 = test_code(code1, "Full Implementation (Should Pass)")
    result2 = test_code(code2, "Minimal Implementation (Should Fail)")
    
    print(f"\n{'='*70}")
    print("🏁 FINAL ANALYSIS")
    print(f"{'='*70}")
    
    if result1 and result2:
        print(f"Code 1 (Full): {result1.get('overallResult')} - Score: {result1.get('score', 0)}/100")
        print(f"Code 2 (Minimal): {result2.get('overallResult')} - Score: {result2.get('score', 0)}/100")
        
        print(f"\n🎯 VALIDATION ACCURACY ASSESSMENT:")
        
        # Check if results make sense
        if result1.get('overallResult') == 'ACCEPTED' and result2.get('overallResult') in ['WRONG_ANSWER', 'COMPILATION_ERROR']:
            print("✅ VALIDATION IS WORKING CORRECTLY")
            print("   • Full implementation passes as expected")
            print("   • Minimal implementation fails as expected")
            print("   • Score difference reflects actual functionality difference")
        else:
            print("⚠️  VALIDATION MAY HAVE ISSUES")
            print("   • Results don't match expected behavior")
            print("   • Timeout may be affecting accuracy")
            
    print(f"\n💡 TIMEOUT ANALYSIS COMPLETE")
    print("Check the detailed output above to understand QEMU execution patterns.")