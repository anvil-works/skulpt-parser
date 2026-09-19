import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

const context = vm.createContext({ TextEncoder, TextDecoder });
async function load(path) {
    const module = new vm.SourceTextModule(readFileSync(path, "utf8"), { context });
    await module.link((specifier) => {
        throw new Error("Unexpected bundle dependency: " + specifier);
    });
    await module.evaluate();
    return module.namespace;
}
const coreBytes = readFileSync("dist-core/index.js");
// Guard the optional-data contract, with headroom for ordinary parser growth.
assert.ok(gzipSync(coreBytes).length < 64 * 1024, "Core bundle may have pulled in the name database");
const core = await load("dist-core/index.js");
const fixtures = JSON.parse(readFileSync("tests/fixtures/python314-expressions.json", "utf8"));
function encode(value) {
    return JSON.parse(
        JSON.stringify(value, (_key, child) => {
            if (typeof child === "bigint") return { $bigint: String(child) };
            if (typeof child === "number" && !Number.isFinite(child)) return { $float: String(child) };
            if (ArrayBuffer.isView(child)) return { $bytes: Array.from(child) };
            return child;
        })
    );
}
function check(fixture, unicodeName) {
    const warnings = [];
    const actual = core.parseExpression(fixture.source, {
        unicodeName,
        onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
    });
    assert.deepEqual(encode(actual), fixture.tree, fixture.source);
    assert.deepEqual(warnings, fixture.warnings, fixture.source);
}
for (const source of ["𝒙 + K", "'\\x00\\xff\\u1234\\U0001f600'", "b'\\u1234\\N{SPACE}'", 'rf"\\N{SNOWMAN}{x}"']) {
    const fixture = fixtures.cases.find((item) => item.source === source);
    assert.ok(fixture);
    check(fixture);
}
const moduleFixture = JSON.parse(readFileSync("tests/fixtures/python314-modules.json", "utf8")).cases.find(
    (item) => item.source === "x = 1"
);
assert.ok(moduleFixture);
assert.deepEqual(encode(core.parseModule(moduleFixture.source)), moduleFixture.tree);
assert.throws(
    () => core.parseExpression("'\\N{SNOWMAN}'", { filename: "example.py" }),
    (error) => {
        assert.ok(error instanceof core.UnicodeNameDatabaseRequired);
        assert.equal(error.unicodeName, "SNOWMAN");
        assert.equal(error.filename, "example.py");
        assert.equal(error.lineno, 1);
        assert.equal(error.offset, 1);
        return true;
    }
);
// Load only after ordinary parsing succeeds and a named escape requests it.
const names = await load("dist-core/unicode-names.js");
const namedCases = fixtures.cases.filter((item) => item.source.includes("\\N"));
for (const fixture of namedCases) check(fixture, names.unicodeName);
for (const { source, error: expected } of fixtures.errors.filter((item) => item.source.includes("\\N"))) {
    const resolvers = expected.message.includes("malformed") ? [undefined, names.unicodeName] : [names.unicodeName];
    for (const unicodeName of resolvers) {
        let failure;
        try {
            core.parseExpression(source, { unicodeName });
        } catch (error) {
            failure = error;
        }
        assert.ok(failure);
        const actual = { name: failure.name, message: failure.message };
        for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) actual[key] = failure[key] ?? null;
        assert.deepEqual(actual, expected, source);
    }
}
// Loading the module does not mutate parser-wide configuration.
assert.throws(() => core.parseExpression("'\\N{SNOWMAN}'"), core.UnicodeNameDatabaseRequired);
console.log(
    JSON.stringify({ corePackage: "passed", namedCases: namedCases.length, coreGzip: gzipSync(coreBytes).length })
);

// Exercise the package subpath consumed by the IDE, not just a direct bundle path.
const linkedCore = await import("@anvil-works/skulpt-parser/core");
const { unicodeName: linkedUnicodeName } = await import("@anvil-works/skulpt-parser/unicode-names");
assert.equal(linkedCore.parseExpression('"\\N{SNOWMAN}"', { unicodeName: linkedUnicodeName }).body.value.value, "☃");
const lexerFixtures = JSON.parse(readFileSync("tests/fixtures/python314-lexer.json", "utf8"));
for (const source of ["# comment", "é = 𝒙 + 1\n", 'def f(x):\n    return f"value {x!r:>10}"\n']) {
    const fixture = lexerFixtures.cases.find((item) => item.source === source && item.extra);
    assert.ok(fixture);
    for (const tokens of [linkedCore.tokenize(source), Array.from(linkedCore.scan(source))]) {
        assert.deepEqual(
            tokens.map(({ type, string, start, end, line }) => ({ type, string, start, end, line })),
            fixture.expected.tokens,
            source
        );
    }
}
