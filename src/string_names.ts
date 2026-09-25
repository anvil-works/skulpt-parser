// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
import data from "./string_names.json";

/** Decode only the matching block; do not expand the name database into a Map. */
export function unicodeName(name: string): number | undefined {
    // Table names use ASCII case-insensitive lookup. CPython’s algorithmic
    // Hangul and CJK unified names require uppercase spelling.
    const original = name;
    if (name.startsWith("HANGUL SYLLABLE ")) {
        const syllable = name.slice(16);
        const leading = [
            "G",
            "GG",
            "N",
            "D",
            "DD",
            "R",
            "M",
            "B",
            "BB",
            "S",
            "SS",
            "",
            "J",
            "JJ",
            "C",
            "K",
            "T",
            "P",
            "H",
        ];
        const vowels = [
            "A",
            "AE",
            "YA",
            "YAE",
            "EO",
            "E",
            "YEO",
            "YE",
            "O",
            "WA",
            "WAE",
            "OE",
            "YO",
            "U",
            "WEO",
            "WE",
            "WI",
            "YU",
            "EU",
            "YI",
            "I",
        ];
        const trailing = [
            "",
            "G",
            "GG",
            "GS",
            "N",
            "NJ",
            "NH",
            "D",
            "L",
            "LG",
            "LM",
            "LB",
            "LS",
            "LT",
            "LP",
            "LH",
            "M",
            "B",
            "BS",
            "S",
            "SS",
            "NG",
            "J",
            "C",
            "K",
            "T",
            "P",
            "H",
        ];
        for (let l = 0; l < leading.length; l++) {
            for (let v = 0; v < vowels.length; v++) {
                const prefix = leading[l] + vowels[v];
                if (!syllable.startsWith(prefix)) continue;
                const t = trailing.indexOf(syllable.slice(prefix.length));
                if (t >= 0) return 0xac00 + (l * 21 + v) * 28 + t;
            }
        }
        return;
    }
    name = name.replace(/[a-z]/g, (ch) => ch.toUpperCase());
    for (const [prefix, ranges] of Object.entries(data.ranges)) {
        if (!name.startsWith(prefix)) continue;
        const suffix = name.slice(prefix.length);
        if (!/^[0-9A-F]{4,6}$/.test(suffix)) return;
        const cp = parseInt(suffix, 16);
        if (prefix === "CJK UNIFIED IDEOGRAPH-") {
            // Upstream permits 4–5 digits, including 04E00, but not 004E00.
            if (name !== original || suffix.length > 5) return;
        } else if (cp.toString(16).toUpperCase().padStart(4, "0") !== suffix) return;
        for (let i = 0; i < ranges.length; i += 2) {
            if (cp >= ranges[i] && cp <= ranges[i + 1]) return cp;
        }
        return;
    }
    let lo = 0,
        hi = data.keys.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (data.keys[mid] <= name) lo = mid + 1;
        else hi = mid;
    }
    if (!lo) return;
    let previous = "";
    for (const line of data.blocks[lo - 1].split("\n")) {
        const colon = line.indexOf(":"),
            equal = line.lastIndexOf("=");
        previous = previous.slice(0, Number(line.slice(0, colon))) + line.slice(colon + 1, equal);
        if (previous === name) return parseInt(line.slice(equal + 1), 16);
        if (previous > name) return;
    }
}
