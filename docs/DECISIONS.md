# Registro de Decisões

Use uma entrada por decisão que afete mais de uma tarefa. Não apague entradas antigas; registre uma nova decisão que as substitua.

## Modelo

```md
## DEC-000 — Título
- Status: proposta | aceita | substituída
- Data: AAAA-MM-DD
- Decisor: nome
- Contexto:
- Decisão:
- Consequências:
- Substitui: DEC-000 (se aplicável)
```

## DEC-001 — Engine do protótipo

- Status: aceita
- Data: 2026-10-18
- Decisor: equipe humana
- Contexto: o GDD recomenda Godot com GDScript, confirmada pela equipe.
- Decisão: Godot 4.x com GDScript confirmada como engine oficial para protótipo e produto.
- Consequências: desbloqueia T01, T02, T04, T10 e estrutura formal de cenas em Godot.

## DEC-002 — Escopo técnico inicial

- Status: aceita
- Data: 2026-10-18
- Decisor: GDD inicial
- Contexto: é preciso validar o ciclo de defesa antes de ampliar conteúdo.
- Decisão: a primeira versão jogável terá um mapa, rota fixa, objetivo, um inimigo, uma posição de atiradores, barricada, construção, uma onda e estados de vitória, derrota e reinício.
- Consequências: roguelite, economia completa, dez ondas, arte final e sistemas adicionais permanecem fora do primeiro marco.

## DEC-003 — Barricadas e rota fixa no MVP

- Status: aceita
- Data: 2026-10-18
- Decisor: equipe humana
- Contexto: o GDD prevê rota fixa, barricadas que atrasam inimigos e, ao mesmo tempo, ausência de navegação dinâmica.
- Decisão: para o MVP, barricadas só poderão ser construídas em posições pré-definidas adjacentes à rota. Quando uma unidade alcançar uma barricada, ela para e a ataca; ao destruí-la, prossegue pela rota original.
- Consequências: o mapa MVP precisa expor posições de barricada; T02 e T14 desbloqueadas.

## DEC-004 — Direção Visual e Perspectiva (Top-Down 3/4)

- Status: aceita
- Data: 2026-10-18
- Decisor: equipe humana
- Contexto: necessidade de equilibrar precisão geométrica com detalhamento histórico dos personagens e estruturas do sertão.
- Decisão: perspectiva 2D Top-Down 3/4 (câmera com leve inclinação frontal de 30° a 45°). Arte gerada via FLUX.1 no estilo gravura histórica/ilustração sóbria (tons áridos, terra vermelha, couro cru, adobe e mandacaru).
- Consequências: sprites exibem corpo/tronco e armas; estruturas exibem volumetria vertical.

## DEC-005 — Geometria do Grid e Pipeline de Assets

- Status: aceita
- Data: 2026-10-18
- Decisor: equipe humana
- Contexto: padronização para integração de cenas e TileMaps no Godot.
- Decisão: grid ortogonal de 64x64 pixels. Pipeline de assets gerado no FLUX, processado para canal alfa transparente e organizado em `assets/sprites/`, `assets/tilesets/` e `assets/ui/`.
- Consequências: base técnica unificada para Antigravity e Codex.

