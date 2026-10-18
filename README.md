# CANUDOS TD — Canudos: A Última Resistência

[![Engine: Godot 4.x](https://img.shields.io/badge/Engine-Godot%204.x-478cbf?logo=godotengine&logoColor=white)](https://godotengine.org/)
[![Genre: Tower Defense](https://img.shields.io/badge/Gênero-Tower%20Defense%202D-orange)](#)
[![Theme: Guerra de Canudos](https://img.shields.io/badge/Tema-História%20do%20Brasil%20(1896--1897)-darkred)](#)
[![Collaboration: Antigravity + Codex + Claude](https://img.shields.io/badge/Desenvolvimento-Multi--Agente%20Colaborativo-blueviolet)](#)

> **Canudos: A Última Resistência** é um jogo indie de *Tower Defense* 2D em visão Top-Down 3/4, para PC. O jogador organiza a defesa do arraial de Belo Monte contra as expedições militares da jovem República, administrando recursos escassos, posicionando posições de atiradores e barricadas de taipa na caatinga baiana do final do século XIX.

---

## 🎯 Visão do Projeto & Pilares

1. **Ambientação Histórica Autêntica:** Sertão baiano, caatinga árida, terra vermelha, cactos mandacaru e construções de taipa. Sem estética de fantasia medieval.
2. **Posicionamento Tático Híbrido:** Barricadas de contenção em posições reservadas de bloqueio e posições de tiro livres em áreas estratégicas adjacentes.
3. **Economia Rígida de Materiais:** Gerenciamento tenso de recursos para construção, munição e reparos.
4. **Legibilidade Visual e Tática:** Estilo de ilustração histórica e gravura, com silhuetas limpas e contrastes marcantes.

---

## 👥 Estrutura de Trabalho Colaborativo

O projeto é desenvolvido em sinergia por três agentes especializados com papéis bem delimitados:

| Agente | Responsabilidade Principal | Entregas Chave |
|---|---|---|
| **Antigravity** | **Apresentação, Cenas, UI e Arte** | Layout e grid do mapa (`T02`), geração de arte via FLUX.1 (`asset-pipeline`), recorte/transparência de sprites, cenas (`BattleMap.tscn`, `HUD.tscn`) e polimento visual. |
| **Codex (GPT)** | **Sistemas, Lógica e Qualidade Técnica** | Contratos de dados do MVP (`T04`), ciclo de combate, máquina de estados da partida, ondas e integridade do objetivo. |
| **Claude** | **Direção Histórica, Narrativa e Texto** | Pesquisa documental (`T03`), textos de ambientação, garantia de fidelidade do tom sertanejo e revisão de experiência (`T16`). |
| **Equipe Humana** | **Direção de Produto e Validação** | Decisões fundacionais (`DECISIONS.md`), escopo, testes de jogabilidade e aprovação de marcos. |

*Consulte [docs/COLLABORATION.md](docs/COLLABORATION.md) para as regras de reserva de arquivos e fluxo de branches.*

---

## 🗺️ Estado Atual e O Que Foi Feito

- [x] **Definição da Engine:** Godot 4.x com GDScript formalizada como engine oficial (`DEC-001` / `T01`).
- [x] **Regra das Barricadas:** Barricadas alocadas em posições adjacentes reservadas na rota (`DEC-003`).
- [x] **Direção Visual Consolidada:** Perspectiva 2D Top-Down 3/4 (`DEC-004`).
- [x] **Especificação do Mapa MVP:** Viewport 1280x720 com grid ortogonal 20x11 de 64x64 px e 7 waypoints fixos (`docs/specs/map-mvp-specification.md` / `T02`).
- [x] **Pipeline de IA Visual:** FLUX.1 Schnell local configurado + scripts automatizados de geração e extração de alfa (`tools/flux_generator.py` e `tools/process_sprites.py`).

---

## 🚀 Próximas Etapas (Marco 1 — Ciclo Jogável)

- [ ] **T03 (Claude):** Guia histórico mínimo distinguindo fatos e ficção em `docs/research/mvp-historical-guide.md`.
- [ ] **T04 (Codex):** Contratos formais de dados para unidades, torres, barricadas e rota em `docs/specs/mvp-data-contracts.md`.
- [ ] **T10 (Antigravity):** Construção da cena base do mapa (`BattleMap.tscn`) com TileMapLayer e nós Path2D no Godot.
- [ ] **T11, T12, T13, T14 (Codex):** Lógica funcional de inimigos percorrendo a rota, atiradores atacando e barricadas recebendo dano.
- [ ] **T15 (Antigravity):** Integração do HUD com tema de madeira e couro para visualização de materiais e vida.
- [ ] **T16 (Claude):** Revisão de tom, clareza e legibilidade tática da primeira build.

---

## 📂 Estrutura do Repositório

```text
├── assets/
│   ├── raw/                 # Saída bruta em alta resolução gerada pelo FLUX.1
│   ├── sprites/             # Sprites processados com canal alfa transparente (128x128 / 64x64)
│   │   ├── towers/          # Atirador jagunço, barricada de taipa
│   │   ├── enemies/         # Soldados da 4ª Expedição
│   │   └── props/           # Mandacaru, cactos, pedras da caatinga
│   ├── tilesets/            # Tiles ortogonais 64x64 (terra avermelhada, estrada)
│   └── ui/                  # Elementos de interface (molduras, ícones de materiais)
├── docs/
│   ├── specs/               # Especificações técnicas e de layout (Mapa, Assets, Contratos)
│   ├── COLLABORATION.md     # Protocolo de colaboração entre Antigravity, Codex e Claude
│   ├── DECISIONS.md         # Registro formal de decisões técnicas e de design (ADRs)
│   ├── PROJECT_BRIEF.md     # Resumo e escopo delimitado do MVP
│   └── TASKS.md             # Quadro vivo de tarefas e estados do projeto
├── tools/                   # Scripts utilitários de IA, geração e processamento de sprites
└── context.md.txt           # GDD inicial de referência do jogo
```

---

## 🎨 Como Gerar e Processar Assets

1. Certifique-se de que o **Forge FLUX** esteja rodando localmente (`http://127.0.0.1:7860`).
2. Para gerar os assets planejados e salvá-los automaticamente com transparência:
   ```bash
   python tools/flux_generator.py
   python tools/process_sprites.py
   ```
