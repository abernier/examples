// Screenshots every dist/<name>/ and writes the dist/index.html landing page.
// Run by .github/workflows/deploy.yml inside the Playwright container image.
//
//   node .github/preview.mjs
//
// It serves dist/ under /examples/ itself — the same layout as Pages — so
// projects built with an absolute base render exactly as they will in production.
//
// Env:
//   PW_CHANNEL   Playwright browser channel, e.g. "chrome" to use a local Chrome
//                instead of the bundled chromium (handy outside the container)
//   SKIP_SHOTS   "1" to only regenerate index.html from existing previews

import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readdir, mkdir, writeFile, access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const SHOT_DIR = "dist/_previews";
const MOUNT = "/examples"; // must match the GitHub Pages base path
const VIEWPORT = { width: 1280, height: 800 };
const SETTLE_MS = 2500; // let fonts, hero animations and 3D scenes land

const exists = (p) => access(p).then(() => true, () => false);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".hdr": "image/vnd.radiance",
  ".exr": "image/x-exr",
};

// Minimal static server for dist/, mounted at /examples/ like on Pages.
function serve() {
  const root = path.resolve("dist");
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.startsWith(`${MOUNT}/`)) {
        res.writeHead(404).end("not found");
        return;
      }
      let file = path.join(root, decodeURIComponent(url.pathname.slice(MOUNT.length)));
      if (!file.startsWith(root)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

const names = (await readdir("dist", { withFileTypes: true }))
  .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
  .map((e) => e.name)
  .sort();

if (!names.length) console.warn("no dist/* folders found");

if (process.env.SKIP_SHOTS !== "1" && names.length) {
  // require(), not import(): in the Playwright container image the package is
  // installed globally and only CJS resolution honours NODE_PATH.
  const { chromium } = createRequire(import.meta.url)("playwright");
  await mkdir(SHOT_DIR, { recursive: true });

  const { server, port } = await serve();
  const origin = `http://127.0.0.1:${port}${MOUNT}`;

  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  for (const name of names) {
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/${name}/`, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(SETTLE_MS);
      await page.screenshot({ path: `${SHOT_DIR}/${name}.jpg`, type: "jpeg", quality: 72 });
      console.log(`✓ ${name}`);
    } catch (error) {
      // A broken project shouldn't fail the deploy — it just gets no preview.
      console.log(`✗ ${name} — ${error.message.split("\n")[0]}`);
    }
    await page.close();
  }

  await browser.close();
  server.close();
}

// --- index.html ---------------------------------------------------------------

if (await exists("dist/index.html")) {
  console.log("dist/index.html is committed — keeping it");
  process.exit(0);
}

const cards = await Promise.all(
  names.map(async (name) => {
    const shot = (await exists(`${SHOT_DIR}/${name}.jpg`))
      ? `<img src="_previews/${name}.jpg" alt="" loading="lazy" width="${VIEWPORT.width}" height="${VIEWPORT.height}" />`
      : `<span class="noshot">no preview</span>`;
    return `        <li>
          <a href="${name}/">
            <span class="shot">${shot}</span>
            <span class="name">${name}</span>
          </a>
        </li>`;
  })
);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>examples</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0c0c0c;
        --fg: #fafafa;
        --card: #171717;
        --muted: #a1a1a1;
        --border: #ffffff1a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: clamp(1.5rem, 5vw, 4rem);
        background: var(--bg);
        color: var(--fg);
        font: 400 14px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      header { max-width: 72rem; margin: 0 auto 2rem; }
      h1 { margin: 0; font-size: 1.125rem; font-weight: 600; letter-spacing: -0.01em; }
      header p { margin: 0.25rem 0 0; color: var(--muted); }
      ul {
        list-style: none;
        max-width: 72rem;
        margin: 0 auto;
        padding: 0;
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
      }
      a { display: block; color: inherit; text-decoration: none; }
      .shot {
        display: grid;
        place-items: center;
        aspect-ratio: ${VIEWPORT.width} / ${VIEWPORT.height};
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--card);
        transition: border-color 0.15s, transform 0.15s;
      }
      .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .noshot { color: var(--muted); font-size: 0.8125rem; }
      a:hover .shot { border-color: #ffffff40; transform: translateY(-2px); }
      .name { display: block; margin-top: 0.625rem; font-weight: 500; }
      .empty { color: var(--muted); }
    </style>
  </head>
  <body>
    <header>
      <h1>examples</h1>
      <p>Static builds, served from this repo.</p>
    </header>
    <ul>
${cards.join("\n") || '        <li class="empty">no examples yet</li>'}
    </ul>
  </body>
</html>
`;

await writeFile("dist/index.html", html);
console.log(`wrote dist/index.html — ${names.length} example(s)`);
