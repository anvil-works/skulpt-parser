const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
export function measure(run, source) {
    const start = performance.now();
    let value = run(source);
    const firstCallMs = performance.now() - start;
    if (!value.tokens) throw new Error(JSON.stringify(value));
    const tokenCount = value.tokens.length;
    value = null;
    let checksum = 0;
    for (let i = 0; i < 12; i++) checksum += run(source).tokens.length;
    let t = performance.now();
    for (let i = 0; i < 3; i++) checksum += run(source).tokens.length;
    const estimate = (performance.now() - t) / 3;
    const iterations = Math.max(1, Math.min(500, Math.ceil(25 / Math.max(estimate, 0.001))));
    const samplesMs = [];
    for (let sample = 0; sample < 9; sample++) {
        t = performance.now();
        for (let i = 0; i < iterations; i++) checksum += run(source).tokens.length;
        samplesMs.push((performance.now() - t) / iterations);
    }
    return { firstCallMs, tokenCount, iterations, samplesMs, medianMs: median(samplesMs), checksum };
}

// Match the pinned oracle's compact, lossless stream hashing format.
export function oracleBytes(tokens) {
    const lines = [],
        indices = new Map();
    const rows = tokens.map((t) => {
        if (!indices.has(t.line)) {
            indices.set(t.line, lines.length);
            lines.push(t.line);
        }
        return [t.type, t.string, t.start, t.end, indices.get(t.line)];
    });
    return new TextEncoder().encode(JSON.stringify([lines, rows]));
}
