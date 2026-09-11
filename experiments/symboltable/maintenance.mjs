import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = process.cwd(),
    tsc = resolve("node_modules/typescript/bin/tsc");
const corpus = JSON.parse(readFileSync("corpus.json", "utf8"));
const results = [];
for (const candidate of ["switch", "visitor"])
    for (const change of [
        "baseline",
        "missing-keyword-defaults",
        "missing-comprehension-handler",
        "new-node",
        "unguarded-second-iterable",
    ]) {
        const temp = mkdtempSync(join(tmpdir(), "symtable-maintenance-"));
        try {
            for (const file of ["types.ts", "common.ts", `${candidate}.ts`, "package.json"])
                cpSync(file, join(temp, file));
            const file = join(temp, `${candidate}.ts`);
            let source = readFileSync(file, "utf8");
            if (change === "missing-keyword-defaults")
                source = source.replace(
                    "this.walk(node.args.kw_defaults);",
                    "/* deliberately omitted keyword-only defaults */"
                );
            if (change === "missing-comprehension-handler")
                source =
                    candidate === "visitor"
                        ? source.replace("visit_comprehension(node:", "visitComprehension(node:")
                        : source.replace(
                              /            case "comprehension": \{[\s\S]*?(?=            case "NamedExpr":)/,
                              ""
                          );
            if (change === "unguarded-second-iterable")
                source = source.replace("this.iterable(node.iter);", "this.visit(node.iter);");
            if (change === "new-node") {
                const types = join(temp, "types.ts");
                writeFileSync(
                    types,
                    readFileSync(types, "utf8").replace(
                        "type Fields = {",
                        "type Fields = {\n    NewNode: { value: Node };"
                    )
                );
            }
            if (change !== "baseline" && change !== "new-node" && source === readFileSync(file, "utf8"))
                throw new Error(`Mutation did not apply: ${change}`);
            writeFileSync(file, source);
            const checked = spawnSync(
                process.execPath,
                [
                    tsc,
                    "--noEmit",
                    "--strict",
                    "--target",
                    "es2023",
                    "--module",
                    "nodenext",
                    "--allowImportingTsExtensions",
                    "--skipLibCheck",
                    file,
                ],
                { encoding: "utf8", timeout: 30000 }
            );
            const result = {
                candidate,
                change,
                typecheckPassed: checked.status === 0,
                diagnostics: (checked.stdout + checked.stderr)
                    .replaceAll(temp, "<experiment>")
                    .replaceAll(root, "<comparison>"),
            };
            if (checked.status === 0) {
                const cases =
                    change === "missing-keyword-defaults"
                        ? corpus.filter((c) => c.name === "kw-default-regression")
                        : change === "unguarded-second-iterable"
                        ? corpus.filter((c) => c.name === "walrus-second-iter")
                        : corpus;
                const input = join(temp, "cases.json"),
                    output = join(temp, "result.json");
                writeFileSync(input, JSON.stringify(cases));
                const run = spawnSync(process.execPath, [resolve("evaluate.mjs"), file, input, output], {
                    encoding: "utf8",
                    timeout: 30000,
                });
                if (![0, 1].includes(run.status)) throw new Error(run.stderr);
                const report = JSON.parse(readFileSync(output, "utf8"));
                result.behavior = {
                    cases: report.cases,
                    exact: report.exact,
                    failures: report.failures.map((f) => f.name),
                };
            }
            results.push(result);
        } finally {
            rmSync(temp, { recursive: true, force: true });
        }
    }
writeFileSync("maintenance-results.json", JSON.stringify(results, null, 2) + "\n");
console.log(
    JSON.stringify(
        results.map(({ candidate, change, typecheckPassed, behavior }) => ({
            candidate,
            change,
            typecheckPassed,
            behavior,
        }))
    )
);
for (const r of results) {
    if (r.change === "baseline" && (!r.typecheckPassed || r.behavior.exact !== r.behavior.cases))
        throw new Error("Baseline failed");
    if (["missing-comprehension-handler", "new-node"].includes(r.change) && r.typecheckPassed)
        throw new Error("Coverage safeguard failed");
    if (
        ["missing-keyword-defaults", "unguarded-second-iterable"].includes(r.change) &&
        (!r.typecheckPassed || r.behavior.exact === r.behavior.cases)
    )
        throw new Error("Semantic mutation was not detected by behavior test");
}
