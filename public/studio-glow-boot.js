/**
 * Minimal GLOW embed bootstrap for the Luminode Studio background.
 * Injected into /glow/index.html when served through Vite.
 */
const params = new URLSearchParams(window.location.search);
if (params.get("embed") === "1") {
  bootEmbed().catch((error) => {
    console.error("[luminode] glow background failed", error);
  });
}

function emptyMidiPortMap() {
  const map = new Map();
  return {
    size: 0,
    get: (id) => map.get(id),
    has: (id) => map.has(id),
    keys: () => map.keys(),
    values: () => map.values(),
    entries: () => map.entries(),
    forEach: (...args) => map.forEach(...args),
    [Symbol.iterator]: () => map[Symbol.iterator](),
  };
}

function stubMidiAccess() {
  // Background scenes use internal generators — never prompt for MIDI.
  const fakeAccess = {
    inputs: emptyMidiPortMap(),
    outputs: emptyMidiPortMap(),
    sysexEnabled: false,
    onstatechange: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  };

  try {
    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      writable: true,
      value: async () => fakeAccess,
    });
  } catch {
    navigator.requestMIDIAccess = async () => fakeAccess;
  }
}

function hideChrome() {
  document.documentElement.classList.add("glow-embed");

  if (document.getElementById("luminode-glow-embed-style")) return;

  const style = document.createElement("style");
  style.id = "luminode-glow-embed-style";
  style.textContent = `
    html.glow-embed,
    html.glow-embed body {
      margin: 0 !important;
      overflow: hidden !important;
      background: #000 !important;
      cursor: none !important;
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
    html.glow-embed #canvasMessage,
    html.glow-embed #infoModal,
    html.glow-embed #saveDialog,
    html.glow-embed #createSetDialog,
    html.glow-embed #filePickerDialog,
    html.glow-embed #luminodePickerDialog,
    html.glow-embed #sidePanel,
    html.glow-embed .side-panel,
    html.glow-embed .mixer-panel,
    html.glow-embed .tp-dfwv {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      opacity: 0 !important;
    }
    html.glow-embed #canvas,
    html.glow-embed canvas {
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
    }
  `;
  document.head.appendChild(style);

  const logo = document.getElementById("logoContainer");
  if (logo) logo.style.display = "none";
}

function waitForVisualizer(timeoutMs = 20000) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const visualizer = window.glowVisualizer;
      if (visualizer?.projectManager && visualizer?.uiManager) {
        resolve(visualizer);
        return;
      }
      if (performance.now() - start > timeoutMs) {
        reject(new Error("GLOW visualizer did not boot in time"));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

async function resolveSceneUrl() {
  const forced = params.get("scene");
  if (forced) return forced;

  const file = "ramieles-dibujantes copy.glow";
  console.info("[luminode] background scene:", file);
  return `/glow-scenes/${encodeURIComponent(file).replace(/%2F/gi, "/")}`;
}

async function bootEmbed() {
  stubMidiAccess();
  hideChrome();

  // Avoid SW fighting Vite routes inside the embed iframe.
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  const sceneUrl = await resolveSceneUrl();
  const visualizer = await waitForVisualizer();

  // Let GLOW finish initialize() without waiting on real MIDI.
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  hideChrome();

  if (!visualizer.visualizerStarted) {
    try {
      await visualizer.start();
    } catch (error) {
      console.warn("[luminode] visualizer.start() warning", error);
    }
  }

  hideChrome();

  const response = await fetch(sceneUrl);
  if (!response.ok) {
    throw new Error(`Failed to load scene: ${response.status} ${sceneUrl}`);
  }

  const projectData = await response.json();
  visualizer.clearCurrentState?.();
  const loaded = await visualizer.projectManager.loadProjectState(projectData);
  if (!loaded) {
    throw new Error("GLOW rejected the background scene");
  }

  hideChrome();
  visualizer.uiManager?.hideLogoContainer?.();
  visualizer.uiManager?.hideStartButton?.();
  document.documentElement.classList.add("glow-embed-ready");
  console.info("[luminode] glow background ready");
}
