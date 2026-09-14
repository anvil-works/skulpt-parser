require(process.argv[2]);
const cases = {
    barePrint: "print\n",
    binaryLong: "x = 0b101L\n",
    octalLong: "x = 0755L\n",
    exceptList: "try:\n pass\nexcept Exception, [a, b]:\n pass\n",
    exceptAttribute: "try:\n pass\nexcept Exception, obj.error:\n pass\n",
    exceptSubscript: "try:\n pass\nexcept Exception, errors[0]:\n pass\n",
    neq: "x = 1 <> 2\n",
    octal: "x = 0755\n",
    long: "x = 123L\n",
    hexlong: "x = 0xffL\n",
    lowerlong: "x = 123l\n",
    print: "print 1, 2\n",
    printComma: "print 1,\n",
    printRedirect: "print >>f, 1\n",
    printRedirectComma: "print >>f, 1,\n",
    exceptComma: "try:\n pass\nexcept Exception, e:\n pass\n",
    exceptTuple: "try:\n pass\nexcept Exception, (a, b):\n pass\n",
    raiseTwo: 'raise ValueError, "oops"\n',
    raiseThree: 'raise ValueError, "oops", tb\n',
    exec: "exec code\n",
    execIn: "exec code in g, l\n",
    backticks: "x = `value`\n",
    tupleParam: "def f((a,b)):\n pass\n",
    tupleLambda: "f = lambda (a,b): a\n",
    ur: 'x = ur"abc"\n',
    ru: 'x = ru"abc"\n',
    u: 'x = u"abc"\n',
    asyncName: "async = 1\n",
    awaitName: "await = 1\n",
    printFuture: 'from __future__ import print_function\nprint(1, end="")\n',
};
const rows = [];
for (const [name, source] of Object.entries(cases)) {
    for (const [mode, future] of [
        ["python2", Sk.python2],
        ["python3", Sk.python3],
    ]) {
        Sk.configure({ __future__: { ...future }, output: () => {} });
        const row = { name, mode, source };
        try {
            const parsed = Sk.parse("probe.py", source);
            row.parse = "ok";
            const ast = Sk.astFromParse(parsed.cst, "probe.py", parsed.flags);
            row.ast = "ok";
            Sk.compile(source, "probe.py", "exec", false);
            row.compile = "ok";
        } catch (e) {
            row.error = String(e);
        }
        rows.push(row);
    }
}
process.stdout.write(JSON.stringify(rows, null, 2));
