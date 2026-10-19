/* Canudos: A Última Resistência — núcleo da simulação (protótipo v0.5)
 *
 * Só regras: nada de DOM nem de desenho. Roda no navegador e no Node
 * (testes/simular.js). As seções correspondem aos scripts previstos no GDD
 * para a versão em Godot:
 *   Mapa → BattleMap           Posicionamento → PlacementManager
 *   Recursos → ResourceManager Ondas → WaveManager
 *   Tropas → Enemy             Estruturas → Structure
 *   Partida → GameManager
 *
 * O estado da partida (jogo.s) é só dado serializável: dá para salvar,
 * restaurar e comparar entre execuções.
 */
(function (raiz) {
  'use strict';

  // Onde a tropa para diante de uma barricada, em células antes do centro dela.
  var CONTATO = 0.55;

  // ───────────────────────── Mapa ─────────────────────────

  function prepararMapa(D) {
    var C = D.celula, W = D.colunas, H = D.linhas, M = D.mapa;
    var tipos = [];
    for (var y = 0; y < H; y++) { tipos.push([]); for (var x = 0; x < W; x++) tipos[y].push('livre'); }
    function dentro(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

    for (y = 0; y < H; y++) tipos[y][M.rio.coluna] = 'rio';
    M.obstaculos.forEach(function (o) { if (dentro(o[0], o[1])) tipos[o[1]][o[0]] = 'obstaculo'; });
    var A = M.arraial;
    for (y = A.y; y < A.y + A.h; y++) for (x = A.x; x < A.x + A.w; x++) tipos[y][x] = 'arraial';

    var pontos = M.rota.map(function (p) { return { x: (p[0] + 0.5) * C, y: (p[1] + 0.5) * C }; });
    var acum = [0];
    for (var i = 1; i < pontos.length; i++) {
      acum.push(acum[i - 1] + Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y));
    }

    // Células da estrada, em ordem, com a distância de cada centro ao início da rota.
    var estrada = [], indice = new Map();
    for (i = 1; i < M.rota.length; i++) {
      var x0 = M.rota[i - 1][0], y0 = M.rota[i - 1][1], x1 = M.rota[i][0], y1 = M.rota[i][1];
      if (x0 !== x1 && y0 !== y1) throw new Error('Rota com trecho diagonal: ' + M.rota[i - 1] + ' → ' + M.rota[i]);
      var sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
      var passos = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      for (var k = 0; k <= passos; k++) {
        var cx = x0 + sx * k, cy = y0 + sy * k, chave = cx + ',' + cy;
        if (!dentro(cx, cy) || indice.has(chave) || tipos[cy][cx] === 'arraial') continue;
        if (tipos[cy][cx] !== 'livre') throw new Error('A rota passa por ' + tipos[cy][cx] + ' em ' + chave);
        indice.set(chave, estrada.length);
        estrada.push({ x: cx, y: cy, d: acum[i - 1] + k * C, ang: Math.atan2(sy, sx) });
        tipos[cy][cx] = 'estrada';
      }
    }

    return {
      C: C, W: W, H: H, tipos: tipos, pontos: pontos, acum: acum,
      comprimento: acum[acum.length - 1], estrada: estrada, indice: indice
    };
  }

  // Posição a uma distância d do início da rota. O vetor normal é suavizado
  // perto das curvas para o deslocamento lateral das tropas não dar saltos.
  function pontoNaRota(mapa, d) {
    var p = mapa.pontos, a = mapa.acum, n = p.length;
    d = Math.max(0, Math.min(d, mapa.comprimento));
    var i = 1;
    while (i < n - 1 && a[i] < d) i++;
    var seg = a[i] - a[i - 1], t = seg > 0 ? (d - a[i - 1]) / seg : 0;
    var x = p[i - 1].x + (p[i].x - p[i - 1].x) * t;
    var y = p[i - 1].y + (p[i].y - p[i - 1].y) * t;

    function dir(j) { return Math.atan2(p[j].y - p[j - 1].y, p[j].x - p[j - 1].x); }
    var ang = dir(i), r = mapa.C * 0.5, outro = null, w = 0;
    if (i < n - 1 && a[i] - d < r) { outro = dir(i + 1); w = 0.5 * (1 - (a[i] - d) / r); }
    else if (i > 1 && d - a[i - 1] < r) { outro = dir(i - 1); w = 0.5 * (1 - (d - a[i - 1]) / r); }
    var tx = Math.cos(ang), ty = Math.sin(ang);
    if (outro !== null) {
      tx = tx * (1 - w) + Math.cos(outro) * w;
      ty = ty * (1 - w) + Math.sin(outro) * w;
    }
    return { x: x, y: y, tx: tx, ty: ty, ang: Math.atan2(ty, tx) };
  }

  // ───────────────────────── Partida ─────────────────────────

  // Cada expedição (fase da campanha) começa do zero; só o registro da campanha passa adiante.
  function estadoInicial(D, expedicao, campanha) {
    expedicao = expedicao || 0;
    return {
      versao: D.versao,
      expedicao: expedicao,        // fase da campanha: 0 a 3, uma por expedição
      campanha: campanha || { vencidas: [] },
      fase: 'preparacao',          // preparacao | combate | vitoria | derrota
      onda: 0,                     // índice da onda atual ou da próxima, dentro da expedição
      materiais: D.expedicoes[expedicao].materiais,
      integridade: D.objetivo.integridade,
      tempo: 0,
      proxId: 1,
      semente: 1897 + expedicao * 101,
      estruturas: [],
      inimigos: [],
      fila: [],
      relogioFila: 0,
      campeao: campeaoInicial(D),
      stats: {
        abatidos: 0, passaram: 0, gastos: 0, reembolsos: 0, ganhos: 0,
        barricadasPerdidas: 0, barricadasPerdidasSemCobertura: 0, ondaDaQueda: null
      }
    };
  }

  function campeaoInicial(D) {
    var c = D.campeao.inicio, C = D.celula;
    return {
      cx: c[0], cy: c[1], x: (c[0] + 0.5) * C, y: (c[1] + 0.5) * C, destino: null, caminho: null,
      angulo: Math.PI * 0.75, recargas: { mutirao: 0, predica: 0 }, predica: 0
    };
  }

  function criarJogo(D, estadoSalvo) {
    var jogo = { D: D, mapa: prepararMapa(D), s: null, eventos: [] };
    jogo.s = estadoSalvo && estadoSalvo.versao === D.versao ? estadoSalvo : estadoInicial(D);
    return jogo;
  }

  // Sorteio com semente guardada no estado (mulberry32): a partida é reproduzível.
  function aleatorio(s) {
    var t = (s.semente = (s.semente + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function evento(jogo, ev) { jogo.eventos.push(ev); }

  // ───────────────────────── Posicionamento ─────────────────────────

  function estruturaEm(jogo, cx, cy) {
    var l = jogo.s.estruturas;
    for (var i = 0; i < l.length; i++) if (l[i].cx === cx && l[i].cy === cy) return l[i];
    return null;
  }

  // Terreno e ocupação, sem olhar o custo. Serve também para a dica visual da grade.
  function validarTerreno(jogo, tipo, cx, cy) {
    var D = jogo.D, mapa = jogo.mapa, def = D.estruturas[tipo];
    if (!def) return { ok: false, motivo: 'Estrutura desconhecida.' };
    if (cx < 0 || cy < 0 || cx >= mapa.W || cy >= mapa.H) return { ok: false, motivo: 'Fora do mapa.' };
    var t = mapa.tipos[cy][cx];
    if (estruturaEm(jogo, cx, cy)) return { ok: false, motivo: 'Já há uma estrutura aqui.' };
    var ca = jogo.s.campeao;
    if (ca && ((ca.cx === cx && ca.cy === cy) || (ca.destino && ca.destino.cx === cx && ca.destino.cy === cy))) {
      return { ok: false, motivo: 'O Conselheiro está nesta casa.' };
    }
    if (t === 'obstaculo') return { ok: false, motivo: 'Pedra ou caatinga fechada: não dá para construir.' };
    if (t === 'rio') return { ok: false, motivo: 'Leito do rio: não dá para construir.' };
    if (t === 'arraial') return { ok: false, motivo: 'Dentro do arraial não se constrói.' };
    if (def.terreno === 'estrada' && t !== 'estrada') return { ok: false, motivo: 'Barricada só na estrada.' };
    if (def.terreno === 'livre' && t !== 'livre') return { ok: false, motivo: 'Atiradores ficam fora da estrada.' };
    if (t === 'estrada' && mapa.indice.get(cx + ',' + cy) < D.mapa.celulasProtegidas) {
      return { ok: false, motivo: 'Perto demais de onde as tropas surgem.' };
    }
    return { ok: true };
  }

  function validarConstrucao(jogo, tipo, cx, cy) {
    var s = jogo.s;
    if (s.fase === 'vitoria' || s.fase === 'derrota') return { ok: false, motivo: 'A partida acabou.' };
    var v = validarTerreno(jogo, tipo, cx, cy);
    if (!v.ok) return v;
    var custo = jogo.D.estruturas[tipo].custo;
    if (s.materiais < custo) return { ok: false, motivo: 'Faltam ' + (custo - s.materiais) + ' materiais.' };
    return { ok: true };
  }

  function construir(jogo, tipo, cx, cy) {
    var v = validarConstrucao(jogo, tipo, cx, cy);
    if (!v.ok) return v;
    var D = jogo.D, mapa = jogo.mapa, s = jogo.s, def = D.estruturas[tipo], C = mapa.C;
    s.materiais -= def.custo;
    s.stats.gastos += def.custo;
    var emCombate = s.fase === 'combate';
    var e = {
      id: s.proxId++, tipo: tipo, cx: cx, cy: cy, x: (cx + 0.5) * C, y: (cy + 0.5) * C,
      estado: emCombate ? 'construindo' : 'pronta', progresso: emCombate ? 0 : 1,
      custo: def.custo, onda: s.onda, faseCriacao: s.fase, cd: 0, angulo: 0, alvoId: null
    };
    if (tipo === 'barricada') {
      var c = mapa.estrada[mapa.indice.get(cx + ',' + cy)];
      e.d = c.d;
      e.angulo = c.ang;
      e.vida = e.vidaMax = def.integridade;
    } else {
      // Começa virada para a célula de estrada mais próxima.
      var melhor = null, md = Infinity;
      mapa.estrada.forEach(function (r) {
        var dd = (r.x - cx) * (r.x - cx) + (r.y - cy) * (r.y - cy);
        if (dd < md) { md = dd; melhor = r; }
      });
      if (melhor) e.angulo = Math.atan2(melhor.y - cy, melhor.x - cx);
    }
    s.estruturas.push(e);
    if (s.campeao && s.campeao.destino) replanejar(jogo, s.campeao);
    evento(jogo, { tipo: 'construiu', id: e.id, x: e.x, y: e.y, estrutura: tipo });
    return { ok: true, estrutura: e };
  }

  // No planejamento, o que foi construído nesta mesma preparação volta inteiro (desfazer).
  // Depois que a estrutura passou por combate, devolve a fração do GDD.
  function valorDesmontar(jogo, e) {
    var s = jogo.s;
    if (s.fase === 'preparacao' && e.faseCriacao === 'preparacao' && e.onda === s.onda) return e.custo;
    return Math.floor(e.custo * jogo.D.economia.reembolsoVenda);
  }

  function desmontar(jogo, id) {
    var s = jogo.s;
    if (s.fase === 'vitoria' || s.fase === 'derrota') return { ok: false, motivo: 'A partida acabou.' };
    var i = s.estruturas.findIndex(function (e) { return e.id === id; });
    if (i < 0) return { ok: false, motivo: 'Estrutura não encontrada.' };
    var e = s.estruturas[i], valor = valorDesmontar(jogo, e);
    s.estruturas.splice(i, 1);
    s.materiais += valor;
    s.stats.reembolsos += valor;
    s.inimigos.forEach(function (ini) { if (ini.alvoId === id) ini.alvoId = null; });
    evento(jogo, { tipo: 'desmontou', id: id, x: e.x, y: e.y, valor: valor });
    return { ok: true, valor: valor };
  }

  // ───────────────────────── Campeão ─────────────────────────

  function validarMovimento(jogo, cx, cy) {
    var s = jogo.s, mapa = jogo.mapa;
    if (s.fase === 'vitoria' || s.fase === 'derrota') return { ok: false, motivo: 'A partida acabou.' };
    if (cx < 0 || cy < 0 || cx >= mapa.W || cy >= mapa.H) return { ok: false, motivo: 'Fora do mapa.' };
    var t = mapa.tipos[cy][cx];
    if (t === 'estrada') return { ok: false, motivo: 'O Conselheiro fica fora da estrada.' };
    if (t !== 'livre') return { ok: false, motivo: 'Não dá para ir até ali.' };
    if (estruturaEm(jogo, cx, cy)) return { ok: false, motivo: 'Já há uma estrutura aqui.' };
    return { ok: true };
  }

  // ───────────────────────── Heróis andando ─────────────────────────
  // Servem para qualquer herói (hoje só o Conselheiro). Ele sempre anda até o
  // destino, na preparação e no combate, pelo caminho mais curto que contorna
  // pedra, mato fechado, rio e estruturas. Na preparação anda mais ligeiro,
  // porque o tempo da batalha está parado.

  function passavel(jogo, cx, cy) {
    var mapa = jogo.mapa;
    if (cx < 0 || cy < 0 || cx >= mapa.W || cy >= mapa.H) return false;
    var t = mapa.tipos[cy][cx];
    return t !== 'obstaculo' && t !== 'rio' && !estruturaEm(jogo, cx, cy);
  }

  // A* na grade, em 8 direções, sem cortar quina de obstáculo.
  function casasDoCaminho(jogo, de, para) {
    var W = jogo.mapa.W, H = jogo.mapa.H;
    var ini = de.cy * W + de.cx, fim = para.cy * W + para.cx;
    function h(k) {
      var dx = Math.abs(k % W - para.cx), dy = Math.abs(((k / W) | 0) - para.cy);
      return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    }
    var g = new Map([[ini, 0]]), f = new Map([[ini, h(ini)]]), veio = new Map(), aberto = [ini], fechado = new Set();
    while (aberto.length) {
      var bi = 0;
      for (var i = 1; i < aberto.length; i++) if (f.get(aberto[i]) < f.get(aberto[bi])) bi = i;
      var atual = aberto.splice(bi, 1)[0];
      if (atual === fim) {
        var lista = [];
        for (var k = fim; k !== undefined; k = veio.get(k)) lista.unshift({ cx: k % W, cy: (k / W) | 0 });
        return lista;
      }
      fechado.add(atual);
      var ax = atual % W, ay = (atual / W) | 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = ax + dx, ny = ay + dy, nk = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || fechado.has(nk) || !passavel(jogo, nx, ny)) continue;
        if (dx && dy && (!passavel(jogo, ax + dx, ay) || !passavel(jogo, ax, ay + dy))) continue;
        var ng = g.get(atual) + (dx && dy ? 1.414 : 1);
        if (!g.has(nk) || ng < g.get(nk)) {
          g.set(nk, ng); f.set(nk, ng + h(nk)); veio.set(nk, atual);
          if (aberto.indexOf(nk) < 0) aberto.push(nk);
        }
      }
    }
    return null;
  }

  // Linha reta livre entre dois pontos, com folga de um quarto de casa para cada lado.
  function visada(jogo, a, b) {
    var C = jogo.mapa.C, L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(L / (C / 5));
    var px = L ? -(b.y - a.y) / L * C * 0.25 : 0, py = L ? (b.x - a.x) / L * C * 0.25 : 0;
    for (var i = 1; i < n; i++) {
      var x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n;
      if (!passavel(jogo, Math.floor(x / C), Math.floor(y / C)) ||
          !passavel(jogo, Math.floor((x + px) / C), Math.floor((y + py) / C)) ||
          !passavel(jogo, Math.floor((x - px) / C), Math.floor((y - py) / C))) return false;
    }
    return true;
  }

  // Rota em px de mundo: casas do A*, enxugadas para ele andar em diagonal quando dá.
  function rotaHeroi(jogo, h, cx, cy) {
    var C = jogo.mapa.C;
    var de = { cx: Math.floor(h.x / C), cy: Math.floor(h.y / C) };
    if (!passavel(jogo, de.cx, de.cy)) de = { cx: h.cx, cy: h.cy };
    var casas = casasDoCaminho(jogo, de, { cx: cx, cy: cy });
    if (!casas) return null;
    var pts = casas.map(function (c) { return { x: (c.cx + 0.5) * C, y: (c.cy + 0.5) * C }; });
    pts[0] = { x: h.x, y: h.y };
    var rota = [], ancora = pts[0];
    for (var i = 1; i < pts.length; i++) {
      if (i === pts.length - 1 || !visada(jogo, ancora, pts[i + 1])) { rota.push(pts[i]); ancora = pts[i]; }
    }
    return rota;
  }

  function replanejar(jogo, h) {
    var rota = rotaHeroi(jogo, h, h.destino.cx, h.destino.cy);
    if (rota) h.caminho = rota;
    else { h.destino = null; h.caminho = null; h.cx = Math.floor(h.x / jogo.mapa.C); h.cy = Math.floor(h.y / jogo.mapa.C); }
  }

  function moverCampeao(jogo, cx, cy) {
    var v = validarMovimento(jogo, cx, cy);
    if (!v.ok) return v;
    var s = jogo.s, ca = s.campeao, C = jogo.mapa.C;
    if (!ca.destino && ca.cx === cx && ca.cy === cy) return { ok: true };
    var rota = rotaHeroi(jogo, ca, cx, cy);
    if (!rota) return { ok: false, motivo: 'Não há caminho até ali.' };
    ca.destino = { cx: cx, cy: cy, x: (cx + 0.5) * C, y: (cy + 0.5) * C };
    ca.caminho = rota;
    evento(jogo, { tipo: 'campeaoMoveu', x: ca.destino.x, y: ca.destino.y });
    return { ok: true };
  }

  function andarHeroi(jogo, h, vel, dt) {
    if (!h.destino) return;
    var C = jogo.mapa.C, resta = vel * dt;
    while (resta > 0 && h.caminho && h.caminho.length) {
      var p = h.caminho[0], dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy);
      if (d > 0.001) h.angulo = Math.atan2(dy, dx);
      if (d <= resta) { h.x = p.x; h.y = p.y; resta -= d; h.caminho.shift(); }
      else { h.x += dx / d * resta; h.y += dy / d * resta; resta = 0; }
    }
    h.cx = Math.floor(h.x / C); h.cy = Math.floor(h.y / C);
    if (!h.caminho || !h.caminho.length) {
      h.x = h.destino.x; h.y = h.destino.y; h.cx = h.destino.cx; h.cy = h.destino.cy;
      h.destino = null; h.caminho = null;
      evento(jogo, { tipo: 'campeaoChegou', x: h.x, y: h.y });
    }
  }

  // Fora do combate o núcleo não avança o tempo da batalha, mas os heróis andam.
  function atualizarHerois(jogo, dt) {
    var s = jogo.s, ca = s.campeao;
    if (!ca || s.fase === 'vitoria' || s.fase === 'derrota') return;
    var D = jogo.D.campeao;
    andarHeroi(jogo, ca, s.fase === 'combate' ? D.velocidade : D.velocidadePreparo, dt);
  }

  function distancia2(a, b) { return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y); }

  // Intervalo e dano efetivos de uma posição de atiradores. A aura só vale com ele parado.
  function modificadoresAtirador(jogo, e) {
    var D = jogo.D, defA = D.estruturas.atiradores, DC = D.campeao, ca = jogo.s.campeao, C = jogo.mapa.C;
    var aura = !!ca && !ca.destino && distancia2(e, ca) <= Math.pow(DC.aura.raio * C, 2);
    return { aura: aura, intervalo: defA.intervalo * (aura ? DC.aura.intervalo : 1), dano: defA.dano };
  }

  // Barricada sob a Prédica: perde integridade mais devagar.
  function barricadaFirme(jogo, b) {
    var DC = jogo.D.campeao, ca = jogo.s.campeao;
    return !!ca && ca.predica > 0 && distancia2(b, ca) <= Math.pow(DC.predica.raio * jogo.mapa.C, 2);
  }

  function usarHabilidade(jogo, nome) {
    var s = jogo.s, def = jogo.D.campeao[nome], ca = s.campeao, C = jogo.mapa.C;
    if (!def || !ca.recargas.hasOwnProperty(nome)) return { ok: false, motivo: 'Habilidade desconhecida.' };
    if (s.fase === 'vitoria' || s.fase === 'derrota') return { ok: false, motivo: 'A partida acabou.' };
    if (ca.recargas[nome] > 0) return { ok: false, motivo: def.nome + ': volta em ' + Math.ceil(ca.recargas[nome]) + ' s.' };

    if (nome === 'predica') {
      if (s.fase !== 'combate') return { ok: false, motivo: 'A Prédica só vale durante o combate.' };
      ca.predica = def.duracao;
    } else {
      var r2 = Math.pow(def.raio * C, 2), alvos = [];
      s.estruturas.forEach(function (e) {
        if (distancia2(e, ca) > r2) return;
        if (e.estado === 'construindo' || (e.tipo === 'barricada' && e.vida < e.vidaMax)) alvos.push(e);
      });
      if (!alvos.length) return { ok: false, motivo: 'Nenhuma barricada danificada nem obra a até ' + def.raio + ' casas dele.' };
      alvos.forEach(function (e) {
        if (e.estado === 'construindo') {
          e.estado = 'pronta';
          e.progresso = 1;
          evento(jogo, { tipo: 'pronta', id: e.id, x: e.x, y: e.y });
        }
        if (e.tipo === 'barricada' && e.vida < e.vidaMax) {
          var antes = e.vida;
          e.vida = Math.min(e.vidaMax, e.vida + def.reparo);
          evento(jogo, { tipo: 'reparo', id: e.id, x: e.x, y: e.y, valor: Math.round(e.vida - antes) });
        }
      });
    }
    ca.recargas[nome] = def.recarga;
    evento(jogo, { tipo: nome, x: ca.x, y: ca.y, raio: def.raio * C });
    return { ok: true };
  }

  // ───────────────────────── Ondas ─────────────────────────

  var TIPOS_ONDA = ['infantaria', 'batedor', 'sapador', 'oficial'];

  function expedicaoAtual(jogo) { return jogo.D.expedicoes[jogo.s.expedicao]; }
  function totalDeOndas(jogo) { return expedicaoAtual(jogo).ondas.length; }

  // [{ tipo, qtd }] da onda n (ou da atual) da expedição em curso.
  function composicao(jogo, n) {
    var o = expedicaoAtual(jogo).ondas[n === undefined ? jogo.s.onda : n], r = [];
    if (!o) return r;
    for (var i = 1; i < o.length; i++) if (o[i]) r.push({ tipo: TIPOS_ONDA[i - 1], qtd: o[i] });
    return r;
  }

  function iniciarOnda(jogo) {
    var s = jogo.s;
    if (s.fase !== 'preparacao') return false;
    // cada tipo espalhado pela coluna, em vez de chegar em bloco
    var itens = [];
    composicao(jogo).forEach(function (g, gi) {
      for (var k = 0; k < g.qtd; k++) itens.push({ tipo: g.tipo, pos: (k + 0.5) / g.qtd + gi * 0.001 });
    });
    itens.sort(function (a, b) { return a.pos - b.pos; });
    s.fila = itens.map(function (i) { return i.tipo; });
    s.relogioFila = 0;
    s.fase = 'combate';
    evento(jogo, { tipo: 'ondaIniciada', onda: s.onda });
    return true;
  }

  function tropasDaOnda(jogo, n) {
    return composicao(jogo, n).reduce(function (t, g) { return t + g.qtd; }, 0);
  }

  function tropasRestantes(jogo) {
    var s = jogo.s;
    if (s.fase === 'preparacao') return tropasDaOnda(jogo, s.onda);
    return s.fila.length + s.inimigos.filter(function (i) { return !i.morto && !i.chegou; }).length;
  }

  // ───────────────────────── Tropas ─────────────────────────

  function gerarInimigo(jogo, tipo) {
    var s = jogo.s, def = jogo.D.inimigos[tipo], E = expedicaoAtual(jogo);
    var vida = Math.round(def.vida * (E.vigor || 1) * (1 + (E.crescimento || 0) * s.onda));
    s.inimigos.push({
      id: s.proxId++, tipo: tipo, d: 0, vida: vida, vidaMax: vida,
      lado: (aleatorio(s) - 0.5) * 18,   // deslocamento lateral na estrada, em px
      folga: aleatorio(s) * 16,          // espalha o grupo diante da barricada
      estado: 'andando', cd: 0, alvoId: null, morto: false, chegou: false, recompensado: false
    });
  }

  function posicaoInimigo(jogo, ini) {
    var p = pontoNaRota(jogo.mapa, ini.d);
    return { x: p.x - p.ty * ini.lado, y: p.y + p.tx * ini.lado, ang: p.ang };
  }

  function abater(jogo, ini) {
    if (ini.morto) return;
    var s = jogo.s, valor = 0;
    ini.morto = true;
    if (!ini.recompensado) {
      ini.recompensado = true;
      valor = jogo.D.inimigos[ini.tipo].recompensa || jogo.D.economia.recompensaAbate;
      s.materiais += valor;
      s.stats.ganhos += valor;
    }
    s.stats.abatidos++;
    var p = posicaoInimigo(jogo, ini);
    evento(jogo, { tipo: 'abate', id: ini.id, x: p.x, y: p.y, ang: p.ang, valor: valor });
  }

  // Tropa a até o raio de comando de um oficial vivo (outro que não ela) leva menos dano.
  function sobComando(jogo, ini, p) {
    var r = jogo.D.inimigos.oficial.comando.raio * jogo.mapa.C, r2 = r * r;
    for (var i = 0; i < jogo.s.inimigos.length; i++) {
      var o = jogo.s.inimigos[i];
      if (o === ini || o.tipo !== 'oficial' || o.morto || o.chegou) continue;
      var q = posicaoInimigo(jogo, o);
      if ((q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) <= r2) return true;
    }
    return false;
  }

  // ───────────────────────── Atualização ─────────────────────────

  function atualizar(jogo, dt) {
    var D = jogo.D, mapa = jogo.mapa, s = jogo.s, C = mapa.C;
    if (s.fase !== 'combate') return;
    s.tempo += dt;

    // 1. Chegada das tropas
    var intervalo = expedicaoAtual(jogo).ondas[s.onda][0];
    s.relogioFila -= dt;
    while (s.fila.length && s.relogioFila <= 0) {
      gerarInimigo(jogo, s.fila.shift());
      s.relogioFila += intervalo;
    }

    // 2. Obras em andamento
    s.estruturas.forEach(function (e) {
      if (e.estado !== 'construindo') return;
      e.progresso += dt / D.estruturas[e.tipo].tempoConstrucao;
      if (e.progresso >= 1) {
        e.progresso = 1;
        e.estado = 'pronta';
        evento(jogo, { tipo: 'pronta', id: e.id, x: e.x, y: e.y });
      }
    });

    // 3. Campeão: recargas, prédica e deslocamento
    var ca = s.campeao;
    if (ca) {
      Object.keys(ca.recargas).forEach(function (k) { ca.recargas[k] = Math.max(0, ca.recargas[k] - dt); });
      ca.predica = Math.max(0, ca.predica - dt);
      andarHeroi(jogo, ca, D.campeao.velocidade, dt);
    }

    // 4. Movimento e ataque das tropas
    var barricadas = s.estruturas.filter(function (e) { return e.tipo === 'barricada' && e.estado === 'pronta'; });
    for (var i = 0; i < s.inimigos.length && s.fase === 'combate'; i++) {
      var ini = s.inimigos[i];
      if (ini.morto || ini.chegou) continue;
      var def = D.inimigos[ini.tipo];

      var bar = null;
      for (var b = 0; b < barricadas.length; b++) {
        var cand = barricadas[b];
        if (cand.vida > 0 && cand.d > ini.d && (!bar || cand.d < bar.d)) bar = cand;
      }
      var limite = bar ? bar.d - (CONTATO * C + ini.folga) : Infinity;

      if (bar && ini.d >= limite - 0.01) {
        if (ini.estado !== 'atacando') { ini.estado = 'atacando'; ini.cd = def.intervaloAtaque * 0.5; }
        ini.alvoId = bar.id;
        ini.cd -= dt;
        if (ini.cd <= 0) {
          ini.cd += def.intervaloAtaque;
          var firme = barricadaFirme(jogo, bar);
          bar.vida -= def.danoBarricada * (firme ? 1 - D.campeao.predica.reducaoDano : 1);
          evento(jogo, { tipo: 'golpe', id: bar.id, x: bar.x, y: bar.y, firme: firme });
          if (bar.vida <= 0) {
            s.stats.barricadasPerdidas++;
            if (!celulaCoberta(jogo, bar.x, bar.y)) s.stats.barricadasPerdidasSemCobertura++;
            evento(jogo, { tipo: 'barricadaCaiu', id: bar.id, x: bar.x, y: bar.y, ang: bar.angulo });
          }
        }
      } else {
        ini.estado = 'andando';
        ini.alvoId = null;
        ini.d = Math.min(ini.d + def.velocidade * dt, limite);
        if (ini.d >= mapa.comprimento) {
          ini.chegou = true;
          s.integridade = Math.max(0, s.integridade - def.danoObjetivo);
          s.stats.passaram++;
          var fim = mapa.pontos[mapa.pontos.length - 1];
          evento(jogo, { tipo: 'chegada', id: ini.id, x: fim.x, y: fim.y, dano: def.danoObjetivo });
          if (s.integridade <= 0) {
            s.fase = 'derrota';
            s.stats.ondaDaQueda = s.onda;
            evento(jogo, { tipo: 'derrota', onda: s.onda });
          }
        }
      }
    }
    s.estruturas = s.estruturas.filter(function (e) { return e.tipo !== 'barricada' || e.vida > 0; });

    // 5. Atiradores: alvo é a tropa mais adiantada dentro do alcance
    if (s.fase === 'combate') {
      var defA = D.estruturas.atiradores, alc2 = Math.pow(defA.alcance * C, 2);
      s.estruturas.forEach(function (e) {
        if (e.tipo !== 'atiradores' || e.estado !== 'pronta') return;
        e.cd = Math.max(0, e.cd - dt);
        var alvo = null, pAlvo = null;
        s.inimigos.forEach(function (ini) {
          if (ini.morto || ini.chegou) return;
          var p = posicaoInimigo(jogo, ini);
          if (p.x < 0) return; // ainda fora da tela
          var dd = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
          if (dd <= alc2 && (!alvo || ini.d > alvo.d)) { alvo = ini; pAlvo = p; }
        });
        e.alvoId = alvo ? alvo.id : null;
        if (!alvo) return;
        e.angulo = Math.atan2(pAlvo.y - e.y, pAlvo.x - e.x);
        if (e.cd > 0) return;
        var mod = modificadoresAtirador(jogo, e);
        e.cd = mod.intervalo;
        alvo.vida -= mod.dano * (sobComando(jogo, alvo, pAlvo) ? 1 - D.inimigos.oficial.comando.reducaoDano : 1);
        evento(jogo, { tipo: 'tiro', de: e.id, x0: e.x, y0: e.y, x1: pAlvo.x, y1: pAlvo.y });
        if (alvo.vida <= 0) abater(jogo, alvo);
      });
    }
    s.inimigos = s.inimigos.filter(function (i) { return !i.morto && !i.chegou; });

    // 6. Fim da onda
    if (s.fase === 'combate' && s.fila.length === 0 && s.inimigos.length === 0) {
      var bonus = D.economia.recompensaOnda;
      s.materiais += bonus;
      s.stats.ganhos += bonus;
      evento(jogo, { tipo: 'ondaConcluida', onda: s.onda, bonus: bonus });
      if (s.onda >= totalDeOndas(jogo) - 1) {
        s.fase = 'vitoria';
        s.campanha.vencidas[s.expedicao] = { integridade: s.integridade, abatidos: s.stats.abatidos, passaram: s.stats.passaram };
        evento(jogo, { tipo: 'vitoria', expedicao: s.expedicao });
      } else {
        s.onda++;
        s.fase = 'preparacao';
      }
    }
  }

  // ───────────────────────── Campanha ─────────────────────────

  function proximaExpedicao(jogo) {
    var s = jogo.s;
    if (s.fase !== 'vitoria' || s.expedicao >= jogo.D.expedicoes.length - 1) return false;
    jogo.s = estadoInicial(jogo.D, s.expedicao + 1, s.campanha);
    return true;
  }

  function recomecarExpedicao(jogo) {
    jogo.s = estadoInicial(jogo.D, jogo.s.expedicao, jogo.s.campanha);
  }

  // ───────────────────────── Diagnóstico ─────────────────────────

  function celulaCoberta(jogo, x, y) {
    var alc = jogo.D.estruturas.atiradores.alcance * jogo.mapa.C;
    return jogo.s.estruturas.some(function (e) {
      return e.tipo === 'atiradores' && Math.hypot(e.x - x, e.y - y) <= alc;
    });
  }

  // Que parte da estrada está ao alcance de algum atirador (pronto ou em obra).
  function cobertura(jogo) {
    var C = jogo.mapa.C;
    var coberta = jogo.mapa.estrada.map(function (c) {
      return celulaCoberta(jogo, (c.x + 0.5) * C, (c.y + 0.5) * C);
    });
    var total = coberta.filter(Boolean).length;
    var maior = { inicio: -1, tamanho: 0 }, ini = -1;
    for (var i = 0; i <= coberta.length; i++) {
      if (i < coberta.length && !coberta[i]) { if (ini < 0) ini = i; continue; }
      if (ini >= 0 && i - ini > maior.tamanho) maior = { inicio: ini, tamanho: i - ini };
      ini = -1;
    }
    return { coberta: coberta, fracao: coberta.length ? total / coberta.length : 0, maiorTrecho: maior };
  }

  // Explica a derrota com o que o jogador pode mudar na próxima tentativa.
  function diagnostico(jogo) {
    var D = jogo.D, s = jogo.s, cob = cobertura(jogo);
    var atiradores = s.estruturas.filter(function (e) { return e.tipo === 'atiradores'; });
    var barricadas = s.estruturas.filter(function (e) { return e.tipo === 'barricada'; });
    var pct = Math.round(cob.fracao * 100);
    var dicas = [];

    if (!atiradores.length) {
      dicas.push('Nenhuma posição de atiradores foi montada. Barricadas só seguram as tropas; quem as derruba são os atiradores.');
    } else if (cob.fracao < 0.4) {
      dicas.push('Só ' + pct + '% da estrada ficou ao alcance dos atiradores. O maior trecho descoberto, em vermelho no mapa, tem ' +
        cob.maiorTrecho.tamanho + ' casas.');
    }
    if (s.stats.barricadasPerdidasSemCobertura > 0) {
      dicas.push(s.stats.barricadasPerdidasSemCobertura === 1
        ? 'Uma barricada caiu fora do alcance dos atiradores: as tropas a derrubaram sem levar tiro.'
        : s.stats.barricadasPerdidasSemCobertura + ' barricadas caíram fora do alcance dos atiradores: as tropas as derrubaram sem levar tiro.');
    } else if (atiradores.length && !barricadas.length && !s.stats.barricadasPerdidas) {
      dicas.push('Sem barricadas, as tropas passam direto. Uma barricada dentro do alcance segura o grupo onde ele leva tiro.');
    }
    if (atiradores.length && s.campeao && !atiradores.some(function (e) { return modificadoresAtirador(jogo, e).aura; })) {
      dicas.push('Nenhum atirador ficou perto do Conselheiro. Na aura dele, a até ' + D.campeao.aura.raio +
        ' casas, eles atiram ' + Math.round((1 / D.campeao.aura.intervalo - 1) * 100) + '% mais rápido.');
    }
    if (s.materiais >= D.estruturas.atiradores.custo) {
      dicas.push('Sobraram ' + s.materiais + ' materiais sem uso: dava para mais uma posição de atiradores.');
    } else if (s.materiais >= D.estruturas.barricada.custo) {
      dicas.push('Sobraram ' + s.materiais + ' materiais sem uso: dava para mais uma barricada.');
    }

    return {
      cobertura: cob, percentual: pct, dicas: dicas.slice(0, 3),
      passaram: s.stats.passaram, abatidos: s.stats.abatidos,
      danoPorTropa: D.inimigos.infantaria.danoObjetivo
    };
  }

  var Nucleo = {
    CONTATO: CONTATO,
    prepararMapa: prepararMapa, pontoNaRota: pontoNaRota,
    criarJogo: criarJogo, estadoInicial: estadoInicial,
    estruturaEm: estruturaEm, validarTerreno: validarTerreno, validarConstrucao: validarConstrucao,
    construir: construir, desmontar: desmontar, valorDesmontar: valorDesmontar,
    iniciarOnda: iniciarOnda, tropasDaOnda: tropasDaOnda, tropasRestantes: tropasRestantes,
    composicao: composicao, totalDeOndas: totalDeOndas, expedicaoAtual: expedicaoAtual,
    proximaExpedicao: proximaExpedicao, recomecarExpedicao: recomecarExpedicao,
    posicaoInimigo: posicaoInimigo, atualizar: atualizar, atualizarHerois: atualizarHerois,
    validarMovimento: validarMovimento, moverCampeao: moverCampeao, usarHabilidade: usarHabilidade,
    sobComando: sobComando,
    modificadoresAtirador: modificadoresAtirador, barricadaFirme: barricadaFirme,
    cobertura: cobertura, diagnostico: diagnostico
  };

  raiz.CanudosNucleo = Nucleo;
  if (typeof module !== 'undefined' && module.exports) module.exports = Nucleo;
})(typeof globalThis !== 'undefined' ? globalThis : this);
