// Extracts the original app modules from the beautified webpack chunks and
// converts them into standalone ES modules.
const fs = require("node:fs");
const path = require("node:path");

const BASE = "d:/Project/saree-drape/saree-tryon";
const read = (p) => fs.readFileSync(path.join(BASE, p), "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(BASE, p)), { recursive: true });
  fs.writeFileSync(path.join(BASE, p), s, "utf8");
  console.log("wrote", p, `(${s.length} chars)`);
};

// Extract a webpack module factory body by brace counting.
function extractModule(chunk, id) {
  const startRe = new RegExp(`\\n    ${id}: \\(([\\w$, ]*)\\) => \\{`);
  const m = startRe.exec(chunk);
  if (!m) throw new Error(`module ${id} not found`);
  let i = chunk.indexOf("{", m.index + m[0].length - 1);
  let depth = 0;
  for (let j = i; j < chunk.length; j++) {
    const c = chunk[j];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const body = chunk.slice(i + 1, j);
        return { body };
      }
    }
  }
  throw new Error(`module ${id}: unterminated`);
}

// Parse the webpack export definition:  n.d(e, { Name: () => local, ... });
function parseExports(body) {
  const re = /^\s*[\w$]\.d\(\s*[\w$],\s*\{([\s\S]*?)\}\);\s*$/gm;
  let m, pairs = [], matched = "";
  while ((m = re.exec(body))) {
    const pairRe = /([\w$]+):\s*\(\)\s*=>\s*([\w$]+)/g;
    let p;
    const local = [];
    while ((p = pairRe.exec(m[1]))) local.push([p[1], p[2]]);
    if (local.length) {
      pairs = local;
      matched = m[0];
    }
  }
  return { pairs, matched };
}

// Replace `var a = l(5155), n = l(2115), ...;` style webpack requires with ES imports.
function replaceImports(body, outFile) {
  const libRel = (name) =>
    outFile.startsWith("components/") ? `../lib/${name}.js` : `./${name}.js`;
  const MODULE_MAP = {
    5155: "react/jsx-runtime",
    2115: "react",
    63: "next/navigation",
    7877: libRel("config"),
    6072: libRel("engine"),
    4586: libRel("templates"),
    1894: libRel("image"),
    8291: null, // side-effect css import (page css) — dropped
  };
  const declRe = /var\s+([\w$]+)\s*=\s*[\w$]\((\d+)\)((?:\s*,\s*[\w$]+\s*=\s*[\w$]\(\d+\))*)\s*;/g;
  const out = [];
  let result = body.replace(declRe, (full, first, id1, rest) => {
    const pairs = [[first, id1]];
    const restRe = /([\w$]+)\s*=\s*[\w$]\((\d+)\)/g;
    let r;
    while ((r = restRe.exec(rest))) pairs.push([r[1], r[2]]);
    const stmts = [];
    for (const [varName, idStr] of pairs) {
      const id = Number(idStr);
      const spec = MODULE_MAP[id];
      if (spec === undefined) throw new Error(`unknown module import ${id} in ${outFile}`);
      if (spec === null) continue; // css import dropped
      stmts.push(`import * as ${varName} from "${spec}";`);
    }
    out.push(stmts.join("\n"));
    return `/*__IMPORTS_${out.length - 1}__*/`;
  });
  // drop bare side-effect requires like `a(8291);`
  result = result.replace(/^\s*[\w$]\(\d+\);\s*$/gm, "");
  // splice generated imports back in, in place
  result = result.replace(/\/\*__IMPORTS_(\d+)__\*\//g, (_, n) => out[Number(n)]);
  return result;
}

function dedent6(s) {
  return s
    .split("\n")
    .map((line) => (line.startsWith("      ") ? line.slice(6) : line))
    .join("\n");
}

function convert(chunkFile, id, outFile, header) {
  const chunk = read(chunkFile);
  const { body } = extractModule(chunk, id);
  let code = dedent6(body);
  code = code.replace(/^\s*"use strict";\s*$/gm, "");
  const { pairs, matched } = parseExports(code);
  if (!pairs.length) throw new Error(`module ${id}: no export map found`);
  code = code.replace(matched, "");
  code = replaceImports(code, outFile);
  code = code.replace(/\n{3,}/g, "\n\n").trimEnd();
  const exportStmt =
    "export { " +
    pairs.map(([name, local]) => (name === local ? local : `${local} as ${name}`)).join(", ") +
    " };\n";
  write(outFile, `${header}\n${code}\n\n${exportStmt}`);
}

convert(
  "recovered/shared-956.beauty.js",
  7877,
  "lib/config.js",
  `// lib/config.js — recovered from the compiled production bundle
// (downloaded/public/_next/static/chunks/956-c03bab45e31bab11.js, webpack module 7877).
// Export names are the original minified ones so the recovered components keep working:
//   L6   models[]        { id, cutout, bw, thumb, gradientShadow, gradientHighlights, defaults }
//   XT   textures[]      { id, src, thumb, defaults: number[8], extra? }
//   dU   slider layout[] { label, param, top, height, min, max, step, initial }
//   Jp   default params  { Brightness, Saturate, ... }
//   Rm   zipDefaults(number[8]) -> params object
//   TM   model thumb frames, fi model cards, LY texture grid, SH selection frame
//   g5/JX slider x/width, n6 viewport, _P camera, Rc gradient-bar style`
);

convert(
  "recovered/shared-956.beauty.js",
  4586,
  "lib/templates.js",
  `// lib/templates.js — recovered from the compiled production bundle (module 4586).
//   Yz(id)                 -> promise of a studio template descriptor (template.json + fix.json)
//   SC(tpl, fix, defaults) -> per-region uniform arrays for the engine
//   xn                     max region count used by the shaders`
);

convert(
  "recovered/shared-956.beauty.js",
  6072,
  "lib/engine.js",
  `// lib/engine.js — recovered from the compiled production bundle (module 6072).
//   m DrapeEngine — WebGL2 saree draping renderer (new m(canvas, scale))
//   c Background  — animated gradient background renderer (.ready/.render/.canvas)`
);

convert(
  "recovered/shared-956.beauty.js",
  1894,
  "lib/image.js",
  `// lib/image.js — recovered from the compiled production bundle (module 1894).
//   ZL(file, max?)         File/Blob -> ImageData (downscaled)
//   nL(imageData, q?)      ImageData -> object-URL jpeg for <img>/thumbs
//   Fu(imageData, opts)    auto-trim/straighten -> { image, report }
//   q0(prepared, autoTrim) human readable status note`
);

convert(
  "recovered/studio-page.beauty.js",
  4900,
  "components/Studio.js",
  `// components/Studio.js — recovered from the compiled production bundle
// (downloaded/public/_next/static/chunks/app/page-5e1485b2c56f7fae.js, webpack module 4900).
// Compiled form of the original components/Studio.tsx ("use client" component).`
);

convert(
  "recovered/classic-page.beauty.js",
  1962,
  "components/SareeTryOn.js",
  `// components/SareeTryOn.js — recovered from the compiled production bundle
// (downloaded/public/_next/static/chunks/app/classic/page-a568b73a6d9891bf.js, webpack module 1962).
// Compiled form of the original components/SareeTryOn.tsx ("use client" component).
// The original module also imported its stylesheet (webpack module 8291) — kept as
// components/SareeTryOn.css, imported by app/classic/page.tsx.`
);

// The two components need the "use client" directive at the top.
for (const f of ["components/Studio.js", "components/SareeTryOn.js"]) {
  const p = path.join(BASE, f);
  const src = fs.readFileSync(p, "utf8");
  fs.writeFileSync(p, `"use client";\n\n` + src, "utf8");
  console.log("added use client to", f);
}

console.log("done");

