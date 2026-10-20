# MEMORY.md — Memória Persistente e Registro de Aprendizado das IAs

Este arquivo serve como **registro contínuo de aprendizado, lições técnicas e histórico de decisões** compartilhado entre Antigravity, Codex e Claude. Todas as IAs devem consultar este arquivo ao iniciar uma nova sessão ou antes de tentar resolver problemas conhecidos.

---

## 1. Lições Técnicas e Problemas Resolvidos

### 1.1 Bug das Imagens Pretas no FLUX.1 Schnell (Resolvido)
* **Sintoma:** Imagens geradas pelo script de lote em `assets/raw/` saíam com todos os pixels em 0.0 (preto absoluto).
* **Causa Raiz:**
  1. No WebUI Forge, o VAE padrão em ponto flutuante de 32 bits (fp32) estourava em `NaN` em GPUs de 6 GB VRAM durante a decodificação latente do FLUX.
  2. O payload da API não especificava `scheduler: "Simple"` nem `cfg_scale: 1.0`, fazendo o Forge cair no agendador padrão de Stable Diffusion clássico (que tenta usar CFG 7.0 e quebra a difusão de fluxo).
* **Solução Canônica:**
  - Configuração do Forge via API: `auto_vae_precision_bfloat16: True` e `forge_preset: "flux"`.
  - Parâmetros obrigatórios no payload: `sampler_name: "Euler"`, `scheduler: "Simple"`, `cfg_scale: 1.0`, `steps: 4 a 6`.
  - Scripts atualizados: [tools/flux_generator.py](tools/flux_generator.py) e [tools/batch_generate_mvp.py](tools/batch_generate_mvp.py).

### 1.2 Alinhamento das Barricadas e Pontos de Parada na Rota (Resolvido)
* **Sintoma:** O Codex identificou que as posições de barricada antigas `(6,1)` e `(7,1)` ficavam distantes da rota e não havia ponto para o inimigo parar e atacar.
* **Solução:** Antigravity atualizou a especificação para a **v1.1** em [docs/specs/map-mvp-specification.md](docs/specs/map-mvp-specification.md):
  - `site_b1`: células `(4,2)` e `(5,2)` -> `attack_stop_point = Vector2(192, 160)`
  - `site_b2`: células `(8,5)` e `(9,5)` -> `attack_stop_point = Vector2(448, 352)`
  - `site_b3`: células `(16,7)` e `(17,7)` -> `attack_stop_point = Vector2(960, 480)`
  - Todos os pontos estão matematicamente sobre a `Curve2D` do Godot.

### 1.3 Inimigo de Ponta-Cabeça na Curva (T17 — Resolvido por Claude)
* **Sintoma:** Ao percorrer a `Path2D`, o `Sprite2D` do soldado republicano girava para acompanhar a tangente do caminho, ficando de cabeça para baixo nas curvas sul e oeste.
* **Solução:** Definir `rotates = false` no nó `PathFollow2D` em [scenes/enemies/enemy_republican.tscn](scenes/enemies/enemy_republican.tscn) e em `scripts/systems/enemy.gd`. Em jogos 2D Top-Down, a entidade translada sem girar o sprite.

### 1.4 Alcance dos Atiradores nos Pontos Fixos F1 e F3 (T17 — Resolvido por Claude)
* **Sintoma:** Os pontos fixos F1 `(8,1)/(9,1)` e F3 `(2,8)/(3,8)` ficavam a mais de 220 px de distância da rota mais próxima, impossibilitando que atiradores posicionados neles disparassem contra os soldados.
* **Solução:**
  - F1 realocado para `(6,2)` e `(7,2)` (distância da descida: 128 px).
  - F3 realocado para `(12,8)` e `(13,8)` (distância da subida: 128 px).
  - Ambos agora cobrem as respectivas curvas da rota perfeitamente.

### 1.5 Unificação da Fonte de Dados Canônica (Resolvido)
* **Problema:** Existiam duas árvores de dados: `resources/definitions/` (usada pelo código do Codex e cena do mapa) e `resources/structures/` + `resources/enemies/` (geradas anteriormente).
* **Decisão:** **A pasta `resources/definitions/` é a fonte canônica definitiva.** Quaisquer referências devem apontar para:
  - `resources/definitions/barricade_basic.tres`
  - `resources/definitions/shooter_post.tres`
  - `resources/definitions/enemy_basic.tres`
  - `resources/maps/canudos_mvp.tres`

### 1.6 Sobreposição dos Botões da Barra Inferior e Corte do Conselheiro (T18 — Resolvido)
* **Sintoma:** Em resoluções padrão (1280x720, 1366x768 ou 1080p com escala), o botão de Antônio Conselheiro era esmagado por `flex-shrink: 1` e `minmax(0, 11em)`, reduzindo sua área de texto a ~7px enquanto seu texto transbordava, ficando encoberto pelo botão `[Q] Mutirão`.
* **Causa Raiz:** Ausência de `flex: 0 0 auto` / `min-width` no cartão do campeão, somada à largura fixa excessiva (`15.5em`, `13.5em`) dos demais botões, extrapolando a largura da janela para mais de 1600px.
* **Solução:**
  - Aplicação de `width: clamp()` dinâmico nas ferramentas e habilidades.
  - Bloqueio de esmagamento no campeão com `flex: 0 0 auto; min-width: 12em;` e `white-space: nowrap; text-overflow: ellipsis`.
  - Adição de breakpoint `@media (max-width: 1150px)` para recolhimento elegante das descrições longas em telas compactas.
  - Sincronização em `Miguel/Canudos/index.html`, `Miguel/Canudos_PC/jogo/index.html` e recompilação de `Canudos.exe`.

### 1.7 Frente 2 — Cenografia da Caatinga e Novos Props via FLUX (T19 — Resolvido)
* **Objetivo:** Superar a limitação de um cenário mono-cacto na Godot 4.3, integrando a rica botânica e geomorfologia da Caatinga sertaneja.
* **Execução:**
  - `prop_tree_juazeiro`: Juazeiro / Umbuzeiro de mata branca, galhos retorcidos e folhagem prateada.
  - `prop_rock_lajedo`: Lajedo de pedra granítica avermelhada, inserido como base dos pontos fixos elevados `[F]`.
  - `prop_house_taipa`: Casebres de pau-a-pique e taipa de mão com telhas coloniais compondo o Arraial ao redor da Igreja.
  - Pipeline executado no FLUX Schnell com `rembg` automático e integrado a `scenes/map/map.gd`.

### 1.8 Trilha Sonora Regional Nordestina (T20 — Resolvido)
* **Sonoridade Autêntica:** Síntese autoral em 44.1kHz estéreo 16-bit com física acústica Karplus-Strong para Viola Caipira, oscilador de sopro com harmônicos ímpares para Pífano/Flauta de taboca em Modo Nordestino (Mixolídio/Lídio), Zabumba grave de procissão e Triângulo metálico sincopado.
* **Loop Seamless:** Duração de 42,7 segundos com fade cruzado para repetição contínua.
* **Integração:** Adicionado `AudioStreamPlayer` em `scenes/map/map.tscn` (Godot 4.3) e botão `#bt-musica` com áudio HTML5 nos protótipos Web e PC.

---

## 2. Padrões de Verificação Rápida

Para verificar a integridade da partida e dos sistemas sem necessidade de abrir a interface do Godot:
```bash
godot --headless --fixed-fps 60 --path . -s res://tests/sim_onda.gd
```
Este script testa:
1. Carregamento dos dados e do mapa.
2. Construção de atirador em ponto fixo F1 e em terreno aberto.
3. Construção de barricada em local reservado B1.
4. Geração e avanço da onda com 6 inimigos.
5. Disparos e eliminação de inimigos com atribuição de recompensa.
6. Retenção em barricada e dano.
7. Condição de vitória e reinício limpo de partida (`reset_run()`).

---

## 3. Estado Atual das Tarefas (Marco 1)

* **T10 (Cena do Mapa e Rota):** Concluída.
* **T11 a T14 (Sistemas de Combate e Estado):** Concluídas e validadas pela T17.
* **T17 (Correções de 1ª Execução Godot 4.3):** Concluída por Claude.
* **T15 (Layout do HUD e Feedback Visual de Combate):** **Concluída por Antigravity** (HUD flutuante sem oclusão, alcance tático dinâmico, barras de HP flutuantes, traçadores de pólvora, fumaça balística, hit-flash, bobbing de marcha e tremor de barricada).
* **T16 (Revisão Histórica e Balanceamento):** Próxima etapa (Claude).
