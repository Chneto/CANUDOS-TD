// Simulação sem tela: confere regras e balanceamento da fase 1 (as 4 fases estão em campanha.js).
// Rodar:  node testes/simular.js
'use strict';
const D = require('../dados.js');
const N = require('../nucleo.js');

const PASSO = 1 / 60;

// plano: { [índiceDaOnda]: [[tipo, x, y], ...] } — construções feitas na preparação de cada onda.
// opcoes.campeao: [x, y] para onde levar o Conselheiro antes da 1ª onda.
// opcoes.habilidades: usa Mutirão e Prédica sempre que estiverem prontos (Prédica só com tropa à vista).
function jogar(plano, opcoes = {}) {
  const jogo = N.criarJogo(JSON.parse(JSON.stringify(D)));
  const recusas = [];
  const porOnda = [];
  if (opcoes.campeao) {
    const r = N.moverCampeao(jogo, ...opcoes.campeao);
    if (!r.ok) recusas.push(`campeão em (${opcoes.campeao}): ${r.motivo}`);
    for (let i = 0; i < 3000 && jogo.s.campeao.destino; i++) N.atualizarHerois(jogo, PASSO);
  }
  while (jogo.s.fase !== 'vitoria' && jogo.s.fase !== 'derrota') {
    const o = jogo.s.onda;
    for (const [tipo, x, y] of plano[o] || []) {
      const r = N.construir(jogo, tipo, x, y);
      if (!r.ok) recusas.push(`onda ${o + 1}: ${tipo} em (${x},${y}): ${r.motivo}`);
    }
    N.iniciarOnda(jogo);
    let t = 0;
    while (jogo.s.fase === 'combate' && t < 900) {
      if (opcoes.habilidades) {
        N.usarHabilidade(jogo, 'mutirao');
        if (jogo.s.inimigos.some(i => i.estado === 'atacando')) N.usarHabilidade(jogo, 'predica');
      }
      N.atualizar(jogo, PASSO); t += PASSO; jogo.eventos.length = 0;
    }
    porOnda.push(`onda ${o + 1}: ${t.toFixed(0)}s, integridade ${jogo.s.integridade}, materiais ${jogo.s.materiais}`);
  }
  return { jogo, fase: jogo.s.fase, recusas, porOnda };
}

function resumo(nome, plano, opcoes) {
  const r = jogar(plano, opcoes);
  const st = r.jogo.s.stats;
  console.log(`\n■ ${nome}: ${r.fase.toUpperCase()}`);
  console.log(`  abatidos ${st.abatidos} · passaram ${st.passaram} · barricadas perdidas ${st.barricadasPerdidas} · integridade final ${r.jogo.s.integridade}`);
  r.porOnda.forEach(l => console.log('  ' + l));
  r.recusas.forEach(l => console.log('  recusa → ' + l));
  if (r.fase === 'derrota') N.diagnostico(r.jogo).dicas.forEach(d => console.log('  dica → ' + d));
  return r;
}

// ── 1. Regras básicas ──
let falhas = 0;
function confere(cond, msg) { if (!cond) { falhas++; console.log('  FALHOU: ' + msg); } }
{
  const j = N.criarJogo(D);
  confere(!N.validarConstrucao(j, 'atiradores', 0, 2).ok, 'atiradores na estrada deveriam ser recusados');
  confere(!N.validarConstrucao(j, 'barricada', 7, 7).ok, 'barricada fora da estrada deveria ser recusada');
  confere(!N.validarConstrucao(j, 'barricada', 0, 2).ok, 'barricada na entrada das tropas deveria ser recusada');
  confere(!N.validarConstrucao(j, 'atiradores', 8, 6).ok, 'obstáculo deveria bloquear');
  confere(!N.validarConstrucao(j, 'atiradores', 20, 10).ok, 'arraial deveria bloquear');
  confere(N.construir(j, 'atiradores', 7, 6).ok, 'atiradores em (7,6) deveriam ser aceitos');
  confere(j.s.materiais === 60, 'custo de 60 deveria ser descontado');
  confere(!N.construir(j, 'atiradores', 7, 6).ok, 'célula ocupada deveria ser recusada');
  confere(N.construir(j, 'barricada', 5, 6).ok, 'barricada em (5,6) deveria ser aceita');
  confere(!N.construir(j, 'atiradores', 9, 5).ok, 'sem materiais deveria ser recusado');
  const id = j.s.estruturas[0].id;
  confere(N.desmontar(j, id).valor === 60, 'desfazer no planejamento deveria devolver tudo');
  confere(N.estadoInicial(D).materiais === 120, 'materiais iniciais');
  // campeão
  const k = N.criarJogo(D);
  confere(!N.validarConstrucao(k, 'atiradores', 18, 9).ok, 'não se constrói na casa do Conselheiro');
  confere(!N.moverCampeao(k, 0, 2).ok, 'Conselheiro não vai para a estrada');
  confere(N.moverCampeao(k, 15, 6).ok && k.s.campeao.destino && k.s.campeao.caminho.length > 0, 'na preparação o Conselheiro sai andando');
  for (let i = 0; i < 3000 && k.s.campeao.destino; i++) N.atualizarHerois(k, PASSO);
  confere(k.s.campeao.cx === 15 && k.s.campeao.cy === 6 && !k.s.campeao.destino, 'e chega à casa (15,6) andando');
  confere(!N.moverCampeao(k, 8, 6).ok, 'não vai para cima de um lajedo');
  confere(!N.usarHabilidade(k, 'predica').ok, 'Prédica só no combate');
  confere(!N.usarHabilidade(k, 'mutirao').ok, 'Mutirão sem nada para reparar não gasta a recarga');
  N.construir(k, 'atiradores', 14, 6);
  confere(N.modificadoresAtirador(k, k.s.estruturas[0]).aura, 'atirador a 1 casa deveria estar na aura');
  confere(Math.abs(N.modificadoresAtirador(k, k.s.estruturas[0]).intervalo - 0.96) < 1e-9, 'aura: 1,2 s × 0,8 = 0,96 s');
  N.iniciarOnda(k);
  N.moverCampeao(k, 16, 8);
  confere(!N.modificadoresAtirador(k, k.s.estruturas[0]).aura, 'a aura desliga enquanto ele anda');
  N.construir(k, 'barricada', 17, 6);
  confere(N.usarHabilidade(k, 'predica').ok && N.barricadaFirme(k, k.s.estruturas[1]), 'Prédica deixa a barricada próxima firme');
  console.log(falhas ? `\nRegras: ${falhas} falha(s)` : '\nRegras: ok');
}

// ── 2. Estratégias ──
resumo('Nada construído', {});
resumo('1 atirador bem posto (14,6)', { 0: [['atiradores', 14, 6]] });
resumo('1 atirador mal posto (1,9)', { 0: [['atiradores', 1, 9]] });
resumo('2 atiradores bem postos', { 0: [['atiradores', 14, 6], ['atiradores', 8, 9]] });
resumo('2 atiradores longe da estrada', { 0: [['atiradores', 1, 9], ['atiradores', 21, 7]] });
resumo('Atirador + 2 barricadas no alcance', { 0: [['atiradores', 14, 6], ['barricada', 17, 6], ['barricada', 11, 6]] });
resumo('Atirador + 2 barricadas fora do alcance', { 0: [['atiradores', 14, 6], ['barricada', 5, 5], ['barricada', 5, 7]] });
resumo('Defesa avançada (entrada) e reforço', {
  0: [['atiradores', 3, 4], ['barricada', 5, 4]],
  1: [['atiradores', 8, 9]]
});
resumo('Dois atiradores e barricada na 2ª onda', {
  0: [['atiradores', 14, 6], ['atiradores', 8, 9]],
  1: [['barricada', 11, 7]]
});
resumo('Atirador + barricada, reforço na 2ª onda', {
  0: [['atiradores', 14, 6], ['barricada', 17, 6]],
  1: [['atiradores', 8, 9]]
});

console.log('\n── Com o Conselheiro posicionado e usando as habilidades ──');
resumo('Nada construído, só o Conselheiro', {}, { campeao: [15, 6], habilidades: true });
resumo('1 atirador bem posto + Conselheiro ao lado', { 0: [['atiradores', 14, 6]] }, { campeao: [15, 6], habilidades: true });
resumo('1 atirador + barricada + Conselheiro ao lado', { 0: [['atiradores', 14, 6], ['barricada', 17, 6]] }, { campeao: [15, 6], habilidades: true });
resumo('1 atirador + barricada, Conselheiro esquecido no arraial', { 0: [['atiradores', 14, 6], ['barricada', 17, 6]] }, { habilidades: true });
resumo('2 atiradores + Conselheiro entre eles', { 0: [['atiradores', 14, 6], ['atiradores', 8, 9]] }, { campeao: [12, 9], habilidades: true });

// ── 3. Mapa de calor: um único atirador em cada célula livre, só a 1ª onda ──
{
  const j0 = N.criarJogo(D);
  console.log('\nAbates na 1ª onda com UM atirador em cada célula (· = não constrói, 0–6 = abates):');
  const linhas = [];
  let melhor = { k: -1 };
  for (let y = 0; y < D.linhas; y++) {
    let l = '  ';
    for (let x = 0; x < D.colunas; x++) {
      if (!N.validarTerreno(j0, 'atiradores', x, y).ok) {
        const t = j0.mapa.tipos[y][x];
        l += t === 'estrada' ? '=' : t === 'obstaculo' ? '#' : t === 'arraial' ? 'A' : t === 'rio' ? '~' : '·';
        continue;
      }
      const jogo = N.criarJogo(JSON.parse(JSON.stringify(D)));
      N.construir(jogo, 'atiradores', x, y);
      N.iniciarOnda(jogo);
      let t = 0;
      while (jogo.s.fase === 'combate' && jogo.s.onda === 0 && t < 900) { N.atualizar(jogo, PASSO); t += PASSO; jogo.eventos.length = 0; }
      const k = jogo.s.stats.abatidos;
      if (k > melhor.k) melhor = { k, x, y };
      l += String(k);
    }
    linhas.push(l);
  }
  linhas.forEach(l => console.log(l));
  console.log(`  melhor célula: (${melhor.x},${melhor.y}) com ${melhor.k} abates`);
}

process.exitCode = falhas ? 1 : 0;
