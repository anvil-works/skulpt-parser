"""Additional independently selected scope cases, checked after initial implementation."""

from oracle import case, OUT
import json

CASES = {
    "import-then-global": "def f():\n import x\n global x\n return x\n",
    "import-then-nonlocal": "def outer(x):\n def f():\n  import x\n  nonlocal x\n  return x\n return f\n",
    "global-then-nonlocal-with-use": "def outer(x):\n def f():\n  global x\n  print(x)\n  nonlocal x\n return f\n",
    "nonlocal-then-global": "def outer(x):\n def f():\n  nonlocal x\n  global x\n return f\n",
    "module-global-binding": "global x\nx=1\nprint(x)\n",
    "nonlocal-already-used": "def outer(x):\n def f():\n  nonlocal x\n  print(x)\n  nonlocal x\n return f\n",
    "closure-in-generator": "def f(xs):\n return (lambda: x for x in xs)\n",
    "free-through-generator": "def f(xs,value):\n return (lambda: value for x in xs)\n",
    "nested-generator-walrus": "def f(xs):\n return (((saved := y) for y in x) for x in xs)\n",
    "global-generator-walrus": "def f(xs):\n global saved\n return ((saved := x) for x in xs)\n",
    "nonlocal-generator-walrus": "def outer(saved):\n def f(xs):\n  nonlocal saved\n  return ((saved := x) for x in xs)\n return f\n",
    "walrus-iter-lambda": "def f(xs):\n return (x for x in (lambda: (saved := xs))())\n",
    "walrus-inner-lambda": "def f(xs):\n return (lambda: (x := value) for x in xs)\n",
    "dict-unpack": "def f(x):\n return {**x, key:value}\n",
    "store-attribute": "def f(obj):\n obj.attr=value\n obj[index]=other\n",
    "generator-filter-walrus": "def f(xs):\n return (saved for x in xs if (saved := x))\n",
}
(OUT / "extra-corpus.json").write_text(
    json.dumps([case(name, source) for name, source in CASES.items()], ensure_ascii=True, indent=2) + "\n"
)
