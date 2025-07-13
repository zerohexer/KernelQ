#!/usr/bin/env python3

import json
import requests
import time

# Test the timeout fix with Problem 50
solution_code = """// SPDX-License-Identifier: GPL-2.0
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

payload = {
    "code": solution_code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

print("🔧 Testing timeout fixes...")
print("- Frontend should now use 70s timeout (60s backend + 10s buffer)")
print("- Backend should add FINAL_MARKER for better detection")

start_time = time.time()

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120  # Give plenty of time for testing
    )
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    result = response.json()
    
    print(f"\n⏱️ Execution time: {execution_time:.2f} seconds")
    print(f"📊 Result: {result.get('overallResult')} - Score: {result.get('score', 0)}/100")
    
    # Check for timeout improvements
    if 'compilationResult' in result and 'directResults' in result['compilationResult']:
        direct = result['compilationResult']['directResults']
        if 'testing' in direct:
            testing = direct['testing']
            qemu_output = testing.get('output', '')
            
            has_final_marker = "FINAL_MARKER: SCRIPT_FINISHED_ATTEMPTING_SHUTDOWN" in qemu_output
            has_timeout_kill = "Killing hanging QEMU process" in qemu_output
            has_success = "QEMU_TEST_COMPLETE: SUCCESS" in qemu_output
            
            print(f"\n🔍 TIMEOUT FIX ANALYSIS:")
            print(f"   Final marker present: {'✅ YES' if has_final_marker else '❌ NO'}")
            print(f"   Timeout kill occurred: {'⚠️ YES' if has_timeout_kill else '✅ NO'}")
            print(f"   Success marker found: {'✅ YES' if has_success else '❌ NO'}")
            
            if has_final_marker and has_success:
                if has_timeout_kill:
                    print(f"   🎯 RESULT: SUCCESS detected despite QEMU hanging on exit")
                else:
                    print(f"   🎯 RESULT: Clean execution with improved markers")
            elif has_timeout_kill:
                print(f"   ⚠️ RESULT: Timeout occurred before test completion")
            else:
                print(f"   ✅ RESULT: Normal execution")
                
            # Show last few lines to see final marker
            print(f"\n📝 FINAL OUTPUT LINES:")
            lines = qemu_output.split('\n')
            for line in lines[-10:]:
                if line.strip():
                    print(f"   {line.strip()}")
    
    if result.get('overallResult') == 'ACCEPTED':
        print(f"\n🎉 SUCCESS! Timeout fixes working correctly")
    else:
        print(f"\n⚠️ Issue detected: {result.get('overallResult')}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print(f"\n💡 Frontend timeout fix: Problem 50 should now use 70s instead of 20s")
print(f"💡 Backend improvement: Better shutdown detection with FINAL_MARKER")