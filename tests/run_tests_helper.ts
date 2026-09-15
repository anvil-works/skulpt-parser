import { readdirSync, readFileSync } from "node:fs";
import { test } from "@rstest/core";
interface RunTestsOptions {
    files?: string[];
    skip?: Set<string>;
}
export async function runTests(doTest: (text: string) => void | Promise<void>, options: RunTestsOptions = {}) {
    const files = options.files?.length
        ? options.files
        : readdirSync("run-tests")
              .filter((f) => f.endsWith(".py"))
              .sort();
    for (const name of files) {
        const register = options.skip?.has(name) ? test.skip : test;
        register(name, async () => {
            await doTest(readFileSync("run-tests/" + name, "utf8"));
        });
    }
}
