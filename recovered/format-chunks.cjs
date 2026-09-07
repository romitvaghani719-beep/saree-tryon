// Format the recovered minified chunks with prettier
const prettier = require("prettier");
const fs = require("node:fs");
const path = require("node:path");

const base = "d:/Project/saree-drape/saree-tryon";
const jobs = [
  ["downloaded/public/_next/static/chunks/app/page-5e1485b2c56f7fae.js", "babel", "recovered/studio-page.beauty.js"],
  ["downloaded/public/_next/static/chunks/app/classic/page-a568b73a6d9891bf.js", "babel", "recovered/classic-page.beauty.js"],
  ["downloaded/public/_next/static/chunks/956-c03bab45e31bab11.js", "babel", "recovered/shared-956.beauty.js"],
  ["downloaded/public/_next/static/css/e78a6808553ccd46.css", "css", "recovered/globals.beauty.css"],
  ["downloaded/public/_next/static/css/6ce055a36e2f74d5.css", "css", "recovered/classic-module.beauty.css"],
];

(async () => {
  for (const [src, parser, out] of jobs) {
    const code = fs.readFileSync(path.join(base, src), "utf8");
    const formatted = await prettier.format(code, { parser, printWidth: 110, tabWidth: 2, semi: true });
    fs.writeFileSync(path.join(base, out), formatted, "utf8");
    console.log(`${out}: ${formatted.length} chars`);
  }
})();
