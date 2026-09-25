// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

/** Source-literal values, independent of Skulpt runtime objects. */
export type ScalarConstant =
    | { type: "int"; value: number | bigint; legacyLong?: true }
    | { type: "float"; value: number }
    | { type: "complex"; real: number; imag: number }
    | { type: "str"; value: string }
    | { type: "bytes"; value: Uint8Array }
    | { type: "bool"; value: boolean }
    | { type: "none" }
    | { type: "ellipsis" };
