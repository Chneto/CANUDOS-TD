# HANDOFF DE PROJETO — CANUDOS: A ÚLTIMA RESISTÊNCIA

**Versão:** 0.1  
**Tipo:** Game Design Document (GDD) inicial + especificação do protótipo  
**Gênero:** Tower Defense com elementos roguelite  
**Contexto histórico:** Guerra de Canudos (1896–1897)  
**Status:** Conceito definido; implementação ainda não iniciada nesta etapa.

> Cópia do documento recebido em 18/10/2026, guardada sem alterações. O que mudou depois está em `NOTAS_v0.2.md`.

## 1. Objetivo do projeto

Desenvolver um jogo indie de Tower Defense inspirado na Guerra de Canudos, ambientado no sertão baiano do final do século XIX.

O jogador organiza a defesa do arraial contra ondas de tropas governamentais, administrando recursos limitados, posicionando estruturas defensivas e escolhendo melhorias que alteram a estratégia de cada tentativa.

O projeto foi concebido para desenvolvimento solo ou por uma equipe pequena, com foco em um protótipo viável antes da expansão do conteúdo.

## 2. Decisões de design confirmadas

- **Câmera:** 2D, visão de cima.
- **Progressão:** roguelite.
- **Posicionamento:** sistema híbrido, combinando pontos fixos com construção livre em áreas válidas.
- **Condição de vitória:** concluir uma sequência definida de ondas.
- **Condição de derrota:** a integridade do objetivo chega a zero.
- **Estilo visual:** ilustração histórica 2D, inspirada em gravuras, aquarela e materiais visuais do sertão.
- **Escopo:** projeto solo ou pequeno.
- **Engine:** ainda não escolhida; Godot com GDScript foi recomendada como opção inicial.
- **Plataforma inicial proposta:** PC.
- **Duração desejada:** aproximadamente 15–25 minutos por tentativa, sujeita a testes.

O título provisório é **Canudos: A Última Resistência**.

## 3. Pilares do jogo

1. Posicionamento tático de estruturas.
2. Economia baseada em recursos limitados.
3. Melhorias aleatórias durante cada tentativa.
4. Ambientação histórica ligada ao sertão baiano e à Guerra de Canudos.

O diferencial pretendido é substituir as torres tradicionais de fantasia por posições defensivas, barricadas e estruturas de apoio inspiradas no contexto histórico.

## 4. Ciclo principal de jogo

1. Preparar a defesa e distribuir os recursos.
2. Enfrentar uma onda de tropas.
3. Receber materiais por eliminações e conclusão da onda.
4. Escolher uma melhoria entre três opções.
5. Reparar estruturas, construir novas defesas e reorganizar o mapa.
6. Avançar para uma onda mais difícil.
7. Vencer ao concluir a décima onda ou perder quando a integridade do objetivo chega a zero.

O jogador pode construir durante o combate, mas o tempo continua correndo. Entre as ondas, o combate é interrompido para planejamento e escolha de melhorias.

## 5. Sistema de posicionamento híbrido

O mapa possui três categorias de área:

- **Pontos fixos:** reservados para estruturas especiais, como postos de observação.
- **Áreas livres:** permitem construir estruturas compatíveis com o terreno.
- **Áreas proibidas:** incluem rotas inimigas, obstáculos, edifícios e limites incompatíveis com a construção.

A implementação inicial deverá utilizar uma grade de células, mesmo que a arte tenha aparência orgânica.

Regras:
- Mostrar uma prévia verde quando a construção for válida e vermelha quando for inválida.
- Não permitir construção sem recursos suficientes.
- Estruturas em construção não atacam.
- Impedir que construções bloqueiem completamente a rota inimiga.
- Permitir desmontagem ou venda com reembolso parcial.
- Não implementar terreno destrutível ou navegação dinâmica na primeira versão.

## 6. Recursos e economia

O protótipo utilizará apenas um recurso: **materiais**.

Valores iniciais propostos:

| Elemento | Valor |
|---|---:|
| Materiais iniciais | 120 |
| Barricada | 25 |
| Posição de atiradores | 60 |
| Posto de observação | 50 |
| Depósito de materiais | 75 |
| Posto de socorro | 65 |
| Recompensa por inimigo derrotado | +5 |
| Recompensa por onda concluída | +15 |
| Reembolso na venda | 50% do custo original |

Materiais não gastos são mantidos entre ondas. Inimigos que alcançam o objetivo não concedem recompensa por eliminação.

Todos os valores são provisórios e precisam ser testados e balanceados.

## 7. Estruturas defensivas

### Barricada
- Custo: 25.
- Integridade inicial: 300.
- Função: atrasar o avanço das tropas e permitir que outras estruturas causem dano.

### Posição de atiradores
- Custo: 60.
- Dano inicial: 20.
- Intervalo entre ataques: 1,2 segundo.
- Função: causar dano a um alvo dentro do alcance.

### Posto de observação
- Custo: 50.
- Função: estrutura de suporte.
- Bônus proposto: +15% de alcance para estruturas aliadas próximas.

### Depósito de materiais
- Custo: 75.
- Função: economia.
- Bônus proposto: +10 materiais por onda.

### Posto de socorro
- Custo: 65.
- Função: recuperação.
- Na primeira versão, recupera estruturas entre ondas, sem simulação individual de ferimentos.

Essas estruturas são conceitos funcionais de jogo. Sua representação histórica definitiva deverá ser validada por pesquisa antes da versão final.

## 8. Inimigos

Os inimigos seguirão rotas fixas usando pontos de passagem.

Arquétipos iniciais:

| Tipo | Vida | Velocidade | Função |
|---|---:|---:|---|
| Infantaria | 100 | 40 | Unidade básica |
| Avançada | 65 | 65 | Pressiona áreas desprotegidas |
| Engenharia ficcional | 160 | 30 | Causa dano adicional a barricadas |
| Comando | 120 | 35 | Concede bônus a unidades próximas |

Os números são parâmetros de prototipagem, não dados históricos.

Regras:
- Unidades derrotadas concedem recompensa apenas uma vez.
- Unidades que chegam ao objetivo causam dano e desaparecem.
- Inimigos que atacam barricadas devem parar para atacar a estrutura.
- A unidade de comando perde sua função de suporte quando é derrotada.
- O movimento deve evitar bloqueios permanentes e colisões que impeçam a conclusão das ondas.

## 9. Estrutura das dez ondas

A primeira versão terá dez ondas com dificuldade progressiva.

1. Seis unidades de infantaria.
2. Oito unidades de infantaria.
3. Seis de infantaria e três avançadas.
4. Dez de infantaria e três avançadas.
5. Dez de infantaria e duas unidades de engenharia ficcionais.
6. Doze de infantaria e cinco avançadas.
7. Dez de infantaria, três de engenharia e uma de comando.
8. Quatorze de infantaria, seis avançadas e uma de comando.
9. Doze de infantaria, quatro de engenharia e duas de comando.
10. Onda final com infantaria, engenharia ficcional e unidades de comando.

As composições representam uma proposta inicial de balanceamento. Não devem ser apresentadas como reprodução exata das expedições históricas.

## 10. Sistema roguelite

Ao concluir uma onda, o jogador recebe três opções de melhoria e escolhe uma.

Categorias:
- Defesa: integridade das barricadas e custos de reparo.
- Combate: alcance, cadência e dano.
- Organização: custos e eficiência de construção.
- Sustentação: materiais e recuperação.
- Táticas: bônus por posicionamento e proximidade entre estruturas.

Exemplos:
- Madeira reforçada: +30% de integridade das barricadas.
- Posicionamento elevado: +15% de alcance dos atiradores.
- Organização dos materiais: aumenta a produção dos depósitos.

Regras:
- Oferecer três opções diferentes sempre que houver opções elegíveis suficientes.
- Evitar melhorias incompatíveis com as estruturas disponíveis.
- Evitar duplicatas idênticas na mesma escolha.
- Permitir combinações de melhorias que alterem a estratégia.
- Não permitir que melhorias tornem a dificuldade trivial.

Entre tentativas, o jogador poderá desbloquear variantes de melhorias, desafios, registros históricos e, futuramente, mapas adicionais.

## 11. Direção de arte

A apresentação deve lembrar uma ilustração histórica 2D, e não uma fantasia medieval.

Referências visuais pretendidas:
- Sertão baiano semiárido.
- Caatinga, pedras, caminhos de terra e vegetação seca.
- Arquitetura rural compatível com o contexto pesquisado.
- Paleta de areia, ocre, marrom, argila e verde seco.
- Contornos inspirados em gravuras e texturas discretas de papel.
- Interface limpa, com boa diferenciação entre estruturas e inimigos.

A legibilidade tática tem prioridade sobre o excesso de detalhes.

## 12. Arquitetura técnica proposta

A Godot foi recomendada como engine inicial, mas ainda não foi escolhida definitivamente.

Organização sugerida:

- `MainMenu.tscn`: menu principal.
- `BattleMap.tscn`: cenário de combate.
- `Enemy.tscn`: unidade inimiga.
- `DefenseStructure.tscn`: estrutura defensiva.
- `UpgradeSelection.tscn`: tela de melhorias.

Scripts principais:
- `GameManager.gd`: estado geral da partida.
- `WaveManager.gd`: geração e conclusão de ondas.
- `Enemy.gd`: movimento, vida e derrota.
- `Structure.gd`: ataque, construção e integridade.
- `PlacementManager.gd`: posicionamento e validação de células.
- `ResourceManager.gd`: custos e recompensas.
- `UpgradeManager.gd`: sorteio e aplicação das melhorias.

Os dados de estruturas, inimigos e melhorias deverão ficar separados da lógica sempre que possível.

## 13. Escopo da primeira versão

A primeira versão deverá conter:

- Um único mapa.
- Uma rota principal.
- Uma barra de integridade para o objetivo.
- Uma estrutura de ataque.
- Uma barricada.
- Um tipo de inimigo.
- Construção funcional.
- Uma onda funcional.
- Vitória e derrota.
- Reinício da partida.

Depois, adicionar:
1. Economia.
2. Sistema híbrido completo.
3. Dez ondas.
4. Melhorias roguelite.
5. Outras estruturas e inimigos.
6. Arte ilustrada e áudio.
7. Balanceamento e testes.

Ficam fora do escopo inicial: multiplayer, vários mapas, geração procedural de mapas, terreno destrutível, árvore tecnológica extensa, personagens individuais complexos e simulação detalhada de fome, sede e saúde.

## 14. Critérios de sucesso

O protótipo deverá demonstrar que:
- O jogador entende por que perdeu.
- O posicionamento muda o resultado.
- Existem pelo menos duas estratégias viáveis para concluir as ondas.
- As melhorias alteram decisões, em vez de apenas aumentar atributos.
- A dificuldade aumenta progressivamente.
- A interface apresenta claramente os recursos, os inimigos e o estado do objetivo.

## 15. Próximas decisões e tarefas

Ainda precisam ser definidos:
- Escolha definitiva da engine.
- Dimensões e layout do primeiro mapa.
- Alcance dos atiradores e integridade do objetivo.
- Dano causado por cada tipo de inimigo.
- Regras completas de reparo.
- Número e distribuição de pontos fixos.
- Valores finais de custos e recompensas.
- Pesquisa histórica para validar estruturas, equipamentos, uniformes e composição das expedições.

### Próximo passo recomendado

Construir a primeira cena jogável na engine escolhida, com uma rota fixa, seis inimigos básicos, uma posição de atiradores e um objetivo com integridade.

A meta imediata é provar que o ciclo básico de ataque e defesa funciona antes de desenvolver os sistemas roguelite e a arte final.

**Instrução para a próxima conversa:** continue o projeto a partir deste handoff. Preserve as decisões confirmadas, diferencie os parâmetros provisórios dos requisitos definitivos e avance de maneira incremental, priorizando um protótipo funcional e historicamente responsável.
