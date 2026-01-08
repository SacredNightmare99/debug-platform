function normalizeForSize(code) {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    .replace(/\s+/g, "");
}

export function hardcodePenalty(
  submittedCode,
  baseCode,
  expectedOutputs = []
) {
  for (const out of expectedOutputs) {
    const clean = out.trim();
    if (clean && submittedCode.includes(clean)) {
      return -40; // very strong signal
    }
  }

  const baseNorm = normalizeForSize(baseCode);
  const subNorm = normalizeForSize(submittedCode);

  const charRatio = subNorm.length / baseNorm.length;

  const baseLines = baseCode.split("\n").filter(l => l.trim()).length;
  const subLines = submittedCode.split("\n").filter(l => l.trim()).length;

  const lineRatio = subLines / baseLines;


  let penalty = 0;

  if (charRatio < 0.25 || lineRatio < 0.30) {
    penalty -= 30;
  } else if (charRatio < 0.40) {
    penalty -= 20;
  } else if (charRatio < 0.60) {
    penalty -= 10;
  }

  if (baseLines < 15) {
    penalty = Math.max(penalty, -10);
  }

  return penalty;
}

