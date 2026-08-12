// Screenshots every dist/<name>/ into dist/_previews/ — the thumbnails the
// landing page is built from (src/home/, see ../build-home.sh).
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
//   SKIP_SHOTS   "1" to skip screenshotting entirely (keep existing previews)
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
// Keep in sync with the card aspect-ratio in src/home/style.css.
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
