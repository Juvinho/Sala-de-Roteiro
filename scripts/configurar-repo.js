// Uso: npm run configurar-repo -- seu-usuario/nome-do-repositorio
// (também aceita o endereço completo: https://github.com/seu-usuario/nome-do-repositorio)
const fs = require("fs");
const path = require("path");
const arg = (process.argv[2] || "").trim().replace(/\.git$/, "");
const m = /(?:github\.com[/:])?([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)\/?$/.exec(arg);
if (!m) {
  console.error("Diga qual é o repositório. Exemplo:\n  npm run configurar-repo -- seu-usuario/sala-de-roteiro-95");
  process.exit(1);
}
const [, owner, repo] = m;
const arq = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(arq, "utf8"));
pkg.repository = `https://github.com/${owner}/${repo}`;
pkg.build.publish = Object.assign({}, pkg.build.publish, { provider: "github", owner, repo });
fs.writeFileSync(arq, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Pronto. A Sala de Roteiro vai procurar atualizações em github.com/${owner}/${repo}/releases`);
