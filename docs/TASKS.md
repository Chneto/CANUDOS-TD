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

## Regras do quadro

- Quem iniciar uma tarefa altera seu estado para `em andamento` e registra, abaixo, os arquivos reservados.
- Quem concluir move para `em revisão`, informa como verificou e solicita revisão do responsável adequado.
- Tarefas bloqueadas registram causa e próximo responsável para desbloqueio.

## Reservas ativas

*Nenhuma reserva ativa no momento — Marco 0 e Marco 1 integralmente concluídos e verificados.*
