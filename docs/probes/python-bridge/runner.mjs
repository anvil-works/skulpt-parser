// Throwaway probe. The same subprocess code runs under Node and Deno.
import { spawn, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
const here = dirname(fileURLToPath(import.meta.url));
const pythonPath = process.env.PROBE_PYTHON;
const mode = process.argv[2];
const sources = JSON.parse(readFileSync(join(here, "fixtures.json"), "utf8"));
sources.push({ source: Array.from({ length: 120 }, (_, i) => `value_${i} = ${i} + 1`).join("\n") });
const requests = Array.from({ length: 5 }, () => sources).flat();
let request, close, child;
const started = performance.now();
if (mode === "ffi") {
    const { python } = await import("jsr:@denosaurs/python@0.4.6");
    python.import("sys").path.append(here);
    const fn = python.import("oracle").handle_json;
    request = async (value) => JSON.parse(fn(JSON.stringify(value)).toString());
    close = async () => {};
} else if (mode === "spawn") {
    request = async (value) =>
        JSON.parse(
            execFileSync(pythonPath, ["-u", join(here, "oracle.py")], {
                input: JSON.stringify(value) + "\n",
                encoding: "utf8",
                maxBuffer: 8 * 1024 * 1024,
            })
        );
    close = async () => {};
} else {
    child = spawn(pythonPath, ["-u", join(here, "oracle.py")], { stdio: ["pipe", "pipe", "inherit"] });
    const pending = [];
    let buffer = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (text) => {
        buffer += text;
        while (buffer.includes("\n")) {
            const at = buffer.indexOf("\n");
            const line = buffer.slice(0, at);
            buffer = buffer.slice(at + 1);
            pending.shift().resolve(JSON.parse(line));
        }
    });
    child.on("error", (error) => {
        for (const p of pending.splice(0)) p.reject(error);
    });
    const exited = new Promise((resolve, reject) =>
        child.on("close", (code) => {
            if (code !== 0) reject(new Error(`Python exited ${code}`));
            else resolve();
        })
    );
    request = (value) =>
        new Promise((resolve, reject) => {
            pending.push({ resolve, reject });
            child.stdin.write(JSON.stringify(value) + "\n");
        });
    close = async () => {
        child.stdin.end();
        await exited;
    };
}
const meta = await request({ op: "meta" });
const setup_ms = performance.now() - started;
await request(sources[0]);
const rounds = [];
let digest;
for (let round = 0; round < 3; round++) {
    const begin = performance.now();
    const results =
        mode === "batch"
            ? await request(requests)
            : await (async () => {
                  const values = [];
                  for (const value of requests) values.push(await request(value));
                  return values;
              })();
    rounds.push(performance.now() - begin);
    const hash = createHash("sha256").update(JSON.stringify(results)).digest("hex");
    if (digest && digest !== hash) throw new Error("Round output changed");
    digest = hash;
}
const after = await request({ op: "meta" });
await close();
console.log(
    JSON.stringify({
        mode,
        runtime: globalThis.Deno?.version ?? process.version,
        python: meta.python,
        requests_per_round: requests.length,
        setup_ms,
        round_ms: rounds,
        digest,
        host_final_rss_bytes: process.memoryUsage().rss,
        python_peak_rss_bytes: mode === "spawn" ? null : after.max_rss_bytes,
        child_closed: child ? child.exitCode === 0 : null,
    })
);
