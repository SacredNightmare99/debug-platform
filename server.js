import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

import { runTestcases } from "./runner/runTestcases.js";
import { computeSimilarity } from "./similarity/index.js";
import { executionLimiter } from "./limits/executionLimiter.js";

const app = express();
app.use(bodyParser.json({ limit: "100kb" }));

app.post("/submit", async (req, res) => {
  const { challengeId, submittedCode } = req.body;

  const challenge = JSON.parse(
    fs.readFileSync(`./challenges/${challengeId}.json`)
  );

  const result = await executionLimiter.run(() => 
    runTestcases({
      language: challenge.language,
      code: submittedCode,
      testcases: challenge.testcases
    })
  );

  if (result.status != "accepted") {
    return res.json({
      testcases: {
        status: "failed",
        reason: result.status,
        testcase: result.testcase
      }
    });
  }

  const similarity = computeSimilarity(
    challenge.baseCode,
    submittedCode
  );
  
  const similarityPassed = similarity >= challenge.similarityThreshold;

  res.json({
    testcases: {
      status: "passed"
    },
    similarity: {
      score: Number(similarity.toFixed(2)),
      passed: similarityPassed
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

