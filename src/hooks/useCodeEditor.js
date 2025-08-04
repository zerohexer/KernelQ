import { useState, useEffect } from 'react';

const deepCopyFiles = (files) => {
    if (!files) return [];
    return files.map(file => ({
        name: file.name,
        content: file.content,
        readOnly: file.readOnly,
        language: file.language
    }));
};

const useCodeEditor = (currentChallenge) => {
    // Define initial states as constants
    const initialCodeEditor = {
        code: '',
        files: [],
        output: '',
        isRunning: false,
        testResults: [],
        overallResult: null,
        feedback: []
    };

    const initialPlayground = {
        code: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from Kernel Academy Playground!\\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from Kernel Academy Playground!\\n");
}

module_init(hello_init);
module_exit(hello_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Playground kernel module");
MODULE_AUTHOR("Kernel Academy Student");`,
        moduleName: 'playground_module',
        output: '',
        isRunning: false,
        compilationResult: null,
        testingResult: null
    };

    const [codeEditor, setCodeEditor] = useState(initialCodeEditor);
    const [playground, setPlayground] = useState(initialPlayground);

    // Sync code editor with current challenge
    useEffect(() => {
        if (currentChallenge) {
            console.log('Setting code editor with challenge:', currentChallenge.title);
            
            // Support both legacy single-file and new multi-file formats
            if (currentChallenge.files && currentChallenge.files.length > 0) {
                // Multi-file format
                console.log('Multi-file challenge detected with', currentChallenge.files.length, 'files');
                console.log('Original files:', currentChallenge.files.map(f => ({ name: f.name, contentLength: f.content?.length })));
                const copiedFiles = deepCopyFiles(currentChallenge.files);
                console.log('Copied files:', copiedFiles.map(f => ({ name: f.name, contentLength: f.content?.length })));
                setCodeEditor(prev => ({
                    ...prev,
                    code: '', // Legacy code field (kept for compatibility)
                    files: copiedFiles, // Proper deep copy
                    output: '',
                    isRunning: false,
                    testResults: []
                }));
            } else {
                // Legacy single-file format
                console.log('Single-file challenge detected');
                setCodeEditor(prev => ({
                    ...prev,
                    code: currentChallenge.starter || '',
                    files: [],
                    output: '',
                    isRunning: false,
                    testResults: []
                }));
            }
        }
    }, [currentChallenge]);

    const resetCodeEditor = () => {
        if (currentChallenge) {
            if (currentChallenge.files && currentChallenge.files.length > 0) {
                const copiedFiles = deepCopyFiles(currentChallenge.files);
                setCodeEditor(prev => ({
                    ...prev,
                    code: '',
                    files: copiedFiles,
                    output: '',
                    isRunning: false,
                    testResults: []
                }));
            } else {
                setCodeEditor(prev => ({
                    ...prev,
                    code: currentChallenge.starter || '',
                    files: [],
                    output: '',
                    isRunning: false,
                    testResults: []
                }));
            }
        }
    };

    const resetPlayground = () => {
        setPlayground(initialPlayground);
    };

    const resetAll = () => {
        setCodeEditor(initialCodeEditor);
        resetPlayground();
    };

    return {
        codeEditor,
        setCodeEditor,
        playground,
        setPlayground,
        resetCodeEditor,
        resetPlayground,
        resetAll
    };
};

export default useCodeEditor;