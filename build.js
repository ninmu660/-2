const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "public");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, "src"), { recursive: true });
fs.mkdirSync(path.join(output, "data"), { recursive: true });

for (const file of ["index.html", "src/styles.css", "src/app.js", "data/movies.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
