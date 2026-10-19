# Canudos: A Última Resistência — notas da versão 0.4

**Data:** 19/10/2026
**Parte de:** `NOTAS_v0.3.md` (regras, menu e Conselheiro continuam valendo)
**Estado:** jogável; testado no navegador e com capturas de `testes/visual.html`.

## 1. O que mudou

O desenho virou **pixel art isométrico**, a pedido do Miguel em 19/10. Ele achou o mapa feio e simples, e o sertão caricato, "como se o Nordeste só tivesse cactos". As regras, o menu, o Conselheiro, as ondas e os números não mudaram: só o desenho foi trocado.

| Arquivo | O que é |
|---|---|
| `render_pixel.js` | O novo desenho. Tem a mesma interface do `render.js`, por isso o `ui.js` não precisou mudar. |
| `render.js` | O desenho em aquarela da v0.3, guardado. Abra o jogo com `?estilo=aquarela` na URL para vê-lo. |
| `testes/visual.html` | Monta uma cena fixa (barricada, atiradores, Conselheiro, combate simulado) para capturas. Aceita `?t=segundos`, `?zoom=fx,fy,fw,fh&k=escala`, `?ferramenta=atiradores` e `?predica=1`. |

## 2. Como o pixel fica nítido e o movimento fica fluido

- **A arte:** uma casa da grade vira um losango de 32 × 16 px de arte. O mapa inteiro tem 656 × 418 px de arte.
- **O buffer:** cada px de arte vira m × m px, com m inteiro de 2 a 4, escolhido pelo tamanho da tela. No fim, o buffer é reduzido para a tela com suavização. O pixel fica uniforme, sem a serrilha da escala quebrada.
- **O movimento:** tropas, Conselheiro, fumaça e bichos andam em frações de px de arte (1/m), então deslizam em vez de pular de pixel em pixel.
- **As animações:** marcha de 8 quadros presa à distância andada (o pé não escorrega) e golpe de 4 quadros. O Conselheiro tem passo, respiração parada e pose de Prédica. Os atiradores giram o fuzil suavemente até o alvo e recuam a cada tiro, enquanto o companheiro recarrega.
- **O custo:** cerca de 4 ms por quadro no processador, com o buffer em 3× ou 4×. A cena fixa (céu, serras, chão, vegetação de fora) é montada uma vez, em cerca de 0,35 s.
- Com "reduzir movimento" ligado, param o vento, as nuvens, as aves, o calor no horizonte e a fumaça. A animação das tropas continua, porque faz parte do jogo.

## 3. O sertão que aparece

A seca de 1897, sem cactos em toda parte:

- **Vegetação:**
  - **A caatinga:** é "mata branca", de galhos cinza-prata quase sem folha (catingueira, jurema).
  - **O verde que resiste:** juazeiro e oiticica, que não perdem a folha.
  - **As outras plantas:** umbuzeiro, licurizeiro (a palmeira do norte da Bahia), favela, macambira avermelhada pela seca e xique-xique e coroa-de-frade sobre os lajedos de granito.
  - **O mandacaru e o facheiro:** só como pontos de destaque.
- **Paisagem e luz:**
  - **O rio:** o Vaza-Barris corre seco, com poças que brilham e craibeiras amarelas em flor na margem.
  - **O fundo:** serras azuladas e o sol baixo da tarde. A luz é mais quente do lado do sol, as sombras são compridas e se vê o tremor do calor no horizonte.
- **O arraial:** casas de taipa com palha ou telha, a Igreja Nova do Bom Jesus ainda com andaime, a Igreja Velha de Santo Antônio, o cruzeiro, galinhas na praça e fumaça de fogão a lenha. Belo Monte continua além do recorte do mapa.
- **A vida em volta:** cabras num cercado além do rio, um carcará circulando, revoadas de avoantes, redemoinhos de poeira e sombras de nuvem passando.

Os nomes das plantas estão na seção "Sobre a ambientação" da página. Nenhum desenho foi validado como reconstrução histórica: uniformes, igrejas e casas continuam na lista de pesquisa.

## 4. Pendências

- O Miguel ainda não viu esta versão. Se ele estranhar algo, perguntar antes de trocar de novo.
- A página em volta do mapa continua no estilo cordel (papel amarelo, letra de tipo de madeira). Combina com o tema, mas não é pixel art; vale perguntar se ele quer as duas linguagens.
- O próximo passo de jogo segue o da v0.3: prévia da onda, cobertura visível na preparação e as 10 ondas.
