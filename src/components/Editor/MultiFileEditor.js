import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import FileExplorer from './FileExplorer';
import CodeMirrorKernelEditor from './CodeMirrorKernelEditor';
import { Maximize2, Minimize2, FileText, Book, RotateCcw, Play, HelpCircle, X } from 'lucide-react';

// ============ INLINE CODE PREPROCESSOR ============
// Converts double backticks ``text`` to markers for truly inline rendering
// Single backticks remain as block-style code

const INLINE_CODE_MARKER = '{{ICODE:';
const INLINE_CODE_END = '}}';

// Pre-process content to convert ``text`` to markers
// IMPORTANT: Skip content inside fenced code blocks (```)
const preprocessDoubleBackticks = (content) => {
  if (!content) return content;

  // Split by fenced code blocks to avoid processing them
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Odd indices are fenced code blocks - don't process
    if (i % 2 === 1) return part;
    // Even indices are regular content - convert ``text`` to markers
    return part.replace(/``([^`]+)``/g, `${INLINE_CODE_MARKER}$1${INLINE_CODE_END}`);
  }).join('');
};

// Inline code style (truly inline, no newlines)
const trueInlineCodeStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  padding: '2px 6px',
  borderRadius: '4px',
  color: 'rgba(245, 245, 247, 0.9)',
  fontFamily: '"SF Mono", Monaco, monospace',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
};

// Render text with inline code markers
const renderWithInlineCode = (children) => {
  // Handle string children
  if (typeof children === 'string') {
    if (!children.includes(INLINE_CODE_MARKER)) return children;

    const regex = /\{\{ICODE:(.+?)\}\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(children)) !== null) {
      if (match.index > lastIndex) {
        parts.push(children.slice(lastIndex, match.index));
      }
      parts.push(
        <code key={`ic-${key++}`} style={trueInlineCodeStyle}>{match[1]}</code>
      );
      lastIndex = regex.lastIndex;
    }

    if (parts.length > 0) {
      if (lastIndex < children.length) {
        parts.push(children.slice(lastIndex));
      }
      return parts;
    }
    return children;
  }

  // Handle array of children - wrap in fragment to preserve structure
  if (Array.isArray(children)) {
    let hasMarkers = false;
    const processed = children.map((child, i) => {
      if (typeof child === 'string') {
        const result = renderWithInlineCode(child);
        if (Array.isArray(result)) {
          hasMarkers = true;
          return <React.Fragment key={`frag-${i}`}>{result}</React.Fragment>;
        }
        return result;
      }
      // Return React elements as-is (they already have their own keys from ReactMarkdown)
      return child;
    });
    // If we processed markers, wrap result; otherwise return as-is
    return hasMarkers ? processed : children;
  }

  return children;
};

// ============ END INLINE CODE PREPROCESSOR ============

// ============ MARKDOWN TABLE PARSER (Option B) ============
// Parses markdown tables and renders them as React components
// No external dependencies - pure custom implementation

const parseMarkdownTable = (tableText) => {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  const parseRow = (line) => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove empty first AND last from | borders
  };

  const headers = parseRow(lines[0]);

  // Parse alignment from separator row (|---|:---:|---:|)
  const separatorRow = lines[1];
  const alignments = parseRow(separatorRow).map(cell => {
    const trimmed = cell.replace(/-/g, '').trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });

  const rows = lines.slice(2)
    .map(parseRow)
    .filter(row => row.length > 0 && row.some(cell => cell.trim()));

  return { headers, alignments, rows };
};

// Render inline markdown (bold, italic, code) within table cells
const renderCellContent = (text) => {
  if (!text) return text;

  const elements = [];
  let key = 0;

  // Handle both regular backticks and inline code markers
  // Pattern: match `code` (single backtick) or {{ICODE:code}} (inline marker)
  const combinedRegex = /`([^`]+)`|\{\{ICODE:(.+?)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    // match[1] is from single backticks, match[2] is from inline markers
    const codeContent = match[1] || match[2];
    elements.push(
      <code key={key++} style={{
        background: 'rgba(255, 255, 255, 0.08)',
        padding: '2px 5px',
        borderRadius: '3px',
        color: 'rgba(245, 245, 247, 0.9)',
        fontFamily: '"SF Mono", Monaco, monospace',
        fontSize: '0.9rem'
      }}>{codeContent}</code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (elements.length > 0) {
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    return elements;
  }

  return text;
};

const MarkdownTable = ({ tableText }) => {
  const parsed = parseMarkdownTable(tableText);
  if (!parsed) return <pre>{tableText}</pre>;

  const { headers, alignments, rows } = parsed;

  const tableStyles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '16px 0',
      fontSize: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
    },
    th: {
      background: 'rgba(255, 255, 255, 0.06)',
      color: '#f5f5f7',
      fontWeight: 600,
      padding: '10px 12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '1rem'
    },
    td: {
      padding: '10px 12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      color: 'rgba(245, 245, 247, 0.8)',
      fontSize: '1rem'
    },
    trEven: {
      background: 'rgba(255, 255, 255, 0.02)'
    }
  };

  return (
    <table style={tableStyles.table}>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th key={i} style={{ ...tableStyles.th, textAlign: alignments[i] || 'left' }}>
              {renderCellContent(header)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx} style={rowIdx % 2 === 1 ? tableStyles.trEven : {}}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} style={{ ...tableStyles.td, textAlign: alignments[cellIdx] || 'left' }}>
                {renderCellContent(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Split content into table and non-table segments
const splitContentByTables = (content) => {
  if (!content) return [{ type: 'markdown', content: '' }];

  const segments = [];
  const lines = content.split('\n');
  let currentSegment = [];
  let inTable = false;
  let tableLines = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track fenced code blocks - don't detect tables inside them
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    const isTableRow = !inCodeBlock && line.trim().startsWith('|') && line.trim().endsWith('|');
    const isSeparator = !inCodeBlock && /^\|[\s:-]+\|[\s:|-]*$/.test(line.trim());

    if (isTableRow || isSeparator) {
      if (!inTable) {
        // Starting a table - save previous markdown
        if (currentSegment.length > 0) {
          segments.push({ type: 'markdown', content: currentSegment.join('\n') });
          currentSegment = [];
        }
        inTable = true;
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        // Ending a table
        if (tableLines.length >= 2) {
          segments.push({ type: 'table', content: tableLines.join('\n') });
        } else {
          // Not a valid table, treat as markdown
          currentSegment.push(...tableLines);
        }
        tableLines = [];
        inTable = false;
      }
      currentSegment.push(line);
    }
  }

  // Handle remaining content
  if (inTable && tableLines.length >= 2) {
    segments.push({ type: 'table', content: tableLines.join('\n') });
  } else if (inTable) {
    currentSegment.push(...tableLines);
  }

  if (currentSegment.length > 0) {
    segments.push({ type: 'markdown', content: currentSegment.join('\n') });
  }

  return segments.length > 0 ? segments : [{ type: 'markdown', content: '' }];
};
// ============ END MARKDOWN TABLE PARSER ============

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
  onEditorFullScreenChange = null,
  activeFile: controlledActiveFile = null,
  onActiveFileChange = null,
  scrollPositions: controlledScrollPositions = null,
  onScrollPositionsChange = null,
  onResetFile = null,
  originalFiles = null,
  isMobile = false,
  onShowHelp = null,
  onRun = null,
  isRunning = false,
  showMobileResults = false,
  setShowMobileResults = null,
  mobileResultsContent = null
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
  const [internalActiveFile, setInternalActiveFile] = useState(mainFile || (files && files[0] ? files[0].name : ''));
  const [fileContents, setFileContents] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [internalScrollPositions, setInternalScrollPositions] = useState({});
  const [editorKey, setEditorKey] = useState(0); // Force re-mount on reset
  const editorRef = useRef(null);
  const markdownScrollRef = useRef(null);

  // Use controlled activeFile if provided, otherwise use internal state
  const activeFile = controlledActiveFile !== null ? controlledActiveFile : internalActiveFile;
  const setActiveFile = (newFile) => {
    if (onActiveFileChange) {
      onActiveFileChange(newFile);
    } else {
      setInternalActiveFile(newFile);
    }
  };

  // Use controlled scrollPositions if provided, otherwise use internal state
  const scrollPositions = controlledScrollPositions !== null ? controlledScrollPositions : internalScrollPositions;
  const setScrollPositions = (newPositions) => {
    if (onScrollPositionsChange) {
      onScrollPositionsChange(newPositions);
    } else {
      setInternalScrollPositions(newPositions);
    }
  };
  
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
      // Check if any file content changed from external source (e.g., reset)
      let contentChanged = false;
      files.forEach(file => {
        if (fileContents[file.name] !== undefined &&
            fileContents[file.name] !== file.content) {
          contentChanged = true;
        }
      });

      // Always reset file contents when files prop changes
      const contents = {};
      files.forEach(file => {
        contents[file.name] = file.content || '';
      });
      setFileContents(contents);

      // Force editor re-mount if content changed externally
      if (contentChanged) {
        setEditorKey(prev => prev + 1);
      }

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
  // Skip on mobile - keyboard popup triggers resize and causes unwanted editor recreation
  useEffect(() => {
    // Don't run this on mobile - keyboard appearance triggers resize events
    if (isMobile) return;

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
  }, [activeFile, isMobile]);

  // Restore scroll position for markdown files when switching files
  useEffect(() => {
    if (activeFile && activeFile.endsWith('.md') && markdownScrollRef.current) {
      const scrollContainer = markdownScrollRef.current;
      const savedScrollTop = scrollPositions[activeFile] || 0;

      // Apply scroll immediately using requestAnimationFrame for smoothness
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = savedScrollTop;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]); // Only run when activeFile changes, not when scrollPositions changes!

  // Attach scroll event listener for markdown files
  useEffect(() => {
    if (activeFile && activeFile.endsWith('.md') && markdownScrollRef.current) {
      const scrollContainer = markdownScrollRef.current;

      const handleScroll = () => {
        setScrollPositions(prev => ({
          ...prev,
          [activeFile]: scrollContainer.scrollTop
        }));
      };

      scrollContainer.addEventListener('scroll', handleScroll);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
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

  // When inside parent fullscreen, expand within parent instead of using fixed positioning
  // This avoids issues with zoom: 0.75 affecting 100vh calculations
  const containerStyle = effectiveIsFullScreen
    ? (parentFullScreen
        ? {
            // Inside parent fullscreen: expand within the flex container
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100
          }
        : {
            // Standalone fullscreen: use fixed positioning
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100%',
            zIndex: 1000
          }
      )
    : {
        position: 'relative',
        height: height
      };

  return (
    <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        ...premiumStyles.glass.light,
        borderRadius: effectiveIsFullScreen && parentFullScreen ? 0 : '12px',
        overflow: 'hidden',
        ...containerStyle
      }}>
      {/* Mobile File Tabs - Horizontal scrolling tabs at top */}
      {isMobile && showFileExplorer && files && files.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: '#1e1e20',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => handleFileSelect(file.name)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeFile === file.name
                    ? 'rgba(50, 215, 75, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: activeFile === file.name
                    ? '#32d74b'
                    : premiumStyles.colors.textSecondary,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {file.name}
              </button>
            ))}
          </div>
          {/* Reset button for mobile */}
          {onResetFile && originalFiles && effectiveIsFullScreen && (
            <button
              onClick={() => {
                const originalFile = originalFiles.find(f => f.name === activeFile);
                if (originalFile) {
                  onResetFile(activeFile, originalFile.content);
                }
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                color: premiumStyles.colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Reset file to original"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {/* Show Problem Details button for mobile */}
          {onShowHelp && effectiveIsFullScreen && (
            <button
              onClick={onShowHelp}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                color: premiumStyles.colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Show Problem Details"
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>
      )}

      {/* Desktop File Explorer */}
      {!isMobile && showFileExplorer && (
        <div style={{
          position: 'relative',
          ...(effectiveIsFullScreen && {
            background: '#1e1e20',
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
              fontSize: '1rem',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Run Button for mobile in editor fullscreen */}
            {isMobile && effectiveIsFullScreen && onRun && (
              <button
                onClick={onRun}
                disabled={isRunning}
                title="Run code"
                style={{
                  background: 'linear-gradient(135deg, #32d74b 0%, #30d158 100%)',
                  border: 'none',
                  color: '#000',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  opacity: isRunning ? 0.6 : 1
                }}
              >
                <Play size={12} fill="currentColor" />
                {isRunning ? 'Running...' : 'Run'}
              </button>
            )}

            {/* Reset Current File Button */}
            {onResetFile && originalFiles && (
              <button
                onClick={() => {
                  const originalFile = originalFiles.find(f => f.name === activeFile);
                  if (originalFile) {
                    onResetFile(activeFile, originalFile.content);
                    setEditorKey(prev => prev + 1); // Force editor re-mount
                  }
                }}
                title="Reset this file to original"
                style={{
                  background: 'none',
                  border: 'none',
                  color: premiumStyles.colors.textSecondary,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = premiumStyles.colors.surfaceHover;
                  e.currentTarget.style.color = premiumStyles.colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = premiumStyles.colors.textSecondary;
                }}
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* Fullscreen Toggle Button */}
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
                  e.currentTarget.style.backgroundColor = premiumStyles.colors.surfaceHover;
                  e.currentTarget.style.color = premiumStyles.colors.text;
                }
              }}
              onMouseLeave={(e) => {
                if (parentFullScreen) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = premiumStyles.colors.textSecondary;
                }
              }}
            >
              {effectiveIsFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
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
            <div
              ref={markdownScrollRef}
              style={{
                height: '100%',
                overflowY: 'auto',
                padding: '16px 20px',
                background: '#1e1e1e',
                color: 'rgba(245, 245, 247, 0.8)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
{/* Hybrid renderer: tables as React components, rest as ReactMarkdown */}
              {splitContentByTables(preprocessDoubleBackticks(getCurrentFileContent())).map((segment, idx) => (
                segment.type === 'table' ? (
                  <MarkdownTable key={idx} tableText={segment.content} />
                ) : (
                  <ReactMarkdown
                    key={idx}
                    components={{
                      h1: ({node, children, ...props}) => <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        margin: '0 0 12px 0',
                        color: '#f5f5f7',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }} {...props}>{renderWithInlineCode(children)}</h1>,
                      h2: ({node, children, ...props}) => <h2 style={{
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        margin: '20px 0 10px 0',
                        color: '#f5f5f7'
                      }} {...props}>{renderWithInlineCode(children)}</h2>,
                      h3: ({node, children, ...props}) => <h3 style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        margin: '16px 0 8px 0',
                        color: '#f5f5f7'
                      }} {...props}>{renderWithInlineCode(children)}</h3>,
                      h4: ({node, children, ...props}) => <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        margin: '12px 0 6px 0',
                        color: '#f5f5f7'
                      }} {...props}>{renderWithInlineCode(children)}</h4>,
                      p: ({node, children, ...props}) => <p style={{
                        margin: '0 0 10px 0',
                        lineHeight: 1.6,
                        fontSize: '1rem'
                      }} {...props}>{renderWithInlineCode(children)}</p>,
                      code: ({node, inline, ...props}) => inline ? (
                        <code style={{
                          background: 'rgba(50, 215, 75, 0.12)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          color: '#32d74b',
                          fontFamily: 'SF Mono, Monaco, monospace',
                          fontSize: '0.93rem'
                        }} {...props} />
                      ) : (
                        <code style={{
                          display: 'block',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '12px',
                          borderRadius: '8px',
                          overflowX: 'auto',
                          color: 'rgba(245, 245, 247, 0.85)',
                          fontFamily: 'SF Mono, Monaco, monospace',
                          fontSize: '0.93rem',
                          lineHeight: 1.5
                        }} {...props} />
                      ),
                      pre: ({node, ...props}) => <pre style={{
                        margin: '12px 0 16px 0',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }} {...props} />,
                      ul: ({node, ...props}) => <ul style={{
                        margin: '8px 0',
                        paddingLeft: '20px',
                        lineHeight: 1.6,
                        listStyleType: 'disc',
                        listStylePosition: 'outside',
                        fontSize: '1rem'
                      }} {...props} />,
                      ol: ({node, ...props}) => <ol style={{
                        margin: '8px 0',
                        paddingLeft: '20px',
                        lineHeight: 1.6,
                        listStyleType: 'decimal',
                        listStylePosition: 'outside',
                        fontSize: '1rem'
                      }} {...props} />,
                      li: ({node, children, ...props}) => <li style={{
                        margin: '4px 0',
                        display: 'list-item'
                      }} {...props}>{renderWithInlineCode(children)}</li>,
                      blockquote: ({node, children, ...props}) => <blockquote style={{
                        margin: '10px 0',
                        padding: '8px 12px',
                        borderLeft: '3px solid #32d74b',
                        background: 'rgba(50, 215, 75, 0.06)',
                        fontStyle: 'italic',
                        fontSize: '1rem',
                        borderRadius: '0 6px 6px 0'
                      }} {...props}>{renderWithInlineCode(children)}</blockquote>,
                      a: ({node, ...props}) => <a style={{
                        color: '#0a84ff',
                        textDecoration: 'none'
                      }} {...props} />,
                      hr: ({node, ...props}) => <hr style={{
                        margin: '16px 0',
                        border: 'none',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }} {...props} />,
                      strong: ({node, children, ...props}) => <strong style={{
                        color: '#f5f5f7',
                        fontWeight: 600
                      }} {...props}>{renderWithInlineCode(children)}</strong>,
                      em: ({node, children, ...props}) => <em style={{
                        color: '#ffd60a'
                      }} {...props}>{renderWithInlineCode(children)}</em>
                    }}
                  >
                    {segment.content}
                  </ReactMarkdown>
                )
              ))}
            </div>
          ) : (
            // Render code files with CodeMirror
            <CodeMirrorKernelEditor
              key={`${activeFile}-${editorKey}`}
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
              initialScrollTop={scrollPositions[activeFile] || 0}
              onScrollChange={(scrollTop) => {
                setScrollPositions({
                  ...scrollPositions,
                  [activeFile]: scrollTop
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Results Panel - shown when showMobileResults is true */}
      {isMobile && effectiveIsFullScreen && showMobileResults && mobileResultsContent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0a0a0c',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Results Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#f5f5f7'
            }}>
              Test Results
            </span>
            <button
              onClick={() => setShowMobileResults && setShowMobileResults(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#f5f5f7',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem'
              }}
            >
              <X size={14} />
              Close
            </button>
          </div>
          {/* Results Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px'
          }}>
            {mobileResultsContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFileEditor;
