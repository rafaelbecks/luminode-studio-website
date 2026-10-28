import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createStaticServer, resolveInside } from '../src/static-server.js'

test('static files stay inside the app directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-static-'))
  fs.writeFileSync(path.join(root, 'index.html'), 'home')
  fs.mkdirSync(path.join(root, 'src'))
  fs.writeFileSync(path.join(root, 'src', 'app.js'), 'app')

  assert.equal(resolveInside(root, '/'), root)
  assert.equal(resolveInside(root, '/src/app.js'), path.join(root, 'src', 'app.js'))
  assert.equal(resolveInside(root, '/../secret'), null)
  assert.equal(resolveInside(root, '/%2e%2e/secret'), null)
})

test('the server serves index.html and nested files', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-serve-'))
  fs.writeFileSync(path.join(root, 'index.html'), 'home')
  fs.mkdirSync(path.join(root, 'src'))
  fs.writeFileSync(path.join(root, 'src', 'app.js'), 'export {}')
  const server = await createStaticServer(root)
  try {
    const home = await fetch(server.url)
    assert.equal(await home.text(), 'home')
    assert.match(home.headers.get('content-type'), /text\/html/)
    const script = await fetch(new URL('/src/app.js', server.url))
    assert.equal(await script.text(), 'export {}')
    const missing = await fetch(new URL('/nope', server.url))
    assert.equal(missing.status, 404)
  } finally {
    await server.close()
  }
})

test('the site server falls back to index.html for app routes only', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-spa-'))
  fs.writeFileSync(path.join(root, 'index.html'), 'shelf')
  const server = await createStaticServer(root, { spaFallback: true })
  try {
    assert.equal(await (await fetch(new URL('/software', server.url))).text(), 'shelf')
    assert.equal(await (await fetch(new URL('/engineering', server.url))).text(), 'shelf')
    assert.equal((await fetch(new URL('/missing.png', server.url))).status, 404)
  } finally {
    await server.close()
  }
})

test('missing files redirect to the remote origin when one is set', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-remote-'))
  fs.writeFileSync(path.join(root, 'index.html'), 'shelf')
  const server = await createStaticServer(root, { spaFallback: true, remoteOrigin: 'https://luminode.studio/' })
  try {
    const response = await fetch(new URL('/projects/glow/videos/glow-01.mp4', server.url), { redirect: 'manual' })
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), 'https://luminode.studio/projects/glow/videos/glow-01.mp4')
    assert.equal(await (await fetch(server.url)).text(), 'shelf')
  } finally {
    await server.close()
  }
})
