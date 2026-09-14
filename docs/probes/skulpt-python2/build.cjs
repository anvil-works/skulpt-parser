const root = require("node:path").resolve(process.argv[2]);
const webpack = require(root + "/node_modules/webpack");
webpack(
    {
        mode: "development",
        context: root,
        entry: root + "/src/main.js",
        output: { path: require("node:path").resolve(process.argv[3]), filename: "skulpt.js" },
        devtool: false,
        resolve: { alias: { assert: root + "/src/assert-dev.js" } },
        plugins: [
            new webpack.DefinePlugin({
                GITHASH: JSON.stringify("58dc4c59f3daad884a7dc1073961cbdeb0cbc2c6"),
                BUILDDATE: JSON.stringify("audit"),
            }),
        ],
    },
    (err, stats) => {
        if (err || stats.hasErrors()) {
            console.error(err || stats.toString({ all: false, errors: true }));
            process.exitCode = 1;
        } else console.log("Built source probe outside checkout");
    }
);
