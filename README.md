# CANUDOS TD — Canudos: A Última Resistência

[![Jogar no Navegador (GitHub Pages)](https://img.shields.io/badge/🎮%20JOGAR%20ONLINE-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://chneto.github.io/CANUDOS-TD/)
[![Engine: Godot 4.x](https://img.shields.io/badge/Engine-Godot%204.x-478cbf?logo=godotengine&logoColor=white)](https://godotengine.org/)
[![Genre: Tower Defense](https://img.shields.io/badge/Gênero-Tower%20Defense%202D-orange)](#)
[![Theme: Guerra de Canudos](https://img.shields.io/badge/Tema-História%20do%20Brasil%20(1896--1897)-darkred)](#)
[![Collaboration: Antigravity + Codex + Claude](https://img.shields.io/badge/Desenvolvimento-Multi--Agente%20Colaborativo-blueviolet)](#)

> **Canudos: A Última Resistência** é um jogo indie de *Tower Defense* 2D em visão tática de profundidade, para Web e PC. O jogador organiza a defesa do arraial de Belo Monte contra as expedições militares da jovem República, administrando recursos escassos, posicionando atiradores jagunços e barricadas de taipa na caatinga baiana do final do século XIX.

---

## 🎮 Jogue Agora Online

O jogo completo com motor gráfico em pixel art, trilha sonora sertaneja autoral, campeão Antônio Conselheiro e câmera tática de profundidade está publicado e pronto para jogar diretamente no navegador:

👉 **[https://chneto.github.io/CANUDOS-TD/](https://chneto.github.io/CANUDOS-TD/)**

### Controles Principais
| Ação | Teclado / Mouse |
|---|---|
| **Rotacionar Câmera (Órbita)** | Arrasto com **Botão do Meio do Mouse** (Horizontal) ou teclas `R` / `Shift+R` |
| **Inclinação de Profundidade (Pitch 20° a 75°)** | Arrasto com **Botão do Meio do Mouse** (Vertical) ou teclas `T` (Planta) / `Y` (Rasante) |
| **Zoom Contínuo (68% a 230%)** | **Roda do Mouse** ou teclas `+` / `-` / `PageUp` / `PageDown` |
| **Mover / Pan da Câmera** | Arrasto com **Botão Direito do Mouse** ou teclas `W`, `A`, `S`, `D` / Setas |
| **Enquadramento Rápido** | Botões de setor no HUD: `[📍 Geral]`, `[1. Entrada]`, `[2. Reta Central]`, `[3. Igreja]` |
| **Construir / Posicionar** | Clique nas posições destacadas no mapa após selecionar no HUD |
| **Habilidades de Conselheiro** | Teclas `[Q]` (Prédica / Resistência) e `[W]` (Mutirão / Reparos) |
| **Ajuste de Volume** | Slider contínuo de 0 a 100% no canto superior direito |

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

## 🗺️ Estado Atual e Entregas Concluídas

- [x] **Marco 0 (Fundação e Contratos):** Definição da Engine Godot 4.3 (`T01`), Mapa MVP (`T02`), Guia Histórico (`T03`), Contratos de Dados (`T04`), Posições de Barricada (`T05`), Geração e Recorte de Sprites (`T06`).
- [x] **Marco 1 (Ciclo Jogável e Polimento Técnico):** Cena do Mapa (`T10`), Ciclo de Jogo/Integridade (`T11`), Inimigos da 4ª Expedição (`T12`), Atiradores Jagunços (`T13`), Barricadas de Taipa (`T14`), HUD Dinâmico e Responsivo (`T15`, `T18`), Auditoria de Tom (`T16`), Execução Verde na Godot 4.3 (`T17`).
- [x] **Frente 2 (Cenografia, Áudio e Câmera Avançada):**
  - **Cenografia da Caatinga (`T19`):** Juazeiros, Lajedos e Casas de Taipa integrados.
  - **Trilha Sonora Nordestina e SFX (`T20`, `T23`, `T24`):** Viola sertaneja Karplus-Strong, pífano, zabumba e 7 SFX táteis.
  - **Barra de Volume Contínua (`T21`):** Slider interativo de 0 a 100% com persistência.
  - **Campeão Antônio Conselheiro (`T22`):** Aura tática, habilidades Prédica (`[Q]`) e Mutirão (`[W]`).
  - **Arte Canônica de Capa (`T25`):** Crepúsculo no arraial de Belo Monte e Igreja de Bom Jesus.
  - **Câmera Orbital em Funil e Prévia Tática (`T26`):** Arco de órbita sem inversão, indicador de alcance 220px e ghost preview em tempo real.
  - **Overscan Circular, Sprites 4 Ângulos e Foco Tático (`T27`):** Buffer circunscrito sem corte nos cantos, 4 perspectivas cardeais de tropas e foco rápido por retas.
  - **Inclinação Vertical de Profundidade (Pitch 20° a 75°) e Zoom Contínuo (`T28`):** Rotação rasante ou topo zênite, zoom suave e matriz inversa precisa.
  - **Publicação no GitHub Pages e Automação CI/CD (`T29`):** Deploy automático via GitHub Actions e branch `gh-pages`.

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
