// Screenshots every dist/<name>/ and writes the dist/index.html landing page.
// Run by .github/workflows/deploy.yml inside the Playwright container image.
//
//   node .github/preview.mjs
//
// It serves dist/ under /examples/ itself — the same layout as Pages — so
// projects built with an absolute base render exactly as they will in production.
//
// A project is only re-screenshot when its files changed: dist/_previews/manifest.json
// records a content hash per project, and CI restores that folder from cache.
//
// Env:
//   PW_CHANNEL   Playwright browser channel, e.g. "chrome" to use a local Chrome
//                instead of the bundled chromium (handy outside the container)
//   SKIP_SHOTS   "1" to only regenerate index.html from existing previews
//   FORCE_SHOTS  "1" to re-screenshot everything, ignoring the manifest

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readdir, mkdir, writeFile, access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const SHOT_DIR = "dist/_previews";
const MANIFEST = `${SHOT_DIR}/manifest.json`;
const MOUNT = "/examples"; // must match the GitHub Pages base path
const REPO_URL = "https://github.com/abernier/examples";
const VIEWPORT = { width: 1280, height: 800 };
const SETTLE_MS = 2500; // let fonts, hero animations and 3D scenes land

const exists = (p) => access(p).then(() => true, () => false);

// The Playwright container image installs the package globally, which a local
// require() can't see — so fall back to the global root. require() rather than
// import() because playwright ships CJS.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = ["playwright"];
  try {
    candidates.push(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright"));
  } catch {
    // no npm around; the local require is the only chance
  }
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      continue;
    }
  }
  throw new Error(
    `playwright not found (tried ${candidates.join(", ")}) — run inside the ` +
      `mcr.microsoft.com/playwright image, or 'npm i --no-save playwright' locally`
  );
}

// Content hash of a project folder: file paths + bytes, so any change busts it.
async function hashProject(dir) {
  const hash = createHash("sha1");
  const walk = async (current) => {
    const entries = (await readdir(current, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else hash.update(file).update(await readFile(file));
    }
  };
  await walk(dir);
  return hash.digest("hex");
}

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
  await mkdir(SHOT_DIR, { recursive: true });

  const previous = JSON.parse(await readFile(MANIFEST, "utf8").catch(() => "{}"));
  const current = {};
  for (const name of names) current[name] = await hashProject(path.join("dist", name));

  const force = process.env.FORCE_SHOTS === "1";
  const todo = [];
  for (const name of names) {
    const upToDate =
      !force && previous[name] === current[name] && (await exists(`${SHOT_DIR}/${name}.jpg`));
    if (upToDate) console.log(`· ${name} (unchanged)`);
    else todo.push(name);
  }

  if (todo.length) {
    const { chromium } = loadPlaywright();
    const { server, port } = await serve();
    const origin = `http://127.0.0.1:${port}${MOUNT}`;

    const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

    for (const name of todo) {
      const page = await context.newPage();
      try {
        await page.goto(`${origin}/${name}/`, { waitUntil: "load", timeout: 30_000 });
        await page.waitForTimeout(SETTLE_MS);
        await page.screenshot({
          path: `${SHOT_DIR}/${name}.jpg`,
          type: "jpeg",
          quality: 72,
          // Pages that animate forever otherwise keep the capture waiting.
          animations: "disabled",
          timeout: 60_000,
        });
        console.log(`✓ ${name}`);
      } catch (error) {
        // A broken project shouldn't fail the deploy — it just gets no preview,
        // and no manifest entry, so the next run retries it.
        console.log(`✗ ${name} — ${error.message.split("\n")[0]}`);
        delete current[name];
      }
      await page.close();
    }

    await browser.close();
    server.close();
  }

  // Drop entries for projects that no longer exist, then record what we have.
  await writeFile(MANIFEST, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`${todo.length} screenshot(s) taken, ${names.length - todo.length} reused`);
}

// --- index.html ---------------------------------------------------------------

// Tracked, not merely present: the generated one is left over from a previous run.
const indexIsCommitted = (() => {
  try {
    execSync("git ls-files --error-unmatch dist/index.html", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

if (indexIsCommitted) {
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
      header { max-width: 72rem; margin: 0 auto 2.5rem; }
      h1 { margin: 0; font-size: 1.125rem; font-weight: 600; letter-spacing: -0.01em; }
      header p { margin: 0.25rem 0 0; color: var(--muted); }
      .howto {
        margin: 1.25rem 0 0;
        padding: 1rem 1.125rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: var(--card);
        max-width: 44rem;
      }
      .howto p { margin: 0 0 0.625rem; color: var(--muted); }
      .howto code {
        display: block;
        font: 500 13px/1.9 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--fg);
        white-space: pre;
        overflow-x: auto;
      }
      .howto code b { color: #7dd3fc; font-weight: 500; }
      .howto small { display: block; margin-top: 0.75rem; color: var(--muted); }
      .howto small code { display: inline; font-size: 12px; white-space: normal; color: inherit; }
      .howto a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
      /* Fork me on GitHub corner ribbon */
      .ribbon {
        position: fixed;
        top: 3.25rem;
        right: -5.5rem;
        z-index: 10;
        width: 19rem;
        padding: 0.5rem 0;
        transform: rotate(45deg);
        background: var(--fg);
        color: var(--bg);
        text-align: center;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.8125rem;
        box-shadow: 0 2px 12px #0009;
      }
      .ribbon:hover { background: #7dd3fc; }
      @media (max-width: 40rem) { .ribbon { display: none; } }
      ul {
        list-style: none;
        max-width: 72rem;
        margin: 0 auto;
        padding: 0;
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
      }
      ul a { display: block; color: inherit; text-decoration: none; }
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
    <a class="ribbon" href="${REPO_URL}">Fork me on GitHub</a>
    <header>
      <h1>examples</h1>
      <p>A gallery of react-three-fiber landing pages, each generated in one prompt.</p>
      <div class="howto">
        <p>Make your own — fork the repo, open it in Claude Code and run:</p>
        <code>/new-example <b>jewelry boutique</b>
/new-example <b>mix 3+ techniques</b>
/new-example <b>5 usecases in parallel</b></code>
        <small>
          It scaffolds <code>src/&lt;slug&gt;/</code> from real
          <a href="https://github.com/pmndrs/claude-code-plugin">pmndrs</a> demos, builds it,
          and syncs it here. Then open a PR — see the
          <a href="${REPO_URL}#contributing-a-landing-page-with-claude-code">README</a>.
        </small>
      </div>
    </header>
    <ul>
${cards.join("\n") || '        <li class="empty">no examples yet</li>'}
    </ul>
  </body>
</html>
`;

await writeFile("dist/index.html", html);
console.log(`wrote dist/index.html — ${names.length} example(s)`);
