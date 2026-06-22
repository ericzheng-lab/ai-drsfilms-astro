# ai-drsfilms-astro

Eric Zheng portfolio — Film Producer · AI Builder.

Astro 4 static site. Cinematic dark aesthetic with a point-cloud hero (Three.js) that morphs between five forms: LENS, APERTURE, REEL, SIGNAL, NETWORK.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs static site to `dist/`. Deploy to Cloudflare Pages or any static host.

## Structure

- `src/pages/index.astro` — single page entry
- `src/layouts/Base.astro` — HTML shell + Google Fonts + importmap
- `src/components/` — section components (Hero, TrackRecord, WhatIBuilt, Films, ToolStack, EzOS, Contact, Nav)
- `src/styles/global.css` — design system tokens + base styles
- `public/hero-cloud.module.js` — Three.js point-cloud hero (vanilla ES module, loaded via importmap)

## Stack

Astro 4 · vanilla CSS · Three.js (via CDN importmap, zero bundler config).
