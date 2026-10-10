const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('luminodeOutput', {
  resize (width, height) {
    ipcRenderer.send('luminode:output-size', { width, height })
  }
})
