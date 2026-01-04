export function structuralFingerprint(code) {
  return code
    // remove comments
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    // normalize strings & numbers
    .replace(/(["'`]).*?\1/g, "STR")
    .replace(/\b\d+(\.\d+)?\b/g, "NUM")
    // normalize identifiers
    .replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, "ID")
    // normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function structuralSimilarity(a, b) {
  const fa = structuralFingerprint(a);
  const fb = structuralFingerprint(b);

  const len = Math.max(fa.length, fb.length);
  let same = 0;

  for (let i = 0; i < Math.min(fa.length, fb.length); i++) {
    if (fa[i] === fb[i]) same++;
  }

  return (same / len) * 100;
}

