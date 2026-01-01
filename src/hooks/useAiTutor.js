import { useState, useCallback, useRef } from 'react';
import { sendMessage, streamMessage, buildContextMessage } from '../services/aiTutorService';

/**
 * useAiTutor - Hook for Socratic AI Tutor functionality
 *
 * Manages chat state, message history, and API communication
 * with the Qwen3 thinking model proxy.
 */
const useAiTutor = (challenge, codeEditor) => {
    // Chat history per problem (keyed by problem ID)
    const [chatHistories, setChatHistories] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [streamingMessage, setStreamingMessage] = useState('');
    const abortControllerRef = useRef(null);

    // Get current problem's chat history
    const problemId = challenge?.id;
    const chatHistory = chatHistories[problemId] || [];

    /**
     * Add a message to the current problem's chat history
     */
    const addMessage = useCallback((role, content) => {
        if (!problemId) return;

        setChatHistories(prev => ({
            ...prev,
            [problemId]: [
                ...(prev[problemId] || []),
                { role, content, timestamp: Date.now() }
            ]
        }));
    }, [problemId]);

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
     * Send a message to the AI tutor (non-streaming)
     */
    const sendUserMessage = useCallback(async (userMessage) => {
        if (!userMessage.trim() || !problemId) return;

        setIsLoading(true);
        setError(null);

        // Add user message to history
        addMessage('user', userMessage);

        try {
            const contextMessage = buildFullContext();
            const messages = [
                { role: 'system', content: contextMessage },
                ...chatHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMessage }
            ];

            const response = await sendMessage(messages);

            if (response.error) {
                setError(response.error);
                addMessage('assistant', `Error: ${response.error}`);
            } else {
                addMessage('assistant', response.content);
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to get response from AI tutor';
            setError(errorMsg);
            addMessage('assistant', `Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    }, [problemId, chatHistory, buildFullContext, addMessage]);

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

        // Add user message to history
        addMessage('user', userMessage);

        try {
            const contextMessage = buildFullContext();
            const messages = [
                { role: 'system', content: contextMessage },
                ...chatHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMessage }
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
            addMessage('assistant', fullResponse);
            setStreamingMessage('');
        } catch (err) {
            if (err.name === 'AbortError') {
                // Request was cancelled, don't show error
                return;
            }
            const errorMsg = err.message || 'Failed to get response from AI tutor';
            setError(errorMsg);
            addMessage('assistant', `Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [problemId, chatHistory, buildFullContext, addMessage]);

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
        if (!problemId || chatHistory.length === 0) return;

        // Find the last user message
        let lastUserMessageIndex = -1;
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            if (chatHistory[i].role === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) return;

        const lastUserMessage = chatHistory[lastUserMessageIndex].content;

        // Get the history up to (but not including) the last user message
        const trimmedHistory = chatHistory.slice(0, lastUserMessageIndex);

        // Cancel any ongoing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Update state to remove the last exchange
        setChatHistories(prev => ({
            ...prev,
            [problemId]: [...trimmedHistory, { role: 'user', content: lastUserMessage, timestamp: Date.now() }]
        }));

        setIsLoading(true);
        setError(null);
        setStreamingMessage('');

        try {
            const contextMessage = buildFullContext();
            const messages = [
                { role: 'system', content: contextMessage },
                ...trimmedHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: lastUserMessage }
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
            setChatHistories(prev => ({
                ...prev,
                [problemId]: [
                    ...trimmedHistory,
                    { role: 'user', content: lastUserMessage, timestamp: Date.now() },
                    { role: 'assistant', content: fullResponse, timestamp: Date.now() }
                ]
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
    }, [problemId, chatHistory, buildFullContext]);

    return {
        // State
        chatHistory,
        isLoading,
        error,
        streamingMessage,

        // Actions
        sendMessage: sendUserMessageStreaming,
        sendMessageSync: sendUserMessage,
        clearHistory,
        cancelStream,
        retryLastMessage,

        // Contextual helpers
        requestErrorHelp,
        askAboutFunction,

        // Utility
        hasHistory: chatHistory.length > 0
    };
};

export default useAiTutor;
