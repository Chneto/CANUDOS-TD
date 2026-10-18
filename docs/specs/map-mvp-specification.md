# Especificação do Mapa MVP — Canudos: A Última Resistência

**Versão:** 1.0  
**Autor:** Antigravity (Apresentação e Editor)  
**Status:** Aprovado  
**Decisões Relacionadas:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-004`, `DEC-005`

---

## 1. Visão Geral e Dimensões

- **Resolução Base:** 1280 x 720 (Viewport padrão 16:9).
- **Tamanho do Grid:** 20 colunas x 11 linhas (1280 x 704 px útil).
- **Tamanho da Célula:** 64 x 64 pixels.
- **Perspectiva:** 2D Top-Down 3/4 (visão isométrica/oblíqua leve para destacar a volumetria dos jagunços, barricadas de taipa e mandacarus).

---

## 2. Diagrama Conceitual do Grid

```
       00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19
Row 00 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X][X] (Borda Norte - Cactos/Pedras)
Row 01 [S][S][R][R][X][X][B][B][F][F][X][X][X][X][X][X][X][X][X][X] (S = Ponto de Surgimento das Tropas)
Row 02 [X][X][R][R][X][X][R][R][X][X][X][X][X][X][X][X][X][X][X][X] (R = Estrada de Terra / Rota)
Row 03 [X][X][R][R][B][B][R][R][X][X][F][F][X][X][X][X][X][X][X][X] (B = Barricadas Reservadas DEC-003)
Row 04 [X][X][R][R][R][R][R][R][X][X][X][X][X][X][X][X][X][X][X][X] (F = Pontos Fixos de Atirador)
Row 05 [X][X][X][X][X][X][R][R][X][X][B][B][X][X][X][X][X][X][X][X]
Row 06 [X][X][X][X][X][X][R][R][R][R][R][R][R][R][R][R][B][B][X][X]
Row 07 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][R][R][X][X][X][X]
Row 08 [X][X][F][F][X][X][X][X][X][X][X][X][X][X][R][R][X][X][X][X]
Row 09 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][O][O][O][O][X][X] (O = Objetivo: Igreja de Belo Monte)
Row 10 [X][X][X][X][X][X][X][X][X][X][X][X][X][X][O][O][O][O][X][X] (Borda Sul / Entrada do Arraial)
```

### Legenda dos Tipos de Célula:
- `[S]` **Spawn (Entrada do Vale):** Coordenadas `(0, 1)` e `(1, 1)` — Tropas da 4ª Expedição surgem aqui.
- `[R]` **Rota Inimiga (Estrada de Poeira):** Faixa de 2 células de largura para evitar empilhamento. Não permite construção livre.
- `[B]` **Posições de Barricada (DEC-003):** Células exclusivas de bloqueio onde os inimigos são obrigados a parar e golpear até destruir.
- `[F]` **Pontos de Atiradores / Suporte:** Células elevadas com cobertura tática que cobrem curvas da rota.
- `[O]` **Objetivo Principal (Arraial / Igreja de Belo Monte):** Integridade de 100 pontos. Inimigos que alcançam esta zona causam dano e desaparecem.
- `[X]` **Área Livre / Caatinga:** Terreno árido onde o jogador pode alocar defesas adicionais com materiais.

---

## 3. Coordenadas e Curvas da Rota (Waypoints para Godot `Path2D`)

Os inimigos avançam no centro da rota pelos seguintes pontos de passagem em pixels (centro das células):
1. **WP0 (Surgimento):** `(64, 96)`
2. **WP1 (Curva 1):** `(192, 96)`
3. **WP2 (Curva 2):** `(192, 288)`
4. **WP3 (Curva 3):** `(448, 288)`
5. **WP4 (Curva 4):** `(448, 416)`
6. **WP5 (Curva 5):** `(960, 416)`
7. **WP6 (Entrada do Objetivo):** `(960, 608)`

---

## 4. Próximos Passos para Integração
- **Codex:** Pode implementar `T04` com base direta nas coordenadas e tipos de células definidos neste documento.
- **Antigravity:** Gera a suíte de texturas dos tiles (`ground_caatinga`, `road_dirt`, `props_cactus`) e monta o TileMap 64x64 na cena `BattleMap.tscn`.
