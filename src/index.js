import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Patch ResizeObserver to prevent aggressive zoom errors
const patchResizeObserver = () => {
    const OriginalResizeObserver = window.ResizeObserver;
    
    window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
        constructor(callback) {
            let timeoutId;
            
            // Debounced callback to prevent rapid firing
            const debouncedCallback = (entries, observer) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    try {
                        callback(entries, observer);
                    } catch (error) {
                        // Silently handle ResizeObserver errors
                        if (!error.message?.includes('ResizeObserver loop completed')) {
                            console.error(error);
                        }
                    }
                }, 100); // 100ms debounce
            };
            
            super(debouncedCallback);
        }
    };
};

// Apply patch immediately when the app starts
patchResizeObserver();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);