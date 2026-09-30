import { arch, cpus, platform, release, totalmem } from "node:os";
import { spawnSync } from "node:child_process";

export function performanceEnvironment() {
    return {
        node: process.version,
        platform: platform(),
        release: release(),
        arch: arch(),
        cpu: cpus()[0].model,
        logicalCpus: cpus().length,
        memoryBytes: totalmem(),
        hardware:
            platform() === "darwin"
                ? spawnSync("sysctl", ["-n", "hw.model"], { encoding: "utf8" }).stdout.trim()
                : null,
    };
}
