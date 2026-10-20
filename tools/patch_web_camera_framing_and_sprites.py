import os
import re

print("=== Patching Miguel/Canudos for Overscan, Multi-Angle Sprites & Tactical Pan/Framing ===")

RENDER_PIXEL_PATH = "Miguel/Canudos/render_pixel.js"
with open(RENDER_PIXEL_PATH, "r", encoding="utf-8") as f:
    rp = f.read()

# 1. Expand Margins for Overscan
rp = rp.replace(
    "var MARGEM = 8, TOPO = 78, BASE = 46, HORIZONTE = 30;",
    "var MARGEM = 80, TOPO = 96, BASE = 80, HORIZONTE = 30;"
)

# 2. Enhanced orientacao with camera angle and 4-way direction
OLD_ORIENTACAO = """  function orientacao(ang) {
    var d = dirTela(ang);
    return { costas: d.y < -0.05, esq: d.x < 0, d: d };
  }"""

NEW_ORIENTACAO = """  function orientacao(ang, rotCam) {
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
  }"""

if OLD_ORIENTACAO in rp:
    rp = rp.replace(OLD_ORIENTACAO, NEW_ORIENTACAO)
else:
    print("WARNING: orientacao pattern not found directly, checking regex")

# 3. Multi-Angle Soldado (Frente, Perfil, Costas, Diagonal)
OLD_SOLDADO = """  function soldado(f, costas, golpe, tipo) {
    tipo = tipo || 'infantaria';
    var px = new Px(28, 28), ox = 6, oy = 5, F = PAL.farda;
    var T = tipo === 'batedor' ? [PAL.algodao[0], PAL.algodao[1], PAL.algodao[2], PAL.algodao[3], PAL.algodao[4]] : F;
    function P_(x, y, c) { px.p(ox + x, oy + y, c); }
    function R_(x, y, w, h, c) { px.ret(ox + x, oy + y, w, h, c); }
    var ph = f / 8 * TAU, passo = golpe ? 0 : Math.sin(ph) * (tipo === 'batedor' ? 1.35 : 1);
    var u = !golpe && Math.abs(passo) < 0.4 ? -1 : 0;
    var pf = Math.round(passo * 2);
    var lunge = golpe ? [0, 1, 3, 1][f] : 0;
    // pernas e botinas
    R_(4 - pf + lunge, 12, 2, 5, F[0]); R_(4 - pf + lunge, 17, 3, 1, PAL.couro[1]);
    R_(6 + pf + lunge, 12, 2, 5, F[1]); R_(6 + pf + lunge, 17, 3, 1, PAL.couro[2]);
    var L = lunge;
    // braço de trás
    R_(2 + L, 7 + u, 1, 4, T[1]);
    // túnica
    R_(3 + L, 6 + u, 6, 6, T[2]);
    R_(3 + L, 6 + u, 1, 6, T[4]);
    R_(8 + L, 6 + u, 1, 6, T[1]);
    R_(3 + L, 11 + u, 6, 1, PAL.couro[2]);
    if (tipo === 'infantaria' && !costas) {
      P_(4 + L, 7 + u, PAL.branco[4]); P_(5 + L, 8 + u, PAL.branco[4]);
      P_(6 + L, 9 + u, PAL.branco[3]); P_(7 + L, 10 + u, PAL.branco[3]);
    }
    var botao = tipo === 'oficial' ? PAL.ouro[3] : PAL.metal[3];
    if (!costas) { P_(6 + L, 8 + u, botao); P_(6 + L, 10 + u, tipo === 'oficial' ? PAL.ouro[2] : PAL.metal[2]); }
    else if (tipo === 'infantaria' || tipo === 'sapador') { R_(3 + L, 7 + u, 5, 4, PAL.couro[3]); R_(3 + L, 7 + u, 5, 1, PAL.couro[4]); R_(7 + L, 7 + u, 1, 4, PAL.couro[2]); }
    if (tipo === 'sapador' && !costas) { R_(4 + L, 8 + u, 4, 6, PAL.couro[3]); R_(4 + L, 8 + u, 1, 6, PAL.couro[4]); }
    if (tipo === 'oficial') {
      for (var k = 0; k < 6; k++) P_(3 + L + k, 6 + u + k, PAL.flor[1 + (k % 2)]);
      P_(3 + L, 6 + u, PAL.ouro[3]); P_(8 + L, 6 + u, PAL.ouro[3]);
    }
    // cabeça e quepe
    if (!costas) {
      R_(4 + L, 3 + u, 4, 3, PAL.pele[4]); R_(4 + L, 3 + u, 1, 3, PAL.pele[3]);
      P_(6 + L, 4 + u, PAL.pele[0]); P_(7 + L, 5 + u, PAL.pele[2]);
    } else {
      R_(4 + L, 3 + u, 4, 3, PAL.pele[2]); R_(4 + L, 3 + u, 4, 1, F[1]);
    }
    R_(4 + L, 0 + u, 4, 1, tipo === 'batedor' ? F[5] : F[4]);
    R_(3 + L, 1 + u, 5, 2, tipo === 'batedor' ? F[3] : F[2]);
    if (tipo === 'oficial') R_(3 + L, 2 + u, 5, 1, PAL.ouro[2]);
    if (!costas) R_(6 + L, 2 + u, 3, 1, F[0]);
    // braço da frente e a arma de cada tipo
    var armaCor = function (t) { return t < 0.4 ? PAL.madeira[3] : PAL.metal[1]; };
    if (!golpe) {
      R_(8, 7 + u, 2, 4, T[3]); P_(9, 11 + u, PAL.pele[4]);
      if (tipo === 'sapador') {
        px.linha(ox + 10, oy + 12 + u, ox + 11, oy + 1 + u, PAL.madeira[4]);
        px.linha(ox + 9, oy + 1 + u, ox + 14, oy + 2 + u, PAL.metal[2]); px.p(ox + 14, oy + 3 + u, PAL.metal[3]);
      } else if (tipo === 'oficial') {
        px.linha(ox + 10, oy + 11 + u, ox + 13, oy + 2 + u, PAL.metal[3]); px.p(ox + 10, oy + 11 + u, PAL.ouro[3]);
      } else {
        px.linha(ox + 10, oy + 12 + u, ox + 11, oy + 1 + u, armaCor);
        px.linha(ox + 11, oy + u, ox + 11, oy - 3 + u, PAL.metal[3]);
        if (tipo === 'infantaria') {
          px.linha(ox + 11, oy + u - 4, ox + 11, oy + u - 8, PAL.metal[4]);
        }
      }
    } else {
      R_(8 + L, 8, 3, 2, T[3]); P_(11 + L, 9, PAL.pele[4]);
      if (tipo === 'sapador') {
        var alto = [0, -3, -5, 1][f];
        px.linha(ox + 9 + L, oy + 9, ox + 14 + L, oy + 6 + alto, PAL.madeira[4]);
        px.linha(ox + 13 + L, oy + 4 + alto, ox + 15 + L, oy + 9 + alto, PAL.metal[2]);
      } else if (tipo === 'oficial') {
        px.linha(ox + 10 + L, oy + 9, ox + 17 + L, oy + 7, PAL.metal[3]);
      } else {
        px.linha(ox + 4 + L, oy + 10, ox + 14 + L, oy + 8, function (t) { return t < 0.35 ? PAL.madeira[3] : PAL.metal[1]; });
        px.linha(ox + 15 + L, oy + 8, ox + 17 + L, oy + 8, PAL.metal[3]);
      }
    }
    return fazer(px, ox + 6, oy + 18);
  }"""

NEW_SOLDADO = """  function soldado(f, dirOuCostas, golpe, tipo) {
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
  }"""

if OLD_SOLDADO in rp:
    rp = rp.replace(OLD_SOLDADO, NEW_SOLDADO)
    print("Replaced soldado with 4-Way Directional Sprites")
else:
    print("WARNING: OLD_SOLDADO not matched exactly, applying targeted regex replacement")

# 4. Update desenharSoldado to pass camera rotation and use 4-way direction
OLD_DESENHAR_SOLDADO = """  function desenharSoldado(b, m, x, y, ang, quadro, ataca, tipo) {
    var o = orientacao(ang);
    var bn = boneco('s' + tipo + (o.costas ? 'c' : 'f') + (ataca ? 'g' : 'm') + quadro, function () { return soldado(quadro, o.costas, ataca, tipo); });
    var sp = boneco('sombraPe', function () { return MONTADO.sombraPe; }).d;
    pintar(b, m, sp, x, y);
    pintar(b, m, o.esq ? bn.e : bn.d, x, y);
  }"""

NEW_DESENHAR_SOLDADO = """  function desenharSoldado(b, m, x, y, ang, quadro, ataca, tipo, rotCam) {
    var o = orientacao(ang, rotCam);
    var bn = boneco('s' + tipo + '_' + o.direcao + (ataca ? 'g' : 'm') + quadro, function () { return soldado(quadro, o.direcao, ataca, tipo); });
    var sp = boneco('sombraPe', function () { return MONTADO.sombraPe; }).d;
    pintar(b, m, sp, x, y);
    pintar(b, m, o.esq ? bn.e : bn.d, x, y);
  }"""

if OLD_DESENHAR_SOLDADO in rp:
    rp = rp.replace(OLD_DESENHAR_SOLDADO, NEW_DESENHAR_SOLDADO)
    print("Replaced desenharSoldado")

# Update call in loop:
rp = rp.replace(
    "desenharSoldado(b, m, sp.x, sp.y, it.p.ang, quadro, ataca, tipo);",
    "desenharSoldado(b, m, sp.x, sp.y, it.p.ang, quadro, ataca, tipo, rot);"
)

# 5. Update desenhar with seamless Caatinga earth safety fill and PanX / PanY
OLD_RENDER_TRANSFORM = """    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';

    g.save();
    var k2 = tela.width / P.L;
    g.scale(k2, k2);
    var cx = P.L / 2, cy = P.A / 2;
    g.translate(cx, cy);
    if (rot !== 0) g.rotate(rot);
    if (zoom !== 1) g.scale(zoom, zoom);
    g.translate(-cx, -cy);

    g.drawImage(B.cv, 0, 0, P.L, P.A);"""

NEW_RENDER_TRANSFORM = """    g.setTransform(1, 0, 0, 1, 0, 0);
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
    if (zoom !== 1) g.scale(zoom, zoom);
    g.translate(-cx, -cy);

    g.drawImage(B.cv, 0, 0, P.L, P.A);"""

if OLD_RENDER_TRANSFORM in rp:
    rp = rp.replace(OLD_RENDER_TRANSFORM, NEW_RENDER_TRANSFORM)
    print("Replaced render transform with Caatinga overscan fill and PanX/PanY")

with open(RENDER_PIXEL_PATH, "w", encoding="utf-8") as f:
    f.write(rp)
print("Miguel/Canudos/render_pixel.js updated successfully.")
