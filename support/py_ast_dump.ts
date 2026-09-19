import { oracleRequest } from "./python_oracle.ts";
export async function getPyAstDump(
    content: string,
    options: { indent?: null | number; include_attributes?: boolean; js?: boolean },
    mode = "exec"
): Promise<string> {
    return oracleRequest("ast", [
        content,
        `--indent=${options.indent ?? -1}`,
        `--attrs=${options.include_attributes ? 1 : 0}`,
        `--js=${options.js ? 1 : 0}`,
        `--mode=${mode}`,
    ]);
}
