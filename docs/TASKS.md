# Quadro de Tarefas

**Estados:** `a fazer` · `em andamento` · `em revisão` · `concluída` · `bloqueada`.

## Marco 0 — Fundação

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T01 | Confirmar engine e versão | Equipe humana | concluída | — | DEC-001 marcada como aceita com Godot 4.x (GDScript). |
| T02 | Especificar mapa MVP: rota, objetivo, zonas construíveis, pontos fixos e posições de barricada | Antigravity | concluída | T01, DEC-003 | docs/specs/map-mvp-specification.md aprovado com grid 64x64, layout e waypoints. |
| T03 | Criar guia histórico mínimo para o MVP | Claude | a fazer | — | `docs/research/mvp-historical-guide.md` distingue fatos, ficção e itens a validar. |
| T04 | Definir contratos de dados do MVP | Codex | em revisão | T01, T02 | `docs/specs/mvp-data-contracts.md` especifica mapa, inimigo, torre, barricada, eventos e estado de partida; pendência de integração registrada. |
| T05 | Resolver integração das posições de barricada com a rota | Antigravity | bloqueada | T02, revisão T04 | Cada posição de barricada tem parada de ataque associada à rota; atualizar a especificação de mapa. |

## Marco 1 — Ciclo jogável

| ID | Tarefa | Responsável | Estado | Dependências | Critério de aceite |
|---|---|---|---|---|---|
| T10 | Criar cena do mapa e rota funcional | Antigravity | a fazer | T01, T02 | Mapa carrega e expõe ponto de surgimento, rota e objetivo. |
| T11 | Implementar estado de partida e integridade do objetivo | Codex | em revisão | T01, T04 | `scripts/systems/game_manager.gd` controla fase, objetivo, materiais, contagem, vitória/derrota e reinício. |
| T12 | Implementar inimigo básico e percurso | Codex | a fazer | T01, T04, T10 | Seis inimigos percorrem a rota e danificam o objetivo ao chegar. |
| T13 | Implementar posição de atiradores e dano | Codex | a fazer | T01, T04, T12 | Torre encontra alvo em alcance, ataca em intervalo e elimina inimigos. |
| T14 | Implementar barricada e validação de construção | Codex | a fazer | T01, T02, T04, DEC-003 | Prévia válida/inválida; barricada ocupa apenas posição reservada e inimigos a atacam corretamente. |
| T15 | Integrar HUD e feedback visual do MVP | Antigravity | a fazer | T10, T11, T12, T13, T14 | Vida, onda, estados e ações do jogador são compreensíveis sem depurador. |
| T16 | Revisar compreensão, tom e legibilidade | Claude | a fazer | T15, T03 | Relatório de teste com problemas priorizados e recomendações. |

## Regras do quadro

- Quem iniciar uma tarefa altera seu estado para `em andamento` e registra, abaixo, os arquivos reservados.
- Quem concluir move para `em revisão`, informa como verificou e solicita revisão do responsável adequado.
- Tarefas bloqueadas registram causa e próximo responsável para desbloqueio.

## Reservas ativas

| T04 | Codex | `docs/specs/mvp-data-contracts.md`, `docs/TASKS.md`, `README.md`, `docs/COLLABORATION.md` |
| T11 | Codex | `scripts/systems/game_manager.gd`, `docs/TASKS.md` |
