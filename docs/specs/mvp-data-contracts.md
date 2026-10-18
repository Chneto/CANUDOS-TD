# Contratos de Dados e Eventos — MVP

**Versão:** 1.0  
**Responsável:** Codex (Sistemas e Qualidade Técnica)  
**Estado:** Aprovado para integração  
**Base:** `context.md.txt`, `DECISIONS.md` e `specs/map-mvp-specification.md`

Este documento define os limites entre cena do mapa, entidades e controle da partida. Valores marcados como provisórios servem para prototipagem e podem ser balanceados sem mudar os contratos.

## 1. Convenções espaciais

- Grade ortogonal: 20 colunas × 11 linhas, célula de 64 × 64 px.
- Coordenadas de célula são `(coluna, linha)`, começando em `(0, 0)` no canto superior esquerdo.
- Posição de mundo do centro de uma célula `(coluna, linha)`: `((coluna + 0.5) * 64, (linha + 0.5) * 64)`.
- O mapa é a autoridade para rota, objetivo e posições de construção; sistemas não devem duplicar essas coordenadas em scripts.
- A rota contém pontos de passagem em coordenadas de mundo, conforme `map-mvp-specification.md`.
- A arte pode deslocar o desenho dentro da célula, mas não altera a posição lógica usada por alcance, rota e construção.

## 2. Contrato do mapa

Cada célula lógica tem exatamente um tipo:

| Tipo lógico | Significado | Construção |
|---|---|---|
| `OPEN` | terreno livre (`X`) | estrutura livre compatível |
| `SPAWN` | surgimento (`S`) | não |
| `PATH` | rota inimiga (`R`) | não |
| `BARRICADE_SITE` | posição reservada (`B`) | apenas barricada |
| `FIXED_SITE` | ponto fixo (`F`) | estrutura compatível com o ponto |
| `OBJECTIVE` | objetivo (`O`) | não |

O mapa MVP integrado em [canudos_mvp.tres](../../resources/maps/canudos_mvp.tres) é a fonte única dos tipos de célula, waypoints, spawns e pontos reservados. `MapDefinition.validate_definition()` verifica dimensões, pontos, locais de construção e paradas de barricada antes do início da onda.

Contrato serializável recomendado para cada mapa:

```text
MapDefinition
  map_id: StringName
  grid_size: Vector2i       # (20, 11)
  cell_size_px: int         # 64
  cell_types: Array[CellType]  # exatamente grid_size.x * grid_size.y
  spawn_positions: Array[Vector2]
  path_points: Array[Vector2]  # em ordem, coordenadas de mundo
  objective_cell_rect: Rect2i
  barricade_sites: Array[BarricadeSite]
  fixed_sites: Array[FixedSite]
```

`BarricadeSite` precisa identificar a célula reservada e a posição de rota na qual a unidade para para atacá-la:

```text
BarricadeSite
  site_id: StringName
  cell: Vector2i
  attack_stop_point: Vector2
```

O campo `attack_stop_point` precisa estar na rota e ao alcance de ataque da barricada. Se um ponto de barricada não tiver uma relação válida, o mapa falha na validação de conteúdo e não deve ser integrado ao combate. Isso evita inventar navegação dinâmica ou fazer a unidade atacar à distância.

### Alinhamento de integração do mapa

A especificação do mapa foi atualizada para a **v1.1** pelo Antigravity em `docs/specs/map-mvp-specification.md`. As barricadas agora estão adjacentes à rota em `site_b1` (4,2/5,2), `site_b2` (8,5/9,5) e `site_b3` (16,7/17,7), e cada local possui seu respectivo `attack_stop_point` formalmente definido na rota (`Vector2(192, 160)`, `Vector2(448, 352)` e `Vector2(960, 480)`). O bloqueio de integração foi resolvido.


## 3. Dados de entidades

### Inimigo básico

```text
EnemyDefinition
  id: StringName              # "infantry_basic"
  max_health: float           # 100 (provisório, GDD)
  move_speed_px_s: float      # 40 (provisório, GDD)
  objective_damage: int       # 20 (provisório de implementação)
  barricade_attack_range_px: float # 128 (provisório de implementação)
  barricade_damage: int        # 20 por golpe (provisório de implementação)
  attack_interval_s: float    # 1.0 s (provisório de implementação)
  reward_materials: int       # 5 (provisório, GDD)
```

Cada instância mantém `health`, `path_progress`, `state` e uma guarda `reward_granted`. Estados permitidos: `MOVING`, `ATTACKING_BARRICADE`, `DEFEATED`, `REACHED_OBJECTIVE`. `DEFEATED` e `REACHED_OBJECTIVE` são terminais; a recompensa nunca é concedida mais de uma vez.

### Posição de atiradores

```text
StructureDefinition
  id: StringName              # "shooter_post"
  placement: FIXED_SITE | OPEN_CELL
  cost_materials: int         # 60 (provisório, GDD)
  max_health: float           # não aplicável ao MVP até dano a estruturas
  attack_damage: float        # 20 (provisório, GDD)
  attack_interval_s: float    # 1.2 (provisório, GDD)
  range_px: float             # 220 (provisório de implementação)
  target_filter: ENEMY
```

Uma estrutura de ataque seleciona apenas inimigos vivos dentro do alcance e dispara no máximo uma vez por intervalo. A aquisição de alvo e o relógio de ataque pertencem à estrutura; a aplicação de dano e a transição de morte pertencem ao inimigo.

### Barricada

```text
BarricadeDefinition
  id: StringName              # "barricade_basic"
  cost_materials: int         # 25 (provisório, GDD)
  max_health: float           # 300 (provisório, GDD)
  placement: BARRICADE_SITE
```

Inimigos só entram em `ATTACKING_BARRICADE` quando alcançam o `attack_stop_point` explicitamente associado ao local ocupado. Ao destruir a barricada, o inimigo retorna a `MOVING` com o progresso de rota preservado. Não usar navegação dinâmica no MVP.

## 4. Estado da partida

O `GameManager` é a única autoridade do estado global e da integridade do objetivo.

```text
GameState
  phase: PREPARATION | WAVE_ACTIVE | VICTORY | DEFEAT
  objective_health: int       # 100 (provisório, especificação do mapa)
  objective_max_health: int   # 100
  materials: int               # 120 (provisório, GDD)
  current_wave: int            # 1 no MVP
  enemies_alive: int
```

Transições válidas no MVP: `PREPARATION -> WAVE_ACTIVE`, `WAVE_ACTIVE -> VICTORY` quando a única onda termina sem inimigos restantes, `WAVE_ACTIVE -> DEFEAT` quando a integridade chega a zero. `VICTORY` e `DEFEAT` são terminais até `reset_run()`, que recria os valores iniciais.

O MVP tem uma onda. A seleção roguelite e o intervalo entre ondas não fazem parte deste contrato inicial.

## 5. Eventos entre sistemas

Eventos são sinais Godot ou chamadas tipadas; UI e efeitos visuais escutam eventos e não alteram estado de jogo.

| Emissor | Sinal/chamada | Consumidor/efeito |
|---|---|---|
| `WaveManager` | `wave_started`, `spawn_count_changed`, `wave_spawning_finished` | UI apresenta onda e progresso de surgimento; sinaliza ao GameManager o fim da criação |
| `Enemy` | `GameManager.report_enemy_defeated(reward)` | decrementa contagem e credita recompensa uma única vez |
| `Enemy` | `GameManager.report_enemy_reached_objective(damage)` | decrementa contagem, aplica dano e remove unidade sem recompensa |
| `Enemy` | `Barricade.take_damage(amount)` | ataca barricada no ponto de parada associado ao local |
| `DefenseStructure` | `attack_fired(target)` | efeito visual opcional; dano aplicado pelo sistema |
| `Barricade` | `health_changed`, `destroyed(site_id)` | atualiza barra/efeito e libera o local ocupado |
| `GameManager` | `objective_health_changed(current, maximum)` | HUD atualiza integridade |
| `GameManager` | `materials_changed(current)` | HUD atualiza materiais |
| `GameManager` | `phase_changed(phase)` | HUD apresenta preparação, combate, vitória ou derrota |
| `GameManager` | `run_finished(won)` | UI apresenta resultado e opção de reinício |
| `GameManager` | `run_reset` | WaveManager e PlacementManager removem entidades da tentativa anterior |

Eventos de domínio não carregam nós visuais transitórios (projéteis, partículas, sprites). A apresentação resolve a posição do ator enquanto ele existe.

## 6. Regras de integridade de dados

- Saúde máxima, intervalo de ataque, velocidade e custos devem ser maiores que zero.
- Alcance deve ser maior que zero para uma estrutura ofensiva.
- `cell_types.size()` precisa ser exatamente `grid_size.x * grid_size.y`.
- Spawn, objetivo e caminho precisam estar dentro do mapa.
- Caminho precisa ter pelo menos dois pontos e o último ponto precisa entrar no retângulo do objetivo.
- Nenhuma célula de construção pode ser `PATH`, `SPAWN` ou `OBJECTIVE`.
- Cada `BARRICADE_SITE` deve ter uma parada de ataque dentro do caminho e dentro do alcance definido da barricada.
- Definições identificadas por `id` são únicas; instâncias podem compartilhar a mesma definição.

## 7. Valores provisórios de implementação

O GDD não definiu estes números. Para tornar os primeiros sistemas integráveis, o protótipo usa valores ajustáveis em `EnemyDefinition` e `StructureDefinition`:

- `objective_damage`: 20 por unidade que chega ao objetivo;
- `barricade_damage`: 20 por golpe, com intervalo de 1 segundo;
- alcance de ataque da infantaria contra barricadas: 128 px;
- `range_px`: 220 para a posição de atiradores;
- intervalo entre surgimentos: 1 segundo;
- barricadas são alvos por parada de rota; a torre não usa bloqueio por linha de visão no MVP.

Os valores são hipóteses de balanceamento, não fatos históricos. A geometria dos locais foi especificada pelo Antigravity na v1.1 do mapa.

A recompensa de conclusão de onda é `+15` materiais, provisória conforme o GDD. A primeira onda concede a recompensa uma única vez, quando todo o surgimento terminou e não há inimigos vivos.
