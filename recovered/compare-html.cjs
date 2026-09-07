// Compare freshly prerendered HTML against the original recovered HTML.
const fs = require("node:fs");
const B = "d:/Project/saree-drape/saree-tryon";

for (const name of ["classic", "index"]) {
  const orig = fs.readFileSync(`${B}/downloaded/public/${name}.html`, "utf8");
  const neu = fs.readFileSync(`${B}/.next/server/app/${name}.html`, "utf8");
  const bodyOf = (s) => {
    const m = /<body>([\s\S]*?)<script/.exec(s);
    return m ? m[1] : "(no body match)";
  };
  const ob = bodyOf(orig).replace(/></g, ">\n<");
  const nb = bodyOf(neu).replace(/></g, ">\n<");
  console.log(`=== ${name} ===`);
  console.log("--- ORIGINAL body ---");
  console.log(ob);
  console.log("--- NEW body ---");
  console.log(nb);
  console.log();
}
