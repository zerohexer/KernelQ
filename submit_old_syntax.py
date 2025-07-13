#!/usr/bin/env python3

import json
import requests

# Problem 50 solution using OLD class_create syntax (will fail)
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

	device_class = class_create(THIS_MODULE, CLASS_NAME);
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

# Prepare the request payload
payload = {
    "code": solution_code,
    "moduleName": "mychardev", 
    "problemId": "50"
}

# Send the request
try:
    print("🚀 Submitting Problem 50 with OLD class_create syntax...")
    print("📝 Using: device_class = class_create(THIS_MODULE, CLASS_NAME);")
    print(f"📏 Code length: {len(solution_code)} characters")
    
    response = requests.post(
        'http://localhost:3001/api/validate-solution-comprehensive',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=180
    )
    
    print(f"📊 Response status: {response.status_code}")
    
    result = response.json()
    
    print(f"\n🎯 RESULTS WITH OLD SYNTAX:")
    print(f"   Overall Result: {result.get('overallResult', 'Unknown')}")
    print(f"   Success: {result.get('success', False)}")
    print(f"   Score: {result.get('score', 0)}/{result.get('maxScore', 100)}")
    
    if 'compilationResult' in result:
        comp_result = result['compilationResult']
        print(f"   Compilation: {'✅ SUCCESS' if comp_result.get('success') else '❌ FAILED'}")
        
        if not comp_result.get('success'):
            print("\n🔍 COMPILATION ERROR DETAILS:")
            if 'directResults' in comp_result and 'output' in comp_result['directResults']:
                output = comp_result['directResults']['output']
                # Extract the key error lines
                lines = output.split('\n')
                for line in lines:
                    if 'error:' in line and ('class_create' in line or 'incompatible' in line or 'too many arguments' in line):
                        print(f"   ❌ {line.strip()}")
                        
    if result.get('overallResult') == 'COMPILATION_ERROR':
        print("\n❌ As expected: OLD class_create syntax fails on kernel 6.4+")
        print("💡 This demonstrates why we needed to use: class_create(CLASS_NAME)")
    else:
        print(f"\n⚠️ Unexpected result: {result.get('overallResult')}")
        
except Exception as e:
    print(f"❌ Error: {e}")