/* Canudos: A Última Resistência — dados do protótipo v0.5
 *
 * Tudo aqui é parâmetro de prototipagem, não dado histórico.
 * Origem de cada número:
 *   [GDD]  veio do GDD v0.1 (já era provisório lá)
 *   [v0.2] o GDD deixou em aberto; este protótipo precisou de um valor para rodar
 *   [v0.5] fases, inimigos novos e ondas desta versão
 */
(function (raiz) {
  'use strict';

  var DADOS = {
    versao: '0.5',

    // Grade lógica: 24 × 16 células de 40 px (tela de 960 × 640)   [v0.2]
    celula: 40,
    colunas: 24,
    linhas: 16,

    economia: {
      materiaisIniciais: 120,  // [GDD]
      recompensaAbate: 5,      // [GDD]
      recompensaOnda: 15,      // [GDD]
      reembolsoVenda: 0.5      // [GDD] 50% do custo original
    },

    objetivo: {
      nome: 'Arraial',
      integridade: 100         // [v0.2]
    },

    estruturas: {
      barricada: {
        nome: 'Barricada',
        custo: 25,             // [GDD]
        integridade: 300,      // [GDD]
        tempoConstrucao: 1.5,  // [v0.2] segundos; só conta durante o combate
        terreno: 'estrada',
        resumo: 'Só na estrada. As tropas param para derrubá-la.'
      },
      atiradores: {
        nome: 'Atiradores',
        nomeLongo: 'Posição de atiradores',
        custo: 60,             // [GDD]
        dano: 20,              // [GDD]
        intervalo: 1.2,        // [GDD] segundos entre tiros
        alcance: 3.5,          // [v0.2] em células
        tempoConstrucao: 3,    // [v0.2]
        terreno: 'livre',
        resumo: 'Fora da estrada. Atira na tropa mais adiantada.'
      }
    },

    // Campeão. Antônio Conselheiro era líder religioso, não combatente: ele não
    // ataca, não é alvo e não morre. Organiza o trabalho coletivo (mutirão) e
    // sustenta a firmeza de quem defende (prédica). A prédica não aumenta dano:
    // ligar a pregação a mais mortes repetiria a imagem de fanatismo que a
    // imprensa da época usou contra o arraial. Todos os números são [v0.3].
    campeao: {
      nome: 'Antônio Conselheiro',
      inicio: [18, 9],          // perto da entrada do arraial
      velocidade: 30,           // px/s; anda mais devagar que as tropas
      velocidadePreparo: 70,    // [v0.5] px/s na preparação: o tempo da batalha está parado, ele só se reposiciona
      // atiradores a até 3 casas: intervalo × 0,8 (25% mais tiros). Desliga enquanto ele anda.
      aura: { raio: 3, intervalo: 0.8 },
      mutirao: {
        nome: 'Mutirão', recarga: 35, raio: 4, reparo: 150,
        resumo: 'Repara barricadas e conclui obras a até 4 casas dele.'
      },
      predica: {
        nome: 'Prédica', recarga: 30, duracao: 8, raio: 4.5, reducaoDano: 0.5,
        resumo: 'Por 8 s, barricadas a até 4,5 casas dele perdem integridade pela metade.'
      }
    },

    // Os tipos novos são de jogo, não reconstrução histórica: o GDD já trazia a
    // tropa avançada, a engenharia (ficcional) e o comando como arquétipos.
    inimigos: {
      infantaria: {
        nome: 'Infantaria', plural: 'de infantaria',
        vida: 100,             // [GDD]
        velocidade: 40,        // [GDD] lido como px/s, ou 1 célula por segundo
        danoObjetivo: 20,      // [v0.2] integridade que tira ao entrar no arraial
        danoBarricada: 10,     // [v0.2] por golpe
        intervaloAtaque: 1     // [v0.2] segundos entre golpes
      },
      batedor: {
        nome: 'Batedores', plural: 'batedores', resumo: 'rápidos e frágeis',
        vida: 60, velocidade: 66, danoObjetivo: 15, danoBarricada: 6, intervaloAtaque: 0.8   // [v0.5]
      },
      sapador: {
        nome: 'Sapadores', plural: 'sapadores', resumo: 'lentos; derrubam barricada depressa',
        vida: 170, velocidade: 28, danoObjetivo: 20, danoBarricada: 32, intervaloAtaque: 1.2  // [v0.5]
      },
      oficial: {
        nome: 'Oficial', plural: 'oficiais', resumo: 'quem marcha perto dele leva menos dano',
        vida: 150, velocidade: 36, danoObjetivo: 25, danoBarricada: 10, intervaloAtaque: 1,   // [v0.5]
        recompensa: 15,
        comando: { raio: 2, reducaoDano: 0.3 }   // [v0.5] tropas a até 2 casas recebem 30% menos dano
      }
    },

    // Quatro fases, uma por expedição, cada uma com dez ondas. Cada fase começa do
    // zero: materiais da fase, arraial inteiro, nada construído. A história de cada
    // expedição está em historia.js. Composições, intervalos e "vigor" (multiplica a
    // vida das tropas) são todos [v0.5]; "crescimento" soma vigor a cada onda (0,05 = +5% de
    // vida por onda), para as últimas ondas pesarem mais que a economia. A onda 6 é de respiro.
    // Formato de cada onda: [intervalo entre tropas em s, infantaria, batedores, sapadores, oficiais]
    expedicoes: [
      {
        id: 'uaua', nome: 'Uauá', ordem: '1ª expedição', data: 'novembro de 1896',
        materiais: 120, vigor: 1, crescimento: 0.1,
        ondas: [
          [1.6,  6], [1.5,  8], [1.4,  10], [1.4,  10,  3], [1.3,  13,  2],
          [1.4,  9,  5], [1.2,  15,  4], [1.15,  16,  7], [1.1,  19,  6], [1.0,  22,  9]
        ]
      },
      {
        id: 'cambaio', nome: 'Serra do Cambaio', ordem: '2ª expedição', data: 'janeiro de 1897',
        materiais: 180, vigor: 1.1, crescimento: 0.1,
        ondas: [
          [1.4,  8], [1.3,  10,  3], [1.3,  10,  0,  2], [1.2,  14,  4], [1.2,  14,  2,  3],
          [1.3,  10,  6], [1.1,  18,  4,  3], [1.05,  20,  7,  3], [1.0,  22,  5,  5], [0.95,  26,  9,  5]
        ]
      },
      {
        id: 'moreira', nome: 'Belo Monte, março', ordem: '3ª expedição', data: 'fevereiro e março de 1897',
        materiais: 260, vigor: 1.1, crescimento: 0.05,
        ondas: [
          [1.3,  10,  2], [1.2,  12,  0,  2], [1.2,  12,  6], [1.1,  16,  0,  2,  1], [1.05,  18,  3,  3,  1],
          [1.1,  14,  7], [1.0,  22,  5,  4,  1], [0.95,  24,  9,  3,  2], [0.9,  27,  4,  6,  2], [0.85,  32,  10,  7,  3]
        ]
      },
      {
        id: 'cerco', nome: 'O cerco', ordem: '4ª expedição', data: 'junho a outubro de 1897',
        materiais: 340, vigor: 1.2, crescimento: 0.055,
        ondas: [
          [1.1,  12,  3], [1.05,  16,  0,  3,  1], [1.0,  18,  8], [0.95,  22,  0,  5,  2], [0.9,  26,  8,  2,  2],
          [1.0,  20,  9], [0.85,  30,  4,  7,  2], [0.8,  33,  12,  4,  3], [0.8,  36,  6,  9,  3], [0.75,  44,  14,  12,  5]
        ]
      }
    ],

    mapa: {
      nome: 'Belo Monte',
      // Rota em células (centros), só trechos retos. Começa fora da tela e termina
      // na entrada do arraial.
      rota: [[-1, 2], [5, 2], [5, 10], [11, 10], [11, 4], [17, 4], [17, 11], [19, 11]],
      // As primeiras células da estrada não aceitam barricada: é onde as tropas surgem.
      celulasProtegidas: 2,
      arraial: { x: 19, y: 9, w: 4, h: 5 },
      rio: { coluna: 23 },     // leito do Vaza-Barris, ao longo da borda direita
      // [x, y, desenho]. Para as regras, todos só bloqueiam construção.
      obstaculos: [
        [8, 6, 'lajedo'], [8, 7, 'lajedo'], [9, 7, 'lajedo'],
        [14, 7, 'caatinga'], [13, 8, 'caatinga'], [14, 8, 'mandacaru'],
        [2, 6, 'caatinga'], [3, 7, 'lajedo'], [1, 12, 'mandacaru'], [2, 13, 'caatinga'],
        [7, 13, 'lajedo'], [8, 14, 'caatinga'], [14, 13, 'caatinga'], [15, 14, 'lajedo'],
        [20, 2, 'lajedo'], [21, 3, 'mandacaru'], [19, 6, 'caatinga'], [3, 0, 'lajedo'],
        [9, 1, 'caatinga'], [16, 1, 'mandacaru']
      ]
    }
  };

  raiz.CANUDOS_DADOS = DADOS;
  if (typeof module !== 'undefined' && module.exports) module.exports = DADOS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
