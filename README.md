# Saree Try On

Normal Next.js + OpenNext project layout (not the Cloudflare worker bundle).

## Source code — RESTORED ✅

The original `.tsx` sources were lost (Cloudflare only stored the compiled
worker), but the app has been **reconstructed** from the compiled production
bundle that was recovered in `downloaded/`:

- `downloaded/public/_next/static/chunks/app/page-5e1485b2c56f7fae.js` →
  `components/Studio.tsx` (webpack module 4900), rewritten as typed TypeScript
- `downloaded/public/_next/static/chunks/app/classic/page-a568b73a6d9891bf.js` →
  `components/SareeTryOn.js` (webpack module 1962)
- `downloaded/public/_next/static/chunks/956-c03bab45e31bab11.js` →
  `lib/config.js` (7877), `lib/templates.js` (4586), `lib/engine.js` (6072),
  `lib/image.js` (1894)
- `downloaded/public/_next/static/css/e78a6808553ccd46.css` → `app/globals.css`
- `downloaded/public/_next/static/css/6ce055a36e2f74d5.css` →
  `components/SareeTryOn.css`
- `downloaded/public/meshes.json` → `public/meshes.json`

The rebuilt pages' prerendered HTML is byte-identical to the original
(`downloaded/public/index.html` / `classic.html`), confirming fidelity.
`recovered/` holds the extraction scripts and beautified chunks used for this.

Notes:

- `components/Studio.tsx` has been converted back to readable, typed source:
  real names, JSDoc on the detection passes, and domain types in `lib/types.ts`.
  The compiled form it came from is kept at `recovered/Studio.compiled.js`.
- `components/SareeTryOn.js` is still the compiled (minified-variable) form —
  it runs identically; convert it the same way when it needs editing.
- The `lib/*.js` modules still use their minified export names, but each has a
  typed `.d.ts` facade beside it, so callers get real types.
- The sample buttons point at `/samples/*`, which was never mirrored from the
  deployment; those three buttons 404 until the files are added.
- `public/fonts/comicz.ttf` was never recovered; the classic page falls back to
  Comic Sans MS. Drop the file into `public/fonts/` to restore the font.

## Folder structure

```
saree-tryon/
├── app/                    ← Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx            ← renders <Studio/>
│   ├── globals.css
│   ├── classic/page.tsx    ← renders <SareeTryOn/> in .godot-root
│   └── api/export/route.ts ← POST {name,dataUrl} → saves PNG to public/exports
├── components/
│   ├── Studio.tsx          ← main studio experience (client, typed)
│   ├── SareeTryOn.js       ← classic editor (client, still compiled form)
│   └── SareeTryOn.css
├── lib/
│   ├── types.ts            ← shared domain types
│   ├── *.d.ts              ← typed facades over the recovered .js modules
│   ├── config.js           ← models/textures/sliders/layout constants
│   ├── engine.js           ← WebGL2 drape engine + background renderer
│   ├── templates.js        ← studio plate template loading + region uniforms
│   └── image.js            ← trim/straighten/encode image utilities
├── public/                 ← models, textures, templates, ui, meshes.json
├── wrangler.jsonc
├── open-next.config.ts
└── downloaded/             ← original Cloudflare export (recovery source)
```

## Commands

```bash
npm install
npm run dev          # local Next.js dev server
npm run build        # production build
npm run deploy       # build + deploy to Cloudflare Workers
```

Live URL: https://saree-tryon.gemini-logo-remover.workers.dev

