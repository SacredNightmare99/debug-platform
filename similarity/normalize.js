export function normalize(code, language) {
  let out = code;

  // remove comments
  out = out
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "");

  // normalize strings & numbers
  out = out
    .replace(/(["'`]).*?\1/g, "STR")
    .replace(/\b\d+(\.\d+)?\b/g, "NUM");

  if (language === "python") {
    // normalize variable names (but keep keywords)
    out = out.replace(
      /\b(?!if|else|elif|for|while|def|return|print|input|import|from|as|class|try|except|with|lambda|yield|True|False|None)\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
      "VAR"
    );
  }

  if (language === "c") {
    out = out.replace(
      /\b(?!if|else|for|while|switch|case|return|printf|scanf|malloc|free|struct|int|float|double|char|void)\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
      "VAR"
    );
  }

  // normalize whitespace
  out = out.replace(/\s+/g, " ").trim();

  return out;
}

