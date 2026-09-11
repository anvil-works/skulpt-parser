"""Synthetic scope cases and controlled benchmark programs."""

CASES = {
    "module": "x = source\ny = x\n",
    "simple": "def f(x):\n return x + global_name\n",
    "closure": "def outer(x):\n def inner(y):\n  return x+y\n return inner\n",
    "transitive-free": "def outer(x):\n def middle():\n  def inner():\n   return x\n  return inner\n return middle\n",
    "shadow": "x=1\ndef f(x):\n def g(x):\n  return x\n return g\n",
    "defaults": "seed=1\ndef f(x=seed):\n return x\n",
    "kw-default-regression": "def outer():\n seed=1\n def inner(*, required, choice=seed):\n  return choice\n return inner\n",
    "decorator": "@decorate(value)\ndef f(x=default):\n return x\n",
    "lambda-default": "def f(seed):\n return lambda x=seed: x+seed\n",
    "all-parameters": 'def f(a, /, b=seed, *args, c=other, **kwargs):\n return a+b+c+args[0]+kwargs["x"]\n',
    "global": "x=1\ndef f():\n global x\n x=2\n return x\n",
    "nonlocal": "def f(x):\n def g():\n  nonlocal x\n  x=x+1\n  return x\n return g\n",
    "global-barrier": "def f(x):\n def g():\n  global x\n  def h():\n   return x\n  return h\n return g\n",
    "nonlocal-transitive": "def f(x):\n def g():\n  def h():\n   nonlocal x\n   return x\n  return h\n return g\n",
    "missing-nonlocal": "def f():\n nonlocal absent\n",
    "module-nonlocal": "nonlocal x\n",
    "global-after-use": "def f():\n print(x)\n global x\n",
    "global-after-assignment": "def f():\n x=1\n global x\n",
    "nonlocal-after-use": "def f(x):\n def g():\n  print(x)\n  nonlocal x\n",
    "nonlocal-after-assignment": "def f(x):\n def g():\n  x=1\n  nonlocal x\n",
    "global-parameter": "def f(x):\n global x\n",
    "nonlocal-parameter": "def f(x):\n nonlocal x\n",
    "conflicting-directives": "def f():\n global x\n nonlocal x\n",
    "duplicate-argument": "def f(x,x):\n pass\n",
    "repeated-global": "def f():\n global x\n x=1\n global x\n",
    "imports": "import os.path\nimport other as alias\nfrom stuff import member as named\ndef f():\n return os,alias,named\n",
    "nested-import": "def f():\n import math\n def g():\n  return math\n return g\n",
    "if-for": "def f(xs):\n for x in xs:\n  if x:\n   y=x\n return y\n",
    "displays": "def f(x,y):\n return (x,[y],{x:y},{x,y})\n",
    "operators": "def f(x,y):\n return not x or x < y < end and -y\n",
    "attributes-calls": "def f(obj,x):\n return obj.method(x, opt=y, **kw)[index]\n",
    "generator-first-iter": "def f(xs):\n return (x for x in xs)\n",
    "generator-free": "def f(xs,offset):\n return (x+offset for x in xs if test(x))\n",
    "generator-clauses": "def f(xs):\n return (x+y for x in xs for y in x if y)\n",
    "generator-target-shadow": "def f(x):\n return (x for x in x)\n",
    "generator-unpack": "def f(xs):\n return (x+y for x,y in xs)\n",
    "generator-nested": "def f(xs):\n return ((y for y in x) for x in xs)\n",
    "walrus-function": "def f():\n return (x := value)\n",
    "walrus-generator": "def f(xs):\n return ((saved := x) for x in xs)\n",
    "walrus-module-generator": "g = ((saved := x) for x in xs)\n",
    "walrus-first-iter": "def f(xs):\n return (x for x in (saved := xs))\n",
    "walrus-second-iter": "def f(xs):\n return (x for x in xs for y in (saved := xs))\n",
    "walrus-target": "def f(xs):\n return ((x := 1) for x in xs)\n",
    "walrus-later-target": "def f(xs):\n return ((y := x) for x in xs for y in x)\n",
    "walrus-if-later-target": "def f(xs):\n return (x for x in xs if (y := x) for y in xs)\n",
}
# Deterministic structural variations exercise closures and traversal without fixtures
# that encode results into either implementation.
for i in range(40):
    CASES[f"variation/{i}"] = (
        f"def outer_{i}(xs, seed):\n"
        f" local_{i}=seed\n"
        f" def inner_{i}(arg=seed, *, option=local_{i}):\n"
        f"  return (item+arg+option+local_{i} for item in xs if item > {i})\n"
        f" return inner_{i}\n"
    )


def program(count):
    return "\n".join(CASES[f"variation/{i%40}"].replace(f"outer_{i%40}", f"outer_{i}") for i in range(count))


BENCHMARKS = {"small": CASES["closure"], "medium": program(40), "large": program(400)}
