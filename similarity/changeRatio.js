import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export function changeRatioScore(base, submitted) {
  const dir = fs.mkdtempSync("/tmp/git-");
  const file = path.join(dir, "main.txt");

  execSync("git init -q", { cwd: dir });
  fs.writeFileSync(file, base);
  execSync("git add . && git commit -m base -q", { cwd: dir });

  fs.writeFileSync(file, submitted);

  const diff = execSync(
    "git diff --ignore-all-space --numstat",
    { cwd: dir }
  ).toString();

  let added = 0, removed = 0;
  diff.split("\n").forEach(l => {
    if (!l) return;
    const [a, r] = l.split("\t");
    added += parseInt(a) || 0;
    removed += parseInt(r) || 0;
  });

  const total = base.split("\n").length;
  const ratio = (added + removed) / total;

  return Math.max(0, (1 - ratio) * 100);
}

