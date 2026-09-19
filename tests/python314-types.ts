import * as ast from "../src/python314/ast.ts";

const value = ast.Name("x", ast.Load(), 1, 0, 1, 1);
// ASDL expr?* means nullable elements, not a nullable collection.
ast.Dict([null], [value], 1, 0, 1, 7);
ast.arguments([], [], null, [], [null], null, []);
// @ts-expect-error Dict.keys is a required collection.
ast.Dict(null, [value], 1, 0, 1, 7);
// @ts-expect-error Dict.values elements are not nullable.
ast.Dict([null], [null], 1, 0, 1, 7);
// @ts-expect-error FormattedValue.conversion is a required integer.
ast.FormattedValue(value, null, null, 1, 0, 1, 3);
// Nullable end positions stay explicit; roots have no invented location fields.
ast.Name("x", ast.Load(), 1, 0, null, null);
const root = ast.Module([], []);
// @ts-expect-error Module has no lineno attribute.
root.lineno;
