const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

export async function createLexer(bytes, { binary = false } = {}) {
    const compileStart = performance.now();
    const module = await WebAssembly.compile(bytes);
    const compileMs = performance.now() - compileStart;
    const imports = WebAssembly.Module.imports(module);
    // WASI libc initialization needs entropy; parsing needs no filesystem or process service.
    // Trap rather than silently emulate any unexpected WASI call.
    const importObject = {};
    let instance;
    for (const entry of imports) {
        if (entry.kind !== "function") throw new Error(`Unsupported import ${entry.module}.${entry.name}`);
        (importObject[entry.module] ??= {})[entry.name] =
            entry.module === "wasi_snapshot_preview1" && entry.name === "random_get"
                ? (ptr, length) => {
                      const target = new Uint8Array(instance.exports.memory.buffer, ptr, length);
                      for (let i = 0; i < length; i += 65536) crypto.getRandomValues(target.subarray(i, i + 65536));
                      return 0;
                  }
                : () => {
                      throw new Error(`Unexpected host call ${entry.module}.${entry.name}`);
                  };
    }
    const instantiateStart = performance.now();
    instance = await WebAssembly.instantiate(module, importObject);
    const e = instance.exports;
    if (e._initialize) e._initialize();
    const instantiateMs = performance.now() - instantiateStart;

    const typeNames = new Map();
    function run(source, extra = false, profile = false) {
        const times = {};
        let t = performance.now();
        // Match the TS reference's deferred UTF-8 encoding error, before TextEncoder replaces surrogates.
        const malformed = /[\uD800-\uDFFF]+/u.exec(source);
        let errorLineByte = -1,
            messageBytes = null;
        if (malformed) {
            const lineStart = source.lastIndexOf("\n", malformed.index) + 1;
            const offset = Array.from(source.slice(lineStart, malformed.index)).length;
            const span =
                malformed[0].length === 1
                    ? `character '\\u${malformed[0]
                          .charCodeAt(0)
                          .toString(16)
                          .padStart(4, "0")}' in position ${offset}`
                    : `characters in position ${offset}-${offset + malformed[0].length - 1}`;
            errorLineByte = encoder.encode(source.slice(0, lineStart)).length;
            messageBytes = encoder.encode(`'utf-8' codec can't encode ${span}: surrogates not allowed`);
        }
        const input = encoder.encode(source);
        if (profile) {
            times.encodeMs = performance.now() - t;
            t = performance.now();
        }
        const ptr = e.malloc(input.length + 1 + (messageBytes ? messageBytes.length + 1 : 0));
        if (!ptr) throw new Error("WASM input allocation failed");
        try {
            const memory = new Uint8Array(e.memory.buffer);
            memory.set(input, ptr);
            memory[ptr + input.length] = 0;
            let messagePtr = 0;
            if (messageBytes) {
                messagePtr = ptr + input.length + 1;
                memory.set(messageBytes, messagePtr);
                memory[messagePtr + messageBytes.length] = 0;
            }
            if (profile) {
                times.inputCopyMs = performance.now() - t;
                t = performance.now();
            }
            const status = (binary ? e.lex_run_binary : e.lex_run)(
                ptr,
                input.length,
                Number(extra),
                errorLineByte,
                messagePtr
            );
            if (profile) {
                times.scanAndSerializeMs = performance.now() - t;
                t = performance.now();
            }
            const resultBytes = e.lex_result_len();
            let result;
            if (binary && status === 0) {
                if (profile) {
                    times.decodeMs = 0;
                    t = performance.now();
                }
                const data = new Int32Array(e.memory.buffer, e.lex_result_ptr(), resultBytes / 4);
                const memory = new Uint8Array(e.memory.buffer);
                const tokens = [];
                let lastLinePtr = -1,
                    lastLineLen = -1,
                    lastLine = "";
                for (let i = 0; i < data.length; i += 10) {
                    const typePtr = data[i],
                        typeLen = data[i + 1],
                        textPtr = data[i + 2],
                        textLen = data[i + 3];
                    const sl = data[i + 4],
                        sc = data[i + 5],
                        el = data[i + 6],
                        ec = data[i + 7];
                    const linePtr = data[i + 8],
                        lineLen = data[i + 9];
                    let type = typeNames.get(typePtr);
                    if (type === undefined) {
                        type = decoder.decode(memory.subarray(typePtr, typePtr + typeLen));
                        typeNames.set(typePtr, type);
                    }
                    if (linePtr !== lastLinePtr || lineLen !== lastLineLen) {
                        lastLine = decoder.decode(memory.subarray(linePtr, linePtr + lineLen));
                        lastLinePtr = linePtr;
                        lastLineLen = lineLen;
                    }
                    const string = decoder.decode(memory.subarray(textPtr, textPtr + textLen));
                    tokens.push({ type, string, start: [sl, sc], end: [el, ec], line: lastLine });
                }
                result = { tokens };
            } else {
                const text = decoder.decode(new Uint8Array(e.memory.buffer, e.lex_result_ptr(), resultBytes));
                if (profile) {
                    times.decodeMs = performance.now() - t;
                    t = performance.now();
                }
                result = JSON.parse(text);
                if (result.lines) {
                    for (const token of result.tokens) token.line = result.lines[token.line];
                    delete result.lines;
                }
            }
            if (profile) times.materializeMs = performance.now() - t;
            return profile ? { result, times, resultBytes, linearMemoryBytes: e.memory.buffer.byteLength } : result;
        } finally {
            e.lex_reset();
            e.free(ptr);
        }
    }
    return { run, compileMs, instantiateMs, imports, memoryBytes: () => e.memory.buffer.byteLength };
}
