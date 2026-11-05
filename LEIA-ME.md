# ScriptRoom

*Antes chamado Sala de Roteiro 95.*

Editor de roteiros de TV com cara de programa de 1995. Nasceu para **Fundação Varguelia** e hoje
escreve qualquer série: drama, telenovela, comédia de situação, policial, antologia, minissérie,
telefilme, desenho animado, radionovela e humorístico de esquetes.
Este projeto transforma o ScriptRoom num programa de verdade para Windows, com um
**instalador clássico** (SETUP.EXE com assistente, contrato de licença, fundo azul em tela cheia,
atalho na área de trabalho e desinstalador).

Já vem com os roteiros **EP16 a EP20**: eles são copiados para a sua pasta de dados na primeira vez
que o programa abre.

---

## 1. O que instalar antes (uma vez só)

1. **Node.js LTS** (versão 20 ou mais nova): https://nodejs.org. Instale com as opções padrão.
2. **VS Code**, que você já tem.

Para conferir, abra um terminal e rode `node -v`. Tem que aparecer `v20…` ou maior.

## 2. Abrir no VS Code

1. Descompacte o zip numa pasta **sem acento e fora do OneDrive**, por exemplo `C:\Projetos\sala-de-roteiro-95`.
   O OneDrive costuma travar a compilação.
2. No VS Code: **File › Open Folder…** e escolha a pasta.
3. Abra o terminal (**Terminal › New Terminal**) e rode:

```
npm install
```

Isso baixa o Electron e o gerador de instalador (uns 300 MB, só na primeira vez).

## 3. Rodar o programa (sem instalar)

```
npm start
```

Ou aperte **F5** no VS Code: a configuração "Rodar o ScriptRoom" já está pronta.

## 4. Gerar o instalador

```
npm run instalador
```

Quando terminar, o instalador estará em:

```
dist\SETUP_SCRIPTROOM_5.3.0.exe
```

Dê dois cliques nele e siga o assistente: **Avançar › Aceito › Avançar › Instalar › Concluir**.

Prefere um .exe que roda sem instalar (pendrive, por exemplo)? Use `npm run portatil`.
O arquivo sai como `dist\ScriptRoom_portatil.exe`.

No VS Code também dá para usar **Terminal › Run Task…**, que lista as quatro tarefas
(instalar dependências, rodar, gerar instalador e gerar portátil).

---

## Recursos de produção (menu Produção e botão direito)

- **Revisões coloridas:** Produção › Revisões › Nova revisão. Enquanto ela estiver ativa, tudo o que
  você escreve ganha um **\*** na margem direita, na tela e no PDF, e o cabeçalho das páginas
  mudadas mostra a cor e a data (Azul, Rosa, Amarela… na ordem da indústria). "Desde uma
  versão…" marca de uma vez tudo o que mudou desde uma versão guardada.
- **Numeração travada:** Produção › Travar numeração de cenas. Uma cena nova entre a 12 e a 13
  vira **12A**, e uma cena cortada vira **OMITIDA** (botão direito no cabeçalho), sem renumerar o resto.
- **(CONT.) automático** quando o personagem volta a falar depois de uma ação (Formatar).
- **Transição** (Alt+9): CORTA PARA:, FUSÃO:, alinhada à direita.
- **Notas de roteiro:** botão direito › Nota de roteiro. Ficam grifadas em amarelo, aparecem na aba
  Notas do painel e não saem no PDF nem no .docx.
- **Falas alternativas:** botão direito numa fala › Falas alternativas. Guarda outras versões da
  mesma fala para trocar depois.
- **Análise técnica:** selecione palavras, botão direito › Marcar para análise técnica. Produção ›
  Análise técnica mostra a folha de cada cena por departamento e exporta em .csv.
- **Exportar PDF…** com opções: folha de rosto, marcas de revisão, só um trecho de cenas, marca
  d'água e **cópias nominais** (um PDF por pessoa, com o nome dela na marca d'água).

## Bíblia do mundo e exportar a temporada (versão 5.3)

- **Produção › Bíblia do mundo:** um wiki da série com lugares, facções, instituições, objetos,
  termos, eventos, espécies, tecnologias e idiomas. Cada verbete tem descrição, outras grafias
  ("a Fundação", "FV") e **quando** acontece no mundo, para montar a **linha do tempo**. A
  bíblia mora dentro da série e vai junto para a sala na rede.
  - Os termos ficam **sublinhados em roxo** na página. **Alt+clique** num deles abre o verbete.
  - Escreveu de outro jeito ("Varguélia", "Tencry")? Fica sublinhado **em vermelho**, aparece na
    Revisão, e o verbete oferece **Trocar** ou **Trocar todas**.
  - **Sugerir a partir dos roteiros:** traz os lugares dos cabeçalhos e os nomes próprios que
    aparecem no meio das frases; é só marcar os que interessam.
  - "Aparece em" mostra em quais episódios cada termo aparece e quantas vezes.
- **Arquivo › Exportar a temporada:** todos os roteiros da série (ou os que você marcar) em PDF,
  Word, Final Draft e Fountain, mais a escaleta de cada um, num .zip só com uma pasta por formato.
- **Arquivo › Reiniciar** agora salva, fecha todas as janelas e volta para a tela de começo.

## Para escritor de série (versão 5.2)

- **Plantar e colher:** botão direito num trecho › Plantar e colher › Plantar aqui. Dê um nome
  ("o rifle roxo brilha perto de mentira"). Onde a pista paga a conta, em qualquer episódio da
  série: botão direito › Plantar e colher › Colher. Um 🌱 na margem mostra o que foi plantado
  (amarelo enquanto não for colhido) e um 🌾 o que colhe. **Produção › Plantar e colher** lista o
  que ainda falta colher na série inteira, e avisa se algo é colhido antes de ser plantado.
- **Ferramentas › Gerador de nomes do mundo:** aprende com os nomes do seu elenco e inventa
  nomes novos com o mesmo sotaque. Cole nomes de lugares ou de uma língua inventada para ele
  aprender também. Clique em + para criar a ficha no Elenco.
- **Continuidade na Revisão:** personagem em dois lugares numa cena MESMO INSTANTE, cena
  CONTÍNUO com o tempo pulando, item da análise técnica que sumiu do texto, personagem que fala
  antes de ser apresentado em MAIÚSCULAS (quando os episódios anteriores estão na sala) e
  plantes esquecidos no último episódio.
- **Ferramentas › Diário de escrita:** mapa de calor das palavras escritas em cada dia do ano,
  sequência de dias seguidos, recorde, melhor dia e dias em que a meta foi batida.
- **Exibir › Modo foco** (Ctrl+Shift+F): só a cena em que você está fica acesa.

## Desfazer de verdade, histórico, rede de personagens e teleprompter (versão 5.1)

- **Ctrl+Z palavra por palavra:** cada palavra digitada é um passo, e também conta como passo
  trocar de escrever para apagar, colar um texto ou mudar de elemento. Depois de desfazer, o cursor
  vai para onde a mudança aconteceu. A barra de status diz o que foi desfeito. Ctrl+Z dentro de
  um campo (busca, painel) desfaz só o campo. Cabem 500 passos por roteiro.
- **Editar › Histórico de alterações:** a lista de tudo o que você fez desde que abriu o roteiro
  ("Escreveu “Agora é sério.” em Fala", "Novo elemento: Cena"…). Clique em qualquer passo para
  voltar até ele; os passos desfeitos continuam lá, em cinza, para refazer.
- **Exibir › Rede de personagens:** um mapa de quem contracena com quem, do roteiro ou da série
  inteira. O tamanho do círculo é o número de falas; a grossura da linha, as cenas em comum.
  Clique num nome para ver com quem ele contracena e com quem nunca divide cena. Salva em .svg.
- **Exibir › Teleprompter:** o roteiro rolando em letra grande a partir da cena onde está o
  cursor, com contagem 3, 2, 1, velocidade, tamanho da letra, **espelhar** (para teleprompter
  com vidro), **destacar** as falas de um personagem (ensaio de ator) e tela cheia. Espaço roda e
  pausa; as setas mudam a velocidade. No programa instalado, arraste a janela para o outro monitor.

## Tela de começo e janelas soltas (versão 5.0)

- **Tela de começo:** o ScriptRoom abre sem nenhum roteiro aberto, na janela **Bem-vindo ao
  ScriptRoom**: *Continuar de onde parei*, Novo roteiro, Abrir, Importar, Nova série, Modelos,
  Sala na rede e a lista de roteiros recentes com busca (digite e aperte Enter para abrir).
  **Arquivo › Fechar roteiro** (Ctrl+F4) volta para ela. Para abrir direto no último roteiro,
  desmarque "Mostrar esta tela ao abrir o ScriptRoom".
- **Janelas soltas:** no programa instalado, toda janela vira uma janela de verdade do Windows,
  como o Bloco de notas. Dá para arrastar para fora do ScriptRoom e levar para o outro monitor.
  As janelas de consulta (Estrutura, Análise técnica, Revisões, Relatórios, Comentários, Séries,
  Localizar, Lixeira, Sala na rede, Bate-papo) não travam o roteiro e aparecem na barra de
  tarefas. As de pergunta (Excluir?, Exportar PDF…) travam até você responder, como no Windows 95.
  Para voltar ao jeito antigo: **Exibir › Janelas soltas**.

## Sala na rede local: escrever junto pelo IP (versão 4.9)

No programa instalado, **Ferramentas › Sala na rede local (IP)…**:

1. Quem vai **hospedar** clica em **Hospedar sala** (a senha é opcional). Aparece o IP deste
   computador, por exemplo `192.168.0.12`. Os roteiros da sala são os desta máquina.
2. Os outros digitam esse IP (e a senha) e clicam em **Entrar na sala**. Cada um recebe os
   roteiros, as fichas e as séries de quem hospeda.
3. Pronto: todo mundo vê quem está na sala (bandeja e margem), o texto chega ao vivo, as
   mudanças de duas pessoas se juntam, dá para **seguir** alguém e usar o **bate-papo** (Ctrl+Shift+B).

- Tudo o que é escrito fica gravado no computador de quem hospeda, e quem entrou guarda uma
  cópia. Se a conexão cair, cada um continua escrevendo; ao entrar de novo, as mudanças se juntam.
- Se você já tinha uma cópia diferente de um roteiro da sala, ela fica guardada em **Versões**
  ("Minha cópia antes de entrar na sala") antes de ser trocada pela da sala.
- Roteiros novos criados por quem entrou vão para a sala. Os outros roteiros seus ficam só com você.
- Usa a porta **4795**. Na primeira vez que hospedar, o Windows pergunta se o ScriptRoom pode
  usar a rede: marque **Redes privadas** e clique em **Permitir**. Se clicou em Cancelar sem
  querer: Painel de Controle › Firewall do Windows Defender › Permitir um aplicativo.
- Funciona na mesma rede (casa, escritório, estúdio). Para gente em outra cidade, usem uma
  rede virtual como Tailscale ou ZeroTier e digitem o IP que ela mostra.
- Todo mundo precisa estar com o ScriptRoom 4.9 ou mais novo.

## Novo nome e Final Draft (versão 4.8)

- **ScriptRoom:** o programa mudou de nome. Ao atualizar, a pasta `Documentos\Sala de Roteiro 95`
  vira `Documentos\ScriptRoom` sozinha, na primeira vez que o programa abre (se o OneDrive ou o
  antivírus não deixarem, ele continua usando a pasta antiga). Tema, zoom e listas do SmartType
  ficam como estavam. A atualização instala por cima da versão antiga; se sobrar um atalho
  "Sala de Roteiro 95" na área de trabalho, pode apagar.
- **Final Draft (.fdx):** Arquivo › Exportar para Final Draft gera um .fdx que abre no Final Draft
  8 ou mais novo: cabeçalhos com número de cena, ação, personagem, rubrica, fala, transição, atos,
  diálogo simultâneo, página nova, resumo da cena e folha de rosto. Arquivo › Importar também lê
  .fdx. Os comentários não vão para o .fdx: use o .docx, que leva os comentários do Word.
- **Beat Board** (Exibir): uma mesa livre de ideias. Dois cliques no fundo criam um beat; arraste
  pelo topo, ligue beats com setas, escolha a cor, ligue cada beat a uma cena ou crie a cena a
  partir dele. “Beats das cenas” cria um cartão para cada cena que ainda não tem.

## Sala ao vivo: escrever junto (versão 4.7, só na versão web)

A versão web do ScriptRoom (o link do claude.ai) agora é uma sala de roteiro de verdade:
compartilhe o link pelo menu **Compartilhar** do claude.ai, com acesso de **Colaborador**, e
escrevam juntos.

- **Quem está na sala:** o ícone de pessoas na bandeja mostra quantos estão com a Sala aberta.
  Ferramentas › **Sala ao vivo…** lista cada um, em que roteiro está, e tem **Ir até** e **Seguir**
  (a sua tela acompanha a da outra pessoa, bom para leitura com a equipe).
- **Na margem**, uma etiqueta colorida com o nome mostra o trecho em que cada pessoa está; um ✎
  aparece enquanto ela digita, e o texto chega letra a letra.
- **Mesclagem:** se duas pessoas mexem em trechos diferentes ao mesmo tempo, as duas mudanças
  ficam. Se mexem no mesmo trecho, fica a versão de quem está olhando e a Sala avisa.
  Comentários de duas pessoas se somam.
- **Bate-papo** (Ctrl+Shift+B): mensagens rápidas, com o "uh-oh" de 1996. Não ficam guardadas.

No programa instalado (.exe) cada um escreve no próprio computador, como antes.

## Comentários e plano de filmagem (versão 4.6)

- **Comentários com autor:** selecione um trecho e aperte **Ctrl+Alt+M** (ou botão direito ›
  Comentar…). O trecho fica grifado em amarelo e ganha um balão na margem esquerda. Clique no
  balão para responder, resolver ou excluir. A aba **Notas** lista todos, com filtro de abertos e
  resolvidos e exportação em .txt.
- **Comentários no Word:** os comentários abertos vão para o .docx como comentários de verdade do
  Word, com as respostas. Se o diretor comentar no Word e devolver o arquivo, importe o .docx:
  os comentários dele aparecem na Sala.
- **Oitavos de página:** o painel de cenas mostra o tamanho de cada cena como a produção conta
  (1 3/8 pág.).
- **Plano de filmagem** (Produção ou Exibir): cada cena vira uma faixa colorida (branco interior
  de dia, amarelo exterior de dia, azul interior de noite, verde exterior de noite) com local,
  oitavos e o número de cada personagem do elenco.
  - Arraste as faixas (ou use ▲▼) e coloque as divisões **Fim do dia**.
  - **Montar os dias…** faz isso sozinho: junta as cenas do mesmo local, grava o dia antes da
    noite e respeita o limite de páginas por dia.
  - **Diárias do elenco:** em que dias cada personagem grava (I início, T trabalho, F fim, E espera).
  - **Ordem do dia:** data, chamada, cenas, elenco, locais e as necessidades tiradas da análise
    técnica, com exportação em .docx de um dia ou de todos.

## Recursos do Final Draft (versão 4.5)

- **Diálogo simultâneo:** botão direito no nome do segundo personagem, logo depois da fala do
  primeiro › **Diálogo simultâneo**. As duas falas ficam lado a lado na tela, no PDF, no .docx
  (tabela de duas colunas sem borda) e no Fountain (o `^` depois do nome).
- **(MAIS) e (CONT.):** uma fala comprida que chega no pé da página é dividida: a página termina
  com (MAIS) e a seguinte começa com o nome do personagem e (CONT.). Desliga em Formatar ›
  Dividir falas longas entre páginas.
- **SmartType completo:** na cena, depois do “ — ”, o autocompletar oferece NOITE, MADRUGADA,
  CONTÍNUO…; no personagem, abra um parêntese para ver (V.O.), (O.S.), (NA FITA)…; na transição,
  a lista aparece assim que você entra nela. Ferramentas › Listas do SmartType… edita as listas.
- **Destaques na página:** o que você marcou na análise técnica fica pintado com a cor de cada
  departamento (Exibir › Mostrar a análise técnica na página). No painel Personagens, a caixinha
  ao lado de cada nome pinta todas as falas dele, ótimo para ensaiar um papel.
- **Estrutura do episódio** (Exibir): as cenas numa linha do tempo, cada uma do tamanho da
  duração, com os atos, a porcentagem de cada ato e os pontos de virada. Marque os pontos com o
  botão direito no cabeçalho da cena › Ponto de estrutura (Gancho, Incidente, Clímax…). Eles
  também aparecem nos cartões do quadro.
- **Página nova a partir daqui:** botão direito em qualquer elemento. Vale para a tela, o PDF, o
  .docx e o Fountain (`===`).
- **Cabeçalho das páginas editável** em Formatar › Página e margens, com {serie} {codigo}
  {titulo} {episodio} {pagina}.
- **PDF de filmagem:** a opção “Número da cena nas duas margens” no Exportar PDF.

## Página, margens e PDF

- **Régua:** arraste os quadradinhos das pontas para mudar as margens da página e os triângulos
  (azul e vermelho) para mudar o recuo do elemento em que o cursor está: personagem, fala ou
  rubrica. Dois cliques na régua abrem a janela de página.
- **Formatar › Página e margens…** traz seis modelos com prévia: Padrão da Sala, Roteiro
  americano, Papel ofício, Novela brasileira, Radionovela e Rascunho econômico. Vale para a
  série inteira ou só para um roteiro, e mostra quantas páginas o roteiro teria.
- **Arquivo › Exportar PDF** gera o roteiro paginado com folha de rosto e número de página,
  usando as mesmas margens. **Exportar escaleta** gera a lista de cenas com sinopse em .docx.

## Acessórios em janelas próprias

No programa instalado, estes acessórios abrem como janelas separadas do Windows: dá para arrastar
para fora da janela principal, levar para outro monitor, e cada um aparece na barra de tarefas.

- **Bloco de notas** (F5 põe data e hora, quebra automática de linha). **Localizar e
  substituir** (Ctrl+F, F3 para a próxima) abre numa janela própria, que você pode arrastar
  para qualquer lugar da tela
- **Calculadora de minutagem**: entende `2:45 × 12`, `55:30 − 48:10`, `1:02:00 ÷ 4`
- **Cronômetro da leitura**: espaço inicia, L marca o fim de cada cena
- **Mapa de caracteres**: ë, ö, —, “ ” e companhia, inseridos onde o cursor estava no roteiro

Ficam em **Ferramentas** ou em **Iniciar › Acessórios**.

## Séries

Cada série tem os próprios roteiros, elenco, calendário de exibição e regras de revisão.

- **Arquivo › Nova série…** abre o assistente: formato, nome, canal, dia de exibição, duração e o
  primeiro roteiro.
- **Arquivo › Séries…** lista todas as séries, com propriedades, exportação em .zip e exclusão.
- **Exibir › Planejamento da temporada** mostra etapa, logline e prazo de entrega de cada roteiro.
- **Arquivo › Salvar como modelo…** guarda a estrutura do roteiro aberto para reaproveitar.
- No painel **Versões**, **Comparar** mostra o que entrou e o que saiu desde aquela versão.

A Fundação Varguelia vira automaticamente a primeira série na primeira vez que a versão 4.1 abre.

## Onde ficam os seus roteiros

```
Documentos\ScriptRoom\
   roteiros\      um .json por episódio (ep-16.json, ep-17.json…)
   personagens\   uma ficha por personagem
   versoes\       versões guardadas (automáticas e com nome)
   notas\         o Bloco de notas da sala
   series\        uma ficha por série (canal, dia de exibição, formato)
   modelos\       os modelos que você salvar
   .lixeira\      o que você exclui vem para cá (Arquivo › Lixeira da sala… restaura)
```

- No programa: **Arquivo › Abrir pasta dos roteiros**.
- **Desinstalar não apaga essa pasta.**
- Para levar tudo para outro PC, copie a pasta inteira ou use **Arquivo › Fazer backup (.json)**.
- Cada arquivo é gravado de forma atômica (primeiro num temporário, depois renomeado),
  então uma queda de energia no meio do salvamento não corrompe o roteiro.

---

## Problemas comuns

**"O Windows protegeu o computador" ao abrir o SETUP.**
É o SmartScreen. Ele avisa em qualquer programa sem assinatura digital paga, não é vírus.
Clique em **Mais informações › Executar assim mesmo**. Para sumir com o aviso de vez, só
comprando um certificado de assinatura de código.

**Erro `Cannot create symbolic link` ou `privilege not held` no `npm run instalador`.**
O gerador precisa criar atalhos de arquivo. Resolva de um destes jeitos:
- ative o **Modo de Desenvolvedor** do Windows (Configurações › Privacidade e segurança › Para desenvolvedores), ou
- abra o VS Code **como administrador** e rode de novo.

**Erro citando `BGGradient` ou `BGFont`.**
É o fundo azul em tela cheia. Apague as duas linhas que começam com `BGFont` e `BGGradient`
em `build\installer.nsh`. O instalador continua funcionando, só sem o fundo.

**"Não foi possível procurar atualizações".**
Confira se rodou o `configurar-repo`, se o repositório é público e se já existe pelo menos uma
Release publicada pelo Actions. Antivírus ou firewall corporativo também podem bloquear o acesso.

**O programa abre sem a fonte pixelada dos números.**
A fonte VT323 vem da internet. Sem conexão, o programa usa uma fonte monoespaçada do Windows.
Tahoma e Courier New, as fontes principais, já vêm no Windows.

---

## Estrutura do projeto

```
main.js            processo principal: janelas, arquivos em Documentos, lixeira, atualizações, sala na rede
preload.js         ponte segura entre a página e o Windows (só a pasta da sala e as janelas do app)
scripts\          configurar-repo.js, que liga o projeto ao seu repositório
.github\workflows\ instalador.yml, que gera e publica o SETUP quando você cria uma tag
app\index.html     o programa inteiro (o mesmo da versão na web)
app\seed\          roteiros que vêm de fábrica (EP16 a EP20)
build\             ícone, imagens e textos do instalador
  icon.ico / icon.png         claquete em pixel art
  installerSidebar.bmp        faixa lateral do assistente (164×314)
  installerHeader.bmp         cabeçalho das páginas (150×57)
  licenca.txt                 o contrato de licença do assistente
  installer.nsh               fundo azul em tela cheia e textos de boas-vindas
package.json       versões e configuração do instalador
```

Para mudar a versão que aparece no instalador, edite `"version"` no `package.json`.
Para trocar o visual do assistente, substitua os BMPs em `build\` mantendo os mesmos tamanhos,
salvos como BMP de 24 bits.
