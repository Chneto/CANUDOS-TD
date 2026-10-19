# O gênero tower defense tem muito a ensinar ao protótipo 0.3 de Canudos

**Data:** 18/10/2026  
**Base:** protótipo 0.3 e documento de design (10 ondas, 4 inimigos, 5 estruturas, melhorias roguelite).  
**Método:** cada mecânica citada foi conferida em busca na web; o que não consegui confirmar está dito no texto. Os números sugeridos para Canudos são parâmetros de jogo para testar, não dados históricos.

---

## 1. Dez jogos e a lição concreta de cada um

### Kingdom Rush mostra a ameaça antes e separa poder de rotina de poder decisivo
Torres só em pontos fixos perto da estrada; o quartel solta soldados que seguram o inimigo no corpo a corpo enquanto os arqueiros atiram, um soldado por inimigo, com ponto de reunião ajustável. Os dois poderes têm recargas opostas: reforços a cada 10 s, chuva de fogo a cada 80 s. Chamar a onda antes rende ouro e adianta as recargas pelo tempo poupado, e os ícones na entrada mostram o que vem. Cada fase traz um inimigo que contraria uma torre, com fases de respiro entre as difíceis. Heróis sobem até o nível 10 dentro da fase e voltam depois de cair.

### Bloons TD 6 força especialização com uma regra curta
Cada torre tem três caminhos de melhoria, mas só dois podem ser usados, e só um passa do nível 2: uma regra que sozinha cria escolhas excludentes. Há um herói por partida; ele ganha experiência no fim de cada rodada e libera habilidades ao subir de nível. Progressão por rodada, e não por abate, serve a um campeão que não ataca. O Monkey Knowledge, árvore de bônus permanentes, é o exemplo do que evitar.

### Defense Grid deixa o jogador ver o problema antes de errar
O jogador exibe o alcance das torres e o caminho dos inimigos durante a partida. A vida são núcleos de energia: o alien que carrega um núcleo e morre o deixa cair, e o núcleo volta flutuando devagar, uma segunda chance visível. Recursos guardados rendem juros. Concluir uma fase libera versões-desafio do mesmo mapa.

### Rogue Tower transforma terreno alto em decisão
Torres ganham dano conforme a elevação, e os pontos altos são poucos: posicionar vira escolher qual torre merece o melhor lugar. A cada fase o jogador escolhe para onde a rota cresce, e ela se divide. Cartas aleatórias trazem torres e melhorias; a experiência acumulada põe cartas novas no sorteio e compra pequenos bônus permanentes.

### Isle of Arrows controla a sorte e prova que dá para fazer sozinho
É obra de um estúdio de uma pessoa (Gridpop, de Daniel Lutz). As peças são sorteadas, mas o jogo garante certo número de torres, estradas e construções a cada tantas peças, e moedas pagam o descarte da peça indesejada. Tabernas fortalecem torres de arqueiros vizinhas: bônus por adjacência legível no tabuleiro. A queixa mais comum é que, nos níveis altos, a sorte decide mais que a habilidade.

### Thronefall diz de onde vem o ataque e expõe o risco das opções dominantes
Constrói-se de dia e defende-se à noite. Segundo resenhas (a loja não cita), antes da noite o jogo mostra tipo, quantidade e direção dos inimigos. Prédios de economia só rendem ouro se sobreviverem à noite. O jogador leva até 5 vantagens de um conjunto de mais de 50 e pode ligar modificadores que aumentam a dificuldade em troca de pontuação. As críticas ensinam: inimigos difíceis de distinguir e melhorias com uma opção claramente superior.

### Plants vs. Zombies apresenta um inimigo por vez
O ensino fica espalhado pelo jogo, e as fases introduzem zumbis novos aos poucos. O almanaque se preenche à medida que o jogador encontra plantas e zumbis. O cortador de grama é a última defesa: um por faixa, uso único na fase, e cada um que sobra vira dinheiro no fim. Não confirmei se o jogo mostra os zumbis da fase antes de ela começar.

### Orcs Must Die! pesa cada inimigo pelo estrago que causa
Cada orc que chega à fenda tira um ponto; criaturas grandes tiram mais. Antes da fase, o jogador escolhe até dez armadilhas e fica preso à escolha. A nota final depende dos pontos que sobraram e do tempo.

### Arknights separa quem bloqueia de quem atira pelo tipo de casa
Unidades corpo a corpo vão no chão, onde os inimigos passam; unidades à distância, em casas altas. Canudos já usa essa regra (barricada na estrada, atiradores fora), o que confirma que ela é legível. Cada unidade segura um número fixo de inimigos; recolhê-la devolve parte do custo e impõe espera para recolocar. O modo roguelike usa colecionáveis que mudam a partida, alguns com desvantagem embutida.

### Kingdom Two Crowns tem um líder que não luta
O monarca não tem como se defender. Ele age gastando moedas: recruta e manda construir, e os construtores executam. Perder a coroa encerra a tentativa, mas o reino segue com o herdeiro, parcialmente destruído. É o modelo mais próximo do Conselheiro: uma presença que organiza o trabalho dos outros.

*Dungeon Warfare ficou de fora: suas lições se sobrepõem às de Orcs Must Die!, e não consegui confirmar como as barricadas da sequência desviam a rota.*

---

## 2. A lista priorizada começa pela clareza e termina no conteúdo

Critérios do documento de design: **C1** entende por que perdeu · **C2** posicionamento muda o resultado · **C3** duas estratégias viáveis · **C4** melhorias mudam decisões · **C5** dificuldade sobe aos poucos · **C6** interface clara.

### Fazer já (versões 0.4 e 0.5)

**1. Prévia da onda com ficha do inimigo novo.** Antes de cada onda, um painel mostra quantas tropas de cada tipo vêm. Quando há um tipo novo, uma ficha de duas linhas diz o que ele faz e como responder, por exemplo: "Engenharia: derruba barricadas bem mais rápido. Ponha atiradores antes da barricada."

*Origem: Kingdom Rush, Thronefall, Plants vs. Zombies · C1, C5, C6 · Custo baixo · Etapa: com as 10 ondas.*

**2. Curva das 10 ondas com um inimigo novo por vez.** Proposta para testar:

| Onda | Composição | O que ensina |
|---|---|---|
| 1–2 | Infantaria | Já existe |
| 3 | Infantaria + pequeno grupo de avançada, separado | A avançada atravessa o alcance rápido |
| 4 | Infantaria e avançada misturadas | Cobrir trechos longos |
| 5 | Primeira engenharia, atrás da infantaria | Barricada sozinha não segura |
| 6 | Respiro: menos tropas, mais materiais | Hora de investir |
| 7 | Primeiro comando, cercado de infantaria | Prioridade de alvo |
| 8–10 | Misturas crescentes até todos os tipos | Combinar respostas |

O comando deve tirar mais integridade ao entrar (40 em vez de 20, por exemplo), como as criaturas grandes de Orcs Must Die!, para a prioridade ficar evidente sem texto.

*Origem: Kingdom Rush, Plants vs. Zombies, Orcs Must Die! · C5 · Custo baixo (só `dados.js`) · Etapa: 10 ondas.*

**3. Mapa de cobertura na preparação.** Uma tecla pinta cada casa da estrada pelo número de atiradores que a alcançam, em vermelho quando é zero, reaproveitando o cálculo que hoje só aparece na derrota. Ao posicionar um atirador, a prévia diz quantas casas de estrada ele passa a cobrir. O jogador entende o erro antes de perder.

*Origem: Defense Grid · C1, C2, C6 · Custo baixo · Etapa: 0.4.*

**4. Barricada que diz quanto segura.** A prévia mostra o tempo de contenção: 300 de integridade ÷ 10 por golpe = 30 s contra uma tropa, dividido pelo número de tropas golpeando juntas. Se nenhum atirador alcança a casa, a prévia avisa "barricada sem cobertura", aviso que hoje só existe na derrota.

*Origem: Kingdom Rush (o soldado segura para o arqueiro atirar) · C1, C2 · Custo baixo · Etapa: 0.4.*

**5. Conselheiro com regras de presença, não de combate.** As tropas o ignoram: ele não é alvo, não perde vida, não morre. Anda devagar (0,5 casa/s, por exemplo) e a aura desliga enquanto caminha, voltando 2 s depois que ele para; assim, mudá-lo de lugar é uma decisão. O raio da aura e as recargas ficam sempre visíveis. Mutirão tem recarga longa (cerca de 80 s) e Prédica, curta (20 a 30 s). Recomendo trocar o "+dano" da Prédica por firmeza: barricadas perto dele perdem integridade pela metade por 8 s (motivo nos riscos).

*Origem: Kingdom Two Crowns, Arknights (reposicionar custa tempo), Kingdom Rush (recarga de rotina e decisiva) · C2 e pilar histórico · Custo baixo · Etapa: agora.*

**6. Melhorias roguelite que mudam regra, com sorteio controlado.** As 3 opções vêm sempre de categorias diferentes, como a garantia de peças do Isle of Arrows; re-sortear custa materiais, com preço crescente, como o descarte pago do mesmo jogo; no máximo uma das três é só aumento de número. Quinze melhorias bastam para começar. Exemplos:

| Categoria | Melhoria | Decisão que muda |
|---|---|---|
| Defesa | Escombros: barricada derrubada deixa 2 casas em que as tropas andam à metade da velocidade | Barricada no início do trecho coberto |
| Combate | Mira no comando: atiradores priorizam o comando | Abrir mão do alvo mais adiantado |
| Combate | Fogo cruzado: atirador com outro a até 2 casas ganha +1 de alcance | Agrupar em vez de espalhar |
| Organização | Mutirão itinerante: obras terminam quando o Conselheiro passa ao lado | Trajeto do Conselheiro |
| Sustentação | Planejamento: desmontar na preparação devolve 100% | Refazer a defesa a cada onda |
| Táticas | Contenção: tropa parada na barricada recebe +25% de dano | Barricada dentro de dois alcances |

Antes de fechar o conjunto, rodar `testes/simular.js` com cada melhoria e enfraquecer as que vencem muito mais que as outras, o problema apontado em Thronefall.

*Origem: Isle of Arrows, Thronefall · C3, C4 · Custo médio · Etapa: item 4 dos próximos passos da NOTAS_v0.2.*

### Médio prazo

**7. Açude: a obra que só o Conselheiro começa.** Um ponto fixo perto do Vaza-Barris recebe o açude. Ele custa materiais, só avança com o Conselheiro a até 3 casas e leva duas ondas; pronto, rende +10 materiais por onda e reforça o reparo do posto de socorro. A escolha passa a ser investir cedo, com o Conselheiro longe da linha de tiro, ou defender agora. Pode substituir o depósito de materiais e economizar uma estrutura.

*Origem: Kingdom Two Crowns (o líder paga, os construtores executam), Thronefall (renda condicionada) · C2, C3 e o papel histórico de construtor de açudes · Custo médio · Etapa: com depósito e posto de socorro.*

**8. Conselheiro evolui por onda, não por abate.** Depois das ondas 3, 6 e 9, o jogador escolhe 1 de 2 ofícios: "Mutirão também ergue uma barricada provisória" ou "Mutirão recarrega na metade do tempo"; "aura alcança mais 1 casa" ou "aura também acelera obras". Para não criar outro sistema, esses ofícios podem entrar como cartas de organização no sorteio comum.

*Origem: Bloons TD 6 · C4 · Custo médio · Etapa: depois do item 6.*

**9. Variantes excludentes para barricada e atiradores.** Cada estrutura ganha duas variantes, e o jogador escolhe uma: a regra do Bloons TD 6 em tamanho solo. Barricada: Trincheira (mais integridade, mais cara) ou Cerca de galhos (menos integridade, fere quem golpeia). Atiradores: Tocaia (mais alcance, menos cadência) ou Linha (o inverso).

*Origem: Bloons TD 6 · C3, C4 · Custo médio · Etapa: depois das melhorias.*

**10. Lajedos dão alcance.** Os lajedos já desenhados no mapa viram casas especiais e raras: atirador ali ganha +1 casa de alcance. Com o posto de observação nos pontos fixos, o terreno passa a pesar.

*Origem: Rogue Tower, Arknights · C2 · Custo baixo a médio · Etapa: com os pontos fixos (passo 2 da NOTAS_v0.2).*

**11. Porteira do arraial como último recurso.** Uma vez por partida, a primeira tropa que chegaria ao arraial é detida na porteira, sem dano; porteira intacta no fim rende pontos. A tela mostra quando ela foi usada e qual trecho estava descoberto.

*Origem: cortador de grama de Plants vs. Zombies · C5 sem ferir C1 · Custo baixo · Etapa: com as 10 ondas.*

**12. Desbloqueios que abrem opções, não que dão força.** Entre tentativas, desbloquear: variantes de melhorias que entram no sorteio (Rogue Tower); desafios com multiplicador de pontuação, como Seca (−30% de materiais iniciais), Marcha forçada (tropas +20% de velocidade) e Sem barricadas (Thronefall, Defense Grid); e registros históricos curtos que se abrem no primeiro encontro com cada inimigo e estrutura (almanaque de Plants vs. Zombies). A pontuação usa integridade restante e tempo, como em Orcs Must Die!.

*C5 e pilar histórico · Custo médio; o texto histórico revisado é a parte cara · Etapa: depois de 10 ondas balanceadas.*

### Talvez/depois

- **Antecipar a onda** (Kingdom Rush). Conflita com a preparação parada e com a escolha de melhoria entre ondas; só testar se as partidas passarem de 25 minutos. Custo baixo, mas mexe no ciclo.
- **Juros sobre materiais guardados** (Defense Grid). Só se o açude não bastar como estratégia econômica; juros tendem a dominar. Custo baixo.
- **Segunda entrada de rota nas ondas finais** (Rogue Tower). Custo alto: muda rota, balanceamento e explicação da derrota.
- **Eventos entre ondas** (Arknights, Isle of Arrows). Custo alto em escrita e pesquisa.
- **Escolher o arsenal antes da partida** (Orcs Must Die!). Só com mais de seis estruturas.

---

## 3. Riscos: o que não copiar

- **Poder permanente entre tentativas.** Monkey Knowledge, os bônus permanentes do Rogue Tower e as melhorias compradas em Orcs Must Die! tornam a dificuldade trivial e escondem se o balanceamento funciona. Desbloqueie opções, não força.
- **A profundidade do Bloons TD 6.** Vários caminhos e níveis por torre, dezenas de torres e heróis: fora do alcance de uma pessoa. O teto é duas variantes por estrutura.
- **Rota e peças aleatórias.** Custam balanceamento e enfraquecem a explicação da derrota, que depende de rota fixa. A principal queixa do Isle of Arrows é a sorte decidir.
- **Campeão de ação.** Herói que ataca, cai e volta em segundos (Kingdom Rush, Thronefall, Orcs Must Die!) contradiz o pilar e banaliza a figura. O Conselheiro não ataca, não é alvo e não tem cena de morte.
- **Experiência por abate.** Ganhar nível matando contradiz o papel do Conselheiro.
- **Prédica como multiplicador de dano.** Ligar a pregação ao aumento das mortes ecoa a imagem de fanatismo que a imprensa republicana da época usou contra o arraial. Prefira firmeza, organização e cuidado.
- **Tom cômico.** Inimigos caricatos e piadas não cabem num conflito que terminou com a destruição do arraial e a morte de milhares de moradores. Evite sangue, evite destacar contagem de abates (prefira "tropas detidas") e não faça modo infinito, que vira escalada de mortes sem fim.
- **Opção dominante.** Toda melhoria e variante passa pela simulação antes de entrar.
- **Barricadas em série.** Uma corrente de barricadas de 25 materiais num único trecho coberto pode virar a única estratégia. Contrapesos a testar: a engenharia, espaçamento mínimo de 2 casas ou custo crescente.

---

## 4. Fontes consultadas

Algumas páginas recusaram leitura direta (erros 402 e 403); nesses casos usei os trechos devolvidos pela busca, marcados *(via busca)*.

**Kingdom Rush**
- https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design
- https://kingdomrushtd.fandom.com/wiki/Category:Heroes *(via busca)*
- https://www.pocketgamer.com/kingdom-rush/best-heroes *(via busca)*
- https://ayumilove.net/kingdom-rush-walkthrough-guide/ *(via busca)*
- https://www.trueachievements.com/a382017/daring-achievement *(via busca)*

**Bloons TD 6**
- https://www.bloonswiki.com/Hero_(BTD6) *(via busca)*
- https://www.bloonswiki.com/Hero_XP *(via busca)*
- https://www.bloonswiki.com/Upgrades *(via busca)*
- https://www.bloonswiki.com/Strategy:Dart_Monkey_(BTD6) *(via busca)*
- https://www.bloonswiki.com/Monkey_Knowledge_(BTD6) *(via busca)*

**Defense Grid: The Awakening**
- https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening

**Rogue Tower**
- https://store.steampowered.com/app/1843760/Rogue_Tower/

**Isle of Arrows**
- https://store.steampowered.com/app/1946970/Isle_of_Arrows/
- https://vaporlens.app/app/1946970/isle_of_arrows *(via busca)*
- https://toucharcade.com/2022/04/14/isle-of-arrows-iphone-ipad-android-steam/ *(via busca)*

**Thronefall**
- https://store.steampowered.com/app/2239150/Thronefall/
- https://www.thesixthaxis.com/?p=442518
- https://www.siliconera.com/review-thronefall-is-a-beautifully-simplistic-rts-game/ *(via busca)*
- https://www.startmenu.co.uk/home/review-thronefall *(via busca)*
- https://www.elliotcsmith.com/thronefall/ *(via busca)*
- https://fingerguns.net/?p=23084 *(via busca)*
- https://steamah.com/thronefall-building-and-upgrade-tips/ *(via busca)*

**Plants vs. Zombies**
- https://plantsvszombies.wiki.gg/wiki/Lawn_Mower
- https://strategywiki.org/wiki/Plants_vs._Zombies/Suburban_Almanac *(via busca)*
- https://en.wikipedia.org/wiki/Plants_vs._Zombies *(via busca)*

**Orcs Must Die!**
- https://en.wikipedia.org/wiki/Orcs_Must_Die!

**Arknights**
- https://arknights.wiki.gg/wiki/Operator *(via busca)*
- https://arknights.wiki.gg/wiki/Operations *(via busca)*
- https://arknights.wiki.gg/wiki/Charger *(via busca)*
- https://arknights.wiki.gg/wiki/Integrated_Strategies *(via busca)*

**Kingdom Two Crowns**
- https://en.wikipedia.org/wiki/Kingdom_Two_Crowns
- https://pushsquare.com/reviews/ps4/kingdom_two_crowns *(via busca)*

**Dungeon Warfare 2** (consultado e descartado)
- https://store.steampowered.com/app/698540/Dungeon_Warfare_2/
