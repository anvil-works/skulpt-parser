// Independent parse + AST oracle from the Skulpt bundle used by Anvil.
import fs from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";

const bundle = fs.readFileSync(process.argv[2], "utf8");
const context = vm.createContext({ console, setTimeout, clearTimeout });
vm.runInContext(bundle, context);
const { Sk } = context;
const sources = [
    "async = 1\nawait = 2",
    "def process(async, await):\n return async + await",
    "def async():\n pass",
    "class await:\n pass",
    "obj.async = obj.await",
    "import async\nfrom await import async",
    "import thing as await",
    "f(async=1, await=2)",
    "await(x)",
    "await (x).attr",
    "await[x]",
    "async(await(x))",
    "lambda await: await",
    "[await for await in async]",
    "def f():\n global async\n async = 1",
    "async def f():\n await g()",
    "await f()",
    "async for x in items:\n pass",
    "async with manager:\n pass",
    "[x async for x in items]",
];
const cases = ["python2", "python3"].flatMap((mode) =>
    sources.map((source) => {
        Sk.configure({ __future__: { ...Sk[mode] } });
        try {
            const parsed = Sk.parse("input.py", source + "\n");
            const ast = Sk.astFromParse(parsed.cst, "input.py", parsed.flags);
            const kinds = ast.body.map((node) => node._astname);
            const expression = ast.body.length === 1 && ast.body[0]._astname === "Expr" ? ast.body[0].value : null;
            return {
                mode,
                source,
                kinds,
                ...(expression ? { expressionKind: expression._astname } : {}),
                ...(expression?._astname === "Call" && expression.func._astname === "Name"
                    ? { callee: expression.func.id.v }
                    : {}),
            };
        } catch (error) {
            if (!error.tp$name) throw error;
            return { mode, source, error: error.tp$name };
        }
    })
);
fs.writeFileSync(
    new URL("../tests/fixtures/legacy-async-skulpt.json", import.meta.url),
    JSON.stringify({ bundleSha256: createHash("sha256").update(bundle).digest("hex"), cases }, null, 4) + "\n"
);
