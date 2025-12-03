import React, { useState, useRef, useEffect } from 'react';
import { File, FileText, Settings, Lock, Code2, Plus, X, AlertCircle } from 'lucide-react';

const FileExplorer = ({ 
  files, 
  activeFile, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  requiredFiles = [],
  premiumStyles 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [width, setWidth] = useState(280); // Default width
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Handle resizing functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      // Limit width between 200px and 500px
      const minWidth = 200;
      const maxWidth = 500;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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
  }, [isDragging]);

  const handleCreateFile = () => {
    if (newFileName.trim() && onFileCreate) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setShowCreateForm(false);
    }
  };

  const handleDeleteFile = (fileName) => {
    if (onFileDelete) {
      onFileDelete(fileName);
    }
  };


  const getMissingRequiredFiles = () => {
    return requiredFiles.filter(req => !files.some(file => file.name === req.name));
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'c':
        return <Code2 size={14} />;
      case 'h':
        return <FileText size={14} />;
      case 'makefile':
        return <Settings size={14} />;
      default:
        return <File size={14} />;
    }
  };

  const getFileColor = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'c':
        return '#30d158'; // Green for C files
      case 'h':
        return '#007aff'; // Blue for headers
      case 'makefile':
        return '#ff9f0a'; // Orange for Makefile
      default:
        return premiumStyles.colors.textSecondary;
    }
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%'
    }}>
      <div
        ref={containerRef}
        style={{
          width: `${width}px`,
          height: '100%',
          ...premiumStyles.glass.medium,
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
      <div style={{
        marginBottom: '10px',
        padding: '6px 0',
        borderBottom: `1px solid ${premiumStyles.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <File size={14} color={premiumStyles.colors.text} />
        <span style={{
          color: premiumStyles.colors.text,
          fontSize: premiumStyles.typography.sizes.sm,
          fontWeight: premiumStyles.typography.weights.semibold
        }}>
          Project Files
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {files.map((file, index) => (
          <div
            key={index}
            onClick={() => onFileSelect(file.name)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeFile === file.name ? 
                premiumStyles.colors.primary : 
                'transparent',
              border: activeFile === file.name ? 
                `1px solid ${premiumStyles.colors.borderHover}` : 
                '1px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (activeFile !== file.name) {
                e.currentTarget.style.backgroundColor = premiumStyles.colors.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeFile !== file.name) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ color: getFileColor(file.name) }}>
              {getFileIcon(file.name)}
            </div>
            
            <span style={{
              color: activeFile === file.name ?
                premiumStyles.colors.text :
                premiumStyles.colors.textSecondary,
              fontSize: premiumStyles.typography.sizes.sm,
              fontWeight: activeFile === file.name ?
                premiumStyles.typography.weights.medium :
                premiumStyles.typography.weights.regular,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {file.name}
            </span>

            {file.readOnly && (
              <Lock 
                size={12} 
                color={premiumStyles.colors.textTertiary}
                style={{ opacity: 0.6 }}
              />
            )}
            
            {/* Delete button for non-read-only files */}
            {onFileDelete && !file.readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.name);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: premiumStyles.colors.error,
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Missing Required Files Section */}
      {getMissingRequiredFiles().length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: premiumStyles.colors.warning + '20',
          borderRadius: '8px',
          border: `1px solid ${premiumStyles.colors.warning}40`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <AlertCircle size={14} color={premiumStyles.colors.warning} />
            <span style={{
              color: premiumStyles.colors.warning,
              fontSize: premiumStyles.typography.sizes.xs,
              fontWeight: premiumStyles.typography.weights.semibold
            }}>
              Missing Required Files
            </span>
          </div>
          {getMissingRequiredFiles().map((reqFile, index) => (
            <div key={index} style={{
              fontSize: premiumStyles.typography.sizes.xs,
              color: premiumStyles.colors.textSecondary,
              marginBottom: '4px'
            }}>
              • {reqFile.name}
              {reqFile.description && (
                <div style={{
                  marginLeft: '12px',
                  color: premiumStyles.colors.textTertiary,
                  fontSize: premiumStyles.typography.sizes.xs
                }}>
                  {reqFile.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create File Section */}
      {onFileCreate && (
        <div style={{
          marginTop: '16px',
          padding: '12px 0',
          borderTop: `1px solid ${premiumStyles.colors.border}`
        }}>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: premiumStyles.colors.accent + '20',
                border: `1px solid ${premiumStyles.colors.accent}40`,
                borderRadius: '6px',
                color: premiumStyles.colors.accent,
                cursor: 'pointer',
                fontSize: premiumStyles.typography.sizes.sm,
                fontWeight: premiumStyles.typography.weights.medium,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = premiumStyles.colors.accent + '30';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = premiumStyles.colors.accent + '20';
              }}
            >
              <Plus size={14} />
              Create File
            </button>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter filename (e.g., device_ops.c)"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: premiumStyles.colors.backgroundSecondary,
                  border: `1px solid ${premiumStyles.colors.border}`,
                  borderRadius: '4px',
                  color: premiumStyles.colors.text,
                  fontSize: premiumStyles.typography.sizes.sm,
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFile();
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false);
                    setNewFileName('');
                  }
                }}
                autoFocus
              />
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={handleCreateFile}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: premiumStyles.colors.accent,
                    border: 'none',
                    borderRadius: '4px',
                    color: premiumStyles.colors.background,
                    fontSize: premiumStyles.typography.sizes.xs,
                    fontWeight: premiumStyles.typography.weights.medium,
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewFileName('');
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${premiumStyles.colors.border}`,
                    borderRadius: '4px',
                    color: premiumStyles.colors.textSecondary,
                    fontSize: premiumStyles.typography.sizes.xs,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

        <div style={{
          marginTop: 'auto',
          padding: '12px 0',
          borderTop: `1px solid ${premiumStyles.colors.border}`,
          fontSize: premiumStyles.typography.sizes.xs,
          color: premiumStyles.colors.textTertiary,
          textAlign: 'center'
        }}>
          {files.length} file{files.length !== 1 ? 's' : ''} • Multi-file project
        </div>
      </div>

      {/* Resizable Splitter */}
      <div
        style={{
          width: '4px',
          cursor: 'col-resize',
          background: isDragging ? premiumStyles.colors.borderHover : 'transparent',
          position: 'relative',
          transition: 'background-color 0.2s ease'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = premiumStyles.colors.border;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Visual indicator for the splitter */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '20px',
          background: premiumStyles.colors.textTertiary,
          borderRadius: '1px',
          pointerEvents: 'none'
        }} />
      </div>
    </div>
  );
};

export default FileExplorer;