const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    processImage: (imageFilePath, outputDirectory) => ipcRenderer.invoke('process-image', imageFilePath, outputDirectory),
    getMetadata: (path) => ipcRenderer.invoke('get-metadata', path),
    writeMetadataToImage: (data) => ipcRenderer.invoke('write-metadata-to-image', data)
});
