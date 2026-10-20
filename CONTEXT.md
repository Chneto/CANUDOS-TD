# CONTEXT.md — Contexto Geral e Arquitetura do Projeto

**Jogo:** CANUDOS TD — A Resistência de Belo Monte  
**Gênero:** Tower Defense Tático / Histórico  
**Motor Oficial:** Godot 4.3 (GDScript 2.0)  
**Resolução e Grade:** 1280 × 704 px (20 colunas × 11 linhas, células de 64 × 64 px)  
**Perspectiva:** 2D Top-Down 3/4 (DEC-004)

---

## 1. Premissa e Contexto Histórico

O jogo recria a resistência épica e trágica do Arraial de Canudos (Belo Monte, sertão da Bahia, 1896–1897), liderado por **Antônio Conselheiro**, contra as expedições enviadas pelo governo republicano brasileiro.

Diferente dos jogos convencionais de fantasia militar, em **CANUDOS TD**:
* O jogador defende o Arraial (o objetivo é a **Igreja Nova de Bom Jesus**, erguida em taipa e tijolo cru).
* Os defensores são **sertanejos e jagunços**: vaqueiros de gibão e chapéu de couro, armados com espingardas de percussão (Lazarinas e Comblains) e facões.
* Os inimigos são as **tropas do Exército Brasileiro Republicano e da Polícia Baiana**, que marcham pelo vale com fardas de lã azul/cáqui, quepes, fuzis Mauser com baionetas e canhões Krupp.
* O terreno é a **Caatinga árida**: solo vermelho rachado, espinhos de mandacaru, xique-xique, macambiras e calor implacável.

---

## 2. Decisões Técnicas Registradas (ADRs)

* **DEC-001 (Motor de Jogo):** Aprovado **Godot 4.3 com GDScript**. Portabilidade, suporte a tipos estáticos fortes no GDScript 2.0 e execução headless para testes de CI.
* **DEC-002 (Pipeline Visual de Arte):** Aprovada a geração contínua de ilustrações 2D conceituais com **FLUX.1 Schnell**, seguida de recorte automático de canal alfa com `rembg` e normalização para a grade 64x64.
* **DEC-003 (Sistemas de Construção):** Construção híbrida:
  * **Barricadas de Taipa:** Somente em posições reservadas na rota (`BARRICADE_SITE`), com ponto fixo de ataque inimigo (`attack_stop_point`).
  * **Atiradores Jagunços:** Em pontos fixos elevados de pedra (`FIXED_SITE`) ou em células livres do terreno (`OPEN`).
* **DEC-004 (Perspectiva de Câmera):** Vista **Top-Down 3/4** ortogonal para máxima clareza da rota e legibilidade das silhuetas dos personagens.

---

## 3. Arquitetura de Pastas e Código

```text
CANUDOS-TD/
├── AGENTS.md                  # Regras e papéis da equipe de IA
├── CONTEXT.md                 # Este documento (fonte de contexto geral)
├── ROADMAP.md                 # Planejamento estratégico de marcos
├── MEMORY.md                  # Registro de decisões, histórico de bugs e memórias
├── README.md                  # Apresentação do projeto e instruções
├── project.godot              # Configuração da engine Godot 4.3
│
├── assets/
│   ├── raw/                   # Ilustrações originais em alta resolução geradas no FLUX
│   └── sprites/               # Sprites de jogo recortados em RGBA transparente
│       ├── enemies/           # Soldado Republicano de 1897 (128x128)
│       ├── props/             # Igreja de Canudos (192x192), Cacto Mandacaru (192x192)
│       ├── tilesets/          # Solo de Caatinga (64x64), Estrada de terra (64x64)
│       └── towers/            # Atirador Jagunço (128x128), Barricada de Taipa (128x128)
│
├── docs/
│   ├── COLLABORATION.md       # Diretrizes de colaboração
│   ├── DECISIONS.md           # Registro formal de decisões arquiteturais
│   ├── PROJECT_BRIEF.md       # Resumo executivo do projeto
│   ├── TASKS.md               # Quadro de tarefas vivo e reservas
│   └── specs/                 # Especificações detalhadas
│       ├── asset-pipeline-specification.md
│       ├── map-mvp-specification.md
│       └── mvp-data-contracts.md
│
├── resources/
│   ├── definitions/           # [CANÔNICA] Definições de inimigos e estruturas
│   │   ├── barricade_basic.tres
│   │   ├── enemy_basic.tres
│   │   └── shooter_post.tres
│   ├── maps/                  # Instância serializada do mapa
│   │   └── canudos_mvp.tres   # Grade 20x11, waypoints e pontos táticos
│   └── sites/                 # Recursos de pontos reservados (site_b1..b3, site_f1..f3)
│
├── scenes/
│   ├── enemies/               # Cena enemy_republican.tscn (PathFollow2D)
│   ├── map/                   # Cena principal map.tscn e controlador map.gd
│   └── towers/                # tower_sniper.tscn e tower_barricade.tscn
│
├── scripts/
│   ├── data/                  # Classes de recurso: MapDefinition, BuildSiteDefinition, etc.
│   └── systems/               # Nós lógicos: GameManager, WaveManager, PlacementManager, etc.
│
├── tests/
│   └── sim_onda.gd            # Simulação automatizada headless da onda para Godot 4.3
│
├── tools/
│   ├── flux_generator.py      # Gerador pontual FLUX com sampler Euler e Simple scheduler
│   ├── batch_generate_mvp.py  # Pipeline em lote com rembg automático
│   └── process_sprites.py     # Processamento e ancoragem de sprites
│
└── Miguel/                    # Protótipo companheiro em HTML5/Pixel-Art e build PC
    ├── Canudos/               # Versão Web Canvas e análises
    └── Canudos_PC/            # Executável Windows (Canudos.exe) com WebView2
```

---

## 4. Glossário Canônico de Termos

* **Belo Monte:** Nome dado por Antônio Conselheiro e seus seguidores ao arraial de Canudos.
* **Jagunço:** Habitante do sertão engajado na defesa do arraial.
* **Gibão:** Casaco de couro curtido de vaqueiro nordestino, armadura natural contra a caatinga.
* **Taipa de Mão / Pau a Pique:** Técnica construtiva sertaneja de madeira entrelaçada e barro batido usada nas trincheiras e casas.
* **Linha de Ataque (`attack_stop_point`):** Ponto exato da rota na `Path2D` onde a coluna militar para para enfrentar a barricada antes de continuar marchando.
