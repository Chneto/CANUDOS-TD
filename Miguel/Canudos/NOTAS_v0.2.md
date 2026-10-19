# Canudos: A Última Resistência — notas da versão 0.2

**Data:** 18/10/2026  
**Parte de:** `HANDOFF_v0.1.md` (GDD original, sem alterações)  
**Estado:** primeira cena jogável pronta, testada em simulação e no navegador.

## 1. O que existe agora

Protótipo jogável em HTML5 Canvas, sem dependências, que cobre o escopo da "primeira versão" do GDD (seção 13) e o item 1 da lista seguinte (economia):

- Um mapa (Belo Monte), uma rota fixa, o arraial como objetivo com barra de integridade.
- Duas estruturas: barricada e posição de atiradores.
- Um inimigo: infantaria.
- Duas ondas (as ondas 1 e 2 do GDD, as únicas feitas só de infantaria).
- Construção em grade com prévia verde/vermelha e motivo da recusa; obra com tempo durante o combate; desmontagem com reembolso.
- Economia de materiais: custo, recompensa por abate e por onda, sobra entre ondas.
- Vitória, derrota com explicação, reinício.
- Pausa e velocidade 1×, 2×, 3×; atalhos de teclado; toque no celular.

### Arquivos

| Arquivo | Papel | Equivalente previsto em Godot |
|---|---|---|
| `dados.js` | Todos os números, ondas e o mapa. Nada de lógica. | recursos `.tres` / JSON |
| `nucleo.js` | Regras puras, sem DOM. Roda no navegador e no Node. | `GameManager`, `WaveManager`, `Enemy`, `Structure`, `PlacementManager`, `ResourceManager` (seções com esses nomes no arquivo) |
| `render.js` | Desenho procedural do mapa, unidades e efeitos. | cenas e sprites |
| `ui.js` | Entrada, laço do jogo, painéis. | HUD e `BattleMap.tscn` |
| `index.html` | Página e estilos. | — |
| `testes/simular.js` | Simulação sem tela: regras, estratégias e mapa de calor. | testes GUT |

### Como rodar

- Abrir pelo servidor local: configuração `canudos` (porta 8767) no `.claude/launch.json` do Kaizen.
- Simulação: `node testes/simular.js` (o Node portátil fica em `%USERPROFILE%\.local\node`).

## 2. Decisão sobre a engine

A engine continua **em aberto**. O protótipo foi feito em HTML5 porque a Godot não está instalada nesta máquina e o objetivo desta etapa era provar o ciclo de ataque e defesa, não escolher ferramenta. O núcleo foi escrito para facilitar a migração: estado só com dados serializáveis, regras separadas do desenho, seções com os nomes dos scripts do GDD.

O que pesa na escolha, a ser decidido:
- **Ficar em HTML5:** já roda, abre no navegador e no celular, publica como página. Limite: ferramentas de arte e áudio mais fracas, distribuição em loja de PC exige empacotar (Electron, Tauri).
- **Migrar para Godot:** editor de cenas, animação, áudio e exportação para PC nativos. Custo: reescrever cerca de 400 linhas de regras em GDScript (a lógica é direta) e refazer o desenho com sprites.

## 3. Interpretações do GDD (provisórias, a validar)

| Ponto do GDD | Como ficou | Por quê |
|---|---|---|
| "Áreas proibidas incluem rotas inimigas" × "inimigos param para atacar barricadas" | A barricada é a **única** estrutura permitida na estrada. Atiradores só fora dela. | Sem isso as tropas nunca encontrariam uma barricada. |
| "Impedir que construções bloqueiem completamente a rota" | Atendido pela regra acima: o bloqueio é sempre temporário, porque a tropa derruba a barricada. As 2 primeiras casas da estrada não aceitam barricada (é onde as tropas surgem). | Rota fixa por pontos de passagem, sem navegação dinâmica. |
| "Estruturas em construção não atacam" | Obra leva tempo **só durante o combate** (1,5 s barricada, 3 s atiradores). Na preparação fica pronta na hora. | Na preparação o tempo está parado. |
| "Reembolso de 50% na venda" | Mantido. Exceção: na mesma preparação em que foi construída, a estrutura volta inteira ("desfazer"). | Evita punir clique errado no planejamento. Fácil de remover se não agradar. |
| Velocidade "40" | Lida como 40 px/s, ou seja, 1 casa por segundo. | O GDD não dá unidade. |
| Alvo dos atiradores | A tropa mais adiantada dentro do alcance. | Padrão do gênero; o GDD não define. |
| Tropas umas sobre as outras | Sem colisão entre tropas; cada uma tem um leve deslocamento lateral para o grupo não virar um ponto só. | GDD pede evitar colisões que travem a onda. |

## 4. Parâmetros que o protótipo precisou inventar

Todos marcados com `[v0.2]` em `dados.js`. Os marcados `[GDD]` vieram do documento.

| Parâmetro | Valor |
|---|---:|
| Grade | 24 × 16 casas de 40 px |
| Integridade do arraial | 100 |
| Alcance dos atiradores | 3,5 casas |
| Dano da infantaria ao entrar no arraial | 20 |
| Dano da infantaria à barricada | 10 por golpe, 1 golpe/s |
| Intervalo entre tropas na onda | 1,6 s (onda 1), 1,4 s (onda 2) |
| Tempo de obra | 1,5 s barricada, 3 s atiradores |

## 5. Resultado dos testes (simulação determinística, `testes/simular.js`)

| Estratégia | Resultado |
|---|---|
| Nada construído | perde na onda 1 |
| 1 atirador bem posto, nada mais | perde na onda 2 |
| 1 ou 2 atiradores longe da estrada | perde na onda 1, 0 abates |
| Atirador + 2 barricadas fora do alcance | perde na onda 1 |
| 2 atiradores bem postos | vence, integridade 60 |
| 2 atiradores + barricada na 2ª onda | vence, integridade 100 |
| Atirador + barricada, 2º atirador na 2ª onda | vence, integridade 40 |

Contra os critérios de sucesso do GDD (seção 14):
- **Entende por que perdeu:** a tela de derrota diz quantas tropas entraram, que porcentagem da estrada estava coberta, pinta de vermelho o trecho sem cobertura e aponta barricadas sem atirador por perto e materiais parados.
- **Posicionamento muda o resultado:** o mesmo atirador vai de 0 a 2 abates na onda 1 conforme a casa (mapa de calor na simulação); dois atiradores bem postos vencem, longe da estrada perdem.
- **Duas estratégias viáveis:** três combinações diferentes vencem.
- **Melhorias alteram decisões / dificuldade progressiva:** ainda não testável (sem roguelite, só 2 ondas).
- **Interface clara:** materiais, onda, tropas e integridade sempre visíveis; integridade também sobre o arraial no mapa.

Uma partida no navegador reproduziu exatamente os números da simulação.

## 6. Direção visual adotada

- Mapa: papel com aguadas de aquarela, traço de nanquim, caatinga (lajedo, moita, mandacaru), estrada de terra com sulcos de carroça, o leito do Vaza-Barris na borda direita, Belo Monte com casebres de telhado de barro, igreja de duas torres e cruzeiro na praça.
- Tropas em azul-acinzentado escuro (legível sobre o ocre); defensores em couro e algodão cru, numa trincheira com parapeito de pedra.
- Página: cabeçalho como capa de folheto de cordel (amarelo, letra de tipo de madeira, vinheta de dentes de serra).
- **Nada disso está validado historicamente.** Uniformes, armas, tipo de construção das casas e da igreja ficam para a pesquisa.

## 7. Próximos passos, na ordem do GDD

1. ~~Economia~~ (feito nesta versão).
2. **Sistema híbrido completo:** pontos fixos no mapa para o posto de observação; definir quantos e onde.
3. **Dez ondas**, com os outros três inimigos (avançada, engenharia ficcional, comando).
4. **Melhorias roguelite** entre ondas (3 opções, escolhe 1).
5. Demais estruturas: posto de observação, depósito, posto de socorro (e com ele a regra de reparo).
6. Arte final e áudio.
7. Balanceamento com as 10 ondas.

Decisões pendentes do GDD que continuam abertas: engine, regras completas de reparo, número e lugar dos pontos fixos, valores finais, pesquisa histórica.
