import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.lentes': 'application/json',
  '.glow': 'application/json'
}

function contentType (filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

export function resolveInside (root, requestPath) {
  const rootResolved = path.resolve(root)
  let decoded
  try {
    decoded = decodeURIComponent((requestPath || '/').split('?')[0])
  } catch {
    return null
  }
  const relative = decoded.replace(/^\/+/, '')
  const target = path.resolve(rootResolved, relative || '.')
  if (target !== rootResolved && !target.startsWith(rootResolved + path.sep)) return null
  return target
}

function isFile (file) {
  try {
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

/**
 * `spaFallback` serves index.html for extensionless paths (the studio site's
 * /software and /music routes). `remoteOrigin` redirects other missing files
 * there, so a packaged build can leave heavy media on the public site.
 */
export function createStaticServer (root, { spaFallback = false, remoteOrigin = '' } = {}) {
  const rootResolved = path.resolve(root)
  const server = http.createServer((request, response) => {
    const target = resolveInside(rootResolved, request.url)
    if (!target) {
      response.writeHead(403)
      response.end('forbidden')
      return
    }
    let file = target
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html')
    }
    if (!isFile(file) && spaFallback && !path.extname(target)) {
      file = path.join(rootResolved, 'index.html')
    }
    if (!isFile(file) && remoteOrigin) {
      response.writeHead(302, { location: new URL(request.url, remoteOrigin).href })
      response.end()
      return
    }
    if (!isFile(file)) {
      response.writeHead(404)
      response.end('not found')
      return
    }
    response.writeHead(200, {
      'content-type': contentType(file),
      'cache-control': 'no-cache'
    })
    fs.createReadStream(file).pipe(response)
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({
        url: `http://127.0.0.1:${port}/`,
        close () {
          return new Promise((done) => server.close(() => done()))
        }
      })
    })
  })
}
