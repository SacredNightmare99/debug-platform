import { runSingleTest } from "./runSingleTest.js";
import { outputsMatch } from "./outputMatch.js";

export async function runTestcases({ language, code, testcases }) {
  for (let i = 0; i < testcases.length; i++) {
    const res = await runSingleTest({
      language,
      code,
      input: testcases[i].input
    });

    if (!res.success) {
      return { status: "runtime-error", testcase: i + 1 };
    }

    if (!outputsMatch(res.output, testcases[i].expected)) {
      return {
        status: "wrong-output",
        testcase: i + 1,
        output: res.output
      };
    }
  }

  return { status: "accepted" };
}

