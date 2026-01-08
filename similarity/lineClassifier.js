export function classifyLine(line, language) {
  const l = line.trim();

  if (!l) return { type: "boilerplate", weight: 0.2 };

  if (language === "c") {
    if (/^#include/.test(l)) return { type: "boilerplate", weight: 0.2 };
    if (/^(int|float|double|char|struct)\b/.test(l))
      return { type: "declaration", weight: 0.6 };
  }

  if (language === "python") {
    if (/^import\b/.test(l)) return { type: "boilerplate", weight: 0.2 };
    if (/^def\b/.test(l)) return { type: "declaration", weight: 0.6 };
  }

  if (/\b(if|for|while|switch|elif)\b/.test(l))
    return { type: "control", weight: 1.0 };

  if (/\b(printf|scanf|cin|cout|print|input)\b/.test(l))
    return { type: "io", weight: 0.8 };

  return { type: "logic", weight: 1.2 };
}

