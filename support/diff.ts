import { deepStrictEqual } from "node:assert";
export function assertEqualsString(actual: string, expected: string, message?: string): void {
    deepStrictEqual(actual.split("\n"), expected.split("\n"), message);
}
export function getDiff(actual: string, expected: string): string {
    try {
        assertEqualsString(actual, expected);
        return "Success - we have a match";
    } catch (error) {
        return String(error);
    }
}
