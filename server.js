import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

import { runTestcases } from "./runner/runTestcases.js";
import { computeSimilarity } from "./similarity/index.js";
import { executionLimiter } from "./limits/executionLimiter.js";
import { requestLogger } from "./logs/requestLogger.js";

const app = express();
app.use(requestLogger);
app.use(bodyParser.json({ limit: "100kb" }));

app.post("/submit", async (req, res) => {
  const { challengeId, submittedCode } = req.body;

  const reqId = req.requestId;

  console.log(`[REQ ${reqId}] Challenge: ${challengeId}`);
  console.log(`[REQ ${reqId}] Code size: ${submittedCode.length} bytes`);

  const challenge = JSON.parse(
    fs.readFileSync(`./challenges/${challengeId}.json`)
  );

  console.log(`[REQ ${reqId}] Running testcases...`);
  const result = await executionLimiter.run(() => 
    runTestcases({
      language: challenge.language,
      code: submittedCode,
      testcases: challenge.testcases
    })
  );

  if (result.status !== "accepted") {
    console.log(
      `[REQ ${reqId}] Testcases FAILED | Reason: ${result.status}`
    );
    return res.json({
      testcases: {
        status: "failed",
        reason: result.status,
        testcase: result.testcase
      }
    });
  }

  console.log(`[REQ ${reqId}] Testcases PASSED`);
  console.log(`[REQ ${reqId}] Computing similarity...`);

  const similarity = computeSimilarity({
    baseCode: challenge.baseCode,
    submittedCode,
    language: challenge.language,
    anchors: challenge.anchors || [],
    expectedOutputs: challenge.testcases.map(t => t.expected)
  });
  
  const passed = similarity.total >= challenge.similarityThreshold;

  console.log(
    `[REQ ${reqId}] Similarity: ${similarity.total.toFixed(2)}% | Passed: ${passed}`
  );

  res.json({
    testcases: {
      status: "passed"
    },
    similarity: {
      score: Number(similarity.total.toFixed(2)),
      passed: passed,
      breakdown: similarity.breakdown
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use((err, req, res, next) => {
  console.error(`[ERR ${req.requestId}]`, err);
  res.status(500).json({ error: "Internal server error" });
});

