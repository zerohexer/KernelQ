"""
Socratic C Programming Tutor - Qwen3 Thinking Model Proxy

This Flask server proxies requests to the TotalGPT API with
Socratic teaching methodology for C programming education.

Usage:
    python socratic_c_tutor.py

Then set REACT_APP_AI_TUTOR_URL=http://localhost:5000 in KernelQ/.env
"""

import json
import time
import requests
import re
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
Instruct_Preset = "chatml"
min_p = 0.05
top_p = 0.95
top_k = 20
minimum_token = 0
stop_token = ""
repetition_penalty = 1.05
frequency_penalty = 0
presense_penalty = 0.4
auto_trim = True
THINKING_MIN_TOKENS = 50
THINKING_MAX_TOKENS = 5000

MODEL_PATH = "https://api.totalgpt.ai/models"
COMPLETIONS_PATH = "https://api.totalgpt.ai/v1/completions"

# =============================================================================
# SOCRATIC C PROGRAMMING TUTOR SYSTEM PROMPT
# =============================================================================
SOCRATIC_SYSTEM_PROMPT = """You are a hands-on technical educator who teaches C programming and systems concepts through concrete, executable understanding. Your style is Socratic — you guide discovery, NEVER give direct code solutions.

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

```
Memory layout:
0x1000: node1 [data=10][next→0x2000]
0x2000: node2 [data=20][next→0x3000]
0x3000: node3 [data=30][next=NULL]
```

Show BEFORE/AFTER states for every operation:

```
BEFORE set("foo", "bar"):
┌──────┬──────┬──────┬──────┐
│ NULL │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┘

AFTER set("foo", "bar"):
hash("foo") % 4 = 2

┌──────┬──────┬────────┬──────┐
│ NULL │ NULL │ 0x1000 │ NULL │
└──────┴──────┴───┬────┴──────┘
                  │
                  ▼
             ┌─────────────┐
             │ key: "foo"  │
             │ value: "bar"│
             │ next: NULL  │
             └─────────────┘
```

### 3. POINTER MENTAL MODEL
Critical framing that works:
- "Having 0x1000" ≠ "Being at 0x1000"
- Having an address in your hand is NOT the same as being there
- `->` means "go there, THEN access"
- `.` means "I'm already here, access this field"

Trace pointer chains step-by-step with types:
```
dev->list.prev      → type: struct list_head *  (an ADDRESS)
dev->list.prev->next → type: struct list_head * (followed the address, NOW accessing)
```

### 4. WHEN USER IS STUCK
Ask "What part specifically?" — give a HINT for that part only.
Hints = questions or partial patterns, NOT complete code.

Building blocks table format:
| Task | Tool/Pattern |
|------|--------------|
| Get bucket index | hash(key) % size |
| Allocate memory | malloc(sizeof(...)) |
| Copy strings | strdup() |

Then: "Now write it."

### 5. VALIDATE UNDERSTANDING
- Correct: "YES! Exactly right!"
- Wrong: "Your logic is correct, but..." (acknowledge before correcting)
- Use their terminology when confirming

### 6. CALL OUT COASTING
If they're pattern-matching without understanding:
"Turn off autocomplete. Rewrite it yourself. Show me."

If code works but they can't explain it:
"Why did you use & there? Explain it to me."

### 7. PURPOSE BEFORE CODE
Always answer in this order:
1. "What IS this?" (concept)
2. "Why does it exist?" (purpose)
3. "How does it work?" (mechanics)
4. THEN implementation details

## RESPONSE FORMAT

- Short paragraphs, no walls of text
- Tables for comparisons and tradeoffs
- ASCII diagrams for ALL memory/pointer concepts
- End with concrete next step: "Now write X" or "Try it"
- Match user's energy — informal, direct, real
- Production framing: "in kernel code you'd see..." not academic toys

## EXAMPLE INTERACTION

User: "what is set?"

You:
"**What is kvstore for?**

Think of it like a phonebook:
```
"john"  → "555-1234"
"alice" → "555-5678"
```

You store name → phone number. Later you look up by name.

| Operation | What it means |
|-----------|---------------|
| set("john", "555-1234") | Store this pair |
| get("john") | Give me john's number |
| del("john") | Remove john |

**set() = "put this key-value pair into storage so I can find it later"**

Without set(): Empty table forever. Useless.
With set(): You can store and retrieve.

Make sense? Now think: what 3 things does set() need to do?"

The goal: user writes every line themselves, piecing together from concepts you've taught. Struggle = learning."""


premade_instruct = {
    "alpaca": {
        "system_start": "\n### Input: ",
        "system_end": "",
        "user_start": "\n### Instruction: ",
        "user_end": "",
        "assistant_start": "\n### Response: ",
        "assistant_end": "",
    },
    "vicuna": {
        "system_start": "\nSYSTEM: ",
        "system_end": "",
        "user_start": "\nUSER: ",
        "user_end": "",
        "assistant_start": "\nASSISTANT: ",
        "assistant_end": "",
    },
    "llama-3": {
        "system_start": "<|start_header_id|>system<|end_header_id|>\n\n",
        "system_end": "<|eot_id|>",
        "user_start": "<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n",
        "user_end": "<|eot_id|>",
        "assistant_start": "<|start_header_id|>assistant<|end_header_id|>\n\n",
        "assistant_end": "<|eot_id|>",
    },
    "chatml": {
        "system_start": "<|im_start|>system\n",
        "system_end": "<|im_end|>\n",
        "user_start": "<|im_start|>user\n",
        "user_end": "<|im_end|>\n",
        "assistant_start": "<|im_start|>assistant\n",
        "assistant_end": "<|im_end|>\n",
    },
    "command-r": {
        "system_start": "<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>",
        "system_end": "<|END_OF_TURN_TOKEN|>",
        "user_start": "<|START_OF_TURN_TOKEN|><|USER_TOKEN|>",
        "user_end": "<|END_OF_TURN_TOKEN|>",
        "assistant_start": "<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>",
        "assistant_end": "<|END_OF_TURN_TOKEN|>",
    },
    "mistral": {
        "system_start": "",
        "system_end": "",
        "user_start": "[INST] ",
        "user_end": "",
        "assistant_start": " [/INST]",
        "assistant_end": "</s> "
    },
    "gemma2": {
        "system_start": "<start_of_turn>system\n",
        "system_end": "<end_of_turn>\n",
        "user_start": "<start_of_turn>user\n",
        "user_end": "<end_of_turn>\n",
        "assistant_start": "<start_of_turn>model\n",
        "assistant_end": "<end_of_turn>\n"
    }
}


def is_thinking_model(model_name):
    """Check if the model is a thinking model"""
    thinking_keywords = [
        "thinking", "qwen3", "qwq", "deepseek-r1", "o1", "reasoning"
    ]
    return any(keyword in model_name.lower() for keyword in thinking_keywords)


def parse_thinking_content(text):
    """
    Parse thinking content from Qwen models
    Returns (thinking_content, final_answer)
    """
    if not text:
        return "", ""

    print(f"=== Parsing thinking content from text length: {len(text)} ===")

    # Handle case where response starts with thinking
    if text.startswith(':<think>') or text.startswith('<think>'):
        think_pattern = r'<think>(.*?)</think>'
        match = re.search(think_pattern, text, re.DOTALL)

        if match:
            thinking_content = match.group(1).strip()
            final_answer = text[match.end():].strip()
            print(f"=== Found thinking content: {len(thinking_content)} chars, answer: {len(final_answer)} chars ===")
            return thinking_content, final_answer
        else:
            if ':<think>' in text:
                thinking_start = text.find(':<think>') + 8
                thinking_content = text[thinking_start:]
                return thinking_content, ""
            elif '<think>' in text:
                thinking_start = text.find('<think>') + 7
                thinking_content = text[thinking_start:]
                return thinking_content, ""

    think_pattern = r'<think>(.*?)</think>(.*?)$'
    match = re.search(think_pattern, text, re.DOTALL)
    if match:
        thinking_content = match.group(1).strip()
        final_answer = match.group(2).strip()
        print(f"=== Found embedded thinking content: {len(thinking_content)} chars, answer: {len(final_answer)} chars ===")
        return thinking_content, final_answer

    print("=== No thinking blocks found, treating as final answer ===")
    return "", text


def inject_system_prompt(messages, use_socratic=True):
    """
    Inject the Socratic system prompt if not present
    """
    if not use_socratic:
        return messages

    # Check if system message already exists
    has_system = any(m.get("role") == "system" for m in messages)

    if has_system:
        # Prepend our prompt to existing system message
        for msg in messages:
            if msg.get("role") == "system":
                msg["content"] = SOCRATIC_SYSTEM_PROMPT + "\n\n---\n\n" + msg["content"]
                break
    else:
        # Insert new system message at beginning
        messages.insert(0, {
            "role": "system",
            "content": SOCRATIC_SYSTEM_PROMPT
        })

    return messages


def messageGenerator(messages_list, preset):
    print("\n=== Input Messages ===")
    print(json.dumps(messages_list, indent=2)[:2000])
    print("=== Using Preset:", preset, "===\n")

    adapter_obj = premade_instruct[preset]
    messages_string = ""
    for message in messages_list:
        if message['role'] == "system":
            messages_string += adapter_obj["system_start"]
        elif message['role'] == "user":
            messages_string += adapter_obj["user_start"]
        elif message['role'] == "assistant":
            messages_string += adapter_obj["assistant_start"]
        elif message['role'] == "tool":
            messages_string += adapter_obj.get("tools_start", "")

        messages_string += message['content']

        if message['role'] == "system":
            messages_string += adapter_obj["system_end"]
        elif message['role'] == "user":
            messages_string += adapter_obj["user_end"]
        elif message['role'] == "assistant":
            messages_string += adapter_obj["assistant_end"]
        elif message['role'] == "tool":
            messages_string += adapter_obj.get("tools_end", "")

    messages_string += adapter_obj["assistant_start"]

    print("=== Formatted Message ===")
    print(messages_string[:2000] + "..." if len(messages_string) > 2000 else messages_string)
    print("========================\n")
    return messages_string


def clean_api_key(auth_header):
    """Clean and extract API key from Authorization header"""
    if not auth_header:
        return ""

    if auth_header.lower().startswith('bearer '):
        auth_header = auth_header[7:]

    if auth_header.lower().startswith('bearer '):
        auth_header = auth_header[7:]

    return auth_header.strip()


def trim_to_end_sentence(input_str, include_newline=False):
    """Trim text to end at complete sentence"""
    if not input_str:
        return ""

    punctuation = set(['.', '!', '?', '*', '"', ')', '}', '`', ']', '$', '。', '！', '？', '"', '）', '】', ''', '」', ''])
    last = -1

    for i in range(len(input_str) - 1, -1, -1):
        char = input_str[i]
        if char in punctuation:
            if i > 0 and input_str[i - 1] in [' ', '\n']:
                last = i - 1
            else:
                last = i
            break
        if include_newline and char == '\n':
            last = i
            break

    if last == -1:
        return input_str.rstrip()
    return input_str[:last + 1].rstrip()


def autoTrim(text, is_thinking=False):
    """Auto trim text with thinking model support"""
    if not text:
        return text

    if is_thinking:
        thinking_content, final_answer = parse_thinking_content(text)

        if final_answer:
            trimmed_answer = trim_to_end_sentence(final_answer) if auto_trim else final_answer
            return trimmed_answer
        else:
            return text
    else:
        return trim_to_end_sentence(text) if auto_trim else text


def streamGeneration(config, is_thinking_model=False):
    try:
        print("\n=== Starting Stream Generation ===")
        print(f"Thinking model: {is_thinking_model}")
        print("Request URL:", config['url'])

        with requests.post(**config) as response:
            response.raise_for_status()
            print("\n=== Stream Response ===")
            accumulated_text = ""

            for line in response.iter_lines():
                if line:
                    text = line.decode('utf-8')
                    if text != "data: [DONE]":
                        try:
                            newtext = json.loads(text[6:])
                            if "choices" in newtext and newtext["choices"]:
                                chunk_text = newtext["choices"][0].get("text", "")
                                accumulated_text += chunk_text

                                if is_thinking_model:
                                    thinking_content, final_answer = parse_thinking_content(accumulated_text)
                                    newtext["choices"][0]["delta"] = {
                                        "content": chunk_text
                                    }
                                    if thinking_content:
                                        newtext["choices"][0]["delta"]["reasoning_content"] = thinking_content
                                else:
                                    newtext["choices"][0]["delta"] = {
                                        "content": chunk_text
                                    }

                            text = "data: " + json.dumps(newtext)
                        except (json.JSONDecodeError, KeyError) as e:
                            print(f"Error parsing stream chunk: {e}")
                            continue
                    yield f"{text}\n\n"
                    time.sleep(0.02)
            print("=== Stream Complete ===\n")
    except requests.exceptions.RequestException as error:
        print("=== Error in Stream Generation ===")
        print(str(error))
        if hasattr(error, 'response') and error.response and error.response.status_code == 429:
            yield "data: " + json.dumps({"error": {"message": "Rate limit exceeded", "type": "rate_limit_exceeded"}}) + "\n\n"
        else:
            yield "data: " + json.dumps({"error": {"message": str(error), "type": "api_error"}}) + "\n\n"


def normalGeneration(config, is_thinking_model=False):
    print("\n=== Starting Normal Generation ===")
    print(f"Thinking model: {is_thinking_model}")
    print("Request URL:", config['url'])

    try:
        response = requests.post(**config)
        print("\n=== Response ===")
        print("Status Code:", response.status_code)

        result = response.json()
        if response.status_code <= 299 and "choices" in result and result["choices"]:
            original_text = result["choices"][0].get("text", "")

            if is_thinking_model:
                thinking_content, final_answer = parse_thinking_content(original_text)

                result["choices"][0]["message"] = {
                    "role": "assistant",
                    "content": autoTrim(final_answer, is_thinking=False) if final_answer else ""
                }

                if thinking_content:
                    result["choices"][0]["message"]["reasoning_content"] = thinking_content

                print(f"=== Parsed - Thinking: {len(thinking_content)} chars, Answer: {len(final_answer)} chars ===")
            else:
                processed_text = autoTrim(original_text, is_thinking=False)
                result["choices"][0]["message"] = {
                    "role": "assistant",
                    "content": processed_text
                }

            print("\n=== Final Response ===")
            print("========================\n")
            return jsonify(result), 200
        else:
            print("=== Error Response ===")
            error_message = result.get("error", {}).get("message", "Unknown error") if isinstance(result, dict) else "API Error"
            return jsonify({"error": {"message": error_message, "type": "api_error"}}), response.status_code

    except requests.exceptions.RequestException as e:
        print(f"=== Request Exception: {str(e)} ===")
        return jsonify({"error": {"message": str(e), "type": "network_error"}}), 500
    except json.JSONDecodeError as e:
        print(f"=== JSON Decode Error: {str(e)} ===")
        return jsonify({"error": {"message": "Invalid JSON response", "type": "parse_error"}}), 500


def operation(json_data, adapter=Instruct_Preset, use_socratic=True):
    print("\n=== New Request ===")
    print("Authorization Token:", request.headers.get('Authorization')[:20] + "..." if request.headers.get('Authorization') else None)
    print(f"Socratic mode: {use_socratic}")

    api_key_openai = clean_api_key(request.headers.get('Authorization', ''))

    if not api_key_openai:
        return jsonify({"error": {"message": "Missing API key", "type": "authentication_error"}}), 401

    if not json_data.get("messages"):
        return jsonify({"error": {"message": "Missing messages field", "type": "invalid_request"}}), 400

    model_name = json_data.get("model", "")
    if not model_name:
        return jsonify({"error": {"message": "Missing model field", "type": "invalid_request"}}), 400

    # Inject Socratic system prompt
    messages = inject_system_prompt(json_data["messages"].copy(), use_socratic)

    thinking_model = is_thinking_model(model_name)
    print(f"=== Detected thinking model: {thinking_model} ===")

    formattedMessage = messageGenerator(messages, adapter)

    stoplist = ["\n{{user}}:", "<|im_end|>"]
    if stop_token:
        stoplist.append(stop_token)

    requested_max_tokens = json_data.get('max_tokens', 2048)
    if thinking_model:
        if requested_max_tokens < THINKING_MIN_TOKENS:
            max_tokens = THINKING_MIN_TOKENS
        else:
            max_tokens = min(requested_max_tokens, THINKING_MAX_TOKENS)
    else:
        max_tokens = max(requested_max_tokens, 50)

    if thinking_model:
        temperature = json_data.get("temperature", 0.6)
        actual_top_p = 0.95
        actual_top_k = 20
    else:
        temperature = json_data.get("temperature", 0.7)
        actual_top_p = top_p
        actual_top_k = top_k

    newbody = {
        "prompt": formattedMessage,
        "model": model_name,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": json_data.get("stream", False),
        "top_p": actual_top_p,
        "min_p": min_p,
        "repetition_penalty": repetition_penalty,
        "frequency_penalty": frequency_penalty,
        "presence_penalty": presense_penalty,
        "top_k": actual_top_k,
        "min_tokens": minimum_token,
        "stop": stoplist,
        "skip_special_tokens": True,
        "n": 1,
        "best_of": 1,
        "ignore_eos": False,
        "spaces_between_special_tokens": True
    }

    print(f"=== Final parameters - max_tokens: {max_tokens}, temp: {temperature} ===")

    config = {
        'url': COMPLETIONS_PATH,
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {api_key_openai}",
            'HTTP-Referer': 'https://kernelq.com/'
        },
        'json': newbody,
        'timeout': 300
    }

    if json_data.get("stream", False):
        return Response(stream_with_context(streamGeneration(config, thinking_model)),
                        content_type='text/plain; charset=utf-8')
    else:
        return normalGeneration(config, thinking_model)


# =============================================================================
# ROUTES
# =============================================================================

@app.route("/", methods=["GET"])
def running():
    base_url = request.base_url
    if not base_url.startswith('https'):
        base_url = base_url.replace('http', 'https')
    return {
        "status": "running",
        "mode": "Socratic C Programming Tutor",
        "thinking_support": True,
        "thinking_min_tokens": THINKING_MIN_TOKENS,
        "thinking_max_tokens": THINKING_MAX_TOKENS,
        "endpoints": {
            "socratic (recommended)": f"{base_url}socratic",
            "raw (no system prompt)": f"{base_url}raw",
            "chatml": f"{base_url}chatml",
            "llama-3": f"{base_url}llama-3",
            "mistral": f"{base_url}mistral",
        }
    }


@app.route("/", methods=["POST"])
def baseurl():
    """Default endpoint with Socratic prompt"""
    return operation(request.json, use_socratic=True)


@app.route("/socratic", methods=["POST"])
def socratic():
    """Socratic C programming tutor (recommended)"""
    return operation(request.json, "chatml", use_socratic=True)


@app.route("/raw", methods=["POST"])
def raw():
    """Raw mode - no system prompt injection"""
    return operation(request.json, "chatml", use_socratic=False)


@app.route("/chatml", methods=["POST"])
def chatml():
    return operation(request.json, "chatml", use_socratic=True)


@app.route("/llama-3", methods=["POST"])
def l3():
    return operation(request.json, "llama-3", use_socratic=True)


@app.route("/mistral", methods=["POST"])
def mistral():
    return operation(request.json, "mistral", use_socratic=True)


@app.route("/alpaca", methods=["POST"])
def alpaca():
    return operation(request.json, "alpaca", use_socratic=True)


@app.route("/vicuna", methods=["POST"])
def vicuna():
    return operation(request.json, "vicuna", use_socratic=True)


@app.route("/command-r", methods=["POST"])
def cmdr():
    return operation(request.json, "command-r", use_socratic=True)


@app.route("/gemma2", methods=["POST"])
def gemma2():
    return operation(request.json, "gemma2", use_socratic=True)


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": {"message": "Endpoint not found", "type": "not_found"}}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": {"message": "Internal server error", "type": "server_error"}}), 500


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("SOCRATIC C PROGRAMMING TUTOR")
    print("=" * 60)
    print(f"Thinking model support: ENABLED")
    print(f"Thinking max tokens: {THINKING_MAX_TOKENS}")
    print(f"Default endpoint: /socratic (Qwen3 + chatml)")
    print(f"Raw endpoint: /raw (no system prompt)")
    print("=" * 60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
