# Quadro de Tarefas

**Estados:** `a fazer` · `em andamento` · `em revisão` · `concluída` · `bloqueada`.

## Marco 0 — Fundação

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T01 | Confirmar engine e versão | Equipe humana | concluída | — | DEC-001 marcada como aceita com Godot 4.x (GDScript). |
| T02 | Especificar mapa MVP: rota, objetivo, zonas construíveis, pontos fixos e posições de barricada | Antigravity | concluída | T01, DEC-003 | docs/specs/map-mvp-specification.md aprovado com grid 64x64, layout e waypoints. |
| T03 | Criar guia histórico mínimo para o MVP | Claude | a fazer | — | `docs/research/mvp-historical-guide.md` distingue fatos, ficção e itens a validar. |
| T04 | Definir contratos de dados do MVP | Codex | concluída | T01, T02 | Contratos documentados e alinhados ao mapa v1.1; dados canônicos em `resources/maps/canudos_mvp.tres`. |
| T05 | Resolver integração das posições de barricada com a rota | Antigravity | concluída | T02, revisão T04 | docs/specs/map-mvp-specification.md v1.1 associa cada barricade_site ao seu attack_stop_point na rota. |
| T06 | Gerar e integrar sprites e tilesets do MVP via FLUX | Antigravity | concluída | T02, DEC-002 | Assets raw gerados no FLUX Schnell e sprites processados com fundo transparente em assets/sprites/. |

## Marco 1 — Ciclo jogável

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T10 | Criar cena do mapa e rota funcional | Antigravity | concluída | T01, T02 | `scenes/map/map.tscn`, `map.gd`, `resources/maps/canudos_mvp.tres` e entidades visuais criadas com Path2D e grid 20x11. |
| T11 | Implementar estado de partida e integridade do objetivo | Codex | em revisão | T01, T04 | `GameManager` controla fase, objetivo, materiais, contagem, vitória/derrota e reinício. |
| T12 | Implementar inimigo básico e percurso | Codex | em revisão | T01, T04, T10 | `Enemy` e `WaveManager` percorrem o `Path2D`, geram seis unidades e aplicam dano ao objetivo. |
| T13 | Implementar posição de atiradores e dano | Codex | em revisão | T01, T04, T12 | `DefenseStructure` escolhe alvo em alcance, aplica dano e credita eliminações uma vez. |
| T14 | Implementar barricada e validação de construção | Codex | em revisão | T01, T02, T04, DEC-003 | `PlacementManager` valida células/recursos; `Enemy` para em locais aprovados e ataca barricadas. |
| T15 | Integrar HUD e feedback visual do MVP | Antigravity | concluída | T10, T11, T12, T13, T14 | HUD flutuante sem oclusão de linhas 0 e 10 (igreja e spawn 100% visíveis), círculo de alcance de atirador, barras de vida em barricadas e igreja. |
| T16 | Revisar compreensão, tom e legibilidade | Claude | a fazer | T15, T03 | Relatório de teste com problemas priorizados e recomendações. |
| T17 | Corrigir as falhas da primeira execução na Godot 4.3 | Claude | concluída | T10, T11, T12, T13, T14 | `tests/sim_onda.gd` passa: construir e iniciar a onda funcionam, os três pontos fixos disparam, o soldado não gira, os botões mostram o custo cobrado e o reinício funciona. |

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

## Regras do quadro

- Quem iniciar uma tarefa altera seu estado para `em andamento` e registra, abaixo, os arquivos reservados.
- Quem concluir move para `em revisão`, informa como verificou e solicita revisão do responsável adequado.
- Tarefas bloqueadas registram causa e próximo responsável para desbloqueio.

## Reservas ativas

| T11 | Codex | `scripts/systems/game_manager.gd`, `docs/TASKS.md` |
| T12 | Codex | `scripts/data/enemy_definition.gd`, `scripts/systems/enemy.gd`, `scripts/systems/wave_manager.gd`, `resources/definitions/enemy_basic.tres` |
| T13 | Codex | `scripts/data/structure_definition.gd`, `scripts/systems/defense_structure.gd`, `resources/definitions/shooter_post.tres` |
| T14 | Codex | `scripts/data/build_site_definition.gd`, `scripts/data/map_definition.gd`, `scripts/systems/barricade.gd`, `scripts/systems/placement_manager.gd`, `resources/definitions/barricade_basic.tres`, `resources/maps/canudos_mvp.tres` |
