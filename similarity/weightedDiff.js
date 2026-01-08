import { classifyLine } from "./lineClassifier.js";
import { normalize } from "./normalize.js";

export function weightedSimilarity(base, submitted, language) {
  const a = base
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const b = submitted
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let totalWeight = 0;
  let matchedWeight = 0;

  const max = Math.max(a.length, b.length);

  for (let i = 0; i < max; i++) {
    const lineA = a[i] || "";
    const lineB = b[i] || "";

    const { weight } = classifyLine(lineA, language);
    totalWeight += weight;

    if (normalize(lineA, language) === normalize(lineB, language)) {
      matchedWeight += weight;
    }
  }

  return (matchedWeight / totalWeight) * 100;
}

