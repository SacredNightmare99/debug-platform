# Debug Platform – Single-File Debugging Challenge Engine

A backend service for **debugging-style coding challenges** where participants are expected to **fix bugs in an existing codebase**, not rewrite solutions from scratch.

The platform evaluates submissions in **two strictly separated phases**:

1. **Functional correctness** (sandboxed execution with testcases)
2. **Debug-effort similarity** (to ensure minimal, genuine fixes)

This system is **not a plagiarism checker**.
It is a **debugging fidelity evaluator**.

---

## Supported Languages

Currently supported:

* **C**
* **Python**

---

## Core Design Principles

* **Correctness always comes first**
* **Similarity is evaluated only after correctness**
* **Single-file challenges only**
* **Language is defined by the challenge, never by the user**
* **High similarity is good** (debugging ≠ rewriting)
* **Formatting and variable renames are allowed**
* **Rewrites are penalized even if correct**
* **All execution is sandboxed using Docker**

---

## Project Structure

```
debug-platform/
├── docker/
│   ├── c.Dockerfile
│   ├── py.Dockerfile
│
├── runner/
│   ├── runSingleTest.js
│   ├── runTestcases.js
│   └── outputMatch.js
│
├── limits/
│   └── executionLimiter.js
│
├── similarity/
│   ├── normalize.js
│   ├── lineClassifier.js
│   ├── weightedDiff.js
│   ├── locality.js
│   ├── anchors.js
│   ├── hardcode.js
│   ├── scoreCompose.js
│   └── index.js
│
├── challenges/
│   └── example.json
│
├── server.js
├── package.json
└── README.md
```

---

## Challenge Definition (`challenges/*.json`)

Each challenge is defined as a JSON file.

### Example

```json
{
  "language": "c",
  "baseCode": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\\n\", n * n + 1);\n    return 0;\n}\n",
  "testcases": [
    { "input": "2\n", "expected": "4" },
    { "input": "5\n", "expected": "25" },
    { "input": "10\n", "expected": "100" }
  ],
  "anchors": ["scanf", "printf"],
  "similarityThreshold": 70
}
```

---

### Challenge Fields Explained

| Field                 | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `language`            | Execution language (`c`, `python`)                            |
| `baseCode`            | Buggy reference implementation (full file as string)          |
| `testcases`           | List of stdin/stdout pairs                                    |
| `anchors`             | *(Optional)* semantic landmarks that should survive debugging |
| `similarityThreshold` | Minimum similarity % required **after** passing testcases     |

---

## Anchors (Important Concept)

**Anchors are semantic landmarks**, not strict requirements.

They answer the question:

> *Did the participant preserve the original algorithm while fixing bugs?*

Examples of good anchors:

* Function names
* Helper utilities
* Macros
* Algorithm-specific strings
* Key helper calls

Examples of bad anchors:

* Variable names
* Formatting
* Keywords like `int`, `return`
* Magic numbers

Anchors:

* **Never block a correct solution**
* **Only influence similarity**
* **Scale with problem complexity**

Small challenges may use **no anchors at all**.

---

## API Overview

### `POST /submit`

Submit a solution for evaluation.

#### Request Body

```json
{
  "challengeId": "example",
  "submittedCode": "<FULL SOURCE FILE AS STRING>"
}
```

Rules:

* `submittedCode` must contain the **entire file**
* Language is inferred from the challenge
* Text files only (no binaries, no archives)

---

## Evaluation Flow (Strict Order)

1. **Run all testcases**
2. If any testcase fails → return immediately
3. If all testcases pass:

   * Compute similarity
   * Compare with threshold
4. Return results **clearly separated**

👉 **Similarity is never computed if testcases fail.**

---

## Response Formats

### ❌ Testcases Failed

```json
{
  "testcases": {
    "status": "failed",
    "reason": "wrong-output",
    "testcase": 2
  }
}
```

Possible reasons:

* `runtime-error`
* `wrong-output`

---

### ✅ Testcases Passed, Similarity Failed

```json
{
  "testcases": { "status": "passed" },
  "similarity": {
    "score": 58.44,
    "threshold": 70,
    "passed": false,
    "breakdown": {
      "weighted": 60.12,
      "locality": 80.00,
      "anchors": 33.33,
      "structure": 70.00,
      "penalty": -10.00
    }
  }
}
```

---

### ✅ Testcases Passed, Similarity Passed

```json
{
  "testcases": { "status": "passed" },
  "similarity": {
    "score": 94.23,
    "threshold": 70,
    "passed": true,
    "breakdown": {
      "weighted": 100.00,
      "locality": 100.00,
      "anchors": 100.00,
      "structure": 100.00,
      "penalty": 0.00
    }
  }
}
```

All similarity values are **rounded to 2 decimal places**.

---

## Similarity Scoring (v2 – Debug-Aware)

Similarity is a **weighted composite score**:

```
Final Score =
  40% Weighted Line Similarity
+ 20% Edit Locality
+ 20% Anchor Preservation
+ 20% Structural Similarity
+ Penalties
```

### What It Rewards

* Minimal, localized edits
* Preserved control flow
* Variable renames
* Formatting / whitespace changes
* Debug-style fixes

### What It Penalizes

* Full rewrites
* Hardcoded outputs
* Algorithm replacement
* Removing core helpers
* Output-only solutions

---

## Runtime Execution

All code runs inside **Docker sandboxes** with:

* No network access
* Memory limits
* CPU limits
* Execution timeouts
* Process isolation

### Language Runners

| Language | Docker Image         |
| -------- | -------------------- |
| C        | `gcc:13`             |
| Python   | `python:3.12-alpine` |

---

## Concurrency Control

To protect the host system:

* Submissions are executed through an **in-process concurrency limiter**
* Only a small number of executions run at once
* Excess requests wait safely in memory

This avoids:

* Docker overload
* CPU starvation
* Random failures under load

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Build Docker Runners

```bash
docker build -t runner-c  -f docker/c.Dockerfile .
docker build -t runner-py -f docker/py.Dockerfile .
```

---

### 3. Docker Permissions (Linux)

```bash
sudo usermod -aG docker $USER
# logout + login required
```

Verify:

```bash
docker ps
```

---

### 4. Start Server

```bash
node server.js
```

Server runs on:

```
http://localhost:3000
```

---

## Submitting Code

### Using `curl` (recommended)

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  --data-raw "$(jq -n \
    --arg code "$(cat solution.c)" \
    '{ challengeId: "example", submittedCode: $code }')"
```

---

### From a Frontend

```js
const file = input.files[0];
const code = await file.text();

fetch("/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    challengeId: "example",
    submittedCode: code
  })
});
```

