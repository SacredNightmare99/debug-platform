import { weightedSimilarity } from "./weightedDiff.js";
import { localityScore } from "./locality.js";
import { anchorScore } from "./anchors.js";
import { hardcodePenalty } from "./hardcode.js";
import { composeScore } from "./scoreCompose.js";
import { normalize } from "./normalize.js";

export function computeSimilarity({
  baseCode,
  submittedCode,
  language,
  anchors = [],
  expectedOutputs = []
}) {
  const weighted = weightedSimilarity(baseCode, submittedCode, language);
  const locality = localityScore(baseCode, submittedCode);
  const anchorsScore = anchorScore(submittedCode, anchors);
  const structure =
    normalize(baseCode, language) === normalize(submittedCode, language) ? 100 : 70;

  const penalty = hardcodePenalty(submittedCode, baseCode, expectedOutputs);

  const total = composeScore({
    weighted,
    locality,
    anchors: anchorsScore,
    structure,
    penalty
  });

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: {
      weighted: Number(weighted.toFixed(2)),
      locality: Number(locality.toFixed(2)),
      anchors: Number(anchorsScore.toFixed(2)),
      structure: Number(structure.toFixed(2)),
      penalty: Number(penalty.toFixed(2))
    }
  };
}

