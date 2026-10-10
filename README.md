# Luminode Studio

The studio website and the desktop host live in this repository.

- The website at the root is the public shelf: diskettes for the instruments, minidiscs for the music. `npm install` and `npm run dev` only install and run that site, so the Netlify build stays the same.
- `host/` is the desktop app. It opens this website and, when a diskette is started, launches the instrument instead of leaving the shelf.

## Website

```sh
npm install
npm run dev
```

## Host

The host is a separate package so Electron is not installed with the website.

The host needs Node 22 or newer. The website can stay on the Node version it already uses.

```sh
npm run host:install
npm run host
```

The shelf runs from this repo. Starting a diskette opens the local project when it exists beside this repository (`../lente`, `../glow`, `../resonant-torus` for MUSGO). Otherwise it opens the public site in its own window. Music diskettes open Bandcamp outside the host. Inside the host the shelf is a still page: the GLOW scene that plays behind the website is not loaded.

**Output → Send to Syphon** (Cmd+Shift+P; Spout on Windows) publishes the focused instrument through [electron-texture-bridge](https://github.com/naporin0624/electron-texture-bridge). The host sends only the program canvas, not the operator window: it loads the `output` page declared in the app's `luminode.app.json` offscreen and follows its size. An app without an output page cannot be published. Closing the instrument stops the stream.

```sh
npm run host:test
```

### Building the app

```sh
npm run build                 # the website, into dist/
npm --prefix host run dist:mac
```

The build lands in `host/release/` as `Luminode Studio-<version>-arm64.dmg` and a zip. It contains the built shelf, a copy of LENTES (taken from `../lente`, or from `LENTES_DIR`), and Syphon.framework. The icon is generated from `public/favicon.png`.

The packaged app bundles only LENTES, the instrument whose Syphon output works today. GLOW, MUSGO and the other diskettes open their public sites. Set `LUMINODE_PROJECTS` to a folder of checkouts to run local copies instead; a checkout there takes priority over the bundled LENTES. The project videos are not bundled; the app loads them from `https://luminode.studio` (set `LUMINODE_SITE` to change this).

The mac build is ad-hoc signed and not notarized. The first time you open it, right-click the app and choose Open. Build the Windows installer on Windows with `npm --prefix host run dist:win`.
