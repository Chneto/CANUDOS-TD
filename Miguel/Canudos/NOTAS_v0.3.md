# Canudos: A Última Resistência — notas da versão 0.3

**Data:** 18/10/2026  
**Parte de:** `NOTAS_v0.2.md` (o que valia antes) e `HANDOFF_v0.1.md` (GDD original)  
**Estado:** jogável e testado em simulação e no navegador.

## 1. O que mudou desde a 0.2

| Mudança | Pedido | Onde |
|---|---|---|
| Câmera **isométrica** (losangos 2:1) no lugar da vista de cima | Miguel, 18/10 | `render.js` |
| **Menu inicial** com Iniciar (ou Continuar e Novo jogo), Configurações e Sair | Miguel, 18/10 | `index.html`, `ui.js` |
| **Campeão Antônio Conselheiro** | Miguel, 18/10 | `dados.js`, `nucleo.js`, `render.js`, `ui.js` |
| Análise de outros jogos do gênero | Miguel, 18/10 | `ANALISE_GENERO.md` |

**Decisão do GDD alterada:** a seção 2 dizia "Câmera: 2D, visão de cima". Passa a ser **2D isométrica**, por decisão do Miguel.

## 2. Câmera isométrica

- As regras (`nucleo.js`) não mudaram: continuam numa grade de 24 × 16 vista de cima. Só o desenho e o clique passam pela projeção. Por isso a simulação e o balanceamento da 0.2 continuam valendo.
- Uma casa vira um losango de 56 × 28 px. O que fica no chão (estrada, rio, alcance, marcações) é desenhado com a projeção aplicada ao canvas; o que fica de pé (pedras, moitas, mandacarus, casas, igreja, gente) é desenhado em px de tela e ordenado de trás para a frente.
- O mundo continua para além da área jogável, esmaecido: a estrada vem de fora do mapa e o Vaza-Barris segue pela borda leste.
- Clicar no desenho de uma estrutura ou do Conselheiro seleciona, mesmo quando o desenho sobe acima da própria casa.
- Na migração para Godot, isso vira um `TileMap` isométrico com `y-sort`.

## 3. Menu inicial

- **Iniciar** começa a partida. Com uma partida em andamento, aparecem **Continuar** e **Novo jogo**.
- **Configurações** (guardadas no navegador): velocidade ao iniciar, mostrar sempre o alcance dos atiradores, reduzir movimento, pausar quando a aba ficar oculta. Nenhuma opção é de enfeite: todas funcionam.
- **Sair** explica que o navegador não deixa a página se fechar sozinha; numa versão para PC, o botão encerra o jogo.
- No jogo, o botão **Menu** ou o **Esc** (sem obra nem seleção ativas) abrem o menu e pausam o combate.
- **Papel de parede:** o menu e o retrato do Conselheiro usam `capa.jpg` desta pasta. A imagem que o Miguel colou na conversa não ficou salva em disco; enquanto `capa.jpg` não existir, o menu usa um fundo desenhado (noite com lua vermelha) e o retrato usa o boneco do jogo.

## 4. Antônio Conselheiro

Coerente com o papel histórico: **líder religioso, não combatente**. Ele não ataca. As habilidades vêm do que ele fazia: organizava trabalho coletivo (construiu e reformou igrejas, cemitérios e açudes pelo sertão) e pregava.

| Elemento | Regra (todos os números `[v0.3]`, provisórios) |
|---|---|
| Posição | Começa ao lado do arraial (casa 18,9). Clique nele e depois numa casa livre fora da estrada. Na preparação chega na hora; no combate anda a 30 px/s, mais devagar que as tropas. Não se constrói na casa dele. |
| Presença | As tropas não o atacam: ele não é alvo, não perde vida e não morre. |
| Aura | Com ele **parado**, atiradores a até 3 casas atiram 25% mais rápido (intervalo × 0,8). Enquanto anda, a aura desliga: mudá-lo de lugar custa algo. |
| Mutirão (Q) | Repara 150 de integridade de cada barricada e conclui as obras a até 4 casas. Recarga de 35 s de combate. Pode ser usado na preparação, e é assim que se repara entre ondas. Se não houver nada para reparar, não gasta a recarga. |
| Prédica (W) | Por 8 s, barricadas a até 4,5 casas perdem integridade pela metade. Recarga de 30 s. Só no combate. |
| Derrota | Se nenhum atirador ficou na aura dele, a tela de derrota avisa. |

**Por que a Prédica não aumenta dano.** A primeira versão desta tarde fazia os atiradores causarem 50% mais dano. A análise do gênero apontou o problema, e eu concordo: ligar a pregação a mais mortes repete a imagem de fanatismo que a imprensa republicana da época usou contra o arraial. Ela passou a sustentar a firmeza da defesa. Pelo mesmo motivo, a tela final diz "tropas detidas" em vez de "abatidas".

Representação: camisolão azul até os pés, cordão na cintura, cabelo e barba brancos e longos, cajado e livro, sem arma. O camisolão azul tem apoio nas descrições de época; o resto ainda precisa de pesquisa iconográfica.

### Efeito no balanceamento (simulação, `testes/simular.js`)

| Estratégia | Sem levar o Conselheiro | Com o Conselheiro ao lado dos atiradores |
|---|---|---|
| Nada construído | perde na onda 1 | perde na onda 1 |
| 1 atirador bem posto | perde na onda 2 | perde na onda 2 (6 tropas detidas em vez de 4) |
| 1 atirador + barricada | perde na onda 2 | **vence** (integridade 60) |
| 2 atiradores | vence (60) | vence (60) |

Ele pesa, mas não resolve sozinho: sem atiradores, perde-se do mesmo jeito. Posicioná-lo vira uma decisão de verdade, porque o mesmo plano perde ou vence conforme onde ele fica.

## 5. Pendências desta versão

- Salvar o papel de parede como `capa.jpg` nesta pasta para o menu e o retrato o usarem. Depois disso é preciso conferir o recorte do retrato.
- O mapa fica pequeno no celular (losango de cerca de 16 px por casa). O alvo continua sendo PC.
- Pesquisa histórica pendente: iconografia do Conselheiro, uniformes, armas, tipo de construção das casas e da igreja.
- Próximos passos de jogo: ver `ANALISE_GENERO.md` e a seção 7 de `NOTAS_v0.2.md`.

## 6. O que a análise do gênero recomenda fazer primeiro

Resumo de `ANALISE_GENERO.md` (10 jogos analisados, com fontes). Já aplicado nesta versão: Conselheiro como presença e não como combatente, aura que desliga enquanto ele anda, Prédica sem dano.

1. **Prévia da onda com ficha do inimigo novo** (Kingdom Rush, Thronefall, Plants vs. Zombies), junto com uma curva de 10 ondas que apresenta um inimigo de cada vez e tem uma onda de respiro (a 6). Custo baixo.
2. **Cobertura da estrada visível na preparação** (Defense Grid): hoje o vermelho só aparece na derrota (ou com a tecla C). A prévia do atirador diria quantas casas de estrada ele passa a cobrir. Custo baixo.
3. **Barricada que diz quanto segura**: tempo de contenção e aviso de "sem cobertura" já na prévia. Custo baixo.
4. **Melhorias roguelite que mudam regras**, com as 3 opções sempre de categorias diferentes, re-sorteio pago e cada melhoria testada em `testes/simular.js` antes de entrar. Custo médio.
5. **Açude**, obra que só o Conselheiro começa e que rende materiais depois de duas ondas: cria a estratégia econômica e combina com o papel histórico dele. Pode substituir o depósito. Custo médio.

Riscos que a análise manda evitar: poder permanente entre tentativas, campeão de ação, experiência por abate, tom cômico, modo infinito e cadeias de barricadas baratas virando a única estratégia.
