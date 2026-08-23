const projects = {
  musgo: {
    index: "LS-001 / SISTEMA GENERATIVO",
    title: "MUSGO",
    description:
      "Un espacio de juego para organismos generativos: morfogénesis procedural, texturas materiales y especímenes que pueden guardarse y volver a mutar.",
    detail:
      "Sus familias de formas —toros, superficies mínimas, superformas, L-systems y agregación limitada por difusión— exploran cómo geometría, materia y resonancia pueden comportarse como una ecología.",
    tags: ["morfogénesis", "three.js", "resonancia", "sistemas vivos"],
    url: "https://musgo.luminode.studio/",
    repo: "https://github.com/rafaelbecks/musgo",
  },
  glow: {
    index: "LS-002 / SINTETIZADOR VISUAL",
    title: "G.L.O.W.",
    description:
      "Un sintetizador visual abierto para componer luz con geometría y crear estructuras que evolucionan en tiempo real.",
    detail:
      "Pequeños sistemas de dibujo llamados Luminodes se combinan, desplazan y responden al sonido, MIDI o generadores internos. La imagen no es fija: se interpreta.",
    tags: ["luz", "geometría", "canvas", "midi", "código abierto"],
    url: "https://glow.luminode.studio/",
    repo: "https://github.com/rafaelbecks/glow",
  },
  intemperie: {
    index: "LS-003 / INSTALACIÓN INTERACTIVA",
    title: "Topografías de la intemperie",
    description:
      "Una instalación interactiva que construye territorios imaginarios a partir de memorias espaciales deformadas.",
    detail:
      "Paisajes virtuales navegables donde geografía, sonido, lenguaje e interacción convergen para producir una experiencia perceptiva inestable.",
    tags: ["memoria", "cartografía", "sonido espacial", "three.js", "territorio"],
    url: "https://intemperie.luminode.studio/",
    repo: "https://github.com/rafaelbecks/topografias-intemperie",
  },
};

const releases = {
  "in-permanent-sequences": {
    index: "MD-001 / MINIDISC",
    title: "[in]permanent sequences",
    description:
      "a compilation of improvisations, loops, and sequences driven by random sources.",
    url: "https://dormidos.bandcamp.com/album/in-permanent-sequences",
    launchLabel: "bandcamp",
  },
  "na-ves-oscillations": {
    index: "MD-002 / MINIDISC",
    title: "naïves oscillations",
    description: "a naive perspective of sound-shaping with synthesizers.",
    url: "https://dormidos.bandcamp.com/album/na-ves-oscillations",
    launchLabel: "bandcamp",
  },
  "computer-perspective": {
    index: "MD-003 / MINIDISC",
    title: "computer perspective",
    description:
      "“computer perspective” is a compilation of compositions inspired by both technology and nature.",
    url: "https://dormidos.bandcamp.com/album/computer-perspective",
    launchLabel: "bandcamp",
  },
  "sonidos-incandescentes": {
    index: "MD-004 / MINIDISC",
    title: "sonidos incandescentes",
    description:
      "sonidos incandescentes es una selección de composiciones inspiradas en poemas de Rafael Cadenas.",
    url: "https://dormidos.bandcamp.com/album/sonidos-incandescentes",
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
const bootScreen = document.querySelector(".boot-screen");
const aboutModal = document.querySelector("#about-modal");
const projectModal = document.querySelector("#project-modal");
const launchName = document.querySelector(".js-launch-name");
const drive = document.querySelector(".drive");
const driveCode = document.querySelector(".js-drive-code");
const driveTitle = document.querySelector(".js-drive-title");
const driveDescription = document.querySelector(".js-drive-description");
const driveLaunch = document.querySelector(".js-drive-launch");
const driveInfo = document.querySelector(".js-drive-info");

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

document.querySelectorAll(".js-year").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

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
  return "archive";
}

function isAppRoute(path = currentPath()) {
  return path === "/software" || path === "/music";
}

function setView(view) {
  currentView = view;
  body.dataset.view = view;
  archive?.toggleAttribute("inert", view !== "archive");
  music?.toggleAttribute("inert", view !== "music");
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
        ? document.querySelector(".js-nav-archive")
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

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function fillProjectModal(projectKey) {
  const project = projects[projectKey];
  if (!project) return;

  projectModal.querySelector(".js-modal-index").textContent = project.index;
  projectModal.querySelector(".js-modal-title").textContent = project.title;
  projectModal.querySelector(".js-modal-description").textContent =
    project.description;
  projectModal.querySelector(".js-modal-detail").textContent = project.detail;
  projectModal.querySelector(".js-modal-tags").innerHTML = project.tags
    .map((tag) => `<span>${tag}</span>`)
    .join("");

  const openLink = projectModal.querySelector(".js-modal-open");
  const repoLink = projectModal.querySelector(".js-modal-repo");
  openLink.href = project.url;
  repoLink.href = project.repo;
  openLink.target = "_blank";
  repoLink.target = "_blank";
  openLink.rel = "noreferrer";
  repoLink.rel = "noreferrer";

  openDialog(projectModal);
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
  const aspect = isMini ? MD_ASPECT : DISK_ASPECT;
  const width = Math.min(window.innerWidth * (isMini ? 0.64 : 0.72), isMini ? 280 : 300);
  const height = width * aspect;

  return {
    left: (window.innerWidth - width) / 2,
    top: Math.max(32, window.innerHeight * 0.1),
    width,
    height,
    transform: "rotate(-2deg)",
  };
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
  }

  clearDiskInlineStyles(disk);
  disk.style.visibility = "";
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
  const target = getFocusTarget(disk);

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
  driveDescription.textContent = item.description;
  driveDescription.hidden = false;
  driveLaunch.dataset.url = item.url;
  driveLaunch.dataset.project = kind === "project" ? itemKey : "";
  driveLaunch.dataset.release = kind === "release" ? itemKey : "";
  driveLaunch.textContent = item.launchLabel || "iniciar";
  if (driveInfo) driveInfo.hidden = kind === "release";

  drive.hidden = false;
  body.classList.add("is-armed");
  disk.classList.add("is-focused");
  placeDiskAt(disk, first, startTransform);

  await animateDisk(
    disk,
    geometryKeyframe(first, startTransform),
    geometryKeyframe(target, target.transform),
  );

  finishDiskAnimation(disk, { settleFocused: true });

  drive.classList.add("is-open");
  isAnimatingDisk = false;
  driveLaunch.focus({ preventScroll: true });
}

async function closeDrive() {
  if (isLaunching || isAnimatingDisk || !activeDisk) return;

  isAnimatingDisk = true;
  const disk = activeDisk;
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
  disk.classList.remove("is-focused");
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

  diskHoist?.remove();
  diskHoist = null;
  diskHomeParent = null;
  activeDisk = null;
  activeItemKey = null;
  activeItemKind = null;
  isAnimatingDisk = false;
  drive.hidden = true;
  if (driveInfo) driveInfo.hidden = false;
  driveCode.hidden = false;
  driveDescription.hidden = false;
  driveLaunch.textContent = "iniciar";
}

function confirmLaunch() {
  if (isLaunching || !activeItemKey || isAnimatingDisk) return;

  const item =
    activeItemKind === "release"
      ? releases[activeItemKey]
      : projects[activeItemKey];
  const url = driveLaunch.dataset.url || item?.url;
  if (!url) return;

  isLaunching = true;
  closeDialog(aboutModal);
  closeDialog(projectModal);
  launchName.textContent = item?.title ?? activeItemKey;
  body.classList.add("is-launching");
  drive.classList.add("is-launching");
  activeDisk?.classList.add("is-launching");

  window.setTimeout(() => {
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

  const disk = event.currentTarget;
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

applyRoute();

if (isAppRoute()) {
  enterStudio({ replacePath: false });
}