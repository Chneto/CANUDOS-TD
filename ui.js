/* Canudos: A Última Resistência — interface, menu, história, entrada e laço do jogo (protótipo v0.5) */
(function () {
  'use strict';

  var D = window.CANUDOS_DADOS, N = window.CanudosNucleo, R = window.CanudosRender, H = window.CANUDOS_HISTORIA;
  var $ = function (id) { return document.getElementById(id); };
  var raizDoc = document.documentElement;
  var tela = $('tela'), ctx = tela.getContext('2d');
  var PASSO = 1 / 60;
  var dpr = Math.min(2, window.devicePixelRatio || 1);

  var jogo, vis, cena;
  var velocidade = 1, pausado = false, pausaDoMenu = false, acumulador = 0, ultimo = 0;
  var naTela = 'menu';
  var mensagem = null;
  var cache = {};
  var aspecto = 0, historia = null;
  // Dentro do app para PC (Canudos.exe), a página fala com a janela nativa.
  var HOST = window.chrome && window.chrome.webview;
  function pedirAoApp(t) { if (HOST) HOST.postMessage(JSON.stringify({ t: t })); }

  // ───────────────────────── Configurações ─────────────────────────

  var PADRAO = { velocidade: 1, alcanceSempre: false, reduzirMovimento: false, pausarOculto: true };
  var config = lerConfig();

  function lerConfig() {
    var c = {};
    try { c = JSON.parse(localStorage.getItem('canudos.config') || '{}') || {}; } catch (e) { c = {}; }
    var r = {};
    Object.keys(PADRAO).forEach(function (k) { r[k] = c.hasOwnProperty(k) ? c[k] : PADRAO[k]; });
    return r;
  }
  function salvarConfig() {
    try { localStorage.setItem('canudos.config', JSON.stringify(config)); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
  }
  function aplicarConfig() {
    vis.sempreAlcance = config.alcanceSempre;
    vis.menosMovimento = config.reduzirMovimento || vis.menosMovimentoSistema;
    $('cfg-alcance').checked = config.alcanceSempre;
    $('cfg-movimento').checked = config.reduzirMovimento;
    $('cfg-foco').checked = config.pausarOculto;
    marcarVelocidades($('cfg-velocidade'), config.velocidade);
  }
  function marcarVelocidades(grupo, v) {
    grupo.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.vel) === v)); });
  }

  // ───────────────────────── Início ─────────────────────────

  function iniciar(salvo) {
    salvo = salvo || {};
    jogo = N.criarJogo(D, salvo.estado);
    vis = R.novoVisual();
    velocidade = [1, 2, 3].indexOf(salvo.velocidade) >= 0 ? salvo.velocidade : config.velocidade;
    aplicarConfig();

    raizDoc.classList.add('em-jogo');
    ajustarTela();
    var espera;
    window.addEventListener('resize', function () { clearTimeout(espera); espera = setTimeout(ajustarTela, 150); });
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('13px "Holtwood One SC"'),
        document.fonts.load('italic 15px Alegreya'),
        document.fonts.load('600 13px Alegreya'),
        document.fonts.load('600 14px "Pixelify Sans"')
      ]).then(function () { cena = R.criarCena(jogo, dpr, aspecto); }, function () {});
    }

    if (HOST) {
      raizDoc.classList.add('no-pc');
      var versao = document.querySelector('.inicio-versao');
      if (versao) versao.textContent += ' F11 alterna entre tela cheia e janela.';
    }
    prepararRetrato();
    procurarCapa();
    ligarEntrada();
    if (jogo.s.fase === 'vitoria' || jogo.s.fase === 'derrota') mostrarResultado();
    var direto = location.hash === '#historia' || location.hash === '#jogar';
    if (location.hash === '#historia') novaCampanha();
    else if (salvo.naTela === 'jogo' || location.hash === '#jogar') fecharMenu(); else abrirMenu();
    // Vinheta do estúdio ao abrir o jogo; não aparece em atalhos de endereço nem ao recarregar no meio da partida.
    if (!direto && !salvo.estado && window.CanudosAbertura) {
      window.CanudosAbertura.mostrar(function () { if (naTela === 'menu') trocarPainel('principal'); });
    }
    atualizarInterface();
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
      window.claude.hot.snapshot(function () { return { estado: jogo.s, velocidade: velocidade, naTela: naTela }; });
    }
    ultimo = performance.now();
    requestAnimationFrame(quadro);
  }

  // O mapa ocupa a janela inteira. A cena é refeita quando o formato da janela muda
  // de verdade; o canvas mantém a proporção do desenho e fica centrado. Dentro da faixa
  // de formatos que o desenho acompanha, cobre a janela (sobra no máximo um fio
  // cortado); fora dela (celular em pé), cabe inteiro.
  function ajustarTela() {
    var W = window.innerWidth || 1280, Hj = window.innerHeight || 720, real = W / Hj;
    var novo = Math.round(Math.max(1, Math.min(2.4, real)) * 50) / 50;
    if (!cena || novo !== aspecto) { aspecto = novo; cena = R.criarCena(jogo, dpr, aspecto); }
    var a = cena.P.L / cena.P.A, cobrir = real >= 1 && real <= 2.4, w = W, h = W / a;
    if (cobrir ? h < Hj : h > Hj) { h = Hj; w = Hj * a; }
    tela.style.width = Math.round(w) + 'px';
    tela.style.height = Math.round(h) + 'px';
    tela.style.left = Math.round((W - w) / 2) + 'px';
    tela.style.top = Math.round((Hj - h) / 2) + 'px';
  }

  // O papel de parede (capa.jpg) é opcional: sem ele, o menu usa um fundo desenhado.
  function procurarCapa() {
    var img = new Image();
    img.onload = function () { raizDoc.classList.add('tem-capa'); prepararRetrato(); };
    img.src = 'capa.jpg';
  }

  function prepararRetrato() {
    var c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    R.retrato(c);
    var el = $('retrato'), desenhado = 'url(' + c.toDataURL() + ')';
    if (raizDoc.classList.contains('tem-capa')) {
      // recorte do rosto do Conselheiro no papel de parede, com o desenho por baixo
      el.style.backgroundImage = 'url("capa.jpg"), ' + desenhado;
      el.style.backgroundSize = '560px auto, cover';
      el.style.backgroundPosition = '-247px -22px, center';
    } else {
      el.style.backgroundImage = desenhado;
      el.style.backgroundSize = 'cover';
    }
  }

  function recomecar() {
    jogo = N.criarJogo(D);
    prepararFase();
  }

  // Limpa o que é da tela ao começar (ou recomeçar) uma fase.
  function prepararFase() {
    vis = R.novoVisual();
    aplicarConfig();
    velocidade = config.velocidade;
    pausado = false;
    pausaDoMenu = false;
    acumulador = 0;
    mensagem = null;
    $('resultado').hidden = true;
    $('resultado').innerHTML = '';
    $('comandos').hidden = false;
    cache = {};
    atualizarInterface();
  }

  // ───────────────────────── Menu ─────────────────────────

  function campanhaConcluida() { return jogo.s.fase === 'vitoria' && jogo.s.expedicao >= D.expedicoes.length - 1; }

  function partidaEmAndamento() {
    var s = jogo.s;
    if (campanhaConcluida()) return false;
    return s.expedicao > 0 || s.onda > 0 || s.estruturas.length > 0 || s.fase !== 'preparacao';
  }

  // ───────────────────────── Trilha Sonora Sertaneja e Áudio Tátil ─────────────────────────
  var audioMusica = null;
  var volumeAtual = 70;
  var volumeAntesMudo = 70;
  var musicaAtiva = true;
  var ctxAudio = null;

  function obterAudioCtx() {
    if (!ctxAudio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try { ctxAudio = new AC(); } catch (e) {}
      }
    }
    if (ctxAudio && ctxAudio.state === 'suspended') {
      ctxAudio.resume().catch(function () {});
    }
    return ctxAudio;
  }

  function tocarSfx(tipo) {
    if (!musicaAtiva || volumeAtual === 0) return;
    try {
      var ctx = obterAudioCtx();
      if (!ctx) return;
      var vol = (volumeAtual / 100) * 0.35;
      var agora = ctx.currentTime;
      if (tipo === 'tiro') {
        var len = Math.floor(ctx.sampleRate * 0.1);
        var b = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = b.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.022));
        var src = ctx.createBufferSource();
        src.buffer = b;
        var flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(850, agora);
        flt.Q.setValueAtTime(1.5, agora);
        var g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.85, agora);
        g.gain.exponentialRampToValueAtTime(0.001, agora + 0.1);
        src.connect(flt); flt.connect(g); g.connect(ctx.destination);
        src.start(agora);
      } else if (tipo === 'impacto') {
        var osc = ctx.createOscillator();
        var g2 = ctx.createGain();
        osc.frequency.setValueAtTime(150, agora);
        osc.frequency.exponentialRampToValueAtTime(40, agora + 0.07);
        g2.gain.setValueAtTime(vol * 0.6, agora);
        g2.gain.exponentialRampToValueAtTime(0.001, agora + 0.07);
        osc.connect(g2); g2.connect(ctx.destination);
        osc.start(agora); osc.stop(agora + 0.07);
      } else if (tipo === 'construir') {
        var osc2 = ctx.createOscillator();
        var g3 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(329.6, agora);
        osc2.frequency.setValueAtTime(493.9, agora + 0.06);
        g3.gain.setValueAtTime(vol * 0.45, agora);
        g3.gain.exponentialRampToValueAtTime(0.001, agora + 0.16);
        osc2.connect(g3); g3.connect(ctx.destination);
        osc2.start(agora); osc2.stop(agora + 0.16);
      } else if (tipo === 'onda') {
        var osc3 = ctx.createOscillator();
        var g4 = ctx.createGain();
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(196, agora);
        osc3.frequency.linearRampToValueAtTime(261.6, agora + 0.2);
        osc3.frequency.linearRampToValueAtTime(293.7, agora + 0.4);
        var flt2 = ctx.createBiquadFilter();
        flt2.type = 'lowpass';
        flt2.frequency.setValueAtTime(600, agora);
        g4.gain.setValueAtTime(0.001, agora);
        g4.gain.linearRampToValueAtTime(vol * 0.55, agora + 0.06);
        g4.gain.exponentialRampToValueAtTime(0.001, agora + 0.55);
        osc3.connect(flt2); flt2.connect(g4); g4.connect(ctx.destination);
        osc3.start(agora); osc3.stop(agora + 0.55);
      } else if (tipo === 'mutirao') {
        var oscM = ctx.createOscillator();
        var gM = ctx.createGain();
        oscM.type = 'sine';
        oscM.frequency.setValueAtTime(523.25, agora);
        oscM.exponentialRampToValueAtTime(1046.5, agora + 0.05);
        gM.gain.setValueAtTime(vol * 0.5, agora);
        gM.gain.exponentialRampToValueAtTime(0.001, agora + 0.45);
        oscM.connect(gM); gM.connect(ctx.destination);
        oscM.start(agora); oscM.stop(agora + 0.45);
      } else if (tipo === 'predica') {
        var oscP = ctx.createOscillator();
        var gP = ctx.createGain();
        oscP.type = 'triangle';
        oscP.frequency.setValueAtTime(220, agora);
        oscP.linearRampToValueAtTime(277.18, agora + 0.3);
        gP.gain.setValueAtTime(0.001, agora);
        gP.gain.linearRampToValueAtTime(vol * 0.45, agora + 0.08);
        gP.gain.exponentialRampToValueAtTime(0.001, agora + 0.65);
        oscP.connect(gP); gP.connect(ctx.destination);
        oscP.start(agora); oscP.stop(agora + 0.65);
      } else if (tipo === 'vitoria') {
        [261.63, 329.63, 392.0, 523.25].forEach(function (freq, i) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = freq;
          g.gain.setValueAtTime(0.001, agora + i * 0.05);
          g.gain.linearRampToValueAtTime(vol * 0.35, agora + i * 0.05 + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, agora + i * 0.05 + 0.8);
          o.connect(g); g.connect(ctx.destination);
          o.start(agora + i * 0.05); o.stop(agora + i * 0.05 + 0.8);
        });
      } else if (tipo === 'derrota') {
        [392.0, 311.13, 261.63].forEach(function (freq, i) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sawtooth'; o.frequency.value = freq;
          var flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 450;
          g.gain.setValueAtTime(0.001, agora + i * 0.12);
          g.gain.linearRampToValueAtTime(vol * 0.3, agora + i * 0.12 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, agora + i * 0.12 + 0.9);
          o.connect(flt); flt.connect(g); g.connect(ctx.destination);
          o.start(agora + i * 0.12); o.stop(agora + i * 0.12 + 0.9);
        });
      }
    } catch (e) {}
  }

  function carregarVolume() {
    try {
      var salvo = localStorage.getItem('canudos.volume');
      if (salvo !== null) {
        var n = parseInt(salvo, 10);
        if (!isNaN(n) && n >= 0 && n <= 100) volumeAtual = n;
      }
    } catch (e) {}
  }

  function salvarVolume() {
    try { localStorage.setItem('canudos.volume', String(volumeAtual)); } catch (e) {}
  }

  function aplicarVolume() {
    if (audioMusica) {
      audioMusica.volume = volumeAtual / 100;
      if (volumeAtual === 0 && !audioMusica.paused) {
        audioMusica.pause();
      } else if (volumeAtual > 0 && musicaAtiva && audioMusica.paused) {
        audioMusica.play().catch(function () {});
      }
    }
    var sl = $('slider-volume'), rt = $('rotulo-volume'), bm = $('bt-mudo');
    if (sl) sl.value = volumeAtual;
    if (rt) rt.textContent = volumeAtual + '%';
    if (bm) {
      if (volumeAtual === 0) bm.textContent = '🔇';
      else if (volumeAtual < 35) bm.textContent = '🔈';
      else if (volumeAtual < 70) bm.textContent = '🔉';
      else bm.textContent = '🔊';
    }
  }

  function ajustarVolume(novo) {
    novo = Math.max(0, Math.min(100, Math.round(novo)));
    volumeAtual = novo;
    if (volumeAtual > 0) {
      volumeAntesMudo = volumeAtual;
      musicaAtiva = true;
    }
    salvarVolume();
    aplicarVolume();
    iniciarMusica();
  }

  function alternarMudo() {
    if (volumeAtual > 0) {
      volumeAntesMudo = volumeAtual;
      ajustarVolume(0);
    } else {
      ajustarVolume(volumeAntesMudo || 70);
    }
  }

  function iniciarMusica() {
    try {
      if (!audioMusica) {
        audioMusica = new Audio('musica_canudos.wav');
        audioMusica.loop = true;
        carregarVolume();
        audioMusica.volume = volumeAtual / 100;
      }
      if (volumeAtual > 0 && musicaAtiva && audioMusica.paused) {
        audioMusica.play().catch(function () {});
      }
      aplicarVolume();
    } catch (e) {}
  }

  function toqueDesbloqueiaAudio() {
    if (!audioMusica || audioMusica.paused) {
      iniciarMusica();
    }
    obterAudioCtx();
    window.removeEventListener('pointerdown', toqueDesbloqueiaAudio);
    window.removeEventListener('keydown', toqueDesbloqueiaAudio);
  }
  window.addEventListener('pointerdown', toqueDesbloqueiaAudio);
  window.addEventListener('keydown', toqueDesbloqueiaAudio);

  function abrirMenu(painel) {
    naTela = 'menu';
    if (jogo.s.fase === 'combate' && !pausado) { pausado = true; pausaDoMenu = true; }
    raizDoc.classList.add('com-menu');
    $('inicio').hidden = false;
    $('bt-continuar').hidden = !partidaEmAndamento();
    $('bt-iniciar').textContent = partidaEmAndamento() ? 'Novo jogo' : 'Iniciar';
    trocarPainel(painel || 'principal');
  }

  function fecharMenu() {
    naTela = 'jogo';
    raizDoc.classList.remove('com-menu');
    $('inicio').hidden = true;
    if (pausaDoMenu) { pausado = false; pausaDoMenu = false; }
    ultimo = performance.now();
  }

  function trocarPainel(nome) {
    ['principal', 'ajuda', 'config', 'sair'].forEach(function (n) { $('menu-' + n).hidden = n !== nome; });
    $('inicio').classList.toggle('submenu', nome !== 'principal');
    var alvo = nome === 'principal'
      ? ($('bt-continuar').hidden ? $('bt-iniciar') : $('bt-continuar'))
      : $('menu-' + nome).querySelector('button, input');
    if (alvo) alvo.focus({ preventScroll: true });
  }

  function acaoDoMenu(acao) {
    if (acao === 'continuar') fecharMenu();
    else if (acao === 'iniciar') novaCampanha();
    else if (acao === 'ajuda') trocarPainel('ajuda');
    else if (acao === 'config') trocarPainel('config');
    else if (acao === 'sair') { if (HOST) pedirAoApp('sair'); else trocarPainel('sair'); }
    else if (acao === 'voltar') trocarPainel('principal');
  }

  // ───────────────────────── História ─────────────────────────

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function paginaPrologo() { var p = H.prologo; return { sobre: p.sobre + ' · ' + p.data, titulo: p.titulo, paragrafos: p.paragrafos, pe: H.fontes }; }
  function paginaAntes(k) { var p = H.expedicoes[k].antes; return { sobre: 'Fase ' + (k + 1) + ' de ' + D.expedicoes.length + ' · ' + p.sobre, titulo: p.titulo, paragrafos: p.paragrafos, pe: H.avisoJogo }; }
  function paginaDepois(k) { var p = H.expedicoes[k].depois; return { sobre: p.sobre, titulo: p.titulo, paragrafos: p.paragrafos, pe: H.fontes }; }
  function paginaEpilogo(venceu) {
    var p = H.epilogo;
    return { sobre: p.sobre, titulo: p.titulo, abertura: p.abertura[venceu ? 'vitoria' : 'derrota'], paragrafos: p.paragrafos, pe: H.fontes };
  }

  // paginas: [{ sobre, titulo, abertura?, paragrafos, pe? }]. Na última, o botão principal
  // chama aoTerminar; extras são botões a mais ({ rotulo, acao }).
  function abrirHistoria(paginas, rotuloFinal, aoTerminar, extras) {
    historia = { paginas: paginas, i: 0, rotuloFinal: rotuloFinal, aoTerminar: aoTerminar, extras: extras || [] };
    naTela = 'historia';
    raizDoc.classList.remove('com-menu');
    raizDoc.classList.add('com-historia');
    $('inicio').hidden = true;
    $('historia').hidden = false;
    mostrarPagina();
  }

  function mostrarPagina() {
    var h = historia, pg = h.paginas[h.i], ultima = h.i === h.paginas.length - 1;
    $('hist-sobre').textContent = pg.sobre;
    $('hist-titulo').textContent = pg.titulo;
    $('hist-texto').innerHTML = (pg.abertura ? '<p class="abertura">' + esc(pg.abertura) + '</p>' : '') +
      pg.paragrafos.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    $('hist-pe').textContent = pg.pe || '';
    var botoes = '<button type="button" class="principal" data-hist="seguir">' + esc(ultima ? h.rotuloFinal : 'Continuar') + '</button>';
    if (ultima) h.extras.forEach(function (x, i) { botoes += '<button type="button" data-hist="extra" data-i="' + i + '">' + esc(x.rotulo) + '</button>'; });
    if (h.paginas.length > 1) botoes += '<span class="contagem">' + (h.i + 1) + ' de ' + h.paginas.length + '</span>';
    $('hist-acoes').innerHTML = botoes;
    $('historia').scrollTop = 0;
    var bt = $('hist-acoes').querySelector('button');
    if (bt) bt.focus({ preventScroll: true });
  }

  function fecharHistoria() {
    $('historia').hidden = true;
    raizDoc.classList.remove('com-historia');
    historia = null;
  }

  function seguirHistoria(extra) {
    var h = historia;
    if (!h) return;
    if (extra === undefined && h.i < h.paginas.length - 1) { h.i++; mostrarPagina(); return; }
    var acao = extra === undefined ? h.aoTerminar : h.extras[extra].acao;
    fecharHistoria();
    acao();
  }

  function entrarNoJogo() { naTela = 'jogo'; fecharMenu(); }

  function novaCampanha() {
    recomecar();
    abrirHistoria([paginaPrologo(), paginaAntes(0)], 'Começar a fase 1', entrarNoJogo);
  }

  // Fase vencida: o que aconteceu de fato e, se houver, a próxima expedição.
  function aoVencerFase() {
    var k = jogo.s.expedicao;
    if (k < D.expedicoes.length - 1) {
      abrirHistoria([paginaDepois(k), paginaAntes(k + 1)], 'Começar a fase ' + (k + 2), function () {
        N.proximaExpedicao(jogo);
        prepararFase();
        entrarNoJogo();
      });
    } else {
      abrirHistoria([paginaEpilogo(true)], 'Voltar ao menu', function () { abrirMenu(); },
        [{ rotulo: 'Jogar a campanha de novo', acao: novaCampanha }]);
    }
  }

  function tentarFaseDeNovo() {
    N.recomecarExpedicao(jogo);
    prepararFase();
    entrarNoJogo();
  }

  // ───────────────────────── Laço ─────────────────────────

  function avancar(dtReal) {
    if (jogo.s.fase === 'combate' && !pausado) {
      acumulador += dtReal * velocidade;
      var n = 0;
      while (acumulador >= PASSO && n < 400) {
        N.atualizar(jogo, PASSO);
        R.avancarEfeitos(vis, PASSO);
        acumulador -= PASSO;
        n++;
      }
    } else if (!pausado) {
      N.atualizarHerois(jogo, dtReal);
      R.avancarEfeitos(vis, dtReal);
    }
    processarEventos();
  }

  function quadro(agora) {
    var dt = Math.min(0.1, (agora - ultimo) / 1000);
    ultimo = agora;
    if (naTela === 'jogo') {
      avancar(dt);

      // Interpolação suave e cinematográfica de câmera (Pan, Zoom, Rotação)
      if (vis.alvoPanX !== undefined) vis.cameraPanX = (vis.cameraPanX || 0) + (vis.alvoPanX - (vis.cameraPanX || 0)) * Math.min(1, dt * 9);
      if (vis.alvoPanY !== undefined) vis.cameraPanY = (vis.cameraPanY || 0) + (vis.alvoPanY - (vis.cameraPanY || 0)) * Math.min(1, dt * 9);
      if (vis.alvoRotacao !== undefined) vis.rotacaoCamera = (vis.rotacaoCamera || 0) + (vis.alvoRotacao - (vis.rotacaoCamera || 0)) * Math.min(1, dt * 7);
      if (vis.alvoZoom !== undefined) vis.zoomCamera = (vis.zoomCamera || 1.08) + (vis.alvoZoom - (vis.zoomCamera || 1.08)) * Math.min(1, dt * 7);

      R.desenhar(ctx, jogo, vis, cena, dpr, { pausado: pausado && jogo.s.fase === 'combate' });
      atualizarInterface();
    }
    requestAnimationFrame(quadro);
  }

  function processarEventos() {
    jogo.eventos.forEach(function (ev) {
      R.efeito(vis, ev, cena.P);
      if (ev.tipo === 'vitoria') tocarSfx('vitoria');
      if (ev.tipo === 'derrota') tocarSfx('derrota');
      if (ev.tipo === 'vitoria' || ev.tipo === 'derrota') {
        vis.ferramenta = null;
        pausado = false;
        mostrarResultado();
        // um instante para ver a faixa no mapa antes da história
        if (ev.tipo === 'vitoria') setTimeout(function () { if (jogo.s.fase === 'vitoria' && naTela === 'jogo') aoVencerFase(); }, 1800);
      }
      if (ev.tipo === 'disparo') tocarSfx('tiro');
      if (ev.tipo === 'ataqueBarricada' || ev.tipo === 'golpe') tocarSfx('impacto');
      if (ev.tipo === 'barricadaCaiu' && vis.selecionada === ev.id) vis.selecionada = null;
    });
    jogo.eventos.length = 0;
  }

  // ───────────────────────── Ações ─────────────────────────

  function fimDeJogo() { return jogo.s.fase === 'vitoria' || jogo.s.fase === 'derrota'; }

  function avisar(txt) { mensagem = { txt: txt, ate: performance.now() + 2800 }; }

  function escolherFerramenta(tipo) {
    if (fimDeJogo()) return;
    vis.ferramenta = vis.ferramenta === tipo ? null : tipo;
    vis.selecionada = null;
    if (vis.ferramenta) {
      avisar('Modo ' + (tipo === 'atiradores' ? 'Atiradores (60M)' : 'Barricada (25M)') + ': mova o mouse para prévia e alcance');
    }
  }

  function selecionarCampeao() {
    if (fimDeJogo()) return;
    vis.ferramenta = null;
    vis.selecionada = vis.selecionada === 'campeao' ? null : 'campeao';
  }

  function usarHabilidade(nome) {
    var r = N.usarHabilidade(jogo, nome);
    if (!r.ok) avisar(r.motivo);
    else tocarSfx(nome);
  }

  // Esc: primeiro cancela a obra ou a seleção; sem nada para cancelar, abre o menu.
  function cancelar(abrirSeVazio) {
    if (vis.ferramenta) vis.ferramenta = null;
    else if (vis.selecionada) vis.selecionada = null;
    else if (abrirSeVazio) abrirMenu();
  }

  function iniciarOnda() {
    tocarSfx('onda');
    if (N.iniciarOnda(jogo)) { pausado = false; acumulador = 0; }
  }

  function alternarPausa() {
    if (jogo.s.fase === 'combate') { pausado = !pausado; pausaDoMenu = false; }
  }

  function desmontarSelecionada() {
    if (!vis.selecionada || vis.selecionada === 'campeao') return;
    var r = N.desmontar(jogo, vis.selecionada);
    if (r.ok) vis.selecionada = null;
  }

  // ───────────────────────── Entrada ─────────────────────────

  function pontoNaTela(ev) {
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
  }

  function mandarAndar(c) {
    var r = N.moverCampeao(jogo, c.cx, c.cy);
    if (!r.ok) vis.recusa = { x: (c.cx + 0.5) * D.celula, y: (c.cy + 0.5) * D.celula, motivo: r.motivo, t: 1.6 };
  }

  function focarSetor(nome) {
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
    var panArrastou = false;

    tela.addEventListener('pointerdown', function (ev) {
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
      if (ev.button !== 0 || fimDeJogo()) return;
      var toque = ev.pointerType !== 'mouse';
      var mesma = vis.hover && vis.hover.cx === c.cx && vis.hover.cy === c.cy;

      if (vis.ferramenta) {
        var existente = N.estruturaEm(jogo, c.cx, c.cy);
        if (!existente) {
          // No toque não há prévia ao passar o dedo: o primeiro toque mostra, o segundo constrói.
          vis.hover = c;
          if (toque && !mesma) return;
          var resConst = N.construir(jogo, vis.ferramenta, c.cx, c.cy);
          if (resConst && resConst.ok) tocarSfx('construir');
          return;
        }
        vis.ferramenta = null;
        vis.selecionada = existente.id;
        return;
      }

      var obj = R.objetoNaTela(jogo, cena, p.x, p.y);
      if (obj && obj.campeao) { vis.selecionada = 'campeao'; return; }
      if (obj && obj.estrutura) { vis.selecionada = obj.estrutura.id; return; }
      if (vis.selecionada === 'campeao') {
        vis.hover = c;
        if (toque && !mesma) return;
        mandarAndar(c);
        return;
      }
      vis.selecionada = null;
      vis.hover = toque ? null : c;
    });

    tela.addEventListener('pointermove', function (ev) {
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

    // Botões de enquadramento rápido nas retas estratégicas do mapa
    document.querySelectorAll('.bt-foco').forEach(function (b) {
      b.addEventListener('click', function () { focarSetor(b.dataset.foco); });
    });

    document.querySelectorAll('.ferramenta').forEach(function (b) {
      b.addEventListener('click', function () { escolherFerramenta(b.dataset.tipo); });
    });
    $('velocidades').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { velocidade = Number(b.dataset.vel); });
    });
    document.querySelectorAll('.habilidade').forEach(function (b) {
      b.addEventListener('click', function () { usarHabilidade(b.dataset.hab); });
    });
    $('bt-campeao').addEventListener('click', selecionarCampeao);
    $('bt-pausa').addEventListener('click', alternarPausa);
    $('bt-menu').addEventListener('click', function () { abrirMenu(); });
    
    var btc = $('bt-camera');
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
    }

    var slv = $('slider-volume');
    if (slv) {
      slv.addEventListener('input', function () {
        ajustarVolume(Number(slv.value));
      });
    }
    var btm = $('bt-mudo');
    if (btm) btm.addEventListener('click', alternarMudo);

    $('bt-onda').addEventListener('click', iniciarOnda);
    $('selecao').addEventListener('click', function (ev) {
      if (ev.target.closest('[data-acao="desmontar"]')) desmontarSelecionada();
    });
    $('resultado').addEventListener('click', function (ev) {
      if (ev.target.closest('[data-acao="recomecar"]')) tentarFaseDeNovo();
      if (ev.target.closest('[data-acao="menu"]')) abrirMenu();
      if (ev.target.closest('[data-acao="seguir"]')) aoVencerFase();
      if (ev.target.closest('[data-acao="epilogo"]')) {
        abrirHistoria([paginaEpilogo(false)], 'Tentar a fase de novo', tentarFaseDeNovo, [{ rotulo: 'Voltar ao menu', acao: function () { abrirMenu(); } }]);
      }
    });
    $('historia').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hist]');
      if (!b) return;
      seguirHistoria(b.dataset.hist === 'extra' ? Number(b.dataset.i) : undefined);
    });

    // menu e configurações
    $('inicio').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-menu]');
      if (b) acaoDoMenu(b.dataset.menu);
    });
    $('cfg-velocidade').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        config.velocidade = Number(b.dataset.vel);
        velocidade = config.velocidade;
        salvarConfig();
        aplicarConfig();
      });
    });
    [['cfg-alcance', 'alcanceSempre'], ['cfg-movimento', 'reduzirMovimento'], ['cfg-foco', 'pausarOculto']].forEach(function (par) {
      $(par[0]).addEventListener('change', function (ev) {
        config[par[1]] = ev.target.checked;
        salvarConfig();
        aplicarConfig();
      });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && config.pausarOculto && jogo.s.fase === 'combate' && !pausado) pausado = true;
    });

    document.addEventListener('keydown', function (ev) {
      if (HOST && (ev.key === 'F11' || (ev.altKey && ev.key === 'Enter'))) { ev.preventDefault(); pedirAoApp('telaCheia'); return; }
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = ev.key;
      if (naTela === 'historia') {
        if (k === 'Enter' && !(ev.target.closest && ev.target.closest('button'))) { ev.preventDefault(); seguirHistoria(); }
        return;
      }
      if (naTela === 'menu') {
        if (k === 'Escape') {
          if (!$('menu-principal').hidden) { if (partidaEmAndamento()) fecharMenu(); }
          else trocarPainel('principal');
        }
        return;
      }
      if (ev.target.closest && ev.target.closest('input, select, textarea')) return;
      if (k === 'r' || k === 'R') {
        if (ev.shiftKey) {
          vis.rotacaoCamera = 0;
          vis.zoomCamera = 1.0;
          var btc2 = $('bt-camera'); if (btc2) btc2.textContent = '🎥 0°';
          avisar('Câmera: Isométrica clássica (0°)');
        } else {
          vis.rotacaoCamera = -0.4636476;
          vis.zoomCamera = 1.15;
          var btc2 = $('bt-camera'); if (btc2) btc2.textContent = '🎥 Alinhada';
          avisar('Câmera: Alinhada perpendicular à marcha (-26,5°)');
        }
      } else if (k === '1') escolherFerramenta('barricada');
      else if (k === '2') escolherFerramenta('atiradores');
      else if (k === '3') selecionarCampeao();
      else if (k === 'q' || k === 'Q') usarHabilidade('mutirao');
      else if (k === 'w' || k === 'W') usarHabilidade('predica');
      else if (k === 'Escape') cancelar(true);
      else if (k === 'c' || k === 'C') vis.mostrarCobertura = !vis.mostrarCobertura;
      else if (k === 'Delete' || k === 'Backspace') desmontarSelecionada();
      else if (k === ' ') {
        if (ev.target.closest && ev.target.closest('button, summary')) return; // o botão em foco já responde
        ev.preventDefault();
        if (jogo.s.fase === 'preparacao') iniciarOnda(); else alternarPausa();
      }
    });
  }

  // ───────────────────────── Interface ─────────────────────────

  function texto(id, v) {
    if (cache[id] === v) return;
    cache[id] = v;
    $(id).textContent = v;
  }
  function html(id, v) {
    if (cache[id] === v) return;
    cache[id] = v;
    $(id).innerHTML = v;
  }

  function fmt(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }

  var NOMES = {
    infantaria: ['de infantaria', 'de infantaria'], batedor: ['batedor', 'batedores'],
    sapador: ['sapador', 'sapadores'], oficial: ['oficial', 'oficiais']
  };
  function lista(itens) { return itens.length < 2 ? itens.join('') : itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1]; }

  // "10 de infantaria e 3 batedores", e o aviso do tipo que aparece pela primeira vez na fase.
  function descreverOnda(n) {
    var comp = N.composicao(jogo, n), vistos = {};
    for (var i = 0; i < n; i++) N.composicao(jogo, i).forEach(function (g) { vistos[g.tipo] = true; });
    var novos = comp.filter(function (g) { return !vistos[g.tipo] && g.tipo !== 'infantaria'; });
    var txt = lista(comp.map(function (g) { return g.qtd + ' ' + NOMES[g.tipo][g.qtd === 1 ? 0 : 1]; }));
    if (novos.length) txt += '. Novidade: ' + lista(novos.map(function (g) { return '<b>' + D.inimigos[g.tipo].nome.toLowerCase() + '</b>, ' + D.inimigos[g.tipo].resumo; }));
    return txt;
  }

  function avisoDaFase() {
    if (mensagem && performance.now() < mensagem.ate) return '<b>' + mensagem.txt + '</b>';
    mensagem = null;
    var s = jogo.s, total = N.totalDeOndas(jogo), n = s.onda + 1;
    if (s.fase === 'preparacao') {
      var antes = s.onda > 0 ? '<b>Onda ' + s.onda + ' vencida</b> (+' + D.economia.recompensaOnda + '). ' : '';
      return antes + '<b>Onda ' + n + ' de ' + total + '</b>: ' + descreverOnda(s.onda) + '. Construa e inicie a onda.';
    }
    if (s.fase === 'combate') {
      if (pausado) return '<b>Pausado.</b> Espaço ou o botão Continuar retomam o combate.';
      return '<b>Onda ' + n + ' de ' + total + ' em combate.</b> Dá para construir, mas a obra leva alguns segundos.';
    }
    if (s.fase === 'vitoria') return '<b>O arraial resistiu à fase ' + (s.expedicao + 1) + '.</b>';
    return '<b>O arraial caiu na onda ' + n + '.</b> Em vermelho, os trechos da estrada sem atiradores por perto.';
  }

  function atualizarInterface() {
    var s = jogo.s;
    texto('hud-materiais', String(s.materiais));
    var totalOndas = N.totalDeOndas(jogo);
    html('hud-onda', Math.min(s.onda + 1, totalOndas) + ' <small>de ' + totalOndas + '</small>');
    html('hud-fase', (s.expedicao + 1) + ' <small>de ' + D.expedicoes.length + '</small>');
    texto('hud-fase-nome', N.expedicaoAtual(jogo).nome);
    texto('hud-tropas-rotulo', s.fase === 'preparacao' ? 'A caminho' : 'Restantes');
    texto('hud-tropas', String(N.tropasRestantes(jogo)));
    texto('hud-integridade', String(s.integridade));

    var fr = s.integridade / D.objetivo.integridade;
    if (cache.barra !== s.integridade) {
      cache.barra = s.integridade;
      var b = $('hud-barra'), dentro = b.firstElementChild;
      dentro.style.width = (fr * 100) + '%';
      dentro.className = fr > 0.5 ? '' : fr > 0.25 ? 'media' : 'baixa';
      b.setAttribute('aria-valuenow', String(s.integridade));
    }

    html('aviso', avisoDaFase());

    var chaveRitmo = s.fase + pausado + velocidade;
    if (cache.ritmo !== chaveRitmo) {
      cache.ritmo = chaveRitmo;
      $('bt-pausa').disabled = s.fase !== 'combate';
      $('bt-pausa').textContent = pausado ? 'Continuar' : 'Pausar';
      marcarVelocidades($('velocidades'), velocidade);
    }

    var chaveFerr = (vis.ferramenta || '') + s.materiais + s.fase;
    if (cache.ferr !== chaveFerr) {
      cache.ferr = chaveFerr;
      document.querySelectorAll('.ferramenta').forEach(function (bt) {
        var def = D.estruturas[bt.dataset.tipo];
        bt.setAttribute('aria-pressed', String(vis.ferramenta === bt.dataset.tipo));
        bt.classList.toggle('caro', s.materiais < def.custo);
        bt.disabled = fimDeJogo();
      });
      var bo = $('bt-onda');
      bo.disabled = s.fase !== 'preparacao';
      bo.textContent = s.fase === 'combate' ? 'Onda ' + (s.onda + 1) + ' em andamento' : 'Iniciar onda ' + (s.onda + 1);
      tela.style.cursor = vis.ferramenta ? 'crosshair' : 'pointer';
    }

    painelCampeao();
    painelSelecao();
  }

  function painelCampeao() {
    var s = jogo.s, ca = s.campeao;
    $('bt-campeao').setAttribute('aria-pressed', String(vis.selecionada === 'campeao'));
    document.querySelectorAll('.habilidade').forEach(function (bt) {
      var k = bt.dataset.hab, def = D.campeao[k], rec = ca.recargas[k];
      var ativa = k === 'predica' && ca.predica > 0, estado, desabilitado = fimDeJogo();
      if (ativa) { estado = 'ativa, ' + Math.ceil(ca.predica) + ' s'; desabilitado = true; }
      else if (rec > 0) { estado = 'volta em ' + Math.ceil(rec) + ' s'; desabilitado = true; }
      else if (k === 'predica' && s.fase !== 'combate') { estado = 'só no combate'; desabilitado = true; }
      else estado = 'disponível';
      var chave = estado + desabilitado + ativa + (rec / def.recarga).toFixed(2);
      if (cache['hab-' + k] === chave) return;
      cache['hab-' + k] = chave;
      bt.querySelector('.estado').textContent = estado;
      bt.disabled = desabilitado;
      bt.classList.toggle('ativa', ativa);
      bt.style.setProperty('--carga', String(rec / def.recarga));
    });
  }

  function painelSelecao() {
    var s = jogo.s, e = null, conteudo, ativa;
    s.estruturas.forEach(function (x) { if (x.id === vis.selecionada) e = x; });
    if (vis.selecionada && vis.selecionada !== 'campeao' && !e) vis.selecionada = null;

    if (vis.selecionada === 'campeao') {
      var ca = s.campeao, DC = D.campeao, perto = s.estruturas.filter(function (x) {
        return x.tipo === 'atiradores' && N.modificadoresAtirador(jogo, x).aura;
      }).length;
      ativa = true;
      conteudo = '<span class="titulo-sel">Antônio Conselheiro</span>' +
        '<span class="dados">' + (ca.destino ? 'Andando (aura desligada)' : 'Parado') + ' · ' +
        (perto ? perto + (perto === 1 ? ' posição de atiradores' : ' posições de atiradores') + ' na aura' : 'nenhum atirador na aura de ' + DC.aura.raio + ' casas') + '</span>' +
        (fimDeJogo() ? '' : '<span class="dica">Clique numa casa livre fora da estrada (ou use o botão direito) e ele vai andando até lá' +
          (s.fase === 'combate' ? '. No combate anda devagar, e a aura só volta quando ele para.' : '.') + '</span>');
    } else if (!e) {
      ativa = false;
      conteudo = vis.ferramenta
        ? '<span class="dica">' + (vis.ferramenta === 'barricada'
          ? 'As casas tracejadas da estrada aceitam barricada.'
          : 'Os pontos marcam onde cabem atiradores. A elipse mostra o alcance.') +
          ' Botão direito ou Esc cancela.</span>'
        : '<span class="dica">Clique numa estrutura ou no Conselheiro para ver os dados.</span>';
    } else {
      ativa = true;
      var def = D.estruturas[e.tipo], valor = N.valorDesmontar(jogo, e);
      var estado = e.estado === 'construindo' ? 'Em obra, ' + Math.floor(e.progresso * 100) + '%' : 'Pronta';
      var dados;
      if (e.tipo === 'barricada') {
        dados = 'Integridade ' + Math.max(0, Math.ceil(e.vida)) + ' de ' + e.vidaMax +
          (N.barricadaFirme(jogo, e) ? ' · firme pela Prédica' : '');
      } else {
        var mod = N.modificadoresAtirador(jogo, e);
        dados = 'Dano ' + fmt(mod.dano) + ' a cada ' + fmt(mod.intervalo) + ' s · alcance ' + fmt(def.alcance) + ' casas' +
          (mod.aura ? ' · na aura do Conselheiro' : '');
      }
      var rotuloBt = valor === e.custo ? 'Desfazer (+' + valor + ')' : 'Desmontar (+' + valor + ')';
      conteudo = '<span class="titulo-sel">' + (def.nomeLongo || def.nome) + '</span>' +
        '<span class="dados">' + estado + ' · ' + dados + '</span>' +
        (fimDeJogo() ? '' : '<button type="button" data-acao="desmontar">' + rotuloBt + '</button>');
    }
    if (cache.sel !== conteudo) {
      cache.sel = conteudo;
      var el = $('selecao');
      el.innerHTML = conteudo;
      el.classList.toggle('ativa', ativa);
    }
  }

  function mostrarResultado() {
    var s = jogo.s, st = s.stats, el = $('resultado');
    var numeros =
      '<dl class="numeros">' +
      '<div><dt>Tropas detidas</dt><dd>' + st.abatidos + '</dd></div>' +
      '<div><dt>Entraram no arraial</dt><dd>' + st.passaram + '</dd></div>' +
      '<div><dt>Integridade final</dt><dd>' + s.integridade + '</dd></div>' +
      '<div><dt>Materiais gastos</dt><dd>' + st.gastos + '</dd></div>' +
      '</dl>';
    var ultima = s.expedicao >= D.expedicoes.length - 1;
    if (s.fase === 'vitoria') {
      el.innerHTML =
        '<h2>O arraial resistiu à fase ' + (s.expedicao + 1) + '</h2>' +
        '<p class="lead">Belo Monte aguentou as ' + N.totalDeOndas(jogo) + ' ondas' +
        (st.passaram ? ', mas ' + st.passaram + (st.passaram === 1 ? ' tropa entrou' : ' tropas entraram') + ' no arraial.' : ' sem deixar nenhuma tropa entrar.') + '</p>' +
        numeros +
        '<div class="acoes"><button type="button" class="principal" data-acao="seguir">' + (ultima ? 'Ver o fim da história' : 'Ver o que aconteceu') + '</button>' +
        '<button type="button" data-acao="menu">Voltar ao menu</button></div>';
    } else {
      var dg = N.diagnostico(jogo);
      var botoes = '<div class="acoes"><button type="button" class="principal" data-acao="recomecar">Tentar a fase ' + (s.expedicao + 1) + ' de novo</button>' +
        (ultima ? '<button type="button" data-acao="epilogo">Ver o que aconteceu</button>' : '') +
        '<button type="button" data-acao="menu">Voltar ao menu</button></div>';
      el.innerHTML =
        '<h2>O arraial caiu na onda ' + (s.onda + 1) + ' da fase ' + (s.expedicao + 1) + '</h2>' +
        '<p class="lead">' + dg.passaram + ' tropas entraram no arraial, e cada uma tirou ' + dg.danoPorTropa +
        ' de integridade. Os atiradores alcançavam ' + dg.percentual + '% da estrada.</p>' +
        (dg.dicas.length ? '<ul>' + dg.dicas.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' : '') +
        numeros + botoes;
    }
    el.hidden = false;
    $('comandos').hidden = true;
  }

  // Gancho de inspeção para testes (o laço por requestAnimationFrame para em abas ocultas).
  window.__canudos = {
    get jogo() { return jogo; },
    get vis() { return vis; },
    get cena() { return cena; },
    passo: function (segundos) {
      var n = Math.round((segundos || 1) / PASSO);
      for (var i = 0; i < n; i++) avancar(PASSO);
      R.desenhar(ctx, jogo, vis, cena, dpr, { pausado: pausado });
      atualizarInterface();
    }
  };

  var hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(iniciar);
  else iniciar((hot && hot.data) || {});
})();
