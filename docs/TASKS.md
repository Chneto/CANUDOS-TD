# Quadro de Tarefas

**Estados:** `a fazer` · `em andamento` · `em revisão` · `concluída` · `bloqueada`.

## Marco 0 — Fundação

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T01 | Confirmar engine e versão | Equipe humana | concluída | — | DEC-001 marcada como aceita com Godot 4.x (GDScript). |
| T02 | Especificar mapa MVP: rota, objetivo, zonas construíveis, pontos fixos e posições de barricada | Antigravity | concluída | T01, DEC-003 | docs/specs/map-mvp-specification.md aprovado com grid 64x64, layout e waypoints. |
| T03 | Criar guia histórico mínimo para o MVP | Claude | concluída | — | `docs/research/mvp-historical-guide.md` distingue fatos, ficção e matriz pedagógica de game design. |
| T04 | Definir contratos de dados do MVP | Codex | concluída | T01, T02 | Contratos documentados e alinhados ao mapa v1.1; dados canônicos em `resources/maps/canudos_mvp.tres`. |
| T05 | Resolver integração das posições de barricada com a rota | Antigravity | concluída | T02, revisão T04 | docs/specs/map-mvp-specification.md v1.1 associa cada barricade_site ao seu attack_stop_point na rota. |
| T06 | Gerar e integrar sprites e tilesets do MVP via FLUX | Antigravity | concluída | T02, DEC-002 | Assets raw gerados no FLUX Schnell e sprites processados com fundo transparente em assets/sprites/. |

## Marco 1 — Ciclo jogável

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T10 | Criar cena do mapa e rota funcional | Antigravity | concluída | T01, T02 | `scenes/map/map.tscn`, `map.gd`, `resources/maps/canudos_mvp.tres` e entidades visuais criadas com Path2D e grid 20x11. |
| T11 | Implementar estado de partida e integridade do objetivo | Codex | concluída | T01, T04 | `GameManager` controla fase, objetivo, materiais, contagem, vitória/derrota e reinício. |
| T12 | Implementar inimigo básico e percurso | Codex | concluída | T01, T04, T10 | `Enemy` e `WaveManager` percorrem o `Path2D`, geram seis unidades e aplicam dano ao objetivo. |
| T13 | Implementar posição de atiradores e dano | Codex | concluída | T01, T04, T12 | `DefenseStructure` escolhe alvo em alcance, aplica dano e credita eliminações uma vez. |
| T14 | Implementar barricada e validação de construção | Codex | concluída | T01, T02, T04, DEC-003 | `PlacementManager` valida células/recursos; `Enemy` para em locais aprovados e ataca barricadas. |
| T15 | Integrar HUD e feedback visual do MVP | Antigravity | concluída | T10, T11, T12, T13, T14 | HUD flutuante sem oclusão de linhas 0 e 10 (igreja e spawn 100% visíveis), círculo de alcance de atirador, barras de vida em barricadas e igreja. |
| T16 | Revisar compreensão, tom e legibilidade | Claude | concluída | T15, T03 | Auditoria completa em `docs/research/audit-compreensao-tom.md` avaliando as 4 dimensões (História, Acessibilidade, Loop e Tom). |
| T17 | Corrigir as falhas da primeira execução na Godot 4.3 | Claude | concluída | T10, T11, T12, T13, T14 | `tests/sim_onda.gd` passa: construir e iniciar a onda funcionam, os três pontos fixos disparam, o soldado não gira, os botões mostram o custo cobrado e o reinício funciona. |
| T18 | Correção de dimensionamento e sobreposição dos botões / Conselheiro | Antigravity | concluída | T15 | Cartões do HUD inferior redimensionados responsivamente com `clamp()` e `flex: 0 0 auto`, impedindo corte ou sobreposição de Antônio Conselheiro e Mutirão em resoluções de 1024px a 1920px+. Recompilado `Canudos.exe`. |
| T19 | Cenografia da Caatinga (Frente 2) via FLUX e integração | Antigravity | concluída | T06, T10 | Gerados no FLUX Schnell e recortados com `rembg`: `prop_tree_juazeiro` (Mata Branca), `prop_rock_lajedo` (Pontos F elevados) e `prop_house_taipa` (Arraial de Canudos). Integrados a `scenes/map/map.gd`. |
| T20 | Criação da Trilha Sonora Nordestina Sertaneja | Antigravity | concluída | — | Síntese acústica autoral em 44.1kHz estéreo (Viola caipira Karplus-Strong, Pífano em modo nordestino, Zabumba e Triângulo). Integrada no Godot (`AudioStreamPlayer`) e no jogo Web/PC com botão de áudio. |
| T21 | Barra de volume contínua, rotação/alinhamento de câmera e fidelidade histórica | Antigravity | concluída | T18, T20 | Controle deslizante contínuo de 0 a 100% com persistência e ícone dinâmico; câmera alinhada à rota perpendicular dos soldados (-26,5°) e rotação livre 360° no botão do meio do mouse (scroll drag / tecla R); riqueza histórica dos sprites (talabarte, quepe, baioneta Mauser, crucifixo de Conselheiro, chapéu de couro meia-lua) e VFX atmosférico de poeira da Caatinga. |
| T22 | Paridade do Campeão Antônio Conselheiro no Godot 4.3 | Codex / Antigravity | concluída | T11, T13, T14, T15 | `ChampionConselheiro` implementado em `scenes/champion/champion_conselheiro.tscn` com aura tática (192px), buff de cadência (0.8x) em atiradores, cura de barricadas (+150 HP via Mutirão), redução de dano (50% via Prédica), controle no HUD inferior (`[3]`, `[Q]`, `[W]`), atalhos de teclado e testes em `tests/sim_onda.gd`. |
| T23 | Áudio tátil avançado e sombras de projeção isométrica | Antigravity | concluída | T20, T21 | Síntese de novas assinaturas de áudio (Mutirão com sino de capela, Prédica com coro etéreo, Fanfarra de Vitória, Cadência de Derrota) e projeção de sombras elípticas de base suave em todas as estruturas. |
| T24 | Paridade de Câmera 360°, Zoom, SFX e Floating Combat Text na Godot 4.3 | Antigravity / Codex | concluída | T21, T22 | `CameraPivot` e `Camera2D` com rotação livre 360° no botão do meio do mouse, zoom com a roda, botão de alinhamento perpendicular (-26,5°), 7 efeitos sonoros WAV sintetizados (`sfx_musket`, `sfx_impact`, `sfx_wave_horn`, `sfx_mutirao`, `sfx_predica`, `sfx_victory`, `sfx_defeat`), partículas ambientais `CaatingaDust`, tremor de tela e números flutuantes de dano e cura. |
| T25 | Pintura e integração da Arte de Capa Canônica (`capa.jpg`) | Antigravity | concluída | T06, T16 | Criação da pintura de capa (1280x720) retratando o crepúsculo da Caatinga, a Igreja de Bom Jesus iluminada por velas, o Arraial de Canudos e Antônio Conselheiro com bordão e crucifixo. Integrada nos menus Web e PC. Recompilado `Canudos.exe`. |
| T26 | Câmera Orbital em Funil sem Inversão e Prévia Tática com Alcance | Antigravity / Codex | concluída | T21, T24 | Arco de rotação orbital limitado a [-36°, +36°] com zoom dinâmico de funil (0.85x a 1.75x) impedindo inversão de cabeça para baixo; círculo de alcance de 220px e sprite fantasma translúcido de atiradores e barricadas em tempo real durante hover. |
| T27 | Overscan Circular, Sprites Direcionais 4 Ângulos e Foco Tático por Retas | Antigravity / Codex | concluída | T21, T26 | Eliminação de cantos cortados no giro via buffer circunscrito com overscan (MARGEM 240, BASE 480) e Caatinga contínua; Sprites direcionais em 4 ângulos cardeais (Frente/Sul, Perfil/Leste-Oeste, Costas/Norte) dinâmicos conforme rotação de câmera e vetor de marcha; Sistema de pan suave por arrasto com botão direito/WASD e 4 botões de enquadramento rápido no HUD ([Geral], [1. Entrada], [2. Reta Central], [3. Igreja]). |
| T28 | Inclinação Vertical de Profundidade (Pitch 20° a 75°) e Zoom Contínuo | Antigravity / Codex | concluída | T26, T27 | Controle livre de profundidade da câmera (Pitch de 20° rasante até 75° top-down) via arrasto vertical do botão do meio do mouse; Zoom in / out contínuo (68% a 230%) na roda do mouse; inversão matemática analítica preservando 100% da acurácia de cliques e anéis de alcance em qualquer inclinação. |
| T29 | Publicação e Automação do Jogo no GitHub Pages | Antigravity | concluída | T28 | Publicação do jogo web no GitHub Pages via branch `gh-pages` e automação CI/CD via workflow `.github/workflows/deploy-pages.yml`. Acesso online em `https://chneto.github.io/CANUDOS-TD/`. |

### Notas da T15 (Antigravity)

- **Oclusão resolvida:** O HUD foi refatorado de barras de tela inteira para cartões flutuantes táticos com cantos arredondados e estética rústica de couro/taipa (`PanelTop` centralizado no topo; `PanelBottom` ancorado no canto inferior esquerdo). A Igreja de Canudos (colunas 14-17) e o ponto de surgimento (colunas 0-1) agora estão 100% visíveis e desobstruídos.
- **Feedback visual e de combate adicionados (Frente 1):**
  - Traçadores de tiro de pólvora com fade rápido (`Line2D`) e nuvem de fumaça de pólvora seca (`CPUParticles2D`) disparados a cada tiro de atirador jagunço.
  - Hit-flash avermelhado nos soldados republicanos ao serem atingidos por tiros.
  - Balanço procedural de marcha militar (bobbing vertical 2D) e golpe de baioneta (lunge) ao atacar barricadas.
  - Flash de poeira de taipa e tremor horizontal sutil nas barricadas ao receberem impacto.
  - Recuo de disparo (recoil) nas torres de defesa.
  - Círculo de alcance tático dinâmico (220 px) ao posicionar atiradores ou passar o mouse sobre atiradores colocados.
  - Barras de vida dinâmicas flutuando sobre barricadas danificadas e sobre a Igreja de Bom Jesus.
- **Unificação de recursos:** As pastas duplicadas `resources/structures/` e `resources/enemies/` foram eliminadas; `resources/definitions/` foi formalizada como a única fonte canônica em `AGENTS.md` e `MEMORY.md`.
- **Documentação Master criada:** `AGENTS.md`, `CONTEXT.md`, `ROADMAP.md` e `MEMORY.md` redigidos e sincronizados na raiz do projeto.

### Notas da T17 (Claude)

- **Como verifiquei:** `godot --headless --fixed-fps 60 --path . -s res://tests/sim_onda.gd` (Godot 4.3 stable), que termina com `TUDO OK`. Também rodei com janela para conferir o visual.
- **Revisão pedida:** Codex (`enemy.gd` e `canudos_mvp.tres` estão reservados por T12 e T14; `tests/`) e Antigravity (`map.tscn`, `map.gd` e a especificação do mapa).

### Notas da T03 e T16 (Claude)

- **Guia Histórico Canônico (T03):** Publicado em `docs/research/mvp-historical-guide.md` com rigor acadêmico baseado em Euclides da Cunha (*Os Sertões*), José Calasans e Ataliba Nogueira. Documenta as 4 expedições militares, armas históricas (Comblain, Mauser, Mannlicher, Krupp, Nagant vs cartucheiras, bacamartes e clavinas), a figura ascética de Antônio Conselheiro e a matriz pedagógica de game design (sem caricaturas, sem maniqueísmo).
- **Auditoria de Compreensão e Tom (T16):** Publicada em `docs/research/audit-compreensao-tom.md` avaliando as 4 dimensões (História, Acessibilidade, Loop e Tom) com nota geral 9.4/10.

### Notas da T22 e T23 (Codex & Antigravity)

- **Campeão Conselheiro no Godot 4.3 (T22):**
  - Implementado `scripts/systems/champion_conselheiro.gd` e `scenes/champion/champion_conselheiro.tscn`.
  - Aura de presença com raio de 192px (`AURA_RADIUS_PX`): atiradores dentro da aura têm seu intervalo de tiro multiplicado por `0.8` (cadência acelerada).
  - Habilidade ativa `[Q] Mutirão`: cura instantaneamente +150 HP em todas as barricadas dentro do raio da aura (cooldown 18s).
  - Habilidade ativa `[W] Prédica`: concede 50% de redução de dano sofrido por todas as barricadas sob a aura durante 8 segundos (cooldown 25s).
  - Movimentação diferenciada: 140 px/s em fase de preparação e 60 px/s durante o combate da onda.
  - Testes determinísticos estendidos em `tests/sim_onda.gd` cobrindo aura, movimentação e ambas as habilidades ativas.
- **Áudio Tátil e Projeção Isométrica (T23):**
  - Adicionadas sínteses sonoras procedurais em Web Audio API para `mutirao` (ressonância de sino de capela com cauda harmônica de 3s), `predica` (ressonância vocal mística), `vitoria` (acorde maior triunfante em viola e pífano) e `derrota` (cadência menor sertaneja).
  - Adicionadas sombras elípticas de base suave (`rgba(0,0,0,0.28)`) sob todas as estruturas e barricadas, ancorando-as realisticamente no relevo da Caatinga.

### Notas da T24 e T25 (Antigravity & Codex)

- **Câmera 360°, Zoom, SFX e Floating Combat Text (T24):**
  - Implementado `CameraPivot` centrado em (640, 352) e `Camera2D` em `scenes/map/map.tscn`. Suporte a rotação livre 360° no botão do meio do mouse, atalho `C` / botão no HUD para rotação perpendicular (-26,5°), reset com tecla `R`, zoom dinâmico na roda do mouse (0,75x a 1,8x).
  - 7 arquivos WAV autênticos de efeitos sonoros sintetizados em 44.1kHz estéreo em `assets/audio/` e gerenciados por `AudioStreamPlayer` independentes no Godot: tiro de fuzil jagunço com fumaça e estalo (`sfx_musket`), impacto pesado de madeira (`sfx_impact`), toque de berrante sertanejo de início de onda (`sfx_wave_horn`), sino de mutirão (`sfx_mutirao`), coro sagrado da prédica (`sfx_predica`), fanfarra de vitória (`sfx_victory`) e toque fúnebre de derrota (`sfx_defeat`).
  - Textos de combate flutuantes com interpolação suave (Tween): dano vermelho nos inimigos, perda de vida âmbar nas barricadas e cura verde vibrante no Mutirão.
  - Partículas ambientais `CaatingaDust` flutuando no ar árido do Arraial e tremor de tela sutil em impactos severos.
- **Arte de Capa Canônica de Belo Monte (T25):**
  - Pintura digital (1280x720) do crepúsculo sertanejo com as serras ao fundo, o Arraial de Canudos, a Igreja de Bom Jesus iluminada por vigília de velas e Antônio Conselheiro em perfil com seu manto, crucifixo peitoral e bordão de jurema.
  - Integrada em `Miguel/Canudos/capa.jpg` e `Miguel/Canudos_PC/jogo/capa.jpg`.
  - Recompilado `Canudos.exe` com WebView2 para Windows nativo.

### Notas da T26 (Antigravity & Codex)

- **Câmera Orbital em Funil sem Inversão:**
  - Ajustado o clamp angular para o intervalo $[-0.628, +0.628]$ radianos ($\pm 36^\circ$).
  - O jogador pode arrastar com o botão do meio do mouse para orbitar pelo vale sem que o mapa fique de ponta-cabeça.
  - O movimento do mouse no eixo Y ou scroll wheel atua na elevação cônica/zoom ($0.85\times$ a $1.75\times$).
  - O botão `bt-camera` cicla suavemente entre `0° Clássica`, `-26,5° Alinhada` (paralela à tela) e `+26,5° Flanco`.
  - Aplicada paridade no Godot 4.3 (`scenes/map/map.gd`) limitando o `CameraPivot` a $\pm 36^\circ$.
- **Prévia Dinâmica e Círculo Tático de Alcance:**
  - Adicionado ouvinte `pointermove` contínuo no canvas `#tela` em `ui.js`.
  - No `render_pixel.js`, ao selecionar ferramenta de atiradores ou barricada, a célula sob o cursor projeta o anel de alcance de 220px (`ovElipse(gx, gy, 220, 110, ...)`), a moldura de célula e o sprite fantasma translúcido de atiradores ou barricada (`globalAlpha = 0.55`).
  - No Godot 4.3 (`scenes/map/map.gd`), `_draw()` renderiza o sprite fantasma carregado (`TEX_SNIPER`/`TEX_BARRICADE`) e o círculo com retículo tático central.
  - Validado via teste E2E com Playwright e screenshot capturada. Recompilado `Canudos.exe`.

### Notas da T27 (Antigravity & Codex)

- **Eliminação Definitiva de Cantos Cortados (Buffer Circunscrito com Overscan):**
  - Margens do mundo expandidas para `MARGEM = 240, TOPO = 180, BASE = 480`. O gerador procedural estende continuamente o leito do rio, a vegetação e as serras bem além dos limites visíveis da janela.
  - O buffer `B.cv` e a transformação afim cobrem 100% da viewport em qualquer rotação $\pm 36^\circ$, zoom ou translação, eliminando qualquer aresta ou triângulo vazio nos cantos do monitor.
- **Sprites Direcionais em 4 Ângulos Cardeais (Sistema 2.5D Multi-Ângulo):**
  - Implementado cálculo vetorial da orientação na tela: `angTela = angMundo - rotacaoCamera`.
  - Soldados:
    - *Frente (Sul):* Peitoral simétrico com talabarte branco em 'X', quepe militar com pala frontal e baioneta apontando para frente (utilizado na descida inicial da serra).
    - *Perfil (Leste/Oeste):* Marcha de infantaria com passada dinâmica, silhueta lateral, mochila de campanha às costas e fuzil Mauser em riste apontando na direção da marcha (utilizado na reta central longa e espelhado para Oeste).
    - *Costas (Norte):* Visão dorsal com mochila volumosa e túnica azul-ferrete.
  - Jagunços e Conselheiro adaptam suas posturas conforme o ângulo de mira e caminhada.
- **Câmera com Foco Tático por Setores (Pan & Framing):**
  - Adicionado grupo de botões táticos `.foco-setores` na barra superior: `[📍 Geral]`, `[1. Entrada]`, `[2. Reta Central]` e `[3. Igreja]`.
  - Interpolação suave e cinematográfica (lerp a 60 FPS) transladando a câmera com enquadramento perfeito mantendo a perspectiva superior isométrica.
  - Suporte a pan por arrasto com botão direito do mouse (`button === 2`) e teclas de atalho `WASD` / `Setas` / `J, K, L`.
  - Paridade implementada no Godot 4.3 em `scenes/map/map.gd` (`focar_setor` e arrasto com botão direito).

### Notas da T28 (Antigravity & Codex)

- **Inclinação Vertical de Profundidade (Pitch Dinâmico de 20° a 75°):**
  - O movimento vertical do mouse ao arrastar com o botão do meio agora ajusta a inclinação de profundidade:
    - *Visão Rasante (20° a 30° / pitch 0.40 a 0.60):* O terreno achata dramaticamente, o horizonte e as serras descem para a visão panorâmica, proporcionando uma perspectiva imersiva e cinematográfica da batalha.
    - *Visão de Topo Tática (70° a 75° / pitch 1.20 a 1.40):* O terreno se abre em planta ortogonal/zênite para planejamento de defesa.
    - *Visão Padrão (45° / pitch 1.00):* A isométrica equilibrada tradicional.
  - Matriz inversa atualizada em `pontoNaTela`: `dy = (sy - (cy + panY)) / (zoom * pitch)`, garantindo que mira, detecção de hover e posicionamento funcionem com exatidão matemática em qualquer inclinação.
- **Zoom Contínuo (68% a 230%):**
  - Controlado fluidamente pela roda do mouse (`wheel`) ou atalhos de teclado `+` / `-`, `PageUp` / `PageDown`.
  - Teclas `T` (modo Top-Down) e `Y` (modo Rasante) adicionadas.
- **Paridade no Godot 4.3:**
  - `scenes/map/map.gd` atualizado para ajustar `camera_pivot.scale.y` e `camera.zoom` suavemente via arrasto do botão do meio e roda do mouse.
  - Validado via testes automatizados e screenshots do Playwright.

### Notas da T29 (Antigravity)

- **Publicação Web no GitHub Pages (Arquitetura Dual-Resiliente):**
  - **Canal A (Branch `gh-pages`):** Criada e enviada para o repositório remoto a branch `gh-pages` com o conteúdo integral da aplicação web (`Miguel/Canudos/`) na raiz do branch (`index.html`, `ui.js`, `render_pixel.js`, `nucleo.js`, `dados.js`, `historia.js`, `abertura.js`, `capa.jpg`, `musica_canudos.wav` e pasta de fontes). Isso garante publicação instantânea caso o repositório esteja configurado no modo *Deploy from a branch*.
  - **Canal B (GitHub Actions CI/CD):** Criado workflow `.github/workflows/deploy-pages.yml` com permissões `pages: write` e `id-token: write`, empacotando e publicando automaticamente a pasta `Miguel/Canudos/` no GitHub Pages a cada push na branch `main` ou via disparo manual (`workflow_dispatch`).
  - **URL Canônica do Jogo Online:** `https://chneto.github.io/CANUDOS-TD/`




## Regras do quadro

- Quem iniciar uma tarefa altera seu estado para `em andamento` e registra, abaixo, os arquivos reservados.
- Quem concluir move para `em revisão`, informa como verificou e solicita revisão do responsável adequado.
- Tarefas bloqueadas registram causa e próximo responsável para desbloqueio.

## Reservas ativas

*Nenhuma reserva ativa no momento — Marco 0 e Marco 1 integralmente concluídos e verificados.*
