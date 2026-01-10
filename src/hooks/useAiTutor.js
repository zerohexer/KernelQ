import { useState, useCallback, useRef } from 'react';
import { streamMessage, buildContextMessage } from '../services/aiTutorService';

/**
 * useAiTutor - Hook for Socratic AI Tutor functionality
 *
 * Manages chat state, message history with BRANCHING support, and API communication.
 *
 * Data Structure:
 * Each message can have multiple "versions" when edited, creating branches.
 * We track which version is currently active for each message.
 * Each version stores the subsequent messages that belong to that branch.
 *
 * Message structure:
 * {
 *   id: string,
 *   role: 'user' | 'assistant',
 *   versions: [{
 *     content: string,
 *     timestamp: number,
 *     subsequentMessages: Message[]  // Messages that follow this version (for branching)
 *   }],
 *   activeVersion: number,  // Index into versions array
 * }
 */
const useAiTutor = (challenge, codeEditor) => {
    // Chat history per problem (keyed by problem ID)
    // Each history is an array of messages with versions
    const [chatHistories, setChatHistories] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const abortControllerRef = useRef(null);
    const messageIdCounter = useRef(0);

    // Get current problem's chat history
    const problemId = challenge?.id;
    const rawChatHistory = chatHistories[problemId] || [];

    // Convert internal format to display format (using active versions)
    const chatHistory = rawChatHistory.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.versions[msg.activeVersion]?.content || '',
        timestamp: msg.versions[msg.activeVersion]?.timestamp || Date.now(),
        versionCount: msg.versions.length,
        activeVersion: msg.activeVersion,
    }));

    /**
     * Generate unique message ID
     */
    const generateMessageId = useCallback(() => {
        messageIdCounter.current += 1;
        return `msg-${Date.now()}-${messageIdCounter.current}`;
    }, []);

    /**
     * Add a message to the current problem's chat history
     */
    const addMessage = useCallback((role, content) => {
        if (!problemId) return;

        const newMessage = {
            id: generateMessageId(),
            role,
            versions: [{ content, timestamp: Date.now(), subsequentMessages: [] }],
            activeVersion: 0,
        };

        setChatHistories(prev => ({
            ...prev,
            [problemId]: [...(prev[problemId] || []), newMessage]
        }));

        return newMessage.id;
    }, [problemId, generateMessageId]);

    /**
     * Build the full context for the AI including problem info, code, and errors
     */
    const buildFullContext = useCallback(() => {
        if (!challenge) return '';

        // Extract VISUAL_GUIDE.md content if available
        const visualGuide = challenge.files?.find(f => f.name === 'VISUAL_GUIDE.md')?.content || '';

        // Get function requirements
        const functionNames = challenge.validation?.exactRequirements?.functionNames || [];
        const outputMessages = challenge.validation?.exactRequirements?.outputMessages?.slice(0, 8) || [];

        // Get current code from all editable files
        const currentCode = codeEditor?.files
            ?.filter(f => !f.readOnly)
            ?.map(f => `--- ${f.name} ---\n${f.content}`)
            .join('\n\n') || codeEditor?.code || '';

        // Get any error output
        const lastOutput = codeEditor?.output || '';
        const hasError = lastOutput.toLowerCase().includes('error') ||
                        lastOutput.toLowerCase().includes('fail') ||
                        lastOutput.includes('FAIL:');

        return buildContextMessage({
            title: challenge.title,
            description: challenge.description,
            visualGuide,
            functionNames,
            outputMessages,
            concepts: challenge.concepts || [],
            currentCode,
            lastOutput: hasError ? lastOutput : '',
            testResults: codeEditor?.testResults || []
        });
    }, [challenge, codeEditor]);

    /**
     * Edit a user message and create a new branch
     * This will:
     * 1. Store current subsequent messages in the current version (preserves old branch)
     * 2. Add a new version to the edited message
     * 3. Remove all messages after the edited message
     * 4. Trigger a new AI response
     */
    const editMessage = useCallback(async (messageId, newContent) => {
        if (!problemId || !newContent.trim()) return;

        // Find the message index
        const history = chatHistories[problemId] || [];
        const messageIndex = history.findIndex(m => m.id === messageId);

        if (messageIndex === -1) return;

        const message = history[messageIndex];
        if (message.role !== 'user') return; // Can only edit user messages

        // Cancel any ongoing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Store current subsequent messages in the current active version (preserves old branch)
        const subsequentMessages = history.slice(messageIndex + 1);
        const currentVersion = message.versions[message.activeVersion];
        const updatedCurrentVersion = {
            ...currentVersion,
            subsequentMessages: subsequentMessages
        };

        // Update versions array with stored subsequent messages
        const updatedVersions = message.versions.map((v, idx) => {
            if (idx === message.activeVersion) {
                return updatedCurrentVersion;
            }
            return v;
        });

        // Create new version (with empty subsequentMessages - will be filled when AI responds)
        const newVersion = { content: newContent, timestamp: Date.now(), subsequentMessages: [] };

        const updatedMessage = {
            ...message,
            versions: [...updatedVersions, newVersion],
            activeVersion: updatedVersions.length, // Point to new version
        };

        // Keep only messages up to and including the edited one (truncate for new branch)
        const truncatedHistory = [
            ...history.slice(0, messageIndex),
            updatedMessage
        ];

        setChatHistories(prev => ({
            ...prev,
            [problemId]: truncatedHistory
        }));

        setEditingMessageId(null);
        setIsLoading(true);
        setError(null);
        setStreamingMessage('');

        try {
            const contextMessage = buildFullContext();
            // Build messages for API using only active versions up to edited message
            const messagesForApi = [
                { role: 'system', content: contextMessage },
                ...truncatedHistory.slice(0, -1).map(m => ({
                    role: m.role,
                    content: m.versions[m.activeVersion]?.content || ''
                })),
                { role: 'user', content: newContent }
            ];

            let fullResponse = '';

            await streamMessage(
                messagesForApi,
                (chunk) => {
                    fullResponse += chunk;
                    setStreamingMessage(fullResponse);
                },
                abortControllerRef.current.signal
            );

            // Add AI response as new message
            const aiMessage = {
                id: generateMessageId(),
                role: 'assistant',
                versions: [{ content: fullResponse, timestamp: Date.now(), subsequentMessages: [] }],
                activeVersion: 0,
            };

            setChatHistories(prev => ({
                ...prev,
                [problemId]: [...(prev[problemId] || []), aiMessage]
            }));
            setStreamingMessage('');
        } catch (err) {
            if (err.name === 'AbortError') return;
            const errorMsg = err.message || 'Failed to get response from AI tutor';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [problemId, chatHistories, generateMessageId, buildFullContext]);

    /**
     * Navigate to a different version of a message (branch navigation)
     * Stores current branch's subsequent messages and restores target branch's messages
     * Disabled while AI is streaming to prevent response going to wrong branch
     */
    const switchMessageVersion = useCallback((messageId, versionIndex) => {
        if (!problemId) return;

        // Prevent switching while AI is responding - response could end up in wrong branch
        if (isLoading || streamingMessage) {
            console.warn('Cannot switch branch while AI is responding');
            return;
        }

        setChatHistories(prev => {
            const history = prev[problemId] || [];
            const messageIndex = history.findIndex(m => m.id === messageId);

            if (messageIndex === -1) return prev;

            const message = history[messageIndex];
            if (versionIndex < 0 || versionIndex >= message.versions.length) return prev;
            if (versionIndex === message.activeVersion) return prev; // No change needed

            // Get messages that come after this one (current branch)
            const subsequentMessages = history.slice(messageIndex + 1);

            // Store current subsequent messages in the current active version
            const currentVersion = message.versions[message.activeVersion];
            const updatedCurrentVersion = {
                ...currentVersion,
                subsequentMessages: subsequentMessages
            };

            // Get the target version and its stored subsequent messages
            const targetVersion = message.versions[versionIndex];
            const restoredMessages = targetVersion.subsequentMessages || [];

            // Build updated versions array
            const updatedVersions = message.versions.map((v, idx) => {
                if (idx === message.activeVersion) {
                    return updatedCurrentVersion;
                }
                return v;
            });

            const updatedMessage = {
                ...message,
                versions: updatedVersions,
                activeVersion: versionIndex,
            };

            // Rebuild history: messages before + updated message + restored subsequent messages
            const updatedHistory = [
                ...history.slice(0, messageIndex),
                updatedMessage,
                ...restoredMessages
            ];

            return {
                ...prev,
                [problemId]: updatedHistory
            };
        });
    }, [problemId, isLoading, streamingMessage]);

    /**
     * Start editing a message
     */
    const startEditingMessage = useCallback((messageId) => {
        setEditingMessageId(messageId);
    }, []);

    /**
     * Cancel editing
     */
    const cancelEditing = useCallback(() => {
        setEditingMessageId(null);
    }, []);

    /**
     * Send a message with streaming response
     */
    const sendUserMessageStreaming = useCallback(async (userMessage) => {
        if (!userMessage.trim() || !problemId) return;

        // Cancel any ongoing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);
        setStreamingMessage('');

        // Build messages for API BEFORE adding to history (avoids stale closure)
        // Use rawChatHistory to get current state directly
        const currentHistory = chatHistories[problemId] || [];
        const contextMessage = buildFullContext();
        const messagesForApi = [
            { role: 'system', content: contextMessage },
            ...currentHistory.map(m => ({
                role: m.role,
                content: m.versions[m.activeVersion]?.content || ''
            })),
            { role: 'user', content: userMessage }
        ];

        // Now add user message to history
        addMessage('user', userMessage);

        try {
            let fullResponse = '';

            await streamMessage(
                messagesForApi,
                (chunk) => {
                    fullResponse += chunk;
                    setStreamingMessage(fullResponse);
                },
                abortControllerRef.current.signal
            );

            // Add complete response to history
            addMessage('assistant', fullResponse);
            setStreamingMessage('');
        } catch (err) {
            if (err.name === 'AbortError') {
                // Request was cancelled, don't show error
                return;
            }
            const errorMsg = err.message || 'Failed to get response from AI tutor';
            setError(errorMsg);
            // Don't add error as assistant message - just show in error state
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [problemId, chatHistories, buildFullContext, addMessage]);

    /**
     * Clear chat history for current problem
     */
    const clearHistory = useCallback(() => {
        if (!problemId) return;

        setChatHistories(prev => ({
            ...prev,
            [problemId]: []
        }));
        setError(null);
        setStreamingMessage('');
    }, [problemId]);

    /**
     * Cancel ongoing streaming request
     */
    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setStreamingMessage('');
        }
    }, []);

    /**
     * Send a contextual help request (e.g., after error)
     */
    const requestErrorHelp = useCallback(async (errorOutput) => {
        const helpMessage = `I got this error when running my code:\n\`\`\`\n${errorOutput}\n\`\`\`\n\nWhat's wrong and how should I fix it?`;
        await sendUserMessageStreaming(helpMessage);
    }, [sendUserMessageStreaming]);

    /**
     * Ask about a specific function
     */
    const askAboutFunction = useCallback(async (functionName) => {
        const question = `I need help implementing ${functionName}(). What should it do and what building blocks do I need?`;
        await sendUserMessageStreaming(question);
    }, [sendUserMessageStreaming]);

    /**
     * Retry the last response - removes last assistant message and regenerates
     */
    const retryLastMessage = useCallback(async () => {
        if (!problemId) return;

        const history = chatHistories[problemId] || [];
        if (history.length === 0) return;

        // Find the last user message
        let lastUserMessageIndex = -1;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) return;

        const lastUserMessage = history[lastUserMessageIndex];
        const lastUserContent = lastUserMessage.versions[lastUserMessage.activeVersion]?.content || '';

        // Get the history up to (but not including) the last user message
        const trimmedHistory = history.slice(0, lastUserMessageIndex);

        // Cancel any ongoing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Update state to keep only up to and including the last user message
        const updatedUserMessage = {
            ...lastUserMessage,
            // Keep the same version, just regenerate response
        };

        setChatHistories(prev => ({
            ...prev,
            [problemId]: [...trimmedHistory, updatedUserMessage]
        }));

        setIsLoading(true);
        setError(null);
        setStreamingMessage('');

        try {
            const contextMessage = buildFullContext();
            const messages = [
                { role: 'system', content: contextMessage },
                ...trimmedHistory.map(m => ({
                    role: m.role,
                    content: m.versions[m.activeVersion]?.content || ''
                })),
                { role: 'user', content: lastUserContent }
            ];

            let fullResponse = '';

            await streamMessage(
                messages,
                (chunk) => {
                    fullResponse += chunk;
                    setStreamingMessage(fullResponse);
                },
                abortControllerRef.current.signal
            );

            // Add complete response to history
            const aiMessage = {
                id: generateMessageId(),
                role: 'assistant',
                versions: [{ content: fullResponse, timestamp: Date.now(), subsequentMessages: [] }],
                activeVersion: 0,
            };

            setChatHistories(prev => ({
                ...prev,
                [problemId]: [...trimmedHistory, updatedUserMessage, aiMessage]
            }));
            setStreamingMessage('');
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }
            const errorMsg = err.message || 'Failed to get response from AI tutor';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [problemId, chatHistories, buildFullContext, generateMessageId]);

    return {
        // State
        chatHistory,
        isLoading,
        error,
        streamingMessage,
        editingMessageId,

        // Actions
        sendMessage: sendUserMessageStreaming,
        clearHistory,
        cancelStream,
        retryLastMessage,

        // Edit/Branch actions
        editMessage,
        startEditingMessage,
        cancelEditing,
        switchMessageVersion,

        // Contextual helpers
        requestErrorHelp,
        askAboutFunction,

        // Utility
        hasHistory: chatHistory.length > 0
    };
};

export default useAiTutor;
