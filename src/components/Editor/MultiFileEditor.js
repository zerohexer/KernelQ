import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import FileExplorer from './FileExplorer';
import CodeMirrorKernelEditor from './CodeMirrorKernelEditor';
import { Maximize2, Minimize2, FileText, Book } from 'lucide-react';

const MultiFileEditor = ({ 
  files, 
  mainFile, 
  onFilesChange, 
  premiumStyles,
  readOnly = false,
  showFileExplorer = true,
  height = '500px',
  requiredFiles = [],
  allowFileCreation = false,
  allowFileDeletion = false,
  parentFullScreen = false,
  editorFullScreen = false,
  onEditorFullScreenChange = null
}) => {
  // Generate unique session ID for this editor instance
  const sessionId = useRef(crypto.randomUUID()).current;
  
  // Dynamic LSP server URL based on environment with session ID
  const getLspServerUri = () => {
    const baseUri = window.location.hostname === 'localhost' 
      ? 'ws://localhost:3002' 
      : 'wss://lsp.kernelq.com';
    return `${baseUri}/?stack=clangd11&session=${sessionId}`;
  };
  const [activeFile, setActiveFile] = useState(mainFile || (files && files[0] ? files[0].name : ''));
  const [fileContents, setFileContents] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Use external full-screen state if provided
  const effectiveIsFullScreen = onEditorFullScreenChange ? editorFullScreen : isFullScreen;
  const handleFullScreenToggle = () => {
    if (onEditorFullScreenChange) {
      onEditorFullScreenChange(!editorFullScreen);
    } else {
      setIsFullScreen(!isFullScreen);
    }
  };
  const resizeTimeoutRef = useRef(null);

  // Initialize file contents from props
  useEffect(() => {
    if (files && files.length > 0) {
      // Always reset file contents when files prop changes
      const contents = {};
      files.forEach(file => {
        contents[file.name] = file.content || '';
      });
      setFileContents(contents);
      
      // Only set active file if:
      // 1. No active file is currently set, OR
      // 2. Current active file doesn't exist in the new files array
      const currentFileExists = files.find(f => f.name === activeFile);
      if (!activeFile || !currentFileExists) {
        if (mainFile && files.find(f => f.name === mainFile)) {
          setActiveFile(mainFile);
        } else if (files.length > 0) {
          setActiveFile(files[0].name);
        }
      }
    }
  }, [files, mainFile, activeFile]);

  // Auto file re-switch during zoom to fix Monaco scrollbar bug
  useEffect(() => {
    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        // Force Monaco recreation by switching to same file
        const currentFile = activeFile;
        if (currentFile) {
          setActiveFile('__temp__'); // Switch to temporary file
          setTimeout(() => {
            setActiveFile(currentFile); // Switch back - this triggers key change and Monaco recreation
          }, 10);
        }
      }, 200); // 200ms debounce for zoom operations
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [activeFile]);

  const handleFileSelect = (fileName) => {
    setActiveFile(fileName);
  };

  const handleFileCreate = (fileName, fileType = 'c') => {
    if (!allowFileCreation) return;
    
    const newFile = {
      name: fileName,
      content: getDefaultFileContent(fileName, fileType),
      readOnly: false,
      language: getLanguageFromFileName(fileName)
    };
    
    const updatedFiles = [...files, newFile];
    setFileContents(prev => ({
      ...prev,
      [fileName]: newFile.content
    }));
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
    
    setActiveFile(fileName);
  };

  const handleFileDelete = (fileName) => {
    if (!allowFileDeletion) return;
    
    const updatedFiles = files.filter(file => file.name !== fileName);
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[fileName];
      return newContents;
    });
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
    
    // If deleted file was active, switch to first available file
    if (activeFile === fileName && updatedFiles.length > 0) {
      setActiveFile(updatedFiles[0].name);
    }
  };

  const getDefaultFileContent = (fileName, fileType) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const baseName = fileName.split('.')[0];
    
    if (ext === 'h') {
      const guardName = `${baseName.toUpperCase()}_H`;
      return `#ifndef ${guardName}
#define ${guardName}

#include <linux/module.h>
#include <linux/kernel.h>

/* TODO: Add function declarations and definitions here */

#endif /* ${guardName} */`;
    } else if (ext === 'c') {
      const headerName = baseName + '.h';
      return `#include "${headerName}"

/* TODO: Implement functions here */`;
    }
    
    return '/* TODO: Add your code here */';
  };

  const handleCodeChange = (newCode) => {
    const updatedContents = {
      ...fileContents,
      [activeFile]: newCode
    };
    setFileContents(updatedContents);

    // Update the files array with new content
    if (onFilesChange) {
      const updatedFiles = files.map(file => 
        file.name === activeFile 
          ? { ...file, content: newCode }
          : file
      );
      onFilesChange(updatedFiles);
    }
  };

  const getCurrentFile = () => {
    return files?.find(file => file.name === activeFile);
  };

  const getCurrentFileContent = () => {
    // Always prioritize the current file content from files prop if available
    const currentFile = files?.find(file => file.name === activeFile);
    
    // If we have modified content in state, use that
    if (fileContents[activeFile] !== undefined) {
      return fileContents[activeFile];
    }
    
    // Otherwise use the original file content
    return currentFile?.content || '';
  };

  const getLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'c':
        return 'c';
      case 'h':
        return 'c'; // Header files use C syntax
      case 'makefile':
        return 'makefile';
      case 'sh':
        return 'bash';
      default:
        return 'c';
    }
  };

  if (!files || files.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...premiumStyles.glass.light,
        borderRadius: '12px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <FileText size={48} color={premiumStyles.colors.textTertiary} />
        <div style={{
          color: premiumStyles.colors.textSecondary,
          fontSize: premiumStyles.typography.sizes.lg,
          fontWeight: premiumStyles.typography.weights.medium
        }}>
          No files available
        </div>
      </div>
    );
  }

  const currentFile = getCurrentFile();
  const isCurrentFileReadOnly = currentFile?.readOnly || readOnly;

  return (
    <div style={{
        height: effectiveIsFullScreen ? '100vh' : height,
        width: '100%',
        display: 'flex',
        ...premiumStyles.glass.light,
        borderRadius: '12px',
        overflow: 'hidden',
        position: effectiveIsFullScreen ? 'fixed' : 'relative',
        top: effectiveIsFullScreen ? 0 : 'auto',
        left: effectiveIsFullScreen ? 0 : 'auto',
        zIndex: effectiveIsFullScreen ? 1000 : 'auto'
      }}>
      {/* File Explorer */}
      {showFileExplorer && (
        <div style={{
          position: 'relative',
          ...(effectiveIsFullScreen && {
            backdropFilter: 'blur(20px)',
            background: 'rgba(80, 80, 80, 0.65)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          })
        }}>
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onFileCreate={allowFileCreation ? handleFileCreate : null}
            onFileDelete={allowFileDeletion ? handleFileDelete : null}
            requiredFiles={requiredFiles}
            premiumStyles={premiumStyles}
          />
        </div>
      )}

      {/* Main Editor Area */}
      <div style={{ 
        flex: 1, 
        position: 'relative', // Create positioning context
        minWidth: 0 // Prevent flex item from overflowing
      }}>
        {/* Header with tabs and controls */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '49px', // Fixed header height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${premiumStyles.colors.border}`,
          backgroundColor: premiumStyles.colors.backgroundSecondary,
          zIndex: 10 // Above editor
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              color: premiumStyles.colors.text,
              fontSize: premiumStyles.typography.sizes.sm,
              fontWeight: premiumStyles.typography.weights.semibold
            }}>
              {activeFile}
            </span>
            {isCurrentFileReadOnly && (
              <span style={{
                color: premiumStyles.colors.warning,
                fontSize: premiumStyles.typography.sizes.xs,
                fontWeight: premiumStyles.typography.weights.medium,
                backgroundColor: `${premiumStyles.colors.warning}20`,
                padding: '2px 8px',
                borderRadius: '4px',
                border: `1px solid ${premiumStyles.colors.warning}40`
              }}>
                READ ONLY
              </span>
            )}
          </div>

          <button
            onClick={parentFullScreen ? handleFullScreenToggle : undefined}
            disabled={!parentFullScreen}
            title="Alt + C - Toggle Full-Screen"
            style={{
              background: 'none',
              border: 'none',
              color: parentFullScreen ? premiumStyles.colors.textSecondary : 'rgba(245, 245, 247, 0.3)',
              cursor: parentFullScreen ? 'pointer' : 'not-allowed',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: parentFullScreen ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (parentFullScreen) {
                e.target.style.backgroundColor = premiumStyles.colors.surfaceHover;
                e.target.style.color = premiumStyles.colors.text;
              }
            }}
            onMouseLeave={(e) => {
              if (parentFullScreen) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = premiumStyles.colors.textSecondary;
              }
            }}
          >
            {effectiveIsFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Editor - Completely separated with absolute positioning */}
        <div style={{
          position: 'absolute',
          top: '49px', // Start after header
          left: 0,
          right: 0,
          bottom: 0, // Fill remaining space
          overflow: 'hidden' // Constrain editor
        }}>
          {activeFile && activeFile.endsWith('.md') ? (
            // Render markdown files with ReactMarkdown
            <div style={{
              height: '100%',
              overflowY: 'auto',
              padding: '24px 32px',
              background: '#1e1e1e',
              color: '#d4d4d4',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    margin: '0 0 1.5rem 0',
                    color: '#ffffff',
                    borderBottom: '2px solid #007acc',
                    paddingBottom: '0.5rem'
                  }} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 600,
                    margin: '2rem 0 1rem 0',
                    color: '#ffffff',
                    borderBottom: '1px solid #444'
                  }} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    margin: '1.5rem 0 0.75rem 0',
                    color: '#4ec9b0'
                  }} {...props} />,
                  h4: ({node, ...props}) => <h4 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: '1.25rem 0 0.5rem 0',
                    color: '#4ec9b0'
                  }} {...props} />,
                  p: ({node, ...props}) => <p style={{
                    margin: '0 0 1rem 0',
                    lineHeight: '1.7',
                    fontSize: '1rem'
                  }} {...props} />,
                  code: ({node, inline, ...props}) => inline ? (
                    <code style={{
                      background: '#2d2d30',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#ce9178',
                      fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace',
                      fontSize: '0.9em'
                    }} {...props} />
                  ) : (
                    <code style={{
                      display: 'block',
                      background: '#2d2d30',
                      padding: '16px',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      color: '#d4d4d4',
                      fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace',
                      fontSize: '0.9em',
                      lineHeight: '1.5',
                      border: '1px solid #444'
                    }} {...props} />
                  ),
                  pre: ({node, ...props}) => <pre style={{
                    margin: '1rem 0',
                    background: '#2d2d30',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{
                    margin: '1rem 0',
                    paddingLeft: '2rem',
                    lineHeight: '1.7'
                  }} {...props} />,
                  ol: ({node, ...props}) => <ol style={{
                    margin: '1rem 0',
                    paddingLeft: '2rem',
                    lineHeight: '1.7'
                  }} {...props} />,
                  li: ({node, ...props}) => <li style={{
                    margin: '0.25rem 0'
                  }} {...props} />,
                  blockquote: ({node, ...props}) => <blockquote style={{
                    margin: '1rem 0',
                    padding: '0.5rem 1rem',
                    borderLeft: '4px solid #007acc',
                    background: '#2d2d30',
                    fontStyle: 'italic'
                  }} {...props} />,
                  a: ({node, ...props}) => <a style={{
                    color: '#3794ff',
                    textDecoration: 'none'
                  }} {...props} />,
                  hr: ({node, ...props}) => <hr style={{
                    margin: '2rem 0',
                    border: 'none',
                    borderTop: '1px solid #444'
                  }} {...props} />,
                  strong: ({node, ...props}) => <strong style={{
                    color: '#ffffff',
                    fontWeight: 700
                  }} {...props} />,
                  em: ({node, ...props}) => <em style={{
                    color: '#9cdcfe'
                  }} {...props} />
                }}
              >
                {getCurrentFileContent()}
              </ReactMarkdown>
            </div>
          ) : (
            // Render code files with CodeMirror
            <CodeMirrorKernelEditor
              key={activeFile}
              value={getCurrentFileContent()}
              onChange={handleCodeChange}
              readOnly={isCurrentFileReadOnly}
              theme="dark"
              height="100%"
              enableLSP={true} // Enable LSP for clangd server
              lspServerUri={getLspServerUri()} // Clangd WebSocket server
              documentUri={`file:///kernel-${sessionId}/${activeFile}`}
              sessionId={sessionId} // Pass session ID for isolation
              allFiles={files} // Pass all files for multi-file LSP support
              fileContents={fileContents} // Pass current file contents
              placeholder={`// Start coding in ${activeFile}...`}
              className="multi-file-editor-codemirror"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiFileEditor;
