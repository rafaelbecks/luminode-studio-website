const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('luminodeHost', {
  launch (payload) {
    ipcRenderer.send('luminode:launch', payload)
  }
})
