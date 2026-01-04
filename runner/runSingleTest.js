import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FILES = {
  javascript: "main.js",
  python: "main.py",
  c: "main.c"
};

const IMAGES = {
  javascript: "runner-js",
  python: "runner-py",
  c: "runner-c"
};

export function runSingleTest({ language, code, input }) {
  const dir = fs.mkdtempSync("/tmp/run-");
  fs.writeFileSync(path.join(dir, FILES[language]), code);

  try {
    const output = execSync(
      `docker run --rm -i \
       --memory=64m \
       --cpus=0.5 \
       --network=none \
       --pids-limit=64 \
       -v ${dir}:/app \
       ${IMAGES[language]}`,
      {
        input,
        timeout: 2000,
        maxBuffer: 1024 * 1024
      }
    ).toString();

    return { success: true, output };
  } catch (e) {
    return {
      success: false,
      error: e.stderr?.toString() || "Runtime error"
    };
  }
}

