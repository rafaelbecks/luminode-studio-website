import { app, BrowserWindow, Menu, dialog, ipcMain, session, shell } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findApp, resolveApps } from './catalog.js'
import { publishOutput, publishedAppId, stopPublishing } from './publish.js'
import { createStaticServer } from './static-server.js'

const hostDir = path.dirname(fileURLToPath(import.meta.url))
const studioRoot = path.resolve(hostDir, '../..')

/**
 * Development runs the site from the repo with Vite and finds apps beside
 * it. A packaged build serves the built site from its resources and looks in
 * LUMINODE_PROJECTS, ~/Projects, then the apps bundled with the build.
 */
function appRoots () {
  if (!app.isPackaged) return [path.resolve(studioRoot, '..')]
  return [
    process.env.LUMINODE_PROJECTS,
    path.join(os.homedir(), 'Projects'),
    path.join(process.resourcesPath, 'apps')
  ]
}

const apps = resolveApps(appRoots())
const sessions = new Map()
const servers = new Map()

let studioProcess = null
let studioServer = null
let studioUrl = ''
let shellWindow = null

function freePort () {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

function studioChild (port) {
  const viteBin = path.join(studioRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!fs.existsSync(viteBin)) {
    throw new Error('Vite is not installed. Run npm install in luminode-studio first.')
  }
  return spawn(process.execPath, [
    viteBin,
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort'
  ], {
    cwd: studioRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

async function waitForStudio (url, child) {
  const deadline = Date.now() + 20000
  let detail = ''
  child.stdout?.on('data', (chunk) => { detail += chunk })
  child.stderr?.on('data', (chunk) => { detail += chunk })
  while (Date.now() < deadline) {
    if (child.exitCode != null) break
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Vite is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(detail.trim() || 'The studio site did not start.')
}

async function startStudio () {
  if (app.isPackaged) {
    studioServer = await createStaticServer(path.join(process.resourcesPath, 'site'), {
      spaFallback: true,
      remoteOrigin: process.env.LUMINODE_SITE || 'https://luminode.studio/'
    })
    studioUrl = studioServer.url
    return
  }
  const port = await freePort()
  studioUrl = `http://127.0.0.1:${port}/`
  studioProcess = studioChild(port)
  await waitForStudio(studioUrl, studioProcess)
}

function allowMedia (_webContents, permission, callback) {
  callback(permission === 'media' || permission === 'display-capture' || permission === 'fullscreen')
}

function openExternalLinks (window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createShell () {
  shellWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 960,
    minHeight: 680,
    title: 'Luminode Studio',
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(hostDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  openExternalLinks(shellWindow)
  shellWindow.webContents.on('will-navigate', (event, url) => {
    const next = new URL(url)
    if (next.origin === new URL(studioUrl).origin) return
    event.preventDefault()
    const appMatch = apps.find((entry) => entry.remote && new URL(entry.remote).host === next.host)
    if (appMatch) openApp(appMatch.id)
    else shell.openExternal(url)
  })
  shellWindow.loadURL(studioUrl)
  shellWindow.on('closed', () => { shellWindow = null })
}

async function serverFor (appInfo) {
  if (!appInfo.dir) return null
  let server = servers.get(appInfo.id)
  if (!server) {
    server = await createStaticServer(appInfo.dir)
    servers.set(appInfo.id, server)
  }
  return server
}

async function openApp (id) {
  const appInfo = findApp(apps, id)
  if (!appInfo) return
  const current = sessions.get(id)
  if (current?.window && !current.window.isDestroyed()) {
    current.window.focus()
    return
  }

  const server = await serverFor(appInfo)
  const url = server ? new URL(appInfo.operator, server.url).href : appInfo.remote
  if (!url) {
    dialog.showMessageBox(shellWindow, {
      type: 'info',
      message: `${appInfo.name} is not on this machine.`,
      detail: 'There is no local folder and no public address for this diskette.'
    })
    return
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: appInfo.name,
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })
  openExternalLinks(win)
  sessions.set(id, { app: appInfo, window: win, server, url })
  win.on('closed', () => {
    if (sessions.get(id)?.window === win) sessions.delete(id)
    if (publishedAppId() === id) {
      stopPublishing()
      buildMenu()
    }
  })
  await win.loadURL(url)
}

function focusedSession () {
  const focused = BrowserWindow.getFocusedWindow()
  return [...sessions.values()].find((entry) => entry.window === focused) ||
    (sessions.size === 1 ? [...sessions.values()][0] : null)
}

async function publishFocused () {
  const record = focusedSession()
  if (!record) {
    dialog.showMessageBox({
      type: 'info',
      message: 'Open an instrument before publishing.',
      detail: 'Syphon and Spout send the program output of the focused instrument.'
    })
    return
  }
  if (!record.app.output || !record.server) {
    dialog.showMessageBox({
      type: 'info',
      message: `${record.app.name} has no program output page yet.`,
      detail: 'Add an "output" page to its luminode.app.json so only the canvas is sent, not the whole window.'
    })
    return
  }
  try {
    await publishOutput({
      id: record.app.id,
      name: `Luminode ${record.app.name}`,
      url: new URL(record.app.output, record.server.url).href,
      width: record.app.defaults.width,
      height: record.app.defaults.height,
      frameRate: record.app.defaults.frameRate
    })
  } catch (error) {
    dialog.showErrorBox('Could not publish', error.message)
  }
  buildMenu()
}

function buildMenu () {
  const live = publishedAppId()
  const liveName = live ? findApp(apps, live)?.name : ''
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Luminode Studio',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Show Studio Shelf',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => {
            if (shellWindow) shellWindow.focus()
            else createShell()
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Output',
      submenu: [
        {
          label: process.platform === 'win32' ? 'Send to Spout' : 'Send to Syphon',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => { publishFocused() }
        },
        {
          label: live ? `Stop sending ${liveName}` : 'Stop sending',
          enabled: Boolean(live),
          click: () => {
            stopPublishing()
            buildMenu()
          }
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]))
}

function stopStudio () {
  if (studioProcess && !studioProcess.killed) studioProcess.kill('SIGTERM')
  studioProcess = null
  studioServer?.close()
  studioServer = null
}

app.setName('Luminode Studio')

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler(allowMedia)
  buildMenu()
  try {
    await startStudio()
  } catch (error) {
    dialog.showErrorBox('Luminode Studio', error.message)
    app.quit()
    return
  }
  createShell()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createShell()
  })
})

app.on('before-quit', () => {
  stopPublishing()
  stopStudio()
  for (const server of servers.values()) server.close()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault())
})

ipcMain.on('luminode:launch', (_event, payload) => {
  if (!payload || typeof payload !== 'object') return
  if (payload.kind === 'release') {
    if (typeof payload.url === 'string' && payload.url.startsWith('https://')) {
      shell.openExternal(payload.url)
    }
    return
  }
  if (payload.kind !== 'project' || typeof payload.id !== 'string') return
  openApp(payload.id).catch((error) => {
    dialog.showErrorBox('Could not open the app', error.message)
  })
})
