const projects = {
  musgo: {
    index: "LS-001 / SISTEMA GENERATIVO",
    code: "LS-001",
    title: "MUSGO",
    description:
      "Un playground para experimentar con sistemas orgánicos generativos, deformativos y modulables en 3D.",
    detail: [
      "MUSGO (Morfogénesis de Unidades y Sistemas Generativos Orgánicos) explora la generación de organismos de forma procedural usando métodos como las superfórmulas de Gielis y los sistemas de Lindenmayer (L-systems), combinándolos con deformaciones, transformaciones y modulaciones dinámicas. ",
    
    ],
    url: "https://musgo.luminode.studio/",
    repo: "https://github.com/rafaelbecks/musgo",
    videos: [
      "/projects/musgo/videos/musgo-01.mp4",
      "/projects/musgo/videos/musgo-02.mp4",
      "/projects/musgo/videos/musgo-03.mp4",
      "/projects/musgo/videos/musgo-04.mp4",
      "/projects/musgo/videos/musgo-05.mp4",
      "/projects/musgo/videos/musgo-06.mp4",
    ],
  },
  glow: {
    index: "LS-002 / SINTETIZADOR VISUAL",
    code: "LS-002",
    title: "G.L.O.W.",
    description:
      "GLOW es un sintetizador visual open source para componer geometrías de luz en tiempo real.",
    detail:
      "Inspirado en pioneros del arte computacional, busca hacer accesible la composición visual mediante módulos de luz geométricos (Luminodes), moduladores y herramientas interconectadas.",
    url: "https://glow.luminode.studio/",
    repo: "https://github.com/rafaelbecks/glow",
    videos: [
      "/projects/glow/videos/glow-01.mp4",
      "/projects/glow/videos/glow-02.mp4",
      "/projects/glow/videos/glow-03.mp4",
      "/projects/glow/videos/glow-04.mp4",
      "/projects/glow/videos/glow-05.mp4",
      "/projects/glow/videos/glow-06.mp4",
    ],
  },
  intemperie: {
    index: "LS-003 / INSTALACIÓN INTERACTIVA",
    code: "LS-003",
    title: "Topografías de la intemperie",
    description:
      "Topografías de la intemperie es una instalación interactiva que construye territorios imaginarios a partir de memorias espaciales deformadas.",
    detail:
      "Paisajes virtuales navegables donde geografía, sonido, lenguaje e interacción convergen para producir una experiencia perceptiva inestable.",
    url: "https://intemperie.luminode.studio/",
    repo: "https://github.com/rafaelbecks/topografias-intemperie",
    document: {
      href: "/projects/intemperie/topografias-intemperie.pdf",
      label: "documento ↗",
    },
    videos: [
      "/projects/intemperie/videos/exploracion-01.mp4",
      "/projects/intemperie/videos/exploracion-02.mp4",
      "/projects/intemperie/videos/exploracion-03.mp4",
    ],
  },
};

const releases = {
  "in-permanent-sequences": {
    index: "MD-001 / MINIDISC",
    title: "[in]permanent sequences",
    description:
      "a compilation of improvisations, loops, and sequences driven by random sources.",
    url: "https://dormidos.bandcamp.com/album/in-permanent-sequences",
    albumId: "2698472870",
    launchLabel: "bandcamp",
  },
  "na-ves-oscillations": {
    index: "MD-002 / MINIDISC",
    title: "naïves oscillations",
    description: "a naive perspective of sound-shaping with synthesizers.",
    url: "https://dormidos.bandcamp.com/album/na-ves-oscillations",
    albumId: "3400351678",
    launchLabel: "bandcamp",
  },
  "computer-perspective": {
    index: "MD-003 / MINIDISC",
    title: "computer perspective",
    description:
      "“computer perspective” is a compilation of compositions inspired by both technology and nature.",
    url: "https://dormidos.bandcamp.com/album/computer-perspective",
    albumId: "920787767",
    launchLabel: "bandcamp",
  },
  "sonidos-incandescentes": {
    index: "MD-004 / MINIDISC",
    title: "sonidos incandescentes",
    description:
      "sonidos incandescentes es una selección de composiciones inspiradas en poemas de Rafael Cadenas.",
    url: "https://dormidos.bandcamp.com/album/sonidos-incandescentes",
    albumId: "3182473626",
    launchLabel: "bandcamp",
  },
};

const MOVE_MS = 520;
const MOVE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const MD_ASPECT = 863 / 900;
const DISK_ASPECT = 616 / 592;
const MOBILE_MQ = window.matchMedia("(max-width: 760px)");

const body = document.body;
const archive = document.querySelector(".archive");
const music = document.querySelector(".music");
const engineering = document.querySelector(".engineering");
const bootScreen = document.querySelector(".boot-screen");
const aboutModal = document.querySelector("#about-modal");
const projectModal = document.querySelector("#project-modal");
const videoLightbox = document.querySelector("#video-lightbox");
const launchName = document.querySelector(".js-launch-name");
const drive = document.querySelector(".drive");
const driveCode = document.querySelector(".js-drive-code");
const driveTitle = document.querySelector(".js-drive-title");
const driveDescription = document.querySelector(".js-drive-description");
const driveLaunch = document.querySelector(".js-drive-launch");
const driveInfo = document.querySelector(".js-drive-info");
const driveHint = document.querySelector(".js-drive-hint");
const driveDetail = document.querySelector(".js-drive-detail");
const driveLinks = document.querySelector(".js-drive-links");
const driveMedia = document.querySelector(".js-drive-media");
const driveSpacerEl = document.querySelector(".js-drive-spacer");
const lightboxVideo = videoLightbox?.querySelector(".js-video-lightbox-video");
const lightboxIndex = videoLightbox?.querySelector(".js-video-lightbox-index");
const lightboxPrev = videoLightbox?.querySelector(".js-video-lightbox-prev");
const lightboxNext = videoLightbox?.querySelector(".js-video-lightbox-next");

let hasEntered = false;
let isLaunching = false;
let isAnimatingDisk = false;
let activeItemKey = null;
let activeItemKind = null;
let activeDisk = null;
let diskSpacer = null;
let diskHomeParent = null;
let diskHoist = null;
let diskAnimation = null;
let dragState = null;
let currentView = "archive";
let bootAudio = null;
let interludeAudio = null;
let isDiscFlipped = false;

document.querySelectorAll(".js-year").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

/**
 * The website plays a GLOW scene behind the diskettes. The host does not:
 * that scene is a second WebGL app, and the shelf should stay a still page.
 */
function mountShelfBackground() {
  if (window.luminodeHost) {
    body.classList.add("is-plain");
    return;
  }

  const frame = document.createElement("iframe");
  frame.className = "glow-bg";
  frame.src = "/glow/index.html?embed=1";
  frame.title = "";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;

  const veil = document.createElement("div");
  veil.className = "glow-bg__veil";
  veil.setAttribute("aria-hidden", "true");

  body.prepend(veil);
  body.prepend(frame);
}

mountShelfBackground();

function playBootSound() {
  if (!bootAudio) {
    bootAudio = new Audio("/audio/boot-sound.mp3");
    bootAudio.preload = "auto";
  }
  bootAudio.currentTime = 0;
  bootAudio.play().catch(() => {});
}

function toggleInterlude() {
  if (!interludeAudio) {
    interludeAudio = new Audio("/audio/interlude-1.mp3");
    interludeAudio.preload = "auto";
    interludeAudio.loop = true;
  }

  const playing = interludeAudio.paused;
  if (playing) {
    interludeAudio.play().catch(() => {});
  } else {
    interludeAudio.pause();
  }

  document.querySelectorAll(".js-interlude").forEach((button) => {
    button.setAttribute("aria-pressed", playing ? "true" : "false");
    button.setAttribute(
      "aria-label",
      playing ? "Pausar interlude" : "Reproducir interlude",
    );
  });
}

function currentPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function resolveView(path = currentPath()) {
  if (path === "/music") return "music";
  if (path === "/engineering") return "engineering";
  return "archive";
}

function isAppRoute(path = currentPath()) {
  return path === "/software" || path === "/music" || path === "/engineering";
}

function setView(view) {
  currentView = view;
  body.dataset.view = view;
  archive?.toggleAttribute("inert", view !== "archive");
  music?.toggleAttribute("inert", view !== "music");
  engineering?.toggleAttribute("inert", view !== "engineering");
}

async function navigate(path) {
  const next = path.replace(/\/$/, "") || "/";
  if (currentPath() === next) {
    setView(resolveView(next));
    return;
  }

  if (activeDisk) await closeDrive();
  history.pushState({ view: resolveView(next) }, "", next);
  setView(resolveView(next));
}

function applyRoute() {
  setView(resolveView());
}

function isMobile() {
  return MOBILE_MQ.matches;
}

function enterStudio({ replacePath = true, playBoot = false } = {}) {
  if (hasEntered || isLaunching) return;

  hasEntered = true;
  body.classList.remove("is-booting");
  body.classList.add("has-entered");
  bootScreen?.setAttribute("aria-hidden", "true");

  if (playBoot) playBootSound();

  if (replacePath && !isAppRoute()) {
    history.replaceState({ view: "archive" }, "", "/software");
  }

  applyRoute();

  window.setTimeout(() => {
    const focusTarget =
      currentView === "music"
        ? document.querySelector(".music .js-nav-archive")
        : currentView === "engineering"
          ? document.querySelector(".engineering .js-nav-archive")
          : document.querySelector(".archive .js-about");
    focusTarget?.focus({ preventScroll: true });
  }, 80);
}

async function showFront({ push = true } = {}) {
  if (!hasEntered || isLaunching) return;

  if (activeDisk) await closeDrive();
  closeDialog(aboutModal);
  closeDialog(projectModal);

  hasEntered = false;
  body.classList.add("is-booting");
  body.classList.remove("has-entered");
  delete body.dataset.view;
  bootScreen?.setAttribute("aria-hidden", "false");
  archive?.setAttribute("inert", "");
  music?.setAttribute("inert", "");
  engineering?.setAttribute("inert", "");

  if (push && currentPath() !== "/") {
    history.pushState({ view: "boot" }, "", "/");
  } else if (!push && currentPath() !== "/") {
    history.replaceState({ view: "boot" }, "", "/");
  }

  window.setTimeout(() => {
    document.querySelector(".js-enter")?.focus({ preventScroll: true });
  }, 80);
}

function openDialog(dialog) {
  if (!dialog || dialog.open || isLaunching || isAnimatingDisk) return;
  dialog.showModal();
}

let mediaPlaylist = [];
let mediaIndex = 0;
let mediaView = "grid";

function getMediaElements() {
  return {
    mediaPane: projectModal?.querySelector(".js-modal-media"),
    grid: projectModal?.querySelector(".js-media-grid"),
    stage: projectModal?.querySelector(".js-media-stage"),
    video: projectModal?.querySelector(".js-modal-video"),
    indexLabel: projectModal?.querySelector(".js-media-index"),
    prevBtn: projectModal?.querySelector(".js-media-prev"),
    nextBtn: projectModal?.querySelector(".js-media-next"),
    backBtn: projectModal?.querySelector(".js-media-back"),
    projectBody: projectModal?.querySelector(".modal__body--project"),
    copyPane: projectModal?.querySelector(".js-modal-copy"),
  };
}

function stopProjectMedia() {
  const { video } = getMediaElements();
  if (!video) return;
  video.pause();
  video.removeAttribute("src");
  video.load();
}

function updateMediaNav() {
  const { indexLabel, prevBtn, nextBtn } = getMediaElements();
  const total = mediaPlaylist.length;
  if (indexLabel) {
    indexLabel.textContent = total ? `${mediaIndex + 1} / ${total}` : "";
  }
  const multi = total > 1;
  if (prevBtn) prevBtn.hidden = !multi;
  if (nextBtn) nextBtn.hidden = !multi;
}

function setMediaView(view) {
  const { grid, stage, mediaPane } = getMediaElements();
  mediaView = view;
  mediaPane?.classList.toggle("is-playing", view === "player");
  if (grid) grid.hidden = view !== "grid";
  if (stage) stage.hidden = view !== "player";
}

function renderMediaGrid() {
  const { grid } = getMediaElements();
  if (!grid) return;

  grid.replaceChildren();
  mediaPlaylist.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal__thumb";
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", `Reproducir video ${index + 1}`);
    button.dataset.index = String(index);

    const preview = document.createElement("video");
    preview.className = "modal__thumb-video";
    preview.src = `${src}#t=0.1`;
    preview.muted = true;
    preview.playsInline = true;
    preview.preload = "metadata";
    preview.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "modal__thumb-label";
    label.textContent = String(index + 1).padStart(2, "0");

    button.append(preview, label);
    button.addEventListener("click", () => {
      showProjectVideo(index, { autoplay: true });
    });
    grid.append(button);
  });
}

function showProjectVideo(index, { autoplay = false } = {}) {
  const { video } = getMediaElements();
  if (!video || !mediaPlaylist.length) return;

  mediaIndex =
    ((index % mediaPlaylist.length) + mediaPlaylist.length) % mediaPlaylist.length;
  const src = mediaPlaylist[mediaIndex];
  const shouldPlay = autoplay || (mediaView === "player" && !video.paused);

  setMediaView("player");
  video.src = src;
  video.load();
  updateMediaNav();

  if (shouldPlay) {
    video.play().catch(() => {});
  }
}

function showMediaGrid() {
  stopProjectMedia();
  setMediaView("grid");
}

function setupProjectMedia(project) {
  const { mediaPane, projectBody } = getMediaElements();
  mediaPlaylist = Array.isArray(project.videos) ? project.videos.filter(Boolean) : [];
  mediaIndex = 0;

  const hasMedia = mediaPlaylist.length > 0;
  if (mediaPane) mediaPane.hidden = !hasMedia;
  projectBody?.classList.toggle("is-text-only", !hasMedia);

  if (!hasMedia) {
    stopProjectMedia();
    setMediaView("grid");
    updateMediaNav();
    return;
  }

  renderMediaGrid();
  showMediaGrid();
  updateMediaNav();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
  if (dialog === projectModal) {
    stopProjectMedia();
    setMediaView("grid");
  }
}

function fillProjectModal(projectKey) {
  const project = projects[projectKey];
  if (!project) return;

  const header = projectModal.querySelector(".js-modal-header");
  if (header) header.textContent = project.code || project.index.split(" / ")[0] || "LS";

  projectModal.querySelector(".js-modal-index").textContent = project.index;
  projectModal.querySelector(".js-modal-title").textContent = project.title;
  projectModal.querySelector(".js-modal-description").textContent =
    project.description;

  const detailNode = projectModal.querySelector(".js-modal-detail");
  const detailParts = Array.isArray(project.detail)
    ? project.detail.filter(Boolean)
    : project.detail
      ? [project.detail]
      : [];
  detailNode.replaceChildren(
    ...detailParts.flatMap((part, index) => {
      const nodes = [document.createTextNode(part)];
      if (index < detailParts.length - 1) {
        nodes.push(document.createElement("br"), document.createElement("br"));
      }
      return nodes;
    }),
  );

  setupProjectMedia(project);

  const openLink = projectModal.querySelector(".js-modal-open");
  const repoLink = projectModal.querySelector(".js-modal-repo");
  const docLink = projectModal.querySelector(".js-modal-doc");
  openLink.href = project.url;
  repoLink.href = project.repo;
  openLink.target = "_blank";
  repoLink.target = "_blank";
  openLink.rel = "noreferrer";
  repoLink.rel = "noreferrer";

  if (project.document?.href) {
    docLink.hidden = false;
    docLink.href = project.document.href;
    docLink.textContent = project.document.label || "documento ↗";
    docLink.removeAttribute("download");
    docLink.target = "_blank";
    docLink.rel = "noreferrer";
  } else {
    docLink.hidden = true;
    docLink.removeAttribute("href");
    docLink.removeAttribute("download");
  }

  const { copyPane } = getMediaElements();
  if (copyPane) copyPane.scrollTop = 0;

  openDialog(projectModal);

  if (copyPane) copyPane.scrollTop = 0;
}

function clearDiskInlineStyles(disk) {
  disk.style.left = "";
  disk.style.top = "";
  disk.style.width = "";
  disk.style.height = "";
  disk.style.transform = "";
  disk.style.transition = "";
}

function readTransform(node) {
  const value = getComputedStyle(node).transform;
  return !value || value === "none" ? "none" : value;
}

function getFocusTarget(disk) {
  const isMini = disk?.classList.contains("minidisc");
  const aside = !isMini;
  const narrow = window.innerWidth <= 760;
  const aspect = isMini ? MD_ASPECT : DISK_ASPECT;
  const fallbackWidth = aside
    ? Math.min(window.innerWidth * (narrow ? 0.42 : 0.24), narrow ? 170 : 240)
    : Math.min(window.innerWidth * (isMini ? 0.64 : 0.72), isMini ? 280 : 300);

  if (aside && driveSpacerEl && !driveSpacerEl.hidden) {
    const box = driveSpacerEl.getBoundingClientRect();
    if (box.width > 40 && box.height > 40) {
      return {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        transform: narrow ? "rotate(-3deg)" : "rotate(-4deg)",
      };
    }
  }

  const width = fallbackWidth;
  const height = width * aspect;
  const left = aside
    ? narrow
      ? Math.max(16, (window.innerWidth - width) / 2)
      : Math.max(48, window.innerWidth * 0.08)
    : (window.innerWidth - width) / 2;
  const top = aside
    ? narrow
      ? Math.max(48, window.innerHeight * 0.08)
      : Math.max(64, (window.innerHeight - height) / 2)
    : Math.max(32, window.innerHeight * 0.1);

  return {
    left,
    top,
    width,
    height,
    transform: aside ? (narrow ? "rotate(-3deg)" : "rotate(-4deg)") : "rotate(-2deg)",
  };
}

function detailParagraphs(detail) {
  return Array.isArray(detail) ? detail : detail ? [detail] : [];
}

let lightboxPlaylist = [];
let lightboxIndexPos = 0;

function setDrivePreviewsPaused(paused) {
  driveMedia?.querySelectorAll("video").forEach((video) => {
    if (paused) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  });
}

function updateLightboxNav() {
  const total = lightboxPlaylist.length;
  if (lightboxIndex) {
    lightboxIndex.textContent = total ? `${lightboxIndexPos + 1} / ${total}` : "";
  }
  const multi = total > 1;
  if (lightboxPrev) lightboxPrev.hidden = !multi;
  if (lightboxNext) lightboxNext.hidden = !multi;
}

function showLightboxVideo(index, { autoplay = true } = {}) {
  if (!lightboxVideo || !lightboxPlaylist.length) return;
  lightboxIndexPos =
    ((index % lightboxPlaylist.length) + lightboxPlaylist.length) %
    lightboxPlaylist.length;
  const shouldPlay =
    autoplay || (videoLightbox?.open && !lightboxVideo.paused);
  lightboxVideo.src = lightboxPlaylist[lightboxIndexPos];
  lightboxVideo.load();
  updateLightboxNav();
  if (shouldPlay) {
    lightboxVideo.play().catch(() => {});
  }
}

function openVideoLightbox(videos, index = 0) {
  lightboxPlaylist = Array.isArray(videos) ? videos.filter(Boolean) : [];
  if (!videoLightbox || !lightboxPlaylist.length) return;

  setDrivePreviewsPaused(true);
  if (!videoLightbox.open) {
    videoLightbox.showModal();
  }
  showLightboxVideo(index, { autoplay: true });
}

function closeVideoLightbox() {
  if (!videoLightbox?.open) return;
  lightboxVideo?.pause();
  if (lightboxVideo) {
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
  }
  videoLightbox.close();
  lightboxPlaylist = [];
  lightboxIndexPos = 0;
  setDrivePreviewsPaused(false);
}

function clearDriveProjectPanel() {
  closeVideoLightbox();
  drive?.classList.remove("is-project");
  if (driveSpacerEl) driveSpacerEl.hidden = true;
  if (driveDetail) {
    driveDetail.hidden = true;
    driveDetail.replaceChildren();
  }
  if (driveLinks) {
    driveLinks.hidden = true;
    driveLinks.replaceChildren();
  }
  if (driveMedia) {
    driveMedia.hidden = true;
    driveMedia.querySelectorAll("video").forEach((video) => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    });
    driveMedia.replaceChildren();
  }
}

function fillDriveProjectPanel(item) {
  if (!item) return;
  drive?.classList.add("is-project");
  if (driveSpacerEl) driveSpacerEl.hidden = false;

  const paragraphs = detailParagraphs(item.detail);
  if (driveDetail) {
    driveDetail.hidden = paragraphs.length === 0;
    driveDetail.replaceChildren(
      ...paragraphs.map((text) => {
        const p = document.createElement("p");
        p.textContent = text;
        return p;
      }),
    );
  }

  if (driveLinks) {
    const links = [];
    if (item.repo) {
      links.push({ href: item.repo, label: "repositorio ↗" });
    }
    if (item.document?.href) {
      links.push({
        href: item.document.href,
        label: item.document.label || "documento ↗",
      });
    }
    driveLinks.hidden = links.length === 0;
    driveLinks.replaceChildren(
      ...links.map((link) => {
        const a = document.createElement("a");
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = link.label;
        return a;
      }),
    );
  }

  if (driveMedia) {
    const videos = Array.isArray(item.videos) ? item.videos.filter(Boolean) : [];
    driveMedia.hidden = videos.length === 0;
    driveMedia.replaceChildren();
    if (!videos.length) return;

    const grid = document.createElement("div");
    grid.className = "drive__video-grid";
    videos.forEach((src, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "drive__video-cell";
      cell.setAttribute("aria-label", `Ampliar video ${index + 1}`);
      const video = document.createElement("video");
      video.className = "drive__video";
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("aria-hidden", "true");
      cell.append(video);
      cell.addEventListener("click", () => {
        openVideoLightbox(videos, index);
      });
      grid.append(cell);
    });
    driveMedia.append(grid);

    window.requestAnimationFrame(() => {
      driveMedia.querySelectorAll("video").forEach((video) => {
        video.play().catch(() => {});
      });
    });
  }
}

function geometryKeyframe(box, transform) {
  return {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    transform,
  };
}

function placeDiskAt(disk, box, transform) {
  disk.style.left = `${box.left}px`;
  disk.style.top = `${box.top}px`;
  disk.style.width = `${box.width}px`;
  disk.style.height = `${box.height}px`;
  disk.style.transform = transform;
}

async function animateDisk(disk, from, to) {
  diskAnimation?.cancel();
  diskAnimation = disk.animate([from, to], {
    duration: MOVE_MS,
    easing: MOVE_EASE,
    fill: "forwards",
  });

  await diskAnimation.finished.catch(() => {});
}

function finishDiskAnimation(disk, { settleFocused = false } = {}) {
  if (diskAnimation) {
    try {
      diskAnimation.commitStyles();
    } catch {
      /* ignore */
    }
    diskAnimation.cancel();
    diskAnimation = null;
  }

  if (!settleFocused) {
    disk.classList.remove("is-focused");
    clearDiskInlineStyles(disk);
  } else if (disk.classList.contains("is-aside")) {
    // Keep measured spacer geometry so the disk stays under the title column.
    disk.style.height = "";
    disk.style.transition = "";
  } else {
    clearDiskInlineStyles(disk);
  }

  disk.style.visibility = "";
}

function bandcampEmbedSrc(albumId) {
  return (
    "https://bandcamp.com/EmbeddedPlayer/album=" +
    encodeURIComponent(albumId) +
    "/size=large/bgcol=000000/linkcol=6dff5c/artwork=small/transparent=true/"
  );
}

function clearReleaseFlip(disk = activeDisk) {
  isDiscFlipped = false;
  body.classList.remove("is-disc-flipped");
  const flipper = disk?.querySelector(".minidisc__flipper");
  if (flipper) flipper.style.transition = "none";
  disk?.classList.remove("is-flipped", "is-embed-live");
  disk?.querySelector(".minidisc__embed-slot")?.remove();
  if (flipper) {
    void flipper.offsetWidth;
    flipper.style.transition = "";
  }
}

function unflipReleaseEmbed() {
  if (!isDiscFlipped || !activeDisk) return;
  clearReleaseFlip(activeDisk);
}

function ensureFlipClose(disk) {
  let button = disk.querySelector(".js-flip-close");
  if (button) return button;

  button = document.createElement("button");
  button.type = "button";
  button.className = "minidisc__flip-close js-flip-close";
  button.setAttribute("aria-label", "Cerrar reproductor");
  button.textContent = "×";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    unflipReleaseEmbed();
  });
  disk.appendChild(button);
  return button;
}

function ensureEmbedSlot(disk, item) {
  let slot = disk.querySelector(".minidisc__embed-slot");
  if (!slot) {
    slot = document.createElement("div");
    slot.className = "minidisc__embed-slot";
    disk.appendChild(slot);
  }

  let iframe = slot.querySelector(".minidisc__embed");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.className = "minidisc__embed";
    iframe.title = `${item.title} — Bandcamp`;
    iframe.loading = "lazy";
    iframe.setAttribute("seamless", "");
    iframe.allow = "autoplay *; clipboard-write *; encrypted-media *";
    iframe.src = bandcampEmbedSrc(item.albumId);
    slot.appendChild(iframe);
  }

  return slot;
}

function flipReleaseEmbed() {
  if (
    !activeDisk ||
    activeItemKind !== "release" ||
    isAnimatingDisk ||
    isLaunching ||
    isDiscFlipped ||
    !activeDisk.classList.contains("is-focused")
  ) {
    return;
  }

  const item = releases[activeItemKey];
  if (!item?.albumId) return;

  // Keep the iframe outside the 3D flip tree — browsers block clicks on
  // iframes nested under preserve-3d / rotateY.
  ensureEmbedSlot(activeDisk, item);
  ensureFlipClose(activeDisk);
  isDiscFlipped = true;
  body.classList.add("is-disc-flipped");
  activeDisk.classList.add("is-flipped");

  const flipper = activeDisk.querySelector(".minidisc__flipper");
  const reveal = () => activeDisk?.classList.add("is-embed-live");
  if (flipper) {
    flipper.addEventListener("transitionend", reveal, { once: true });
    window.setTimeout(reveal, 720);
  } else {
    reveal();
  }
}

async function openDrive(disk) {
  if (isLaunching || !hasEntered || isAnimatingDisk || activeDisk) return;

  const projectKey = disk.dataset.project;
  const releaseKey = disk.dataset.release;
  const itemKey = projectKey || releaseKey;
  const kind = projectKey ? "project" : "release";
  const item = kind === "project" ? projects[projectKey] : releases[releaseKey];
  if (!item) return;

  isAnimatingDisk = true;
  activeItemKey = itemKey;
  activeItemKind = kind;
  activeDisk = disk;

  const card = disk.closest(kind === "project" ? ".project" : ".release");
  const first = disk.getBoundingClientRect();
  const startTransform = readTransform(disk);

  if (kind === "release") {
    const color = getComputedStyle(card).getPropertyValue("--md-color").trim();
    if (color) disk.style.setProperty("--md-color", color);
  }

  diskSpacer = document.createElement("span");
  diskSpacer.className = "disk-spacer";
  diskSpacer.style.width = `${disk.offsetWidth}px`;
  diskSpacer.style.height = `${disk.offsetHeight}px`;
  diskSpacer.setAttribute("aria-hidden", "true");
  diskHomeParent = disk.parentNode;
  diskHomeParent.insertBefore(diskSpacer, disk);

  const projectTone = [...card.classList].find((name) =>
    name.startsWith("project--"),
  );
  diskHoist = document.createElement("div");
  diskHoist.className = projectTone
    ? `disk-hoist ${projectTone}`
    : "disk-hoist";
  diskHoist.setAttribute("aria-hidden", "true");
  document.body.appendChild(diskHoist);
  diskHoist.appendChild(disk);

  document.querySelectorAll(".project, .release").forEach((node) => {
    node.classList.toggle("is-armed", node === card);
  });

  driveCode.textContent = kind === "release" ? "" : item.index;
  driveCode.hidden = kind === "release";
  driveTitle.textContent = item.title;
  driveDescription.hidden = false;
  driveDescription.replaceChildren(item.description);
  if (driveHint) driveHint.hidden = kind !== "release";
  driveLaunch.dataset.url = item.url;
  driveLaunch.dataset.project = kind === "project" ? itemKey : "";
  driveLaunch.dataset.release = kind === "release" ? itemKey : "";
  driveLaunch.textContent = item.launchLabel || "iniciar";
  if (driveInfo) driveInfo.hidden = true;

  if (kind === "project") {
    fillDriveProjectPanel(item);
  } else {
    clearDriveProjectPanel();
  }

  drive.hidden = false;
  drive.classList.add("is-open");
  body.classList.add("is-armed");
  // Lay out the project stage before measuring the disk landing slot.
  if (kind === "project") {
    void drive.offsetWidth;
  }

  const target = getFocusTarget(disk);
  disk.classList.add("is-focused");
  disk.classList.toggle("is-aside", kind === "project");
  placeDiskAt(disk, first, startTransform);

  await animateDisk(
    disk,
    geometryKeyframe(first, startTransform),
    geometryKeyframe(target, target.transform),
  );

  finishDiskAnimation(disk, { settleFocused: true });

  isAnimatingDisk = false;
  if (kind === "release") {
    activeDisk?.setAttribute(
      "aria-label",
      `Reproducir ${item.title} en Bandcamp`,
    );
  }
  driveLaunch.focus({ preventScroll: true });
}

async function closeDrive() {
  if (isLaunching || isAnimatingDisk || !activeDisk) return;

  closeVideoLightbox();
  isAnimatingDisk = true;
  const disk = activeDisk;
  clearReleaseFlip(disk);
  const first = disk.getBoundingClientRect();
  const startTransform = readTransform(disk);
  const homeParent = diskHomeParent || diskSpacer?.parentNode;

  drive.classList.remove("is-open");
  body.classList.remove("is-armed");
  document.querySelectorAll(".project.is-armed, .release.is-armed").forEach((card) => {
    card.classList.remove("is-armed");
  });

  // Park the disk in its archive slot to measure the return target
  if (diskSpacer?.parentNode) {
    diskSpacer.parentNode.insertBefore(disk, diskSpacer);
  } else if (homeParent) {
    homeParent.prepend(disk);
  }

  disk.style.transition = "none";
  disk.style.visibility = "hidden";
  disk.classList.remove("is-focused", "is-aside");
  clearDiskInlineStyles(disk);
  disk.style.transition = "none";

  if (diskSpacer) {
    diskSpacer.remove();
    diskSpacer = null;
  }

  const last = disk.getBoundingClientRect();
  const homeTransform = readTransform(disk);
  const homeNextSibling = disk.nextSibling;

  // Fly back above the overlay
  if (!diskHoist) {
    diskHoist = document.createElement("div");
    diskHoist.className = "disk-hoist";
    diskHoist.setAttribute("aria-hidden", "true");
    document.body.appendChild(diskHoist);
  }
  diskHoist.appendChild(disk);
  disk.classList.add("is-focused");
  placeDiskAt(disk, first, startTransform);
  disk.style.visibility = "";

  await animateDisk(
    disk,
    geometryKeyframe(first, startTransform),
    geometryKeyframe(last, homeTransform),
  );

  finishDiskAnimation(disk);

  if (homeParent) {
    if (homeNextSibling && homeNextSibling.parentNode === homeParent) {
      homeParent.insertBefore(disk, homeNextSibling);
    } else {
      homeParent.appendChild(disk);
    }
  }

  if (disk.dataset.release && releases[disk.dataset.release]) {
    disk.setAttribute(
      "aria-label",
      `Seleccionar ${releases[disk.dataset.release].title}`,
    );
  }

  clearDriveProjectPanel();
  diskHoist?.remove();
  diskHoist = null;
  diskHomeParent = null;
  activeDisk = null;
  activeItemKey = null;
  activeItemKind = null;
  isAnimatingDisk = false;
  drive.hidden = true;
  if (driveInfo) driveInfo.hidden = true;
  driveCode.hidden = false;
  driveDescription.hidden = false;
  if (driveHint) driveHint.hidden = true;
  driveLaunch.textContent = "iniciar";
}

function confirmLaunch() {
  if (isLaunching || !activeItemKey || isAnimatingDisk) return;

  const item =
    activeItemKind === "release"
      ? releases[activeItemKey]
      : projects[activeItemKey];
  const url = driveLaunch.dataset.url || item?.url || "";
  const host = window.luminodeHost;
  if (!url && !host?.launch) return;

  isLaunching = true;
  closeDialog(aboutModal);
  closeDialog(projectModal);
  launchName.textContent = item?.title ?? activeItemKey;
  body.classList.add("is-launching");
  drive.classList.add("is-launching");
  activeDisk?.classList.add("is-launching");

  window.setTimeout(() => {
    if (host?.launch) {
      host.launch({
        kind: activeItemKind,
        id: activeItemKey,
        url,
      });
      isLaunching = false;
      body.classList.remove("is-launching");
      drive.classList.remove("is-launching");
      activeDisk?.classList.remove("is-launching");
      return;
    }
    window.location.assign(url);
  }, 1200);
}

function onPointerDown(event) {
  if (
    !hasEntered ||
    isLaunching ||
    isAnimatingDisk ||
    drive.classList.contains("is-open") ||
    activeDisk ||
    isMobile()
  ) {
    return;
  }
  if (event.button !== undefined && event.button !== 0) return;

  const disk = event.target.closest(".js-select, .js-md-select");
  if (!disk || disk.classList.contains("is-focused")) return;

  const card = disk.closest(".project, .release");
  if (!card) return;

  const point = getPoint(event);
  const startX = Number(card.dataset.dragX || 0);
  const startY = Number(card.dataset.dragY || 0);

  dragState = {
    disk,
    project: card,
    pointerId: event.pointerId,
    originX: point.x,
    originY: point.y,
    startX,
    startY,
    moved: false,
  };

  card.classList.add("is-dragging");
  disk.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onDiskClick(event) {
  const disk = event.currentTarget;

  if (
    disk.classList.contains("is-focused") &&
    activeDisk === disk &&
    activeItemKind === "release"
  ) {
    // Embed / close control handle their own interaction.
    if (
      isDiscFlipped ||
      event.target.closest(
        "iframe, .minidisc__embed, .minidisc__embed-slot, .minidisc__face--back, .js-flip-close",
      )
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    flipReleaseEmbed();
    return;
  }

  if (!isMobile()) return;
  if (
    !hasEntered ||
    isLaunching ||
    isAnimatingDisk ||
    drive.classList.contains("is-open") ||
    activeDisk
  ) {
    return;
  }

  if (!disk || disk.classList.contains("is-focused")) return;
  openDrive(disk);
}

function onPointerMove(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const point = getPoint(event);
  const dx = point.x - dragState.originX;
  const dy = point.y - dragState.originY;

  if (Math.hypot(dx, dy) > 6) {
    dragState.moved = true;
  }

  const nextX = dragState.startX + dx;
  const nextY = dragState.startY + dy;
  dragState.project.dataset.dragX = String(nextX);
  dragState.project.dataset.dragY = String(nextY);
  dragState.project.style.setProperty("--drag-x", `${nextX}px`);
  dragState.project.style.setProperty("--drag-y", `${nextY}px`);
}

function onPointerUp(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const { disk, project, moved } = dragState;
  project.classList.remove("is-dragging");
  disk.releasePointerCapture?.(event.pointerId);
  dragState = null;

  if (!moved) {
    openDrive(disk);
  }
}

function getPoint(event) {
  if ("clientX" in event) {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.touches?.[0] || event.changedTouches?.[0];
  return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
}

document.addEventListener("keydown", (event) => {
  if (!hasEntered) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    enterStudio({ playBoot: true });
    return;
  }

  if (event.key !== "Escape") return;
  if (isLaunching || isAnimatingDisk) {
    event.preventDefault();
    return;
  }

  if (drive.classList.contains("is-open") || activeDisk) {
    event.preventDefault();
    closeDrive();
  }
});

document.querySelector(".js-enter")?.addEventListener("click", (event) => {
  event.stopPropagation();
  enterStudio({ playBoot: true });
});

bootScreen?.addEventListener("click", () => {
  enterStudio({ playBoot: true });
});

document.querySelectorAll(".js-interlude").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleInterlude();
  });
});

document.querySelectorAll(".js-about").forEach((button) => {
  button.addEventListener("click", () => {
    openDialog(aboutModal);
  });
});

document.querySelectorAll(".js-nav-music").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!hasEntered) enterStudio();
    navigate("/music");
  });
});

document.querySelectorAll(".js-nav-archive").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!hasEntered) enterStudio({ replacePath: false });
    navigate("/software");
  });
});

document.querySelectorAll(".js-nav-engineering").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!hasEntered) enterStudio({ replacePath: false });
    navigate("/engineering");
  });
});

document.querySelectorAll(".js-home").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showFront();
  });
});

window.addEventListener("popstate", () => {
  if (currentPath() === "/") {
    if (hasEntered) showFront({ push: false });
    return;
  }

  if (!hasEntered && isAppRoute()) {
    enterStudio({ replacePath: false });
    return;
  }

  applyRoute();
});

document.querySelectorAll(".js-project-info").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    fillProjectModal(button.dataset.project);
  });
});

document.querySelectorAll(".js-select, .js-md-select").forEach((disk) => {
  disk.addEventListener("pointerdown", onPointerDown);
  disk.addEventListener("pointermove", onPointerMove);
  disk.addEventListener("pointerup", onPointerUp);
  disk.addEventListener("pointercancel", onPointerUp);
  disk.addEventListener("click", onDiskClick);

  if (disk.classList.contains("js-md-select")) {
    disk.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (
        disk.classList.contains("is-focused") &&
        activeDisk === disk &&
        activeItemKind === "release"
      ) {
        if (!isDiscFlipped) flipReleaseEmbed();
        return;
      }
      if (!activeDisk) openDrive(disk);
    });
  }
});

document.querySelector(".js-drive-dismiss").addEventListener("click", closeDrive);
document.querySelector(".js-drive-launch").addEventListener("click", confirmLaunch);
document.querySelector(".js-drive-info").addEventListener("click", () => {
  if (activeItemKind === "project" && activeItemKey) {
    fillProjectModal(activeItemKey);
  }
});

drive.addEventListener("click", (event) => {
  if (event.target === drive) closeDrive();
});

document.querySelectorAll(".modal").forEach((dialog) => {
  dialog.querySelector(".modal__close").addEventListener("click", () => {
    closeDialog(dialog);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
});

projectModal?.querySelector(".js-media-back")?.addEventListener("click", () => {
  showMediaGrid();
});

projectModal?.querySelector(".js-media-prev")?.addEventListener("click", () => {
  if (mediaPlaylist.length < 2) return;
  showProjectVideo(mediaIndex - 1, { autoplay: true });
});

projectModal?.querySelector(".js-media-next")?.addEventListener("click", () => {
  if (mediaPlaylist.length < 2) return;
  showProjectVideo(mediaIndex + 1, { autoplay: true });
});

projectModal?.querySelector(".js-modal-video")?.addEventListener("ended", () => {
  if (mediaPlaylist.length < 2) return;
  showProjectVideo(mediaIndex + 1, { autoplay: true });
});

videoLightbox?.querySelector(".js-video-lightbox-close")?.addEventListener("click", () => {
  closeVideoLightbox();
});

videoLightbox?.addEventListener("click", (event) => {
  if (event.target === videoLightbox) closeVideoLightbox();
});

videoLightbox?.addEventListener("close", () => {
  lightboxVideo?.pause();
  if (lightboxVideo) {
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
  }
  lightboxPlaylist = [];
  lightboxIndexPos = 0;
  setDrivePreviewsPaused(false);
});

lightboxPrev?.addEventListener("click", () => {
  if (lightboxPlaylist.length < 2) return;
  showLightboxVideo(lightboxIndexPos - 1, { autoplay: true });
});

lightboxNext?.addEventListener("click", () => {
  if (lightboxPlaylist.length < 2) return;
  showLightboxVideo(lightboxIndexPos + 1, { autoplay: true });
});

lightboxVideo?.addEventListener("ended", () => {
  if (lightboxPlaylist.length < 2) return;
  showLightboxVideo(lightboxIndexPos + 1, { autoplay: true });
});

videoLightbox?.addEventListener("keydown", (event) => {
  if (!videoLightbox.open || lightboxPlaylist.length < 2) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showLightboxVideo(lightboxIndexPos - 1, { autoplay: true });
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showLightboxVideo(lightboxIndexPos + 1, { autoplay: true });
  }
});

applyRoute();

if (isAppRoute()) {
  enterStudio({ replacePath: false });
}