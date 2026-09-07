Downloading saree-tryon from Cloudflare
======================================

Why `wrangler init --from-dash` failed
--------------------------------------
Your worker uses Static Assets (HTML/JS/CSS files). Wrangler blocks full download
when a worker has an ASSETS binding.

Download scripts
----------------
  node download-worker.mjs      # worker script + wrangler.jsonc
  node mirror-assets.mjs        # Next.js static chunks + HTML pages
  node mirror-extra-assets.mjs  # models, textures, UI images

Output layout
-------------
  downloaded/
  ├── src/worker.js
  ├── wrangler.jsonc
  └── public/
      ├── index.html
      ├── classic.html
      ├── _next/static/...
      ├── models/
      ├── textures/
      └── ui/

Run locally (requires wrangler)
-------------------------------
  cd downloaded
  npx wrangler dev

Note: This is the compiled bundle, not editable TypeScript source.
Original source was at: /Users/nikunjmavani/Desktop/Project/saree-tryon/
