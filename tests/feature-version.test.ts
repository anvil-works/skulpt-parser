import { parseModule } from "../src/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

const reference = JSON.parse(readFileSync(new URL("./fixtures/feature-version.json", import.meta.url), "utf8"));
for (const { source, featureVersion, tree, error, warnings } of reference.cases) {
    test(`CPython feature version ${featureVersion}: ${JSON.stringify(source)}`, () => {
        const emitted: unknown[] = [];
        const options = {
            featureVersion: featureVersion ?? undefined,
            filename: "<unknown>",
            onWarning: (warning: unknown) => emitted.push(warning),
        };
        if (error) {
            try {
                parseModule(source, options);
                throw new Error("Accepted source rejected by CPython");
            } catch (actual) {
                for (const [key, value] of Object.entries(error)) expect((actual as any)[key]).toEqual(value);
            }
        } else expect(parseModule(source, options)).toEqual(tree);
        expect(emitted).toEqual(warnings ?? []);
    });
}
