// SPDX-License-Identifier: GPL-2.0
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
    
    pr_info("mychardev: driver loaded\n");
    
    // Just allocate device number - minimal approach
    ret = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("mychardev: Failed to allocate chrdev region\n");
        return ret;
    }
    
    // Initialize and add cdev
    cdev_init(&device_cdev, &fops);
    ret = cdev_add(&device_cdev, device_number, 1);
    if (ret < 0) {
        unregister_chrdev_region(device_number, 1);
        return ret;
    }
    
    pr_info("mychardev: device registered successfully\n");
    return 0;
}

static void __exit mydriver_exit(void)
{
    pr_info("mychardev: driver unloaded\n");
    cdev_del(&device_cdev);
    unregister_chrdev_region(device_number, 1);
}

module_init(mydriver_init);
module_exit(mydriver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Student");
MODULE_DESCRIPTION("Advanced Character Device Driver");
MODULE_VERSION("1.0");
