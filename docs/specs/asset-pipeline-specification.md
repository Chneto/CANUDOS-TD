# Pipeline de Assets e Geração de Arte — Canudos: A Última Resistência

**Responsável:** Antigravity (Apresentação, Cenas e UI)  
**Status:** Operacional (FLUX.1 Schnell + Rembg + Grid 64x64)

---

## 1. Suíte de Assets do MVP

| Asset ID | Categoria | Descrição Histórica e Visual | Dimensões / Células | Destino Godot |
|---|---|---|---|---|
| `tower_sniper_jagunco` | Torre / Defensor | Jagunço com chapéu de couro meia-lua, gibão e bacamarte/rifle de percussão | 128x128 (2x2 células) | `assets/sprites/towers/` |
| `tower_barricade_taipa` | Barricada | Trincheira de terra batida (taipa de mão), estacas de aroeira e pedras | 128x128 (2x2 células) | `assets/sprites/towers/` |
| `enemy_soldier_republican` | Inimigo Básico | Soldado da 4ª Expedição, farda azul e cáqui empoeirada, quepê militar e fuzil Mauser com baioneta | 128x128 (sprite centrado) | `assets/sprites/enemies/` |
| `tile_ground_caatinga` | Terreno / Chão | Solo avermelhado da caatinga baiana, terra seca, rachaduras leves | 64x64 (Tile seamless) | `assets/tilesets/` |
| `tile_road_dirt` | Rota / Estrada | Caminho de terra batida com marcas de pegadas e poeira | 64x64 (Tile seamless) | `assets/tilesets/` |
| `prop_cactus_mandacaru` | Obstáculo / Prop | Mandacaru imponente e xique-xique espinhoso do sertão | 64x128 (1x2 células) | `assets/sprites/props/` |
| `ui_hud_frame` | Interface / HUD | Painel de madeira rústica e couro com pregos para abrigar vida e materiais | 9-patch / Sprite | `assets/ui/` |

---

## 2. Prompts Padronizados para o FLUX.1

### A. Atirador Jagunço (`tower_sniper_jagunco`)
```text
Full-body game character concept art in 3/4 top-down perspective, 19th-century Brazilian jagunço defender from Canudos war. Sun-hardened mestizo fighter wearing traditional artisanal tan leather half-moon hat (chapéu de vaqueiro), weathered leather gibão coat, raw cotton shirt, holding antique percussion rifle. Stylized historical illustration, sharp dark linework, rich arid earth tones, clear silhouette, isolated on solid plain neutral light gray background.
```

### B. Barricada de Taipa (`tower_barricade_taipa`)
```text
Game asset illustration in 3/4 top-down tactical perspective, defensive fortification trench from War of Canudos. Constructed from rough timber logs, sun-baked red mud-and-wattle (taipa de mão), stacked river stones, and dry sandbags. Antique gunpowder horn and rustic wooden crucifix resting against the trench wall. Gritty historical illustration style, sharp contour lines, isolated on clean solid light gray background.
```

### C. Soldado Republicano (`enemy_soldier_republican`)
```text
Full-body game sprite concept art in 3/4 top-down isometric view, 1897 Brazilian Republican army infantry soldier marching in formation. Weary recruit wearing tattered navy blue and khaki wool uniform stained with red sertão dust, kepi cap with brass republic insignia, leather gaiters, holding bolt-action Mauser rifle with fixed bayonet forward. Dynamic march pose, sharp line art, clean game asset style, isolated on clean neutral solid background.
```

### D. Cenário e Tileset da Caatinga (`tile_caatinga_set`)
```text
Top-down seamless 2D game tile texture, arid Bahia sertão ground from Canudos. Reddish-orange cracked dry earth, scattered tiny desert pebbles, sparse dry yellow straw grass patches, natural sunlight. Clean hand-drawn historical aesthetic, no shadows, seamless pattern.
```

---

## 3. Fluxo de Processamento Automatizado

1. **Geração:** O modelo FLUX.1 Schnell produz os conceitos em alta resolução (`896x1152` para unidades, `1024x1024` para estruturas).
2. **Extração de Fundo:** A ferramenta `tools/process_sprites.py` usa `rembg` (rede neural U2Net) para eliminar o fundo neutro e gerar canal alfa transparente limpo.
3. **Enquadramento no Grid:** O asset é reescalado para a caixa de colisão do Godot (`128x128` ou `64x64`), mantendo proporção e ponto de ancoragem no chão.
4. **Exportação:** Arquivos finais são gravados diretamente em formato `.png` com canal alfa na árvore de pastas oficial do projeto.
