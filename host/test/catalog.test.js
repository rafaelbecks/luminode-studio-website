import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { resolveApps } from '../src/catalog.js'

function write (file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, contents)
}

test('local apps resolve beside the studio and manifests override the defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-apps-'))
  write(path.join(root, 'lente', 'index.html'), '<!doctype html>')
  write(path.join(root, 'lente', 'luminode.app.json'), JSON.stringify({
    format: 'luminode-app',
    name: 'LENTE',
    operator: '/index.html',
    output: '/output.html',
    defaults: { width: 1920, height: 1080, frameRate: 30 }
  }))
  write(path.join(root, 'glow', 'index.html'), '<!doctype html>')

  const apps = resolveApps(root)
  const lente = apps.find((app) => app.id === 'lente')
  const glow = apps.find((app) => app.id === 'glow')
  const musgo = apps.find((app) => app.id === 'musgo')

  assert.equal(lente.dir, path.join(root, 'lente'))
  assert.equal(lente.output, '/output.html')
  assert.deepEqual(lente.defaults, { width: 1920, height: 1080, frameRate: 30 })
  assert.equal(glow.dir, path.join(root, 'glow'))
  assert.equal(glow.remote, 'https://glow.luminode.studio/')
  assert.equal(musgo.dir, null)
  assert.equal(musgo.remote, 'https://musgo.luminode.studio/')
})

test('earlier roots win, so a working copy shadows the bundled app', () => {
  const projects = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-projects-'))
  const bundled = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-bundled-'))
  write(path.join(bundled, 'lente', 'index.html'), '<!doctype html>')
  assert.equal(resolveApps([undefined, projects, bundled]).find((app) => app.id === 'lente').dir, path.join(bundled, 'lente'))
  write(path.join(projects, 'lente', 'index.html'), '<!doctype html>')
  assert.equal(resolveApps([projects, bundled]).find((app) => app.id === 'lente').dir, path.join(projects, 'lente'))
})
