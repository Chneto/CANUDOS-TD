# Canudos: A Última Resistência — notas da versão 0.5

**Data:** 19/10/2026
**Parte de:** `NOTAS_v0.4.md` (o desenho em pixel art) e `NOTAS_v0.3.md` (Conselheiro e menu)
**Estado:** jogável. Testado com `testes/simular.js`, `testes/campanha.js`, no navegador e com capturas. Ninguém jogou a campanha inteira com o mouse ainda.

## 1. O que mudou

Os quatro pedidos do Miguel em 19/10:

| Pedido | O que foi feito | Onde |
|---|---|---|
| O herói anda em vez de só ser posicionado | Clique nele e depois numa casa (ou use o botão direito): ele vai andando até lá. Isso vale também na preparação. | `nucleo.js` (Heróis andando), `ui.js` |
| 4 fases, uma por expedição | Cada fase tem 10 ondas que endurecem aos poucos, e cada uma começa do zero. | `dados.js` (`expedicoes`), `nucleo.js` (Campanha) |
| A história entre as fases | Prólogo; antes de cada fase, o contexto; depois, o que aconteceu de fato. O epílogo vem depois da fase 4. | `historia.js`, `ui.js` (História) |
| Isométrico, mas na horizontal | Ele escolheu **tela cheia**: o mapa ocupa a janela inteira e o desenho se adapta ao formato dela. Materiais, onda e botões ficam por cima, nas bordas. "Como jogar" foi para o menu. | `index.html`, `render_pixel.js` (`criarProjecao` com aspecto), `ui.js` (`ajustarTela`) |

## 2. O herói andando

- **Rota:** o Conselheiro calcula o caminho (A* na grade, em 8 direções) contornando pedra, mato fechado, rio e estruturas. Depois enxuga a rota para andar em diagonal quando a linha está livre.
- **Velocidade:** anda a 30 px/s no combate. Na preparação anda a 70 px/s, porque o tempo da batalha está parado e ele só se reposiciona.
- **Aura:** continua só valendo com ele parado. Uma obra nova no caminho faz o herói recalcular a rota.
- **No mapa:** o caminho aparece como trilha dourada pontilhada, com um X no destino. Ele anda com a animação de passo.
- **Outros heróis:** as funções (`rotaHeroi`, `andarHeroi`, `atualizarHerois`) recebem o herói como parâmetro. Um segundo herói precisa de dados próprios, de um lugar no estado e de entrar em `atualizarHerois`.

## 3. Fases, ondas e inimigos novos

| Fase | Expedição | Materiais | Vigor | Crescimento por onda | Inimigos que entram |
|---|---|---:|---:|---:|---|
| 1 · Uauá | 1ª, nov. 1896 | 120 | 1,0 | +10% | infantaria; batedores na onda 4 |
| 2 · Serra do Cambaio | 2ª, jan. 1897 | 180 | 1,1 | +10% | sapadores na onda 3 |
| 3 · Belo Monte, março | 3ª, fev.–mar. 1897 | 260 | 1,1 | +5% | oficial na onda 4 |
| 4 · O cerco | 4ª, jun.–out. 1897 | 340 | 1,2 | +5,5% | todos, em maior número |

- **Os números:** todos são `[v0.5]`, provisórios. Vigor multiplica a vida das tropas, e o crescimento soma vigor a cada onda. A onda 6 de cada fase é de respiro.
- **Os inimigos novos:** são tipos de jogo, não reconstrução histórica, e o GDD já os trazia como arquétipos.
  - **Batedores:** rápidos e frágeis.
  - **Sapadores:** lentos; o golpe na barricada vale três vezes o da infantaria.
  - **Oficial:** quem marcha a até 2 casas dele leva 30% menos dano; vale 15 materiais.
- **Na tela:**
  - **Avisos:** o aviso da preparação descreve a onda ("16 de infantaria, 2 sapadores e 1 oficial") e avisa quando um tipo aparece pela primeira vez na fase.
  - **Desenho:** cada tipo tem visual próprio.
    - **Batedor:** brim claro e passo largo.
    - **Sapador:** avental de couro e picareta.
    - **Oficial:** faixa vermelha, dourado e espada.

### Balanceamento (`node testes/campanha.js`)

| Robô | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---|---|---|---|---|
| Bom: atiradores onde cobrem mais estrada, barricadas onde mais atiradores alcançam, Conselheiro no meio | vence (100) | vence (100) | vence por pouco (10) | vence (100) |
| Bom, mas exagera nas barricadas | vence | perde na onda 8 | perde na onda 8 | perde na onda 4 |
| Ingênuo: 2 atiradores e só | perde na onda 3 | perde na onda 2 | perde na onda 1 | perde na onda 1 |

A defesa costuma segurar tudo ou cair de uma vez. Depois que o Miguel jogar, vale ajustar `crescimento` e as ondas 8 a 10 de cada fase.

## 4. A história

- **Conteúdo:** prólogo (Belo Monte, 1893 a 1896), antes e depois de cada expedição e epílogo ("Canudos não se rendeu", com abertura diferente se o jogador venceu ou perdeu a fase 4).
- **Fontes:**
  - **Onde conferi:** Euclides da Cunha, Os Sertões (1902), e o verbete "Guerra de Canudos" da Wikipédia.
  - **Faixas em vez de número único:** onde as fontes divergem, o texto dá a faixa (população, efetivo da 4ª expedição, mortos).
  - **Data em aberto:** o dia exato do ataque de Moreira César (3 ou 4 de março) varia; o texto diz "no começo de março".
- **Tom:** o epílogo diz o que aconteceu, incluindo as degolas de prisioneiros, sem enfeite. Se o jogador vencer a fase 4, o texto diz "No jogo, Belo Monte resistiu às quatro expedições. Na história, não."
- **Lugar das batalhas:** no jogo, toda batalha acontece na estrada que chega ao arraial, inclusive Uauá e Cambaio; a tela de abertura de cada fase avisa isso.
- **Atalhos de endereço:** `#historia` abre direto o prólogo; `#jogar` pula o menu.

## 5. Pendências

- Jogar a campanha inteira com o mouse e ajustar a dificuldade a partir disso.
- A tela no celular funciona, mas fica apertada; o alvo continua sendo PC.
- O desenho em aquarela (`?estilo=aquarela`) não ganhou os inimigos novos nem a trilha do herói.
- Próximos passos de jogo continuam os da v0.3: prévia da onda, melhorias roguelite entre ondas e o açude.
