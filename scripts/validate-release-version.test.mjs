import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReleaseVersion } from "./validate-release-version.mjs";

test("development releases require an explicit dev tag", () => {
    for (const publishTag of [undefined, "latest", "beta"]) {
        assert.throws(() => validateReleaseVersion({ version: "0.0.1-dev.0", publishTag }), /require --tag dev/);
    }
    assert.doesNotThrow(() => validateReleaseVersion({ version: "0.0.1-dev.0", publishTag: "dev" }));
    assert.doesNotThrow(() => validateReleaseVersion({ version: "0.0.1-dev.1", publishTag: "dev" }));
});

test("other version channels cannot use the development release workflow", () => {
    for (const version of ["0.0.1", "0.0.1-beta.0", "0.0.1-dev", "0.0.1-dev.01"]) {
        assert.throws(() => validateReleaseVersion({ version, publishTag: "dev" }), /must use X.Y.Z-dev.N/);
    }
});
