/**
 * AI Tutor Service - Connects to Qwen3 Socratic C Programming Tutor
 *
 * This service handles communication with the Python Qwen3 proxy server
 * that implements Socratic teaching methodology for C programming.
 */

// API endpoint - configurable via environment variable
const AI_TUTOR_URL = process.env.REACT_APP_AI_TUTOR_URL || 'https://ai-api.kernelq.com';

// Socratic C Programming Tutor System Prompt
const SOCRATIC_SYSTEM_PROMPT = `You are a hands-on technical educator who teaches C programming and systems concepts through concrete, executable understanding. Your style is Socratic — you guide discovery, NEVER give direct code solutions.

## CORE TEACHING PRINCIPLES

### 1. NEVER GIVE DIRECT CODE SOLUTIONS
When user needs to write code:
- Explain WHAT and WHY (purpose, concept)
- Show RELATED patterns or analogous examples (not the exact solution)
- Provide building blocks: "You'll need X, Y, Z"
- Say "Now write it." and WAIT

WRONG approach:
User: "How do I write set()?"
You: "Here's set(): [full code]" ← NEVER DO THIS

RIGHT approach:
User: "How do I write set()?"
You:
- "set() needs to do 3 things: calculate bucket, create entry, link it"
- "Remember how you allocated kv_entry_t in the struct definition?"
- "calloc vs malloc — which gives you NULL-initialized memory?"
- "Inserting at head of linked list: new->next = old_head; head = new"
- "Now write it."

Give ingredients, not the meal. User must cook.

### 2. ALWAYS GROUND IN MEMORY
Use ASCII diagrams with real addresses for EVERY explanation:

\`\`\`
Memory layout:
0x1000: node1 [data=10][next→0x2000]
0x2000: node2 [data=20][next→0x3000]
0x3000: node3 [data=30][next=NULL]
\`\`\`

Show BEFORE/AFTER states for every operation.

### 3. POINTER MENTAL MODEL
Critical framing that works:
- "Having 0x1000" ≠ "Being at 0x1000"
- Having an address in your hand is NOT the same as being there
- \`->\` means "go there, THEN access"
- \`.\` means "I'm already here, access this field"

Trace pointer chains step-by-step with types.

### 4. WHEN USER IS STUCK
Ask "What part specifically?" — give a HINT for that part only.
Hints = questions or partial patterns, NOT complete code.

Building blocks table format:
| Task | Tool/Pattern |
|------|--------------|
| Get bucket index | hash(key) % size |
| Allocate memory | malloc(sizeof(...)) |

Then: "Now write it."

### 5. VALIDATE UNDERSTANDING
- Correct: "YES! Exactly right!"
- Wrong: "Your logic is correct, but..." (acknowledge before correcting)

### 6. CALL OUT COASTING
If they're pattern-matching without understanding:
"Turn off autocomplete. Rewrite it yourself. Show me."

## RESPONSE FORMAT
- Short paragraphs, no walls of text
- Tables for comparisons and tradeoffs
- ASCII diagrams for ALL memory/pointer concepts
- End with concrete next step: "Now write X" or "Try it"
- Match user's energy — informal, direct, real`;

/**
 * Build the context message that provides problem-specific information
 */
export const buildContextMessage = ({
    title,
    description,
    visualGuide,
    functionNames,
    outputMessages,
    concepts,
    currentCode,
    lastOutput,
    testResults
}) => {
    let context = SOCRATIC_SYSTEM_PROMPT;

    context += `\n\n---\n\n## CURRENT PROBLEM CONTEXT\n`;
    context += `\n**Problem:** ${title}\n`;
    context += `\n**Description:** ${description}\n`;

    if (concepts && concepts.length > 0) {
        context += `\n**Key Concepts:** ${concepts.join(', ')}\n`;
    }

    if (functionNames && functionNames.length > 0) {
        context += `\n**Functions to Implement:**\n`;
        functionNames.forEach(fn => {
            context += `- ${fn}()\n`;
        });
    }

    if (outputMessages && outputMessages.length > 0) {
        context += `\n**Expected Outputs (first few):**\n`;
        outputMessages.slice(0, 5).forEach(msg => {
            context += `- "${msg}"\n`;
        });
    }

    if (visualGuide) {
        // Include key sections from VISUAL_GUIDE.md (truncated if too long)
        const truncatedGuide = visualGuide.length > 4000
            ? visualGuide.substring(0, 4000) + '\n\n[... guide truncated ...]'
            : visualGuide;
        context += `\n**Reference Material (VISUAL_GUIDE.md):**\n\`\`\`\n${truncatedGuide}\n\`\`\`\n`;
    }

    if (currentCode) {
        context += `\n**Student's Current Code:**\n\`\`\`c\n${currentCode}\n\`\`\`\n`;
    }

    if (lastOutput) {
        context += `\n**Last Run Output/Error:**\n\`\`\`\n${lastOutput}\n\`\`\`\n`;
    }

    if (testResults && testResults.length > 0) {
        const failedTests = testResults.filter(t => !t.passed);
        if (failedTests.length > 0) {
            context += `\n**Failed Tests:**\n`;
            failedTests.forEach(t => {
                context += `- ${t.name}: ${t.message || 'Failed'}\n`;
            });
        }
    }

    context += `\n---\n\nRemember: Guide them to discover, never give direct solutions. Use building blocks and Socratic questions.`;

    return context;
};

/**
 * Send a message to the AI tutor (non-streaming)
 */
export const sendMessage = async (messages, options = {}) => {
    const {
        model = 'Qwen-Qwen3-235B-A22B-Thinking-2507',
        maxTokens = 2048,
        temperature = 0.6
    } = options;

    try {
        const response = await fetch(`${AI_TUTOR_URL}/socratic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_AI_TUTOR_API_KEY || ''}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            return { error: data.error.message || 'Unknown error' };
        }

        const content = data.choices?.[0]?.message?.content || '';
        const reasoning = data.choices?.[0]?.message?.reasoning_content || '';

        return {
            content,
            reasoning,
            usage: data.usage
        };
    } catch (error) {
        console.error('AI Tutor API error:', error);
        return { error: error.message };
    }
};

/**
 * Send a message with streaming response
 */
export const streamMessage = async (messages, onChunk, signal, options = {}) => {
    const {
        model = 'Qwen-Qwen3-235B-A22B-Thinking-2507',
        maxTokens = 2048,
        temperature = 0.6
    } = options;

    const response = await fetch(`${AI_TUTOR_URL}/socratic`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_AI_TUTOR_API_KEY || ''}`
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            stream: true
        }),
        signal
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') {
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        // Skip malformed JSON
                        console.warn('Failed to parse SSE chunk:', data);
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};

/**
 * Check if the AI tutor service is available
 */
export const checkHealth = async () => {
    try {
        const response = await fetch(`${AI_TUTOR_URL}/`, {
            method: 'GET',
            timeout: 5000
        });

        if (response.ok) {
            const data = await response.json();
            return {
                available: true,
                mode: data.mode || 'Unknown',
                thinkingSupport: data.thinking_support || false
            };
        }

        return { available: false, error: `HTTP ${response.status}` };
    } catch (error) {
        return { available: false, error: error.message };
    }
};

export default {
    sendMessage,
    streamMessage,
    buildContextMessage,
    checkHealth,
    AI_TUTOR_URL
};
