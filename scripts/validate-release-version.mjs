import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function validateReleaseVersion({ version, publishTag = "latest" }) {
    if (!/^\d+\.\d+\.\d+-dev\.(0|[1-9]\d*)$/.test(version)) {
        throw new Error(`Development releases must use X.Y.Z-dev.N; got ${version}`);
    }
    if (publishTag !== "dev") {
        throw new Error(`Development releases require --tag dev; got ${publishTag}. Run: pnpm publish --tag dev`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
        validateReleaseVersion({ version, publishTag: process.env.npm_config_tag || "latest" });
    } catch (error) {
        console.error(`Release version check failed: ${error.message}`);
        process.exitCode = 1;
    }
}
