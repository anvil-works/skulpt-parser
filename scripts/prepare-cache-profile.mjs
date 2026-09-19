// Make an isolated diagnostic bundle; never overwrite the linked production build.
import assert from "node:assert/strict";
import { cpSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const destination = process.argv[2];
assert.ok(destination, "Usage: node scripts/prepare-cache-profile.mjs <new-directory>");
const root = resolve(destination);
mkdirSync(root); // Refuse to replace an existing experiment.
cpSync("src", join(root, "src"), { recursive: true });
symlinkSync(resolve("node_modules"), join(root, "node_modules"), "dir");
writeFileSync(join(root, "package.json"), '{"type":"module"}\n');
const generated = readFileSync("src/python314/generated_parser.ts", "utf8");
// Slots are assigned once, in generated decorator registration order.
const memoRules = [...generated.matchAll(/@(memoize(?:LeftRec)?)\n(\w+)\(\)/g)].map(([, decorator, name]) => ({
    name,
    leftRecursive: decorator === "memoizeLeftRec",
}));
assert.ok(memoRules.length, "No generated memoized rules found");
writeFileSync(
    join(root, "profile-entry.ts"),
    'export { parseModule } from "./src/python314/frontend_core.ts";\n' +
        'export { Parser } from "./src/python314/parser.ts";\n' +
        `export const memoRules = ${JSON.stringify(memoRules)};\n`
);
writeFileSync(
    join(root, "rslib.config.ts"),
    `import { defineConfig } from "@rslib/core";
export default defineConfig({
    source: { decorators: { version: "legacy" }, entry: { index: "./profile-entry.ts" } },
    lib: [{ format: "esm", syntax: "es2020", dts: false }],
    output: { target: "node", minify: false, distPath: { root: "profile-dist" } }
});\n`
);
const build = spawnSync("pnpm", ["exec", "rslib", "build"], { cwd: root, stdio: "inherit" });
assert.equal(build.status, 0, "Diagnostic bundle build failed");
