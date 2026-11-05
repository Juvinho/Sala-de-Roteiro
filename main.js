// ScriptRoom — processo principal do Electron (antes chamado Sala de Roteiro 95).
// Guarda cada roteiro, ficha, série e versão como um .json em Documentos\ScriptRoom,
// abre os acessórios (Bloco de notas, Calculadora…) em janelas próprias e cuida das atualizações.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// As preferências (tema, zoom, lista do SmartType) ficam na pasta interna do nome antigo,
// para quem atualizou da Sala de Roteiro 95 não perder nada.
app.setPath("userData", path.join(app.getPath("appData"), "Sala de Roteiro 95"));

let autoUpdater = null;
try { ({ autoUpdater } = require("electron-updater")); } catch (err) { console.error("electron-updater indisponível:", err.message); }

const COLECOES = ["roteiros", "versoes", "personagens", "notas", "series", "modelos", "mapas"];
const ID_OK = /^[A-Za-z0-9_.-]{1,120}$/;
const ACESSORIOS = {
  notas: { width: 600, height: 520, resizable: true },
  calc: { width: 320, height: 470, resizable: false },
  crono: { width: 380, height: 500, resizable: true },
  mapa: { width: 470, height: 440, resizable: true },
  localizar: { width: 440, height: 250, resizable: false, filha: true },
};
let DATA = "";
let win = null;
const ferramentas = new Map();
const idDe = (wc) => { if (win && wc === win.webContents) return "main"; for (const [id, w] of ferramentas) if (!w.isDestroyed() && w.webContents === wc) return id; return ""; };

function pastaDados() {
  const nova = path.join(app.getPath("documents"), "ScriptRoom");
  const antiga = path.join(app.getPath("documents"), "Sala de Roteiro 95");
  DATA = nova;
  // Primeira vez com o nome novo: a pasta antiga só muda de nome. Se o Windows não deixar
  // (OneDrive ou antivírus segurando um arquivo), continua usando a pasta antiga.
  if (!fs.existsSync(nova) && fs.existsSync(antiga)) {
    try { fs.renameSync(antiga, nova); } catch (err) { DATA = antiga; }
  }
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
function lerTudo(colecao) {
  const dir = caminho(colecao);
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { out.push({ id: f.slice(0, -5), data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }); }
    catch (err) { console.error("Arquivo ilegível ignorado:", f, err.message); }
  }
  return out;
}
function gravar(colecao, id, data) {
  const alvo = caminho(colecao, id);
  const tmp = alvo + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1), "utf8");
  fs.renameSync(tmp, alvo); // gravação atômica
}
function paraLixeira(colecao, id) {
  const alvo = caminho(colecao, id);
  if (!fs.existsSync(alvo)) return false;
  fs.mkdirSync(lixeira(), { recursive: true });
  fs.renameSync(alvo, path.join(lixeira(), `${colecao}~${id}~${Date.now()}.json`));
  return true;
}
ipcMain.handle("db:readAll", (_e, colecao) => lerTudo(colecao));
ipcMain.handle("db:write", (e, colecao, id, data) => {
  gravar(colecao, id, data);
  avisarOutras(e.sender, colecao, id);
  if (lanServidor && LAN_COLS.includes(colecao)) lanTodos({ k: "doc", c: colecao, id, data, from: "host" }, "host");
  return true;
});
ipcMain.handle("db:remove", (e, colecao, id) => {
  if (paraLixeira(colecao, id)) {
    avisarOutras(e.sender, colecao, id);
    if (lanServidor && LAN_COLS.includes(colecao)) lanTodos({ k: "del", c: colecao, id, from: "host" }, "host");
  }
  return true;
});

/* ---------- Sala na rede local: quem hospeda vira o servidor, os outros entram pelo IP ----------
   Uma conexão TCP por pessoa, uma mensagem JSON por linha. Os roteiros ficam na pasta de quem
   hospeda; quem entra recebe tudo, escreve, e o anfitrião grava e repassa para os outros. */
const net = require("net");
const os = require("os");
const LAN_PORTA = 4795;
const LAN_COLS = ["roteiros", "personagens", "series", "mapas"];
const LAN_MAX = 8 * 1024 * 1024;            // uma linha (um roteiro inteiro) até 8 MB
const LAN_MAX_PESSOAS = 16;
const TOPICO_OK = /^[a-z][a-z0-9_.-]{0,47}$/;
let lanServidor = null, lanSenha = "", lanHostPres = {}, lanCliente = null;
const lanConexoes = new Map();               // peer -> { sock, ok, presence }
const lanIps = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
function lanParaJanela(m) { if (win && !win.isDestroyed()) win.webContents.send("lan:event", m); }
function manda(sock, m) { try { if (!sock.destroyed) sock.write(JSON.stringify(m) + "\n"); } catch (err) { /* conexão caiu */ } }
function porLinha(sock, cb) {
  let buf = "";
  sock.setEncoding("utf8");
  sock.on("data", (ch) => {
    buf += ch;
    if (buf.length > LAN_MAX) { sock.destroy(); return; }
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const l = buf.slice(0, i); buf = buf.slice(i + 1);
      if (!l.trim()) continue;
      let m; try { m = JSON.parse(l); } catch (err) { continue; }
      if (m && typeof m === "object" && !Array.isArray(m)) cb(m);
    }
  });
}
const presencaOk = (p) => (p && typeof p === "object" && !Array.isArray(p) && JSON.stringify(p).length <= 4096 ? p : {});
function lanPeers() { return [{ peer: "host", presence: lanHostPres }, ...[...lanConexoes].filter(([, c]) => c.ok).map(([peer, c]) => ({ peer, presence: c.presence }))]; }
function lanTodos(m, exceto) {
  for (const [peer, c] of lanConexoes) if (c.ok && peer !== exceto) manda(c.sock, m);
  if (exceto !== "host") lanParaJanela(m);
}
const lanAvisarPeers = () => lanTodos({ k: "peers", peers: lanPeers() });
function lanDoAnfitriao(peer, m) {             // mensagens de quem entrou
  if (m.k === "pres") { const c = lanConexoes.get(peer); c.presence = presencaOk(Object.assign({}, c.presence, presencaOk(m.p))); lanAvisarPeers(); return; }
  if (m.k === "emit") { if (TOPICO_OK.test(String(m.topic)) && JSON.stringify(m.data === undefined ? null : m.data).length <= 4096) lanTodos({ k: "msg", peer, topic: m.topic, data: m.data }); return; }
  if (m.k === "set" && LAN_COLS.includes(m.c) && ID_OK.test(String(m.id)) && m.data && typeof m.data === "object") {
    try { gravar(m.c, m.id, m.data); } catch (err) { return; }
    lanTodos({ k: "doc", c: m.c, id: m.id, data: m.data, from: peer }, peer); return;
  }
  if (m.k === "del" && LAN_COLS.includes(m.c) && ID_OK.test(String(m.id))) { try { if (paraLixeira(m.c, m.id)) lanTodos({ k: "del", c: m.c, id: m.id, from: peer }, peer); } catch (err) { /* ignora */ } }
}
function lanParar() {
  if (lanServidor) { for (const [, c] of lanConexoes) { manda(c.sock, { k: "encerrada" }); c.sock.end(); setTimeout(() => c.sock.destroy(), 500); } lanConexoes.clear(); lanServidor.close(); lanServidor = null; }
  if (lanCliente) { lanCliente.removeAllListeners("close"); lanCliente.destroy(); lanCliente = null; }
}
ipcMain.handle("lan:host", (_e, senha, presenca) => new Promise((resolve) => {
  lanParar();
  lanSenha = String(senha || ""); lanHostPres = presencaOk(presenca);
  const srv = net.createServer((sock) => {
    if (lanConexoes.size >= LAN_MAX_PESSOAS) { manda(sock, { k: "denied", motivo: "cheia" }); sock.end(); return; }
    const peer = "p" + Math.random().toString(36).slice(2, 10);
    const c = { sock, ok: false, presence: {} };
    lanConexoes.set(peer, c);
    sock.setKeepAlive(true, 10000);
    porLinha(sock, (m) => {
      if (!c.ok) {
        if (m.k !== "hello") return;
        if (lanSenha && m.senha !== lanSenha) { manda(sock, { k: "denied", motivo: "senha" }); sock.end(); return; }
        c.ok = true; c.presence = presencaOk(m.p);
        manda(sock, { k: "welcome", you: peer, host: os.hostname(), docs: Object.fromEntries(LAN_COLS.map((col) => [col, lerTudo(col)])) });
        lanAvisarPeers(); return;
      }
      lanDoAnfitriao(peer, m);
    });
    const sai = () => { if (lanConexoes.delete(peer)) lanAvisarPeers(); };
    sock.on("close", sai); sock.on("error", sai);
  });
  srv.on("error", (err) => { lanServidor = null; resolve({ ok: false, erro: err.code === "EADDRINUSE" ? `A porta ${LAN_PORTA} já está em uso. Outro ScriptRoom já está hospedando neste computador?` : err.message }); });
  srv.listen(LAN_PORTA, "0.0.0.0", () => { lanServidor = srv; resolve({ ok: true, ips: lanIps(), porta: LAN_PORTA, nome: os.hostname() }); setTimeout(lanAvisarPeers, 50); });
}));
ipcMain.handle("lan:join", (_e, ip, senha, presenca) => new Promise((resolve) => {
  lanParar();
  const host = String(ip || "").trim();
  if (!/^[A-Za-z0-9.:-]{1,253}$/.test(host)) { resolve({ ok: false, erro: "Esse endereço não parece um IP." }); return; }
  const sock = net.connect({ host, port: LAN_PORTA });
  let pronto = false;
  const t = setTimeout(() => { if (!pronto) { sock.destroy(); resolve({ ok: false, erro: "Ninguém respondeu nesse IP. Confira o número e se a sala está aberta." }); } }, 8000);
  sock.on("connect", () => { pronto = true; clearTimeout(t); lanCliente = sock; sock.setKeepAlive(true, 10000); manda(sock, { k: "hello", senha: String(senha || ""), p: presencaOk(presenca) }); resolve({ ok: true }); });
  sock.on("error", (err) => { if (!pronto) { clearTimeout(t); resolve({ ok: false, erro: err.code === "ECONNREFUSED" ? "Esse computador não está hospedando uma sala (ou o firewall bloqueou)." : err.message }); } });
  porLinha(sock, (m) => lanParaJanela(m));
  sock.on("close", () => { if (lanCliente === sock) { lanCliente = null; lanParaJanela({ k: "fechou" }); } });
}));
ipcMain.handle("lan:send", (_e, m) => {
  if (!m || typeof m !== "object") return false;
  if (lanServidor) {                            // o anfitrião também é uma pessoa na sala
    if (m.k === "pres") { lanHostPres = presencaOk(Object.assign({}, lanHostPres, presencaOk(m.p))); lanAvisarPeers(); }
    else if (m.k === "emit" && TOPICO_OK.test(String(m.topic))) lanTodos({ k: "msg", peer: "host", topic: m.topic, data: m.data });
    return true;
  }
  if (lanCliente) { manda(lanCliente, m); return true; }
  return false;
});
ipcMain.handle("lan:stop", () => { lanParar(); return true; });
ipcMain.handle("lan:ips", () => lanIps());
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
ipcMain.handle("win:open", (e, id) => {
  if (id === "splash") { abrirSplashManual(); return true; }
  const cfg = ACESSORIOS[id];
  const dono = idDe(e.sender);
  if (!cfg) throw new Error("acessório desconhecido");
  const aberta = ferramentas.get(id);
  if (aberta && !aberta.isDestroyed()) { if (aberta.isMinimized()) aberta.restore(); aberta.focus(); return true; }
  const w = new BrowserWindow({
    width: cfg.width, height: cfg.height, minWidth: 260, minHeight: 200, resizable: cfg.resizable, maximizable: false,
    parent: cfg.filha ? BrowserWindow.fromWebContents(e.sender) || undefined : undefined, skipTaskbar: !!cfg.filha,
    frame: false, show: false, backgroundColor: "#C0C0C0", icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
  });
  protegerNavegacao(w);
  w.once("ready-to-show", () => w.show());
  w.on("closed", () => ferramentas.delete(id));
  w.loadFile(path.join(__dirname, "app", "index.html"), { query: { janela: id, dono } });
  ferramentas.set(id, w);
  return true;
});
ipcMain.handle("app:send", (e, type, payload) => {
  if (win && !win.isDestroyed() && e.sender !== win.webContents) win.webContents.send("app:message", { type, payload });
});
// recado de uma janela para outra (ex.: Localizar → Bloco de notas)
ipcMain.handle("app:sendTo", (e, alvo, type, payload) => {
  const w = alvo === "main" ? win : ferramentas.get(alvo);
  if (w && !w.isDestroyed()) w.webContents.send("app:message", { type, payload, from: idDe(e.sender) });
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
// Janelas soltas: a janela principal abre uma janela filha em branco e muda o diálogo para
// dentro dela (o código continua o mesmo). Só "about:blank" com nome sr-pop… é aceito.
const soltas = new Map();
function protegerNavegacao(w) {
  w.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (w === win && url === "about:blank" && /^sr-pop(-modal)?-[A-Za-z0-9_-]{1,40}$/.test(frameName || "")) {
      const modal = frameName.startsWith("sr-pop-modal");
      return { action: "allow", overrideBrowserWindowOptions: {
        frame: false, parent: win, modal, show: true, resizable: true, minimizable: !modal, maximizable: false, fullscreenable: true,
        skipTaskbar: true, backgroundColor: "#C0C0C0", minWidth: 200, minHeight: 60, icon: path.join(__dirname, "build", "icon.png"),
        webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
      } };
    }
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  w.webContents.on("did-create-window", (filha, { frameName }) => {
    if (!/^sr-pop/.test(frameName || "")) return;
    soltas.set(frameName, filha);
    filha.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    filha.webContents.on("will-navigate", (e) => e.preventDefault());
    filha.on("closed", () => soltas.delete(frameName));
  });
  w.webContents.on("will-navigate", (e) => e.preventDefault());
}
ipcMain.handle("pop:cmd", (e, nome, cmd, a, b) => {
  if (!win || e.sender !== win.webContents) return false;
  const j = soltas.get(nome);
  if (!j || j.isDestroyed()) return false;
  if (cmd === "min") j.minimize();
  else if (cmd === "focus") { if (j.isMinimized()) j.restore(); j.focus(); }
  else if (cmd === "toggle") { if (j.isMinimized()) { j.restore(); j.focus(); } else if (j.isFocused()) j.minimize(); else j.focus(); }
  else if (cmd === "size" && Number.isFinite(a) && Number.isFinite(b)) j.setContentSize(Math.max(200, Math.min(4000, Math.round(a))), Math.max(60, Math.min(3000, Math.round(b))));
  else if (cmd === "pos" && Number.isFinite(a) && Number.isFinite(b)) j.setPosition(Math.round(a), Math.round(b));
  return true;
});
let splash = null;
let splashPronto = false;
let mainPronta = false;

function transitarParaPrincipal() {
  if (!mainPronta || !splashPronto) return;
  if (win && !win.isDestroyed()) {
    win.maximize();
    win.show();
    win.focus();
  }
  if (splash && !splash.isDestroyed()) {
    splash.destroy();
    splash = null;
  }
}

function criarSplash() {
  splash = new BrowserWindow({
    width: 620, height: 350, frame: false, resizable: false, center: true,
    show: false, alwaysOnTop: true, skipTaskbar: false, backgroundColor: "#C6BFA6",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  protegerNavegacao(splash);
  splash.once("ready-to-show", () => {
    if (splash && !splash.isDestroyed()) splash.show();
  });
  splash.loadFile(path.join(__dirname, "app", "splash.html"));
}

function abrirSplashManual() {
  const manual = new BrowserWindow({
    width: 620, height: 350, frame: false, resizable: false, center: true,
    show: false, alwaysOnTop: false, parent: win && !win.isDestroyed() ? win : undefined,
    backgroundColor: "#C6BFA6", icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  protegerNavegacao(manual);
  manual.once("ready-to-show", () => manual.show());
  manual.loadFile(path.join(__dirname, "app", "splash.html"), { query: { modo: "sobre" } });
}

ipcMain.handle("splash:done", () => {
  splashPronto = true;
  transitarParaPrincipal();
  return true;
});

ipcMain.handle("app:splash", () => {
  abrirSplashManual();
  return true;
});

function criarJanela() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 820, minHeight: 560,
    frame: false, show: false, backgroundColor: "#008080", title: "ScriptRoom",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true },
  });
  win.webContents.session.setSpellCheckerLanguages(["pt-BR"]);
  protegerNavegacao(win);
  win.once("ready-to-show", () => {
    mainPronta = true;
    transitarParaPrincipal();
  });
  win.on("closed", () => { win = null; for (const w of ferramentas.values()) if (!w.isDestroyed()) w.close(); app.quit(); });
  win.loadFile(path.join(__dirname, "app", "index.html"));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    criarSplash();
    pastaDados();
    criarJanela();
    // Fallback de segurança: após 6 segundos garante que a tela principal não fique invisível
    setTimeout(() => {
      mainPronta = true;
      splashPronto = true;
      transitarParaPrincipal();
    }, 6000);
  });
  app.on("window-all-closed", () => app.quit());
}
