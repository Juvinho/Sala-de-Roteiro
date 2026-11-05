// Ponte segura entre a página e o Windows: só estas funções ficam visíveis para o app.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("salaNative", {
  readAll: (colecao) => ipcRenderer.invoke("db:readAll", colecao),
  write: (colecao, id, data) => ipcRenderer.invoke("db:write", colecao, id, data),
  remove: (colecao, id) => ipcRenderer.invoke("db:remove", colecao, id),
  saveAs: (nome, bytes) => ipcRenderer.invoke("file:saveAs", nome, bytes),
  minimize: () => ipcRenderer.invoke("win:min"),
  maximize: () => ipcRenderer.invoke("win:max"),
  close: () => ipcRenderer.invoke("win:close"),
  openWindow: (id) => ipcRenderer.invoke("win:open", id),
  sendToMain: (type, payload) => ipcRenderer.invoke("app:send", type, payload),
  sendTo: (alvo, type, payload) => ipcRenderer.invoke("app:sendTo", alvo, type, payload),
  openDataFolder: () => ipcRenderer.invoke("app:openData"),
  version: () => ipcRenderer.invoke("app:version"),
  trashList: () => ipcRenderer.invoke("trash:list"),
  trashRestore: (file) => ipcRenderer.invoke("trash:restore", file),
  trashEmpty: () => ipcRenderer.invoke("trash:empty"),
  checkUpdates: () => ipcRenderer.invoke("upd:check"),
  downloadUpdate: () => ipcRenderer.invoke("upd:download"),
  installUpdate: () => ipcRenderer.invoke("upd:install"),
  onEvent: (cb) => {
    ipcRenderer.on("upd:event", (_e, d) => cb("upd", d));
    ipcRenderer.on("app:message", (_e, d) => cb("msg", d));
    ipcRenderer.on("db:changed", (_e, d) => cb("db", d));
  },
});
