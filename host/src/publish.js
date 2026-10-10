import { ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const hostDir = path.dirname(fileURLToPath(import.meta.url))
const MAX_SIDE = 7680

let bridge = null
let publishedId = null

function validSize (width, height) {
  return Number.isInteger(width) && Number.isInteger(height) &&
    width >= 16 && height >= 16 && width <= MAX_SIDE && height <= MAX_SIDE
}

ipcMain.on('luminode:output-size', (event, size) => {
  if (!bridge || bridge.isDisposed) return
  if (event.sender !== bridge.renderWindow.webContents) return
  const width = Math.round(Number(size?.width))
  const height = Math.round(Number(size?.height))
  if (!validSize(width, height)) return
  try {
    bridge.resize(width, height)
  } catch (error) {
    console.error('[luminode-host] resize failed:', error)
  }
})

/**
 * Publish an app's output page (not its operator window) through Syphon on
 * macOS or Spout on Windows. The page reports its program size through the
 * output preload and the sender follows it.
 */
export async function publishOutput ({ id, name, url, width, height, frameRate }) {
  const { createTextureBridge } = await import('@napolab/texture-bridge-renderer')
  stopPublishing()
  bridge = await createTextureBridge({
    name,
    width,
    height,
    frameRate,
    rendererUrl: url,
    preview: { enabled: false },
    webPreferences: {
      preload: path.join(hostDir, 'output-preload.cjs'),
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false
    }
  })
  publishedId = id
  bridge.on('error', (error) => {
    console.error('[luminode-host] sender error:', error)
  })
  return bridge
}

export function stopPublishing () {
  if (bridge && !bridge.isDisposed) bridge.dispose()
  bridge = null
  publishedId = null
}

export function publishedAppId () {
  return bridge && !bridge.isDisposed ? publishedId : null
}
