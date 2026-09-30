// Fixed-seed edits of checked-in valid modules. Indexes always span code points.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export function mutationFixtures(python = "python3.14") {
    const fixtures = JSON.parse(readFileSync("tests/fixtures/python314-modules.json", "utf8")).cases;
    const child = spawnSync(python, ["scripts/python314_probe.py", "--tokens"], {
        input: JSON.stringify(fixtures.map(({ source }) => ({ source }))),
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
    });
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(child.stdout);
}
export function mutationCases(fixtures, count = 200) {
    let state = 0x314cafe;
    const random = (limit) => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) % limit;
    };
    const sources = fixtures.filter(({ source }) => source.length > 10 && source.length < 3000);
    return Array.from({ length: count }, (_, i) => {
        const parent = sources[random(sources.length)];
        const text = [...parent.source];
        const offset = random(text.length);
        const kind = ["truncate", "delete-token", "delimiter", "whitespace"][i % 4];
        if (kind === "truncate") text.splice(offset);
        if (kind === "delete-token") {
            const [start, end] = parent.tokens[random(parent.tokens.length)];
            text.splice(start, end - start);
        }
        if (kind === "delimiter") text.splice(offset, 1, ["(", ")", "[", "]", "{", "}"][random(6)]);
        if (kind === "whitespace") text.splice(offset, 0, ["\n", "\t", " "][random(3)]);
        return { name: `mutation-${i}-${kind}`, parent: parent.source, source: text.join("") };
    });
}

export function scalingCases({ stress = false } = {}) {
    const cases = [];
    const units = {
        expressions: "value = a + b * c + d / e + f\n",
        nested: "value = " + "(".repeat(80) + "x" + ")".repeat(80) + "\n",
        fstrings: 'value = f"{x!r:>12} {y + 1} {z}"\n',
        "trailing-error": "value = [x for x in rows if x]\n",
    };
    for (const [family, unit] of Object.entries(units)) {
        for (const bytes of [4096, 16384, 65536]) {
            let source =
                unit.repeat(Math.ceil(bytes / unit.length)) + (family === "trailing-error" ? "result = (x +\n" : "");
            if (stress && family === "expressions") source = "value = " + "x + ".repeat(bytes / 4) + "x\n";
            if (stress && family === "nested") {
                const depth = bytes / 512;
                source = "value = " + "[".repeat(depth) + "x,".repeat(bytes / 2) + "]".repeat(depth) + "\n";
            }
            cases.push({ name: `scaling-${family}-${bytes}`, family, source });
        }
    }
    return cases;
}

export function incompleteCases() {
    const endings = {
        dot: "value.",
        string: 'value = "unfinished',
        fstring: 'value = f"{unfinished',
        definition: "def unfinished(value,",
        multiline: "value = (\n  1 +\n",
    };
    return Object.entries(endings).flatMap(([kind, ending]) =>
        [16384, 65536].map((bytes) => ({
            name: `incomplete-${kind}-${bytes}`,
            source: "résumé = 'hello'\n".repeat(Math.ceil(bytes / 19)) + ending,
        }))
    );
}
