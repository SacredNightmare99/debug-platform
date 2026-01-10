import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

import { runTestcases } from "./runner/runTestcases.js";
import { computeSimilarity } from "./similarity/index.js";
import { executionLimiter } from "./limits/executionLimiter.js";
import { requestLogger } from "./logs/requestLogger.js";
import { ApiError } from "./utils/apiError.js";

const app = express();

app.use(requestLogger);
app.use(bodyParser.json({ limit: "100kb" }));

app.post("/submit", async (req, res, next) => {
  try {
    const { challengeId, submittedCode } = req.body;
    const reqId = req.requestId;

    if (!challengeId || !submittedCode) {
      throw new ApiError(400, "Missing challengeId or submittedCode");
    }

    console.log(`[REQ ${reqId}] Challenge: ${challengeId}`);
    console.log(`[REQ ${reqId}] Code size: ${submittedCode.length} bytes`);

    const challengePath = `./challenges/${challengeId}.json`;
    if (!fs.existsSync(challengePath)) {
      throw new ApiError(404, "Challenge not found");
    }

    if (submittedCode.length > 100_000) {
      throw new ApiError(413, "Submitted code too large");
    }

    const challenge = JSON.parse(
      fs.readFileSync(challengePath, "utf8")
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

      return res.status(200).json({
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

    res.status(200).json({
      testcases: {
        status: "passed"
      },
      similarity: {
        score: Number(similarity.total.toFixed(2)),
        passed,
        breakdown: similarity.breakdown
      }
    });
  } catch (err) {
    next(err);
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;

  console.error(
    `[ERROR] ${req.requestId || "-"} | ${status} | ${err.message}`
  );

  if (err.details) {
    console.error("Details:", err.details);
  }

  res.status(status).json({
    error: err.message
  });
});

