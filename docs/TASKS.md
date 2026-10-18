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
| T10 | Criar cena do mapa e rota funcional | Antigravity | concluída | T01, T02 | `scenes/map/map.tscn`, `map.gd`, `resources/maps/canudos_mvp.tres` e entidades visuais criadas com Path2D e grid 20x11. |
| T11 | Implementar estado de partida e integridade do objetivo | Codex | em revisão | T01, T04 | `GameManager` controla fase, objetivo, materiais, contagem, vitória/derrota e reinício. |
| T12 | Implementar inimigo básico e percurso | Codex | em revisão | T01, T04, T10 | `Enemy` e `WaveManager` percorrem o `Path2D`, geram seis unidades e aplicam dano ao objetivo. |
| T13 | Implementar posição de atiradores e dano | Codex | em revisão | T01, T04, T12 | `DefenseStructure` escolhe alvo em alcance, aplica dano e credita eliminações uma vez. |
| T14 | Implementar barricada e validação de construção | Codex | em revisão | T01, T02, T04, DEC-003 | `PlacementManager` valida células/recursos; `Enemy` para em locais aprovados e ataca barricadas. |
| T15 | Integrar HUD e feedback visual do MVP | Antigravity | a fazer | T10, T11, T12, T13, T14 | Vida, onda, estados e ações do jogador são compreensíveis sem depurador. |
| T16 | Revisar compreensão, tom e legibilidade | Claude | a fazer | T15, T03 | Relatório de teste com problemas priorizados e recomendações. |

## Regras do quadro

- Quem iniciar uma tarefa altera seu estado para `em andamento` e registra, abaixo, os arquivos reservados.
- Quem concluir move para `em revisão`, informa como verificou e solicita revisão do responsável adequado.
- Tarefas bloqueadas registram causa e próximo responsável para desbloqueio.

## Reservas ativas

| T11 | Codex | `scripts/systems/game_manager.gd`, `docs/TASKS.md` |
| T12 | Codex | `scripts/data/enemy_definition.gd`, `scripts/systems/enemy.gd`, `scripts/systems/wave_manager.gd`, `resources/definitions/enemy_basic.tres` |
| T13 | Codex | `scripts/data/structure_definition.gd`, `scripts/systems/defense_structure.gd`, `resources/definitions/shooter_post.tres` |
| T14 | Codex | `scripts/data/build_site_definition.gd`, `scripts/data/map_definition.gd`, `scripts/systems/barricade.gd`, `scripts/systems/placement_manager.gd`, `resources/definitions/barricade_basic.tres`, `resources/maps/canudos_mvp.tres` |
