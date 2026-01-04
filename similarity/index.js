import { structuralSimilarity } from "./structural.js";
import { tokenSimilarity } from "./token.js";
import { changeRatioScore } from "./changeRatio.js";

export function computeSimilarity(base, submitted) {
  const s = structuralSimilarity(base, submitted);
  const t = tokenSimilarity(base, submitted);
  const c = changeRatioScore(base, submitted);

  return (
    0.5 * s +
    0.3 * t +
    0.2 * c
  );
}

