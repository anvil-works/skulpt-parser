// Check in a small subset of the full deterministic probe for ordinary tests.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { mutationCases, mutationFixtures } from "./robustness-cases.mjs";

const fixtures = mutationFixtures(process.env.PYTHON314 || "python3.14");
const indices = new Set([0, 1, 2, 3, 16, 17, 18, 19, 32, 33, 34, 35]);
const sources = mutationCases(fixtures, 36)
    .filter((_, index) => indices.has(index))
    .map(({ name, source }) => ({ name, source }));
const oracle = spawnSync(process.env.PYTHON314 || "python3.14", ["scripts/python314_probe.py"], {
    input: JSON.stringify(sources),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
});
assert.equal(oracle.status, 0, oracle.stderr);
const records = JSON.parse(oracle.stdout);
writeFileSync(
    "tests/fixtures/python314-robustness.json",
    JSON.stringify(
        {
            python: "3.14.3",
            seed: "0x314cafe",
            cases: records.filter((item) => item.tree),
            errors: records.filter((item) => item.error),
        },
        null,
        2
    ) + "\n"
);
