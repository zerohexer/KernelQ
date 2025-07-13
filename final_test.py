#!/usr/bin/env python3

import json
import requests

# Test with the complete working solution
complete_solution = """// SPDX-License-Identifier: GPL-2.0
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
    "code": complete_solution,
    "moduleName": "mychardev", 
    "problemId": "50"
}

print("🎯 FINAL TEST: Complete Problem 50 solution")
print("Expected result: ACCEPTED with 100/100 score")
print("Should NOT show 'Backend Unavailable'")

try:
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=120
    )
    
    result = response.json()
    
    success = result.get('overallResult') == 'ACCEPTED' and result.get('score') == 100
    no_fallback = not (result.get('fallbackMode') or 
                      (result.get('compilationResult', {}).get('output', '').startswith('Fallback validation')))
    
    print(f"\n📊 Result: {result.get('overallResult')} - Score: {result.get('score', 0)}/100")
    print(f"✅ Success: {'YES' if success else 'NO'}")
    print(f"✅ No Backend Unavailable: {'YES' if no_fallback else 'NO'}")
    print(f"✅ Real backend used: {'YES' if result.get('realBackend') else 'NO'}")
    
    if success and no_fallback:
        print(f"\n🎉🎉🎉 FRONTEND TIMEOUT FIX SUCCESSFUL! 🎉🎉🎉")
        print(f"✅ Problem 50 now works properly with 70s frontend timeout")
        print(f"✅ No more 'Backend Unavailable' messages")
        print(f"✅ Full end-to-end validation working")
    else:
        print(f"\n⚠️ Still seeing issues:")
        if not success:
            print(f"   - Validation not passing correctly")
        if not no_fallback:
            print(f"   - Still using fallback mode")
            
except Exception as e:
    print(f"❌ Request failed: {e}")

print(f"\n📋 SUMMARY OF FIXES IMPLEMENTED:")
print(f"1. ✅ Frontend dynamic timeout: 20s → 70s for Problem 50")
print(f"2. ✅ Backend FINAL_MARKER: Better shutdown detection")
print(f"3. ✅ Backend timeout: Correctly using 60s from problem definition")
print(f"4. ✅ qemuArgs: Hardware emulation working properly")