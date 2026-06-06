const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "public");
const requiredFiles = ["index.html", "src/styles.css", "src/app.js", "data/movies.js"];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));

if (missingFiles.length > 0) {
  console.error("Vercel build is missing required source files:");
  for (const file of missingFiles) {
    console.error(`- ${file}`);
  }
  console.error("");
  console.error("Make sure these files are committed and pushed to GitHub.");
  process.exit(1);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, "src"), { recursive: true });
fs.mkdirSync(path.join(output, "data"), { recursive: true });

for (const file of requiredFiles) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

console.log("Static site copied to public/");
