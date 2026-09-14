import fs from "node:fs";
import { spawn } from "node:child_process";
const [binary, ...paths] = process.argv.slice(2);
const child = spawn(binary, [], { stdio: ["pipe", "inherit", "inherit"] });
for (const file of paths) {
    const text = fs.readFileSync(file, "utf8");
    const cases = file.endsWith(".jsonl") ? text.trim().split("\n").map(JSON.parse) : JSON.parse(text);
    for (const c of cases) {
        const data = Buffer.from(c.source, "utf8");
        const n = Buffer.alloc(4);
        n.writeUInt32LE(data.length);
        child.stdin.write(n);
        if (!child.stdin.write(data)) await new Promise((r) => child.stdin.once("drain", r));
    }
}
child.stdin.end();
const status = await new Promise((r) => child.once("exit", r));
if (status !== 0) process.exitCode = status || 1;
