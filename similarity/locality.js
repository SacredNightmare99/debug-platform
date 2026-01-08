export function localityScore(base, submitted) {
  const a = base.split("\n");
  const b = submitted.split("\n");

  const changed = [];

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || "") !== (b[i] || "")) {
      changed.push(i);
    }
  }

  if (changed.length <= 2) return 100;

  let spread = 0;
  for (let i = 1; i < changed.length; i++) {
    spread += changed[i] - changed[i - 1];
  }

  const avgSpread = spread / (changed.length - 1);

  return Math.max(0, 100 - avgSpread * 5);
}

