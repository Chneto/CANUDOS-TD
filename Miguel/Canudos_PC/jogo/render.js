/* Canudos: A Última Resistência — desenho isométrico (protótipo v0.2)
 *
 * As regras (nucleo.js) continuam numa grade vista de cima, em px de mundo.
 * Aqui o mundo é projetado em losangos 2:1. O que é chão (estrada, rio, alcance,
 * marcações) é desenhado com a própria projeção aplicada ao canvas; o que fica
 * de pé (pedras, casas, gente) é desenhado em px de tela e ordenado por
 * profundidade, de trás para a frente.
 * Estilo: papel, aguadas de aquarela e traço de nanquim. Legibilidade tática
 * antes do detalhe: tropas em azul-acinzentado escuro sobre o chão ocre,
 * defensores em couro e algodão cru.
 */
(function (raiz) {
  'use strict';

  var N = raiz.CanudosNucleo;
  var TAU = Math.PI * 2;

  var COR = {
    papel: '#E9DDBF',
    tinta: '#2A2016',
    barro: '#B48552',
    pedra: '#A99E88',
    pedraClara: '#B8AE97',
    soldado: '#3B4A68',
    calca: '#283044',
    quepe: '#20283A',
    mochila: '#5B4A33',
    pele: '#B98A5E',
    algodao: '#DCCDA8',
    couro: '#74461F',
    couroEscuro: '#55331A',
    madeira: '#6B4A2A',
    madeiraClara: '#9A7146',
    rioLeito: '#D2C4A1',
    agua: '#7EA0A0',
    parede: '#D9C399',
    paredeSombra: '#B39A6C',
    cal: '#EEE6D3',
    calSombra: '#C9BEA5',
    chaoArraial: '#DCC79C',
    perigo: '#A63A24',
    bom: '#5E7A3A',
    ouro: '#7A5310'
  };
  // telhados de barro e de palha: [água iluminada, água na sombra]
  var TELHADOS = [['#A8774C', '#8A5D38'], ['#9C6A44', '#7E5332'], ['#B59A62', '#957C48'], ['#A36E48', '#845535'], ['#B08458', '#906A42']];
  var FONTE_TITULO = '"Holtwood One SC", "Rockwell Extra Bold", Rockwell, Georgia, serif';
  var FONTE_TEXTO = 'Alegreya, Georgia, "Times New Roman", serif';

  // ───────────────────────── Projeção ─────────────────────────

  // Uma casa da grade vira um losango de 56 × 28 px de tela.
  function criarProjecao(D) {
    var C = D.celula, W = D.colunas, H = D.linhas;
    var k = 28, s = k / C, margem = 20, topo = 44, base = 26;
    var ox = margem + H * k, oy = topo;
    return {
      C: C, W: W, H: H, s: s,
      L: (W + H) * k + 2 * margem,
      A: topo + (W + H) * k / 2 + base,
      // mundo (px do núcleo) → tela; z é a altura acima do chão, em px de tela
      p: function (wx, wy, z) { return { x: ox + (wx - wy) * s, y: oy + (wx + wy) * s / 2 - (z || 0) }; },
      mundo: function (sx, sy) {
        var X = (sx - ox) / s, Y = (sy - oy) * 2 / s;
        return { x: (X + Y) / 2, y: (Y - X) / 2 };
      },
      // desenhar em coordenadas de mundo, deitado no chão
      chao: function (g, dpr) { g.setTransform(dpr * s, dpr * s / 2, -dpr * s, dpr * s / 2, dpr * ox, dpr * oy); },
      tela: function (g, dpr) { g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    };
  }

  // Direção de um ângulo do mundo, vista na tela.
  function dirTela(ang) {
    var c = Math.cos(ang), s = Math.sin(ang);
    return { x: c - s, y: (c + s) / 2 };
  }

  // ───────────────────────── Utilitários ─────────────────────────

  function semente(n) {
    var a = n >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tinta(g, largura, alfa) {
    g.strokeStyle = 'rgba(42,32,22,' + (alfa === undefined ? 1 : alfa) + ')';
    g.lineWidth = largura;
  }

  function elipse(g, x, y, rx, ry, rot) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  }

  function linha(g, x0, y0, x1, y1) {
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }

  function pontosIrregulares(x, y, raio, lados, r, variacao, achatar) {
    var pts = [];
    for (var i = 0; i < lados; i++) {
      var a = (i / lados) * TAU + r() * 0.5;
      var rr = raio * (1 - variacao / 2 + r() * variacao);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (achatar || 0.85)]);
    }
    return pts;
  }

  function tracar(g, pts) {
    g.beginPath();
    pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.closePath();
  }

  function poligono(g, pts, cor, larg) {
    g.beginPath();
    pts.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    g.closePath();
    g.fillStyle = cor;
    g.fill();
    if (larg) { tinta(g, larg, 0.85); g.stroke(); }
  }

  function sobrepoe(a, b, folga) {
    return a.x < b.x + b.w + folga && a.x + a.w + folga > b.x && a.y < b.y + b.h + folga && a.y + a.h + folga > b.y;
  }

  // ───────────────────────── Cena fixa ─────────────────────────

  function criarCena(jogo, dpr) {
    var P = criarProjecao(jogo.D);
    var r = semente(1897);
    var props = montarObjetos(jogo, semente(1896));
    var cv = document.createElement('canvas');
    cv.width = Math.round(P.L * dpr);
    cv.height = Math.round(P.A * dpr);
    var g = cv.getContext('2d');
    g.lineCap = 'round';
    g.lineJoin = 'round';

    P.tela(g, dpr);
    papel(g, P.L, P.A, r);
    P.chao(g, dpr);
    rio(g, jogo, r);
    estrada(g, jogo, r);
    chaoArraial(g, jogo, r);
    sombras(g, props);
    rosaDosVentos(g, 5 * P.C, 20 * P.C);
    P.tela(g, dpr);
    capim(g, P, jogo, r);
    limiteDoMapa(g, P);
    moldura(g, P);
    return { P: P, fundo: cv, props: props };
  }

  // O papel é a superfície da gravura: grão e aguadas ficam alinhados à tela.
  function papel(g, L, A, r) {
    g.fillStyle = COR.papel;
    g.fillRect(0, 0, L, A);
    var manchas = ['196,150,82', '172,150,98', '222,192,134', '128,132,82', '186,122,72'];
    for (var i = 0; i < 60; i++) {
      var x = r() * L, y = r() * A, raio = 50 + r() * 190, c = manchas[i % manchas.length];
      var gr = g.createRadialGradient(x, y, raio * 0.15, x, y, raio);
      gr.addColorStop(0, 'rgba(' + c + ',' + (0.09 + r() * 0.1).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr;
      g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
    }
    for (i = 0; i < 7500; i++) {
      g.fillStyle = 'rgba(70,48,24,' + (0.03 + r() * 0.08).toFixed(3) + ')';
      g.fillRect(r() * L, r() * A, 1 + r(), 1 + r());
    }
    for (i = 0; i < 300; i++) {
      var fx = r() * L, fy = r() * A, a = r() * TAU, c2 = 4 + r() * 10;
      g.strokeStyle = 'rgba(90,64,34,' + (0.04 + r() * 0.05).toFixed(3) + ')';
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(fx, fy);
      g.quadraticCurveTo(fx + Math.cos(a) * c2 * 0.5 + r() * 3, fy + Math.sin(a) * c2 * 0.5 + r() * 3,
        fx + Math.cos(a) * c2, fy + Math.sin(a) * c2);
      g.stroke();
    }
  }

  // Leito do Vaza-Barris ao longo da borda leste, continuando para fora do mapa.
  function rio(g, jogo, r) {
    var C = jogo.mapa.C, x0 = jogo.D.mapa.rio.coluna * C;
    var esq = [], dir = [];
    for (var y = -700; y <= 1300; y += 10) {
      esq.push({ x: x0 - 3 + Math.sin(y / 70) * 4 + (r() - 0.5) * 2.5, y: y });
      dir.push({ x: x0 + C + 14 + Math.sin(y / 90 + 2) * 5 + (r() - 0.5) * 2.5, y: y });
    }
    g.beginPath();
    esq.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    for (var i = dir.length - 1; i >= 0; i--) g.lineTo(dir[i].x, dir[i].y);
    g.closePath();
    g.fillStyle = COR.rioLeito;
    g.fill();

    for (i = 0; i < 420; i++) {
      g.fillStyle = 'rgba(120,104,78,' + (0.2 + r() * 0.3).toFixed(2) + ')';
      elipse(g, x0 + 2 + r() * (C + 10), -700 + r() * 2000, 1.2 + r() * 2.2, 1 + r() * 1.6);
      g.fill();
    }

    g.beginPath();
    for (y = -700; y <= 1300; y += 6) {
      var wx = x0 + C * 0.62 + Math.sin(y / 45 + 1) * 5 + Math.sin(y / 17) * 1.8;
      if (y === -700) g.moveTo(wx, y); else g.lineTo(wx, y);
    }
    g.strokeStyle = 'rgba(126,160,160,.85)';
    g.lineWidth = 5;
    g.stroke();
    g.strokeStyle = 'rgba(225,236,228,.55)';
    g.lineWidth = 1.3;
    g.stroke();

    [esq, dir].forEach(function (margem, lado) {
      g.beginPath();
      margem.forEach(function (p, j) { if (j) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
      tinta(g, 1.6, 0.7);
      g.stroke();
      tinta(g, 1, 0.4);
      var sinal = lado ? -1 : 1;
      margem.forEach(function (p) { linha(g, p.x + sinal, p.y, p.x + sinal * 7, p.y + 2); });
    });

    g.save();
    g.translate(x0 + 14, 330);
    g.rotate(-Math.PI / 2);
    g.font = 'italic 15px ' + FONTE_TEXTO;
    g.fillStyle = 'rgba(42,32,22,.62)';
    g.textAlign = 'center';
    g.fillText('rio Vaza-Barris', 0, 0);
    g.restore();
  }

  function estrada(g, jogo, r) {
    var mapa = jogo.mapa, C = mapa.C, p = mapa.pontos;
    var inicio = p[0].x - 18 * C;
    function caminho() {
      g.beginPath();
      g.moveTo(inicio, p[0].y);
      p.forEach(function (q) { g.lineTo(q.x, q.y); });
    }
    g.lineJoin = 'round';
    g.lineCap = 'butt';
    for (var k = 0; k < 3; k++) {
      g.save();
      g.translate((r() - 0.5) * 2, (r() - 0.5) * 2);
      caminho();
      g.strokeStyle = 'rgba(70,46,22,.3)';
      g.lineWidth = C * 0.88;
      g.stroke();
      g.restore();
    }
    caminho();
    g.strokeStyle = COR.barro;
    g.lineWidth = C * 0.8;
    g.stroke();
    caminho();
    g.strokeStyle = 'rgba(214,176,120,.5)';
    g.lineWidth = C * 0.52;
    g.stroke();
    // sulcos de roda de carroça: o contorno de uma faixa estreita
    for (k = 0; k < 2; k++) {
      g.save();
      g.translate((r() - 0.5) * 1.4, (r() - 0.5) * 1.4);
      caminho();
      g.strokeStyle = 'rgba(112,78,42,.35)';
      g.lineWidth = C * 0.38;
      g.stroke();
      caminho();
      g.strokeStyle = 'rgba(206,166,110,.85)';
      g.lineWidth = C * 0.3;
      g.stroke();
      g.restore();
    }
    g.lineCap = 'round';

    // cascalho e pegadas
    for (var i = 0; i < 700; i++) {
      var x, y;
      if (i < 560) {
        var q = N.pontoNaRota(mapa, r() * mapa.comprimento), lado = (r() - 0.5) * C * 0.74;
        x = q.x - q.ty * lado; y = q.y + q.tx * lado;
      } else {
        x = inicio + r() * (p[0].x - inicio); y = p[0].y + (r() - 0.5) * C * 0.74;
      }
      g.fillStyle = r() < 0.55 ? 'rgba(96,66,36,.3)' : 'rgba(236,210,160,.38)';
      g.fillRect(x, y, 1.4 + r() * 2, 1.4 + r() * 2);
    }
  }

  function chaoArraial(g, jogo, r) {
    var C = jogo.mapa.C, A = jogo.D.mapa.arraial;
    var x0 = A.x * C, y0 = A.y * C, w = A.w * C, h = A.h * C;
    var pts = [], t;
    for (t = 0; t < 1; t += 0.04) pts.push([x0 + w * t, y0]);
    for (t = 0; t < 1; t += 0.05) pts.push([x0 + w, y0 + h * t]);
    for (t = 0; t < 1; t += 0.04) pts.push([x0 + w * (1 - t), y0 + h]);
    for (t = 0; t < 1; t += 0.05) pts.push([x0, y0 + h * (1 - t)]);
    g.beginPath();
    pts.forEach(function (p, i) {
      var px = p[0] + (r() - 0.5) * 8, py = p[1] + (r() - 0.5) * 8;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    });
    g.closePath();
    g.fillStyle = COR.chaoArraial;
    g.fill();
    tinta(g, 1.1, 0.35);
    g.stroke();
    // a estrada entra até a praça
    var fim = jogo.mapa.pontos[jogo.mapa.pontos.length - 1];
    g.fillStyle = 'rgba(180,133,82,.55)';
    g.fillRect(x0 - 2, fim.y - C * 0.36, 40, C * 0.72);
  }

  // Sombras deitadas no chão, projetadas para o sudeste da tela.
  function sombras(g, props) {
    g.fillStyle = 'rgba(70,45,20,.17)';
    props.forEach(function (o) {
      if (o.tipo === 'casa') {
        g.fillRect(o.x + 2, o.y + 1, o.w + 12, o.d);
      } else if (o.tipo === 'igreja') {
        g.fillRect(o.x + 2, o.y + 1, o.w + 30, o.d);
        g.fillRect(o.x - 10, o.y - 5, 60, 14);
        g.fillRect(o.x - 10, o.y + o.d - 7, 60, 14);
      } else if (o.tipo === 'cruzeiro') {
        elipse(g, o.wx + 12, o.wy, 14, 3);
        g.fill();
      } else {
        elipse(g, o.wx + 7, o.wy + 2, 18, 12);
        g.fill();
      }
    });
  }

  // Deitada no chão: o N aponta para o norte do mapa.
  function rosaDosVentos(g, x, y) {
    g.save();
    g.translate(x, y);
    g.globalAlpha = 0.62;
    for (var i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2);
      g.beginPath();
      g.moveTo(0, -26); g.lineTo(6, 0); g.lineTo(0, 0); g.closePath();
      g.fillStyle = '#B98B47'; g.fill();
      g.beginPath();
      g.moveTo(0, -26); g.lineTo(-6, 0); g.lineTo(0, 0); g.closePath();
      g.fillStyle = COR.papel; g.fill();
      g.beginPath();
      g.moveTo(0, -26); g.lineTo(6, 0); g.lineTo(-6, 0); g.closePath();
      tinta(g, 1.2, 1); g.stroke();
    }
    elipse(g, 0, 0, 13, 13);
    tinta(g, 1, 1); g.stroke();
    g.font = '16px ' + FONTE_TITULO;
    g.fillStyle = COR.tinta;
    g.textAlign = 'center';
    g.fillText('N', 0, -31);
    g.restore();
  }

  function tufo(g, x, y, r, escala) {
    var n = 3 + Math.floor(r() * 4);
    g.strokeStyle = 'rgba(108,108,62,' + (0.45 + r() * 0.25).toFixed(2) + ')';
    g.lineWidth = 0.9;
    for (var k = 0; k < n; k++) {
      var dx = (k - n / 2) * 1.5 + (r() - 0.5) * 2, h = (4 + r() * 5) * escala;
      g.beginPath();
      g.moveTo(x + dx * 0.4, y);
      g.quadraticCurveTo(x + dx * 0.7, y - h * 0.6, x + dx * 1.3, y - h);
      g.stroke();
    }
  }

  // Capim seco de pé: textura, nunca obstáculo.
  function capim(g, P, jogo, r) {
    var mapa = jogo.mapa, C = mapa.C, W = mapa.W * C, H = mapa.H * C, p0 = mapa.pontos[0];
    var x0rio = jogo.D.mapa.rio.coluna * C;
    for (var y = 0; y < mapa.H; y++) for (var x = 0; x < mapa.W; x++) {
      if (mapa.tipos[y][x] !== 'livre') continue;
      if (r() < 0.38) {
        var s = P.p((x + 0.5 + (r() - 0.5) * 0.7) * C, (y + 0.5 + (r() - 0.5) * 0.7) * C);
        tufo(g, s.x, s.y, r, 1);
      }
      if (r() < 0.1) {
        var t = P.p((x + 0.5 + (r() - 0.5) * 0.8) * C, (y + 0.5 + (r() - 0.5) * 0.8) * C);
        g.fillStyle = 'rgba(150,138,114,.8)';
        elipse(g, t.x, t.y, 2.2 + r() * 1.4, 1.3 + r() * 0.7);
        g.fill();
        tinta(g, 0.6, 0.45);
        g.stroke();
      }
    }
    // capim que invade a beira da estrada
    for (var i = 0; i < 170; i++) {
      var q = N.pontoNaRota(mapa, r() * mapa.comprimento), lado = r() < 0.5 ? -1 : 1;
      var b = P.p(q.x - q.ty * lado * C * 0.42, q.y + q.tx * lado * C * 0.42);
      tufo(g, b.x, b.y, r, 0.8);
    }
    // além do mapa
    for (i = 0; i < 650; i++) {
      var wx = -400 + r() * 1740, wy = -560 + r() * 1740;
      if (wx > -10 && wx < W + 10 && wy > -10 && wy < H + 10) continue;
      if (wx > x0rio - 10 && wx < x0rio + C + 22) continue;
      if (wx < 0 && Math.abs(wy - p0.y) < 24) continue;
      var f = P.p(wx, wy);
      if (f.x < 0 || f.y < 0 || f.x > P.L || f.y > P.A) continue;
      tufo(g, f.x, f.y, r, 1);
    }
  }

  // Esmaece o que fica fora da área jogável e risca o contorno do losango.
  function limiteDoMapa(g, P) {
    var W = P.W * P.C, H = P.H * P.C;
    var c = [P.p(0, 0), P.p(W, 0), P.p(W, H), P.p(0, H)];
    g.beginPath();
    g.rect(0, 0, P.L, P.A);
    c.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    g.closePath();
    g.fillStyle = 'rgba(236,226,200,.52)';
    g.fill('evenodd');
    g.beginPath();
    c.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    g.closePath();
    tinta(g, 1.5, 0.7);
    g.stroke();
    var e = [{ x: c[0].x, y: c[0].y - 5 }, { x: c[1].x + 10, y: c[1].y }, { x: c[2].x, y: c[2].y + 5 }, { x: c[3].x - 10, y: c[3].y }];
    g.save();
    g.setLineDash([2, 4]);
    g.beginPath();
    e.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    g.closePath();
    tinta(g, 1, 0.5);
    g.stroke();
    g.restore();
  }

  function moldura(g, P) {
    var L = P.L, A = P.A;
    var gr = g.createRadialGradient(L / 2, A / 2, Math.min(L, A) * 0.45, L / 2, A / 2, Math.max(L, A) * 0.72);
    gr.addColorStop(0, 'rgba(90,58,24,0)');
    gr.addColorStop(1, 'rgba(90,58,24,.2)');
    g.fillStyle = gr;
    g.fillRect(0, 0, L, A);
    tinta(g, 2, 0.9);
    g.strokeRect(4, 4, L - 8, A - 8);
    tinta(g, 0.8, 0.7);
    g.strokeRect(9, 9, L - 18, A - 18);
  }

  // ───────────────────────── Objetos de pé ─────────────────────────

  function montarObjetos(jogo, r) {
    var D = jogo.D, C = D.celula, lista = [];
    D.mapa.obstaculos.forEach(function (o) {
      lista.push({ tipo: o[2], wx: (o[0] + 0.5) * C, wy: (o[1] + 0.5) * C, semente: o[0] * 7919 + o[1] * 104729 });
    });

    var A = D.mapa.arraial, x0 = A.x * C, y0 = A.y * C, w = A.w * C, h = A.h * C;
    var fim = jogo.mapa.pontos[jogo.mapa.pontos.length - 1];
    var praca = { x: x0, y: fim.y - 34, w: 56, h: 68 };
    var igreja = { x: x0 + 60, y: y0 + 2, w: 78, h: 46 };

    lista.push({ tipo: 'igreja', x: x0 + 76, y: y0 + 10, w: 56, d: 28, wx: x0 + 104, wy: y0 + 24 });
    lista.push({ tipo: 'cruzeiro', wx: x0 + 36, wy: fim.y - 18 });

    // casebres em ruelas tortas
    for (var yy = y0 + 8; yy < y0 + h - 14; yy += 20) {
      for (var xx = x0 + 6 + r() * 5; xx < x0 + w - 16; xx += 23 + r() * 4) {
        var cw = 13 + r() * 5, cd = 10 + r() * 3;
        if (r() < 0.4) { var tmp = cw; cw = cd; cd = tmp; }
        var c = { x: xx + (r() - 0.5) * 3, y: yy + (r() - 0.5) * 3, w: cw, h: cd };
        if (sobrepoe(c, praca, 3) || sobrepoe(c, igreja, 4) || r() < 0.1) continue;
        lista.push({
          tipo: 'casa', x: c.x, y: c.y, w: cw, d: cd, wx: c.x + cw / 2, wy: c.y + cd / 2,
          alt: 8 + r() * 3, cumeeira: 5 + r() * 2.5, cores: TELHADOS[Math.floor(r() * TELHADOS.length)], porta: r() < 0.7
        });
      }
    }
    return lista;
  }

  function desenharObjeto(g, P, o) {
    var a = P.p(o.wx, o.wy), r = semente(o.semente || 7);
    switch (o.tipo) {
      case 'lajedo': lajedo(g, a.x, a.y, r); break;
      case 'caatinga': moita(g, a.x, a.y, r, 1); break;
      case 'mandacaru': moita(g, a.x - 7, a.y + 1, r, 0.6); mandacaru(g, a.x + 4, a.y + 4, r); break;
      case 'casa': casa(g, P, o); break;
      case 'igreja': igrejaNova(g, P, o); break;
      case 'cruzeiro': cruzeiro(g, a.x, a.y); break;
    }
  }

  function lajedo(g, x, y, r) {
    var pedras = [], n = 2 + Math.floor(r() * 2);
    for (var k = 0; k < n; k++) pedras.push({ x: x + (r() - 0.5) * 16, y: y + (r() - 0.5) * 7, raio: 7.5 + r() * 5 });
    pedras.sort(function (a, b) { return a.y - b.y; });
    pedras.forEach(function (p, i) {
      var cy = p.y - p.raio * 0.55;
      var pts = pontosIrregulares(p.x, cy, p.raio, 8, r, 0.35, 0.8);
      tracar(g, pts);
      g.fillStyle = i % 2 ? COR.pedraClara : COR.pedra;
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = 'rgba(255,248,230,.28)';
      elipse(g, p.x - p.raio * 0.25, cy - p.raio * 0.4, p.raio * 0.7, p.raio * 0.32);
      g.fill();
      g.fillStyle = 'rgba(70,58,42,.3)';
      g.fillRect(p.x - p.raio, cy + p.raio * 0.2, p.raio * 2, p.raio);
      g.fillRect(p.x + p.raio * 0.3, cy - p.raio, p.raio, p.raio * 2);
      tinta(g, 0.6, 0.45);
      for (var h = 0; h < p.raio * 2.2; h += 2.6) linha(g, p.x + h - p.raio * 0.4, cy + p.raio, p.x + h + p.raio * 0.6, cy);
      g.restore();
      tracar(g, pts);
      tinta(g, 1.3, 0.9);
      g.stroke();
    });
  }

  function moita(g, x, y, r, esc) {
    var verdes = ['#5A5F35', '#6B6E3E', '#7A7646', '#80703F'];
    tinta(g, 0.9, 0.8);
    for (var k = 0; k < 5; k++) linha(g, x + (r() - 0.5) * 6 * esc, y, x + (r() - 0.5) * 18 * esc, y - (5 + r() * 8) * esc);
    var bolas = [];
    for (k = 0; k < 7; k++) {
      bolas.push({ x: x + (r() - 0.5) * 20 * esc, y: y - (5 + r() * 12) * esc, r: (5 + r() * 4) * esc });
    }
    bolas.sort(function (a, b) { return a.y - b.y; });
    bolas.forEach(function (b, i) {
      g.fillStyle = verdes[i % verdes.length];
      elipse(g, b.x, b.y, b.r, b.r * 0.85);
      g.fill();
      tinta(g, 0.8, 0.55);
      g.stroke();
      g.fillStyle = 'rgba(226,222,160,.16)';
      elipse(g, b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.45, b.r * 0.3);
      g.fill();
    });
    // garranchos e espinhos saindo da copa
    tinta(g, 0.7, 0.75);
    for (k = 0; k < 11; k++) {
      var a = -Math.PI * (0.05 + r() * 0.9), b = bolas[Math.floor(r() * bolas.length)];
      var x1 = b.x + Math.cos(a) * (b.r + 4 + r() * 4), y1 = b.y + Math.sin(a) * (b.r + 3 + r() * 4);
      linha(g, b.x + Math.cos(a) * b.r * 0.5, b.y + Math.sin(a) * b.r * 0.5, x1, y1);
      linha(g, x1, y1, x1 + Math.cos(a + 1) * 2.5, y1 + Math.sin(a + 1) * 2.5);
    }
  }

  // Mandacaru de pé, com dois braços.
  function mandacaru(g, bx, by, r) {
    var h = 26 + r() * 7;
    function haste(x, y0, y1, w) {
      g.beginPath();
      g.moveTo(x - w / 2, y0);
      g.lineTo(x - w / 2, y1 + w / 2);
      g.arc(x, y1 + w / 2, w / 2, Math.PI, 0);
      g.lineTo(x + w / 2, y0);
      g.closePath();
      g.fillStyle = '#5F6E3C';
      g.fill();
      tinta(g, 1.1, 0.95);
      g.stroke();
      tinta(g, 0.5, 0.5);
      linha(g, x, y0 - 1, x, y1 + w / 2 + 1);
      g.fillStyle = 'rgba(30,40,20,.22)';
      g.fillRect(x + w * 0.1, y1 + w / 2, w * 0.4, y0 - y1 - w / 2);
    }
    var yb = by - h * 0.45, yb2 = by - h * 0.62;
    haste(bx - 8, yb + 2, yb - 11, 5);
    haste(bx + 7, yb2 + 2, yb2 - 9, 4.5);
    g.fillStyle = '#5F6E3C';
    g.fillRect(bx - 8, yb - 1, 6, 3.5);
    g.fillRect(bx + 2, yb2 - 1, 6, 3.2);
    tinta(g, 1, 0.9);
    linha(g, bx - 8, yb + 2.5, bx - 3, yb + 2.5);
    linha(g, bx + 3, yb2 + 2.2, bx + 7, yb2 + 2.2);
    haste(bx, by, by - h, 6.5);
  }

  function caixa(g, P, x, y, w, d, h, corA, corB, larg) {
    poligono(g, [P.p(x, y + d), P.p(x + w, y + d), P.p(x + w, y + d, h), P.p(x, y + d, h)], corA, larg);
    poligono(g, [P.p(x + w, y + d), P.p(x + w, y), P.p(x + w, y, h), P.p(x + w, y + d, h)], corB, larg);
  }

  // Telhado de duas águas com a cumeeira no eixo mais comprido.
  function telhado(g, P, x, y, w, d, h, hr, cores, paredeA, paredeB, larg, ov) {
    if (w >= d) {
      var ym = y + d / 2;
      poligono(g, [P.p(x + w, y, h), P.p(x + w, y + d, h), P.p(x + w, ym, h + hr)], paredeB, larg);
      poligono(g, [P.p(x - ov, y - ov, h), P.p(x + w + ov, y - ov, h), P.p(x + w + ov, ym, h + hr), P.p(x - ov, ym, h + hr)], cores[0], larg);
      poligono(g, [P.p(x - ov, ym, h + hr), P.p(x + w + ov, ym, h + hr), P.p(x + w + ov, y + d + ov, h), P.p(x - ov, y + d + ov, h)], cores[1], larg);
    } else {
      var xm = x + w / 2;
      poligono(g, [P.p(x, y + d, h), P.p(x + w, y + d, h), P.p(xm, y + d, h + hr)], paredeA, larg);
      poligono(g, [P.p(x - ov, y - ov, h), P.p(xm, y - ov, h + hr), P.p(xm, y + d + ov, h + hr), P.p(x - ov, y + d + ov, h)], cores[0], larg);
      poligono(g, [P.p(xm, y - ov, h + hr), P.p(x + w + ov, y - ov, h), P.p(x + w + ov, y + d + ov, h), P.p(xm, y + d + ov, h + hr)], cores[1], larg);
    }
  }

  function casa(g, P, o) {
    caixa(g, P, o.x, o.y, o.w, o.d, o.alt, COR.parede, COR.paredeSombra, 0.8);
    if (o.porta && o.w >= 9) {
      var px = o.x + o.w * 0.3;
      poligono(g, [P.p(px, o.y + o.d), P.p(px + 3.5, o.y + o.d), P.p(px + 3.5, o.y + o.d, 6), P.p(px, o.y + o.d, 6)], '#4A3220', 0);
    }
    telhado(g, P, o.x, o.y, o.w, o.d, o.alt, o.cumeeira, o.cores, COR.parede, COR.paredeSombra, 0.8, 1.5);
  }

  function torre(g, P, x, y, w, d, h, hr) {
    caixa(g, P, x, y, w, d, h, COR.cal, COR.calSombra, 1);
    var bx = x + w * 0.3, by = y + d * 0.3;
    poligono(g, [P.p(bx, y + d, h - 13), P.p(bx + w * 0.4, y + d, h - 13), P.p(bx + w * 0.4, y + d, h - 5), P.p(bx, y + d, h - 5)], '#3E3024', 0);
    poligono(g, [P.p(x + w, by, h - 13), P.p(x + w, by + d * 0.4, h - 13), P.p(x + w, by + d * 0.4, h - 5), P.p(x + w, by, h - 5)], '#3E3024', 0);
    var topo = P.p(x + w / 2, y + d / 2, h + hr);
    var A = P.p(x, y, h), B = P.p(x + w, y, h), Cc = P.p(x + w, y + d, h), Dd = P.p(x, y + d, h);
    poligono(g, [A, B, topo], '#B08458', 0.9);
    poligono(g, [A, Dd, topo], '#B08458', 0.9);
    poligono(g, [Dd, Cc, topo], '#A87A55', 0.9);
    poligono(g, [B, Cc, topo], '#8A5F3E', 0.9);
    tinta(g, 1.4, 1);
    linha(g, topo.x, topo.y, topo.x, topo.y - 8);
    linha(g, topo.x - 3, topo.y - 5.5, topo.x + 3, topo.y - 5.5);
  }

  // Igreja de duas torres com a fachada voltada para a praça.
  function igrejaNova(g, P, o) {
    var x = o.x, y = o.y, w = o.w, d = o.d;
    torre(g, P, x - 12, y - 6, 14, 14, 34, 10);
    caixa(g, P, x, y, w, d, 19, COR.cal, COR.calSombra, 1);
    for (var j = 0; j < 3; j++) {
      var jx = x + 14 + j * 13;
      poligono(g, [P.p(jx, y + d, 9), P.p(jx + 3, y + d, 9), P.p(jx + 3, y + d, 15), P.p(jx, y + d, 15)], '#4A3A2A', 0);
    }
    telhado(g, P, x, y, w, d, 19, 11, ['#B08458', '#8A5F3E'], COR.cal, COR.calSombra, 1, 2);
    torre(g, P, x - 12, y + d - 8, 14, 14, 34, 10);
  }

  function cruzeiro(g, x, y) {
    g.fillStyle = '#B9A27A';
    elipse(g, x, y, 4.5, 2);
    g.fill();
    tinta(g, 0.7, 0.7);
    g.stroke();
    tinta(g, 3.2, 1);
    linha(g, x, y, x, y - 19);
    linha(g, x - 5, y - 14, x + 5, y - 14);
    g.strokeStyle = COR.madeira;
    g.lineWidth = 1.6;
    linha(g, x, y - 0.5, x, y - 18.5);
    linha(g, x - 4.5, y - 14, x + 4.5, y - 14);
  }

  // ───────────────────────── Gente e estruturas ─────────────────────────

  // Soldado de pé, em três-quartos. De costas quando sobe na tela.
  function soldado(g, x, y, dx, dy, passo, atacando) {
    var costas = dy < -0.05;
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(40,25,10,.22)';
    elipse(g, 1, 0, 6.5, 2.6);
    g.fill();
    g.scale(dx < 0 ? -1 : 1, 1);
    var sw = atacando ? 0 : Math.sin(passo) * 2.2;
    var jab = atacando ? Math.max(0, Math.sin(passo * 2.2)) * 2.5 : 0;
    // pernas
    g.strokeStyle = COR.calca;
    g.lineWidth = 2.4;
    linha(g, -1.2, -8, -1.2 + sw, -0.6);
    linha(g, 1.4, -8, 1.4 - sw, -0.6);
    // fuzil a tiracolo, atrás do corpo
    if (!atacando) { tinta(g, 1.5, 1); linha(g, -3.5, -7, 3.5, -22); }
    // mochila de lado (de frente) ou nas costas (depois do tronco)
    if (!costas) {
      g.fillStyle = COR.mochila;
      g.fillRect(-6, -15.5, 2.6, 6.5);
      tinta(g, 0.7, 0.9);
      g.strokeRect(-6, -15.5, 2.6, 6.5);
    }
    // tronco
    g.fillStyle = COR.soldado;
    g.beginPath();
    if (g.roundRect) g.roundRect(-4, -16.5, 8, 9.5, 2); else g.rect(-4, -16.5, 8, 9.5);
    g.fill();
    tinta(g, 1, 1);
    g.stroke();
    g.strokeStyle = '#C9B48A';
    g.lineWidth = 1;
    linha(g, -3.6, -9.6, 3.6, -9.6);
    if (costas) {
      g.fillStyle = COR.mochila;
      g.fillRect(-3.2, -16, 6.4, 6);
      tinta(g, 0.8, 1);
      g.strokeRect(-3.2, -16, 6.4, 6);
    }
    // fuzil apontado, de baioneta, quando ataca a barricada
    if (atacando) {
      tinta(g, 1.7, 1);
      linha(g, -2 + jab, -11.5, 11 + jab, -12.5);
      g.strokeStyle = '#CFC8B8';
      g.lineWidth = 1;
      linha(g, 11 + jab, -12.5, 14 + jab, -12.8);
      g.strokeStyle = COR.soldado;
      g.lineWidth = 2;
      linha(g, 1, -14, 5 + jab, -12);
    }
    // cabeça e quepe com pala
    g.fillStyle = costas ? '#9E7651' : COR.pele;
    elipse(g, 0.4, -19, 2.8, 2.8);
    g.fill();
    tinta(g, 0.8, 1);
    g.stroke();
    g.fillStyle = COR.quepe;
    g.fillRect(-2.6, -23.6, 6, 3.4);
    tinta(g, 0.7, 1);
    g.strokeRect(-2.6, -23.6, 6, 3.4);
    if (!costas) { tinta(g, 1.3, 1); linha(g, 2.8, -20.3, 5.4, -19.9); }
    g.restore();
  }

  function soldadoCaido(g, x, y, dx, alfa) {
    g.save();
    g.globalAlpha = alfa;
    g.translate(x, y);
    g.scale(dx < 0 ? -1 : 1, 1);
    g.fillStyle = 'rgba(40,25,10,.18)';
    elipse(g, 1, 1, 10, 3);
    g.fill();
    g.strokeStyle = COR.calca;
    g.lineWidth = 2.2;
    linha(g, -9, -1, -4, -2);
    g.fillStyle = '#56607A';
    elipse(g, 0, -2.5, 6.5, 3);
    g.fill();
    tinta(g, 0.8, 0.8);
    g.stroke();
    g.fillStyle = COR.pele;
    elipse(g, 7.5, -3, 2.4, 2.2);
    g.fill();
    g.stroke();
    g.fillStyle = COR.quepe;
    g.fillRect(9.5, -1.5, 4.5, 2.6);
    tinta(g, 1.3, 0.75);
    linha(g, -6, 2.5, 7, 3.5);
    g.restore();
  }

  // Sertanejo agachado na trincheira, de chapéu de couro e arma apontada.
  function defensor(g, x, y, dx, dy) {
    g.save();
    g.translate(x, y);
    g.scale(dx < 0 ? -1 : 1, 1);
    var ergue = dy < 0 ? -2.5 : 1.5;
    g.fillStyle = COR.algodao;
    g.beginPath();
    if (g.roundRect) g.roundRect(-3.6, -10, 7.2, 7.5, 2); else g.rect(-3.6, -10, 7.2, 7.5);
    g.fill();
    tinta(g, 0.9, 1);
    g.stroke();
    tinta(g, 1.7, 1);
    linha(g, -1, -6.5, 12, -8.5 + ergue);
    g.strokeStyle = COR.algodao;
    g.lineWidth = 2;
    linha(g, 1, -8, 6, -7.6 + ergue / 2);
    g.fillStyle = COR.pele;
    elipse(g, 0.5, -12.6, 2.5, 2.5);
    g.fill();
    tinta(g, 0.7, 1);
    g.stroke();
    g.fillStyle = COR.couro;
    elipse(g, 0.5, -14.2, 6.4, 1.9);
    g.fill();
    tinta(g, 0.8, 1);
    g.stroke();
    g.fillStyle = COR.couroEscuro;
    g.beginPath();
    g.ellipse(0.5, -14.6, 3.2, 2.7, 0, Math.PI, 0);
    g.fill();
    tinta(g, 0.7, 1);
    g.stroke();
    g.restore();
  }

  // Trincheira: cava no chão, parapeito de pedras virado para o alvo e dois atiradores.
  function atiradores(g, P, e, ang, alfa, recuo) {
    var r = semente(e.id * 977 + 3);
    var a = P.p(e.x, e.y);
    g.save();
    g.globalAlpha = alfa;
    g.fillStyle = '#A9804A';
    elipse(g, a.x, a.y, 18, 9);
    g.fill();
    tinta(g, 0.9, 0.55);
    g.stroke();
    g.fillStyle = 'rgba(70,45,20,.3)';
    elipse(g, a.x - 1, a.y + 1, 12.5, 5.6);
    g.fill();

    var ca = Math.cos(ang), sa = Math.sin(ang), itens = [];
    for (var k = 0; k < 7; k++) {
      var t = ang - 1.25 + k * (2.5 / 6);
      var wx = e.x + Math.cos(t) * 16, wy = e.y + Math.sin(t) * 16;
      itens.push({ z: wx + wy, pedra: true, s: P.p(wx, wy), raio: 3.6 + r() * 1.3, sem: Math.floor(r() * 1e6) });
    }
    [-1, 1].forEach(function (lado) {
      var recua = 3 + recuo * 6;
      var wx = e.x - ca * recua - sa * 6.5 * lado, wy = e.y - sa * recua + ca * 6.5 * lado;
      itens.push({ z: wx + wy, s: P.p(wx, wy) });
    });
    itens.sort(function (p, q) { return p.z - q.z; });
    var d = dirTela(ang);
    itens.forEach(function (it) {
      if (it.pedra) {
        var pts = pontosIrregulares(it.s.x, it.s.y - it.raio * 0.6, it.raio, 6, semente(it.sem), 0.35, 0.85);
        tracar(g, pts);
        g.fillStyle = it.sem % 2 ? COR.pedraClara : COR.pedra;
        g.fill();
        tinta(g, 0.9, 0.95);
        g.stroke();
      } else {
        defensor(g, it.s.x, it.s.y + 2, d.x, d.y);
      }
    });
    g.restore();
  }

  // Estacas cruzadas atravessando a estrada, amarradas numa viga.
  function barricada(g, P, e, alfa, tremor) {
    var vivas = e.vidaMax ? Math.max(1, Math.ceil(5 * e.vida / e.vidaMax)) : 5;
    var r = semente(e.id * 613);
    var px = -Math.sin(e.angulo), py = Math.cos(e.angulo);
    var tx = tremor ? (Math.random() - 0.5) * 2.5 : 0;
    g.save();
    g.globalAlpha = alfa;
    var c = P.p(e.x, e.y);
    g.fillStyle = 'rgba(70,45,20,.2)';
    elipse(g, c.x + 3, c.y + 1, 17, 6);
    g.fill();
    var bases = [];
    for (var k = 0; k < 5; k++) {
      var o = -15 + k * 7.5 + (r() - 0.5) * 1.5;
      bases.push({ k: k, z: o * (px + py), s: P.p(e.x + px * o, e.y + py * o) });
    }
    bases.sort(function (a, b) { return a.z - b.z; });
    bases.forEach(function (b) {
      var x = b.s.x + tx, y = b.s.y;
      if (b.k >= vivas) {
        tinta(g, 3.4, 0.9); linha(g, x - 1, y, x + 1, y - 4);
        g.strokeStyle = COR.madeira; g.lineWidth = 2; linha(g, x - 1, y, x + 1, y - 4);
        return;
      }
      [[x - 4, y + 1, x + 4, y - 14], [x + 4, y + 1, x - 4, y - 14]].forEach(function (s) {
        tinta(g, 3.6, 0.95);
        linha(g, s[0], s[1], s[2], s[3]);
        g.strokeStyle = COR.madeira;
        g.lineWidth = 2.2;
        linha(g, s[0], s[1], s[2], s[3]);
      });
    });
    var v0 = P.p(e.x - px * 18, e.y - py * 18, 6), v1 = P.p(e.x + px * 18, e.y + py * 18, 6);
    tinta(g, 5, 0.95);
    linha(g, v0.x + tx, v0.y, v1.x + tx, v1.y);
    g.strokeStyle = COR.madeiraClara;
    g.lineWidth = 3;
    linha(g, v0.x + tx, v0.y, v1.x + tx, v1.y);
    // garranchos de caatinga por cima
    tinta(g, 0.7, 0.8);
    for (k = 0; k < 10; k++) {
      var gx = c.x + tx + (r() - 0.5) * 30, gy = c.y - 4 - r() * 9;
      linha(g, gx, gy, gx + (r() - 0.5) * 9, gy + (r() - 0.5) * 6);
    }
    g.restore();
  }

  // Antônio Conselheiro: camisolão azul até os pés, cordão na cintura, cabelo e
  // barba brancos e longos, cajado e livro. Não carrega arma.
  function conselheiro(g, x, y, dx, passo, andando, escala) {
    g.save();
    g.translate(x, y);
    if (escala) g.scale(escala, escala);
    g.fillStyle = 'rgba(40,25,10,.24)';
    elipse(g, 1, 0, 7.5, 2.8);
    g.fill();
    g.scale(dx < 0 ? -1 : 1, 1);
    var bal = andando ? Math.sin(passo) * 1.3 : 0;
    // cajado
    tinta(g, 2.8, 1);
    linha(g, 6.2 + bal * 0.3, 1, 7.6, -34);
    g.strokeStyle = '#8A6A44';
    g.lineWidth = 1.4;
    linha(g, 6.2 + bal * 0.3, 0.5, 7.6, -33.5);
    // sandálias
    g.fillStyle = '#5E3F24';
    elipse(g, -2 + bal, -0.4, 2.1, 1);
    g.fill();
    elipse(g, 2.2 - bal, -0.4, 2.1, 1);
    g.fill();
    // camisolão
    g.beginPath();
    g.moveTo(-3.8, -22.5);
    g.lineTo(3.8, -22.5);
    g.lineTo(6.6 + bal * 0.5, -1.2);
    g.quadraticCurveTo(0, 0.8, -6.6 + bal * 0.5, -1.2);
    g.closePath();
    g.fillStyle = '#2F3D6B';
    g.fill();
    tinta(g, 1.1, 1);
    g.stroke();
    tinta(g, 0.6, 0.55);
    linha(g, -1, -18, -2.6 + bal * 0.5, -2);
    linha(g, 2, -16, 3.2 + bal * 0.5, -2);
    g.strokeStyle = '#D2BC86';
    g.lineWidth = 1.1;
    linha(g, -4.3, -14.5, 4.3, -14.5);
    linha(g, 2, -14.5, 2.7, -9);
    // livro junto ao peito e mão no cajado
    g.fillStyle = '#4A2E1C';
    g.fillRect(-6.4, -17.5, 4.4, 5.4);
    tinta(g, 0.8, 1);
    g.strokeRect(-6.4, -17.5, 4.4, 5.4);
    g.strokeStyle = '#E8DDC4';
    g.lineWidth = 0.7;
    linha(g, -2.4, -17, -2.4, -12.6);
    g.fillStyle = COR.pele;
    elipse(g, 6.8, -18, 1.6, 1.6);
    g.fill();
    // cabeça
    g.fillStyle = '#ECE8DE';
    elipse(g, -0.6, -25.5, 4.6, 5.6);
    g.fill();
    tinta(g, 0.8, 1);
    g.stroke();
    g.fillStyle = COR.pele;
    elipse(g, 0.9, -26, 2.7, 3.1);
    g.fill();
    tinta(g, 0.7, 1);
    g.stroke();
    g.fillStyle = '#ECE8DE';
    g.beginPath();
    g.moveTo(-1.4, -24.6);
    g.quadraticCurveTo(1.2, -15.8, 4, -24);
    g.lineTo(3.4, -23.3);
    g.closePath();
    g.fill();
    tinta(g, 0.6, 0.9);
    g.stroke();
    g.fillStyle = COR.tinta;
    g.fillRect(2.1, -27, 1, 0.9);
    g.restore();
  }

  function barraVida(g, x, y, larg, fr, cor) {
    g.fillStyle = 'rgba(42,32,22,.5)';
    g.fillRect(x - larg / 2 - 1, y - 1, larg + 2, 5);
    g.fillStyle = cor;
    g.fillRect(x - larg / 2, y, larg * Math.max(0, fr), 3);
  }

  // ───────────────────────── Efeitos ─────────────────────────

  function novoVisual() {
    var sistema = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return {
      ferramenta: null, hover: null, selecionada: null, mostrarCobertura: false, sempreAlcance: false,
      fx: [], recuo: {}, tremor: {}, angulos: {}, flashArraial: 0, recusa: null,
      menosMovimentoSistema: sistema, menosMovimento: sistema
    };
  }

  function aleat(a) { return (Math.random() - 0.5) * a; }

  // Eventos do núcleo vêm em px de mundo; os efeitos guardam posição de tela.
  function efeito(vis, ev, P) {
    var s, k;
    switch (ev.tipo) {
      case 'tiro': {
        var a = P.p(ev.x0, ev.y0, 11), b = P.p(ev.x1, ev.y1, 13);
        var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        var mx = a.x + dx / l * 11, my = a.y + dy / l * 11;
        vis.fx.push({ tipo: 'tracante', x0: mx, y0: my, x1: b.x, y1: b.y, t: 0, dur: 0.09, forte: ev.forte });
        vis.fx.push({ tipo: 'clarao', x: mx, y: my, t: 0, dur: 0.08 });
        for (k = 0; k < 3; k++) {
          vis.fx.push({
            tipo: 'fumaca', x: mx + aleat(4), y: my + aleat(4),
            vx: dx / l * 9 + aleat(8), vy: dy / l * 9 - 7 + aleat(5),
            r0: 2.5 + k, r1: 10 + k * 3, t: 0, dur: 0.9 + k * 0.3
          });
        }
        vis.fx.push({ tipo: 'poeira', x: b.x, y: b.y + 10, t: 0, dur: 0.25 });
        vis.recuo[ev.de] = 0.12;
        break;
      }
      case 'abate':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'caido', x: s.x, y: s.y, dx: dirTela(ev.ang).x, t: 0, dur: 2.8, fundo: true });
        if (ev.valor) vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: COR.ouro, x: s.x, y: s.y - 30, t: 0, dur: 1.1 });
        break;
      case 'golpe':
        s = P.p(ev.x + aleat(16), ev.y + aleat(16), 4);
        vis.fx.push({ tipo: 'poeira', x: s.x, y: s.y, t: 0, dur: 0.45, dourado: ev.firme });
        vis.tremor[ev.id] = 0.16;
        break;
      case 'barricadaCaiu':
        s = P.p(ev.x, ev.y, 8);
        for (k = 0; k < 9; k++) {
          vis.fx.push({ tipo: 'lasca', x: s.x, y: s.y, vx: aleat(80), vy: -20 - Math.random() * 35, rot: Math.random() * TAU, t: 0, dur: 0.8 });
        }
        vis.fx.push({ tipo: 'texto', txt: 'barricada derrubada', cor: COR.perigo, x: s.x, y: s.y - 24, t: 0, dur: 1.6, pequeno: true });
        break;
      case 'chegada':
        s = P.p(ev.x, ev.y, 40);
        vis.flashArraial = 0.7;
        vis.fx.push({ tipo: 'texto', txt: '−' + ev.dano, cor: COR.perigo, x: s.x, y: s.y, t: 0, dur: 1.4, grande: true });
        break;
      case 'construiu':
      case 'desmontou':
        for (k = 0; k < 3; k++) {
          s = P.p(ev.x + aleat(20), ev.y + aleat(20), 2);
          vis.fx.push({ tipo: 'poeira', x: s.x, y: s.y, t: 0, dur: 0.5 });
        }
        if (ev.tipo === 'desmontou') {
          s = P.p(ev.x, ev.y, 26);
          vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: COR.ouro, x: s.x, y: s.y, t: 0, dur: 1.1 });
        }
        break;
      case 'pronta':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'anel', x: s.x, y: s.y, t: 0, dur: 0.5 });
        break;
      case 'reparo':
        s = P.p(ev.x, ev.y, 26);
        vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: COR.bom, x: s.x, y: s.y, t: 0, dur: 1.3 });
        break;
      case 'mutirao':
      case 'predica':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'onda', x: s.x, y: s.y, rx: ev.raio * P.s, t: 0, dur: 0.9, dourado: ev.tipo === 'predica' });
        s = P.p(ev.x, ev.y, 44);
        vis.fx.push({ tipo: 'texto', txt: ev.tipo === 'predica' ? 'Prédica' : 'Mutirão', cor: COR.ouro, x: s.x, y: s.y, t: 0, dur: 1.5 });
        break;
    }
  }

  function avancarEfeitos(vis, dt) {
    for (var i = vis.fx.length - 1; i >= 0; i--) {
      var f = vis.fx[i];
      f.t += dt;
      if (f.t >= f.dur) vis.fx.splice(i, 1);
    }
    Object.keys(vis.recuo).forEach(function (k) { vis.recuo[k] -= dt; if (vis.recuo[k] <= 0) delete vis.recuo[k]; });
    Object.keys(vis.tremor).forEach(function (k) { vis.tremor[k] -= dt; if (vis.tremor[k] <= 0) delete vis.tremor[k]; });
    vis.flashArraial = Math.max(0, vis.flashArraial - dt);
    if (vis.recusa) { vis.recusa.t -= dt; if (vis.recusa.t <= 0) vis.recusa = null; }
  }

  function desenharEfeito(g, f, vis) {
    var p = f.t / f.dur;
    switch (f.tipo) {
      case 'tracante':
        g.strokeStyle = f.forte ? 'rgba(255,214,110,' + (1 - p).toFixed(2) + ')' : 'rgba(255,240,200,' + (0.9 * (1 - p)).toFixed(2) + ')';
        g.lineWidth = f.forte ? 2 : 1.3;
        linha(g, f.x0, f.y0, f.x1, f.y1);
        break;
      case 'onda':
        g.save();
        g.strokeStyle = f.dourado ? 'rgba(214,160,40,' + (0.9 * (1 - p)).toFixed(2) + ')' : 'rgba(94,122,58,' + (0.9 * (1 - p)).toFixed(2) + ')';
        g.lineWidth = 3 * (1 - p) + 0.5;
        elipse(g, f.x, f.y, f.rx * (0.2 + 0.8 * p), f.rx * (0.2 + 0.8 * p) / 2);
        g.stroke();
        g.restore();
        break;
      case 'clarao':
        g.fillStyle = 'rgba(255,214,120,' + (1 - p).toFixed(2) + ')';
        elipse(g, f.x, f.y, 4, 4);
        g.fill();
        break;
      case 'fumaca': {
        var rr = f.r0 + (f.r1 - f.r0) * Math.sqrt(p);
        g.fillStyle = 'rgba(214,208,194,' + (0.6 * (1 - p)).toFixed(2) + ')';
        elipse(g, f.x + f.vx * f.t, f.y + f.vy * f.t, rr, rr);
        g.fill();
        tinta(g, 0.5, 0.25 * (1 - p));
        g.stroke();
        break;
      }
      case 'poeira':
        g.fillStyle = (f.dourado ? 'rgba(232,186,70,' : 'rgba(180,150,104,') + (0.55 * (1 - p)).toFixed(2) + ')';
        elipse(g, f.x, f.y - p * 5, 3 + p * 6, 2 + p * 3);
        g.fill();
        break;
      case 'caido':
        soldadoCaido(g, f.x, f.y, f.dx, p < 0.6 ? 0.9 : 0.9 * (1 - (p - 0.6) / 0.4));
        break;
      case 'lasca':
        g.save();
        g.translate(f.x + f.vx * f.t, f.y + f.vy * f.t + 70 * f.t * f.t);
        g.rotate(f.rot + f.t * 8);
        g.globalAlpha = 1 - p;
        tinta(g, 2.4, 1);
        linha(g, -4, 0, 4, 0);
        g.strokeStyle = COR.madeira;
        g.lineWidth = 1.4;
        linha(g, -4, 0, 4, 0);
        g.restore();
        break;
      case 'anel':
        tinta(g, 1.4, 0.8 * (1 - p));
        elipse(g, f.x, f.y, 14 + p * 14, 7 + p * 7);
        g.stroke();
        break;
      case 'texto': {
        g.save();
        g.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
        g.font = (f.grande ? '700 20px ' : f.pequeno ? 'italic 600 12px ' : '700 14px ') + FONTE_TEXTO;
        g.textAlign = 'center';
        var dy = vis.menosMovimento ? 0 : p * 18;
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(240,230,205,.85)';
        g.strokeText(f.txt, f.x, f.y - dy);
        g.fillStyle = f.cor;
        g.fillText(f.txt, f.x, f.y - dy);
        g.restore();
        break;
      }
    }
  }

  // ───────────────────────── Camadas de ajuda (no chão) ─────────────────────────

  function celulasValidas(g, jogo, tipo) {
    var mapa = jogo.mapa, C = mapa.C;
    for (var y = 0; y < mapa.H; y++) for (var x = 0; x < mapa.W; x++) {
      if (!N.validarTerreno(jogo, tipo, x, y).ok) continue;
      if (tipo === 'barricada') {
        g.save();
        g.setLineDash([4, 4]);
        tinta(g, 1.6, 0.5);
        g.strokeRect(x * C + 5, y * C + 5, C - 10, C - 10);
        g.restore();
      } else {
        g.fillStyle = 'rgba(42,32,22,.25)';
        elipse(g, (x + 0.5) * C, (y + 0.5) * C, 2.4, 2.4);
        g.fill();
      }
    }
  }

  function alcance(g, x, y, raio, forte) {
    g.fillStyle = forte ? 'rgba(195,139,62,.17)' : 'rgba(195,139,62,.09)';
    elipse(g, x, y, raio, raio);
    g.fill();
    g.save();
    g.setLineDash([7, 6]);
    tinta(g, 1.5, forte ? 0.6 : 0.35);
    g.stroke();
    g.restore();
  }

  function trechosDescobertos(g, jogo) {
    var C = jogo.mapa.C, cob = N.cobertura(jogo);
    g.fillStyle = 'rgba(166,58,36,.36)';
    jogo.mapa.estrada.forEach(function (c, i) {
      if (!cob.coberta[i]) g.fillRect(c.x * C + 2, c.y * C + 2, C - 4, C - 4);
    });
    var m = cob.maiorTrecho;
    if (m.tamanho < 3) return null;
    var meio = jogo.mapa.estrada[m.inicio + Math.floor(m.tamanho / 2)];
    return { x: (meio.x + 0.5) * C, y: (meio.y + 0.5) * C };
  }

  function fantasmaChao(g, jogo, vis, alcPx) {
    var h = vis.hover, tipo = vis.ferramenta, C = jogo.mapa.C;
    if (!h || !tipo || h.cx < 0 || h.cy < 0 || h.cx >= jogo.mapa.W || h.cy >= jogo.mapa.H) return null;
    if (N.estruturaEm(jogo, h.cx, h.cy)) return null; // clicar ali seleciona a estrutura
    var v = N.validarConstrucao(jogo, tipo, h.cx, h.cy);
    var terrenoOk = N.validarTerreno(jogo, tipo, h.cx, h.cy).ok;
    var x = h.cx * C, y = h.cy * C;
    g.fillStyle = v.ok ? 'rgba(94,122,58,.32)' : 'rgba(166,58,36,.32)';
    g.fillRect(x, y, C, C);
    g.strokeStyle = v.ok ? 'rgba(70,96,40,.9)' : 'rgba(150,46,28,.9)';
    g.lineWidth = 2.6;
    g.strokeRect(x + 1.5, y + 1.5, C - 3, C - 3);
    if (terrenoOk && tipo === 'atiradores') alcance(g, x + C / 2, y + C / 2, alcPx, true);
    return { v: v, terrenoOk: terrenoOk, tipo: tipo, cx: h.cx, cy: h.cy, x: x + C / 2, y: y + C / 2 };
  }

  // ───────────────────────── Camadas de tela ─────────────────────────

  function fantasmaFigura(g, P, jogo, gh) {
    if (!gh.terrenoOk) return;
    var mapa = jogo.mapa;
    var falso = { id: 0, x: gh.x, y: gh.y, angulo: 0, vida: 1, vidaMax: 1 };
    if (gh.tipo === 'barricada') {
      falso.angulo = mapa.estrada[mapa.indice.get(gh.cx + ',' + gh.cy)].ang;
      barricada(g, P, falso, 0.6, false);
    } else {
      var melhor = null, md = Infinity;
      mapa.estrada.forEach(function (c) {
        var dd = (c.x - gh.cx) * (c.x - gh.cx) + (c.y - gh.cy) * (c.y - gh.cy);
        if (dd < md) { md = dd; melhor = c; }
      });
      if (melhor) falso.angulo = Math.atan2(melhor.y - gh.cy, melhor.x - gh.cx);
      atiradores(g, P, falso, falso.angulo, 0.6, 0);
    }
  }

  function rotulo(g, P, txt, x, y, cor) {
    g.save();
    g.font = '600 13px ' + FONTE_TEXTO;
    var w = g.measureText(txt).width + 14;
    var bx = Math.max(12, Math.min(P.L - w - 12, x - w / 2)), by = y - 26;
    if (by < 12) by = y + 30;
    by = Math.min(by, P.A - 34);
    g.fillStyle = 'rgba(243,236,220,.96)';
    g.beginPath();
    if (g.roundRect) g.roundRect(bx, by, w, 22, 3); else g.rect(bx, by, w, 22);
    g.fill();
    tinta(g, 1, 0.8);
    g.stroke();
    g.fillStyle = cor || COR.tinta;
    g.textBaseline = 'middle';
    g.fillText(txt, bx + 7, by + 11.5);
    g.restore();
  }

  function faixa(g, P, txt) {
    g.save();
    g.font = '24px ' + FONTE_TITULO;
    if ('letterSpacing' in g) g.letterSpacing = '2px';
    var w = g.measureText(txt).width + 56, x = (P.L - w) / 2, y = 22;
    g.fillStyle = 'rgba(70,45,20,.25)';
    g.fillRect(x + 5, y + 5, w, 50);
    g.fillStyle = '#F1E8D2';
    g.fillRect(x, y, w, 50);
    tinta(g, 2.2, 1);
    g.strokeRect(x, y, w, 50);
    tinta(g, 0.8, 1);
    g.strokeRect(x + 5, y + 5, w - 10, 40);
    g.fillStyle = COR.tinta;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(txt, P.L / 2, y + 27);
    g.restore();
  }

  function angDif(a, b) {
    var d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  // ───────────────────────── Quadro ─────────────────────────

  function desenhar(g, jogo, vis, cena, dpr, opc) {
    var P = cena.P, s = jogo.s, D = jogo.D, C = P.C;
    var alcPx = D.estruturas.atiradores.alcance * C;
    var fim = s.fase === 'vitoria' || s.fase === 'derrota';
    P.tela(g, dpr);
    g.clearRect(0, 0, P.L, P.A);
    g.drawImage(cena.fundo, 0, 0, P.L, P.A);
    g.lineCap = 'round';
    g.lineJoin = 'round';

    var sel = null, ca = s.campeao, DC = D.campeao;
    s.estruturas.forEach(function (e) { if (e.id === vis.selecionada) sel = e; });
    var campeaoSel = vis.selecionada === 'campeao';

    // ── No chão, em perspectiva ──
    P.chao(g, dpr);
    // área de influência do Conselheiro: aura sempre à vista, prédica quando ativa
    if (ca) {
      if (ca.predica > 0) {
        g.fillStyle = 'rgba(230,186,80,' + (0.13 + 0.05 * Math.sin(s.tempo * 6)).toFixed(3) + ')';
        elipse(g, ca.x, ca.y, DC.predica.raio * C, DC.predica.raio * C);
        g.fill();
      }
      // barricadas firmes pela Prédica ganham um halo dourado no chão
      s.estruturas.forEach(function (b) {
        if (b.tipo !== 'barricada' || !N.barricadaFirme(jogo, b)) return;
        g.fillStyle = 'rgba(236,190,70,.38)';
        elipse(g, b.x, b.y, 24, 24);
        g.fill();
      });
      // aura: cheia com ele parado, só o contorno apagado enquanto anda
      if (!ca.destino) {
        g.fillStyle = campeaoSel ? 'rgba(214,170,70,.14)' : 'rgba(214,170,70,.06)';
        elipse(g, ca.x, ca.y, DC.aura.raio * C, DC.aura.raio * C);
        g.fill();
      } else {
        elipse(g, ca.x, ca.y, DC.aura.raio * C, DC.aura.raio * C);
      }
      g.save();
      g.setLineDash([3, 6]);
      g.strokeStyle = ca.destino ? 'rgba(150,104,20,.2)' : campeaoSel ? 'rgba(150,104,20,.8)' : 'rgba(150,104,20,.45)';
      g.lineWidth = 1.8;
      g.stroke();
      g.restore();
      g.fillStyle = 'rgba(245,214,130,.4)';
      elipse(g, ca.x, ca.y, 15, 15);
      g.fill();
      if (ca.destino) {
        g.save();
        g.setLineDash([5, 6]);
        tinta(g, 1.6, 0.6);
        linha(g, ca.x, ca.y, ca.destino.x, ca.destino.y);
        g.restore();
        tinta(g, 2.4, 0.8);
        linha(g, ca.destino.x - 7, ca.destino.y - 7, ca.destino.x + 7, ca.destino.y + 7);
        linha(g, ca.destino.x + 7, ca.destino.y - 7, ca.destino.x - 7, ca.destino.y + 7);
      }
      if (campeaoSel) {
        g.save();
        g.setLineDash([6, 5]);
        tinta(g, 2.2, 0.95);
        elipse(g, ca.x, ca.y, 22, 22);
        g.stroke();
        g.restore();
      }
    }
    var destinoCampeao = null;
    if (campeaoSel && !fim && !vis.ferramenta && vis.hover) {
      var hc = vis.hover;
      if (hc.cx >= 0 && hc.cy >= 0 && hc.cx < jogo.mapa.W && hc.cy < jogo.mapa.H && !(hc.cx === ca.cx && hc.cy === ca.cy)) {
        var vm = N.validarMovimento(jogo, hc.cx, hc.cy);
        g.fillStyle = vm.ok ? 'rgba(214,170,70,.28)' : 'rgba(166,58,36,.25)';
        g.fillRect(hc.cx * C, hc.cy * C, C, C);
        g.strokeStyle = vm.ok ? 'rgba(150,104,20,.9)' : 'rgba(150,46,28,.8)';
        g.lineWidth = 2.4;
        g.strokeRect(hc.cx * C + 1.5, hc.cy * C + 1.5, C - 3, C - 3);
        if (vm.ok) {
          g.save();
          g.setLineDash([3, 6]);
          tinta(g, 1.4, 0.5);
          elipse(g, (hc.cx + 0.5) * C, (hc.cy + 0.5) * C, DC.aura.raio * C, DC.aura.raio * C);
          g.stroke();
          g.restore();
        } else if (!N.estruturaEm(jogo, hc.cx, hc.cy)) {
          destinoCampeao = { x: (hc.cx + 0.5) * C, y: (hc.cy + 0.5) * C, motivo: vm.motivo };
        }
      }
    }
    if (vis.ferramenta && !fim) celulasValidas(g, jogo, vis.ferramenta);
    var verTodos = vis.sempreAlcance || vis.mostrarCobertura || vis.ferramenta === 'atiradores' || s.fase === 'derrota';
    if (verTodos) {
      s.estruturas.forEach(function (e) { if (e.tipo === 'atiradores') alcance(g, e.x, e.y, alcPx, e === sel); });
    } else if (sel && sel.tipo === 'atiradores') {
      alcance(g, sel.x, sel.y, alcPx, true);
    }
    var descoberto = (s.fase === 'derrota' || vis.mostrarCobertura) ? trechosDescobertos(g, jogo) : null;
    var AR = D.mapa.arraial;
    if (vis.flashArraial > 0) {
      g.fillStyle = 'rgba(166,58,36,' + (0.4 * vis.flashArraial / 0.7).toFixed(2) + ')';
      g.fillRect(AR.x * C, AR.y * C, AR.w * C, AR.h * C);
    }
    var gh = fim ? null : fantasmaChao(g, jogo, vis, alcPx);
    if (sel) {
      g.save();
      g.setLineDash([6, 5]);
      tinta(g, 2.2, 0.95);
      elipse(g, sel.x, sel.y, 24, 24);
      g.stroke();
      g.restore();
    }
    s.estruturas.forEach(function (e) {
      if (e.estado !== 'construindo') return;
      tinta(g, 3.4, 0.9);
      g.beginPath();
      g.arc(e.x, e.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * e.progresso);
      g.stroke();
    });

    // ── De pé, de trás para a frente ──
    P.tela(g, dpr);
    vis.fx.forEach(function (f) { if (f.fundo) desenharEfeito(g, f, vis); });
    var lista = [];
    cena.props.forEach(function (o) { lista.push({ z: o.wx + o.wy, o: o }); });
    s.estruturas.forEach(function (e) { lista.push({ z: e.x + e.y, e: e }); });
    s.inimigos.forEach(function (ini) {
      var p = N.posicaoInimigo(jogo, ini);
      lista.push({ z: p.x + p.y, ini: ini, p: p });
    });
    if (ca) lista.push({ z: ca.x + ca.y, campeao: ca });
    lista.sort(function (a, b) { return a.z - b.z; });
    lista.forEach(function (it) {
      if (it.o) {
        desenharObjeto(g, P, it.o);
      } else if (it.campeao) {
        var cp = P.p(ca.x, ca.y), cd = dirTela(ca.angulo);
        conselheiro(g, cp.x, cp.y, cd.x, (ca.x + ca.y) * 0.18, !!ca.destino);
      } else if (it.e) {
        var e = it.e, alfa = e.estado === 'pronta' ? 1 : 0.45;
        if (e.tipo === 'barricada') {
          barricada(g, P, e, alfa, !vis.menosMovimento && vis.tremor[e.id] > 0);
        } else {
          var atual = vis.angulos[e.id];
          atual = atual === undefined ? e.angulo : atual + angDif(atual, e.angulo) * 0.25;
          vis.angulos[e.id] = atual;
          atiradores(g, P, e, atual, alfa, Math.max(0, vis.recuo[e.id] || 0) * 2);
        }
      } else {
        var sp = P.p(it.p.x, it.p.y), d = dirTela(it.p.ang), ataca = it.ini.estado === 'atacando';
        soldado(g, sp.x, sp.y, d.x, d.y, it.ini.d * 0.16 + (ataca ? s.tempo * 9 : 0), ataca);
      }
    });
    if (gh) fantasmaFigura(g, P, jogo, gh);

    // ── Por cima de tudo ──
    s.estruturas.forEach(function (e) {
      if (e.tipo !== 'barricada' || e.vida >= e.vidaMax) return;
      var a = P.p(e.x, e.y), fr = e.vida / e.vidaMax;
      barraVida(g, a.x, a.y - 26, 26, fr, fr > 0.5 ? COR.madeiraClara : COR.perigo);
    });
    s.inimigos.forEach(function (ini) {
      if (ini.vida >= ini.vidaMax) return;
      var p = N.posicaoInimigo(jogo, ini), sp = P.p(p.x, p.y);
      barraVida(g, sp.x, sp.y - 31, 16, ini.vida / ini.vidaMax, COR.perigo);
    });
    vis.fx.forEach(function (f) { if (!f.fundo) desenharEfeito(g, f, vis); });
    if (descoberto) {
      var dsp = P.p(descoberto.x, descoberto.y);
      rotulo(g, P, 'sem cobertura', dsp.x, dsp.y, '#7A2E1C');
    }
    if (gh && !gh.v.ok) {
      var gsp = P.p(gh.x, gh.y, 22);
      rotulo(g, P, gh.v.motivo, gsp.x, gsp.y, '#7A2E1C');
    }
    if (destinoCampeao) {
      var dcp = P.p(destinoCampeao.x, destinoCampeao.y, 22);
      rotulo(g, P, destinoCampeao.motivo, dcp.x, dcp.y, '#7A2E1C');
    }
    if (vis.recusa) {
      var rp = P.p(vis.recusa.x, vis.recusa.y, 22);
      rotulo(g, P, vis.recusa.motivo, rp.x, rp.y, '#7A2E1C');
    }

    // nome e integridade do arraial, logo abaixo da ponta sul
    var pe = P.p((AR.x + AR.w) * C, (AR.y + AR.h) * C), frI = s.integridade / D.objetivo.integridade;
    g.save();
    g.font = '13px ' + FONTE_TITULO;
    if ('letterSpacing' in g) g.letterSpacing = '1.5px';
    g.textAlign = 'center';
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(240,230,205,.8)';
    g.strokeText('BELO MONTE', pe.x, pe.y + 24);
    g.fillStyle = 'rgba(42,32,22,.9)';
    g.fillText('BELO MONTE', pe.x, pe.y + 24);
    g.restore();
    barraVida(g, pe.x, pe.y + 30, 96, frI, frI > 0.5 ? COR.bom : frI > 0.25 ? '#B07A2E' : COR.perigo);

    if (s.fase === 'derrota') faixa(g, P, 'O ARRAIAL CAIU');
    else if (s.fase === 'vitoria') faixa(g, P, 'O ARRAIAL RESISTIU');
    else if (opc && opc.pausado) {
      g.fillStyle = 'rgba(233,221,191,.35)';
      g.fillRect(0, 0, P.L, P.A);
      faixa(g, P, 'PAUSADO');
    }
  }

  // Ponto da tela → casa da grade (no chão).
  function celulaNaTela(cena, sx, sy) {
    var w = cena.P.mundo(sx, sy);
    return { cx: Math.floor(w.x / cena.P.C), cy: Math.floor(w.y / cena.P.C) };
  }

  // Figuras sobem acima da própria casa: clicar no desenho também acerta.
  // Devolve o que estiver mais à frente: { campeao: true } ou { estrutura }.
  function objetoNaTela(jogo, cena, sx, sy) {
    var P = cena.P, achado = null, z = -Infinity, ca = jogo.s.campeao;
    if (ca) {
      var c = P.p(ca.x, ca.y);
      if (Math.abs(sx - c.x) < 12 && sy > c.y - 37 && sy < c.y + 7) { achado = { campeao: true }; z = ca.x + ca.y; }
    }
    jogo.s.estruturas.forEach(function (e) {
      var a = P.p(e.x, e.y);
      if (Math.abs(sx - a.x) < 17 && sy > a.y - 26 && sy < a.y + 9 && e.x + e.y > z) { z = e.x + e.y; achado = { estrutura: e }; }
    });
    return achado;
  }

  // Retrato do Conselheiro para o painel, desenhado com o próprio boneco do jogo.
  function retrato(canvas) {
    var g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    var gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#E7C98A');
    gr.addColorStop(1, '#B98A4E');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    conselheiro(g, w * 0.46, h * 1.55, 1, 0, false, h / 24);
  }

  raiz.CanudosRender = {
    criarCena: criarCena, desenhar: desenhar, novoVisual: novoVisual,
    efeito: efeito, avancarEfeitos: avancarEfeitos,
    celulaNaTela: celulaNaTela, objetoNaTela: objetoNaTela, retrato: retrato
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
