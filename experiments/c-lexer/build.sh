#!/bin/sh
set -eu
: "${ZIG:?Set ZIG to a pinned Zig compiler executable (tested with 0.14.1)}"
cd "$(dirname "$0")"
mkdir -p dist
for level in Oz O2; do
    "$ZIG" cc -target wasm32-wasi -mexec-model=reactor -"$level" -flto -DNDEBUG lexer.c \
        -Wl,--export=lex_run -Wl,--export=lex_run_binary -Wl,--export=lex_result_ptr -Wl,--export=lex_result_len \
        -Wl,--export=lex_reset -Wl,--export=malloc -Wl,--export=free \
        -Wl,--strip-all -Wl,-z,stack-size=1048576 -o "dist/lexer-$level.wasm"
    "$ZIG" cc -target wasm32-wasi -mexec-model=reactor -"$level" -flto -DNDEBUG lexer.c \
        -Wl,--export=lex_run_binary -Wl,--export=lex_result_ptr -Wl,--export=lex_result_len \
        -Wl,--export=lex_reset -Wl,--export=malloc -Wl,--export=free \
        -Wl,--strip-all -Wl,-z,stack-size=1048576 -o "dist/lexer-binary-$level.wasm"
done
