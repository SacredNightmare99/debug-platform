export function anchorScore(code, anchors = []) {
  if (!anchors.length) return 100;

  let found = 0;
  for (const a of anchors) {
    if (code.includes(a)) found++;
  }

  return (found / anchors.length) * 100;
}

