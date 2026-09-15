import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
let child: ChildProcessWithoutNullStreams | undefined;
let pending: { resolve: (value: string) => void; reject: (error: Error) => void }[] = [];
let stderr = "";
function fail(error: Error) {
    for (const request of pending.splice(0)) request.reject(error);
}
export function oracleRequest(kind: "ast" | "symtable", args: string[]): Promise<string> {
    if (!child) {
        stderr = "";
        child = spawn(process.env.PYTHON ?? "python3.9", [
            "-u",
            fileURLToPath(new URL("./python_oracle.py", import.meta.url)),
        ]);
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });
        child.on("error", fail);
        child.on("close", (code) => {
            fail(new Error(`Python oracle exited (${code}): ${stderr}`));
            child = undefined;
        });
        createInterface({ input: child.stdout }).on("line", (line) => {
            const request = pending.shift();
            if (!request) return;
            try {
                const response = JSON.parse(line);
                if (response.error) request.reject(new Error(response.error));
                else request.resolve(response.result);
            } catch (error) {
                request.reject(error as Error);
            }
        });
    }
    return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
        child!.stdin.write(JSON.stringify({ kind, args }) + "\n", (error) => {
            if (error) fail(error);
        });
    });
}
export async function closeOracle(): Promise<void> {
    if (!child) return;
    const current = child;
    await new Promise<void>((resolve) => {
        current.once("close", () => resolve());
        current.stdin.end();
    });
}
