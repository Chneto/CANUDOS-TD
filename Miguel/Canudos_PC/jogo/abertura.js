/* Canudos: A Última Resistência — vinheta de abertura do estúdio (Bilola Games)
 *
 * Antes do menu principal, como nos jogos que mostram quem os fez: o nome se
 * monta com blocos de pixel que chegam espalhados, um brilho passa por cima,
 * aparece "GAMES" e a tela se apaga. Dura uns 3,4 s. Um clique, um toque ou
 * qualquer tecla pula. Com "reduzir movimento" do sistema, o logo aparece
 * parado e some depois de um instante.
 */
(function (raiz) {
  'use strict';

  // Letras de 5 × 7 blocos, só as que o nome usa.
  var FONTE = {
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110']
  };
  // Do topo para a base de cada letra: ouro claro até cobre (cores da paleta do jogo).
  var OURO = ['#FCEE9E', '#F6DC6A', '#E8C23A', '#E7BD4F', '#C9922C', '#B07E1E', '#9A6A1A'];
  var SOMBRA = '#3D2313', FUNDO = '#120E14', CREME = '#F3E7CC';

  var TEMPO = { chegada: [150, 1500], brilho: [1400, 1900], games: [1550, 2100], fim: 2950, saida: 450 };

  function blocos(palavra) {
    var lista = [], x0 = 0;
    for (var i = 0; i < palavra.length; i++) {
      var f = FONTE[palavra[i]];
      for (var y = 0; y < 7; y++) for (var x = 0; x < 5; x++) if (f[y][x] === '1') lista.push({ x: x0 + x, y: y });
      x0 += 6;
    }
    return { lista: lista, larg: x0 - 1 };
  }

  function semente(n) {
    var a = n >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function suave(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  // chega e passa um pouco do lugar antes de assentar
  function mola(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var c = 1.9;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }
  function faixa(agora, par) { return (agora - par[0]) / (par[1] - par[0]); }

  function mostrar(aoTerminar) {
    var calmo = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var sec = document.createElement('section');
    sec.className = 'abertura';
    sec.setAttribute('role', 'img');
    sec.setAttribute('aria-label', 'Bilola Games');
    sec.innerHTML = '<canvas aria-hidden="true"></canvas><p class="abertura-dica">Clique ou aperte qualquer tecla para pular</p>';
    document.body.appendChild(sec);
    var cv = sec.querySelector('canvas'), g = cv.getContext('2d');
    var nome = blocos('BILOLA'), sub = blocos('GAMES'), r = semente(1897);
    var pedacos = nome.lista.map(function (b) {
      var ang = r() * Math.PI * 2, dist = 0.6 + r() * 0.7;
      return {
        x: b.x, y: b.y, dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist,
        atraso: (b.x / nome.larg) * 0.45 + r() * 0.18
      };
    });
    var inicio = performance.now(), saindo = 0, acabou = false;
    // ?vinheta=ms congela a vinheta naquele instante (só para conferir o desenho)
    var fixo = /[?&]vinheta=(\d+)/.exec(raiz.location ? raiz.location.search : '');

    function medir() {
      var dpr = Math.min(2, raiz.devicePixelRatio || 1);
      cv.width = Math.round(innerWidth * dpr);
      cv.height = Math.round(innerHeight * dpr);
    }
    medir();
    raiz.addEventListener('resize', medir);

    function quadro(agora) {
      if (acabou) return;
      var t = fixo ? Number(fixo[1]) : calmo ? TEMPO.games[1] + 200 : agora - inicio;
      var W = cv.width, H = cv.height;
      // blocos inteiros: o logo fica nítido em qualquer tela
      var k = Math.max(3, Math.floor(Math.min(W * 0.62 / nome.larg, H * 0.16 / 7)));
      var ox = Math.round((W - nome.larg * k) / 2), oy = Math.round(H * 0.44 - 3.5 * k);
      g.fillStyle = FUNDO;
      g.fillRect(0, 0, W, H);
      var luz = g.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, Math.max(W, H) * 0.55);
      luz.addColorStop(0, 'rgba(201,146,44,.16)');
      luz.addColorStop(1, 'rgba(18,14,20,0)');
      g.fillStyle = luz;
      g.fillRect(0, 0, W, H);

      var brilho = faixa(t, TEMPO.brilho);
      pedacos.forEach(function (p) {
        var c = suave(faixa(t, TEMPO.chegada) * 1.6 - p.atraso), m = mola(Math.min(1, c * 1.05));
        var x = ox + (p.x + p.dx * (1 - m) * nome.larg * 0.9) * k;
        var y = oy + (p.y + p.dy * (1 - m) * 18) * k;
        if (c <= 0) return;
        g.globalAlpha = Math.min(1, c * 3);
        if (c >= 1) { g.fillStyle = SOMBRA; g.fillRect(Math.round(x + k * 0.5), Math.round(y + k * 0.5), k, k); }
        var cor = OURO[p.y];
        // o brilho é uma faixa diagonal que atravessa o nome
        var linha = brilho * (nome.larg + 10) - 5, dist = Math.abs((p.x - p.y * 0.6) - linha);
        if (brilho > 0 && brilho < 1 && dist < 1.6) cor = '#FFFBE6';
        g.fillStyle = cor;
        g.fillRect(Math.round(x), Math.round(y), k, k);
        g.globalAlpha = 1;
      });

      // GAMES, menor e espaçado, com um fio que cresce embaixo
      var a = suave(faixa(t, TEMPO.games));
      if (a > 0) {
        var ks = Math.max(2, Math.round(k * 0.42)), esp = ks * 1.6;
        var sx = Math.round((W - (sub.larg * ks + 4 * esp)) / 2), sy = Math.round(oy + 7 * k + k * 1.6);
        g.globalAlpha = a;
        g.fillStyle = CREME;
        sub.lista.forEach(function (b) {
          var letra = Math.floor(b.x / 6);
          g.fillRect(sx + b.x * ks + letra * esp, sy + b.y * ks + Math.round((1 - a) * ks * 2), ks, ks);
        });
        var fio = Math.round(nome.larg * k * a);
        g.fillStyle = '#C9922C';
        g.fillRect(Math.round(W / 2 - fio / 2), sy + 7 * ks + ks * 2, fio, Math.max(2, Math.round(k / 3)));
        g.globalAlpha = 1;
      }
      // faísca no canto do último A
      if (!calmo && t > TEMPO.brilho[1] && t < TEMPO.brilho[1] + 500) {
        var q = (t - TEMPO.brilho[1]) / 500, fx = ox + (nome.larg + 0.5) * k, fy = oy - k * 0.5, tam = Math.round(k * (0.6 + Math.sin(q * Math.PI)));
        g.globalAlpha = Math.sin(q * Math.PI);
        g.fillStyle = '#FFFBE6';
        g.fillRect(fx - tam, fy - k * 0.25, tam * 2, k * 0.5);
        g.fillRect(fx - k * 0.25, fy - tam, k * 0.5, tam * 2);
        g.globalAlpha = 1;
      }

      var real = agora - inicio;
      if (!saindo && !fixo && real >= (calmo ? 1600 : TEMPO.fim)) sair();
      requestAnimationFrame(quadro);
    }

    function sair() {
      if (saindo) return;
      saindo = performance.now();
      sec.classList.add('saindo');
      setTimeout(fechar, calmo ? 150 : TEMPO.saida);
    }
    function fechar() {
      if (acabou) return;
      acabou = true;
      raiz.removeEventListener('resize', medir);
      document.removeEventListener('keydown', pular, true);
      sec.remove();
      if (aoTerminar) aoTerminar();
    }
    // a vinheta segura as teclas para o menu não reagir enquanto ela está na tela
    function pular(ev) {
      if (ev.type === 'keydown') { ev.preventDefault(); ev.stopPropagation(); }
      sair();
    }
    sec.addEventListener('pointerdown', pular);
    document.addEventListener('keydown', pular, true);
    requestAnimationFrame(quadro);
  }

  raiz.CanudosAbertura = { mostrar: mostrar };
})(typeof globalThis !== 'undefined' ? globalThis : this);
