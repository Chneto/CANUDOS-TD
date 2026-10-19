// Joga a campanha inteira (4 fases × 10 ondas) com jogadores-robô, para balancear.
// Rodar:  node testes/campanha.js
'use strict';
const D = require('../dados.js');
const N = require('../nucleo.js');

const PASSO = 1 / 60;
const C = D.celula;

function copia() { return JSON.parse(JSON.stringify(D)); }

// Casas livres onde cabem atiradores, da que cobre mais estrada para a que cobre menos.
function melhoresCasas(jogo) {
  const alc = D.estruturas.atiradores.alcance;
  const lista = [];
  for (let y = 0; y < D.linhas; y++) for (let x = 0; x < D.colunas; x++) {
    if (!N.validarTerreno(jogo, 'atiradores', x, y).ok) continue;
    const cobre = jogo.mapa.estrada.filter(c => Math.hypot(c.x - x, c.y - y) <= alc).length;
    lista.push({ x, y, cobre });
  }
  return lista.sort((a, b) => b.cobre - a.cobre);
}

// Robô "bom": atiradores onde cobrem mais estrada, barricadas onde mais atiradores alcançam,
// Conselheiro no meio dos atiradores, habilidades sempre que valem.
function preparaBom(jogo, perfil) {
  const s = jogo.s, alc = D.estruturas.atiradores.alcance;
  for (let guarda = 0; guarda < 40; guarda++) {
    const at = s.estruturas.filter(e => e.tipo === 'atiradores');
    const ba = s.estruturas.filter(e => e.tipo === 'barricada');
    const querBarricada = ba.length < Math.ceil(at.length * perfil.barricadasPorAtirador);
    let feito = false;
    if (querBarricada && s.materiais >= D.estruturas.barricada.custo) {
      // casa de estrada com mais atiradores ao alcance, mais perto do arraial em caso de empate
      let melhor = null;
      jogo.mapa.estrada.forEach((c, i) => {
        if (!N.validarConstrucao(jogo, 'barricada', c.x, c.y).ok) return;
        const k = at.filter(e => Math.hypot(e.cx - c.x, e.cy - c.y) <= alc).length;
        if (k >= 1 && (!melhor || k > melhor.k || (k === melhor.k && i > melhor.i))) melhor = { k, i, c };
      });
      if (melhor) feito = N.construir(jogo, 'barricada', melhor.c.x, melhor.c.y).ok;
    }
    if (!feito && s.materiais >= D.estruturas.atiradores.custo) {
      const casa = melhoresCasas(jogo).find(c => N.validarConstrucao(jogo, 'atiradores', c.x, c.y).ok);
      if (casa) feito = N.construir(jogo, 'atiradores', casa.x, casa.y).ok;
    }
    if (!feito) break;
  }
  // Conselheiro onde a aura pega mais atiradores
  const at = s.estruturas.filter(e => e.tipo === 'atiradores');
  let alvo = null;
  for (let y = 0; y < D.linhas; y++) for (let x = 0; x < D.colunas; x++) {
    if (!N.validarMovimento(jogo, x, y).ok) continue;
    const k = at.filter(e => Math.hypot(e.cx - x, e.cy - y) <= D.campeao.aura.raio).length;
    if (!alvo || k > alvo.k) alvo = { k, x, y };
  }
  if (alvo) N.moverCampeao(jogo, alvo.x, alvo.y);
  for (let i = 0; i < 2000 && s.campeao.destino; i++) N.atualizarHerois(jogo, PASSO);
}

function preparaIngenuo(jogo) {
  if (jogo.s.onda === 0) {
    const casas = melhoresCasas(jogo);
    N.construir(jogo, 'atiradores', casas[0].x, casas[0].y);
    N.construir(jogo, 'atiradores', casas[3].x, casas[3].y);
  }
}

function jogarFase(exp, prepara, perfil) {
  const jogo = N.criarJogo(copia());
  jogo.s = N.estadoInicial(jogo.D, exp);
  const linhas = [];
  while (jogo.s.fase !== 'vitoria' && jogo.s.fase !== 'derrota') {
    prepara(jogo, perfil);
    const antes = jogo.s.integridade;
    N.iniciarOnda(jogo);
    let t = 0;
    while (jogo.s.fase === 'combate' && t < 1200) {
      N.usarHabilidade(jogo, 'mutirao');
      if (jogo.s.inimigos.some(i => i.estado === 'atacando')) N.usarHabilidade(jogo, 'predica');
      N.atualizar(jogo, PASSO); t += PASSO; jogo.eventos.length = 0;
    }
    const at = jogo.s.estruturas.filter(e => e.tipo === 'atiradores').length;
    const ba = jogo.s.estruturas.filter(e => e.tipo === 'barricada').length;
    linhas.push(`${jogo.s.fase === 'derrota' ? 'X' : (antes - jogo.s.integridade ? '-' + (antes - jogo.s.integridade) : '·')}`.padStart(4) +
      `  (${at}A ${ba}B, ${jogo.s.materiais}m)`);
    if (jogo.s.fase === 'derrota') break;
  }
  return { fase: jogo.s.fase, onda: jogo.s.onda + 1, integridade: jogo.s.integridade, linhas };
}

const perfis = {
  bom: { prepara: preparaBom, perfil: { barricadasPorAtirador: 0.5 } },
  'bom, mais barricadas': { prepara: preparaBom, perfil: { barricadasPorAtirador: 1 } },
  'ingênuo (2 atiradores e só)': { prepara: preparaIngenuo, perfil: {} }
};

for (const [nome, p] of Object.entries(perfis)) {
  console.log(`\n■ Robô ${nome}`);
  D.expedicoes.forEach((E, exp) => {
    const r = jogarFase(exp, p.prepara, p.perfil);
    console.log(`  Fase ${exp + 1} (${E.nome}): ${r.fase === 'vitoria' ? 'VENCEU' : 'perdeu na onda ' + r.onda}, integridade ${r.integridade}`);
    if (process.argv.includes('-v')) r.linhas.forEach((l, i) => console.log(`     onda ${String(i + 1).padStart(2)}: ${l}`));
  });
}
