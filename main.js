// Sala de Roteiro 95 — processo principal do Electron.
// Guarda cada roteiro, ficha, série e versão como um .json em Documentos\Sala de Roteiro 95,
// abre os acessórios (Bloco de notas, Calculadora…) em janelas próprias e cuida das atualizações.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

let autoUpdater = null;
try { ({ autoUpdater } = require("electron-updater")); } catch (err) { console.error("electron-updater indisponível:", err.message); }

const COLECOES = ["roteiros", "versoes", "personagens", "notas", "series", "modelos"];
const ID_OK = /^[A-Za-z0-9_.-]{1,120}$/;
const ACESSORIOS = {
  notas: { width: 600, height: 520, resizable: true },
  calc: { width: 320, height: 470, resizable: false },
  crono: { width: 380, height: 500, resizable: true },
  mapa: { width: 470, height: 440, resizable: true },
};
let DATA = "";
let win = null;
const ferramentas = new Map();

function pastaDados() {
  DATA = path.join(app.getPath("documents"), "Sala de Roteiro 95");
  for (const c of COLECOES) fs.mkdirSync(path.join(DATA, c), { recursive: true });
  const marca = path.join(DATA, ".primeira-vez");
  const seed = path.join(__dirname, "app", "seed");
  if (!fs.existsSync(marca)) {
    const destino = path.join(DATA, "roteiros");
    if (fs.existsSync(seed) && fs.readdirSync(destino).length === 0) {
      for (const f of fs.readdirSync(seed)) if (f.endsWith(".json")) fs.copyFileSync(path.join(seed, f), path.join(destino, f));
    }
    fs.writeFileSync(marca, new Date().toISOString());
  }
}
function caminho(colecao, id) {
  if (!COLECOES.includes(colecao)) throw new Error("coleção inválida");
  if (id !== undefined && !ID_OK.test(id)) throw new Error("nome de arquivo inválido");
  return id === undefined ? path.join(DATA, colecao) : path.join(DATA, colecao, id + ".json");
}
const lixeira = () => path.join(DATA, ".lixeira");
// itens da lixeira: "colecao~id~quando.json" (4.2) ou "colecao-id-quando.json" (4.0 e 4.1)
function itemLixeira(f) {
  const m = /^([a-z]+)~([A-Za-z0-9_.-]+)~(\d+)\.json$/.exec(f) || /^([a-z]+)-([A-Za-z0-9_.-]+)-(\d+)\.json$/.exec(f);
  return m && COLECOES.includes(m[1]) && ID_OK.test(m[2]) ? { colecao: m[1], id: m[2], quando: +m[3] } : null;
}
// avisa as outras janelas que um arquivo mudou (ex.: o Bloco de notas salvou)
function avisarOutras(remetente, colecao, id) {
  for (const w of BrowserWindow.getAllWindows()) if (w.webContents !== remetente && !w.isDestroyed()) w.webContents.send("db:changed", { colecao, id });
}

/* ---------- arquivos ---------- */
ipcMain.handle("db:readAll", (_e, colecao) => {
  const dir = caminho(colecao);
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { out.push({ id: f.slice(0, -5), data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }); }
    catch (err) { console.error("Arquivo ilegível ignorado:", f, err.message); }
  }
  return out;
});
ipcMain.handle("db:write", (e, colecao, id, data) => {
  const alvo = caminho(colecao, id);
  const tmp = alvo + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1), "utf8");
  fs.renameSync(tmp, alvo); // gravação atômica
  avisarOutras(e.sender, colecao, id);
  return true;
});
ipcMain.handle("db:remove", (e, colecao, id) => {
  const alvo = caminho(colecao, id);
  if (fs.existsSync(alvo)) {
    fs.mkdirSync(lixeira(), { recursive: true });
    fs.renameSync(alvo, path.join(lixeira(), `${colecao}~${id}~${Date.now()}.json`));
    avisarOutras(e.sender, colecao, id);
  }
  return true;
});
ipcMain.handle("file:saveAs", async (e, nome, bytes) => {
  const dono = BrowserWindow.fromWebContents(e.sender) || win;
  const r = await dialog.showSaveDialog(dono, { title: "Salvar como", defaultPath: path.join(app.getPath("documents"), String(nome).replace(/[\\/:*?"<>|]/g, "_")) });
  if (r.canceled || !r.filePath) return { status: "declined" };
  fs.writeFileSync(r.filePath, Buffer.from(bytes));
  return { status: "saved", path: r.filePath };
});

/* ---------- lixeira ---------- */
ipcMain.handle("trash:list", () => {
  if (!fs.existsSync(lixeira())) return [];
  const out = [];
  for (const f of fs.readdirSync(lixeira())) {
    const it = itemLixeira(f);
    if (!it) continue;
    let data = null;
    try { data = JSON.parse(fs.readFileSync(path.join(lixeira(), f), "utf8")); } catch (err) { continue; }
    out.push({ file: f, colecao: it.colecao, id: it.id, quando: it.quando, data: { meta: data.meta && { serie: data.meta.serie, titulo: data.meta.titulo }, nome: data.nome, label: data.label } });
  }
  return out.sort((a, b) => b.quando - a.quando);
});
ipcMain.handle("trash:restore", (_e, file) => {
  const it = itemLixeira(String(file));
  if (!it || String(file).includes("/") || String(file).includes("\\")) throw new Error("item inválido");
  fs.renameSync(path.join(lixeira(), String(file)), caminho(it.colecao, it.id));
  return true;
});
ipcMain.handle("trash:empty", () => {
  if (fs.existsSync(lixeira())) for (const f of fs.readdirSync(lixeira())) if (itemLixeira(f)) fs.unlinkSync(path.join(lixeira(), f));
  return true;
});

/* ---------- janelas ---------- */
const janelaDe = (e) => BrowserWindow.fromWebContents(e.sender);
ipcMain.handle("win:min", (e) => { const w = janelaDe(e); if (w) w.minimize(); });
ipcMain.handle("win:max", (e) => { const w = janelaDe(e); if (w) w.isMaximized() ? w.unmaximize() : w.maximize(); });
ipcMain.handle("win:close", (e) => { const w = janelaDe(e); if (w) w.close(); });
ipcMain.handle("win:open", (_e, id) => {
  const cfg = ACESSORIOS[id];
  if (!cfg) throw new Error("acessório desconhecido");
  const aberta = ferramentas.get(id);
  if (aberta && !aberta.isDestroyed()) { if (aberta.isMinimized()) aberta.restore(); aberta.focus(); return true; }
  const w = new BrowserWindow({
    width: cfg.width, height: cfg.height, minWidth: 260, minHeight: 240, resizable: cfg.resizable, maximizable: false,
    frame: false, show: false, backgroundColor: "#C0C0C0", icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
  });
  protegerNavegacao(w);
  w.once("ready-to-show", () => w.show());
  w.on("closed", () => ferramentas.delete(id));
  w.loadFile(path.join(__dirname, "app", "index.html"), { query: { janela: id } });
  ferramentas.set(id, w);
  return true;
});
ipcMain.handle("app:send", (e, type, payload) => {
  if (win && !win.isDestroyed() && e.sender !== win.webContents) win.webContents.send("app:message", { type, payload });
});
ipcMain.handle("app:openData", () => shell.openPath(DATA));
ipcMain.handle("app:version", () => app.getVersion());

/* ---------- atualizações (GitHub Releases) ---------- */
function avisoAtualizacao(type, data) { if (win && !win.isDestroyed()) win.webContents.send("upd:event", Object.assign({ type }, data || {})); }
function semTags(t) { return String(t || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim(); }
if (autoUpdater) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("checking-for-update", () => avisoAtualizacao("checking"));
  autoUpdater.on("update-available", (i) => avisoAtualizacao("available", { version: i.version, notes: semTags(Array.isArray(i.releaseNotes) ? i.releaseNotes.map((n) => n.note).join("\n") : i.releaseNotes) }));
  autoUpdater.on("update-not-available", () => avisoAtualizacao("none", { version: app.getVersion() }));
  autoUpdater.on("download-progress", (p) => avisoAtualizacao("progress", { percent: p.percent, bps: p.bytesPerSecond, transferred: p.transferred, total: p.total }));
  autoUpdater.on("update-downloaded", (i) => avisoAtualizacao("downloaded", { version: i.version }));
  autoUpdater.on("error", (err) => avisoAtualizacao("error", { message: String((err && err.message) || err) }));
}
ipcMain.handle("upd:check", async () => {
  if (!app.isPackaged) return { ok: false, reason: "dev" };
  if (!autoUpdater) return { ok: false, reason: "missing", message: "electron-updater não está instalado" };
  try { await autoUpdater.checkForUpdates(); return { ok: true }; }
  catch (err) { return { ok: false, reason: "error", message: String((err && err.message) || err) }; }
});
ipcMain.handle("upd:download", async () => { if (autoUpdater) await autoUpdater.downloadUpdate(); });
ipcMain.handle("upd:install", () => { if (autoUpdater) setImmediate(() => autoUpdater.quitAndInstall(false, true)); });

/* ---------- janela principal ---------- */
function protegerNavegacao(w) {
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  w.webContents.on("will-navigate", (e) => e.preventDefault());
}
function criarJanela() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 820, minHeight: 560,
    frame: false, show: false, backgroundColor: "#008080", title: "Sala de Roteiro 95",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
  });
  win.webContents.session.setSpellCheckerLanguages(["pt-BR"]);
  protegerNavegacao(win);
  win.once("ready-to-show", () => { win.maximize(); win.show(); });
  win.on("closed", () => { win = null; for (const w of ferramentas.values()) if (!w.isDestroyed()) w.close(); app.quit(); });
  win.loadFile(path.join(__dirname, "app", "index.html"));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => { Menu.setApplicationMenu(null); pastaDados(); criarJanela(); });
  app.on("window-all-closed", () => app.quit());
}
