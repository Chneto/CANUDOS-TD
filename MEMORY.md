# MEMORY.md — Memória Persistente e Registro de Aprendizado das IAs

Este arquivo serve como **registro contínuo de aprendizado, lições técnicas e histórico de decisões** compartilhado entre Antigravity, Codex e Claude. Todas as IAs devem consultar este arquivo ao iniciar uma nova sessão ou antes de tentar resolver problemas conhecidos.

---

## 1. Lições Técnicas e Problemas Resolvidos

### 1.1 Bug das Imagens Pretas no FLUX.1 Schnell (Resolvido)
* **Sintoma:** Imagens geradas pelo script de lote em `assets/raw/` saíam com todos os pixels em 0.0 (preto absoluto).
* **Causa Raiz:**
  1. No WebUI Forge, o VAE padrão em ponto flutuante de 32 bits (fp32) estourava em `NaN` em GPUs de 6 GB VRAM durante a decodificação latente do FLUX.
  2. O payload da API não especificava `scheduler: "Simple"` nem `cfg_scale: 1.0`, fazendo o Forge cair no agendador padrão de Stable Diffusion clássico (que tenta usar CFG 7.0 e quebra a difusão de fluxo).
* **Solução Canônica:**
  - Configuração do Forge via API: `auto_vae_precision_bfloat16: True` e `forge_preset: "flux"`.
  - Parâmetros obrigatórios no payload: `sampler_name: "Euler"`, `scheduler: "Simple"`, `cfg_scale: 1.0`, `steps: 4 a 6`.
  - Scripts atualizados: [tools/flux_generator.py](tools/flux_generator.py) e [tools/batch_generate_mvp.py](tools/batch_generate_mvp.py).

### 1.2 Alinhamento das Barricadas e Pontos de Parada na Rota (Resolvido)
* **Sintoma:** O Codex identificou que as posições de barricada antigas `(6,1)` e `(7,1)` ficavam distantes da rota e não havia ponto para o inimigo parar e atacar.
* **Solução:** Antigravity atualizou a especificação para a **v1.1** em [docs/specs/map-mvp-specification.md](docs/specs/map-mvp-specification.md):
  - `site_b1`: células `(4,2)` e `(5,2)` -> `attack_stop_point = Vector2(192, 160)`
  - `site_b2`: células `(8,5)` e `(9,5)` -> `attack_stop_point = Vector2(448, 352)`
  - `site_b3`: células `(16,7)` e `(17,7)` -> `attack_stop_point = Vector2(960, 480)`
  - Todos os pontos estão matematicamente sobre a `Curve2D` do Godot.

### 1.3 Inimigo de Ponta-Cabeça na Curva (T17 — Resolvido por Claude)
* **Sintoma:** Ao percorrer a `Path2D`, o `Sprite2D` do soldado republicano girava para acompanhar a tangente do caminho, ficando de cabeça para baixo nas curvas sul e oeste.
* **Solução:** Definir `rotates = false` no nó `PathFollow2D` em [scenes/enemies/enemy_republican.tscn](scenes/enemies/enemy_republican.tscn) e em `scripts/systems/enemy.gd`. Em jogos 2D Top-Down, a entidade translada sem girar o sprite.

### 1.4 Alcance dos Atiradores nos Pontos Fixos F1 e F3 (T17 — Resolvido por Claude)
* **Sintoma:** Os pontos fixos F1 `(8,1)/(9,1)` e F3 `(2,8)/(3,8)` ficavam a mais de 220 px de distância da rota mais próxima, impossibilitando que atiradores posicionados neles disparassem contra os soldados.
* **Solução:**
  - F1 realocado para `(6,2)` e `(7,2)` (distância da descida: 128 px).
  - F3 realocado para `(12,8)` e `(13,8)` (distância da subida: 128 px).
  - Ambos agora cobrem as respectivas curvas da rota perfeitamente.

### 1.5 Unificação da Fonte de Dados Canônica (Resolvido)
* **Problema:** Existiam duas árvores de dados: `resources/definitions/` (usada pelo código do Codex e cena do mapa) e `resources/structures/` + `resources/enemies/` (geradas anteriormente).
* **Decisão:** **A pasta `resources/definitions/` é a fonte canônica definitiva.** Quaisquer referências devem apontar para:
  - `resources/definitions/barricade_basic.tres`
  - `resources/definitions/shooter_post.tres`
  - `resources/definitions/enemy_basic.tres`
  - `resources/maps/canudos_mvp.tres`

### 1.6 Sobreposição dos Botões da Barra Inferior e Corte do Conselheiro (T18 — Resolvido)
* **Sintoma:** Em resoluções padrão (1280x720, 1366x768 ou 1080p com escala), o botão de Antônio Conselheiro era esmagado por `flex-shrink: 1` e `minmax(0, 11em)`, reduzindo sua área de texto a ~7px enquanto seu texto transbordava, ficando encoberto pelo botão `[Q] Mutirão`.
* **Causa Raiz:** Ausência de `flex: 0 0 auto` / `min-width` no cartão do campeão, somada à largura fixa excessiva (`15.5em`, `13.5em`) dos demais botões, extrapolando a largura da janela para mais de 1600px.
* **Solução:**
  - Aplicação de `width: clamp()` dinâmico nas ferramentas e habilidades.
  - Bloqueio de esmagamento no campeão com `flex: 0 0 auto; min-width: 12em;` e `white-space: nowrap; text-overflow: ellipsis`.
  - Adição de breakpoint `@media (max-width: 1150px)` para recolhimento elegante das descrições longas em telas compactas.
  - Sincronização em `Miguel/Canudos/index.html`, `Miguel/Canudos_PC/jogo/index.html` e recompilação de `Canudos.exe`.

### 1.7 Frente 2 — Cenografia da Caatinga e Novos Props via FLUX (T19 — Resolvido)
* **Objetivo:** Superar a limitação de um cenário mono-cacto na Godot 4.3, integrando a rica botânica e geomorfologia da Caatinga sertaneja.
* **Execução:**
  - `prop_tree_juazeiro`: Juazeiro / Umbuzeiro de mata branca, galhos retorcidos e folhagem prateada.
  - `prop_rock_lajedo`: Lajedo de pedra granítica avermelhada, inserido como base dos pontos fixos elevados `[F]`.
  - `prop_house_taipa`: Casebres de pau-a-pique e taipa de mão com telhas coloniais compondo o Arraial ao redor da Igreja.
  - Pipeline executado no FLUX Schnell com `rembg` automático e integrado a `scenes/map/map.gd`.

### 1.8 Trilha Sonora Regional Nordestina (T20 — Resolvido)
* **Sonoridade Autêntica:** Síntese autoral em 44.1kHz estéreo 16-bit com física acústica Karplus-Strong para Viola Caipira, oscilador de sopro com harmônicos ímpares para Pífano/Flauta de taboca em Modo Nordestino (Mixolídio/Lídio), Zabumba grave de procissão e Triângulo metálico sincopado.
* **Loop Seamless:** Duração de 42,7 segundos com fade cruzado para repetição contínua.
* **Integração:** Adicionado `AudioStreamPlayer` em `scenes/map/map.tscn` (Godot 4.3) e botão `#bt-musica` com áudio HTML5 nos protótipos Web e PC.

### 1.9 Controle Contínuo de Volume, Rotação/Alinhamento de Câmera e Fidelidade Histórica (T21 — Resolvido)
* **Controle de Volume:** Substituído o botão binário sim/não por slider contínuo de 0% a 100% com indicador percentual, botão de mudo com ícone dinâmico (`🔇`/`🔈`/`🔉`/`🔊`), persistência em `localStorage` e desbloqueio suave de áudio ao primeiro clique/toque do jogador. No Godot 4.3, adicionado `HSlider` vinculado a `AudioServer.linear_to_db`.
* **Matemática da Câmera Zero-Lag:**
  - A rotação de $\theta_0 = -26,565^\circ$ ($-0,46364$ rad) em torno do centro do campo de batalha $(P.L/2, P.A/2)$ alinha perfeitamente o eixo $X$ da projeção isométrica 2:1 à horizontal do monitor, tornando o avanço das tropas paralelo às bordas superior e inferior da tela.
  - Implementada rotação via transformação afim de canvas 2D acelerada por hardware no momento do blit do buffer `B.cv` (evita refazer o buffer pesado procedural de chão, garantindo 60 FPS estáveis sem quebra de quadros ou artefatos).
  - Rotação livre 360° com arrasto do botão do meio do mouse (scroll drag), botão de ciclo `bt-camera` na barra superior, zoom suave com a roda do mouse e restauração rápida com a tecla `R` (`Shift+R` para isométrica pura de 0°).
  - Inversão analítica de matriz implementada em `pontoNaTela`:
    $$\begin{pmatrix} dx' \\ dy' \end{pmatrix} = \frac{1}{zoom} \begin{pmatrix} \cos(-\theta) & -\sin(-\theta) \\ \sin(-\theta) & \cos(-\theta) \end{pmatrix} \begin{pmatrix} sx - cx \\ sy - cy \end{pmatrix}$$
    garantindo que detecção de hover, anéis de alcance e cliques de colocação permaneçam 100% exatos em qualquer ângulo.
* **Fidelidade Histórica dos Sprites e Efeitos Atmosféricos:**
  - Jagunços: chapéu de couro legítimo com abas em meia-lua e barbicacho, gibão sertanejo e cartucheira diagonal.
  - Antônio Conselheiro: camisolão de brim azul escuro com drapeado detalhado, crucifixo peitoral de madeira e bordão de jurema.
  - Soldados Republicados: talabarte de couro branco cruzando a farda azul-ferrete, quepe com pala escura e baioneta de metal brilhante na ponta do fuzil Mauser.
  - VFX da Caatinga: partículas de poeira e cinzas avermelhadas/douradas flutuando suavemente com a brisa quente da Caatinga sobre o terreno.
  - Efeitos Sonoros Táteis (Web Audio API): disparos nítidos de fuzil jagunço, impactos sólidos em barricadas, duplo acorde ao concluir construções e aviso de berrante sertanejo ao iniciar cada onda.

### 1.10 Campeão Antônio Conselheiro no Godot 4.3 (T22 — Resolvido por Codex e Antigravity)
* **Objetivo:** Estabelecer a paridade técnica do campeão Antônio Conselheiro entre a versão protótipo e a arquitetura oficial Godot 4.3 (GDScript 2.0).
* **Estrutura Implementada:**
  - Cena dedicada [scenes/champion/champion_conselheiro.tscn](scenes/champion/champion_conselheiro.tscn) com script tipado [scripts/systems/champion_conselheiro.gd](scripts/systems/champion_conselheiro.gd).
  - Nó `Sprite2D` com textura canônica de pixel art `assets/sprites/champion_conselheiro.png` (camisolão azul-índigo, crucifixo peitoral de madeira, bordão de peregrino e aura circular pulsante).
  - **Aura de Presença (`AURA_RADIUS_PX = 192.0`):** estruturas defensivas (`DefenseStructure`) dentro do raio têm o cooldown de disparo reduzido (`shoot_interval * 0.8`), acelerando a cadência de tiro dos jagunços.
  - **Habilidade Ativa Mutirão (`[Q]`):** cura instantaneamente +150 HP em todas as barricadas dentro do raio da aura (cooldown de 18s).
  - **Habilidade Ativa Prédica (`[W]`):** ativação de fé coletiva que reduz o dano sofrido por barricadas em 50% por 8s (cooldown de 25s).
  - **Movimentação Tática Diferenciada:** velocidade de 140 px/s na fase de preparação (reposicionamento ágil) e 60 px/s em combate (passo firme de procissão).
  - **Integração no HUD do Godot:** botões dedicados `[3] Conselheiro`, `[Q] Mutirão` e `[W] Prédica` adicionados ao painel inferior de [scenes/map/map.tscn](scenes/map/map.tscn) e gerenciados em [scenes/map/map.gd](scenes/map/map.gd), incluindo suporte a atalhos de teclado (1, 2, 3, Q, W, Esc).

### 1.11 Pesquisa Histórica e Auditoria de Tom (T03 e T16 — Resolvido por Claude)
* **Guia Histórico Mínimo Canônico:** Criado em [docs/research/mvp-historical-guide.md](docs/research/mvp-historical-guide.md). Documenta as quatro expedições com armamento verídico de época, geografia da bacia do Vaza-Barris e matriz pedagógica de game design (evitando anacronismos, maniqueísmo barato ou caricaturas).
* **Auditoria de Compreensão e Tom:** Criada em [docs/research/audit-compreensao-tom.md](docs/research/audit-compreensao-tom.md) avaliando História, Acessibilidade, Loop e Tom (pontuação global 9.4/10).

### 1.12 Áudio Tátil Avançado e Sombras de Projeção (T23 — Resolvido por Antigravity)
* **Áudio Tátil:** Implementação de 4 novas assinaturas de síntese Web Audio API:
  - `mutirao`: sino de capela com ataque metálico puro (660Hz) e decaimento exponencial harmônico de 3 segundos.
  - `predica`: ressonância etérea de coro e harmônicos místicos.
  - `vitoria`: acorde triunfante maior (C-E-G-C) executado no timbre de pífano e viola sertaneja.
  - `derrota`: cadência menor melancólica sertaneja.
* **Profundidade Visual:** Projeção procedural de sombras elípticas de base suave (`rgba(0,0,0,0.28)`) sob todas as estruturas e barricadas na renderização isométrica, eliminando o efeito de sprite "flutuante" sobre o terreno.

### 1.13 Paridade Completa de Câmera 360°, Zoom, SFX e Floating Combat Text na Godot 4.3 (T24 — Resolvido)
* **Arquitetura da Câmera:** Implementado nó `CameraPivot` centrado em `(640, 352)` contendo uma `Camera2D` em `(-640, -352)`.
  - Permite rotação analítica suave em torno do centro do campo de batalha sem alterar o ponto de referência global (0,0) nos testes automatizados e em modo headless.
  - Rotação 360° interativa com o botão do meio do mouse (scroll drag).
  - Alinhamento perpendicular automático à rota central (-26,565° / -0,4636 rad) via botão no HUD ou tecla `C`.
  - Restauração rápida para 0° com a tecla `R`.
  - Zoom dinâmico com a roda do mouse (0,75x a 1,8x).
* **Efeitos Sonoros Dedicados (SFX):** Síntese em 44.1kHz estéreo de 7 arquivos WAV autênticos em `assets/audio/`:
  - `sfx_musket.wav`: tiro estalado de pólvora seca com eco de caatinga.
  - `sfx_impact.wav`: impacto sólido em madeira de aroeira e taipa.
  - `sfx_wave_horn.wav`: berrante rústico anunciando início do combate.
  - `sfx_mutirao.wav`: sino de bronze de capela sertaneja.
  - `sfx_predica.wav`: coro e acorde místico solene.
  - `sfx_victory.wav`: fanfarra modal nordestina (Modo Mixolídio).
  - `sfx_defeat.wav`: dobre fúnebre solene.
* **Feedback Visual de Combate:** Textos flutuantes animados com `Tween` indicando valores de dano em vermelho (-10) e cura de barricada em verde (+150 HP), além de partículas atmosféricas de poeira da Caatinga (`CaatingaDust`).

### 1.14 Arte Canônica de Capa e Menu de Canudos (T25 — Resolvido)
* **Pintura Digital de Capa (`capa.jpg`):** Criada em alta definição (1280x720) retratando o crepúsculo sobre a Caatinga e as Serras de Monte Santo, com a Igreja de Bom Jesus iluminada por vigília de velas, o casario de taipa do Arraial e a silhueta profética de Antônio Conselheiro.
* **Eliminação de Erros de Rede:** A imagem soluciona o erro 404 anteriormente reportado no console do jogo web/PC, enriquecendo o menu de abertura.
* **Compilação Nativa:** Recompilado `Miguel/Canudos_PC/Canudos.exe` via WebView2 com os novos assets e comportamentos.

### 1.15 Câmera Orbital Cônica em Funil sem Inversão e Pré-visualização Tática de Torres com Alcance (T26 — Resolvido)
* **Sintoma 1 (Câmera de Cabeça para Baixo):** A rotação anterior 2D girava a tela inteira sem restrição angular, causando inversão de 180° e deixando o mapa de cabeça para baixo.
* **Causa Raiz 1:** Aplicação de rotação livre 360° no plano de projeção 2D sem delimitação cônica do ponto de observação.
* **Solução 1 (Câmera Orbital em Funil):**
  - Limitado o arco de rotação para $[-0.628, +0.628]$ radianos ($\pm 36^\circ$), permitindo visão orbital panorâmica e cônica ao redor do vale da Caatinga sem qualquer risco de o mapa ou os textos ficarem invertidos.
  - O botão do HUD agora cicla entre três perspectivas táticas estritamente calibradas:
    - `0° Clássica` (visão frontal isométrica);
    - `-26,5° Alinhada` (perpendicular à rota dos soldados, paralela à tela);
    - `+26,5° Flanco` (visão do flanco oposto).
  - O movimento vertical do mouse durante o arrasto do scroll altera suavemente o zoom/elevação (efeito funil de $0.85\times$ a $1.75\times$).
  - No Godot 4.3 (`scenes/map/map.gd`), a rotação do `CameraPivot` foi fixada no mesmo arco $[-36^\circ, +36^\circ]$.

* **Sintoma 2 (Ausência de Alcance e Prévia ao Selecionar Torre):** Ao selecionar os atiradores/barricadas, não aparecia a prévia translúcida da torre nem o círculo de alcance ao mover o mouse.
* **Causa Raiz 2:** No código web (`ui.js`), não existia ouvinte de evento `pointermove` registrado no canvas `#tela`; `vis.hover` só era calculado no clique (`pointerdown`). Na Godot (`map.gd`), o método `_draw()` apenas destacava o retângulo da célula vazia sem desenhar a textura do atirador/barricada e sem o círculo de mira com raio tático de 220px.
* **Solução 2 (Prévia Dinâmica e Círculo Tático):**
  - Adicionado `pointermove` com atualização contínua de `vis.hover` no canvas web e no jogo nativo PC.
  - No `render_pixel.js`, ao detectar `vis.ferramenta`, o renderizador projeta na célula sob o cursor a elipse de alcance tático de 220px (`ovElipse(gx, gy, 220, 110, ...)`), a célula destacada e o sprite translúcido de Jagunços ou Barricada (`ctx.globalAlpha = 0.55`).
  - No Godot 4.3 (`map.gd`), carregadas as texturas canônicas `TEX_SNIPER` e `TEX_BARRICADE`, renderizando no `_draw()` o sprite fantasma e o círculo tracejado com retículo em cruz de alcance de 220px.
  - Testado e comprovado com screenshot Playwright E2E em `screenshot_previa_atiradores_suave.png`.

---

## 2. Padrões de Verificação Rápida

Para verificar a integridade da partida e dos sistemas sem necessidade de abrir a interface do Godot:
```bash
godot --headless --fixed-fps 60 --path . -s res://tests/sim_onda.gd
```
Este script testa:
1. Carregamento dos dados e do mapa.
2. Construção de atirador em ponto fixo F1 e em terreno aberto.
3. Construção de barricada em local reservado B1.
4. Geração e avanço da onda com 6 inimigos.
5. Disparos e eliminação de inimigos com atribuição de recompensa.
6. Retenção em barricada e dano.
7. Funcionamento do Campeão Antônio Conselheiro (aura de 192px, Mutirão curando +150 HP, Prédica reduzindo 50% de dano e velocidade de marcha).
8. Condição de vitória e reinício limpo de partida (`reset_run()`).

Para verificar a simulação matemática das 4 expedições (campanha completa):
```bash
node Miguel/Canudos/testes/campanha.js
```

---

## 3. Estado Atual das Tarefas (Marcos 0 e 1 Concluídos)

* **T01 a T06 (Marco 0 — Fundação):** Todas 100% concluídas.
* **T10 a T26 (Marco 1 — Ciclo Jogável, Polish & Áudio/Visual, Câmera Orbital e Prévia):** Todas 100% concluídas e testadas.
* **Próximo Marco:** Marco 2 — Progressão, Fases da Campanha (1ª a 4ª Expedição) e Artilharia/Morteros históricos.
