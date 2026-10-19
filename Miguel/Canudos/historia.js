/* Canudos: A Última Resistência — a história contada entre as fases (protótipo v0.5)
 *
 * Fatos conferidos em Euclides da Cunha, "Os Sertões" (1902), e no verbete
 * "Guerra de Canudos" da Wikipédia, que segue a historiografia. Quando as fontes
 * divergem (efetivos, população, número de mortos), o texto dá a faixa ou diz que
 * os números variam. Nada aqui vem dos números do jogo, e nada do jogo é
 * apresentado como dado histórico.
 */
(function (raiz) {
  'use strict';

  var HISTORIA = {
    fontes: 'Fontes: Euclides da Cunha, Os Sertões (1902), e o verbete “Guerra de Canudos” da Wikipédia. Datas e números variam entre as fontes; aqui estão os mais citados.',
    avisoJogo: 'No jogo, toda batalha acontece na estrada que chega a Belo Monte, e os números são de jogo, não da história.',

    prologo: {
      sobre: 'Sertão da Bahia',
      titulo: 'Belo Monte',
      data: '1893 a 1896',
      paragrafos: [
        'Antônio Vicente Mendes Maciel andou pelo sertão por mais de vinte anos. Chamado de Antônio Conselheiro, reformava igrejas e cemitérios, construía açudes e pregava.',
        'Em 1893, depois de um choque com a polícia, ele se fixou com seus seguidores numa fazenda abandonada à beira do rio Vaza-Barris, no norte da Bahia. O lugar se chamava Canudos. Eles o chamaram de Belo Monte.',
        'Para lá foram vaqueiros, lavradores sem terra, ex-escravizados, indígenas e famílias inteiras fugindo da seca e da pobreza. Plantavam, criavam cabras, comerciavam e erguiam casas de taipa, a Igreja de Santo Antônio e uma igreja nova, muito maior. As estimativas da população variam muito: de alguns milhares a mais de vinte mil pessoas.',
        'Para fazendeiros, parte do clero e o governo da jovem República, o arraial era uma ameaça. Atraía trabalhadores das fazendas e não se submetia às autoridades. O Conselheiro pregava contra medidas da República, como o casamento civil e a cobrança de impostos.'
      ]
    },

    // Uma por fase: "antes" abre a fase; "depois" conta o que aconteceu de fato.
    expedicoes: [
      {
        antes: {
          sobre: '1ª expedição · novembro de 1896',
          titulo: 'Uauá',
          paragrafos: [
            'Belo Monte comprou em Juazeiro uma carga de madeira para a igreja nova. A madeira não foi entregue, e correu o boato de que os conselheiristas viriam buscá-la à força. O juiz da cidade pediu tropas ao governo da Bahia.',
            'Cerca de cem soldados, sob o comando do tenente Manuel da Silva Pires Ferreira, marcharam sertão adentro. Na madrugada de 21 de novembro, no povoado de Uauá, foram atacados por sertanejos que vinham de Belo Monte.'
          ]
        },
        depois: {
          sobre: 'O que aconteceu em Uauá',
          titulo: 'A primeira retirada',
          paragrafos: [
            'O relatório do tenente registrou 150 sertanejos mortos e 10 soldados mortos. Mesmo assim, a tropa recuou até Juazeiro, saqueando e queimando Uauá no caminho.',
            'A notícia de que uma tropa do governo tinha recuado diante dos sertanejos, que a imprensa chamava de jagunços, correu o país.'
          ]
        }
      },
      {
        antes: {
          sobre: '2ª expedição · janeiro de 1897',
          titulo: 'Serra do Cambaio',
          paragrafos: [
            'O governo mandou uma força maior: 543 praças, 14 oficiais e 3 médicos, sob o major Febrônio de Brito, com dois canhões Krupp e quatro metralhadoras Nordenfelt.',
            'A tropa partiu de Monte Santo em 12 de janeiro de 1897. No caminho estava a Serra do Cambaio, onde os sertanejos esperavam entre as pedras.'
          ]
        },
        depois: {
          sobre: 'O que aconteceu no Cambaio',
          titulo: 'A segunda retirada',
          paragrafos: [
            'Em 18 de janeiro, depois de três horas de combate, a tropa atravessou o Cambaio. No dia seguinte, já perto do arraial, recuou e voltou a Monte Santo.',
            'Pela segunda vez, uma expedição voltava sem tomar Belo Monte.'
          ]
        }
      },
      {
        antes: {
          sobre: '3ª expedição · fevereiro e março de 1897',
          titulo: 'Moreira César',
          paragrafos: [
            'A República mandou então o coronel Antônio Moreira César, conhecido pela repressão violenta aos federalistas em Santa Catarina. Com ele iam cerca de 1.300 homens, com artilharia e cavalaria.',
            'A coluna saiu de Monte Santo em 22 de fevereiro. Desta vez, a tropa chegou ao arraial.'
          ]
        },
        depois: {
          sobre: 'O que aconteceu em março',
          titulo: 'A debandada',
          paragrafos: [
            'No começo de março, Moreira César lançou o ataque. Os soldados se perderam nas vielas de Belo Monte, onde cada casa servia de trincheira. O coronel foi ferido de morte. O coronel Pedro Nunes Tamarindo assumiu o comando e morreu na retirada, que virou debandada.',
            'Ficaram pelo caminho armas e munição, que os sertanejos recolheram. No Rio de Janeiro, a derrota causou comoção: jornais monarquistas foram atacados, e o governo decretou luto nacional.'
          ]
        }
      },
      {
        antes: {
          sobre: '4ª expedição · junho a outubro de 1897',
          titulo: 'O cerco',
          paragrafos: [
            'Para a quarta expedição, o governo reuniu batalhões de vários estados, sob o general Artur Oscar de Andrade Guimarães. Duas colunas chegaram diante do arraial no fim de junho. Com os reforços que vieram depois, a força chegou a cerca de dez mil soldados; algumas fontes falam em doze mil.',
            'Do alto do morro da Favela, a artilharia bombardeava as casas e as igrejas. Entre os canhões estava um Whitworth de 32, que os sertanejos chamavam de Matadeira.',
            'Esta é a última fase.'
          ]
        }
      }
    ],

    epilogo: {
      sobre: 'Belo Monte, 1897',
      titulo: 'Canudos não se rendeu',
      abertura: {
        vitoria: 'No jogo, Belo Monte resistiu às quatro expedições. Na história, não.',
        derrota: 'No jogo, o arraial caiu no cerco. Na história, também caiu.'
      },
      paragrafos: [
        'O cerco durou mais de três meses. O ministro da Guerra, marechal Carlos Machado Bittencourt, foi ao sertão organizar o abastecimento e os reforços.',
        'Antônio Conselheiro morreu em 22 de setembro de 1897. A resistência terminou em 5 de outubro. Segundo Euclides da Cunha, os últimos defensores eram quatro: um velho, dois homens feitos e uma criança.',
        'Muitos dos que se renderam foram degolados pelos soldados. O arraial foi arrasado e queimado. As estimativas de mortos na guerra vão de cerca de 15 mil a 30 mil pessoas.',
        'Euclides da Cunha acompanhou a última expedição como correspondente e, em 1902, publicou Os Sertões. No fim da década de 1960, as ruínas de Belo Monte ficaram sob as águas do açude de Cocorobó.'
      ]
    }
  };

  raiz.CANUDOS_HISTORIA = HISTORIA;
  if (typeof module !== 'undefined' && module.exports) module.exports = HISTORIA;
})(typeof globalThis !== 'undefined' ? globalThis : this);
