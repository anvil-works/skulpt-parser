"""Validate the pinned source inputs with their own grammar and ASDL readers."""

import ast
import sys

from . import verify_inputs


def check(lock, source):
    version = ".".join(map(str, sys.version_info[:3]))
    if sys.implementation.name != "cpython" or version != lock["version"]:
        raise RuntimeError(f'Generator checks require CPython {lock["version"]}; got {sys.version}')
    verify_inputs(lock, source)
    # Keep validation from writing bytecode caches into the source directory.
    sys.dont_write_bytecode = True
    sys.path[:0] = [str(source / "Tools/peg_generator"), str(source / "Parser")]
    import asdl
    from pegen.build import build_parser, generate_token_definitions

    grammar, _, _ = build_parser(str(source / "Grammar/python.gram"))
    schema = asdl.parse(str(source / "Parser/Python.asdl"))
    if not asdl.check(schema):
        raise ValueError("The pinned ASDL schema failed validation")
    nodes = 0
    for definition in schema.dfns:
        value = definition.value
        constructors = value.types if isinstance(value, asdl.Sum) else [value]
        for constructor in constructors:
            name = constructor.name if isinstance(value, asdl.Sum) else definition.name
            runtime = getattr(ast, name)
            fields = tuple(field.name for field in constructor.fields)
            attributes = tuple(field.name for field in value.attributes)
            if fields != runtime._fields or attributes != runtime._attributes:
                raise ValueError(f"ASDL/runtime layout mismatch for {name}")
            nodes += 1
    with (source / "Grammar/Tokens").open(encoding="utf8") as tokens_file:
        tokens, _, _ = generate_token_definitions(tokens_file)
    return {
        "version": lock["version"],
        "commit": lock["commit"],
        "verified_files": len(lock["files"]),
        "grammar_rules": len(grammar.rules),
        "ast_layouts_checked": nodes,
        "tokens": len(tokens),
    }
