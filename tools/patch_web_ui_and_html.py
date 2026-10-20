import os

print("=== Patching Miguel/Canudos/ui.js and index.html for Pan, Framing and HUD ===")

UI_PATH = "Miguel/Canudos/ui.js"
with open(UI_PATH, "r", encoding="utf-8") as f:
    ui = f.read()

# 1. Update pontoNaTela to account for panX and panY
OLD_PONTO = """  function pontoNaTela(ev) {
    var r = tela.getBoundingClientRect();
    var sx = (ev.clientX - r.left) * cena.P.L / r.width;
    var sy = (ev.clientY - r.top) * cena.P.A / r.height;

    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.85, Math.min(1.75, (vis && vis.zoomCamera) || 1.08));
    var cx = cena.P.L / 2;
    var cy = cena.P.A / 2;

    var dx = (sx - cx) / zoom;
    var dy = (sy - cy) / zoom;

    var cos = Math.cos(-rot);
    var sin = Math.sin(-rot);

    return {
      x: cx + (dx * cos - dy * sin),
      y: cy + (dx * sin + dy * cos)
    };
  }"""

NEW_PONTO = """  function pontoNaTela(ev) {
    var r = tela.getBoundingClientRect();
    var sx = (ev.clientX - r.left) * cena.P.L / r.width;
    var sy = (ev.clientY - r.top) * cena.P.A / r.height;

    var rawRot = (vis && vis.rotacaoCamera !== undefined) ? vis.rotacaoCamera : 0;
    var rot = Math.max(-0.628, Math.min(0.628, rawRot));
    var zoom = Math.max(0.85, Math.min(1.75, (vis && vis.zoomCamera) || 1.08));
    var cx = cena.P.L / 2;
    var cy = cena.P.A / 2;
    var panX = (vis && vis.cameraPanX) || 0;
    var panY = (vis && vis.cameraPanY) || 0;

    var dx = (sx - (cx + panX)) / zoom;
    var dy = (sy - (cy + panY)) / zoom;

    var cos = Math.cos(-rot);
    var sin = Math.sin(-rot);

    return {
      x: cx + (dx * cos - dy * sin),
      y: cy + (dx * sin + dy * cos)
    };
  }"""

if OLD_PONTO in ui:
    ui = ui.replace(OLD_PONTO, NEW_PONTO)
    print("Replaced pontoNaTela")

# 2. Add smooth camera interpolation in quadro(agora)
OLD_QUADRO = """    if (naTela === 'jogo') {
      avancar(dt);
      R.desenhar(ctx, jogo, vis, cena, dpr, { pausado: pausado && jogo.s.fase === 'combate' });
      atualizarInterface();
    }"""

NEW_QUADRO = """    if (naTela === 'jogo') {
      avancar(dt);

      // Interpolação suave e cinematográfica de câmera (Pan, Zoom, Rotação)
      if (vis.alvoPanX !== undefined) vis.cameraPanX = (vis.cameraPanX || 0) + (vis.alvoPanX - (vis.cameraPanX || 0)) * Math.min(1, dt * 9);
      if (vis.alvoPanY !== undefined) vis.cameraPanY = (vis.cameraPanY || 0) + (vis.alvoPanY - (vis.cameraPanY || 0)) * Math.min(1, dt * 9);
      if (vis.alvoRotacao !== undefined) vis.rotacaoCamera = (vis.rotacaoCamera || 0) + (vis.alvoRotacao - (vis.rotacaoCamera || 0)) * Math.min(1, dt * 7);
      if (vis.alvoZoom !== undefined) vis.zoomCamera = (vis.zoomCamera || 1.08) + (vis.alvoZoom - (vis.zoomCamera || 1.08)) * Math.min(1, dt * 7);

      R.desenhar(ctx, jogo, vis, cena, dpr, { pausado: pausado && jogo.s.fase === 'combate' });
      atualizarInterface();
    }"""

if OLD_QUADRO in ui:
    ui = ui.replace(OLD_QUADRO, NEW_QUADRO)
    print("Replaced quadro with smooth camera lerp")

# 3. Add focarSetor function and right-drag pan & keyboard navigation
OLD_LIGAR_ENTRADA = """  function ligarEntrada() {
    var arrastandoCamera = false;
    var camMouseX = 0, camMouseY = 0;"""

NEW_LIGAR_ENTRADA = """  function focarSetor(nome) {
    var cx = cena.P.L / 2, cy = cena.P.A / 2;
    document.querySelectorAll('.bt-foco').forEach(function (b) {
      b.classList.toggle('ativo', b.dataset.foco === nome);
    });
    if (nome === 'geral') {
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
    }
    var btc = $('bt-camera');
    if (btc) {
      var rotExib = (vis.alvoRotacao !== undefined ? vis.alvoRotacao : vis.rotacaoCamera || 0);
      btc.textContent = '🎥 ' + (rotExib < -0.3 ? 'Alinhada' : rotExib > 0.3 ? 'Flanco' : 'Clássica');
    }
  }

  function ligarEntrada() {
    var arrastandoCamera = false;
    var camMouseX = 0, camMouseY = 0;
    var arrastandoPan = false;
    var panMouseX = 0, panMouseY = 0;
    var panArrastou = false;"""

if OLD_LIGAR_ENTRADA in ui:
    ui = ui.replace(OLD_LIGAR_ENTRADA, NEW_LIGAR_ENTRADA)
    print("Added focarSetor and pan variables")

# 4. Update pointerdown in ligarEntrada
OLD_POINTERDOWN = """    tela.addEventListener('pointerdown', function (ev) {
      if (ev.button === 1) { // Clique do meio (scroll): rotação livre da câmera 360°
        ev.preventDefault();
        arrastandoCamera = true;
        camMouseX = ev.clientX;
        camMouseY = ev.clientY;
        try { tela.setPointerCapture(ev.pointerId); } catch (e) {}
        return;
      }
      var p = pontoNaTela(ev), c = R.celulaNaTela(cena, p.x, p.y);
      if (ev.button === 2) {
        if (vis.selecionada === 'campeao' && !vis.ferramenta && !fimDeJogo()) mandarAndar(c);
        else cancelar(false);
        return;
      }
      if (ev.button !== 0 || fimDeJogo()) return;"""

NEW_POINTERDOWN = """    tela.addEventListener('pointerdown', function (ev) {
      if (ev.button === 1) { // Clique do meio (scroll): rotação orbital cônica
        ev.preventDefault();
        arrastandoCamera = true;
        camMouseX = ev.clientX;
        camMouseY = ev.clientY;
        try { tela.setPointerCapture(ev.pointerId); } catch (e) {}
        return;
      }
      if (ev.button === 2) { // Botão direito: arrastar para Pan ou clique para cancelar/andar
        ev.preventDefault();
        arrastandoPan = true;
        panMouseX = ev.clientX;
        panMouseY = ev.clientY;
        panArrastou = false;
        try { tela.setPointerCapture(ev.pointerId); } catch (e) {}
        return;
      }
      var p = pontoNaTela(ev), c = R.celulaNaTela(cena, p.x, p.y);
      if (ev.button !== 0 || fimDeJogo()) return;"""

if OLD_POINTERDOWN in ui:
    ui = ui.replace(OLD_POINTERDOWN, NEW_POINTERDOWN)
    print("Updated pointerdown with pan capture")

# 5. Update pointermove and pointerup in ligarEntrada
OLD_POINTERMOVE_UP = """    tela.addEventListener('pointermove', function (ev) {
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
    });"""

NEW_POINTERMOVE_UP = """    tela.addEventListener('pointermove', function (ev) {
      if (arrastandoCamera) {
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
      }

      if (arrastandoPan) {
        var dxPan = ev.clientX - panMouseX;
        var dyPan = ev.clientY - panMouseY;
        if (Math.hypot(dxPan, dyPan) > 3) panArrastou = true;
        vis.cameraPanX = (vis.cameraPanX || 0) + dxPan * 1.3;
        vis.cameraPanY = (vis.cameraPanY || 0) + dyPan * 1.3;
        vis.alvoPanX = vis.cameraPanX;
        vis.alvoPanY = vis.cameraPanY;
        panMouseX = ev.clientX;
        panMouseY = ev.clientY;
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
      if (arrastandoPan) {
        arrastandoPan = false;
        try { tela.releasePointerCapture(ev.pointerId); } catch (e) {}
        if (!panArrastou) {
          // Clique simples com botão direito sem arrasto: executa ação de cancelar ou andar
          var p = pontoNaTela(ev), c = R.celulaNaTela(cena, p.x, p.y);
          if (vis.selecionada === 'campeao' && !vis.ferramenta && !fimDeJogo()) mandarAndar(c);
          else cancelar(false);
        }
      }
    });"""

if OLD_POINTERMOVE_UP in ui:
    ui = ui.replace(OLD_POINTERMOVE_UP, NEW_POINTERMOVE_UP)
    print("Updated pointermove and pointerup with Pan handling")

# 6. Add focus button listeners and keyboard controls
OLD_FOOTER_ATTACH = """    document.querySelectorAll('.ferramenta').forEach(function (b) {
      b.addEventListener('click', function () { escolherFerramenta(b.dataset.tipo); });
    });"""

NEW_FOOTER_ATTACH = """    // Botões de enquadramento rápido nas retas estratégicas do mapa
    document.querySelectorAll('.bt-foco').forEach(function (b) {
      b.addEventListener('click', function () { focarSetor(b.dataset.foco); });
    });

    document.querySelectorAll('.ferramenta').forEach(function (b) {
      b.addEventListener('click', function () { escolherFerramenta(b.dataset.tipo); });
    });"""

if OLD_FOOTER_ATTACH in ui:
    ui = ui.replace(OLD_FOOTER_ATTACH, NEW_FOOTER_ATTACH)
    print("Attached .bt-foco listeners")

# 7. Add keyboard pan support in keydown listener
OLD_KEY_R = """        if (ev.key === 'r' || ev.key === 'R') {
          vis.rotacaoCamera = ev.shiftKey ? 0 : -0.4636;
          vis.zoomCamera = 1.08;
          var btc = $('bt-camera');
          if (btc) btc.textContent = ev.shiftKey ? '🎥 0° Clássica' : '🎥 -26,5° Alinhada';
          avisar('Câmera: ' + (ev.shiftKey ? 'Isométrica 0°' : 'Alinhada -26,5°'));
          return;
        }"""

NEW_KEY_R = """        if (ev.key === 'r' || ev.key === 'R') {
          focarSetor('geral');
          return;
        }
        if (ev.key === '1') { focarSetor('entrada'); return; }
        if (ev.key === '2') { focarSetor('reta'); return; }
        if (ev.key === '3') { focarSetor('igreja'); return; }
        if (ev.key === 'w' || ev.key === 'W' || ev.key === 'ArrowUp') {
          vis.alvoPanY = (vis.alvoPanY || 0) + 60;
          return;
        }
        if (ev.key === 's' || ev.key === 'S' || ev.key === 'ArrowDown') {
          vis.alvoPanY = (vis.alvoPanY || 0) - 60;
          return;
        }
        if (ev.key === 'a' || ev.key === 'A' || ev.key === 'ArrowLeft') {
          vis.alvoPanX = (vis.alvoPanX || 0) + 60;
          return;
        }
        if (ev.key === 'd' || ev.key === 'D' || ev.key === 'ArrowRight') {
          vis.alvoPanX = (vis.alvoPanX || 0) - 60;
          return;
        }"""

if OLD_KEY_R in ui:
    ui = ui.replace(OLD_KEY_R, NEW_KEY_R)
    print("Updated keyboard navigation keys (WASD, Setas, 1, 2, 3)")

with open(UI_PATH, "w", encoding="utf-8") as f:
    f.write(ui)
print("Miguel/Canudos/ui.js patched successfully.")

# 8. Patch Miguel/Canudos/index.html
INDEX_PATH = "Miguel/Canudos/index.html"
with open(INDEX_PATH, "r", encoding="utf-8") as f:
    idx = f.read()

# Add CSS for .foco-setores and .bt-foco
OLD_CSS = """#bt-camera { padding: 5px 8px; font-size: 13px; }
}"""

NEW_CSS = """#bt-camera { padding: 5px 8px; font-size: 13px; }
.foco-setores { display: none; }
}

.foco-setores {
  display: inline-flex;
  gap: 3px;
  background: rgba(29, 18, 12, 0.45);
  border: 1px solid var(--placa-borda);
  border-radius: 4px;
  padding: 2px 3px;
  align-items: center;
}
.bt-foco {
  padding: 4px 7px;
  font-size: 11.5px;
  background: var(--placa);
  color: var(--placa-tinta);
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
}
.bt-foco:hover {
  border-color: var(--ouro);
  color: #fff;
}
.bt-foco.ativo {
  background: var(--ouro);
  color: #1d120c;
  font-weight: bold;
  border-color: var(--ouro-2);
}"""

if OLD_CSS in idx:
    idx = idx.replace(OLD_CSS, NEW_CSS)
    print("Added CSS for .foco-setores and .bt-foco")

# Add HTML buttons in header
OLD_HEADER = """      <button type="button" class="botao-placa" id="bt-camera" title="Girar câmera: clique para alternar ou arraste com o botão do meio do mouse (R restaura)">🎥 Alinhada</button>
      <div class="controle-volume" role="group" aria-label="Ajuste do volume">"""

NEW_HEADER = """      <button type="button" class="botao-placa" id="bt-camera" title="Girar câmera: clique para alternar ou arraste com o botão do meio do mouse (R restaura)">🎥 Alinhada</button>
      <div class="foco-setores" role="group" aria-label="Enquadrar retas da batalha">
        <button type="button" class="bt-foco ativo" data-foco="geral" title="Visão geral do arraial">📍 Geral</button>
        <button type="button" class="bt-foco" data-foco="entrada" title="Foco na 1ª Reta (Descida da Serra)">1. Entrada</button>
        <button type="button" class="bt-foco" data-foco="reta" title="Foco na 2ª Reta (Barricadas)">2. Reta Central</button>
        <button type="button" class="bt-foco" data-foco="igreja" title="Foco na 3ª Reta (Igreja de Belo Monte)">3. Igreja</button>
      </div>
      <div class="controle-volume" role="group" aria-label="Ajuste do volume">"""

if OLD_HEADER in idx:
    idx = idx.replace(OLD_HEADER, NEW_HEADER)
    print("Added focus buttons to index.html header")

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(idx)
print("Miguel/Canudos/index.html patched successfully.")
