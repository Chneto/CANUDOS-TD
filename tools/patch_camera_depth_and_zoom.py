import os

print("=== Patching for Vertical Pitch (Depth Rotation) and Continuous Zoom ===")

# 1. Update Miguel/Canudos/render_pixel.js
RP_PATH = "Miguel/Canudos/render_pixel.js"
with open(RP_PATH, "r", encoding="utf-8") as f:
    rp = f.read()

OLD_RP_TRANSFORM = """    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.85, Math.min(1.75, (vis && vis.zoomCamera) || 1.08));

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
    if (zoom !== 1) g.scale(zoom, zoom);
    g.translate(-cx, -cy);

    g.drawImage(B.cv, 0, 0, P.L, P.A);"""

NEW_RP_TRANSFORM = """    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
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

    g.drawImage(B.cv, 0, 0, P.L, P.A);"""

if OLD_RP_TRANSFORM in rp:
    rp = rp.replace(OLD_RP_TRANSFORM, NEW_RP_TRANSFORM)
    print("Updated render_pixel transform with pitch and continuous zoom")
else:
    print("WARNING: render transform not matched directly in render_pixel.js")

with open(RP_PATH, "w", encoding="utf-8") as f:
    f.write(rp)


# 2. Update Miguel/Canudos/ui.js
UI_PATH = "Miguel/Canudos/ui.js"
with open(UI_PATH, "r", encoding="utf-8") as f:
    ui = f.read()

# Update pontoNaTela
OLD_PONTO = """    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.85, Math.min(1.75, (vis && vis.zoomCamera) || 1.08));
    var cx = cena.P.L / 2;
    var cy = cena.P.A / 2;
    var panX = (vis && vis.cameraPanX) || 0;
    var panY = (vis && vis.cameraPanY) || 0;

    var dx = (sx - (cx + panX)) / zoom;
    var dy = (sy - (cy + panY)) / zoom;"""

NEW_PONTO = """    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.68, Math.min(2.30, (vis && vis.zoomCamera) || 1.08));
    var pitch = Math.max(0.40, Math.min(1.40, (vis && vis.pitchCamera) !== undefined ? vis.pitchCamera : 1.0));
    var cx = cena.P.L / 2;
    var cy = cena.P.A / 2;
    var panX = (vis && vis.cameraPanX) || 0;
    var panY = (vis && vis.cameraPanY) || 0;

    var dx = (sx - (cx + panX)) / zoom;
    var dy = (sy - (cy + panY)) / (zoom * pitch);"""

if OLD_PONTO in ui:
    ui = ui.replace(OLD_PONTO, NEW_PONTO)
    print("Updated pontoNaTela with pitch division")
else:
    print("WARNING: pontoNaTela pattern not matched directly in ui.js")

# Update lerp in quadro
OLD_LERP = """      // Interpolação suave e cinematográfica de câmera (Pan, Zoom, Rotação)
      if (vis.alvoPanX !== undefined) vis.cameraPanX = (vis.cameraPanX || 0) + (vis.alvoPanX - (vis.cameraPanX || 0)) * Math.min(1, dt * 9);
      if (vis.alvoPanY !== undefined) vis.cameraPanY = (vis.cameraPanY || 0) + (vis.alvoPanY - (vis.cameraPanY || 0)) * Math.min(1, dt * 9);
      if (vis.alvoRotacao !== undefined) vis.rotacaoCamera = (vis.rotacaoCamera || 0) + (vis.alvoRotacao - (vis.rotacaoCamera || 0)) * Math.min(1, dt * 7);
      if (vis.alvoZoom !== undefined) vis.zoomCamera = (vis.zoomCamera || 1.08) + (vis.alvoZoom - (vis.zoomCamera || 1.08)) * Math.min(1, dt * 7);"""

NEW_LERP = """      // Interpolação suave e cinematográfica de câmera (Pan, Zoom, Rotação, Profundidade/Pitch)
      if (vis.alvoPanX !== undefined) vis.cameraPanX = (vis.cameraPanX || 0) + (vis.alvoPanX - (vis.cameraPanX || 0)) * Math.min(1, dt * 9);
      if (vis.alvoPanY !== undefined) vis.cameraPanY = (vis.cameraPanY || 0) + (vis.alvoPanY - (vis.cameraPanY || 0)) * Math.min(1, dt * 9);
      if (vis.alvoRotacao !== undefined) vis.rotacaoCamera = (vis.rotacaoCamera || 0) + (vis.alvoRotacao - (vis.rotacaoCamera || 0)) * Math.min(1, dt * 7);
      if (vis.alvoZoom !== undefined) vis.zoomCamera = (vis.zoomCamera || 1.08) + (vis.alvoZoom - (vis.zoomCamera || 1.08)) * Math.min(1, dt * 8);
      if (vis.alvoPitch !== undefined) vis.pitchCamera = (vis.pitchCamera || 1.0) + (vis.alvoPitch - (vis.pitchCamera || 1.0)) * Math.min(1, dt * 8);"""

if OLD_LERP in ui:
    ui = ui.replace(OLD_LERP, NEW_LERP)
    print("Updated quadro with pitch lerp")

# Update focarSetor with pitch values
OLD_FOCAR = """    if (nome === 'geral') {
      vis.alvoPanX = 0;
      vis.alvoPanY = 0;
      vis.alvoRotacao = 0;
      vis.alvoZoom = 1.08;
      avisar('Câmera: Visão Geral de Canudos');
    } else if (nome === 'entrada') {
      // Reta 1: Descida da Serra (norte/oeste do mapa)
      var pE = cena.P.p(1.5 * D.celula, 1.5 * D.celula);
      vis.alvoPanX = cx - pE.x;
      vis.alvoPanY = cy - pE.y + 35;
      vis.alvoRotacao = -0.15;
      vis.alvoZoom = 1.35;
      avisar('Câmera: 1. Entrada da Serra (Descida)');
    } else if (nome === 'reta') {
      // Reta 2: Reta Central das Barricadas (alinhada e paralela à tela)
      var pR = cena.P.p(8.5 * D.celula, 5.5 * D.celula);
      vis.alvoPanX = cx - pR.x;
      vis.alvoPanY = cy - pR.y;
      vis.alvoRotacao = -0.4636; // -26.5° perfeitamente alinhada
      vis.alvoZoom = 1.30;
      avisar('Câmera: 2. Reta Central das Barricadas (Alinhada)');
    } else if (nome === 'igreja') {
      // Reta 3: Arraial e Igreja de Bom Jesus
      var pI = cena.P.p(15.5 * D.celula, 7.5 * D.celula);
      vis.alvoPanX = cx - pI.x;
      vis.alvoPanY = cy - pI.y;
      vis.alvoRotacao = 0;
      vis.alvoZoom = 1.35;
      avisar('Câmera: 3. Igreja de Bom Jesus e Arraial');
    }"""

NEW_FOCAR = """    if (nome === 'geral') {
      vis.alvoPanX = 0;
      vis.alvoPanY = 0;
      vis.alvoRotacao = 0;
      vis.alvoZoom = 1.08;
      vis.alvoPitch = 1.0;
      avisar('Câmera: Visão Geral (45° Isométrica)');
    } else if (nome === 'entrada') {
      var pE = cena.P.p(1.5 * D.celula, 1.5 * D.celula);
      vis.alvoPanX = cx - pE.x;
      vis.alvoPanY = cy - pE.y + 35;
      vis.alvoRotacao = -0.15;
      vis.alvoZoom = 1.35;
      vis.alvoPitch = 0.85;
      avisar('Câmera: 1. Entrada da Serra (Descida)');
    } else if (nome === 'reta') {
      var pR = cena.P.p(8.5 * D.celula, 5.5 * D.celula);
      vis.alvoPanX = cx - pR.x;
      vis.alvoPanY = cy - pR.y;
      vis.alvoRotacao = -0.4636;
      vis.alvoZoom = 1.30;
      vis.alvoPitch = 0.90;
      avisar('Câmera: 2. Reta Central das Barricadas (Alinhada)');
    } else if (nome === 'igreja') {
      var pI = cena.P.p(15.5 * D.celula, 7.5 * D.celula);
      vis.alvoPanX = cx - pI.x;
      vis.alvoPanY = cy - pI.y;
      vis.alvoRotacao = 0;
      vis.alvoZoom = 1.40;
      vis.alvoPitch = 0.70; // Visão rasante imersiva na Igreja
      avisar('Câmera: 3. Igreja de Bom Jesus (Profundidade Rasante)');
    }"""

if OLD_FOCAR in ui:
    ui = ui.replace(OLD_FOCAR, NEW_FOCAR)
    print("Updated focarSetor with cinematic pitch presets")

# Update pointermove for middle mouse drag (horizontal = yaw, vertical = pitch)
OLD_POINTERMOVE_CAM = """      if (arrastandoCamera) {
        var dx = ev.clientX - camMouseX;
        var dy = ev.clientY - camMouseY;
        var rotAtual = vis.rotacaoCamera !== undefined ? vis.rotacaoCamera : 0;
        var novaRot = Math.max(-0.628, Math.min(0.628, rotAtual + dx * 0.0035));
        vis.rotacaoCamera = novaRot;
        vis.alvoRotacao = novaRot;

        var zoomAtual = vis.zoomCamera || 1.08;
        var novoZ = Math.max(0.85, Math.min(1.75, zoomAtual - dy * 0.002));
        vis.zoomCamera = novoZ;
        vis.alvoZoom = novoZ;

        camMouseX = ev.clientX;
        camMouseY = ev.clientY;

        var btc = $('bt-camera');
        if (btc) btc.textContent = '🎥 ' + Math.round(novaRot * 180 / Math.PI) + '°';
        return;
      }"""

NEW_POINTERMOVE_CAM = """      if (arrastandoCamera) {
        var dx = ev.clientX - camMouseX;
        var dy = ev.clientY - camMouseY;

        // Eixo Horizontal (X): Giro Orbital (Yaw) limitado a [-36°, +36°]
        var rotAtual = vis.rotacaoCamera !== undefined ? vis.rotacaoCamera : 0;
        var novaRot = Math.max(-0.628, Math.min(0.628, rotAtual + dx * 0.0035));
        vis.rotacaoCamera = novaRot;
        vis.alvoRotacao = novaRot;

        // Eixo Vertical (Y): Inclinação de Profundidade (Pitch) de 20° a 75° (0.40 a 1.40)
        var pitchAtual = (vis.pitchCamera !== undefined) ? vis.pitchCamera : 1.0;
        var novoPitch = Math.max(0.40, Math.min(1.40, pitchAtual - dy * 0.0035));
        vis.pitchCamera = novoPitch;
        vis.alvoPitch = novoPitch;

        camMouseX = ev.clientX;
        camMouseY = ev.clientY;

        var pitchGraus = Math.round(20 + ((novoPitch - 0.40) / (1.40 - 0.40)) * 55);
        avisar('Câmera: Giro ' + Math.round(novaRot * 180 / Math.PI) + '° · Profundidade ' + pitchGraus + '°');
        return;
      }"""

if OLD_POINTERMOVE_CAM in ui:
    ui = ui.replace(OLD_POINTERMOVE_CAM, NEW_POINTERMOVE_CAM)
    print("Updated pointermove middle drag with Pitch control")

# Update wheel for smooth continuous zoom
OLD_WHEEL = """    tela.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var fator = ev.deltaY < 0 ? 1.08 : 0.92;
      var z = (vis.zoomCamera || 1.15) * fator;
      vis.zoomCamera = Math.max(0.85, Math.min(1.75, z));
    }, { passive: false });"""

NEW_WHEEL = """    tela.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var fator = ev.deltaY < 0 ? 1.09 : 0.91;
      var zAtual = vis.alvoZoom !== undefined ? vis.alvoZoom : (vis.zoomCamera || 1.08);
      var novoZ = Math.max(0.68, Math.min(2.30, zAtual * fator));
      vis.zoomCamera = novoZ;
      vis.alvoZoom = novoZ;
      avisar('Zoom: ' + Math.round(novoZ * 100) + '%');
    }, { passive: false });"""

if OLD_WHEEL in ui:
    ui = ui.replace(OLD_WHEEL, NEW_WHEEL)
    print("Updated wheel with continuous Zoom In/Out")

# Add keyboard zoom and depth keys
OLD_KEYS_PAN = """        if (ev.key === 'd' || ev.key === 'D' || ev.key === 'ArrowRight') {
          vis.alvoPanX = (vis.alvoPanX || 0) - 60;
          return;
        }"""

NEW_KEYS_PAN = """        if (ev.key === 'd' || ev.key === 'D' || ev.key === 'ArrowRight') {
          vis.alvoPanX = (vis.alvoPanX || 0) - 60;
          return;
        }
        if (ev.key === '+' || ev.key === '=' || ev.key === 'PageUp') {
          var z = Math.min(2.30, (vis.alvoZoom || vis.zoomCamera || 1.08) * 1.15);
          vis.alvoZoom = z; vis.zoomCamera = z;
          avisar('Zoom: ' + Math.round(z * 100) + '%');
          return;
        }
        if (ev.key === '-' || ev.key === '_' || ev.key === 'PageDown') {
          var z = Math.max(0.68, (vis.alvoZoom || vis.zoomCamera || 1.08) * 0.85);
          vis.alvoZoom = z; vis.zoomCamera = z;
          avisar('Zoom: ' + Math.round(z * 100) + '%');
          return;
        }
        if (ev.key === 't' || ev.key === 'T') {
          vis.alvoPitch = 1.35; vis.pitchCamera = 1.35;
          avisar('Câmera: Visão Tática de Topo (75°)');
          return;
        }
        if (ev.key === 'y' || ev.key === 'Y') {
          vis.alvoPitch = 0.50; vis.pitchCamera = 0.50;
          avisar('Câmera: Visão Rasante de Profundidade (25°)');
          return;
        }"""

if OLD_KEYS_PAN in ui:
    ui = ui.replace(OLD_KEYS_PAN, NEW_KEYS_PAN)
    print("Added keyboard shortcuts for Zoom (+/-) and Pitch (T/Y)")

with open(UI_PATH, "w", encoding="utf-8") as f:
    f.write(ui)
print("Miguel/Canudos/ui.js updated successfully.")
