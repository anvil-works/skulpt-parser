// Shared measurement and serialization for Node and isolated browser benchmarks.
export function quantile(values, fraction) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

export function encode(value) {
    const root = {};
    const pending = [[root, "value", value]];
    while (pending.length) {
        const [parent, key, child] = pending.pop();
        if (typeof child === "bigint") parent[key] = { $bigint: String(child) };
        else if (typeof child === "number" && !Number.isFinite(child)) parent[key] = { $float: String(child) };
        else if (child instanceof Uint8Array) parent[key] = { $bytes: [...child] };
        else if (child !== null && typeof child === "object") {
            const target = (parent[key] = Array.isArray(child) ? [] : {});
            for (const [field, item] of Object.entries(child).reverse()) pending.push([target, field, item]);
        } else parent[key] = child;
    }
    return root.value;
}

// An iterative canonical serializer keeps probe tooling from introducing its own
// recursion limit when the parser successfully produces a deep expression AST.
export function canonicalJSON(value) {
    const output = [];
    const pending = [{ value }];
    while (pending.length) {
        const item = pending.pop();
        if ("text" in item) {
            output.push(item.text);
            continue;
        }
        const child = item.value;
        if (child === null || typeof child !== "object") {
            output.push(JSON.stringify(child));
            continue;
        }
        const array = Array.isArray(child);
        const keys = Object.keys(child);
        if (!array) keys.sort();
        output.push(array ? "[" : "{");
        pending.push({ text: array ? "]" : "}" });
        for (let i = keys.length - 1; i >= 0; i--) {
            if (i < keys.length - 1) pending.push({ text: "," });
            pending.push({ value: child[keys[i]] });
            if (!array) pending.push({ text: JSON.stringify(keys[i]) + ":" });
        }
    }
    return output.join("");
}

export function errorRecord(error) {
    const record = { name: error.name, message: error.message };
    for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) record[key] = error[key] ?? null;
    return record;
}

export function parseRecord(parse, source, options = {}) {
    const warnings = [];
    let tree, error;
    try {
        tree = encode(
            parse(source, {
                ...options,
                onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
            })
        );
    } catch (failure) {
        error = errorRecord(failure);
    }
    return { ...(error ? { error } : { tree }), warnings };
}

export function measure(operation) {
    for (let i = 0; i < 10; i++) operation();
    const trial = performance.now();
    for (let i = 0; i < 5; i++) operation();
    const iterations = Math.max(1, Math.min(1000, Math.ceil(25 / ((performance.now() - trial) / 5))));
    const samplesMs = [],
        latencySamplesMs = [];
    for (let batch = 0; batch < 9; batch++) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            const begin = performance.now();
            operation();
            latencySamplesMs.push(performance.now() - begin);
        }
        samplesMs.push((performance.now() - start) / iterations);
    }
    return {
        iterations,
        samplesMs,
        medianMs: quantile(samplesMs, 0.5),
        p95Ms: quantile(latencySamplesMs, 0.95),
        latencySamplesMs,
    };
}
