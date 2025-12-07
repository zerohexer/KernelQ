import React, { useState, useRef, useEffect, useCallback } from 'react';

// Resizable Splitter Component
const ResizableSplitter = ({ leftPanelWidth, onWidthChange, children }) => {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current) return;
        
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        // Limit width between 20% and 70%
        const clampedWidth = Math.max(20, Math.min(70, newWidth));
        onWidthChange(clampedWidth);
    }, [isDragging, onWidthChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                height: '100%',
                position: 'relative',
                gap: '0px',
                flex: 1,
                minHeight: 0
            }}
        >
            {/* Left Panel */}
            <div style={{
                width: `${leftPanelWidth}%`,
                minWidth: '300px',
                height: '100%',
                overflow: 'hidden'
            }}>
                {children[0]}
            </div>

            {/* Resizable Splitter */}
            <div
                style={{
                    width: '8px',
                    cursor: 'col-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDragging ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                    borderLeft: isDragging ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                    borderRight: isDragging ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                    transition: isDragging ? 'none' : 'all 0.2s ease',
                    zIndex: 10
                }}
                onMouseDown={handleMouseDown}
            >
                <div style={{
                    width: '3px',
                    height: '32px',
                    background: isDragging ? 'rgba(0, 122, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '2px',
                    transition: isDragging ? 'none' : 'all 0.2s ease'
                }} />
            </div>

            {/* Right Panel */}
            <div style={{
                flex: 1,
                minWidth: '400px',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children[1]}
            </div>
        </div>
    );
};

export default ResizableSplitter;