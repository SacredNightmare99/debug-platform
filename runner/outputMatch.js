export function normalize(out) {
  return out
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ");
}

export function outputsMatch(actual, expected) {
  return normalize(actual) === normalize(expected);
}

