import re
import shutil

# --- 1. Update ui.js ---
with open('Miguel/Canudos/ui.js', 'r', encoding='utf-8') as f:
    ui_content = f.read()

# Update escolherFerramenta to notify and reset hover
old_escolher = """  function escolherFerramenta(tipo) {
    if (fimDeJogo()) return;
    vis.ferramenta = vis.ferramenta === tipo ? null : tipo;
    vis.selecionada = null;
  }"""

new_escolher = """  function escolherFerramenta(tipo) {
    if (fimDeJogo()) return;
    vis.ferramenta = vis.ferramenta === tipo ? null : tipo;
    vis.selecionada = null;
    if (vis.ferramenta) {
      avisar('Modo ' + (tipo === 'atiradores' ? 'Atiradores (60M)' : 'Barricada (25M)') + ': mova o mouse para prévia e alcance');
    }
  }"""

if old_escolher in ui_content:
    ui_content = ui_content.replace(old_escolher, new_escolher)
    print("Updated escolherFerramenta")
else:
    print("Warning: old_escolher not found")

# Update ligarEntrada to include pointermove, pointerup, pointerleave, wheel, and bounded orbital camera
target_entrada = """      vis.selecionada = null;
      vis.hover = toque ? null : c;
    });

    document.querySelectorAll('.ferramenta').forEach(function (b) {
      b.addEventListener('click', function () { escolherFerramenta(b.dataset.tipo); });
    });"""

replacement_entrada = """      vis.selecionada = null;
      vis.hover = toque ? null : c;
    });

    tela.addEventListener('pointermove', function (ev) {
      if (arrastandoCamera) {
        var dx = ev.clientX - camMouseX;
        var dy = ev.clientY - camMouseY;
        var rotAtual = vis.rotacaoCamera !== undefined ? vis.rotacaoCamera : 0;
        // Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
        var novaRot = Math.max(-0.628, Math.min(0.628, rotAtual + dx * 0.0035));
        vis.rotacaoCamera = novaRot;

        // Variação suave de elevação/zoom no eixo vertical (funil)
        var zoomAtual = vis.zoomCamera || 1.15;
        vis.zoomCamera = Math.max(0.85, Math.min(1.7, zoomAtual - dy * 0.002));

        camMouseX = ev.clientX;
        camMouseY = ev.clientY;

        var btc = $('bt-camera');
        if (btc) btc.textContent = '🎥 ' + Math.round(novaRot * 180 / Math.PI) + '°';
        return;
      }

      if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') {
        var p = pontoNaTela(ev);
        var c = R.celulaNaTela(cena, p.x, p.y);
        vis.hover = c;
      }
    });

    tela.addEventListener('pointerup', function (ev) {
      if (arrastandoCamera) {
        arrastandoCamera = false;
        try { tela.releasePointerCapture(ev.pointerId); } catch (e) {}
      }
    });

    tela.addEventListener('pointerleave', function () {
      if (!arrastandoCamera) {
        vis.hover = null;
      }
    });

    tela.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var fator = ev.deltaY < 0 ? 1.08 : 0.92;
      var z = (vis.zoomCamera || 1.15) * fator;
      vis.zoomCamera = Math.max(0.85, Math.min(1.75, z));
    }, { passive: false });

    document.querySelectorAll('.ferramenta').forEach(function (b) {
      b.addEventListener('click', function () { escolherFerramenta(b.dataset.tipo); });
    });"""

if target_entrada in ui_content:
    ui_content = ui_content.replace(target_entrada, replacement_entrada)
    print("Updated pointermove/up/leave/wheel in ui.js")
else:
    print("Warning: target_entrada not found")

# Update bt-camera handler so it never inverts 180
old_btc = """    var btc = $('bt-camera');
    if (btc) {
      btc.addEventListener('click', function () {
        var atual = vis.rotacaoCamera !== undefined ? vis.rotacaoCamera : -0.4636476;
        if (Math.abs(atual - (-0.4636476)) < 0.05) {
          vis.rotacaoCamera = 0;
          vis.zoomCamera = 1.0;
          btc.textContent = '🎥 0° Padrão';
          avisar('Câmera: Isométrica clássica (0°)');
        } else if (Math.abs(atual) < 0.05) {
          vis.rotacaoCamera = Math.PI - 0.4636476;
          vis.zoomCamera = 1.15;
          btc.textContent = '🎥 180° Invertida';
          avisar('Câmera: Vista do Arraial (180°)');
        } else {
          vis.rotacaoCamera = -0.4636476;
          vis.zoomCamera = 1.15;
          btc.textContent = '🎥 Alinhada';
          avisar('Câmera: Alinhada perpendicular à marcha (-26,5°)');
        }
      });
    }"""

new_btc = """    var btc = $('bt-camera');
    if (btc) {
      btc.addEventListener('click', function () {
        var atual = vis.rotacaoCamera !== undefined ? vis.rotacaoCamera : 0;
        if (Math.abs(atual) < 0.08) {
          vis.rotacaoCamera = -0.4636476;
          vis.zoomCamera = 1.15;
          btc.textContent = '🎥 -26,5° Alinhada';
          avisar('Câmera: Alinhada perpendicular à rota (-26,5°)');
        } else if (atual < -0.2) {
          vis.rotacaoCamera = 0.4636476;
          vis.zoomCamera = 1.15;
          btc.textContent = '🎥 +26,5° Flanco';
          avisar('Câmera: Vista do flanco (+26,5°)');
        } else {
          vis.rotacaoCamera = 0;
          vis.zoomCamera = 1.05;
          btc.textContent = '🎥 0° Clássica';
          avisar('Câmera: Isométrica frontal padrão (0°)');
        }
      });
    }"""

if old_btc in ui_content:
    ui_content = ui_content.replace(old_btc, new_btc)
    print("Updated bt-camera in ui.js")
else:
    print("Warning: old_btc not found")

with open('Miguel/Canudos/ui.js', 'w', encoding='utf-8') as f:
    f.write(ui_content)

# --- 2. Update render_pixel.js ---
with open('Miguel/Canudos/render_pixel.js', 'r', encoding='utf-8') as f:
    rp_content = f.read()

# Update initial camera rotation to 0 (default classic view)
rp_content = rp_content.replace("rotacaoCamera: -0.4636476, zoomCamera: 1.15", "rotacaoCamera: 0, zoomCamera: 1.08")

# Update range circle & hover logic
old_hover_block = """    var gh = null;
    if (!fim && vis.hover && vis.ferramenta) {
      var h = vis.hover;
      if (h.cx >= 0 && h.cy >= 0 && h.cx < jogo.mapa.W && h.cy < jogo.mapa.H && !N.estruturaEm(jogo, h.cx, h.cy)) {
        var v = N.validarConstrucao(jogo, vis.ferramenta, h.cx, h.cy);
        var terrenoOk = N.validarTerreno(jogo, vis.ferramenta, h.cx, h.cy).ok;
        ovCasa(ov, P, h.cx, h.cy, v.ok ? OV.bom : OV.mau, 0.5, v.ok ? OV.bomB : OV.mauB);
        if (terrenoOk && vis.ferramenta === 'atiradores') ovElipse(ov, P, (h.cx + 0.5) * C, (h.cy + 0.5) * C, alcPx, OV.alcanceForte, 0.18, OV.alcanceB, 40);
        gh = { v: v, terrenoOk: terrenoOk, tipo: vis.ferramenta, cx: h.cx, cy: h.cy, x: (h.cx + 0.5) * C, y: (h.cy + 0.5) * C };
      }
    }"""

new_hover_block = """    var gh = null;
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
    }"""

if old_hover_block in rp_content:
    rp_content = rp_content.replace(old_hover_block, new_hover_block)
    print("Updated hover & range circle block in render_pixel.js")
else:
    print("Warning: old_hover_block not found")

# Update ghost rendering so it renders ghost with proper alpha
old_ghost_block = """    if (gh && gh.terrenoOk) {
      var falso = { id: 0, x: gh.x, y: gh.y, angulo: 0, vida: 1, vidaMax: 1, estado: 'pronta', progresso: 1 };
      if (gh.tipo === 'barricada') {
        falso.angulo = jogo.mapa.estrada[jogo.mapa.indice.get(gh.cx + ',' + gh.cy)].ang;
        b.globalAlpha = 0.6; desenharBarricada(b, m, P, falso, 0.6, false); b.globalAlpha = 1;
      } else {
        var melhor = null, md = Infinity;
        jogo.mapa.estrada.forEach(function (c) { var q2 = (c.x - gh.cx) * (c.x - gh.cx) + (c.y - gh.cy) * (c.y - gh.cy); if (q2 < md) { md = q2; melhor = c; } });
        if (melhor) falso.angulo = Math.atan2(melhor.y - gh.cy, melhor.x - gh.cx);
        desenharAtiradores(b, m, P, falso, falso.angulo, 0.6, 0, t);
      }
    }"""

new_ghost_block = """    if (gh) {
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
    }"""

if old_ghost_block in rp_content:
    rp_content = rp_content.replace(old_ghost_block, new_ghost_block)
    print("Updated ghost block in render_pixel.js")
else:
    print("Warning: old_ghost_block not found")

# Update camera blit in render_pixel.js so it clamps rotation to [-0.628, 0.628] and never flips upside down
old_blit = """    var rot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : -0.4636476;
    var zoom = (vis && vis.zoomCamera) || 1.15;"""

new_blit = """    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    // Garante matematicamente que o ângulo nunca ultrapasse o limite orbital seguro (-36° a +36°) e NUNCA vire de cabeça para baixo
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.85, Math.min(1.75, (vis && vis.zoomCamera) || 1.08));"""

if old_blit in rp_content:
    rp_content = rp_content.replace(old_blit, new_blit)
    print("Updated camera blit in render_pixel.js")
else:
    print("Warning: old_blit not found")

with open('Miguel/Canudos/render_pixel.js', 'w', encoding='utf-8') as f:
    f.write(rp_content)

# --- 3. Sync to Miguel/Canudos_PC/jogo/ ---
shutil.copy2('Miguel/Canudos/ui.js', 'Miguel/Canudos_PC/jogo/ui.js')
shutil.copy2('Miguel/Canudos/render_pixel.js', 'Miguel/Canudos_PC/jogo/render_pixel.js')
print("Synced to Miguel/Canudos_PC/jogo/")
