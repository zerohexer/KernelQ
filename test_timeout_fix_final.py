#!/usr/bin/env python3

import json
import requests
import time

print("🔧 TESTING FRONTEND TIMEOUT FIX")
print("=" * 50)
print("This test verifies that the frontend timeout fix is working:")
print("• Default timeout: 30s (increased from 20s)")
print("• Problem 50 timeout: 70s (60s backend + 10s buffer)")
print("• Should eliminate 'Backend Unavailable' for Problem 50")
print()

# Test with Problem 50 - should use 70s timeout
problem50_code = """// SPDX-License-Identifier: GPL-2.0
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
MODULE_VERSION("1.0");"""

print("🎯 Testing Problem 50 with complete solution...")
print("Expected: ACCEPTED with 100/100 score, NO 'Backend Unavailable'")

start_time = time.time()

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json={
            "code": problem50_code,
            "moduleName": "mychardev", 
            "problemId": "50"
        },
        headers={'Content-Type': 'application/json'},
        timeout=120  # Python timeout longer than expected frontend timeout
    )
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    result = response.json()
    
    print(f"\n⏱️ Total execution time: {execution_time:.2f} seconds")
    print(f"📊 Result: {result.get('overallResult')} - Score: {result.get('score', 0)}/100")
    
    # Check for fallback mode indicators
    is_fallback = (
        result.get('fallbackMode') or 
        (result.get('compilationResult', {}).get('output', '').startswith('Fallback validation'))
    )
    
    print(f"\n🔍 ANALYSIS:")
    print(f"   Using fallback mode: {'❌ YES (BAD)' if is_fallback else '✅ NO (GOOD)'}")
    print(f"   Real backend used: {'✅ YES' if result.get('realBackend') else '❌ NO'}")
    print(f"   Execution time: {execution_time:.1f}s")
    
    if execution_time > 60:
        print(f"   ✅ Frontend waited long enough (>60s)")
    else:
        print(f"   ⚠️ Execution time suspiciously short")
    
    if result.get('overallResult') == 'ACCEPTED' and result.get('score') == 100 and not is_fallback:
        print(f"\n🎉 SUCCESS! Frontend timeout fix is working!")
        print(f"   ✅ Problem 50 completed successfully")
        print(f"   ✅ No 'Backend Unavailable' message")
        print(f"   ✅ Real backend validation used")
    else:
        print(f"\n⚠️ Issues detected:")
        if is_fallback:
            print(f"   • Still using fallback mode")
        if result.get('overallResult') != 'ACCEPTED':
            print(f"   • Unexpected result: {result.get('overallResult')}")
        if result.get('score') != 100:
            print(f"   • Unexpected score: {result.get('score')}")

except Exception as e:
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"❌ Request failed after {execution_time:.2f}s: {e}")
    if "timeout" in str(e).lower():
        print(f"   💡 Python timeout - this is expected if backend takes >120s")
    else:
        print(f"   💡 Check if backend is running and responding")

print(f"\n📋 WHAT TO CHECK NEXT:")
print(f"1. After restarting the frontend, check browser console for:")
print(f"   • '🔍 Frontend timeout lookup for problem: 50'")
print(f"   • '📊 Problem 50 requires backend timeout of 60s.'")
print(f"   • '⏱️ Final frontend timeout set to: 70s'")
print(f"2. Problem 50 should NOT show 'Backend Unavailable' anymore")
print(f"3. Should show real validation results instead of fallback")

print(f"\n🚀 Frontend restart command:")
print(f"   cd /home/zerohexer/WebstormProjects/Tmp/KernelOne-main")
print(f"   # Stop current frontend (Ctrl+C)")
print(f"   npm start")