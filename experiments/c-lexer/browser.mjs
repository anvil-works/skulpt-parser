import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
const [backend, input, optimization, output] = process.argv.slice(2);
const root = path.dirname(fileURLToPath(import.meta.url));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "skulpt-wasm-chrome-"));
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filename = path.resolve(root, "." + pathname);
    if (!filename.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
    }
    try {
        const data = fs.readFileSync(filename);
        res.setHeader(
            "Content-Type",
            filename.endsWith(".wasm")
                ? "application/wasm"
                : filename.endsWith(".mjs") || filename.endsWith(".js")
                ? "text/javascript"
                : filename.endsWith(".json")
                ? "application/json"
                : "text/html"
        );
        res.end(data);
    } catch {
        res.writeHead(404).end();
    }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const child = spawn(
    chrome,
    [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--user-data-dir=${profile}`,
        "--remote-debugging-port=0",
        "about:blank",
    ],
    { stdio: "ignore" }
);
let ws;
try {
    let port;
    for (let i = 0; i < 200; i++) {
        try {
            port = fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0];
            break;
        } catch {
            await new Promise((r) => setTimeout(r, 50));
        }
    }
    if (!port) throw new Error("Test Chrome did not start");
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
    });
    let id = 0;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
        const m = JSON.parse(event.data);
        if (m.id) {
            const p = pending.get(m.id);
            pending.delete(m.id);
            m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
        }
    });
    const send = (method, params = {}) =>
        new Promise((resolve, reject) => {
            const n = ++id;
            pending.set(n, { resolve, reject });
            ws.send(JSON.stringify({ id: n, method, params }));
        });
    await send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/browser-page.html` });
    for (let i = 0; i < 200; i++) {
        const r = await send("Runtime.evaluate", {
            expression: "typeof globalThis.benchmarkReady",
            returnByValue: true,
        });
        if (r.result?.value === "function") break;
        if (i === 199) throw new Error("Browser harness not ready");
        await new Promise((r) => setTimeout(r, 50));
    }
    const expression = `globalThis.benchmarkReady(${JSON.stringify(backend)},${JSON.stringify(input)},${JSON.stringify(
        optimization
    )})`;
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    fs.writeFileSync(output, JSON.stringify(r.result.value, null, 2) + "\n");
    console.log(JSON.stringify({ backend, input, medianMs: r.result.value.medianMs }));
} finally {
    ws?.close();
    child.kill();
    server.close();
}
