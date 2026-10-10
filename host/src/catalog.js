import fs from 'node:fs'
import path from 'node:path'

/** Website project ids mapped to project folder names. */
export const KNOWN_APPS = [
  {
    id: 'musgo',
    name: 'MUSGO',
    dirNames: ['musgo'],
    remote: 'https://musgo.luminode.studio/'
  },
  {
    id: 'glow',
    name: 'G.L.O.W.',
    dirNames: ['glow'],
    remote: 'https://glow.luminode.studio/'
  },
  {
    id: 'intemperie',
    name: 'INTEMPERIE',
    dirNames: ['topografias-intemperie', 'intemperie'],
    remote: 'https://intemperie.luminode.studio/'
  },
  {
    id: 'lente',
    name: 'LENTES',
    dirNames: ['lente', 'lentes'],
    remote: null
  }
]

function readManifest (dir) {
  const file = path.join(dir, 'luminode.app.json')
  if (!fs.existsSync(file)) return null
  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (manifest.format !== 'luminode-app') return null
    return manifest
  } catch {
    return null
  }
}

function findDir (roots, dirNames) {
  for (const root of roots) {
    for (const name of dirNames) {
      const dir = path.resolve(root, name)
      const hasApp = fs.existsSync(path.join(dir, 'index.html')) ||
        fs.existsSync(path.join(dir, 'luminode.app.json'))
      if (hasApp) return dir
    }
  }
  return null
}

/** `roots` are searched in order; the first folder holding the app wins. */
export function resolveApps (roots, known = KNOWN_APPS) {
  const list = (Array.isArray(roots) ? roots : [roots]).filter(Boolean)
  return known.map((app) => {
    const dir = findDir(list, app.dirNames)
    const manifest = dir ? readManifest(dir) : null
    return {
      id: app.id,
      name: manifest?.name || app.name,
      remote: app.remote,
      dir,
      operator: manifest?.operator || '/index.html',
      output: manifest?.output || null,
      defaults: {
        width: 1280,
        height: 720,
        frameRate: 60,
        ...(manifest?.defaults || {})
      }
    }
  })
}

export function findApp (apps, id) {
  return apps.find((app) => app.id === id) || null
}
