# Especificação do Mapa MVP — Canudos: A Última Resistência

**Versão:** 1.2 (Pontos fixos F1 e F3 trazidos para o alcance da rota — T17)  
**Autor:** Antigravity (Apresentação e Editor)  
**Status:** Aprovado  
**Decisões Relacionadas:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-004`, `DEC-005`

---

## 1. Visão Geral e Dimensões

- **Resolução Base:** 1280 x 720 (Viewport padrão 16:9).
- **Tamanho do Grid:** 20 colunas x 11 linhas (1280 x 704 px útil).
- **Tamanho da Célula:** 64 x 64 pixels.
- **Perspectiva:** 2D Top-Down 3/4.

---

## 2. Diagrama Conceitual do Grid e Alinhamento da Rota

A rota inimiga possui 2 células de largura (`[R]`). As barricadas (`[B]`) estão estritamente adjacentes à rota e associadas diretamente aos pontos de parada de ataque (`attack_stop_point`), resolvendo a pendência técnica apontada pelo Codex.

```
       00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19
Row 00 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X] (Borda Norte - Cactos/Pedras)
Row 01 [S][S][R][R][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X] (S = Ponto de Surgimento)
Row 02 [X][X][R][R][B1][B1][X][X][F][F][X][X][X][X][X][X][X][X][X][X] (B1 = Barricada 1 em (4,2) e (5,2))
Row 03 [X][X][R][R][X][X][X][X][X][X][F][F][X][X][X][X][X][X][X][X]
Row 04 [X][X][R][R][R][R][R][R][X][X][X][X][X][X][X][X][X][X][X][X] (Curva horizontal)
Row 05 [X][X][X][X][X][X][R][R][B2][B2][X][X][X][X][X][X][X][X][X][X] (B2 = Barricada 2 em (8,5) e (9,5))
Row 06 [X][X][X][F][F][X][R][R][R][R][R][R][R][R][R][R][X][X][X][X]
Row 07 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][R][R][B3][B3][X][X] (B3 = Barricada 3 em (16,7) e (17,7))
Row 08 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][R][R][X][X][X][X]
Row 09 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][O][O][O][O][X][X] (O = Objetivo: Igreja de Canudos)
Row 10 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][O][O][O][O][X][X] (Entrada de Belo Monte)
```

### Legenda dos Tipos de Célula:
- `[S]` **Spawn (Entrada do Vale):** Células `(0, 1)` e `(1, 1)`.
- `[R]` **Rota Inimiga (Estrada de Poeira):** Faixa de 2 células de largura.
- `[B]` **Posições Reservadas de Barricada:**
  - `barricade_site_1`: Células `(4, 2)` e `(5, 2)` — Adjacentes à descida da rota.
  - `barricade_site_2`: Células `(8, 5)` e `(9, 5)` — Adjacentes à segunda curva.
  - `barricade_site_3`: Células `(16, 7)` e `(17, 7)` — Barricada final na entrada do arraial.
- `[F]` **Pontos Fixos de Atirador:** Células elevadas em `(8, 2)`, `(9, 2)`, `(10, 3)`, `(11, 3)`, `(3, 6)`, `(4, 6)`.
  - Na v1.1, F1 ficava em `(8, 1)`/`(9, 1)` e F3 em `(2, 8)`/`(3, 8)`: a 231 px e 256 px da rota, fora do alcance de 220 px do atirador, e não disparavam. Na v1.2 cada ponto fixo alcança parte da rota: F1 cobre 101 px, F2 215 px e F3 461 px.
- `[O]` **Objetivo Principal (Igreja de Belo Monte):** Retângulo de células de `(14, 9)` a `(17, 10)`.

---

## 3. Waypoints e Pontos de Parada de Ataque (`attack_stop_point`)

### Waypoints da Rota Central (Godot `Path2D`):
1. **WP0 (Surgimento):** `Vector2(64, 96)` (célula 0,1 / 1,1)
2. **WP1 (Início da Descida):** `Vector2(192, 96)` (célula 2,1 / 3,1)
3. **WP2 (Base da Primeira Descida):** `Vector2(192, 288)` (célula 2,4 / 3,4)
4. **WP3 (Travessia Leste 1):** `Vector2(448, 288)` (célula 6,4 / 7,4)
5. **WP4 (Descida Intermediária):** `Vector2(448, 416)` (célula 6,6 / 7,6)
6. **WP5 (Travessia Leste 2):** `Vector2(960, 416)` (célula 14,6 / 15,6)
7. **WP6 (Entrada da Igreja):** `Vector2(960, 608)` (célula 14,9 / 15,9)

### Mapeamento dos `BarricadeSite`:
Cada local de barricada possui seu `attack_stop_point` exatamente no ponto da rota onde o inimigo interrompe seu movimento para golpear:

| Site ID | Células Reservadas | Ponto de Parada do Inimigo na Rota (`attack_stop_point`) | Posição no Path2D |
|---|---|---|---|
| `site_b1` | `(4, 2)` e `(5, 2)` | `Vector2(192, 160)` (célula da rota adjacente) | Entre WP1 e WP2 |
| `site_b2` | `(8, 5)` e `(9, 5)` | `Vector2(448, 352)` (célula da rota adjacente) | Entre WP3 e WP4 |
| `site_b3` | `(16, 7)` e `(17, 7)` | `Vector2(960, 480)` (célula da rota adjacente) | Entre WP5 e WP6 |

Quando o inimigo atinge o `attack_stop_point`, se houver uma barricada erguida no site correspondente, ele entra no estado `ATTACKING_BARRICADE`. Ao destruí-la, retoma a marcha suavemente até o próximo waypoint.
