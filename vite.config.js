import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";

const root = path.dirname(fileURLToPath(import.meta.url));
const glowRoot = path.join(root, "glow");
const scenesRoot = path.join(root, "glow-scenes");
const EMBED_BOOT = "/studio-glow-boot.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".glow": "application/json",
  ".map": "application/json",
  ".wasm": "application/wasm",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function listGlowScenes() {
  if (!fs.existsSync(scenesRoot)) return [];
  return fs
    .readdirSync(scenesRoot)
    .filter((name) => name.toLowerCase().endsWith(".glow"))
    .sort((a, b) => a.localeCompare(b));
}

function scenesIndexJson() {
  return `${JSON.stringify({ scenes: listGlowScenes() }, null, 2)}\n`;
}

function resolveGlowPath(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  const rel = clean.replace(/^\/glow\/?/, "") || "index.html";
  const resolved = path.resolve(glowRoot, rel);
  if (!resolved.startsWith(glowRoot)) return null;
  return resolved;
}

function resolveScenePath(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (clean === "/glow-scenes" || clean === "/glow-scenes/") {
    return { kind: "index" };
  }
  if (clean === "/glow-scenes/index.json") {
    return { kind: "index" };
  }
  const rel = clean.replace(/^\/glow-scenes\/?/, "");
  if (!rel || rel.includes("..")) return null;
  const resolved = path.resolve(scenesRoot, rel);
  if (!resolved.startsWith(scenesRoot)) return null;
  return { kind: "file", path: resolved };
}

function injectEmbedBoot(html) {
  const early = `
    <script data-luminode-embed-boot>
      (function () {
        try {
          if (new URLSearchParams(location.search).get("embed") !== "1") return;
          document.documentElement.classList.add("glow-embed");
          var empty = function () {
            var m = new Map();
            return {
              size: 0,
              get: function (id) { return m.get(id); },
              has: function (id) { return m.has(id); },
              keys: function () { return m.keys(); },
              values: function () { return m.values(); },
              entries: function () { return m.entries(); },
              forEach: function () { return m.forEach.apply(m, arguments); },
              [Symbol.iterator]: function () { return m[Symbol.iterator](); }
            };
          };
          var access = {
            inputs: empty(),
            outputs: empty(),
            sysexEnabled: false,
            onstatechange: null,
            addEventListener: function () {},
            removeEventListener: function () {},
            dispatchEvent: function () { return false; }
          };
          Object.defineProperty(navigator, "requestMIDIAccess", {
            configurable: true,
            writable: true,
            value: function () { return Promise.resolve(access); }
          });
        } catch (_) {}
      })();
    </script>
    <style data-luminode-embed-boot>
      html.glow-embed,
      html.glow-embed body {
        margin: 0 !important;
        background: #000 !important;
        overflow: hidden !important;
      }
      html.glow-embed #logoContainer,
      html.glow-embed glow-logo,
      html.glow-embed #projectNameDisplay,
      html.glow-embed #panelToggleButton,
      html.glow-embed #mixerButton,
      html.glow-embed #detachButton,
      html.glow-embed #openButton,
      html.glow-embed #saveButton,
      html.glow-embed #labButton,
      html.glow-embed #infoButton,
      html.glow-embed #canvasMessage {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      html.glow-embed #canvas,
      html.glow-embed canvas {
        opacity: 1 !important;
        visibility: visible !important;
      }
    </style>`;

  let next = html;
  if (!next.includes("data-luminode-embed-boot")) {
    if (next.includes("<head>")) {
      next = next.replace("<head>", `<head>${early}`);
    } else {
      next = early + next;
    }
  }

  if (!next.includes("studio-glow-boot.js")) {
    if (next.includes("</body>")) {
      next = next.replace(
        "</body>",
        `    <script type="module" src="${EMBED_BOOT}"></script>\n</body>`,
      );
    } else {
      next = `${next}\n<script type="module" src="${EMBED_BOOT}"></script>\n`;
    }
  }

  return next;
}

function safePipe(filePath, res) {
  return pipeline(createReadStream(filePath), res).catch((error) => {
    if (
      error?.code === "ERR_STREAM_PREMATURE_CLOSE" ||
      error?.code === "ECONNRESET" ||
      error?.code === "EPIPE"
    ) {
      return;
    }
    throw error;
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "vendor"
    ) {
      continue;
    }
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

export default defineConfig({
  appType: "spa",
  plugins: [
    {
      name: "glow-background",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathOnly = (req.url || "").split("?")[0];

          if (pathOnly === "/glow-scenes" || pathOnly.startsWith("/glow-scenes/")) {
            const target = resolveScenePath(req.url);
            if (!target) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }
            if (target.kind === "index") {
              res.setHeader("Content-Type", "application/json");
              res.end(scenesIndexJson());
              return;
            }
            if (!fs.existsSync(target.path) || fs.statSync(target.path).isDirectory()) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }
            res.setHeader("Content-Type", contentType(target.path));
            await safePipe(target.path, res);
            return;
          }

          // Only /glow and /glow/... — not /studio-glow-boot.js
          if (pathOnly !== "/glow" && !pathOnly.startsWith("/glow/")) {
            return next();
          }

          const filePath = resolveGlowPath(req.url);
          if (!filePath || !fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }

          const stat = fs.statSync(filePath);
          const target = stat.isDirectory()
            ? path.join(filePath, "index.html")
            : filePath;

          if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }

          res.setHeader("Content-Type", contentType(target));

          if (path.basename(target) === "index.html") {
            res.end(injectEmbedBoot(fs.readFileSync(target, "utf8")));
            return;
          }

          await safePipe(target, res);
        });
      },
      closeBundle() {
        const outGlow = path.join(root, "dist", "glow");
        copyDir(glowRoot, outGlow);
        const indexPath = path.join(outGlow, "index.html");
        if (fs.existsSync(indexPath)) {
          fs.writeFileSync(
            indexPath,
            injectEmbedBoot(fs.readFileSync(indexPath, "utf8")),
          );
        }

        const outScenes = path.join(root, "dist", "glow-scenes");
        copyDir(scenesRoot, outScenes);
        fs.writeFileSync(path.join(outScenes, "index.json"), scenesIndexJson());
      },
    },
  ],
});
