/* Canudos: A Última Resistência — desenho em pixel art isométrico (protótipo v0.5)
 *
 * Mesma interface do render.js (o desenho em aquarela da v0.3), outro visual.
 * As regras (nucleo.js) continuam numa grade vista de cima; aqui uma casa de
 * 40 px de mundo vira um losango de 32 × 16 px de arte.
 *
 * Nítido e fluido ao mesmo tempo: tudo é pintado num buffer em escala inteira
 * da arte (cada px de arte vira m × m px) e só no fim reduzido para o tamanho
 * da tela, com suavização. O pixel fica uniforme, e quem anda (tropas,
 * Conselheiro, fumaça, bichos) anda em frações de px de arte, sem tremer.
 *
 * O sertão de 1897, na seca. A caatinga é "mata branca": galhos cinza-prata
 * quase sem folha, cortados pelo verde escuro do juazeiro e da oiticica, que
 * não perdem a folha. Umbuzeiros, licurizeiros, favela, macambira avermelhada
 * pela seca, lajedos de granito com xique-xique e coroa-de-frade, capim
 * panasco dourado. O mandacaru aparece como sinal, não como cenário inteiro.
 * O Vaza-Barris corre seco, com poças e craibeiras em flor nas margens. Ao
 * fundo, as serras azuladas e o sol baixo da tarde. No arraial, casas de taipa
 * com palha ou telha, as duas igrejas, o cruzeiro, cabras e galinhas.
 */
(function (raiz) {
  'use strict';

  var N = raiz.CanudosNucleo;
  var TAU = Math.PI * 2;

  var ESC = 2;            // px lógicos (os do ui.js) por px de arte
  var S = 0.4;            // px de arte por px de mundo
  var MARGEM = 240, TOPO = 180, BASE = 480, HORIZONTE = 30;
  var FONTE = '"Pixelify Sans", "Courier New", monospace';

  // ───────────────────────── Paleta ─────────────────────────

  var HEX = {
    contorno: '#1d120c',
    terra: ['#35261d', '#4c3628', '#644633', '#7c5940', '#936b4d', '#a87e5c', '#bb926d', '#cca681', '#dbbc9a', '#e8d3b8'],
    areia: ['#9f8c74', '#b29f86', '#c3b198', '#d2c2aa', '#dfd2be', '#ebe2d2'],
    capim: ['#55432a', '#6f5a36', '#8a7342', '#a48b52', '#bca465', '#d0bb7e'],
    galho: ['#26211e', '#3f3833', '#5c544d', '#7c736a', '#a0968a', '#c4bbae', '#e0d9cd'],
    seca: ['#3a3b22', '#52532c', '#6c6c36', '#888542', '#a49e55', '#bfb672'],
    cinzaVerde: ['#3b4434', '#525d45', '#6c7858', '#88936d', '#a6ae87', '#c2c8a4'],
    verde: ['#142a1c', '#1f3d27', '#2d5430', '#3f6c38', '#558543', '#71a050', '#97bd65'],
    cacto: ['#163028', '#234539', '#335e4a', '#48795e', '#649574', '#8bb393', '#b6cfae'],
    cactoAzul: ['#1a2c33', '#27434e', '#365c69', '#4b7783', '#68939b', '#93b5b5', '#c0d6d0'],
    pedra: ['#2f2c2a', '#4a4541', '#67615b', '#857e76', '#a39b91', '#bfb8ad', '#d9d3c8', '#eeeae2'],
    liquen: ['#b5772f', '#d9a54f', '#d8d2bd'],
    agua: ['#33505c', '#4a6b7a', '#6b8f9c', '#94b4b8', '#c3d9d4', '#ecf3ec'],
    ceu: ['#4a78a3', '#6590b5', '#86aac5', '#a8c2d1', '#c9d6d5', '#e3dfcb', '#f0dcb4', '#f5cf96'],
    serra: ['#4b4560', '#5d5672', '#726a85', '#897f96', '#a296a6', '#baabb2'],
    taipa: ['#4f321f', '#6a432a', '#875a38', '#a57249', '#c08b5c', '#d6a674', '#e6c193'],
    cal: ['#857c6c', '#a8a08f', '#c8c0ad', '#e0d9c6', '#f1ecdf', '#faf7ef'],
    palha: ['#47361f', '#634b29', '#7f6234', '#9a7a41', '#b0904f', '#c3a461', '#d4b97d'],
    telha: ['#45201a', '#632c1f', '#843b26', '#a24d30', '#bd643e', '#d27f54'],
    madeira: ['#24170e', '#3c2716', '#573a21', '#74502f', '#916a40', '#ad8656'],
    pele: ['#3d2417', '#5c3722', '#7c4c30', '#9c6442', '#b97f58', '#cf9b72'],
    algodao: ['#6e6452', '#938870', '#b7ac91', '#d4cab0', '#e8e0cb', '#f5f0e2'],
    couro: ['#24140b', '#3d2313', '#5a351c', '#784927', '#965e33', '#b27845'],
    farda: ['#121726', '#1d2438', '#2a344f', '#3b4868', '#526184', '#6f7ea0'],
    tunica: ['#121a33', '#1b2850', '#26386d', '#344c8c', '#4d67a8', '#7088c2', '#9db0db'],
    branco: ['#7d776d', '#a39d92', '#c7c2b7', '#e4e0d7', '#f8f6f1'],
    metal: ['#2d3035', '#555a62', '#868c95', '#bcc1c7', '#eef0f2'],
    ouro: ['#6b4710', '#9a6a1a', '#c9922c', '#e7bd4f', '#f8e08f'],
    fogo: ['#9a2f17', '#d4612a', '#f09a3e', '#fbd06a', '#fff4c4'],
    flor: ['#7a1c34', '#a8284a', '#d4466a'],
    amarelo: ['#9a6c16', '#c99a22', '#e8c23a', '#f6dc6a', '#fcee9e']
  };

  function rgba(r, g, b, a) { return ((a === undefined ? 255 : a) << 24 | b << 16 | g << 8 | r) >>> 0; }
  function cor(h, a) { var n = parseInt(h.slice(1), 16); return rgba(n >> 16 & 255, n >> 8 & 255, n & 255, a); }
  function comp(c) { return [c & 255, c >>> 8 & 255, c >>> 16 & 255, c >>> 24]; }
  function mistura(a, b, t) {
    var A = comp(a), B = comp(b);
    return rgba(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t), A[3]);
  }
  function comAlfa(c, a) { var k = comp(c); return rgba(k[0], k[1], k[2], a); }
  function css(c, alfa) { var k = comp(c); return 'rgba(' + k[0] + ',' + k[1] + ',' + k[2] + ',' + (alfa === undefined ? 1 : alfa) + ')'; }

  var PAL = {};
  Object.keys(HEX).forEach(function (k) {
    PAL[k] = Array.isArray(HEX[k]) ? HEX[k].map(function (h) { return cor(h); }) : cor(HEX[k]);
  });
  var CONT = PAL.contorno;

  // Pontilhado ordenado (Bayer 4 × 4): é ele que faz o degradê virar pixel art.
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function limiar(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  function tom(rp, v, x, y) {
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    var f = v * (rp.length - 1), i = Math.floor(f);
    if (i >= rp.length - 1) return rp[rp.length - 1];
    return f - i > limiar(x, y) ? rp[i + 1] : rp[i];
  }
  // Como tom(), mas só pontilha perto do meio entre duas cores: dá manchas sólidas.
  function tomChapado(rp, v, x, y, faixa) {
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    var f = v * (rp.length - 1), i = Math.floor(f), fr = f - i;
    if (i >= rp.length - 1) return rp[rp.length - 1];
    var a = 0.5 - faixa / 2;
    if (fr < a) return rp[i];
    if (fr > 1 - a) return rp[i + 1];
    return (fr - a) / faixa > limiar(x, y) ? rp[i + 1] : rp[i];
  }

  // ───────────────────────── Ruído e sorteio ─────────────────────────

  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function ruido(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, o) {
    var t = 0, amp = 0.5, f = 1, n = 0;
    for (var i = 0; i < o; i++) { t += amp * ruido(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2; }
    return t / n;
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
  function sortear(r, pares) {
    var tot = 0, i;
    for (i = 0; i < pares.length; i++) tot += pares[i][1];
    var x = r() * tot;
    for (i = 0; i < pares.length; i++) { x -= pares[i][1]; if (x <= 0) return pares[i][0]; }
    return pares[pares.length - 1][0];
  }
  function escolha(lista, r) { return lista[Math.floor(r() * lista.length) % lista.length]; }

  // ───────────────────────── Bitmaps ─────────────────────────

  function Px(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  Px.prototype.p = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  };
  Px.prototype.g = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : 0; };
  Px.prototype.ret = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.p(x + i, y + j, c);
  };
  Px.prototype.linha = function (x0, y0, x1, y1, c) {
    var n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.2));
    for (var i = 0; i <= n; i++) this.p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, typeof c === 'function' ? c(i / n) : c);
  };
  Px.prototype.paraCanvas = function () {
    var cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    var g = cv.getContext('2d'), im = g.createImageData(this.w, this.h);
    new Uint32Array(im.data.buffer).set(this.d);
    g.putImageData(im, 0, 0);
    return cv;
  };

  // Recorta ao conteúdo, deixa 1 px de folga e passa o contorno: a borda de cada
  // pixel encostado no vazio vira a própria cor escurecida (contorno seletivo).
  function fazer(px, ax, ay, semContorno, forca) {
    var w = px.w, h = px.h, d = px.d, x0 = w, y0 = h, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (d[y * w + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
    var nw = x1 - x0 + 3, nh = y1 - y0 + 3, n = new Px(nw, nh);
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) n.d[(y - y0 + 1) * nw + (x - x0 + 1)] = d[y * w + x];
    if (!semContorno) {
      var src = n.d, out = new Uint32Array(src);
      for (y = 0; y < nh; y++) for (x = 0; x < nw; x++) {
        if (src[y * nw + x]) continue;
        var v = (x > 0 && src[y * nw + x - 1]) || (x < nw - 1 && src[y * nw + x + 1]) ||
                (y > 0 && src[(y - 1) * nw + x]) || (y < nh - 1 && src[(y + 1) * nw + x]);
        if (v && (v >>> 24) > 200) out[y * nw + x] = mistura(v, CONT, forca || 0.74);
      }
      n.d = out;
    }
    return { cv: n.paraCanvas(), w: nw, h: nh, ax: ax - x0 + 1, ay: ay - y0 + 1 };
  }

  function espelhar(sp) {
    var cv = document.createElement('canvas');
    cv.width = sp.w; cv.height = sp.h;
    var g = cv.getContext('2d');
    g.translate(sp.w, 0);
    g.scale(-1, 1);
    g.drawImage(sp.cv, 0, 0);
    var o = {}; for (var k in sp) o[k] = sp[k];
    o.cv = cv; o.ax = sp.w - sp.ax;
    if (sp.chamine) o.chamine = [-sp.chamine[0], sp.chamine[1]];
    return o;
  }

  // Polígono por varredura de linhas; fn(x, y) dá a cor de cada pixel.
  function poligono(px, pts, fn) {
    var y0 = Infinity, y1 = -Infinity, i;
    for (i = 0; i < pts.length; i++) { y0 = Math.min(y0, pts[i][1]); y1 = Math.max(y1, pts[i][1]); }
    for (var y = Math.ceil(y0 - 0.5); y <= Math.floor(y1 - 0.5); y++) {
      var yc = y + 0.5, xs = [];
      for (i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (m, n) { return m - n; });
      for (var k = 0; k + 1 < xs.length; k += 2) {
        for (var x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) px.p(x, y, fn(x, y));
      }
    }
  }

  // Volume arredondado (copa, pedra) com luz de cima à esquerda.
  function bolha(px, cx, cy, rx, ry, rp, o) {
    o = o || {};
    var sd = (o.semente || 1) | 0;
    for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, e2 = dx * dx + dy * dy;
        var lim = 1 + (o.borda ? (hash(x, y, sd) - 0.5) * o.borda : 0);
        if (e2 > lim) continue;
        if (o.furos && hash(x, y, sd + 7) < o.furos) continue;
        var nz = Math.sqrt(Math.max(0, 1 - Math.min(1, e2)));
        var l = -dx * 0.5 - dy * 0.6 + nz * 0.55;
        var v = 0.42 + l * 0.42 + (hash(x, y, sd + 3) - 0.5) * 0.12 - (o.deslocar || 0);
        px.p(x, y, tom(rp, v, x, y));
      }
    }
  }

  // ───────────────────────── Vegetação ─────────────────────────

  function galho(px, x, y, ang, len, larg, prof, r, e, folhas) {
    var x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    var n = Math.max(1, Math.ceil(len * 1.4));
    for (var i = 0; i <= n; i++) {
      var t = i / n, xx = x + (x1 - x) * t, yy = y + (y1 - y) * t;
      var lw = Math.max(1, Math.round(larg * (1 - t * 0.3)));
      for (var k = 0; k < lw; k++) {
        var idx = lw === 1 ? e.fino : k === 0 ? 5 : k === lw - 1 ? 2 : 3;
        px.p(xx + k - Math.floor(lw / 2), yy, e.casca[idx]);
      }
    }
    if (prof <= 0 || len < 1.5) { folhas.push([x1, y1]); return; }
    var nf = 2 + (r() < e.ramif ? 1 : 0);
    for (var j = 0; j < nf; j++) {
      var a = ang + (j - (nf - 1) / 2) * e.abertura + (r() - 0.5) * 0.5;
      a += (-Math.PI / 2 - a) * 0.15;
      galho(px, x1, y1, a, len * (0.58 + r() * 0.24), larg * 0.62, prof - 1, r, e, folhas);
    }
  }

  // Espécies da caatinga. Os números são de desenho, não de botânica.
  var ESP = {
    catingueira: { casca: PAL.galho, fino: 4, tronco: [7, 10], larg: 2.2, prof: 3, abertura: 0.72, ramif: 0.45, folha: PAL.seca, cobertura: 0.42, tufo: [1.3, 2.3], furos: 0.3 },
    jurema: { casca: PAL.galho, fino: 3, tronco: [6, 9], larg: 2, prof: 4, abertura: 0.9, ramif: 0.55, folha: PAL.seca, cobertura: 0.1, tufo: [1, 1.5], furos: 0.45 },
    umbuzeiro: { casca: PAL.galho, fino: 3, tronco: [3, 5], larg: 3.2, prof: 3, abertura: 1.15, ramif: 0.7, folha: PAL.cinzaVerde, cobertura: 0.9, tufo: [2.6, 3.6], furos: 0.12 },
    juazeiro: { casca: PAL.galho, fino: 3, tronco: [5, 7], larg: 2.6, prof: 2, abertura: 0.8, ramif: 0.6, folha: PAL.verde, cobertura: 1, tufo: [3.2, 4.4], furos: 0, copa: [8.5, 6.5] },
    oiticica: { casca: PAL.galho, fino: 2, tronco: [5, 7], larg: 3, prof: 2, abertura: 0.95, ramif: 0.7, folha: PAL.verde, cobertura: 1, tufo: [4, 5.5], furos: 0, copa: [12, 8], escuro: 0.12 },
    craibeira: { casca: PAL.galho, fino: 4, tronco: [9, 12], larg: 2, prof: 3, abertura: 0.6, ramif: 0.4, folha: PAL.amarelo, cobertura: 0.75, tufo: [1.4, 2.4], furos: 0.25 },
    favela: { casca: PAL.galho, fino: 4, tronco: [2, 4], larg: 1.4, prof: 2, abertura: 1.1, ramif: 0.8, folha: PAL.cinzaVerde, cobertura: 0.95, tufo: [2, 3], furos: 0.2, flores: PAL.branco[4] }
  };

  function arvore(r, e) {
    var px = new Px(64, 64), bx = 32, by = 61, folhas = [];
    var h = e.tronco[0] + r() * (e.tronco[1] - e.tronco[0]);
    galho(px, bx, by, -Math.PI / 2 + (r() - 0.5) * 0.3, h, e.larg, e.prof, r, e, folhas);
    if (e.copa) {
      var topo = by;
      folhas.forEach(function (f) { topo = Math.min(topo, f[1]); });
      bolha(px, bx + (r() - 0.5) * 2, (topo + (by - h)) / 2 - 1, e.copa[0], e.copa[1], e.folha,
        { semente: r() * 1e6, borda: 0.35, deslocar: e.escuro || 0 });
    }
    folhas.forEach(function (f) {
      if (r() > e.cobertura) return;
      var rr = e.tufo[0] + r() * (e.tufo[1] - e.tufo[0]);
      bolha(px, f[0], f[1] - rr * 0.3, rr, rr * 0.75, e.folha, { semente: r() * 1e6, borda: 0.6, furos: e.furos, deslocar: e.escuro || 0 });
    });
    if (e.flores) folhas.forEach(function (f) {
      if (r() < 0.45) px.p(f[0] + (r() - 0.5) * 3, f[1] - 1 - r() * 2, e.flores);
    });
    return fazer(px, bx, by + 0.5, false, 0.55);
  }

  function coluna(px, x0, y0, y1, w, rp) {
    for (var y = y0; y <= y1; y++) for (var i = 0; i < w; i++) {
      if (y === y0 && w > 2 && (i === 0 || i === w - 1)) continue;
      var t = w === 1 ? 0.3 : i / (w - 1);
      var idx = t < 0.2 ? 5 : t < 0.5 ? 4 : t < 0.8 ? 3 : 2;
      if (i > 0 && i < w - 1 && y % 4 === 0) idx += 1;
      if (y === y0) idx = Math.min(6, idx + 1);
      px.p(x0 + i, y, rp[Math.min(rp.length - 1, idx)]);
    }
  }

  function mandacaru(r) {
    var px = new Px(48, 52), bx = 24, by = 50, h = 16 + Math.floor(r() * 10), rp = PAL.cacto;
    coluna(px, bx - 2, by - h, by, 4, rp);
    var nb = 2 + Math.floor(r() * 3);
    for (var i = 0; i < nb; i++) {
      var lado = (i % 2 ? 1 : -1) * (r() < 0.15 ? -1 : 1);
      var ys = by - Math.floor(h * (0.32 + r() * 0.4)), fora = 2 + Math.floor(r() * 4);
      var sobe = 4 + Math.floor(r() * Math.max(2, Math.min(10, h - 6)));
      for (var k = 0; k <= fora; k++) {
        var xx = lado > 0 ? bx + 2 + k : bx - 3 - k;
        px.p(xx, ys - 2, rp[5]); px.p(xx, ys - 1, rp[3]); px.p(xx, ys, rp[2]);
      }
      var xc = lado > 0 ? bx + 1 + fora : bx - 4 - fora;
      coluna(px, xc, ys - sobe, ys, 3, rp);
      if (r() < 0.4) px.p(xc + 1, ys - sobe - 1, PAL.flor[1 + Math.floor(r() * 2)]);
    }
    if (r() < 0.5) px.p(bx - 1, by - h - 1, PAL.flor[2]);
    return fazer(px, bx, by + 0.5);
  }

  function facheiro(r) {
    var px = new Px(40, 62), bx = 20, by = 60, h = 22 + Math.floor(r() * 10), rp = PAL.cactoAzul;
    coluna(px, bx - 1, by - h, by, 3, rp);
    var nb = 1 + Math.floor(r() * 3);
    for (var i = 0; i < nb; i++) {
      var lado = i % 2 ? 1 : -1, ys = by - 2 - Math.floor(r() * 5), fora = 2 + Math.floor(r() * 2);
      var sobe = Math.floor(h * (0.45 + r() * 0.35));
      for (var k = 0; k <= fora; k++) {
        var xx = lado > 0 ? bx + 2 + k : bx - 2 - k;
        px.p(xx, ys - 1, rp[4]); px.p(xx, ys, rp[2]);
      }
      coluna(px, lado > 0 ? bx + 1 + fora : bx - 3 - fora, ys - sobe, ys, 3, rp);
    }
    return fazer(px, bx, by + 0.5);
  }

  // Xique-xique: touceira baixa, de hastes que deitam e depois sobem, em cima da pedra.
  function xiquexique(r) {
    var px = new Px(30, 20), bx = 15, by = 17, rp = PAL.cacto, n = 4 + Math.floor(r() * 4);
    for (var i = 0; i < n; i++) {
      var x0 = bx + (r() - 0.5) * 12, deita = 1 + Math.floor(r() * 3), dir = x0 < bx ? -1 : 1, h = 3 + Math.floor(r() * 6);
      for (var k = 0; k < deita; k++) { px.p(x0 + dir * k, by, rp[2]); px.p(x0 + dir * k, by - 1, rp[4]); }
      coluna(px, Math.round(x0 + dir * deita) - 1, by - h, by - 1, 2, rp);
    }
    return fazer(px, bx, by + 0.5, false, 0.6);
  }

  function coroa(r) {
    var px = new Px(12, 12), cx = 6, cy = 7;
    bolha(px, cx, cy, 3.2, 2.8, PAL.cacto, { semente: r() * 1e6 });
    for (var x = 4; x <= 8; x += 2) px.p(x, cy + 1, PAL.cacto[2]);
    px.ret(5, 3, 3, 2, PAL.flor[1]);
    px.p(6, 3, PAL.flor[2]);
    px.p(5, 4, PAL.flor[0]);
    return fazer(px, cx, cy + 3);
  }

  // Macambira: roseta de folhas com espinho, avermelhada pela seca.
  function macambira(r) {
    var px = new Px(22, 14), bx = 11, by = 12, n = 8 + Math.floor(r() * 4);
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.7 + (r() - 0.5) * 0.25, len = 4 + r() * 4;
      for (var t = 0; t <= len; t += 0.5) {
        var x = bx + Math.cos(a) * t, y = by + Math.sin(a) * t * 0.75 + t * t / (len * 3) * Math.abs(Math.cos(a));
        var c = t > len - 1.4 ? PAL.flor[0] : PAL.verde[2 + Math.round((1 - Math.abs(Math.cos(a))) * 2)];
        px.p(x, y, c);
      }
    }
    return fazer(px, bx, by + 0.5);
  }

  // Licurizeiro: a palmeira do sertão do norte da Bahia.
  function licuri(r) {
    var px = new Px(44, 58), bx = 22, by = 56, h = 14 + Math.floor(r() * 8), curva = (r() - 0.5) * 4;
    for (var y = 0; y <= h; y++) {
      var t = y / h, x = bx + curva * t * t;
      px.p(x, by - y, PAL.galho[y % 3 ? 4 : 2]);
      px.p(x + 1, by - y, PAL.galho[y % 3 ? 2 : 1]);
    }
    var tx = bx + curva + 0.5, ty = by - h;
    for (var k = 0; k < 3; k++) {
      var aa = Math.PI / 2 + (k - 1) * 0.55;
      px.linha(tx, ty + 1, tx + Math.cos(aa) * 4, ty + 1 + Math.sin(aa) * 6, PAL.palha[2 + k % 2]);
    }
    var nf = 8 + Math.floor(r() * 3);
    for (var i = 0; i < nf; i++) {
      var ang = Math.PI + (i / (nf - 1)) * Math.PI + (r() - 0.5) * 0.3;
      var L = 7 + r() * 5, cai = 0.05 + r() * 0.06;
      for (var s = 0; s <= L; s += 0.6) {
        var fx = tx + Math.cos(ang) * s, fy = ty + Math.sin(ang) * s * 0.75 + cai * s * s;
        var idx = 4 + (s < L * 0.5 ? 1 : 0) - (Math.sin(ang) > -0.4 ? 1 : 0);
        px.p(fx, fy, PAL.verde[idx]);
        if (Math.floor(s / 0.6) % 2 === 0 && s > 1.5) px.p(fx, fy + 1, PAL.verde[2]);
      }
    }
    px.p(tx - 1, ty + 2, PAL.fogo[1]);
    px.p(tx, ty + 3, PAL.fogo[1]);
    px.p(tx + 1, ty + 2, PAL.amarelo[0]);
    return fazer(px, bx, by + 0.5);
  }

  function pedra(r, tam) {
    var rx = tam, ry = tam * (0.55 + r() * 0.2), w = Math.ceil(rx * 2 + 6), h = Math.ceil(ry * 2 + 6);
    var px = new Px(w, h), cx = w / 2, cy = h - ry - 2;
    bolha(px, cx, cy, rx, ry, PAL.pedra, { semente: r() * 1e6, borda: 0.25 });
    for (var k = 0; k < Math.round(tam * 0.8); k++) {
      if (r() < 0.8) px.p(cx + (r() - 0.5) * rx * 1.2, cy - r() * ry * 0.7, PAL.liquen[Math.floor(r() * 3)]);
    }
    if (tam > 3.5) {
      var fx = cx + (r() - 0.5) * rx * 0.6;
      px.linha(fx, cy - ry * 0.6, fx + (r() - 0.5) * 3, cy + ry * 0.4, PAL.pedra[1]);
    }
    return fazer(px, cx, cy + ry * 0.7);
  }

  // ───────────────────────── Construções do arraial ─────────────────────────

  function q(x, y, z) { return [(x - y) * S, (x + y) * S / 2 - (z || 0)]; }

  function texParede(rp, base, sd) {
    return function (x, y) {
      var v = base + (hash(x, y, sd) - 0.5) * 0.2;
      if (hash(x * 3, y, sd + 1) < 0.05) v -= 0.2;
      return tom(rp, v, x, y);
    };
  }
  function texTelhado(rp, base, sd, palha) {
    return function (x, y) {
      var v = base + (hash(x, y, sd) - 0.5) * (palha ? 0.24 : 0.14);
      if (palha) v += ((y + Math.floor(x / 3)) % 2) ? 0.05 : -0.04;
      else v -= (y % 2) ? 0.1 : 0;
      return tom(rp, v, x, y);
    };
  }

  function caixa(px, at, x, y, w, d, z0, h, texY, texX) {
    var a = at(x, y + d, z0), b = at(x + w, y + d, z0), c = at(x + w, y, z0);
    var a2 = at(x, y + d, z0 + h), b2 = at(x + w, y + d, z0 + h), c2 = at(x + w, y, z0 + h);
    poligono(px, [a, b, b2, a2], texY);
    poligono(px, [b, c, c2, b2], texX);
  }

  // Telhado de duas águas, com a cumeeira ao longo de x ou de y.
  function telhado(px, at, x, y, w, d, z, alt, eixo, tex, texY, texX) {
    var ov = 2;
    if (eixo === 'x') {
      var r1 = at(x - ov, y + d / 2, z + alt), r2 = at(x + w + ov, y + d / 2, z + alt);
      poligono(px, [at(x - ov, y - ov, z - 1), at(x + w + ov, y - ov, z - 1), r2, r1], tex(0.42));
      poligono(px, [at(x + w, y, z), at(x + w, y + d, z), at(x + w, y + d / 2, z + alt - 1)], texX);
      poligono(px, [at(x - ov, y + d + ov, z - 1), at(x + w + ov, y + d + ov, z - 1), r2, r1], tex(0.74));
    } else {
      var s1 = at(x + w / 2, y - ov, z + alt), s2 = at(x + w / 2, y + d + ov, z + alt);
      poligono(px, [at(x - ov, y - ov, z - 1), at(x - ov, y + d + ov, z - 1), s2, s1], tex(0.78));
      poligono(px, [at(x, y + d, z), at(x + w, y + d, z), at(x + w / 2, y + d, z + alt - 1)], texY);
      poligono(px, [at(x + w + ov, y - ov, z - 1), at(x + w + ov, y + d + ov, z - 1), s2, s1], tex(0.4));
    }
  }

  function porta(px, at, x, y, larg, alt, corP) {
    for (var u = x; u <= x + larg; u += 0.5) {
      var b = at(u, y, 0);
      for (var k = 1; k <= alt; k++) px.p(b[0], b[1] - k, corP);
    }
  }

  function casa(r, o) {
    var w = o.w, d = o.d, alt = o.alt, cum = o.cum;
    var W = Math.ceil((w + d) * S) + 12, H = Math.ceil((w + d) * S / 2 + alt + cum) + 12;
    var px = new Px(W, H), ox = d * S + 6, oy = alt + cum + 6;
    var at = function (x, y, z) { var p = q(x, y, z); return [ox + p[0], oy + p[1]]; };
    var sd = Math.floor(r() * 1e6), rpP = o.cal ? PAL.cal : PAL.taipa;
    var tY = texParede(rpP, 0.72, sd), tX = texParede(rpP, 0.4, sd + 5);
    var tT = function (b) { return texTelhado(o.telha ? PAL.telha : PAL.palha, b, sd + 9, !o.telha); };
    caixa(px, at, 0, 0, w, d, 0, alt, tY, tX);
    var pe = function (xx, yy) { return o.cal ? tom(PAL.taipa, 0.45, xx, yy) : tom(PAL.taipa, 0.22, xx, yy); };
    px.linha(at(0, d, 1)[0], at(0, d, 1)[1], at(w, d, 1)[0], at(w, d, 1)[1], pe);
    px.linha(at(w, d, 1)[0], at(w, d, 1)[1], at(w, 0, 1)[0], at(w, 0, 1)[1], pe);
    if (o.porta) porta(px, at, w * (0.25 + r() * 0.3), d, 6.5, Math.max(3, alt - 2), PAL.madeira[1]);
    if (r() < 0.6) {
      var jv = d * 0.35;
      for (var u = jv; u <= jv + 4; u += 0.5) { var b = at(w, u, alt * 0.5); px.p(b[0], b[1], PAL.madeira[0]); px.p(b[0], b[1] - 1, PAL.madeira[0]); }
    }
    telhado(px, at, 0, 0, w, d, alt, cum, o.eixo, tT, tY, tX);
    var base = at(w / 2, d / 2, 0), cume = o.eixo === 'x' ? at(w * 0.72, d / 2, alt + cum) : at(w / 2, d * 0.72, alt + cum);
    var sp = fazer(px, base[0], base[1]);
    sp.chamine = [cume[0] - base[0], cume[1] - base[1]];
    return sp;
  }

  function texPedraLavrada(base, sd) {
    return function (x, y) {
      var bx = Math.floor((x + (Math.floor(y / 2) % 2) * 2) / 4);
      var v = base + (hash(bx, Math.floor(y / 2), sd) - 0.5) * 0.25;
      if (y % 2 === 0 || (x + (Math.floor(y / 2) % 2) * 2) % 4 === 0) v -= 0.13;
      return tom(PAL.pedra, v, x, y);
    };
  }

  function torre(px, at, x, y, w, d, z0, h, pronta, sd) {
    caixa(px, at, x, y, w, d, z0, 6, texPedraLavrada(0.6, sd), texPedraLavrada(0.36, sd + 1));
    caixa(px, at, x, y, w, d, z0 + 6, h - 6, texParede(PAL.cal, 0.78, sd + 2), texParede(PAL.cal, 0.48, sd + 3));
    // aberturas em arco, no alto das duas faces
    var zt = z0 + h - 7, k, b;
    for (k = 0; k < 3; k++) {
      b = at(x + w * 0.5 - 1 + k * 0.8, y + d, zt); px.p(b[0], b[1], PAL.madeira[0]); px.p(b[0], b[1] - 1, PAL.madeira[0]); px.p(b[0], b[1] - 2, PAL.madeira[0]);
      b = at(x + w, y + d * 0.5 - 1 + k * 0.8, zt); px.p(b[0], b[1], PAL.madeira[0]); px.p(b[0], b[1] - 1, PAL.madeira[0]); px.p(b[0], b[1] - 2, PAL.madeira[0]);
    }
    var topo = z0 + h;
    if (pronta) {
      var ap = at(x + w / 2, y + d / 2, topo + 7);
      poligono(px, [at(x, y + d, topo), at(x + w, y + d, topo), ap], texTelhado(PAL.telha, 0.72, sd + 4, false));
      poligono(px, [at(x + w, y + d, topo), at(x + w, y, topo), ap], texTelhado(PAL.telha, 0.4, sd + 5, false));
      px.ret(Math.round(ap[0]), Math.round(ap[1]) - 5, 1, 5, PAL.madeira[4]);
      px.ret(Math.round(ap[0]) - 1, Math.round(ap[1]) - 4, 3, 1, PAL.madeira[4]);
    } else {
      // por terminar: andaime de varas
      var c1 = at(x, y + d, topo), c2 = at(x + w, y + d, topo), c3 = at(x + w, y, topo);
      [c1, c2, c3].forEach(function (c) { px.ret(Math.round(c[0]), Math.round(c[1]) - 5, 1, 5, PAL.madeira[3]); });
      px.linha(c1[0], c1[1] - 4, c2[0], c2[1] - 4, PAL.madeira[4]);
      px.linha(c2[0], c2[1] - 4, c3[0], c3[1] - 4, PAL.madeira[2]);
      for (var i = 0; i < 6; i++) { b = at(x + w * (i / 6), y + d, topo); px.p(b[0], b[1], PAL.pedra[3 + (i % 2)]); }
    }
  }

  // Igreja Nova do Bom Jesus: obra grande, de pedra e cal, ainda em construção.
  function igrejaNova() {
    var w = 54, d = 30, alt = 16;
    var W = Math.ceil((w + d) * S) + 20, H = Math.ceil((w + d) * S / 2) + 60;
    var px = new Px(W, H), ox = d * S + 10, oy = 52;
    var at = function (x, y, z) { var p = q(x, y, z); return [ox + p[0], oy + p[1]]; };
    var sd = 1897;
    caixa(px, at, 0, 0, w, d, 0, 7, texPedraLavrada(0.62, sd), texPedraLavrada(0.38, sd + 1));
    caixa(px, at, 0, 0, w, d, 7, alt - 7, texParede(PAL.cal, 0.76, sd + 2), texParede(PAL.cal, 0.46, sd + 3));
    telhado(px, at, 0, 0, w, d, alt, 9, 'x', function (b) { return texTelhado(PAL.telha, b, sd + 4, false); },
      texParede(PAL.cal, 0.76, sd + 2), texParede(PAL.cal, 0.46, sd + 3));
    porta(px, at, w / 2 - 4, d, 8, 9, PAL.madeira[0]);
    var ro = at(w / 2, d, 13); px.ret(Math.round(ro[0]) - 1, Math.round(ro[1]) - 1, 3, 3, PAL.madeira[1]); px.p(Math.round(ro[0]), Math.round(ro[1]), PAL.ouro[2]);
    torre(px, at, 0, d - 10, 10, 10, 0, alt + 20, true, sd + 10);
    torre(px, at, w - 10, d - 10, 10, 10, 0, alt + 12, false, sd + 20);
    var base = at(w / 2, d / 2, 0);
    return fazer(px, base[0], base[1]);
  }

  // Igreja Velha de Santo Antônio: menor, caiada.
  function igrejaVelha() {
    var w = 30, d = 20, alt = 12;
    var W = Math.ceil((w + d) * S) + 16, H = Math.ceil((w + d) * S / 2) + 44;
    var px = new Px(W, H), ox = d * S + 8, oy = 38;
    var at = function (x, y, z) { var p = q(x, y, z); return [ox + p[0], oy + p[1]]; };
    var sd = 1893, tY = texParede(PAL.cal, 0.8, sd), tX = texParede(PAL.cal, 0.5, sd + 1);
    caixa(px, at, 0, 0, w, d, 0, alt, tY, tX);
    telhado(px, at, 0, 0, w, d, alt, 7, 'x', function (b) { return texTelhado(PAL.telha, b, sd + 2, false); }, tY, tX);
    porta(px, at, w * 0.42, d, 5.5, 7, PAL.madeira[1]);
    caixa(px, at, 0, d - 6, 6, 6, 0, alt + 8, tY, tX);
    var ap = at(3, d - 3, alt + 13);
    poligono(px, [at(0, d, alt + 8), at(6, d, alt + 8), ap], texTelhado(PAL.telha, 0.72, sd + 3, false));
    poligono(px, [at(6, d, alt + 8), at(6, d - 6, alt + 8), ap], texTelhado(PAL.telha, 0.4, sd + 4, false));
    px.ret(Math.round(ap[0]), Math.round(ap[1]) - 4, 1, 4, PAL.madeira[4]);
    px.ret(Math.round(ap[0]) - 1, Math.round(ap[1]) - 3, 3, 1, PAL.madeira[4]);
    var b = at(6, d - 3, alt + 4); px.p(b[0], b[1], PAL.madeira[0]); px.p(b[0], b[1] - 1, PAL.madeira[0]);
    var base = at(w / 2, d / 2, 0);
    return fazer(px, base[0], base[1]);
  }

  function cruzeiro() {
    var px = new Px(14, 24), bx = 7, by = 21;
    px.ret(3, 19, 9, 2, PAL.pedra[3]); px.ret(4, 18, 7, 1, PAL.pedra[5]); px.ret(3, 20, 9, 1, PAL.pedra[1]);
    px.ret(7, 3, 1, 15, PAL.madeira[4]); px.ret(8, 3, 1, 15, PAL.madeira[2]);
    px.ret(4, 7, 7, 1, PAL.madeira[4]); px.ret(4, 8, 7, 1, PAL.madeira[2]);
    return fazer(px, bx, by);
  }

  // Cerca de varas ao longo de x (eixo 'x') ou de y.
  function cerca(r, comp, eixo) {
    var px = new Px(Math.ceil(comp * S) + 12, Math.ceil(comp * S / 2) + 16), ox = eixo === 'x' ? 4 : Math.ceil(comp * S) + 6, oy = 10;
    var at = function (u, z) { var p = eixo === 'x' ? q(u, 0, z) : q(0, u, z); return [ox + p[0], oy + p[1]]; };
    for (var u = 0; u <= comp; u += 2.6) {
      var b = at(u, 0), h = 4 + Math.floor(r() * 3);
      for (var k = 0; k < h; k++) px.p(b[0], b[1] - k, PAL.madeira[k === h - 1 ? 4 : 3 - (k % 2)]);
    }
    px.linha(at(0, 2)[0], at(0, 2)[1], at(comp, 2)[0], at(comp, 2)[1], PAL.madeira[2]);
    px.linha(at(0, 4)[0], at(0, 4)[1], at(comp, 4)[0], at(comp, 4)[1], PAL.madeira[4]);
    var m = at(comp / 2, 0);
    return fazer(px, m[0], m[1]);
  }

  // ───────────────────────── Gente e bichos ─────────────────────────
  // Desenhos de 3/4, virados para a direita; a esquerda é o espelho.

  // Soldado. f: quadro da marcha (0–7) ou do golpe (0–3). tipo: infantaria, batedor
  // (brim claro, sem mochila, passo largo), sapador (avental de couro e picareta) ou
  // oficial (dragonas e botões dourados, faixa vermelha e espada). Tipos de jogo.
  function soldado(f, dirOuCostas, golpe, tipo) {
    tipo = tipo || 'infantaria';
    var direcao = typeof dirOuCostas === 'string' ? dirOuCostas : (dirOuCostas ? 'costas' : 'diagonal');
    var costas = direcao === 'costas';
    var perfil = direcao === 'perfil';
    var frente = direcao === 'frente';

    var px = new Px(30, 30), ox = 7, oy = 5, F = PAL.farda;
    var T = tipo === 'batedor' ? [PAL.algodao[0], PAL.algodao[1], PAL.algodao[2], PAL.algodao[3], PAL.algodao[4]] : F;
    function P_(x, y, c) { px.p(ox + x, oy + y, c); }
    function R_(x, y, w, h, c) { px.ret(ox + x, oy + y, w, h, c); }

    var ph = f / 8 * TAU, passo = golpe ? 0 : Math.sin(ph) * (tipo === 'batedor' ? 1.4 : 1);
    var u = !golpe && Math.abs(passo) < 0.4 ? -1 : 0;
    var pf = Math.round(passo * (perfil ? 2.5 : 2));
    var lunge = golpe ? [0, 1, 3, 1][f] : 0;
    var L = lunge;

    if (perfil) {
      // ── PERFIL LATERAL COMPLETO (Marcha na Reta Central) ──
      // Pernas em passo largo de perfil
      R_(3 - pf + L, 12, 2, 5, F[0]); R_(3 - pf + L, 17, 3, 1, PAL.couro[1]);
      R_(7 + pf + L, 12, 2, 5, F[2]); R_(7 + pf + L, 17, 3, 1, PAL.couro[3]);
      // Mochila militar às costas (lado esquerdo)
      R_(1 + L, 6 + u, 3, 6, PAL.couro[3]); R_(1 + L, 6 + u, 1, 6, PAL.couro[4]);
      // Túnica de perfil
      R_(4 + L, 6 + u, 4, 6, T[2]); R_(4 + L, 11 + u, 4, 1, PAL.couro[2]);
      // Talabarte diagonal
      P_(5 + L, 7 + u, PAL.branco[4]); P_(6 + L, 9 + u, PAL.branco[3]);
      // Cabeça em perfil e quepe com pala estendida
      R_(4 + L, 2 + u, 4, 4, PAL.pele[4]); P_(7 + L, 3 + u, PAL.pele[0]); P_(7 + L, 4 + u, PAL.pele[2]);
      R_(3 + L, 1 + u, 5, 2, F[2]); R_(3 + L, 0 + u, 4, 1, F[4]);
      R_(7 + L, 2 + u, 3, 1, F[0]); // Pala frontal rígida
      // Braço e fuzil Mauser apontando para frente
      if (!golpe) {
        R_(5 + L, 7 + u, 2, 4, T[3]); P_(6 + L, 11 + u, PAL.pele[4]);
        px.linha(ox + 6 + L, oy + 11 + u, ox + 14 + L, oy + 7 + u, function (t) { return t < 0.4 ? PAL.madeira[3] : PAL.metal[1]; });
        px.linha(ox + 14 + L, oy + 7 + u, ox + 17 + L, oy + 6 + u, PAL.metal[3]);
        if (tipo === 'infantaria') px.linha(ox + 17 + L, oy + 6 + u, ox + 20 + L, oy + 5 + u, PAL.metal[4]);
      } else {
        R_(6 + L, 7, 3, 2, T[3]); P_(9 + L, 8, PAL.pele[4]);
        px.linha(ox + 7 + L, oy + 8, ox + 16 + L, oy + 7, function (t) { return t < 0.35 ? PAL.madeira[3] : PAL.metal[1]; });
        px.linha(ox + 16 + L, oy + 7, ox + 20 + L, oy + 7, PAL.metal[4]);
      }
      return fazer(px, ox + 6, oy + 18);
    }

    if (frente) {
      // ── FRENTE PURA (Descendo o mapa em direção ao jogador) ──
      // Pernas simétricas avançando
      R_(3, 12 - (pf > 0 ? 1 : 0), 2, 5, F[0]); R_(3, 17 - (pf > 0 ? 1 : 0), 3, 1, PAL.couro[1]);
      R_(7, 12 - (pf < 0 ? 1 : 0), 2, 5, F[1]); R_(7, 17 - (pf < 0 ? 1 : 0), 3, 1, PAL.couro[2]);
      // Túnica frontal larga com ombros cheios
      R_(3 + L, 6 + u, 6, 6, T[2]); R_(3 + L, 11 + u, 6, 1, PAL.couro[2]);
      // Talabarte cruzado em 'X'
      P_(3 + L, 6 + u, PAL.branco[4]); P_(4 + L, 7 + u, PAL.branco[4]); P_(5 + L, 8 + u, PAL.branco[3]);
      P_(8 + L, 6 + u, PAL.branco[4]); P_(7 + L, 7 + u, PAL.branco[4]); P_(6 + L, 9 + u, PAL.branco[3]); P_(7 + L, 10 + u, PAL.branco[3]);
      // Botões dourados/metálicos centrais
      P_(5 + L, 9 + u, tipo === 'oficial' ? PAL.ouro[3] : PAL.metal[3]);
      // Cabeça frontal com quepe e pala apontada para baixo
      R_(4 + L, 3 + u, 4, 3, PAL.pele[4]); P_(4 + L, 4 + u, PAL.pele[0]); P_(7 + L, 4 + u, PAL.pele[0]); // Olhos
      R_(3 + L, 1 + u, 6, 2, F[2]); R_(4 + L, 0 + u, 4, 1, F[4]);
      R_(4 + L, 2 + u, 4, 1, F[0]); // Pala frontal cobrindo a testa
      // Braço e fuzil vertical com baioneta apontando para cima
      if (!golpe) {
        R_(8 + L, 7 + u, 2, 4, T[3]); P_(8 + L, 11 + u, PAL.pele[4]);
        px.linha(ox + 9 + L, oy + 12 + u, ox + 9 + L, oy + 1 + u, function (t) { return t < 0.4 ? PAL.madeira[3] : PAL.metal[1]; });
        px.linha(ox + 9 + L, oy + u, ox + 9 + L, oy - 4 + u, PAL.metal[3]);
        if (tipo === 'infantaria') px.linha(ox + 9 + L, oy - 4 + u, ox + 9 + L, oy - 9 + u, PAL.metal[4]);
      } else {
        R_(8 + L, 8, 3, 2, T[3]); P_(10 + L, 9, PAL.pele[4]);
        px.linha(ox + 8 + L, oy + 10, ox + 11 + L, oy + 14, PAL.madeira[3]);
        px.linha(ox + 11 + L, oy + 14, ox + 12 + L, oy + 17, PAL.metal[4]);
      }
      return fazer(px, ox + 6, oy + 18);
    }

    // ── COSTAS PURA OU DIAGONAL ISOMÉTRICA CLÁSSICA ──
    R_(4 - pf + lunge, 12, 2, 5, F[0]); R_(4 - pf + lunge, 17, 3, 1, PAL.couro[1]);
    R_(6 + pf + lunge, 12, 2, 5, F[1]); R_(6 + pf + lunge, 17, 3, 1, PAL.couro[2]);
    R_(2 + L, 7 + u, 1, 4, T[1]);
    R_(3 + L, 6 + u, 6, 6, T[2]); R_(3 + L, 6 + u, 1, 6, T[4]); R_(8 + L, 6 + u, 1, 6, T[1]);
    R_(3 + L, 11 + u, 6, 1, PAL.couro[2]);

    if (costas) {
      // Mochila de campanha grande às costas
      R_(3 + L, 7 + u, 6, 5, PAL.couro[3]); R_(3 + L, 7 + u, 6, 1, PAL.couro[4]); R_(8 + L, 7 + u, 1, 5, PAL.couro[2]);
      R_(4 + L, 3 + u, 4, 3, PAL.pele[2]); R_(4 + L, 3 + u, 4, 1, F[1]);
      R_(3 + L, 1 + u, 5, 2, F[2]); R_(4 + L, 0 + u, 4, 1, F[4]);
    } else {
      P_(4 + L, 7 + u, PAL.branco[4]); P_(5 + L, 8 + u, PAL.branco[4]);
      P_(6 + L, 9 + u, PAL.branco[3]); P_(7 + L, 10 + u, PAL.branco[3]);
      P_(6 + L, 8 + u, tipo === 'oficial' ? PAL.ouro[3] : PAL.metal[3]);
      R_(4 + L, 3 + u, 4, 3, PAL.pele[4]); R_(4 + L, 3 + u, 1, 3, PAL.pele[3]);
      P_(6 + L, 4 + u, PAL.pele[0]); P_(7 + L, 5 + u, PAL.pele[2]);
      R_(4 + L, 0 + u, 4, 1, F[4]); R_(3 + L, 1 + u, 5, 2, F[2]); R_(6 + L, 2 + u, 3, 1, F[0]);
    }

    if (!golpe) {
      R_(8, 7 + u, 2, 4, T[3]); P_(9, 11 + u, PAL.pele[4]);
      px.linha(ox + 10, oy + 12 + u, ox + 11, oy + 1 + u, function (t) { return t < 0.4 ? PAL.madeira[3] : PAL.metal[1]; });
      px.linha(ox + 11, oy + u, ox + 11, oy - 3 + u, PAL.metal[3]);
      if (tipo === 'infantaria') px.linha(ox + 11, oy + u - 4, ox + 11, oy + u - 8, PAL.metal[4]);
    } else {
      R_(8 + L, 8, 3, 2, T[3]); P_(11 + L, 9, PAL.pele[4]);
      px.linha(ox + 4 + L, oy + 10, ox + 14 + L, oy + 8, function (t) { return t < 0.35 ? PAL.madeira[3] : PAL.metal[1]; });
      px.linha(ox + 15 + L, oy + 8, ox + 17 + L, oy + 8, PAL.metal[3]);
    }
    return fazer(px, ox + 6, oy + 18);
  }

  function soldadoCaido() {
    var px = new Px(24, 10), F = PAL.farda;
    px.ret(3, 4, 6, 2, F[1]); px.ret(9, 3, 6, 3, F[2]); px.ret(9, 3, 6, 1, F[3]);
    px.ret(15, 3, 3, 3, PAL.pele[3]); px.ret(18, 5, 3, 2, F[1]);
    px.ret(1, 5, 2, 1, PAL.couro[1]);
    px.linha(4, 7, 16, 8, function (t) { return t < 0.4 ? PAL.madeira[3] : PAL.metal[1]; });
    return fazer(px, 11, 6);
  }

  // Antônio Conselheiro: alto e magro, camisolão azul até os pés, cordão na
  // cintura, cabelo e barba brancos e longos, bordão e livro. Não carrega arma.
  function conselheiro(f, costas, pose) {
    var px = new Px(30, 42), ox = 9, oy = 8, T = PAL.tunica, B = PAL.branco;
    function P_(x, y, c) { px.p(ox + x, oy + y, c); }
    function R_(x, y, w, h, c) { px.ret(ox + x, oy + y, w, h, c); }
    var andando = pose === 'anda', ph = f / 8 * TAU, passo = andando ? Math.sin(ph) : 0;
    var u = andando ? (Math.abs(passo) < 0.4 ? -1 : 0) : (pose === 'inspira' ? -1 : 0);
    var pf = Math.round(passo * 1.6);
    // alpercatas
    R_(4 - pf, 26, 3, 1, PAL.couro[2]);
    R_(6 + pf, 26, 3, 1, PAL.couro[3]);
    // camisolão, alargando para baixo
    for (var y = 7; y <= 25; y++) {
      var t = (y - 7) / 18, meia = 2 + t * 2.3, cx = 6.5 + (y > 20 ? passo * (y - 20) / 5 : 0);
      for (var x = Math.floor(cx - meia); x <= Math.ceil(cx + meia) - 1; x++) {
        var rel = (x - (cx - meia)) / (2 * meia);
        var idx = rel < 0.22 ? 5 : rel < 0.5 ? 4 : rel < 0.8 ? 3 : 2;
        if (y > 13 && (x * 3 + y) % 7 === 0 && rel > 0.25) idx -= 1;
        if (costas && rel < 0.22) idx = 4;
        P_(x, y + (y < 22 ? u : 0), T[idx]);
      }
    }
    // cordão
    R_(4, 14 + u, 5, 1, PAL.algodao[4]);
    P_(7, 15 + u, PAL.algodao[3]); P_(7, 16 + u, PAL.algodao[3]); P_(8, 17 + u, PAL.algodao[2]);
    if (!costas) {
      P_(6, 12 + u, PAL.madeira[5]);
      R_(5, 13 + u, 3, 1, PAL.madeira[4]);
      P_(6, 14 + u, PAL.madeira[5]);
    }
    // cabeça
    if (!costas) {
      R_(4, 0 + u, 4, 1, B[3]); R_(3, 1 + u, 2, 7, B[2]); P_(3, 8 + u, B[1]);   // cabelo caindo atrás
      R_(5, 1 + u, 4, 4, PAL.pele[3]); R_(5, 1 + u, 1, 4, PAL.pele[4]); P_(8, 3 + u, PAL.pele[2]);
      P_(7, 2 + u, PAL.pele[0]); P_(5, 1 + u, B[3]);                               // olho, testa
      R_(5, 5 + u, 4, 2, B[3]); R_(6, 7 + u, 3, 3, B[2]); P_(7, 10 + u, B[1]);  // barba longa
      P_(6, 5 + u, B[4]); P_(8, 5 + u, B[2]);
    } else {
      R_(4, 0 + u, 5, 3, B[3]); R_(4, 3 + u, 5, 6, B[2]); R_(5, 9 + u, 3, 2, B[1]);
      P_(5, 1 + u, B[4]);
    }
    // livro junto ao peito
    if (!costas && pose !== 'prega') { R_(2, 12 + u, 3, 4, PAL.couro[1]); R_(2, 12 + u, 3, 1, PAL.algodao[3]); P_(4, 13 + u, PAL.pele[3]); }
    // bordão
    var bx = 10 + Math.round(passo * 1.2);
    if (pose === 'prega') {
      R_(8, 6 + u, 2, 2, T[3]); P_(10, 5 + u, PAL.pele[4]);
      px.linha(ox + 9, oy + 20, ox + 12, oy - 6 + u, function (t) { return t > 0.9 ? PAL.madeira[5] : PAL.madeira[3]; });
      R_(1, 6 + u, 2, 2, T[4]); P_(0, 5 + u, PAL.pele[4]);
    } else {
      px.linha(ox + bx, oy - 3 + u, ox + bx, oy + 26, function (t) { return t < 0.05 ? PAL.madeira[5] : PAL.madeira[3]; });
      P_(bx - 1, 11 + u, PAL.pele[4]); R_(bx - 2, 10 + u, 1, 2, T[3]);
    }
    return fazer(px, ox + 6.5, oy + 26.5);
  }

  // Defensor conselheirista: chapéu de couro de aba larga, camisa de algodão,
  // gibão de couro. papel 'mira' (o fuzil é desenhado à parte, para virar
  // suave para o alvo) ou 'recarrega' (quadros 0–3).
  function defensor(f, costas, papel) {
    var px = new Px(24, 22), ox = 6, oy = 5;
    function P_(x, y, c) { px.p(ox + x, oy + y, c); }
    function R_(x, y, w, h, c) { px.ret(ox + x, oy + y, w, h, c); }
    R_(2, 6, 6, 6, PAL.algodao[4]); R_(2, 6, 1, 6, PAL.algodao[5]); R_(7, 6, 1, 6, PAL.algodao[2]);
    R_(3, 7, 1, 5, PAL.couro[3]); R_(6, 7, 1, 5, PAL.couro[2]);
    P_(3, 7, PAL.couro[1]); P_(4, 8, PAL.couro[1]); P_(5, 9, PAL.couro[0]); P_(6, 10, PAL.couro[1]);
    R_(2, 12, 6, 2, PAL.algodao[1]);
    if (!costas) { R_(3, 3, 4, 3, PAL.pele[4]); R_(3, 3, 1, 3, PAL.pele[5]); P_(5, 4, PAL.pele[0]); P_(6, 5, PAL.pele[2]); }
    else R_(3, 3, 4, 3, PAL.pele[2]);
    R_(1, 2, 8, 1, PAL.couro[4]); R_(2, 2, 6, 1, PAL.couro[5]);
    R_(3, 0, 4, 2, PAL.couro[3]); R_(3, 0, 2, 1, PAL.couro[5]);
    P_(1, 1, PAL.couro[3]); P_(8, 1, PAL.couro[3]);
    if (papel === 'recarrega') {
      var dy = [0, 1, 2, 1][f];
      px.linha(ox + 7, oy + 13, ox + 8, oy + 2, function (t) { return t < 0.45 ? PAL.madeira[3] : PAL.metal[1]; });
      R_(6, 7 + dy, 2, 1, PAL.pele[4]);
      P_(1, 9 - dy, PAL.pele[4]);
    }
    return fazer(px, ox + 5, oy + 13);
  }

  function cabra(f, pelo, pastando) {
    var px = new Px(16, 12), c = pelo;
    var pf = [0, 1, 0, -1][f % 4];
    px.ret(3, 4, 7, 3, c[2]); px.ret(3, 4, 7, 1, c[3]);
    px.p(2, 3, c[2]); px.p(2, 2, c[3]);
    px.ret(3 + pf, 7, 1, 3, c[1]); px.ret(5 - pf, 7, 1, 3, c[1]); px.ret(8 + pf, 7, 1, 3, c[1]); px.ret(9 - pf, 7, 1, 3, c[2]);
    if (pastando) { px.ret(10, 6, 2, 2, c[3]); px.p(12, 8, c[2]); px.p(10, 5, PAL.galho[2]); }
    else { px.ret(10, 2, 2, 3, c[3]); px.p(12, 3, c[2]); px.p(10, 1, PAL.galho[2]); px.p(11, 0, PAL.galho[2]); px.p(11, 5, c[1]); }
    return fazer(px, 6, 10);
  }

  function galinha(f, c) {
    var px = new Px(8, 8);
    px.ret(2, 3, 3, 2, c[3]); px.p(1, 2, c[2]); px.p(2, 5, PAL.amarelo[1]); px.p(4, 5, PAL.amarelo[1]);
    if (f) { px.p(5, 4, c[3]); px.p(6, 5, PAL.amarelo[2]); px.p(5, 3, PAL.flor[1]); }
    else { px.p(5, 2, c[3]); px.p(6, 2, PAL.amarelo[2]); px.p(5, 1, PAL.flor[1]); }
    return fazer(px, 3, 6);
  }

  function carcara(f) {
    var px = new Px(16, 8), a = [0, 1, 0, -1][f];
    px.ret(6, 3, 4, 2, PAL.couro[1]); px.p(7, 2, PAL.algodao[4]); px.p(8, 2, PAL.galho[1]); px.p(9, 3, PAL.amarelo[2]);
    px.linha(6, 3, 1, 2 + a, PAL.couro[2]); px.linha(9, 3, 14, 2 + a, PAL.couro[2]);
    px.p(1, 2 + a, PAL.algodao[3]); px.p(14, 2 + a, PAL.algodao[3]);
    px.ret(6, 5, 3, 1, PAL.couro[0]);
    return fazer(px, 8, 4);
  }

  function avoante(f) {
    var px = new Px(10, 6), a = [-1, 0, 1][f];
    px.ret(4, 2, 3, 1, PAL.galho[4]); px.p(7, 2, PAL.galho[3]);
    px.linha(4, 2, 1, 2 + a, PAL.galho[5]); px.linha(6, 2, 8, 2 + a, PAL.galho[5]);
    return fazer(px, 5, 3);
  }

  // ───────────────────────── Estruturas ─────────────────────────

  // Trincheira de pedra e terra, aberta atrás. Metade de trás e metade da frente,
  // para os defensores ficarem entre as duas.
  function trincheira(r, parte, progresso) {
    var px = new Px(36, 22), cx = 18, cy = 12, rx = 11.5, ry = 5.8;
    for (var y = 0; y < 22; y++) for (var x = 0; x < 36; x++) {
      var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, e = Math.sqrt(dx * dx + dy * dy);
      if (e > 1 || e < 0.62) continue;
      var frente = y + 0.5 >= cy;
      if ((parte === 'frente') !== frente) continue;
      var ang = Math.atan2(dy, dx), volta = ((ang + TAU * 1.25) % TAU) / TAU;
      if (progresso < 1 && volta > progresso) continue;
      var alt = 3 + Math.floor(hash(x >> 1, y, 5) * 2);
      for (var k = 0; k < alt; k++) {
        var pedraOuTerra = hash(x, y - k, 9) < 0.55;
        var v = 0.22 + (alt - k) * 0.07 + (dx < 0 ? 0.1 : -0.04) + (hash(x, y - k, 3) - 0.5) * 0.18;
        px.p(x, y - k, pedraOuTerra ? tom(PAL.pedra, v, x, y - k) : tom(PAL.terra, v + 0.12, x, y - k));
      }
    }
    return fazer(px, cx, cy);
  }

  // Barricada atravessada na estrada: pedras empilhadas, estacas e galhos de
  // espinho. eixo 'y': atravessa ao longo de y do mundo; dano 0–2.
  function barricada(eixo, dano, sd) {
    var r = semente(sd), px = new Px(46, 32), ox = 23, oy = 22;
    var at = function (u, z) { var p = eixo === 'y' ? q(0, u, z) : q(u, 0, z); return [ox + p[0], oy + p[1]]; };
    var falta = [0, 0.22, 0.45][dano], u, b, k;
    // aterro de terra batida
    for (u = -16; u <= 16; u += 0.6) {
      b = at(u, 0);
      for (k = 0; k < 3; k++) px.p(b[0], b[1] - k, tom(PAL.terra, 0.3 + k * 0.1 + (hash(Math.round(u * 3), k, sd) - 0.5) * 0.15, b[0], b[1] - k));
    }
    // estacas de madeira, cravadas e inclinadas para fora
    for (u = -14; u <= 14; u += 3.4) {
      if (r() < falta) continue;
      b = at(u + (r() - 0.5), 2);
      var inc = eixo === 'y' ? -1 : 1, h = 9 + Math.floor(r() * 3);
      for (k = 0; k < h; k++) { px.p(b[0] + inc * k * 0.35, b[1] - k, PAL.madeira[k === h - 1 ? 5 : 3]); px.p(b[0] + 1 + inc * k * 0.35, b[1] - k, PAL.madeira[1]); }
    }
    // pedras escuras empilhadas
    for (u = -15; u <= 15; u += 2.4) {
      b = at(u, 2);
      var hh = 3 + Math.floor(r() * 2) - dano;
      for (k = 0; k < hh; k++) {
        if (r() < falta * 0.8) continue;
        var tam = 1.3 + r() * 0.8;
        bolha(px, b[0] + (r() - 0.5) * 1.4, b[1] - k * 1.7, tam + 0.4, tam * 0.75, r() < 0.3 ? PAL.taipa : PAL.pedra, { semente: r() * 1e6, deslocar: 0.26 });
      }
    }
    // mais estacas, na frente das pedras
    for (u = -12; u <= 12; u += 6) {
      if (r() < falta) continue;
      b = at(u + 1.5, 4);
      for (k = 0; k < 6; k++) { px.p(b[0] + (eixo === 'y' ? 1 : -1) * k * 0.5, b[1] - k, PAL.madeira[k === 5 ? 5 : 4]); }
    }
    // galhos de espinho por cima
    for (var j = 0; j < 12 - dano * 4; j++) {
      var c = at((r() - 0.5) * 28, 6 - dano + r() * 2);
      var c2 = [c[0] + (r() - 0.5) * 7, c[1] - r() * 3];
      px.linha(c[0], c[1], c2[0], c2[1], PAL.galho[r() < 0.5 ? 2 : 3]);
      px.p(c2[0], c2[1] - 1, PAL.galho[4]);
    }
    return fazer(px, ox, oy);
  }

  // ───────────────────────── Projeção ─────────────────────────

  // aspecto: largura/altura da tela. O mapa cabe inteiro e fica centrado; o que
  // sobra dos lados (ou em cima e embaixo) é sertão em volta.
  function criarProjecao(D, aspecto) {
    var C = D.celula, W = D.colunas, H = D.linhas;
    var mapaL = (W + H) * C * S, mapaA = mapaL / 2;
    var aL0 = Math.round(mapaL + 2 * MARGEM), aA0 = Math.round(TOPO + mapaA + BASE), asp = aspecto || aL0 / aA0;
    var aL = Math.max(aL0, Math.round(aA0 * asp)), aA = Math.max(aA0, Math.round(aL / asp));
    var ox = Math.round((aL - mapaL) / 2) + H * C * S, oy = TOPO + Math.round((aA - aA0) / 2);
    function arte(wx, wy) { return { x: ox + (wx - wy) * S, y: oy + (wx + wy) * S / 2 }; }
    return {
      C: C, W: W, H: H, s: S * ESC, aL: aL, aA: aA, ox: ox, oy: oy,
      L: aL * ESC, A: aA * ESC,
      arte: arte,
      p: function (wx, wy, z) { var a = arte(wx, wy); return { x: a.x * ESC, y: a.y * ESC - (z || 0) }; },
      mundo: function (sx, sy) {
        var X = (sx / ESC - ox) / S, Y = (sy / ESC - oy) * 2 / S;
        return { x: (X + Y) / 2, y: (Y - X) / 2 };
      },
      mundoArte: function (ax, ay) {
        var X = (ax - ox) / S, Y = (ay - oy) * 2 / S;
        return { x: (X + Y) / 2, y: (Y - X) / 2 };
      }
    };
  }

  function dirTela(ang) {
    var c = Math.cos(ang), s = Math.sin(ang);
    return { x: c - s, y: (c + s) / 2 };
  }

  // ───────────────────────── Geografia ─────────────────────────

  function geometria(jogo) {
    var D = jogo.D, C = D.celula, M = jogo.mapa;
    var pts = M.pontos.map(function (p) { return { x: p.x, y: p.y }; });
    var a = pts[0], b = pts[1], dx = a.x - b.x, dy = a.y - b.y, l = Math.hypot(dx, dy) || 1;
    pts.unshift({ x: a.x + dx / l * 1400, y: a.y + dy / l * 1400 });
    var Wm = M.W * C, Hm = M.H * C, AR = D.mapa.arraial, rioX0 = (D.mapa.rio.coluna + 0.5) * C;
    function distEstrada(x, y) {
      var melhor = Infinity, lat = 0;
      for (var i = 1; i < pts.length; i++) {
        var p = pts[i - 1], q2 = pts[i], vx = q2.x - p.x, vy = q2.y - p.y, L2 = vx * vx + vy * vy;
        var t = L2 ? Math.max(0, Math.min(1, ((x - p.x) * vx + (y - p.y) * vy) / L2)) : 0;
        var ex = x - (p.x + vx * t), ey = y - (p.y + vy * t), dd = ex * ex + ey * ey;
        if (dd < melhor) { melhor = dd; var L = Math.sqrt(L2) || 1; lat = (ex * -vy + ey * vx) / L; }
      }
      return { d: Math.sqrt(melhor), lat: lat };
    }
    return {
      pts: pts, distEstrada: distEstrada, Wm: Wm, Hm: Hm,
      ar: { x: AR.x * C, y: AR.y * C, w: AR.w * C, h: AR.h * C },
      rioX: function (y) { return rioX0 + 6 * Math.sin(y / 95) + 3 * Math.sin(y / 41 + 1.3); },
      dentro: function (x, y) { return x >= 0 && y >= 0 && x < Wm && y < Hm; },
      pasto: { x0: Wm + 22, y0: 300, x1: Wm + 112, y1: 560 }
    };
  }

  // ───────────────────────── Catálogo de desenhos ─────────────────────────

  function catalogo() {
    var r = semente(1896), cat = {};
    function n(nome, k, fn) {
      cat[nome] = [];
      for (var i = 0; i < k; i++) cat[nome].push(fn(semente(Math.floor(r() * 1e9))));
    }
    Object.keys(ESP).forEach(function (k) { n(k, k === 'catingueira' || k === 'jurema' ? 8 : 4, function (rr) { return arvore(rr, ESP[k]); }); });
    n('mandacaru', 5, mandacaru);
    n('facheiro', 4, facheiro);
    n('xiquexique', 4, xiquexique);
    n('coroa', 3, coroa);
    n('macambira', 5, macambira);
    n('licuri', 6, licuri);
    n('pedra', 8, function (rr) { return pedra(rr, 2.5 + rr() * 5); });
    n('pedrinha', 6, function (rr) { return pedra(rr, 1.4 + rr() * 1.4); });
    cat.igrejaNova = igrejaNova();
    cat.igrejaVelha = igrejaVelha();
    cat.cruzeiro = cruzeiro();
    cat.cercaX = cerca(semente(7), 60, 'x');
    cat.cercaY = cerca(semente(8), 60, 'y');
    return cat;
  }

  var BONECOS = {};
  function boneco(chave, fn) {
    var b = BONECOS[chave];
    if (!b) { var sp = fn(); b = BONECOS[chave] = { d: sp, e: espelhar(sp) }; }
    return b;
  }

  var PELOS = [
    ['#5a4a3a', '#8a7560', '#e8e0d0', '#f8f4ea'].map(function (h) { return cor(h); }),
    ['#2a2018', '#4a3828', '#7a5a3a', '#a07850'].map(function (h) { return cor(h); }),
    ['#1e1a18', '#2e2824', '#4a423c', '#6a6058'].map(function (h) { return cor(h); }),
    ['#4a3020', '#7a5030', '#b07a48', '#d8a870'].map(function (h) { return cor(h); })
  ];

  // ───────────────────────── Objetos do mapa ─────────────────────────

  function montarObjetos(jogo, P, geo, cat) {
    var D = jogo.D, C = D.celula, M = jogo.mapa, r = semente(1893);
    var din = [], tras = [], frente = [], lajes = [], chamines = [], casas = [];
    function por(sp, wx, wy, o) {
      o = o || {};
      if (o.espelho === undefined ? r() < 0.5 : o.espelho) sp = sp._e || (sp._e = espelhar(sp));
      var a = P.arte(wx, wy);
      var it = { s: sp, x: Math.round(a.x), y: Math.round(a.y), z: wx + wy, bal: o.bal || 0, fase: r() * TAU, wx: wx, wy: wy };
      if (o.sombra !== false) it.sombra = { rx: Math.max(2, sp.w * 0.5), ry: Math.max(1, sp.w * 0.14) };
      if (o.camada) o.camada.push(it);
      else if (!geo.dentro(wx, wy) && geo.distEstrada(wx, wy).d > 90) (wy >= geo.Hm || wx >= geo.Wm ? frente : tras).push(it);
      else din.push(it);
      return it;
    }
    function jit(v) { return (r() - 0.5) * v; }

    // Obstáculos da grade (bloqueiam construção nas regras)
    D.mapa.obstaculos.forEach(function (o) {
      var wx = (o[0] + 0.5) * C, wy = (o[1] + 0.5) * C;
      if (o[2] === 'lajedo') {
        lajes.push({ x: wx + jit(6), y: wy + jit(6), r: 18 + r() * 5, poca: r() < 0.35, sd: Math.floor(r() * 1e6) });
        por(escolha(cat.pedra, r), wx + jit(14), wy + jit(14));
        if (r() < 0.7) por(escolha(cat.xiquexique, r), wx + jit(16), wy + jit(16));
        if (r() < 0.45) por(escolha(cat.coroa, r), wx + jit(18), wy + jit(18));
        if (r() < 0.5) por(escolha(cat.pedrinha, r), wx + jit(20), wy + jit(20));
      } else if (o[2] === 'caatinga') {
        var esp = sortear(r, [['catingueira', 4], ['jurema', 3], ['umbuzeiro', 1.2], ['juazeiro', 1.1], ['favela', 1.4]]);
        por(escolha(cat[esp], r), wx + jit(8), wy + jit(8), { bal: 0.7 });
        por(escolha(cat[r() < 0.5 ? 'macambira' : 'favela'], r), wx + jit(20), wy + jit(20), { bal: 0.5 });
        if (r() < 0.5) por(escolha(cat.jurema, r), wx + jit(22), wy + jit(22), { bal: 0.7 });
      } else {
        por(escolha(cat.mandacaru, r), wx + jit(6), wy + jit(6));
        por(escolha(cat.macambira, r), wx - 10 + jit(4), wy + 8 + jit(4));
        if (r() < 0.6) por(escolha(cat.pedrinha, r), wx + 10, wy - 6);
      }
    });

    // Arraial: praça das igrejas onde a estrada chega, igrejas, cruzeiro e casebres
    var AR = geo.ar, fim = M.pontos[M.pontos.length - 1];
    var praca = { x0: AR.x - 4, y0: fim.y - 34, x1: AR.x + 104, y1: fim.y + 32 };
    var nova = { x0: AR.x + 64, y0: AR.y + 10, x1: AR.x + 120, y1: AR.y + 44 };
    var velha = { x0: AR.x + 110, y0: AR.y + 78, x1: AR.x + 144, y1: AR.y + 102 };
    por(cat.igrejaNova, AR.x + 91, AR.y + 25, { espelho: false });
    por(cat.igrejaVelha, AR.x + 127, AR.y + 90, { espelho: false });
    por(cat.cruzeiro, AR.x + 50, fim.y + 2, { espelho: false, sombra: false });
    function livre(c, folga) {
      var bloqueios = [praca, nova, velha].concat(casas);
      for (var i = 0; i < bloqueios.length; i++) {
        var b = bloqueios[i];
        if (c.x0 < b.x1 + folga && c.x1 + folga > b.x0 && c.y0 < b.y1 + folga && c.y1 + folga > b.y0) return false;
      }
      return true;
    }
    function casebre(x, y, w, d, camada) {
      var c = { x0: x, y0: y, x1: x + w, y1: y + d };
      if (!livre(c, 4)) return;
      casas.push(c);
      var sp = casa(r, { w: w, d: d, alt: 6 + Math.floor(r() * 3), cum: 4 + Math.floor(r() * 3), eixo: w >= d ? 'x' : 'y', telha: r() < 0.3, cal: r() < 0.18, porta: true });
      var it = por(sp, x + w / 2, y + d / 2, { espelho: false, camada: camada });
      if (r() < 0.22) chamines.push(it);
    }
    for (var yy = AR.y + 4; yy < AR.y + AR.h - 10; yy += 21) {
      for (var xx = AR.x + 4 + r() * 4; xx < AR.x + AR.w - 22; xx += 22 + r() * 4) {
        var w = 13 + Math.floor(r() * 5), d = 10 + Math.floor(r() * 4);
        if (r() < 0.4) { var tmp = w; w = d; d = tmp; }
        if (r() < 0.12) continue;
        casebre(xx + jit(3), yy + jit(3), w, d);
      }
    }
    // Belo Monte continua além do recorte do mapa
    for (yy = geo.Hm + 16; yy < geo.Hm + 170; yy += 22) {
      for (xx = AR.x - 90 + r() * 6; xx < AR.x + AR.w + 6; xx += 23 + r() * 5) {
        if (r() < 0.2) continue;
        casebre(xx + jit(4), yy + jit(4), 13 + Math.floor(r() * 5), 10 + Math.floor(r() * 4), frente);
      }
    }
    // cercado das cabras, além do rio
    var PA = geo.pasto;
    por(cat.cercaX, PA.x0 + 30, PA.y0 - 6, { espelho: false, sombra: false, camada: frente });
    por(cat.cercaY, PA.x0 - 6, PA.y0 + 30, { espelho: false, sombra: false, camada: frente });

    // Caatinga em volta: mata branca, com juazeiro e oiticica na beira do rio
    var naCasa = function (x, y) {
      for (var i = 0; i < casas.length; i++) { var c = casas[i]; if (x > c.x0 - 10 && x < c.x1 + 10 && y > c.y0 - 10 && y < c.y1 + 10) return true; }
      return false;
    };
    var lim = [P.mundoArte(0, HORIZONTE), P.mundoArte(P.aL, HORIZONTE), P.mundoArte(0, P.aA + 40), P.mundoArte(P.aL, P.aA + 40)];
    var wx0 = Math.min.apply(null, lim.map(function (q) { return q.x; })) - 60, wx1 = Math.max.apply(null, lim.map(function (q) { return q.x; })) + 60;
    var wy0 = Math.min.apply(null, lim.map(function (q) { return q.y; })) - 60, wy1 = Math.max.apply(null, lim.map(function (q) { return q.y; })) + 60;
    for (var wy = wy0; wy < wy1; wy += 30) {
      for (var wx = wx0; wx < wx1; wx += 30) {
        var jx = wx + jit(26), jy = wy + jit(26);
        if (jx > -14 && jy > -14 && jx < geo.Wm + 14 && jy < geo.Hm + 14) continue;
        var a = P.arte(jx, jy);
        if (a.x < -18 || a.x > P.aL + 18 || a.y < HORIZONTE + 10 || a.y > P.aA + 40) continue;
        if (geo.distEstrada(jx, jy).d < 30) continue;
        var dr = Math.abs(jx - geo.rioX(jy));
        if (dr < 26) continue;
        if (jx > PA.x0 - 16 && jx < PA.x1 + 16 && jy > PA.y0 - 16 && jy < PA.y1 + 16) continue;
        if (naCasa(jx, jy)) continue;
        var dens = fbm(jx / 240, jy / 240, 41, 2), ripario = dr < 80;
        var p = ripario ? 0.5 : 0.1 + dens * 0.4;
        if (a.y < HORIZONTE + 44) p *= 0.6;
        if (r() > p) continue;
        var esp2 = ripario
          ? sortear(r, [['oiticica', 2], ['juazeiro', 2], ['craibeira', 2.2], ['licuri', 1.4], ['catingueira', 1]])
          : sortear(r, [['catingueira', 6], ['jurema', 4.5], ['umbuzeiro', 1.4], ['juazeiro', 0.8], ['licuri', 1.2], ['favela', 2],
              ['mandacaru', 0.28], ['facheiro', 0.18], ['macambira', 2], ['pedra', 1.4], ['xiquexique', 0.3]]);
        por(escolha(cat[esp2], r), jx, jy, { bal: 0.6 });
      }
    }
    // lajedos de fora
    for (var k = 0; k < 16 + Math.round((P.aL * P.aA) / 30000); k++) {
      var lx = wx0 + r() * (wx1 - wx0), ly = wy0 + r() * (wy1 - wy0);
      if (lx > -40 && ly > -40 && lx < geo.Wm + 40 && ly < geo.Hm + 40) continue;
      var la = P.arte(lx, ly);
      if (la.x < 10 || la.x > P.aL - 10 || la.y < HORIZONTE + 40 || la.y > P.aA - 6) continue;
      if (geo.distEstrada(lx, ly).d < 50 || Math.abs(lx - geo.rioX(ly)) < 50 || naCasa(lx, ly)) continue;
      lajes.push({ x: lx, y: ly, r: 20 + r() * 14, poca: r() < 0.4, sd: Math.floor(r() * 1e6) });
      por(escolha(cat.pedra, r), lx + jit(20), ly + jit(20));
      por(escolha(cat.xiquexique, r), lx + jit(24), ly + jit(24));
    }

    var porZ = function (a, b) { return a.z - b.z; };
    din.sort(porZ); tras.sort(porZ); frente.sort(porZ);
    return { din: din, tras: tras, frente: frente, lajes: lajes, chamines: chamines, praca: praca };
  }

  // ───────────────────────── Céu, serras e chão ─────────────────────────

  function pintarCeu(L, A) {
    var px = new Px(L, HORIZONTE + 12);
    var sx = L * 0.15, sy = HORIZONTE - 9;
    for (var y = 0; y < px.h; y++) for (var x = 0; x < L; x++) {
      var v = 0.08 + Math.pow(y / (HORIZONTE + 4), 1.25) * 0.9;
      var c = tom(PAL.ceu, v, x, y);
      var dd = Math.hypot(x - sx, (y - sy) * 1.3);
      if (dd < 34) { var k = Math.pow(1 - dd / 34, 2); c = mistura(c, PAL.amarelo[4], k * 0.55 + (limiar(x, y) < k * 0.4 ? 0.12 : 0)); }
      if (dd < 4.6) c = dd < 3.4 ? PAL.fogo[4] : PAL.amarelo[4];
      px.d[y * L + x] = c;
    }
    return px.paraCanvas();
  }

  function pintarSerras(L) {
    var px = new Px(L, HORIZONTE + 12);
    for (var x = 0; x < L; x++) {
      var longe = HORIZONTE - 2 - 9 * fbm(x / 70, 0.5, 31, 3) - 6 * Math.max(0, Math.sin(x / 120 + 1.2));
      for (var y = Math.floor(longe); y < px.h; y++) {
        px.d[y * L + x] = mistura(tom(PAL.serra, 0.78 + (hash(x, y, 2) - 0.5) * 0.06, x, y), PAL.ceu[5], 0.35);
      }
      var perto = HORIZONTE + 3 - 8 * fbm(x / 38 + 9, 0.5, 37, 3) - 7 * Math.max(0, Math.cos((x - L * 0.62) / 46));
      var dif = (HORIZONTE + 3 - 8 * fbm((x + 1) / 38 + 9, 0.5, 37, 3) - 7 * Math.max(0, Math.cos((x + 1 - L * 0.62) / 46))) - perto;
      for (y = Math.floor(perto); y < px.h; y++) {
        var v = 0.45 + (dif < 0 ? 0.16 : -0.06) - (y - perto) * 0.012 + (hash(x, y, 4) - 0.5) * 0.08;
        px.d[y * L + x] = tom(PAL.serra, v, x, y);
      }
    }
    return px.paraCanvas();
  }

  function pintarChao(jogo, P, geo, obj) {
    var L = P.aL, A = P.aA, px = new Px(L, A), d = px.d, C = jogo.D.celula, AR = geo.ar;
    var lajePorCasa = new Map();
    obj.lajes.forEach(function (l) {
      var cx = Math.floor(l.x / C), cy = Math.floor(l.y / C);
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
        var k = (cx + i) + ',' + (cy + j);
        if (!lajePorCasa.has(k)) lajePorCasa.set(k, []);
        lajePorCasa.get(k).push(l);
      }
    });
    var aguas = [], topoChao = HORIZONTE + 4;
    for (var y = topoChao; y < A; y++) for (var x = 0; x < L; x++) {
      var w = P.mundoArte(x + 0.5, y + 0.5), wx = w.x, wy = w.y;
      var n1 = fbm(wx / 170, wy / 170, 3, 3), n2 = fbm(wx / 30, wy / 30, 7, 3), n3 = hash(x >> 1, y, 11) * 0.6 + hash(x, y, 12) * 0.4;
      var h0 = ruido(wx / 70, wy / 70, 21), h1 = ruido((wx + 7) / 70, wy / 70, 21), h2 = ruido(wx / 70, (wy + 7) / 70, 21);
      var luz = -((h1 - h0) * 1.0 + (h2 - h0) * 0.6) * 2.2;
      var dE = geo.distEstrada(wx, wy), hw = 15 + (ruido(wx / 23, wy / 23, 5) - 0.5) * 5;
      var rc = geo.rioX(wy), dr = Math.abs(wx - rc), leito = 17 + (ruido(wy / 19, 3, 8) - 0.5) * 6;
      var rp = PAL.terra, v, c;
      if (dr < leito) {
        var poca = fbm(wx / 26, wy / 26, 13, 2);
        if (poca > 0.64 && dr < leito - 4) {
          rp = PAL.agua; v = 0.3 + (poca - 0.64) * 2.4 + (n3 - 0.5) * 0.08 - (dr / leito) * 0.15;
          if (n3 < 0.05) aguas.push([x, y]);
        } else if (poca > 0.58 && dr < leito - 2) { rp = PAL.areia; v = 0.18 + n2 * 0.18; }
        else { rp = PAL.areia; v = 0.52 + (n2 - 0.5) * 0.4 + luz + 0.05 * Math.sin((wy + wx * 0.4) / 3.2); }
      } else if (dr < leito + 7) {
        v = 0.3 + (n2 - 0.5) * 0.3 + luz - (leito + 7 - dr) * 0.012;
      } else if (dE.d < hw) {
        var lat = Math.abs(dE.lat);
        v = 0.8 + (n2 - 0.5) * 0.12 + (n3 - 0.5) * 0.06;
        if (Math.abs(lat - 6.5) < 1.2 && n3 > 0.2) v -= 0.12;
        if (dE.d > hw - 2.2) v -= 0.2;
      } else if (wx > AR.x - 8 && wy > AR.y - 8 && wx < AR.x + AR.w + 2 && wy < AR.y + AR.h + 6 && ruido(wx / 9, wy / 9, 2) > 0.2) {
        v = 0.6 + (n2 - 0.5) * 0.2 + (n3 - 0.5) * 0.08;
      } else {
        v = 0.46 + (n1 - 0.5) * 0.26 + (n2 - 0.5) * 0.2 + (n3 - 0.5) * 0.1 + luz;
        if (dE.d < hw + 3) v -= 0.07;
      }
      if (!geo.dentro(wx, wy)) v -= 0.09;
      v += (0.5 - x / L) * 0.08;
      c = rp === PAL.agua ? tom(rp, v, x, y) : tomChapado(rp, v, x, y, 0.34);
      // lajedo de granito por baixo das pedras
      var lista = lajePorCasa.get(Math.floor(wx / C) + ',' + Math.floor(wy / C));
      if (lista) for (var li = 0; li < lista.length; li++) {
        var l = lista[li], ex = (wx - l.x) / l.r, ey = (wy - l.y) / l.r, e = Math.sqrt(ex * ex + ey * ey);
        var borda = 1 + (ruido(wx / 6, wy / 6, l.sd) - 0.5) * 0.45;
        if (e < borda) {
          var vl = 0.5 + (-ex - ey) * 0.18 + (ruido(wx / 5, wy / 5, l.sd + 1) - 0.5) * 0.35 + (n3 - 0.5) * 0.08;
          if (e > borda - 0.14) vl -= 0.18;
          c = tom(PAL.pedra, vl, x, y);
          if (l.poca && e < 0.28) c = tom(PAL.agua, 0.45 + (0.28 - e) * 1.5, x, y);
          if (hash(x, y, l.sd) < 0.015) c = PAL.liquen[Math.floor(hash(y, x, 3) * 3)];
          break;
        } else if (e < borda + 0.1 && ey > 0) { c = mistura(c, CONT, 0.3); }
      }
      if (x < L * 0.55 && rp !== PAL.agua) c = mistura(c, PAL.amarelo[3], (0.55 - x / L) * 0.16);
      // névoa perto do horizonte
      if (y < HORIZONTE + 50) {
        var k = Math.pow(1 - (y - HORIZONTE) / 50, 1.6);
        c = mistura(c, PAL.ceu[5], Math.min(0.85, k * 0.8));
      }
      d[y * L + x] = c;
    }
    // borda irregular do chão contra as serras
    for (x = 0; x < L; x++) {
      var corte = Math.floor(topoChao + ruido(x / 6, 1, 9) * 3);
      for (y = topoChao; y < corte; y++) d[y * L + x] = 0;
    }
    function escurecer(cx, cy, rx, ry) {
      for (var yy = Math.floor(cy - ry); yy <= Math.ceil(cy + ry); yy++) for (var xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) {
        if (xx < 0 || yy < 0 || xx >= L || yy >= A) continue;
        var ex = (xx + 0.5 - cx) / rx, ey = (yy + 0.5 - cy) / ry, e = ex * ex + ey * ey;
        if (e > 1) continue;
        if (e > 0.55 && limiar(xx, yy) > 0.5) continue;
        var i = yy * L + xx;
        if (d[i]) d[i] = mistura(d[i], CONT, 0.3);
      }
    }
    // sombras do que fica de pé (luz da tarde vindo da esquerda)
    [obj.din, obj.tras, obj.frente].forEach(function (lista) {
      lista.forEach(function (it) { if (it.sombra) escurecer(it.x + it.sombra.rx * 0.75, it.y + 0.5, it.sombra.rx, it.sombra.ry); });
    });
    // capim panasco, cascalho e rastros
    var r = semente(1899);
    for (var t = 0; t < 3800; t++) {
      x = Math.floor(r() * L); y = Math.floor(topoChao + 20 + r() * (A - topoChao - 20));
      var w2 = P.mundoArte(x + 0.5, y + 0.5);
      if (geo.distEstrada(w2.x, w2.y).d < 19 || Math.abs(w2.x - geo.rioX(w2.y)) < 26) continue;
      if (w2.x > AR.x - 6 && w2.y > AR.y - 6 && w2.x < AR.x + AR.w && w2.y < AR.y + AR.h) continue;
      if (fbm(w2.x / 45, w2.y / 45, 51, 2) < 0.5) continue;
      var n = 2 + Math.floor(r() * 2);
      for (var bl = 0; bl < n; bl++) {
        var hb = 1 + Math.floor(r() * 2) + (bl === 1 ? 1 : 0), inc = (bl - 1) * 0.35;
        for (var j = 0; j < hb; j++) px.p(x + bl - 1 + inc * j, y - j, PAL.capim[Math.min(4, 1 + j + (r() < 0.25 ? 1 : 0))]);
      }
      px.p(x, y + 1, mistura(px.g(x, y + 1) || PAL.terra[3], CONT, 0.3));
    }
    for (t = 0; t < 900; t++) {
      x = Math.floor(r() * L); y = Math.floor(topoChao + 16 + r() * (A - topoChao - 16));
      if (!d[y * L + x]) continue;
      px.p(x, y, PAL.pedra[3 + (r() < 0.3 ? 1 : 0)]);
      px.p(x + 1, y + 1, mistura(px.g(x + 1, y + 1) || PAL.terra[3], CONT, 0.35));
    }
    for (t = 0; t < 1400; t++) {
      x = Math.floor(r() * L); y = Math.floor(topoChao + 16 + r() * (A - topoChao - 16));
      var w3 = P.mundoArte(x + 0.5, y + 0.5);
      if (geo.distEstrada(w3.x, w3.y).d > 11) continue;
      px.p(x, y, mistura(px.g(x, y), CONT, 0.22));
    }
    // limite da área jogável, discreto
    var cantos = [P.arte(0, 0), P.arte(geo.Wm, 0), P.arte(geo.Wm, geo.Hm), P.arte(0, geo.Hm)];
    for (var lado = 0; lado < 4; lado++) {
      var a = cantos[lado], b = cantos[(lado + 1) % 4], passos = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (var s = 0; s < passos; s += 1) {
        if (s % 6 > 2) continue;
        var xx = Math.floor(a.x + (b.x - a.x) * s / passos), yy = Math.floor(a.y + (b.y - a.y) * s / passos);
        if (xx >= 0 && yy >= 0 && xx < L && yy < A && d[yy * L + xx]) d[yy * L + xx] = mistura(d[yy * L + xx], PAL.areia[5], 0.32);
      }
    }
    return { cv: px.paraCanvas(), aguas: aguas };
  }

  function pintarCamada(P, lista, base) {
    var cv = document.createElement('canvas');
    cv.width = P.aL; cv.height = P.aA;
    var g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (base) g.drawImage(base, 0, 0);
    lista.forEach(function (it) { g.drawImage(it.s.cv, it.x - Math.round(it.s.ax), it.y - Math.round(it.s.ay)); });
    return cv;
  }

  // ───────────────────────── Cena ─────────────────────────

  var MONTADO = null, CATALOGO = null;
  function montar(jogo, aspecto) {
    var P = criarProjecao(jogo.D, aspecto);
    if (MONTADO && MONTADO.D === jogo.D && MONTADO.P.aL === P.aL && MONTADO.P.aA === P.aA) return MONTADO;
    var geo = geometria(jogo), cat = CATALOGO || (CATALOGO = catalogo());
    var obj = montarObjetos(jogo, P, geo, cat);
    var chao = pintarChao(jogo, P, geo, obj);
    MONTADO = {
      D: jogo.D, P: P, geo: geo, cat: cat, obj: obj,
      ceu: pintarCeu(P.aL), serras: pintarSerras(P.aL),
      fundo: pintarCamada(P, obj.tras, chao.cv), frente: pintarCamada(P, obj.frente), aguas: chao.aguas,
      nuvem: nuvemCeu(), sombraNuvem: sombraNuvem(), sombraPe: sombraOval(5, 2), sombraCarcara: sombraOval(5, 2)
    };
    return MONTADO;
  }

  function nuvemCeu() {
    var px = new Px(44, 14), r = semente(5);
    for (var k = 0; k < 6; k++) bolha(px, 8 + k * 5.5 + (r() - 0.5) * 3, 9 - r() * 3, 5 + r() * 3, 3.4 + r() * 1.5, [PAL.ceu[4], PAL.ceu[5], PAL.branco[3], PAL.branco[4]], { semente: k * 7 });
    for (var x = 0; x < 44; x++) for (var y = 11; y < 14; y++) px.d[y * 44 + x] = 0;
    return fazer(px, 22, 11, true);
  }
  function sombraNuvem() {
    var px = new Px(120, 50), sombra = comAlfa(CONT, 255);
    for (var y = 0; y < 50; y++) for (var x = 0; x < 120; x++) {
      var e = Math.pow((x - 60) / 58, 2) + Math.pow((y - 25) / 23, 2) + (ruido(x / 9, y / 9, 3) - 0.5) * 0.6;
      if (e < 1 && limiar(x, y) < 0.5) px.d[y * 120 + x] = sombra;
    }
    return fazer(px, 60, 25, true);
  }
  function sombraOval(rx, ry) {
    var px = new Px(rx * 2 + 2, ry * 2 + 2), sombra = comAlfa(CONT, 120);
    for (var y = 0; y < px.h; y++) for (var x = 0; x < px.w; x++) {
      var e = Math.pow((x + 0.5 - px.w / 2) / rx, 2) + Math.pow((y + 0.5 - px.h / 2) / ry, 2);
      if (e < 0.6 || (e < 1 && limiar(x, y) < 0.5)) px.d[y * px.w + x] = sombra;
    }
    return fazer(px, px.w / 2, px.h / 2, true);
  }

  function novoAmbiente(K) {
    var r = semente(42), PA = K.geo.pasto, pr = K.obj.praca, P = K.P;
    function ponto(z) { return { x: z.x0 + 10 + r() * (z.x1 - z.x0 - 20), y: z.y0 + 10 + r() * (z.y1 - z.y0 - 20) }; }
    var cabras = [], galinhas = [], i;
    for (i = 0; i < 4; i++) { var c = ponto(PA); cabras.push({ x: c.x, y: c.y, alvo: ponto(PA), espera: r() * 4, pelo: i % PELOS.length, odo: 0, dir: 1, zona: PA }); }
    var zg = { x0: pr.x0 + 10, y0: pr.y0 + 6, x1: pr.x1 - 30, y1: pr.y1 - 6 };
    for (i = 0; i < 4; i++) { var g = ponto(zg); galinhas.push({ x: g.x, y: g.y, alvo: null, espera: r() * 2, pelo: i % 2 ? 0 : 3, dir: 1, zona: zg, bica: 0 }); }
    return {
      t: 0, r: r, fumaca: [], relogio: 0, cabras: cabras, galinhas: galinhas, brilho: [],
      nuvens: [0, 1, 2].map(function (k) { return { x: r() * P.aL, y: HORIZONTE + 60 + r() * (P.aA - HORIZONTE - 100), v: 2.5 + r() * 1.5 }; }),
      nuvensCeu: [0, 1, 2].map(function (k) { return { x: r() * P.aL, y: 6 + r() * 10, v: 1 + r() * 1.2 }; }),
      carcara: { a: r() * TAU, cx: P.aL * 0.5, cy: P.aA * 0.5, rx: 170, ry: 70 },
      revoada: null, proxRevoada: 10 + r() * 15, redemoinho: null, proxRedemoinho: 14 + r() * 20, centelhas: [],
      poeira: (function () {
        var p = [];
        for (var pi = 0; pi < 28; pi++) {
          p.push({
            x: r() * P.aL,
            y: HORIZONTE + 10 + r() * (P.aA - HORIZONTE - 20),
            vx: 8 + r() * 14,
            vy: 1.5 + r() * 3,
            tam: r() < 0.25 ? 2 : 1,
            cor: r() < 0.4 ? '#c9922c' : r() < 0.7 ? '#dbbc9a' : '#a87e5c',
            fase: r() * TAU
          });
        }
        return p;
      })()
    };
  }

  function criarCena(jogo, dpr, aspecto) {
    var K = montar(jogo, aspecto);
    return { P: K.P, k: K, amb: novoAmbiente(K), buf: null, ov: null, ultimo: 0 };
  }

  // ───────────────────────── Vida do lugar ─────────────────────────

  function andarAte(b, dt, vel) {
    var dx = b.alvo.x - b.x, dy = b.alvo.y - b.y, l = Math.hypot(dx, dy);
    if (l < 1) return true;
    var passo = Math.min(l, vel * dt);
    b.x += dx / l * passo; b.y += dy / l * passo; b.odo = (b.odo || 0) + passo;
    var dtl = dirTela(Math.atan2(dy, dx));
    b.dir = dtl.x < 0 ? -1 : 1;
    return false;
  }

  function atualizarAmbiente(cena, jogo, dt, calmo) {
    var A = cena.amb, K = cena.k, P = K.P, r = A.r;
    if (calmo) dt = 0;
    A.cabras.forEach(function (c) {
      if (c.espera > 0) { c.espera -= dt; return; }
      if (andarAte(c, dt, 7)) { c.espera = 2 + r() * 6; c.alvo = { x: c.zona.x0 + 10 + r() * (c.zona.x1 - c.zona.x0 - 20), y: c.zona.y0 + 10 + r() * (c.zona.y1 - c.zona.y0 - 20) }; }
    });
    A.galinhas.forEach(function (g) {
      if (g.espera > 0) { g.espera -= dt; g.bica = Math.sin(A.t * 9 + g.x) > 0.3 ? 1 : 0; return; }
      if (!g.alvo) g.alvo = { x: Math.max(g.zona.x0, Math.min(g.zona.x1, g.x + (r() - 0.5) * 30)), y: Math.max(g.zona.y0, Math.min(g.zona.y1, g.y + (r() - 0.5) * 30)) };
      g.bica = 0;
      if (andarAte(g, dt, 16)) { g.alvo = null; g.espera = 0.6 + r() * 2.4; }
    });
    // fumaça de fogão a lenha saindo pelo telhado
    A.relogio -= dt;
    if (A.relogio <= 0) {
      A.relogio = 0.32;
      K.obj.chamines.forEach(function (it) {
        if (r() < 0.55) A.fumaca.push({ x: it.x + it.s.chamine[0] + (r() - 0.5) * 2, y: it.y + it.s.chamine[1], vx: 2.2 + r() * 1.4, vy: -4.5 - r() * 1.5, t: 0, dur: 3.6 + r() * 1.6, r0: 0.8, r1: 3.2 + r() });
      });
    }
    for (var i = A.fumaca.length - 1; i >= 0; i--) { var f = A.fumaca[i]; f.t += dt; if (f.t >= f.dur) A.fumaca.splice(i, 1); }
    A.nuvens.forEach(function (n) { n.x += n.v * dt; n.y += n.v * 0.3 * dt; if (n.x > P.aL + 80) { n.x = -80; n.y = HORIZONTE + 60 + r() * (P.aA - HORIZONTE - 100); } });
    A.nuvensCeu.forEach(function (n) { n.x += n.v * dt; if (n.x > P.aL + 30) { n.x = -30; n.y = 6 + r() * 10; } });
    A.carcara.a += dt * 0.11;
    if (A.poeira && !calmo) {
      A.poeira.forEach(function (p) {
        p.x += p.vx * dt;
        p.y += (p.vy + Math.sin(A.t * 2.2 + p.fase) * 2) * dt;
        if (p.x > P.aL + 12) { p.x = -12; p.y = HORIZONTE + 10 + r() * (P.aA - HORIZONTE - 20); }
        if (p.y > P.aA + 12) p.y = HORIZONTE + 10;
      });
    }
    // revoada de avoantes, de vez em quando
    A.proxRevoada -= dt;
    if (!A.revoada && A.proxRevoada <= 0) {
      var y0 = HORIZONTE + 20 + r() * 120;
      A.revoada = { aves: [0, 1, 2, 3, 4, 5, 6].map(function (k) { return { dx: -k * 7 - r() * 4, dy: (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 4 + (r() - 0.5) * 3, f: r() * 3 }; }), x: -20, y: y0 };
    }
    if (A.revoada) {
      A.revoada.x += 30 * dt;
      if (A.revoada.x > P.aL + 80) { A.revoada = null; A.proxRevoada = 25 + r() * 30; }
    }
    // redemoinho de poeira cruzando a caatinga
    A.proxRedemoinho -= dt;
    if (!A.redemoinho && A.proxRedemoinho <= 0) {
      A.redemoinho = { x: 40 + r() * (P.aL - 80), y: HORIZONTE + 80 + r() * (P.aA - HORIZONTE - 120), t: 0, dur: 9, vx: (r() - 0.5) * 10, vy: (r() - 0.5) * 4 };
    }
    if (A.redemoinho) {
      var R = A.redemoinho; R.t += dt; R.x += R.vx * dt; R.y += R.vy * dt;
      if (R.t >= R.dur) { A.redemoinho = null; A.proxRedemoinho = 30 + r() * 30; }
    }
    // centelhas douradas da prédica
    var ca = jogo.s.campeao;
    if (ca && ca.predica > 0 && dt > 0 && r() < 0.6) {
      var a = P.arte(ca.x, ca.y);
      A.centelhas.push({ x: a.x + (r() - 0.5) * 14, y: a.y - r() * 6, vy: -9 - r() * 6, t: 0, dur: 1 + r() * 0.6 });
    }
    for (i = A.centelhas.length - 1; i >= 0; i--) { var c2 = A.centelhas[i]; c2.t += dt; if (c2.t >= c2.dur) A.centelhas.splice(i, 1); }
  }

  // ───────────────────────── Camada do chão (marcações) ─────────────────────────

  function Camada(w, h) {
    this.w = w; this.h = h;
    this.cv = document.createElement('canvas'); this.cv.width = w; this.cv.height = h;
    this.g = this.cv.getContext('2d');
    this.img = this.g.createImageData(w, h);
    this.d = new Uint32Array(this.img.data.buffer);
    this.usada = false;
  }
  Camada.prototype.limpar = function () { if (this.usada) this.d.fill(0); this.usada = false; };
  Camada.prototype.p = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.d[y * this.w + x] = c; this.usada = true; }
  };
  Camada.prototype.publicar = function () { this.g.putImageData(this.img, 0, 0); };

  // Elipse isométrica de raio R (mundo): preenchimento pontilhado e borda tracejada.
  function ovElipse(ov, P, wx, wy, R, corP, dens, corB, tracos) {
    var a = P.arte(wx, wy), rx = R * S * Math.SQRT2, ry = rx / 2;
    for (var y = Math.floor(a.y - ry - 1); y <= Math.ceil(a.y + ry + 1); y++) {
      for (var x = Math.floor(a.x - rx - 1); x <= Math.ceil(a.x + rx + 1); x++) {
        var dx = (x + 0.5 - a.x) / rx, dy = (y + 0.5 - a.y) / ry, e = Math.sqrt(dx * dx + dy * dy);
        if (e > 1) continue;
        if (corB && e > 1 - 1.15 / ry) {
          if (!tracos || Math.floor((Math.atan2(dy, dx) + Math.PI) / TAU * tracos) % 2 === 0) ov.p(x, y, corB);
        } else if (corP && limiar(x, y) < dens) ov.p(x, y, corP);
      }
    }
  }
  function ovArco(ov, P, wx, wy, R, fr, corB) {
    var a = P.arte(wx, wy), rx = R * S * Math.SQRT2, ry = rx / 2, n = Math.ceil(rx * 4);
    for (var i = 0; i <= n * fr; i++) {
      var t = -Math.PI / 2 + TAU * i / n;
      ov.p(a.x + Math.cos(t) * rx, a.y + Math.sin(t) * ry, corB);
      ov.p(a.x + Math.cos(t) * rx, a.y + Math.sin(t) * ry + 1, corB);
    }
  }
  function ovCasa(ov, P, cx, cy, corP, dens, corB, tracejar) {
    var C = P.C, a = P.arte((cx + 0.5) * C, (cy + 0.5) * C), hw = C * S, hh = hw / 2;
    for (var y = Math.floor(a.y - hh); y <= Math.ceil(a.y + hh); y++) for (var x = Math.floor(a.x - hw); x <= Math.ceil(a.x + hw); x++) {
      var v = Math.abs(x + 0.5 - a.x) / hw + Math.abs(y + 0.5 - a.y) / hh;
      if (v > 1) continue;
      if (corB && v > 1 - 1.6 / hh) { if (!tracejar || (x >> 1) % 2 === 0) ov.p(x, y, corB); }
      else if (corP && limiar(x, y) < dens) ov.p(x, y, corP);
    }
  }
  function ovLinha(ov, P, x0, y0, x1, y1, c) {
    var a = P.arte(x0, y0), b = P.arte(x1, y1), n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (var i = 0; i <= n; i++) if (i % 4 < 2) ov.p(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, c);
  }

  var OV = {
    ouro: cor('#f0c454', 230), ouroP: cor('#e8b84a', 150), ouroForte: cor('#f8d870', 170),
    alcance: cor('#f6e3b4', 120), alcanceB: cor('#fff2cf', 215), alcanceForte: cor('#ffe9b0', 160),
    bom: cor('#8fd050', 150), bomB: cor('#b8f078', 240), mau: cor('#e05a3c', 150), mauB: cor('#ff7a58', 240),
    valida: cor('#fff0c8', 150), sel: cor('#fffae6', 245), perigo: cor('#d0442c', 150), branco: cor('#fff8e8', 200)
  };

  // ───────────────────────── Efeitos ─────────────────────────

  function novoVisual() {
    var sistema = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return {
      ferramenta: null, hover: null, selecionada: null, mostrarCobertura: false, sempreAlcance: false,
      fx: [], recuo: {}, tremor: {}, angulos: {}, flashArraial: 0, recusa: null,
      menosMovimentoSistema: sistema, menosMovimento: sistema, odo: {},
      rotacaoCamera: 0, zoomCamera: 1.08
    };
  }

  function aleat(a) { return (Math.random() - 0.5) * a; }

  // Eventos do núcleo vêm em px de mundo; os efeitos guardam px lógicos de tela.
  function efeito(vis, ev, P) {
    var s, k;
    switch (ev.tipo) {
      case 'tiro': {
        var a = P.p(ev.x0, ev.y0, 16), b = P.p(ev.x1, ev.y1, 14);
        var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        var mx = a.x + dx / l * 18, my = a.y + dy / l * 18;
        vis.fx.push({ tipo: 'tracante', x0: mx, y0: my, x1: b.x, y1: b.y, t: 0, dur: 0.1 });
        vis.fx.push({ tipo: 'clarao', x: mx, y: my, t: 0, dur: 0.09 });
        for (k = 0; k < 4; k++) {
          vis.fx.push({ tipo: 'fumaca', x: mx + aleat(4), y: my + aleat(4), vx: dx / l * 10 + aleat(10), vy: dy / l * 8 - 9 + aleat(6), r0: 1 + k * 0.4, r1: 3.5 + k, t: 0, dur: 0.9 + k * 0.35 });
        }
        vis.fx.push({ tipo: 'poeira', x: b.x, y: b.y + 12, t: 0, dur: 0.3 });
        vis.recuo[ev.de] = 0.14;
        break;
      }
      case 'abate':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'caido', x: s.x, y: s.y, dx: dirTela(ev.ang).x, t: 0, dur: 3, fundo: true });
        for (k = 0; k < 4; k++) vis.fx.push({ tipo: 'poeira', x: s.x + aleat(18), y: s.y + aleat(6), t: 0, dur: 0.5 + Math.random() * 0.3 });
        if (ev.valor) vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: '#f4d27a', x: s.x, y: s.y - 34, t: 0, dur: 1.1 });
        break;
      case 'golpe':
        s = P.p(ev.x + aleat(16), ev.y + aleat(16), 6);
        vis.fx.push({ tipo: 'poeira', x: s.x, y: s.y, t: 0, dur: 0.45, dourado: ev.firme });
        vis.fx.push({ tipo: 'lasca', x: s.x, y: s.y - 4, vx: aleat(60), vy: -30 - Math.random() * 20, t: 0, dur: 0.6 });
        vis.tremor[ev.id] = 0.16;
        break;
      case 'barricadaCaiu':
        s = P.p(ev.x, ev.y, 10);
        for (k = 0; k < 12; k++) vis.fx.push({ tipo: 'lasca', x: s.x, y: s.y, vx: aleat(110), vy: -30 - Math.random() * 45, t: 0, dur: 0.9, pedra: k % 2 });
        for (k = 0; k < 6; k++) vis.fx.push({ tipo: 'poeira', x: s.x + aleat(30), y: s.y + aleat(10), t: 0, dur: 0.7 + Math.random() * 0.4 });
        vis.fx.push({ tipo: 'texto', txt: 'barricada derrubada', cor: '#ff8a6a', x: s.x, y: s.y - 30, t: 0, dur: 1.6, pequeno: true });
        break;
      case 'chegada':
        s = P.p(ev.x, ev.y, 44);
        vis.flashArraial = 0.7;
        vis.fx.push({ tipo: 'texto', txt: '−' + ev.dano, cor: '#ff7a58', x: s.x, y: s.y, t: 0, dur: 1.4, grande: true });
        break;
      case 'construiu':
      case 'desmontou':
        for (k = 0; k < 5; k++) {
          s = P.p(ev.x + aleat(24), ev.y + aleat(24), 2);
          vis.fx.push({ tipo: 'poeira', x: s.x, y: s.y, t: 0, dur: 0.6 });
        }
        if (ev.tipo === 'desmontou') {
          s = P.p(ev.x, ev.y, 30);
          vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: '#f4d27a', x: s.x, y: s.y, t: 0, dur: 1.1 });
        }
        break;
      case 'pronta':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'anel', x: s.x, y: s.y, t: 0, dur: 0.5 });
        break;
      case 'reparo':
        s = P.p(ev.x, ev.y, 30);
        vis.fx.push({ tipo: 'texto', txt: '+' + ev.valor, cor: '#a8e070', x: s.x, y: s.y, t: 0, dur: 1.3 });
        break;
      case 'mutirao':
      case 'predica':
        s = P.p(ev.x, ev.y);
        vis.fx.push({ tipo: 'onda', x: s.x, y: s.y, rx: ev.raio * P.s * Math.SQRT2, t: 0, dur: 0.9, dourado: ev.tipo === 'predica' });
        s = P.p(ev.x, ev.y, 66);
        vis.fx.push({ tipo: 'texto', txt: ev.tipo === 'predica' ? 'Prédica' : 'Mutirão', cor: '#f8e08f', x: s.x, y: s.y, t: 0, dur: 1.5 });
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

  // ───────────────────────── Pintura no buffer ─────────────────────────

  function pintar(b, m, sp, x, y, alfa) {
    if (alfa !== undefined && alfa < 1) b.globalAlpha = Math.max(0, alfa);
    b.drawImage(sp.cv, Math.round((x - sp.ax) * m), Math.round((y - sp.ay) * m), sp.w * m, sp.h * m);
    if (alfa !== undefined && alfa < 1) b.globalAlpha = 1;
  }
  // Vento: a copa balança mais que o pé, em fatias.
  function pintarBalanco(b, m, sp, x, y, amp) {
    if (!amp) return pintar(b, m, sp, x, y);
    var fat = 3, hF = Math.ceil(sp.h / fat), x0 = Math.round((x - sp.ax) * m), y0 = Math.round((y - sp.ay) * m);
    for (var i = 0; i < fat; i++) {
      var sy = i * hF, sh = Math.min(hF, sp.h - sy);
      if (sh <= 0) break;
      var k = 1 - (sy + sh / 2) / sp.h;
      b.drawImage(sp.cv, 0, sy, sp.w, sh, x0 + Math.round(amp * k * k * m), y0 + sy * m, sp.w * m, sh * m);
    }
  }
  function quadrado(b, m, x, y, c, tam) {
    tam = tam || 1;
    b.fillStyle = c;
    b.fillRect(Math.round(x * m), Math.round(y * m), Math.round(tam * m), Math.round(tam * m));
  }
  var DISCOS = {};
  function disco(raio, tipo) {
    var chave = tipo + raio;
    if (DISCOS[chave]) return DISCOS[chave];
    var rp = tipo === 'fumaca' ? PAL.algodao : tipo === 'ouro' ? PAL.ouro : PAL.terra;
    var px = new Px(raio * 2 + 2, raio * 2 + 2), c = raio + 1;
    for (var y = 0; y < px.h; y++) for (var x = 0; x < px.w; x++) {
      var dx = (x + 0.5 - c) / raio, dy = (y + 0.5 - c) / raio, e = dx * dx + dy * dy;
      if (e > 1) continue;
      var v = tipo === 'fumaca' ? 0.62 - dx * 0.2 - dy * 0.25 : 0.7 - dx * 0.15 - dy * 0.2;
      px.d[y * px.w + x] = tom(rp, v, x, y);
    }
    return (DISCOS[chave] = fazer(px, c, c, true));
  }
  function degrau(a) { return Math.ceil(a * 4) / 4; }

  function barraVida(b, m, x, y, larg, fr, corB) {
    var x0 = Math.round(x - larg / 2);
    b.fillStyle = css(CONT, 0.85);
    b.fillRect((x0 - 1) * m, (y - 1) * m, (larg + 2) * m, 4 * m);
    b.fillStyle = '#5a2a1c';
    b.fillRect(x0 * m, y * m, larg * m, 2 * m);
    b.fillStyle = corB;
    b.fillRect(x0 * m, y * m, Math.round(larg * Math.max(0, fr)) * m, 2 * m);
    b.fillStyle = 'rgba(255,255,255,.25)';
    b.fillRect(x0 * m, y * m, Math.round(larg * Math.max(0, fr)) * m, Math.max(1, Math.round(m / 2)));
  }

  function desenharEfeito(b, m, f) {
    var p = f.t / f.dur, k = m / ESC;
    switch (f.tipo) {
      case 'tracante': {
        var n = Math.ceil(Math.hypot(f.x1 - f.x0, f.y1 - f.y0) / ESC), c = p < 0.5 ? '#fff4c4' : '#fbd06a';
        b.globalAlpha = degrau(1 - p);
        for (var i = 0; i <= n; i++) if (i / n > p * 0.6) quadrado(b, m, (f.x0 + (f.x1 - f.x0) * i / n) / ESC, (f.y0 + (f.y1 - f.y0) * i / n) / ESC, c);
        b.globalAlpha = 1;
        break;
      }
      case 'clarao':
        quadrado(b, m, f.x / ESC - 1, f.y / ESC - 1, '#fff4c4', 2);
        quadrado(b, m, f.x / ESC - 2, f.y / ESC - 0.5, '#fbd06a', 1);
        quadrado(b, m, f.x / ESC + 1, f.y / ESC - 0.5, '#fbd06a', 1);
        quadrado(b, m, f.x / ESC - 0.5, f.y / ESC - 2, '#f09a3e', 1);
        break;
      case 'fumaca': {
        var rr = Math.max(1, Math.round(f.r0 + (f.r1 - f.r0) * Math.sqrt(p)));
        b.globalAlpha = degrau(0.8 * (1 - p));
        pintar(b, m, disco(rr, 'fumaca'), (f.x + f.vx * f.t) / ESC, (f.y + f.vy * f.t) / ESC);
        b.globalAlpha = 1;
        break;
      }
      case 'poeira': {
        var rp2 = Math.max(1, Math.round(1 + p * 3));
        b.globalAlpha = degrau(0.7 * (1 - p));
        pintar(b, m, disco(rp2, f.dourado ? 'ouro' : 'terra'), f.x / ESC, f.y / ESC - p * 4);
        b.globalAlpha = 1;
        break;
      }
      case 'caido': {
        var cd = boneco('caido', soldadoCaido);
        pintar(b, m, f.dx < 0 ? cd.e : cd.d, f.x / ESC, f.y / ESC, degrau(p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4));
        break;
      }
      case 'lasca':
        quadrado(b, m, (f.x + f.vx * f.t) / ESC, (f.y + f.vy * f.t + 90 * f.t * f.t) / ESC, f.pedra ? '#a39b91' : '#916a40', 1);
        break;
      case 'anel':
      case 'onda': {
        var rx = (f.tipo === 'anel' ? 9 + p * 10 : f.rx / ESC * (0.2 + 0.8 * p)), ry = rx / 2, nn = Math.ceil(rx * 3);
        var c2 = f.tipo === 'anel' ? '#fff2cf' : f.dourado ? '#f0c454' : '#a8e070';
        b.globalAlpha = degrau(1 - p);
        for (var j = 0; j < nn; j++) { var t = TAU * j / nn; quadrado(b, m, f.x / ESC + Math.cos(t) * rx, f.y / ESC + Math.sin(t) * ry, c2); }
        b.globalAlpha = 1;
        break;
      }
    }
  }

  // ───────────────────────── Figuras ─────────────────────────

  function orientacao(ang, rotCam) {
    // Ângulo aparente na tela considerando a rotação atual da câmera
    var angTela = ang - (rotCam || 0);
    var d = dirTela(angTela);
    var absX = Math.abs(d.x);
    var dy = d.y;
    var direcao = 'diagonal';

    if (dy > 0.40 && absX < 0.70) {
      direcao = 'frente';  // Descendo diretamente em direção à câmera (Reta 1 e Reta 3)
    } else if (dy < -0.40 && absX < 0.70) {
      direcao = 'costas';  // Subindo a serra / afastando-se da câmera
    } else if (absX > 0.45 && Math.abs(dy) < 0.60) {
      direcao = 'perfil';  // Marchando na horizontal (Reta Central das barricadas)
    } else {
      direcao = dy < 0 ? 'costas' : 'frente';
    }

    return {
      direcao: direcao,
      costas: dy < -0.05,
      esq: d.x < 0,
      d: d
    };
  }

  function desenharSoldado(b, m, x, y, ang, quadro, ataca, tipo, rotCam) {
    var o = orientacao(ang, rotCam);
    var bn = boneco('s' + tipo + '_' + o.direcao + (ataca ? 'g' : 'm') + quadro, function () { return soldado(quadro, o.direcao, ataca, tipo); });
    var sp = boneco('sombraPe', function () { return MONTADO.sombraPe; }).d;
    pintar(b, m, sp, x, y);
    pintar(b, m, o.esq ? bn.e : bn.d, x, y);
  }

  function desenharConselheiro(b, m, x, y, ang, quadro, pose) {
    var o = orientacao(ang);
    var bn = boneco('c' + (o.costas ? 'c' : 'f') + pose + quadro, function () { return conselheiro(quadro, o.costas, pose); });
    pintar(b, m, MONTADO.sombraPe, x, y);
    pintar(b, m, o.esq ? bn.e : bn.d, x, y);
  }

  function desenharAtiradores(b, m, P, e, ang, alfa, recuo, t) {
    var a = P.arte(e.x, e.y), pronta = e.estado === 'pronta';
    var prog = pronta ? 1 : Math.max(0.15, Math.round(e.progresso * 6) / 6);
    var tras = boneco('trT' + prog, function () { return trincheira(null, 'tras', prog); });
    var fren = boneco('trF' + prog, function () { return trincheira(null, 'frente', prog); });
    pintar(b, m, tras.d, a.x, a.y, alfa);
    if (pronta || e.progresso > 0.5) {
      var o = orientacao(ang), d = o.d, l = Math.hypot(d.x, d.y) || 1, ux = d.x / l, uy = d.y / l;
      var rec = recuo * 1.4;
      // quem recarrega, um pouco atrás
      var fq = Math.floor(t * 3 + e.id) % 4;
      var rc = boneco('dR' + (o.costas ? 'c' : 'f') + fq, function () { return defensor(fq, o.costas, 'recarrega'); });
      pintar(b, m, o.esq ? rc.e : rc.d, a.x + (o.esq ? 4 : -4), a.y - 1, alfa);
      // quem mira, com o fuzil seguindo o alvo
      var bob = Math.sin(t * 2 + e.id) > 0.85 ? -0.4 : 0;
      var mx = a.x + (o.esq ? -3 : 3) - ux * rec, my = a.y + 1 + bob - uy * rec;
      var mi = boneco('dM' + (o.costas ? 'c' : 'f'), function () { return defensor(0, o.costas, 'mira'); });
      pintar(b, m, o.esq ? mi.e : mi.d, mx, my, alfa);
      linhaFuzil(b, m, mx, my - 8, ux, uy, alfa);
    }
    pintar(b, m, fren.d, a.x, a.y, alfa);
  }

  function linhaFuzil(b, m, x, y, ux, uy, alfa) {
    b.globalAlpha = alfa;
    for (var s = 0; s <= 10; s += 0.5) {
      var c = s < 3.5 ? '#ad8656' : s < 9.5 ? '#2d3035' : '#eef0f2';
      quadrado(b, m, x + ux * s, y + uy * s, c);
    }
    quadrado(b, m, x + ux * 1.5 - 0.5, y + uy * 1.5 + 0.5, '#b97f58');
    b.globalAlpha = 1;
  }

  function desenharBarricada(b, m, P, e, alfa, tremor) {
    var a = P.arte(e.x, e.y);
    var eixo = Math.abs(Math.cos(e.angulo)) > 0.5 ? 'y' : 'x';
    var fr = e.vida / (e.vidaMax || 1), dano = fr > 0.66 ? 0 : fr > 0.33 ? 1 : 2;
    var bn = boneco('b' + eixo + dano, function () { return barricada(eixo, dano, 31 + dano); });
    var dx = tremor ? (Math.random() - 0.5) * 1.2 : 0;
    if (e.estado !== 'pronta') {
      var sp = bn.d, h = Math.max(2, Math.round(sp.h * Math.max(0.2, e.progresso || 0)));
      b.globalAlpha = 0.55;
      b.drawImage(sp.cv, 0, sp.h - h, sp.w, h, Math.round((a.x - sp.ax) * m), Math.round((a.y - sp.ay + sp.h - h) * m), sp.w * m, h * m);
      b.globalAlpha = 1;
      return;
    }
    pintar(b, m, bn.d, a.x + dx, a.y, alfa);
  }

  // ───────────────────────── Quadro ─────────────────────────

  function buffer(cena, m) {
    var P = cena.k.P;
    if (!cena.buf || cena.buf.m !== m) {
      var cv = document.createElement('canvas');
      cv.width = P.aL * m; cv.height = P.aA * m;
      cena.buf = { m: m, cv: cv, g: cv.getContext('2d') };
    }
    if (!cena.ov) cena.ov = new Camada(P.aL, P.aA);
    return cena.buf;
  }

  function desenhar(g, jogo, vis, cena, dpr, opc) {
    var K = cena.k, P = K.P, s = jogo.s, D = jogo.D, C = P.C, A = cena.amb;
    var tela = g.canvas;
    var cw = Math.round((tela.clientWidth || P.L) * dpr), chh = Math.round(cw * P.A / P.L);
    if (cw > 0 && (tela.width !== cw || tela.height !== chh)) { tela.width = cw; tela.height = chh; }
    var m = Math.max(2, Math.min(4, Math.ceil(tela.width / P.aL)));
    var B = buffer(cena, m), b = B.g, aL = P.aL, aA = P.aA;

    var agora = performance.now(), dt = cena.ultimo ? Math.min(0.1, (agora - cena.ultimo) / 1000) : 0;
    cena.ultimo = agora;
    var calmo = !!vis.menosMovimento;
    if (!calmo) A.t += dt;
    var t = A.t;
    atualizarAmbiente(cena, jogo, dt, calmo);

    var fim = s.fase === 'vitoria' || s.fase === 'derrota';
    var DC = D.campeao, ca = s.campeao;
    var alcPx = D.estruturas.atiradores.alcance * C;
    var sel = null;
    s.estruturas.forEach(function (e) { if (e.id === vis.selecionada) sel = e; });
    var campeaoSel = vis.selecionada === 'campeao';

    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalAlpha = 1;
    b.globalCompositeOperation = 'source-over';
    b.imageSmoothingEnabled = false;
    var W = aL * m, H = aA * m;

    // ── céu, nuvens, serras (com o tremor do calor) e chão ──
    b.drawImage(K.ceu, 0, 0, aL, K.ceu.height, 0, 0, W, K.ceu.height * m);
    A.nuvensCeu.forEach(function (n) { b.globalAlpha = 0.9; pintar(b, m, K.nuvem, n.x, n.y); b.globalAlpha = 1; });
    var sh = K.serras.height;
    if (calmo) b.drawImage(K.serras, 0, 0, aL, sh, 0, 0, W, sh * m);
    else for (var fy = 0; fy < sh; fy += 2) {
      var off = fy > HORIZONTE - 8 ? Math.round(Math.sin(t * 2.3 + fy * 0.9) * 0.6 * (fy - HORIZONTE + 8) / 10) : 0;
      b.drawImage(K.serras, 0, fy, aL, 2, off, fy * m, W, 2 * m);
    }
    b.drawImage(K.fundo, 0, 0, aL, aA, 0, 0, W, H);

    // sombras de nuvem passando, e a do carcará
    b.globalAlpha = 0.13;
    A.nuvens.forEach(function (n) { pintar(b, m, K.sombraNuvem, n.x, n.y); });
    b.globalAlpha = 1;
    var cc = A.carcara, ccx = cc.cx + Math.cos(cc.a) * cc.rx, ccy = cc.cy + Math.sin(cc.a) * cc.ry;
    b.globalAlpha = 0.5;
    pintar(b, m, K.sombraCarcara, ccx + 10, ccy + 26);
    b.globalAlpha = 1;
    // brilho nas poças
    if (!calmo) K.aguas.forEach(function (p, i) { if (Math.sin(t * 2.2 + i * 2.7) > 0.93) quadrado(b, m, p[0], p[1], '#ecf3ec'); });

    // ── marcações no chão, em px de arte ──
    var ov = cena.ov;
    ov.limpar();
    if (ca) {
      if (ca.predica > 0) ovElipse(ov, P, ca.x, ca.y, DC.predica.raio * C, OV.ouroForte, 0.22 + 0.08 * Math.sin(s.tempo * 6), OV.ouro, 0);
      s.estruturas.forEach(function (bb) { if (bb.tipo === 'barricada' && N.barricadaFirme(jogo, bb)) ovElipse(ov, P, bb.x, bb.y, 22, OV.ouroForte, 0.55, OV.ouro, 0); });
      if (!ca.destino) ovElipse(ov, P, ca.x, ca.y, DC.aura.raio * C, OV.ouroP, campeaoSel ? 0.2 : 0.08, OV.ouro, 28);
      else ovElipse(ov, P, ca.x, ca.y, DC.aura.raio * C, null, 0, OV.ouroP, 28);
      ovElipse(ov, P, ca.x, ca.y, 12, OV.ouroP, 0.5, null);
      if (ca.destino) {
        var trilha = [{ x: ca.x, y: ca.y }].concat(ca.caminho && ca.caminho.length ? ca.caminho : [ca.destino]);
        for (var ti = 1; ti < trilha.length; ti++) ovLinha(ov, P, trilha[ti - 1].x, trilha[ti - 1].y, trilha[ti].x, trilha[ti].y, OV.ouro);
        var dd = P.arte(ca.destino.x, ca.destino.y);
        for (var kx = -3; kx <= 3; kx++) { ov.p(dd.x + kx, dd.y + kx / 2, OV.ouro); ov.p(dd.x + kx, dd.y - kx / 2, OV.ouro); }
      }
      if (campeaoSel) ovElipse(ov, P, ca.x, ca.y, 20, null, 0, OV.sel, 14);
    }
    var destinoCampeao = null;
    if (campeaoSel && !fim && !vis.ferramenta && vis.hover) {
      var hc = vis.hover;
      if (hc.cx >= 0 && hc.cy >= 0 && hc.cx < jogo.mapa.W && hc.cy < jogo.mapa.H && !(hc.cx === ca.cx && hc.cy === ca.cy)) {
        var vm = N.validarMovimento(jogo, hc.cx, hc.cy);
        ovCasa(ov, P, hc.cx, hc.cy, vm.ok ? OV.ouroP : OV.mau, 0.45, vm.ok ? OV.ouro : OV.mauB);
        if (vm.ok) ovElipse(ov, P, (hc.cx + 0.5) * C, (hc.cy + 0.5) * C, DC.aura.raio * C, null, 0, OV.ouroP, 28);
        else if (!N.estruturaEm(jogo, hc.cx, hc.cy)) destinoCampeao = { x: (hc.cx + 0.5) * C, y: (hc.cy + 0.5) * C, motivo: vm.motivo };
      }
    }
    if (vis.ferramenta && !fim) {
      for (var cy = 0; cy < jogo.mapa.H; cy++) for (var cx = 0; cx < jogo.mapa.W; cx++) {
        if (!N.validarTerreno(jogo, vis.ferramenta, cx, cy).ok) continue;
        if (vis.ferramenta === 'barricada') ovCasa(ov, P, cx, cy, null, 0, OV.valida, true);
        else { var cc2 = P.arte((cx + 0.5) * C, (cy + 0.5) * C); ov.p(cc2.x, cc2.y, OV.valida); ov.p(cc2.x - 1, cc2.y, OV.valida); }
      }
    }
    var verTodos = vis.sempreAlcance || vis.mostrarCobertura || vis.ferramenta === 'atiradores' || s.fase === 'derrota';
    s.estruturas.forEach(function (e) {
      if (e.tipo !== 'atiradores') return;
      if (verTodos || e === sel) ovElipse(ov, P, e.x, e.y, alcPx, e === sel ? OV.alcanceForte : OV.alcance, e === sel ? 0.2 : 0.1, OV.alcanceB, 40);
    });
    var descoberto = null;
    if (s.fase === 'derrota' || vis.mostrarCobertura) {
      var cob = N.cobertura(jogo);
      jogo.mapa.estrada.forEach(function (c, i) { if (!cob.coberta[i]) ovCasa(ov, P, c.x, c.y, OV.perigo, 0.5, null); });
      var mt = cob.maiorTrecho;
      if (mt.tamanho >= 3) { var meio = jogo.mapa.estrada[mt.inicio + Math.floor(mt.tamanho / 2)]; descoberto = { x: (meio.x + 0.5) * C, y: (meio.y + 0.5) * C }; }
    }
    var AR = D.mapa.arraial;
    if (vis.flashArraial > 0) {
      var fa = vis.flashArraial / 0.7;
      for (var ay = AR.y; ay < AR.y + AR.h; ay++) for (var ax = AR.x; ax < AR.x + AR.w; ax++) ovCasa(ov, P, ax, ay, OV.perigo, 0.5 * fa, null);
    }
    var gh = null;
    if (!fim && vis.hover && vis.ferramenta) {
      var h = vis.hover;
      if (h.cx >= 0 && h.cy >= 0 && h.cx < jogo.mapa.W && h.cy < jogo.mapa.H) {
        var jaOcupada = !!N.estruturaEm(jogo, h.cx, h.cy);
        var v = jaOcupada ? { ok: false, motivo: 'Casa já ocupada' } : N.validarConstrucao(jogo, vis.ferramenta, h.cx, h.cy);
        var terrenoOk = !jaOcupada && N.validarTerreno(jogo, vis.ferramenta, h.cx, h.cy).ok;
        ovCasa(ov, P, h.cx, h.cy, v.ok ? OV.bom : OV.mau, 0.55, v.ok ? OV.bomB : OV.mauB);
        if (vis.ferramenta === 'atiradores') {
          ovElipse(ov, P, (h.cx + 0.5) * C, (h.cy + 0.5) * C, alcPx, v.ok ? OV.alcanceForte : OV.mau, v.ok ? 0.22 : 0.09, v.ok ? OV.alcanceB : OV.mauB, 40);
        }
        gh = { v: v, terrenoOk: terrenoOk, tipo: vis.ferramenta, cx: h.cx, cy: h.cy, x: (h.cx + 0.5) * C, y: (h.cy + 0.5) * C };
      }
    }
    if (sel) ovElipse(ov, P, sel.x, sel.y, 24, null, 0, OV.sel, 16);
    s.estruturas.forEach(function (e) { if (e.estado === 'construindo') ovArco(ov, P, e.x, e.y, 22, e.progresso, OV.ouro); });
    if (ov.usada) { ov.publicar(); b.drawImage(ov.cv, 0, 0, aL, aA, 0, 0, W, H); }

    // ── o que fica no chão por baixo de todos ──
    vis.fx.forEach(function (f) { if (f.fundo) desenharEfeito(b, m, f); });

    // ── de pé, de trás para a frente ──
    var lista = [];
    K.obj.din.forEach(function (o) { lista.push({ z: o.z, o: o }); });
    A.galinhas.forEach(function (gg) { lista.push({ z: gg.x + gg.y, galinha: gg }); });
    s.estruturas.forEach(function (e) { lista.push({ z: e.x + e.y + 0.5, e: e }); });
    s.inimigos.forEach(function (ini) { var p = N.posicaoInimigo(jogo, ini); lista.push({ z: p.x + p.y, ini: ini, p: p }); });
    if (ca) lista.push({ z: ca.x + ca.y + 0.2, campeao: true });
    lista.sort(function (a2, b2) { return a2.z - b2.z; });

    var vento = calmo ? 0 : 1;
    lista.forEach(function (it) {
      if (it.o) {
        var o = it.o;
        pintarBalanco(b, m, o.s, o.x, o.y, o.bal * vento * Math.sin(t * 1.3 + o.fase + o.x * 0.02));
      } else if (it.galinha) {
        var gl = it.galinha, ga = P.arte(gl.x, gl.y), gb = boneco('gal' + gl.pelo + gl.bica, function () { return galinha(gl.bica, PELOS[gl.pelo]); });
        pintar(b, m, gl.dir < 0 ? gb.e : gb.d, ga.x, ga.y);
      } else if (it.campeao) {
        var odo = vis.odo.campeao || (vis.odo.campeao = { x: ca.x, y: ca.y, d: 0 });
        odo.d += Math.hypot(ca.x - odo.x, ca.y - odo.y); odo.x = ca.x; odo.y = ca.y;
        var cp = P.arte(ca.x, ca.y), pose, qd = 0;
        if (ca.predica > 0) pose = 'prega';
        else if (ca.destino) { pose = 'anda'; qd = Math.floor(odo.d / 3.2) % 8; }
        else pose = Math.sin(t * 1.7) > 0.4 ? 'inspira' : 'parado';
        desenharConselheiro(b, m, cp.x, cp.y, ca.angulo, qd, pose);
      } else if (it.e) {
        var e = it.e, alfa = e.estado === 'pronta' ? 1 : 0.55;
        if (e.tipo === 'barricada') desenharBarricada(b, m, P, e, alfa, !calmo && vis.tremor[e.id] > 0);
        else {
          var atual = vis.angulos[e.id];
          atual = atual === undefined ? e.angulo : atual + angDif(atual, e.angulo) * 0.2;
          vis.angulos[e.id] = atual;
          desenharAtiradores(b, m, P, e, atual, alfa, Math.max(0, vis.recuo[e.id] || 0) / 0.14, s.tempo + t * 0.2);
        }
      } else {
        var sp = P.arte(it.p.x, it.p.y), ataca = it.ini.estado === 'atacando';
        var tipo = it.ini.tipo, passada = tipo === 'batedor' ? 4.6 : tipo === 'sapador' ? 3 : 3.4;
        var quadro = ataca ? Math.floor(s.tempo * 8 + it.ini.id) % 4 : Math.floor(it.ini.d / passada) % 8;
        desenharSoldado(b, m, sp.x, sp.y, it.p.ang, quadro, ataca, tipo, rot);
      }
    });
    if (gh) {
      var falso = { id: 0, x: gh.x, y: gh.y, angulo: 0, vida: 1, vidaMax: 1, estado: 'pronta', progresso: 1 };
      var alfaFantasma = gh.v.ok ? 0.7 : 0.35;
      b.globalAlpha = alfaFantasma;
      if (gh.tipo === 'barricada') {
        var idxEst = jogo.mapa.indice.get(gh.cx + ',' + gh.cy);
        var est = idxEst !== undefined ? jogo.mapa.estrada[idxEst] : null;
        falso.angulo = est ? est.ang : 0;
        desenharBarricada(b, m, P, falso, alfaFantasma, false);
      } else {
        var melhor = null, md = Infinity;
        jogo.mapa.estrada.forEach(function (c) { var q2 = (c.x - gh.cx) * (c.x - gh.cx) + (c.y - gh.cy) * (c.y - gh.cy); if (q2 < md) { md = q2; melhor = c; } });
        if (melhor) falso.angulo = Math.atan2(melhor.y - gh.cy, melhor.x - gh.cx);
        desenharAtiradores(b, m, P, falso, falso.angulo, alfaFantasma, 0, t);
      }
      b.globalAlpha = 1.0;
    }

    // ── o que fica na frente da grade, e os bichos do pasto ──
    b.drawImage(K.frente, 0, 0, aL, aA, 0, 0, W, H);
    A.cabras.forEach(function (c) {
      var a2 = P.arte(c.x, c.y), pastando = c.espera > 0 && Math.sin(t * 0.7 + c.x) > -0.2;
      var q3 = pastando ? Math.floor(t * 2 + c.y) % 2 : Math.floor(c.odo / 2.5) % 4;
      var bn = boneco('cab' + c.pelo + (pastando ? 'p' : 'a') + q3, function () { return cabra(q3, PELOS[c.pelo], pastando); });
      pintar(b, m, K.sombraPe, a2.x, a2.y);
      pintar(b, m, c.dir < 0 ? bn.e : bn.d, a2.x, a2.y);
    });

    // ── fumaça, poeira, centelhas ──
    A.fumaca.forEach(function (f) {
      var p = f.t / f.dur, rr = Math.max(1, Math.round(f.r0 + (f.r1 - f.r0) * Math.sqrt(p)));
      b.globalAlpha = degrau(0.55 * (1 - p) * Math.min(1, p * 6));
      pintar(b, m, disco(rr, 'fumaca'), f.x + f.vx * f.t + Math.sin(f.t * 1.6) * 0.8, f.y + f.vy * f.t);
    });
    b.globalAlpha = 1;
    if (A.redemoinho) {
      var R = A.redemoinho, rp = R.t / R.dur, forca = Math.min(1, rp * 4, (1 - rp) * 4);
      for (var k = 0; k < 26; k++) {
        var hh = (k / 26) * 26, raio = 1.5 + hh * 0.28, ang = t * 7 + k * 1.7;
        b.globalAlpha = degrau(forca * (0.65 - hh / 60));
        quadrado(b, m, R.x + Math.cos(ang) * raio, R.y - hh + Math.sin(ang) * raio * 0.4, k % 3 ? '#cf9156' : '#e0ab6e');
      }
      b.globalAlpha = 1;
    }
    vis.fx.forEach(function (f) { if (!f.fundo) desenharEfeito(b, m, f); });
    A.centelhas.forEach(function (c) {
      var p = c.t / c.dur;
      b.globalAlpha = degrau(1 - p);
      quadrado(b, m, c.x + Math.sin(c.t * 5 + c.x) * 1.5, c.y + c.vy * c.t, p < 0.5 ? '#f8e08f' : '#e7bd4f');
    });
    b.globalAlpha = 1;

    // ── barras de integridade ──
    s.estruturas.forEach(function (e) {
      if (e.tipo !== 'barricada' || e.vida >= e.vidaMax) return;
      var a3 = P.arte(e.x, e.y), fr = e.vida / e.vidaMax;
      barraVida(b, m, a3.x, Math.round(a3.y - 16), 14, fr, fr > 0.5 ? '#c49a5a' : '#e05a3c');
    });
    s.inimigos.forEach(function (ini) {
      if (ini.vida >= ini.vidaMax) return;
      var p = N.posicaoInimigo(jogo, ini), a4 = P.arte(p.x, p.y);
      barraVida(b, m, a4.x, Math.round(a4.y - 25), 10, ini.vida / ini.vidaMax, '#e05a3c');
    });
    var pe = P.arte((AR.x + AR.w) * C, (AR.y + AR.h) * C), frI = s.integridade / D.objetivo.integridade;
    barraVida(b, m, pe.x, Math.round(pe.y + 14), 48, frI, frI > 0.5 ? '#8fc04a' : frI > 0.25 ? '#d9a62a' : '#e05a3c');

    // ── no céu, por cima de tudo ──
    var cq = Math.sin(t * 1.5 + 1) > 0.6 ? Math.floor(t * 8) % 4 : 0;
    var cb = boneco('carc' + cq, function () { return carcara(cq); });
    pintar(b, m, Math.cos(cc.a + Math.PI / 2) < 0 ? cb.e : cb.d, ccx, ccy - 34);
    if (A.revoada) A.revoada.aves.forEach(function (av, i) {
      var fq = Math.floor(t * 9 + av.f) % 3, ab = boneco('ave' + fq, function () { return avoante(fq); });
      pintar(b, m, ab.d, A.revoada.x + av.dx, A.revoada.y + av.dy + Math.sin(t * 2 + i) * 1.5);
    });

    // Poeira e cinzas da Caatinga no vento quente
    if (A.poeira && !calmo) {
      b.save();
      A.poeira.forEach(function (p) {
        b.fillStyle = p.cor;
        b.globalAlpha = 0.4 + Math.sin(t * 3 + p.fase) * 0.22;
        b.fillRect(Math.round(p.x * m), Math.round(p.y * m), p.tam * m, p.tam * m);
      });
      b.restore();
    }

    if (fim || (opc && opc.pausado)) { b.fillStyle = 'rgba(29,18,12,.32)'; b.fillRect(0, 0, W, H); }

    // ── para a tela: redução suave de uma escala inteira com rotação e alinhamento de câmera ──
    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    // Garante matematicamente que o ângulo nunca ultrapasse o limite orbital seguro (-36° a +36°) e NUNCA vire de cabeça para baixo
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.68, Math.min(2.30, (vis && vis.zoomCamera) || 1.08));
    var pitch = Math.max(0.40, Math.min(1.40, (vis && vis.pitchCamera) !== undefined ? vis.pitchCamera : 1.0));

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';

    // ── Fundo Infinito de Segurança da Caatinga (elimina qualquer canto preto/cortado ao girar) ──
    g.fillStyle = '#b78954';
    g.fillRect(0, 0, tela.width, tela.height);

    g.save();
    var k2 = tela.width / P.L;
    g.scale(k2, k2);
    var cx = P.L / 2, cy = P.A / 2;
    var panX = (vis && vis.cameraPanX) || 0;
    var panY = (vis && vis.cameraPanY) || 0;

    g.translate(cx + panX, cy + panY);
    if (rot !== 0) g.rotate(rot);
    g.scale(zoom, zoom * pitch);
    g.translate(-cx, -cy);

    g.drawImage(B.cv, 0, 0, P.L, P.A);

    // ── textos e marcações no mundo ──
    vis.fx.forEach(function (f) {
      if (f.tipo !== 'texto') return;
      var p = f.t / f.dur;
      g.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      textoPixel(g, f.txt, f.x, f.y - (vis.menosMovimento ? 0 : p * 18), f.grande ? 22 : f.pequeno ? 13 : 16, f.cor);
      g.globalAlpha = 1;
    });
    if (descoberto) { var dsp = P.p(descoberto.x, descoberto.y); rotulo(g, P, 'sem cobertura', dsp.x, dsp.y, '#9a2a18'); }
    if (gh && !gh.v.ok) { var gsp = P.p(gh.x, gh.y, 26); rotulo(g, P, gh.v.motivo, gsp.x, gsp.y, '#9a2a18'); }
    if (destinoCampeao) { var dcp = P.p(destinoCampeao.x, destinoCampeao.y, 26); rotulo(g, P, destinoCampeao.motivo, dcp.x, dcp.y, '#9a2a18'); }
    if (vis.recusa) { var rp2 = P.p(vis.recusa.x, vis.recusa.y, 26); rotulo(g, P, vis.recusa.motivo, rp2.x, rp2.y, '#9a2a18'); }
    textoPixel(g, 'BELO MONTE', pe.x * ESC, pe.y * ESC + 22, 15, '#f6e7c4');

    g.restore();

    // ── faixas centradas na tela física (sem girar) ──
    var k2Tela = tela.width / P.L;
    g.setTransform(k2Tela, 0, 0, k2Tela, 0, 0);
    if (s.fase === 'derrota') faixa(g, P, 'O ARRAIAL CAIU');
    else if (s.fase === 'vitoria') faixa(g, P, 'O ARRAIAL RESISTIU');
    else if (opc && opc.pausado) faixa(g, P, 'PAUSADO');
  }

  function angDif(a, b) {
    var d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  function textoPixel(g, txt, x, y, tam, corT) {
    g.font = tam + 'px ' + FONTE;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    var o = Math.max(1.5, tam / 9);
    g.fillStyle = 'rgba(29,18,12,.92)';
    g.fillText(txt, x - o, y); g.fillText(txt, x + o, y); g.fillText(txt, x, y - o); g.fillText(txt, x, y + o);
    g.fillText(txt, x + o, y + o);
    g.fillStyle = corT;
    g.fillText(txt, x, y);
  }

  function rotulo(g, P, txt, x, y, corT) {
    g.save();
    g.font = '14px ' + FONTE;
    var w = Math.ceil(g.measureText(txt).width) + 18, h = 24;
    var bx = Math.round(Math.max(8, Math.min(P.L - w - 8, x - w / 2))), by = Math.round(y - 32);
    if (by < 8) by = Math.round(y + 30);
    by = Math.min(by, P.A - h - 8);
    g.fillStyle = '#1d120c'; g.fillRect(bx - 3, by - 3, w + 6, h + 6);
    g.fillStyle = '#f3e6c6'; g.fillRect(bx, by, w, h);
    g.fillStyle = '#d6bf8e'; g.fillRect(bx, by + h - 3, w, 3);
    g.fillStyle = corT; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(txt, bx + 9, by + h / 2);
    g.restore();
  }

  function faixa(g, P, txt) {
    g.save();
    g.font = '30px ' + FONTE;
    if ('letterSpacing' in g) g.letterSpacing = '3px';
    var w = Math.ceil(g.measureText(txt).width) + 72, x = Math.round((P.L - w) / 2), y = 34, h = 58;
    g.fillStyle = '#1d120c'; g.fillRect(x - 4, y - 4, w + 8, h + 8);
    g.fillStyle = '#5a351c'; g.fillRect(x, y, w, h);
    g.fillStyle = '#784927'; g.fillRect(x, y, w, 6);
    g.fillStyle = '#3d2313'; g.fillRect(x, y + h - 6, w, 6);
    g.fillStyle = '#965e33';
    for (var i = 0; i < w; i += 46) g.fillRect(x + i + 10, y + 16, 22, 3);
    g.fillStyle = '#c9922c'; g.fillRect(x + 8, y + 8, 6, 6); g.fillRect(x + w - 14, y + 8, 6, 6); g.fillRect(x + 8, y + h - 14, 6, 6); g.fillRect(x + w - 14, y + h - 14, 6, 6);
    textoPixel(g, txt, P.L / 2, y + 40, 30, '#f8e7bf');
    g.restore();
  }

  // ───────────────────────── Clique ─────────────────────────

  function celulaNaTela(cena, sx, sy) {
    var w = cena.P.mundo(sx, sy);
    return { cx: Math.floor(w.x / cena.P.C), cy: Math.floor(w.y / cena.P.C) };
  }

  // Figuras sobem acima da própria casa: clicar no desenho também acerta.
  function objetoNaTela(jogo, cena, sx, sy) {
    var P = cena.P, achado = null, z = -Infinity, ca = jogo.s.campeao;
    if (ca) {
      var c = P.p(ca.x, ca.y);
      if (Math.abs(sx - c.x) < 14 && sy > c.y - 62 && sy < c.y + 8) { achado = { campeao: true }; z = ca.x + ca.y; }
    }
    jogo.s.estruturas.forEach(function (e) {
      var a = P.p(e.x, e.y);
      if (Math.abs(sx - a.x) < 26 && sy > a.y - 40 && sy < a.y + 14 && e.x + e.y > z) { z = e.x + e.y; achado = { estrutura: e }; }
    });
    return achado;
  }

  // Retrato do Conselheiro para o painel, com o próprio boneco ampliado.
  function retrato(canvas) {
    var g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    var px = new Px(32, 32);
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) px.d[y * 32 + x] = tom(PAL.ceu, 0.55 + y / 32 * 0.45, x, y);
    for (x = 0; x < 32; x++) for (y = 25 + Math.round(Math.sin(x / 5) * 1.5); y < 32; y++) px.d[y * 32 + x] = tom(PAL.serra, 0.5, x, y);
    var fundo = px.paraCanvas(), sp = conselheiro(0, false, 'parado');
    g.imageSmoothingEnabled = false;
    g.drawImage(fundo, 0, 0, w, h);
    var k = Math.floor(h / 18);
    g.drawImage(sp.cv, Math.round(w / 2 - sp.ax * k + k), Math.round(h * 0.1 - 2 * k), sp.w * k, sp.h * k);
  }

  raiz.CanudosRender = {
    criarCena: criarCena, desenhar: desenhar, novoVisual: novoVisual,
    efeito: efeito, avancarEfeitos: avancarEfeitos,
    celulaNaTela: celulaNaTela, objetoNaTela: objetoNaTela, retrato: retrato,
    // só para testes/visual.html: o cenário montado e o estado do ambiente
    _depurar: function (cena) { return { montado: MONTADO, amb: cena && cena.amb }; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
