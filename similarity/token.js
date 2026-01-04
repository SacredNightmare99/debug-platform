function tokenize(code) {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    .split(/[^a-zA-Z0-9_]+/)
    .filter(Boolean);
}

export function tokenSimilarity(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));

  let common = 0;
  for (const t of A) {
    if (B.has(t)) common++;
  }

  const max = Math.max(A.size, B.size);
  return max === 0 ? 100 : (common / max) * 100;
}

