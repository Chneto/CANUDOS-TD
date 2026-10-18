# Acordo de Colaboração

## Objetivo

Permitir que Antigravity, Claude e Codex contribuam no mesmo repositório sem conflitos de edição nem decisões contraditórias.

## Responsabilidades

| Papel | Responsável primário | Responsabilidade | Não deve alterar sem alinhamento |
|---|---|---|---|
| Direção histórica, narrativa e experiência | Claude | pesquisa, tom, textos, documento de design, hipóteses de balanceamento e revisão de experiência | lógica central, cenas e assets finais |
| Apresentação e editor | Antigravity | cenas, UI, layout de mapa, assets, animação, efeitos, áudio e integração visual | regras de combate e contratos técnicos |
| Sistemas e qualidade técnica | Codex | arquitetura, dados de jogo, lógica de combate, ondas, economia, persistência, testes e revisão técnica | direção de arte e conteúdo histórico não validado |
| Decisão final | Equipe humana | escopo, engine, aprovação de marcos e mudanças que alterem o produto | — |

Cada área possui um responsável primário, mas revisões cruzadas são bem-vindas. Responsabilidade não significa exclusividade: significa que alterações estruturais dependem de aprovação desse responsável.

## Regras de trabalho

1. Toda tarefa começa em `TASKS.md`, com responsável, escopo, dependências e critério de aceite.
2. Uma tarefa deve ter uma única pessoa/agente responsável pela integração final.
3. Não editar simultaneamente a mesma cena, script, arquivo de dados ou documento.
4. Antes de alterar arquivo pertencente a outra área, registrar o pedido na tarefa e aguardar alinhamento.
5. Usar uma branch por tarefa: `tipo/id-descricao-curta` (ex.: `docs/T02-mapa-mvp`, `feat/T10-combate`).
6. Cada commit deve ser pequeno, descritivo e ter um único propósito.
7. Alterações de escopo, engine, arquitetura pública ou representação histórica exigem entrada em `DECISIONS.md`.
8. Uma tarefa só é concluída quando seu critério de aceite for verificado no jogo ou por revisão documental, conforme indicado.

## Ordem de integração

1. Claude prepara restrições históricas, regras de experiência e conteúdo textual.
2. Codex define os contratos de dados e implementa o comportamento testável.
3. Antigravity conecta cenas, interface e apresentação a esses contratos.
4. A equipe humana testa a build e aprova ou devolve a tarefa.

## Áreas de propriedade após a escolha da engine

| Área | Proprietário | Colaboradores |
|---|---|---|
| `docs/design/` e `docs/research/` | Claude | todos (leitura) |
| `scripts/systems/`, `scripts/data/`, `tests/` | Codex | Antigravity para integração |
| `scenes/`, `assets/`, `ui/` | Antigravity | Codex para contratos e diagnóstico |
| `docs/` de processo | Codex | todos |

Esses caminhos seguem a organização recomendada para o projeto Godot aprovado. A cena ou script de propriedade de outra área exige alinhamento antes de alteração.
