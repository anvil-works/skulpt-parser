import { oracleRequest } from "./python_oracle.ts";
export function getPySymTableDump(content: string): Promise<string> {
    return oracleRequest("symtable", [content]);
}
