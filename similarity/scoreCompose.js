export function composeScore(parts) {
  return (
    0.4 * parts.weighted +
    0.2 * parts.locality +
    0.2 * parts.anchors +
    0.2 * parts.structure +
    parts.penalty
  );
}

