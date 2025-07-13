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
#define CLASS_NAME "myclass"
#define BUFFER_SIZE 1024

static dev_t device_number;
static struct class *device_class;
static struct device *device_struct;
static struct cdev device_cdev;

/* Device buffer to store data */
static char *device_buffer;
static int buffer_size = 0;
static int open_count = 0;

/* File operations forward declarations */
static int device_open(struct inode *inode, struct file *file);
static int device_release(struct inode *inode, struct file *file);
static ssize_t device_read(struct file *file, char __user *buffer, size_t length, loff_t *offset);
static ssize_t device_write(struct file *file, const char __user *buffer, size_t length, loff_t *offset);

/* File operations structure */
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
    .llseek = default_llseek,
};

/* Device open function */
static int device_open(struct inode *inode, struct file *file)
{
    open_count++;
    pr_info("mychardev: device opened (count: %d)\n", open_count);
    return 0;
}

/* Device release function */
static int device_release(struct inode *inode, struct file *file)
{
    open_count--;
    pr_info("mychardev: device closed (count: %d)\n", open_count);
    return 0;
}

/* Device read function */
static ssize_t device_read(struct file *file, char __user *buffer, size_t length, loff_t *offset)
{
    int bytes_to_read;
    int bytes_read = 0;
    
    /* Check if we're at end of buffer */
    if (*offset >= buffer_size) {
        return 0; /* EOF */
    }
    
    /* Calculate how many bytes we can read */
    bytes_to_read = buffer_size - *offset;
    if (bytes_to_read > length) {
        bytes_to_read = length;
    }
    
    /* Copy data to user space */
    if (copy_to_user(buffer, device_buffer + *offset, bytes_to_read)) {
        pr_err("mychardev: failed to copy data to user\n");
        return -EFAULT;
    }
    
    /* Update offset and return bytes read */
    *offset += bytes_to_read;
    bytes_read = bytes_to_read;
    
    pr_info("mychardev: read %d bytes\n", bytes_read);
    return bytes_read;
}

/* Device write function */
static ssize_t device_write(struct file *file, const char __user *buffer, size_t length, loff_t *offset)
{
    int bytes_to_write;
    
    /* Check if write would exceed buffer */
    if (*offset >= BUFFER_SIZE) {
        return -ENOSPC;
    }
    
    /* Calculate how many bytes we can write */
    bytes_to_write = BUFFER_SIZE - *offset;
    if (bytes_to_write > length) {
        bytes_to_write = length;
    }
    
    /* Copy data from user space */
    if (copy_from_user(device_buffer + *offset, buffer, bytes_to_write)) {
        pr_err("mychardev: failed to copy data from user\n");
        return -EFAULT;
    }
    
    /* Update offset and buffer size */
    *offset += bytes_to_write;
    if (*offset > buffer_size) {
        buffer_size = *offset;
    }
    
    pr_info("mychardev: written %d bytes\n", bytes_to_write);
    return bytes_to_write;
}

static int __init mydriver_init(void)
{
    int result;
    
    pr_info("mychardev: driver loaded\n");
    
    /* Allocate device buffer */
    device_buffer = kmalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!device_buffer) {
        pr_err("mychardev: failed to allocate buffer\n");
        return -ENOMEM;
    }
    memset(device_buffer, 0, BUFFER_SIZE);
    
    /* Allocate device number */
    result = alloc_chrdev_region(&device_number, 0, 1, DEVICE_NAME);
    if (result < 0) {
        pr_err("mychardev: failed to allocate device number\n");
        kfree(device_buffer);
        return result;
    }
    
    /* Initialize character device */
    cdev_init(&device_cdev, &fops);
    device_cdev.owner = THIS_MODULE;
    
    /* Add character device to system */
    result = cdev_add(&device_cdev, device_number, 1);
    if (result < 0) {
        pr_err("mychardev: failed to add device\n");
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return result;
    }
    
    /* Create device class */
    device_class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(device_class)) {
        pr_err("mychardev: failed to create device class\n");
        cdev_del(&device_cdev);
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return PTR_ERR(device_class);
    }
    
    /* Create device node */
    device_struct = device_create(device_class, NULL, device_number, NULL, DEVICE_NAME);
    if (IS_ERR(device_struct)) {
        pr_err("mychardev: failed to create device\n");
        class_destroy(device_class);
        cdev_del(&device_cdev);
        unregister_chrdev_region(device_number, 1);
        kfree(device_buffer);
        return PTR_ERR(device_struct);
    }
    
    pr_info("mychardev: device successfully registered with major %d\n", MAJOR(device_number));
    return 0;
}

static void __exit mydriver_exit(void)
{
    pr_info("mychardev: driver unloaded\n");
    
    /* Clean up in reverse order */
    device_destroy(device_class, device_number);
    class_destroy(device_class);
    cdev_del(&device_cdev);
    unregister_chrdev_region(device_number, 1);
    kfree(device_buffer);
    
    pr_info("mychardev: cleanup completed\n");
}

module_init(mydriver_init);
module_exit(mydriver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Student");
MODULE_DESCRIPTION("Advanced Character Device Driver");
MODULE_VERSION("1.0");