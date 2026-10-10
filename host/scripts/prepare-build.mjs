/**
 * Stages what the packaged host ships besides its own code:
 *   build/icon.png, build/icon.icns  from ../public/favicon.png
 *   build/apps/lente                 the LENTES web app (operator + output)
 * The studio site itself comes from ../dist (npm run build at the repo root).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const hostDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const studioRoot = path.resolve(hostDir, '..')
const buildDir = path.join(hostDir, 'build')
const lenteRoot = path.resolve(process.env.LENTES_DIR || path.join(studioRoot, '..', 'lente'))

function ensureSite () {
  const index = path.join(studioRoot, 'dist', 'index.html')
  if (!fs.existsSync(index)) {
    throw new Error('The studio site is not built. Run `npm run build` in luminode-studio first.')
  }
}

function makeIcons () {
  const source = path.join(studioRoot, 'public', 'favicon.png')
  const png = path.join(buildDir, 'icon.png')
  const script = `
import sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGBA')
for size, out in [(1024, sys.argv[2])] + [(int(s), p) for s, p in zip(sys.argv[3::2], sys.argv[4::2])]:
    src.resize((size, size), Image.NEAREST).save(out)
`
  if (process.platform !== 'darwin') {
    execFileSync('python3', ['-c', script, source, png], { stdio: 'inherit' })
    return
  }
  const iconset = fs.mkdtempSync(path.join(os.tmpdir(), 'luminode-')) + '/icon.iconset'
  fs.mkdirSync(iconset)
  const sizes = []
  for (const base of [16, 32, 128, 256, 512]) {
    sizes.push(String(base), path.join(iconset, `icon_${base}x${base}.png`))
    sizes.push(String(base * 2), path.join(iconset, `icon_${base}x${base}@2x.png`))
  }
  execFileSync('python3', ['-c', script, source, png, ...sizes], { stdio: 'inherit' })
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(buildDir, 'icon.icns')], { stdio: 'inherit' })
}

function copy (from, to) {
  if (!fs.existsSync(from)) return
  fs.cpSync(from, to, { recursive: true })
}

function stageLentes () {
  if (!fs.existsSync(path.join(lenteRoot, 'luminode.app.json'))) {
    throw new Error(`LENTES not found at ${lenteRoot}. Set LENTES_DIR.`)
  }
  const target = path.join(buildDir, 'apps', 'lente')
  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(target, { recursive: true })
  for (const entry of ['index.html', 'output.html', 'luminode.app.json', 'src', 'assets', 'fonts', 'examples', 'LICENSE', 'NOTICE.md']) {
    copy(path.join(lenteRoot, entry), path.join(target, entry))
  }
  copy(
    path.join(lenteRoot, 'node_modules', 'tweakpane', 'dist'),
    path.join(target, 'node_modules', 'tweakpane', 'dist')
  )
}

/**
 * npm flattens the framework's symlinks into plain copies, which codesign
 * rejects as an ambiguous bundle. Rebuild the standard layout; the addon
 * resolves it through @executable_path/../Frameworks.
 */
function stageSyphon () {
  if (process.platform !== 'darwin') return
  const source = path.join(hostDir, 'node_modules', '@napolab', 'texture-bridge-darwin-arm64', 'Syphon.framework', 'Versions', 'A')
  const target = path.join(buildDir, 'Syphon.framework')
  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(path.join(target, 'Versions'), { recursive: true })
  fs.cpSync(source, path.join(target, 'Versions', 'A'), { recursive: true })
  fs.symlinkSync('A', path.join(target, 'Versions', 'Current'))
  for (const entry of ['Syphon', 'Headers', 'Modules', 'Resources']) {
    fs.symlinkSync(path.join('Versions', 'Current', entry), path.join(target, entry))
  }
}

fs.mkdirSync(buildDir, { recursive: true })
ensureSite()
makeIcons()
stageLentes()
stageSyphon()
console.log('[prepare-build] icons and bundled apps staged in', buildDir)
