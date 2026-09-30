// Local isolated browsers only. No interaction with a user's browser or apps.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { performanceEnvironment } from "./performance-environment.mjs";
import { resolve } from "node:path";
import { chromium, webkit } from "playwright";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
assert.ok(option("--cases") && option("--output"), "Use --cases <verified-cases.json> --output <report.json>");
const cases = JSON.parse(readFileSync(option("--cases"), "utf8"));
const engines = [{ name: "candidate", path: resolve(option("--candidate", "dist-core/index.js")) }];
if (option("--baseline")) engines.push({ name: "baseline", path: resolve(option("--baseline")) });
for (const engine of engines) engine.sha256 = createHash("sha256").update(readFileSync(engine.path)).digest("hex");
const files = new Map(engines.map((engine) => [`/${engine.name}.js`, engine.path]));
files.set("/utils.js", resolve("scripts/performance-utils.mjs"));
const server = createServer((request, response) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    const path = files.get(request.url);
    response.setHeader("Content-Type", path ? "text/javascript" : "text/html");
    if (path) response.end(readFileSync(path));
    else if (request.url === "/") response.end("<!doctype html><title>Parser benchmark</title>");
    else {
        response.statusCode = 404;
        response.end();
    }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const report = {
    environment: performanceEnvironment(),
    manifest: option("--manifest") ? JSON.parse(readFileSync(option("--manifest"), "utf8")) : null,
    engines,
    cases: cases.map(({ name, source }) => ({
        name,
        bytes: Buffer.byteLength(source),
        sha256: createHash("sha256").update(source).digest("hex"),
    })),
    runs: [],
};
try {
    for (const [name, launcher] of Object.entries({ chromium, webkit })) {
        const browser = await launcher.launch();
        try {
            for (let round = 0; round < Number(option("--rounds", "3")); round++) {
                const order = round % 2 ? [...engines].reverse() : engines;
                for (const engine of order) {
                    const context = await browser.newContext();
                    try {
                        const page = await context.newPage();
                        await page.exposeFunction("verifyCase", (caseName, record) => {
                            const expected = cases.find((item) => item.name === caseName);
                            assert.deepEqual(
                                record,
                                {
                                    ...(expected.error ? { error: expected.error } : { tree: expected.tree }),
                                    warnings: expected.warnings,
                                },
                                `${name}/${engine.name}/${caseName}`
                            );
                        });
                        await page.goto(origin);
                        const run = await page.evaluate(
                            async ({ cases, engine }) => {
                                const { measure, parseRecord } = await import("/utils.js");
                                const begin = performance.now();
                                const { parseModule } = await import(`/${engine}.js`);
                                const loadMs = performance.now() - begin;
                                const first = performance.now();
                                parseModule("x = 1");
                                const firstParseMs = performance.now() - first;
                                const results = [];
                                for (const item of cases) {
                                    let record = parseRecord(parseModule, item.source);
                                    await window.verifyCase(item.name, record);
                                    // Release the verification tree before collecting timed samples.
                                    record = null;
                                    const operation = () => {
                                        try {
                                            parseModule(item.source);
                                        } catch (error) {
                                            if (!item.error) throw error;
                                        }
                                    };
                                    results.push({ name: item.name, ...measure(operation) });
                                }
                                return { loadMs, firstParseMs, crossOriginIsolated, cases: results };
                            },
                            {
                                cases: cases.map(({ name, source, error }) => ({ name, source, error })),
                                engine: engine.name,
                            }
                        );
                        report.runs.push({
                            browser: name,
                            version: browser.version(),
                            engine: engine.name,
                            round,
                            ...run,
                        });
                        console.error(name, engine.name, round + 1);
                    } finally {
                        await context.close();
                    }
                }
            }
        } finally {
            await browser.close();
        }
    }
    writeFileSync(option("--output"), JSON.stringify(report));
} finally {
    server.close();
}
