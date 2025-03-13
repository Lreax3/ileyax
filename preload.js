const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    searchBestPrice: (productName) => ipcRenderer.invoke('search-best-price', productName),
    scrapeAmazon: () => ipcRenderer.invoke('scrape-amazon'),
});
