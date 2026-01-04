# Debug Platform – Single-File Debugging Challenge Engine

A backend service for **debugging-style coding challenges** where participants are expected to **fix bugs in an existing codebase**, not rewrite solutions from scratch.

The platform evaluates submissions in **two independent phases**:

1. **Functional correctness** (via testcases in a sandboxed runtime)
2. **Code similarity** (to ensure minimal, genuine debugging)

Supported languages:

* **C**
* **Python**
* **JavaScript**

---

## Core Design Principles

* **Correctness first, similarity second**
* **Single-file challenges only**
* **Language defined by the challenge, not the user**
* **High similarity is good** (debugging ≠ rewriting)
* **Sandboxed execution using Docker**

---

## Project Structure

```
debug-platform/
├── docker/
│   ├── c.Dockerfile
│   ├── py.Dockerfile
│   └── js.Dockerfile
│
├── runner/
│   ├── runSingleTest.js
│   ├── runTestcases.js
│   └── outputMatch.js
│
├── similarity/
│   ├── structural.js
│   ├── token.js
│   ├── changeRatio.js
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

### Example: `challenges/example.json`

```json
{
  "language": "c",
  "baseCode": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\\n\", n * n + 1);\n    return 0;\n}\n",
  "testcases": [
    { "input": "2\n", "expected": "4" },
    { "input": "5\n", "expected": "25" },
    { "input": "10\n", "expected": "100" }
  ],
  "similarityThreshold": 70
}
```

### Fields Explained

| Field                 | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `language`            | Execution language (`c`, `python`, `javascript`)      |
| `baseCode`            | Buggy reference implementation                        |
| `testcases`           | Input/output pairs (stdin/stdout)                     |
| `similarityThreshold` | Minimum similarity % required after passing testcases |

---

## API Overview

### `POST /submit`

Submits a solution for evaluation.

#### Request Body

```json
{
  "challengeId": "example",
  "submittedCode": "<FULL SOURCE FILE AS STRING>"
}
```

* `submittedCode` must contain the **entire file**
* No language is sent by the client
* File must be **text only**

---

## Evaluation Flow (Important)

The server always follows this order:

1. **Run all testcases**
2. If any testcase fails → return failure immediately
3. If all testcases pass:

   * Compute similarity
   * Compare against threshold
4. Return results **separately**

Similarity is **never computed** if testcases fail.

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

Possible `reason` values:

* `runtime-error`
* `wrong-output`

---

### ✅ Testcases Passed, Similarity Failed

```json
{
  "testcases": {
    "status": "passed"
  },
  "similarity": {
    "score": 52.31,
    "threshold": 70,
    "passed": false
  }
}
```

---

### ✅ Testcases Passed, Similarity Passed

```json
{
  "testcases": {
    "status": "passed"
  },
  "similarity": {
    "score": 91.04,
    "threshold": 70,
    "passed": true
  }
}
```

---

## Similarity Scoring (How It Works)

Similarity is a **hybrid score**, designed for debugging challenges.

```
Final Score =
  50% Structural Similarity
+ 30% Token Similarity
+ 20% Change Ratio
```

### What It Rewards

* Minimal edits
* Preserved structure
* Variable renames
* Formatting changes

### What It Penalizes

* Full rewrites
* Different algorithms
* Hardcoded outputs

---

## Runtime Execution

All code is executed inside **Docker sandboxes** with:

* No network access
* Memory limit
* CPU limit
* Timeout
* PID limit

### Language Runners

| Language   | Docker Image         |
| ---------- | -------------------- |
| C          | `gcc:13`             |
| Python     | `python:3.12-alpine` |
| JavaScript | `node:20-alpine`     |

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Docker Runners

```bash
docker build -t runner-c  -f docker/c.Dockerfile .
docker build -t runner-py -f docker/py.Dockerfile .
docker build -t runner-js -f docker/js.Dockerfile .
```

### 3. Docker Permissions (Required)

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

## Submitting Code (Examples)

### Using `curl` with a real file

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  --data-raw "$(jq -n \
    --arg code "$(cat solution.c)" \
    '{ challengeId: "example", submittedCode: $code }')"
```

---

### Browser / Frontend Upload

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

---

## Limits & Safety

Recommended defaults:

* Max code size: **100 KB**
* Execution timeout: **2 seconds**
* Max output: **1 MB**
* No binary files allowed
* No network access

---

## Intended Use Case

This system is designed for:

* Debugging challenges
* Bug-fix assessments
* Learning platforms
* Interview screening
* Competitive debugging games

It is **not** intended for:

* Multi-file projects
* AST-level semantic equivalence
* General plagiarism detection

---

## Design Philosophy (Summary)

> Correctness proves it works.
> Similarity proves *how* it was fixed.

Both matter — but correctness always comes first.

