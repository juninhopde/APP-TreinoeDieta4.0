/* ══════════════════════════════════════════════════════════
   CONTROLE 2.0 — Emagrecimento com periodização
   Dados locais. Sem conta, sem servidor, sem anúncio.
   ══════════════════════════════════════════════════════════ */
(function () {
'use strict';

const CHAVE = 'ctrl.v2';
const CHAVE_V1 = 'ctrl.v1';

const REFS = [
  { id: 'cafe',   nome: 'Café da manhã', hora: '07:15' },
  { id: 'almoco', nome: 'Almoço',        hora: '11:30' },
  { id: 'lanche', nome: 'Lanche',        hora: '15:30' },
  { id: 'jantar', nome: 'Jantar',        hora: '19:45' },
  { id: 'extra',  nome: 'Extras',        hora: '—'     }
];

/* Piso de calorias por sexo. Existe porque a reavaliação sugere cortes
   automáticos, e num app aberto ao público cortes encadeados poderiam
   levar alguém a uma ingestão insustentável. */
const PISO_KCAL = { m: 1500, f: 1200 };

/* Autoria e apoio ao projeto */
const AUTOR = {
  nome: 'Mariano',
  desc: 'Desenvolvido e mantido de forma independente, em Bragança Paulista (SP).',
  fone: '5511973829765',
  get wa() { return 'https://wa.me/' + this.fone + '?text=' + encodeURIComponent('Olá! Vi o app Controle e queria falar com você.'); }
};

const PADRAO = {
  versao: 2,
  cfg: {
    nome: '', sexo: 'm', idade: 35, altura: 170,
    pesoInicial: 125, pesoMeta: 95, atividade: 1.35, deficit: 600,
    kcal: 2200, prot: 180, carb: 210, gord: 70,
    autoRecalc: true, aguaMeta: 2400, copoMl: 300,
    descanso: 90, diasTreino: [1,3,5],
    cicloInicio: null, pescoco: null, passosMeta: 9000,
    aceite: false, ritmoAlvo: 0.0075, metaAdaptativa: true, ultimoBackup: null, modeloIA: '',
    intensidade: 'firme', modoCardapio: 'padrao',
    fasePlano: 'perda', faixaManut: null, regraAcao: null, transicaoVista: null,
    iaNome: 'Coach', evitarAlimentos: [], iaProv: 'gemini', iaModelo: '', iaLivre: false,
    tema: 'claro', notifAtivo: false,
    notif: [
      { id:'n1', hora:'07:15', txt:'Café da manhã — 4 ovos + 2 fatias de pão integral', dias:[0,1,2,3,4,5,6] },
      { id:'n2', hora:'10:00', txt:'Água — você já bebeu 1 L?',                          dias:[0,1,2,3,4,5,6] },
      { id:'n3', hora:'11:30', txt:'Almoço — proteína + arroz + feijão + salada',        dias:[0,1,2,3,4,5,6] },
      { id:'n4', hora:'15:30', txt:'Lanche — iogurte ou whey + fruta',                   dias:[0,1,2,3,4,5,6] },
      { id:'n5', hora:'18:30', txt:'Treino — confira a fase da semana no app',           dias:[1,3,5] },
      { id:'n6', hora:'19:45', txt:'Jantar — proteína + legumes + carboidrato',          dias:[0,1,2,3,4,5,6] },
      { id:'n7', hora:'08:00', txt:'Pesagem + medidas de cintura e pescoço, em jejum',   dias:[6] }
    ]
  },
  diario: {}, pesos: [], rotinas: null, sessoes: [], sessaoAtiva: null,
  reavaliacoes: [], custom: [], receitas: [], favoritos: [], recentes: [], memoria: null,
  coach: null, cardapio: null, compras: null, saberProprio: [], ciclos: [], logAgente: []
};

let E = null;

/* ── utilidades ─────────────────────────────────────── */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const br = n => String(n).replace('.', ',');
const SEM = ['dom','seg','ter','qua','qui','sex','sáb'];

function iso(d) {
  d = d || new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function deIso(s) { const p = String(s).split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
function fmtData(s) { return SEM[deIso(s).getDay()]+' '+String(s).slice(8)+'/'+String(s).slice(5,7); }
function diasEntre(a,b) { return Math.round((deIso(b)-deIso(a))/86400000); }
const HOJE = iso();
const horaAgora = () => String(new Date().getHours()).padStart(2,'0') + ':' +
                        String(new Date().getMinutes()).padStart(2,'0');

const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const kcalDe = (p,c,g,alc) => Math.round(p*4 + c*4 + g*9 + (alc||0)*7);
const normalizar = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

function toast(msg, ms) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, ms || 2800);
}
function vibrar(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch(e) {} }
function baixar(nome, conteudo, tipo) {
  const b = new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' });
  const u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

/* ── persistência e migração da v1 ──────────────────── */
function carregar() {
  try { const b = localStorage.getItem(CHAVE); if (b) E = JSON.parse(b); } catch(e) { E = null; }

  if (!E) {
    E = JSON.parse(JSON.stringify(PADRAO));
    try {
      const v1 = localStorage.getItem(CHAVE_V1);
      if (v1) {
        const a = JSON.parse(v1);
        ['diario','pesos','sessoes','custom','receitas','favoritos','recentes'].forEach(k => { if (a[k]) E[k] = a[k]; });
        if (a.rotinas) E.rotinas = a.rotinas;
        if (a.cfg) Object.keys(a.cfg).forEach(k => { if (k in E.cfg) E.cfg[k] = a.cfg[k]; });
        E._migrado = true;
      }
    } catch(e) {}
  }

  E.cfg = Object.assign({}, PADRAO.cfg, E.cfg || {});
  ['diario','pesos','sessoes','reavaliacoes','custom','receitas','favoritos','recentes'].forEach(k => {
    if (!E[k]) E[k] = JSON.parse(JSON.stringify(PADRAO[k]));
  });
  if (!E.rotinas) E.rotinas = JSON.parse(JSON.stringify(ROTINAS_PADRAO));
  if (!E.memoria) E.memoria = memoriaVazia();
  if (!E.coach) E.coach = { concluidas:{}, justificativas:{}, seguranca:[] };
  if (!E.saberProprio) E.saberProprio = [];
  if (!E.ciclos) E.ciclos = [];
  if (!E.logAgente) E.logAgente = [];
  if (!E.cfg.evitarAlimentos) E.cfg.evitarAlimentos = [];
  if (E.cfg.nome && !E.memoria.nome) E.memoria.nome = E.cfg.nome;
  if (!E.cfg.cicloInicio) E.cfg.cicloInicio = E.sessoes.length ? E.sessoes[0].d : HOJE;
  E.versao = 2;
}

let gravarTimer = null;
function gravar() {
  clearTimeout(gravarTimer);
  gravarTimer = setTimeout(() => {
    try { localStorage.setItem(CHAVE, JSON.stringify(E)); }
    catch(e) { toast('Armazenamento cheio. Exporte um backup.', 5000); }
  }, 120);
}
/* ── acessores ──────────────────────────────────────── */
function dia(k) {
  k = k || HOJE;
  if (!E.diario[k]) E.diario[k] = { refs:{}, agua:0 };
  const d = E.diario[k];
  if (!d.refs) d.refs = {};
  if (!d.cardio) d.cardio = [];
  return d;
}
const ordPesos = () => E.pesos.slice().sort((a,b) => a.d < b.d ? -1 : 1);
const pesoAtual = () => E.pesos.length ? ordPesos()[E.pesos.length-1].kg : E.cfg.pesoInicial;

function calcularMetas(kg) {
  const c = E.cfg;
  kg = kg || pesoAtual();
  const tmb = 10*kg + 6.25*c.altura - 5*c.idade + (c.sexo==='m'?5:-161);
  const tdee = tmb * c.atividade;
  const kcal = Math.max(PISO_KCAL[c.sexo] || 1500, Math.round((tdee - c.deficit)/10)*10);
  const ideal = 25 * Math.pow(c.altura/100, 2);
  const ajust = kg > ideal ? ideal + 0.25*(kg-ideal) : kg;
  const prot = Math.round(REF.protAlvo * ajust);
  const gord = Math.round(0.8 * ajust);
  const carb = Math.max(60, Math.round((kcal - prot*4 - gord*9)/4));
  return { tmb:Math.round(tmb), tdee:Math.round(tdee), kcal, prot, carb, gord, ajust:Math.round(ajust) };
}
function aplicarMetas() {
  const m = calcularMetas();
  E.cfg.kcal = m.kcal; E.cfg.prot = m.prot; E.cfg.carb = m.carb; E.cfg.gord = m.gord;
}
/* Soma a caloria gravada em cada item em vez de recalcular de p/c/g:
   bebida alcoólica tem caloria que não aparece nos três macros. */
function somaDia(k) {
  const d = dia(k), s = { p:0,c:0,g:0,kcal:0,itens:0 };
  REFS.forEach(r => (d.refs[r.id]||[]).forEach(i => {
    s.p+=i.p; s.c+=i.c; s.g+=i.g; s.kcal += (i.kcal != null ? i.kcal : kcalDe(i.p,i.c,i.g)); s.itens++;
  }));
  s.kcal = Math.round(s.kcal);
  return s;
}
function somaRef(id, k) {
  const s = { p:0,c:0,g:0,kcal:0 };
  (dia(k).refs[id]||[]).forEach(i => {
    s.p+=i.p; s.c+=i.c; s.g+=i.g; s.kcal += (i.kcal != null ? i.kcal : kcalDe(i.p,i.c,i.g));
  });
  s.kcal = Math.round(s.kcal);
  return s;
}

/* ══ CICLO E PROGRESSÃO ═══════════════════════════════ */
const semanaCiclo = () => Math.floor(diasEntre(E.cfg.cicloInicio, HOJE)/7) + 1;
const faseAtual = () => faseDaSemana(semanaCiclo());
const cicloNum = () => Math.floor((semanaCiclo()-1)/12) + 1;
const semanaNoCiclo = () => ((semanaCiclo()-1) % 12) + 1;

function ultimaSessaoDoEx(nome) {
  for (let i = E.sessoes.length-1; i >= 0; i--) {
    const e = (E.sessoes[i].ex||[]).find(x => x.n === nome);
    if (e && e.series && e.series.length) return { d:E.sessoes[i].d, series:e.series };
  }
  return null;
}

function sugerir(nome, fase) {
  const bib = EXERCICIOS.find(x => x.n === nome) || {};

  // Exercício por tempo (prancha, cardio) ignora a faixa de reps da fase e
  // usa a faixa da própria rotina, que está em segundos ou minutos.
  if (bib.tempo) {
    const cfgEx = ['A','B','C'].map(k => (E.rotinas[k].ex || []).find(x => x.n === nome)).find(Boolean);
    const min = cfgEx ? cfgEx.repMin : 20, max = cfgEx ? cfgEx.repMax : 40;
    const ultT = ultimaSessaoDoEx(nome);
    const antes = ultT ? Math.max(...ultT.series.map(s => +s.reps || 0)) : 0;
    const alvo = antes ? Math.min(max, antes + 5) : min;
    return { kg:null, reps:alvo, tempo:true,
             msg: antes ? 'Última vez: '+antes+'s. Tente '+alvo+'s.' : 'Comece com '+min+'s de sustentação.' };
  }

  const ult = ultimaSessaoDoEx(nome);
  if (!ult) return { kg:null, reps:fase.repMin, msg:'Primeira vez: use uma carga que você faça '+fase.repMax+' com folga.' };

  const val = ult.series.filter(s => s.t !== 'w' && +s.kg > 0 && +s.reps > 0);
  if (!val.length) return { kg:null, reps:fase.repMin, msg:'Sem carga registrada antes.' };

  const cargaAnt = Math.max(...val.map(s => +s.kg));
  const inc = incrementoDe(nome, cargaAnt);

  if (fase.fatorCarga < 1) {
    return { kg: Math.round(cargaAnt*fase.fatorCarga/2.5)*2.5, reps:fase.repMin, deload:true,
             msg:'Deload: '+Math.round(fase.fatorCarga*100)+'% da carga habitual.' };
  }

  const noTopo = val.every(s => +s.reps >= fase.repMax);
  const esforcoOk = val.every(s => s.rir === '' || s.rir == null || +s.rir <= fase.rirAlvo);

  if (noTopo && esforcoOk && inc > 0) {
    return { kg: cargaAnt + inc, reps: fase.repMin, sobe:true,
             msg:'Fechou '+fase.repMax+' em todas. Sobe '+br(inc)+' kg e volta pra '+fase.repMin+'.' };
  }
  if (val.some(s => +s.reps < fase.repMin)) {
    const red = Math.max(2.5, Math.round(cargaAnt*0.08/2.5)*2.5);
    return { kg: Math.max(inc||2.5, cargaAnt-red), reps: fase.repMin, desce:true,
             msg:'Ficou abaixo de '+fase.repMin+' reps. Reduza '+br(red)+' kg e reconstrua.' };
  }
  const alvo = Math.min(fase.repMax, Math.max(...val.map(s => +s.reps)) + 1);
  return { kg: cargaAnt, reps: alvo, msg:'Mesma carga, tente '+alvo+' reps.' };
}

/* ══ COMPOSIÇÃO E REAVALIAÇÃO ═════════════════════════ */
function composicao() {
  const ps = ordPesos();
  if (!ps.length) return null;
  const u = ps[ps.length-1];
  const cint = u.cintura || (ps.filter(p=>p.cintura).slice(-1)[0]||{}).cintura;
  const pesc = u.pescoco || E.cfg.pescoco;
  if (!cint || !pesc) return { kg:u.kg, cintura:cint, faltaMedida:true };
  const bf = gorduraNavy(E.cfg.sexo, E.cfg.altura, cint, pesc);
  if (bf == null) return { kg:u.kg, cintura:cint, faltaMedida:true };
  const gordura = u.kg*bf/100;
  return { kg:u.kg, cintura:cint, pescoco:pesc, bf, gordura, magra:u.kg-gordura, rot:classificar(bf, REF.gorduraFaixa) };
}

function ritmoSemanal(dias) {
  const lim = new Date(); lim.setDate(lim.getDate() - (dias||28));
  const ps = ordPesos().filter(p => deIso(p.d) >= lim);
  if (ps.length < 2) return null;
  const span = diasEntre(ps[0].d, ps[ps.length-1].d);
  if (span < 7) return null;
  const kgSem = (ps[ps.length-1].kg - ps[0].kg)/(span/7);
  return { kgSem, pct: Math.abs(kgSem)/ps[ps.length-1].kg, dias: span };
}

function reavaliacaoDevida() {
  const sem = semanaCiclo();
  if (sem < 4) return null;
  const marco = Math.floor(sem/4)*4;
  if (E.reavaliacoes.some(r => r.semana === marco)) return null;
  const r = ritmoSemanal(28);
  if (!r) return { semana:marco, semDados:true };

  const piso = PISO_KCAL[E.cfg.sexo] || 1500;
  const podeCortar = E.cfg.kcal - 200 >= piso;

  let acao='manter', delta=0, texto;
  if (!podeCortar && (r.kgSem >= 0 || r.pct < REF.ritmoMin)) {
    return { semana:marco, ritmo:r, acao:'manter', delta:0,
      texto:'O ritmo está abaixo do esperado, mas sua meta já está em '+E.cfg.kcal+' kcal, perto do piso de '+piso+'. Cortar mais não é o caminho: aumente gasto (passos, cardio) e leve esse dado a um profissional.' };
  }
  if (r.kgSem >= 0) {
    acao='cortar'; delta=-250;
    texto='O peso não caiu nas últimas 4 semanas. Antes de cortar caloria, confira se o registro está completo — subestimar porção é a causa mais comum.';
  } else if (r.pct < REF.ritmoMin) {
    acao='cortar'; delta=-200;
    texto='Ritmo de '+br((r.pct*100).toFixed(2))+'% por semana, abaixo da faixa de 0,5–1%. Corte 200 kcal ou adicione 1.500 passos por dia.';
  } else if (r.pct > REF.ritmoMax) {
    acao='aumentar'; delta=150;
    texto='Ritmo de '+br((r.pct*100).toFixed(2))+'% por semana, acima de 1%. Perda rápida assim custa massa magra. Adicione 150 kcal, de preferência em carboidrato.';
  } else {
    texto='Ritmo de '+br((r.pct*100).toFixed(2))+'% por semana, dentro da faixa que preserva massa magra. Não mexa em nada.';
  }
  return { semana:marco, ritmo:r, acao, delta, texto };
}

/* ══ CABEÇALHO ════════════════════════════════════════ */
function anelSVG(pct) {
  const R=34, C=2*Math.PI*R, p=Math.min(1,Math.max(0,pct));
  const cor = pct > 1.03 ? '#E0703F' : '#6FBF9B';
  return `<svg viewBox="0 0 84 84" style="width:84px;height:84px" role="img" aria-label="Consumo do dia">
    <circle cx="42" cy="42" r="${R}" fill="none" stroke="#2C3331" stroke-width="9"/>
    <circle cx="42" cy="42" r="${R}" fill="none" stroke="${cor}" stroke-width="9"
      stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/>
    <text x="42" y="46" text-anchor="middle" font-family="ui-monospace,monospace" font-size="17" fill="#E4E5DF">${Math.round(pct*100)}%</text></svg>`;
}
function barra(rot, at, meta, cor) {
  const pct = meta ? (at/meta)*100 : 0;
  return `<div class="macro"><div class="macro-cab"><span>${rot}</span><span><b>${Math.round(at)}</b> / ${meta} g</span></div>
    <div class="trilha"><div class="preenche${pct>100?' estourou':''}" style="width:${Math.min(100,pct).toFixed(1)}%;background:${cor}"></div></div></div>`;
}
function pintarTopo() {
  const c = E.cfg, s = somaDia(), f = faseAtual();
  $('#topo-data').textContent = fmtData(HOJE);
  $('#topo-fase').textContent = (E.memoria && E.memoria.nome ? E.memoria.nome + ' · ' : '') + 'Ciclo '+cicloNum()+' · sem '+semanaNoCiclo()+'/12 · '+f.nome;
  const fx = faixaAtual();
  $('#topo-tit').innerHTML = fx
    ? `${br(pesoAtual().toFixed(1))} <em>manter ${br(fx.min.toFixed(1))}–${br(fx.max.toFixed(1))}</em>`
    : `${br(pesoAtual().toFixed(1))} <em>→ ${c.pesoMeta} kg</em>`;
  $('#anel').innerHTML = anelSVG(s.kcal/c.kcal);
  const rest = c.kcal - s.kcal;
  $('#kcal-rest').textContent = (rest<0?'+':'') + Math.abs(rest);
  $('#kcal-rest').style.color = rest<0 ? '#E0703F' : '';
  $('#kcal-sub').textContent = `${s.kcal} consumidas · meta ${c.kcal}`;
  $('#barras').innerHTML = barra('Proteína',s.p,c.prot,'var(--prot)')
    + barra('Carboidrato',s.c,c.carb,'var(--carb)') + barra('Gordura',s.g,c.gord,'var(--gord)');
}

/* ══ TELA HOJE ════════════════════════════════════════ */
function aderencia7() {
  let n=0; const d = new Date();
  for (let i=0;i<7;i++) {
    const k = iso(d), s = E.diario[k] ? somaDia(k) : null;
    if (s && s.kcal>0 && s.kcal <= E.cfg.kcal*1.05 && s.p >= E.cfg.prot*0.85) n++;
    d.setDate(d.getDate()-1);
  }
  return n;
}



/* ══ JEJUM ════════════════════════════════════════════ */
function ctxJejum() {
  const agora = new Date();
  return jejumDoDia(HOJE, k => E.diario[k], REFS, agora.getHours()*60 + agora.getMinutes());
}

function blocoJejum() {
  const j = ctxJejum();
  const dias = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate()-i); dias.push(iso(d)); }
  const serie = serieJejum(dias, k => E.diario[k], REFS);
  const media = serie.length ? serie.reduce((t,x)=>t+x.v,0)/serie.length : null;
  const leitura = lerJejum(j.noturno != null ? j.noturno/60 : media);

  if (!j.refeicoes && !serie.length) {
    return `<div class="bloco jejum"><div class="bloco-tit"><span>Jejum</span><b>sem dados</b></div>
      <p class="nota" style="margin:0">Registre suas refeições e o app calcula sozinho o jejum noturno e a
      janela de alimentação, pelo horário real em que você comeu — sem você configurar nada.</p></div>`;
  }

  return `<div class="bloco jejum"><div class="bloco-tit"><span>Jejum</span>
      ${leitura ? `<b>${esc(leitura.rot)}</b>` : ''}</div>
    <div class="grade3">
      <div><div class="kpi-num">${fmtDur(j.atual)}</div><div class="kpi-rot">Em jejum agora</div></div>
      <div><div class="kpi-num">${fmtDur(j.noturno)}</div><div class="kpi-rot">Jejum noturno</div></div>
      <div><div class="kpi-num">${fmtDur(j.janela)}</div><div class="kpi-rot">Janela de comida</div></div>
    </div>
    ${j.ultima ? `<p class="nota" style="margin-top:9px">Última refeição às <b>${j.ultima}</b>${j.primeira && j.refeicoes>1 ? `, primeira às ${j.primeira}` : ''}${j.ultimaAnt ? ` · ontem você fechou às ${j.ultimaAnt}` : ''}.</p>` : ''}
    ${serie.length >= 2 ? `<div style="margin-top:8px">${grafLinha(serie.map(x=>({v:x.v,d:x.d})), { rot:'Jejum noturno' })}
      <div class="legenda"><span><i style="background:var(--frio)"></i>horas de jejum noturno</span>
        <span>média ${media.toFixed(1).replace('.',',')} h</span></div></div>` : ''}
    ${leitura ? `<p class="nota">${esc(leitura.txt)}</p>` : ''}
    ${j.estimado ? `<p class="nota"><b>Parte estimada:</b> alguns itens foram registrados antes desta versão e
      não têm hora gravada — para eles usei o horário padrão da refeição. Os próximos registros gravam a hora real.</p>` : ''}
  </div>`;
}

/* Badge do ícone flutuante: número de pontos críticos. Ícone
   sem informação vira enfeite que ninguém toca. */
function atualizarFab() {
  const fab = $('#fab-ia');
  if (!fab) return;
  let n = 0;
  try { n = diagnosticar(ctxDiag()).filter(a => a.sev === 'critico').length; } catch (e) {}
  fab.setAttribute('data-n', n > 0 ? String(n) : '');
  fab.classList.toggle('alerta-fab', n > 0);
}

/* ══ MISSÃO DO DIA ════════════════════════════════════ */
function ctxMissao() {
  const hojeCoach = E.coach.concluidas[HOJE] || [];
  const dt = new Date().getDay();
  const ultPeso = E.pesos.length ? ordPesos()[E.pesos.length-1].d : null;
  return {
    hoje: HOJE, cfg: E.cfg, dia: dia(), REFS,
    concluidas: hojeCoach,
    justificativas: E.coach.justificativas[HOJE] || {},
    sessoesHoje: E.sessoes.filter(s => s.d === HOJE).length,
    ehDiaDeTreino: (E.cfg.diasTreino || [1,3,5]).includes(dt),
    rotinaProx: proximaRotina(),
    fase: faseAtual(),
    pesagemDevida: !ultPeso || diasEntre(ultPeso, HOJE) >= 7
  };
}

function aderencia7d() {
  const st = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = iso(d), reg = E.diario[k];
    if (!reg) { st.push(0); continue; }
    let n = 0, tot = 4;
    REFS.slice(0,4).forEach(r => { if ((reg.refs[r.id]||[]).length) n++; });
    const treinou = E.sessoes.some(s => s.d === k);
    if ((E.cfg.diasTreino||[1,3,5]).includes(new Date(k+'T12:00').getDay())) { tot++; if (treinou) n++; }
    st.push(n/tot);
  }
  return aderencia(st);
}

function blocoMissao() {
  const tarefas = missaoDoDia(ctxMissao());
  const faseP = FASES_PLANO[E.cfg.fasePlano] || FASES_PLANO.perda;
  const rgm = estadoReganhoAtual();
  const ad = aderencia7d();
  const trava = travaCobranca(E.coach.seguranca);
  const cb = cobrar(tarefas, E.cfg.intensidade, E.memoria.nome,
    trava ? { bloqueia:true, mensagem:'Cobrança suspensa por segurança. ' + String(trava.mensagem||'').split('\n')[0] } : null);
  const feitas = tarefas.filter(t => t.status === 'concluida').length;
  const ICO = { concluida:'✓', pendente:'○', perdida:'!', reagendada:'→' };

  /* Em manutenção o coach muda de alvo: cobra pesagem e faixa,
     não déficit. Cobrar déficit de quem já chegou é o caminho
     mais curto para a pessoa largar o app. */
  let msg = cb.txt;
  if (E.cfg.fasePlano === 'manutencao' && rgm) {
    if (rgm.nivel === 'dentro')
      msg = `${E.memoria.nome || 'Chefe'}, dentro da faixa. Manter é mais difícil que perder — e você está mantendo.`;
    else if (rgm.nivel === 'amarelo' || rgm.nivel === 'laranja' || rgm.nivel === 'vermelho')
      msg = `${E.memoria.nome || 'Chefe'}, a tendência saiu da faixa. ${rgm.txt}`;
  }

  return `<div class="bloco missao"><div class="bloco-tit"><span>Missão do dia</span>
      <b>${feitas}/${tarefas.length}</b></div>
    <div class="fase-chip fb-${faseP.cor}">${esc(faseP.rot)}</div>
    <div class="coach-msg">${fmtMd(msg)}</div>
    ${cb.pedirJustificativa ? `<div class="causas">
      <div class="causas-tit">O que aconteceu?</div>
      ${CAUSAS.map(c=>`<button type="button" class="causa" data-causa="${cb.pedirJustificativa}|${c.id}">${esc(c.rot)}</button>`).join('')}
    </div>` : ''}
    ${tarefas.map(t=>`<div class="tarefa ${t.status}">
      <button type="button" class="tar-ck" data-tarefa="${esc(t.id)}" aria-label="Concluir ${esc(t.titulo)}">${ICO[t.status]}</button>
      <span class="tar-txt"><b>${esc(t.titulo)}</b><small>${esc(t.detalhe||'')}${t.motivo?' · '+esc((CAUSAS.find(c=>c.id===t.motivo)||{}).rot||t.motivo):''}</small></span>
      ${t.hora?`<span class="tar-h">${t.hora}</span>`:''}</div>`).join('')}
    <div class="aderencia"><span>Aderência 7 dias</span>
      <b class="ad-${ad.rot.toLowerCase().replace(/[^a-z]/g,'')}">${ad.pct}% · ${ad.rot}</b>
      ${ad.tend ? `<span class="ad-tend">${ad.tend>0?'▲':'▼'} ${Math.abs(ad.tend)} pts</span>` : ''}</div>
  </div>`;
}

function pintarHoje() {
  const d = dia(), c = E.cfg;
  let h = '';

  h += blocoMissao();

  const rv = reavaliacaoDevida();
  if (rv) {
    h += `<div class="alerta"><div class="alerta-tit">Reavaliação da semana ${rv.semana}</div>
      <p>${rv.semDados ? 'Faltam pesagens das últimas 4 semanas para avaliar o ritmo. Registre o peso na aba Progresso.' : esc(rv.texto)}</p>
      ${rv.semDados ? '' : `<div class="linha-flex">
        ${rv.delta ? `<button type="button" class="btn mini" data-reav="aplicar">${rv.delta<0?'Cortar':'Adicionar'} ${Math.abs(rv.delta)} kcal</button>`:''}
        <button type="button" class="btn vazado mini" data-reav="manter">${rv.delta?'Manter':'Entendi'}</button></div>`}</div>`;
  }

  h += `<button type="button" class="btn foto-btn" id="ler-codigo">
    <svg viewBox="0 0 24 24"><path d="M3 5v14M6 5v14M9 5v14M13 5v14M16 5v14M19 5v14M21 5v14"/></svg>
    Escanear código de barras</button>`;

  REFS.forEach(r => {
    const itens = d.refs[r.id]||[], sr = somaRef(r.id);
    h += `<article class="refeicao${itens.length?' tem-item':''}">
      <div class="ref-cab"><div class="ref-esq"><div class="ref-hora">${r.hora}</div><div class="ref-nome">${r.nome}</div></div>
      <div class="ref-kcal">${sr.kcal} kcal<small>P ${Math.round(sr.p)} · C ${Math.round(sr.c)} · G ${Math.round(sr.g)}</small></div></div>`;
    if (itens.length) {
      h += '<div class="ref-itens">' + itens.map((i,idx) => `<div class="item">
        <div class="item-nome"><b>${esc(i.n)}</b><small>${i.u==='g'?br(i.q)+' g':br(i.q)+' × '+esc(i.u)}${i.h?' · '+i.h:''}${i.off?' · rótulo':''}</small></div>
        <div class="item-dir">${i.kcal}
          <button type="button" class="item-troca" data-troca-al="${r.id}:${idx}" aria-label="Substituir">⇄</button>
          <button type="button" class="item-x" data-rm="${r.id}:${idx}" aria-label="Remover">×</button></div></div>`).join('') + '</div>';
    }
    h += `<button type="button" class="ref-add" data-add="${r.id}">+ adicionar alimento</button></article>`;
  });

  const copos = Math.ceil(c.aguaMeta/c.copoMl);
  h += `<div class="bloco"><div class="bloco-tit"><span>Água</span>
    <b>${br(((d.agua*c.copoMl)/1000).toFixed(1))} L / ${br((c.aguaMeta/1000).toFixed(1))} L</b></div><div class="copos">`;
  for (let i=1;i<=copos;i++) h += `<button type="button" class="copo" data-copo="${i}" aria-pressed="${d.agua>=i}" aria-label="Copo ${i}"></button>`;
  h += '</div></div>';

  const kcalCardio = (d.cardio||[]).reduce((t,x)=>t+x.kcal,0);
  h += `<div class="bloco"><div class="bloco-tit"><span>Atividade</span><b>${d.passos||0} / ${c.passosMeta}</b></div>
    <div class="linha-flex" style="margin-bottom:8px">
      <input type="number" id="in-passos" inputmode="numeric" placeholder="passos de hoje" value="${d.passos||''}">
      <button type="button" class="btn mini" id="btn-passos">Salvar</button></div>`;
  if ((d.cardio||[]).length) {
    h += d.cardio.map((x,i)=>`<div class="hist"><div class="hist-esq"><b>${esc(x.n)}</b>${x.min} min</div>
      <div class="item-dir">${x.kcal} kcal<button type="button" class="item-x" data-rm-cardio="${i}" aria-label="Remover">×</button></div></div>`).join('');
    h += `<p class="nota">${kcalCardio} kcal em cardio. <b>Não somei ao seu orçamento de propósito</b> —
      contar o gasto do exercício é onde quase todo mundo apaga o próprio déficit sem perceber.</p>`;
  }
  h += '<button type="button" class="btn vazado mini" id="add-cardio" style="margin-top:7px">+ registrar cardio</button></div>';

  h += blocoJejum();

  h += `<div class="grade3">
    <div class="bloco"><div class="kpi-num">${aderencia7()}<small>/7</small></div><div class="kpi-rot">Dias na meta</div></div>
    <div class="bloco"><div class="kpi-num">${E.sessoes.filter(s=>diasEntre(s.d,HOJE)<7).length}<small>/3</small></div><div class="kpi-rot">Treinos 7d</div></div>
    <div class="bloco"><div class="kpi-num">${Math.round((d.agua*c.copoMl/c.aguaMeta)*100)}<small>%</small></div><div class="kpi-rot">Hidratação</div></div></div>`;

  h += `<div class="linha-flex" style="margin-bottom:10px">
    <button type="button" class="btn vazado mini" id="copiar-ontem">Copiar ontem</button>
    <button type="button" class="btn vazado mini" id="ir-pesagem">Registrar peso</button></div>
    <p class="assinatura">Controle · por <b>${esc(AUTOR.nome)}</b> ·
      <a href="${AUTOR.wa}" target="_blank" rel="noopener">apoiar o projeto</a></p>`;

  $('#tela-hoje').innerHTML = h;
}

/* ══ GAVETA ═══════════════════════════════════════════ */
function abrirGaveta(titulo, html) {
  document.body.classList.add('gaveta-on');
  const antigo = $('#gaveta-corpo'), novo = antigo.cloneNode(false);
  antigo.replaceWith(novo);
  novo.innerHTML = html;
  $('#gaveta-tit').textContent = titulo;
  $('#fundo').hidden = false;
}
const fecharGaveta = () => { $('#fundo').hidden = true; document.body.classList.remove('gaveta-on'); };

let refAlvo = 'cafe', filtroCat = 'Tudo';
const baseCompleta = () => ALIMENTOS.concat(E.custom.map(a => Object.assign({}, a, { custom:true })));

function abrirBusca(refId) {
  refAlvo = refId; filtroCat = 'Tudo';
  const cats = ['Tudo','Favoritos','Recentes','Receitas'].concat([...new Set(ALIMENTOS.map(a=>a.cat))]);
  abrirGaveta('Adicionar em '+REFS.find(r=>r.id===refId).nome, `
    <input type="text" id="q" placeholder="Buscar alimento…" autocomplete="off" style="margin-bottom:9px">
    <div class="chips" id="chips">${cats.map(c=>`<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c==='Tudo'}">${esc(c)}</button>`).join('')}</div>
    <ul class="res" id="res"></ul>
    <button type="button" class="btn vazado mini" id="novo-alimento" style="margin-top:12px">Cadastrar alimento novo</button>`);
  listar('');
}

function listar(q) {
  q = normalizar(q||'');
  let base;
  if (filtroCat==='Favoritos')     base = baseCompleta().filter(a=>E.favoritos.includes(a.n));
  else if (filtroCat==='Recentes') base = E.recentes.map(n=>baseCompleta().find(a=>a.n===n)).filter(Boolean);
  else if (filtroCat==='Receitas') base = E.receitas.map(r=>({ n:r.n, receita:r }));
  else if (filtroCat==='Tudo')     base = baseCompleta();
  else                             base = baseCompleta().filter(a=>a.cat===filtroCat);
  if (q) base = base.filter(a => normalizar(a.n).includes(q));
  base = base.slice(0,60);

  if (!base.length) { $('#res').innerHTML = '<li><div class="vazio">Nada encontrado. Cadastre abaixo.</div></li>'; return; }
  $('#res').innerHTML = base.map(a => a.receita
    ? `<li><button type="button" data-receita="${esc(a.receita.n)}"><span><b>${esc(a.receita.n)}</b><small>receita</small></span></button></li>`
    : `<li><button type="button" data-alim="${esc(a.n)}">
        <span><b>${E.favoritos.includes(a.n)?'<span class="marca-fav">★</span> ':''}${esc(a.n)}</b>
        <small>${esc(a.cat)}${a.custom?' · meu':''} · P${a.p} C${a.c} G${a.g} /100g</small></span>
        <span class="res-k">${kcalDe(a.p,a.c,a.g,a.alc)}</span></button></li>`).join('');
}

function abrirPorcao(nome) {
  const a = baseCompleta().find(x=>x.n===nome);
  if (!a) return;
  const temUn = !!a.un;
  abrirGaveta(a.n, `
    <div class="bloco"><div class="bloco-tit"><span>Por 100 g</span><b>${kcalDe(a.p,a.c,a.g,a.alc)} kcal</b></div>
      <div class="grade3">
        <div><div class="kpi-num">${a.p}<small>g</small></div><div class="kpi-rot">Proteína</div></div>
        <div><div class="kpi-num">${a.c}<small>g</small></div><div class="kpi-rot">Carbo</div></div>
        <div><div class="kpi-num">${a.g}<small>g</small></div><div class="kpi-rot">Gordura</div></div></div></div>
    <label class="campo"><span>Quantidade</span><div class="linha-flex">
      <input type="number" id="qtd" value="${temUn?1:100}" step="any" min="0" inputmode="decimal">
      <select id="un" style="flex:0 0 42%"><option value="g">gramas</option>
      ${temUn?`<option value="un" selected>${esc(a.unNome)} (${a.un} g)</option>`:''}</select></div></label>
    <div class="bloco" id="previa"></div>
    <div class="linha-flex"><button type="button" class="btn" id="confirmar" style="flex:1">Adicionar</button>
      <button type="button" class="btn vazado" id="favoritar">${E.favoritos.includes(a.n)?'★':'☆'}</button></div>`);

  const calc = () => {
    const q = parseFloat($('#qtd').value)||0;
    const gr = $('#un').value==='un' ? q*a.un : q, f = gr/100;
    return { q, gr, p:+(a.p*f).toFixed(1), c:+(a.c*f).toFixed(1), g:+(a.g*f).toFixed(1),
             alc:+((a.alc||0)*f).toFixed(1) };
  };
  const previa = () => {
    const v = calc();
    $('#previa').innerHTML = `<div class="bloco-tit"><span>Vai entrar</span><b>${kcalDe(v.p,v.c,v.g,v.alc)} kcal</b></div>
      <div style="font-family:var(--mono);font-size:13px">P ${br(v.p)} · C ${br(v.c)} · G ${br(v.g)} · ${Math.round(v.gr)} g</div>
      ${v.alc ? `<div class="nota" style="margin:6px 0 0">Inclui ${br(v.alc)} g de álcool (${Math.round(v.alc*7)} kcal), que não entram em nenhum macro.</div>` : ''}`;
  };
  previa();
  $('#qtd').addEventListener('input', previa);
  $('#un').addEventListener('change', previa);
  $('#favoritar').addEventListener('click', () => {
    const i = E.favoritos.indexOf(a.n);
    if (i>=0) E.favoritos.splice(i,1); else E.favoritos.push(a.n);
    gravar(); $('#favoritar').textContent = E.favoritos.includes(a.n)?'★':'☆';
  });
  $('#confirmar').addEventListener('click', () => {
    const v = calc();
    if (v.gr <= 0) return;
    const d = dia();
    if (!d.refs[refAlvo]) d.refs[refAlvo] = [];
    const reg = { n:a.n, q:v.q, u:$('#un').value==='un'?a.unNome:'g',
      p:v.p, c:v.c, g:v.g, kcal:kcalDe(v.p,v.c,v.g,v.alc), h: horaAgora() };
    if (v.alc) reg.alc = v.alc;
    if (a.codigo) reg.off = true;
    d.refs[refAlvo].push(reg);
    E.recentes = [a.n].concat(E.recentes.filter(x=>x!==a.n)).slice(0,20);
    gravar(); fecharGaveta(); pintarTopo(); pintarHoje(); vibrar(18);
  });
}

function abrirNovoAlimento() {
  abrirGaveta('Cadastrar alimento', `
    <label class="campo"><span>Nome</span><input type="text" id="na-n" placeholder="Ex.: Marmita da Vyttra"></label>
    <p class="nota" style="margin:0 0 10px">Valores <b>por 100 g</b>, como no rótulo.</p>
    <div class="grade3">
      <label class="campo"><span>Prot</span><input type="number" id="na-p" step="any" inputmode="decimal"></label>
      <label class="campo"><span>Carb</span><input type="number" id="na-c" step="any" inputmode="decimal"></label>
      <label class="campo"><span>Gord</span><input type="number" id="na-g" step="any" inputmode="decimal"></label></div>
    <div class="linha-flex">
      <label class="campo" style="flex:1"><span>1 porção (g)</span><input type="number" id="na-un" step="any" inputmode="decimal"></label>
      <label class="campo" style="flex:1"><span>Nome da porção</span><input type="text" id="na-unn" placeholder="unidade"></label></div>
    <button type="button" class="btn" id="na-salvar">Salvar alimento</button>`);
  $('#na-salvar').addEventListener('click', () => {
    const n = $('#na-n').value.trim();
    if (!n) { $('#na-n').focus(); return; }
    const novo = { n, cat:'Meus alimentos', p:+(parseFloat($('#na-p').value)||0),
      c:+(parseFloat($('#na-c').value)||0), g:+(parseFloat($('#na-g').value)||0) };
    const un = parseFloat($('#na-un').value);
    if (un>0) { novo.un = un; novo.unNome = $('#na-unn').value.trim()||'porção'; }
    E.custom.push(novo); gravar(); abrirPorcao(n);
  });
}

/* ── substituição por equivalente ───────────────────── */
function abrirSubstituicao(refId, idx) {
  const it = dia().refs[refId][idx];
  const base = baseCompleta().find(a=>a.n===it.n);
  const cands = baseCompleta().filter(a=>a.n!==it.n).map(a => {
    const k100 = kcalDe(a.p,a.c,a.g,a.alc);
    if (k100 <= 0) return null;
    const gr = (it.kcal/k100)*100;
    if (gr < 5 || gr > 1200) return null;
    const prot = a.p*gr/100;
    const dif = Math.abs(prot-it.p)/Math.max(1,it.p);
    if (dif > 0.35) return null;
    return { a, gr, prot, dif, mesmaCat: base && a.cat===base.cat };
  }).filter(Boolean).sort((x,y)=>(y.mesmaCat-x.mesmaCat)||(x.dif-y.dif)).slice(0,12);

  abrirGaveta('Substituir '+it.n, `
    <div class="bloco"><div class="bloco-tit"><span>Item atual</span><b>${it.kcal} kcal</b></div>
      <div style="font-family:var(--mono);font-size:13px">${esc(it.n)} · P ${br(it.p)} g</div>
      <p class="nota">Cada opção já vem com a gramagem que <b>iguala a caloria</b>, mantendo a proteína dentro de 35%.
      Mesma categoria aparece primeiro.</p></div>
    ${cands.length ? `<ul class="res">${cands.map((x,i)=>`<li><button type="button" data-sub="${i}">
      <span><b>${esc(x.a.n)}</b><small>${Math.round(x.gr)} g · P ${br(x.prot.toFixed(1))} g · ${esc(x.a.cat)}</small></span>
      <span class="res-k">${Math.round(kcalDe(x.a.p*x.gr/100, x.a.c*x.gr/100, x.a.g*x.gr/100, (x.a.alc||0)*x.gr/100))}</span></button></li>`).join('')}</ul>`
      : '<div class="vazio">Nenhum equivalente próximo na base.</div>'}`);

  $('#gaveta-corpo').addEventListener('click', ev => {
    const b = ev.target.closest('[data-sub]');
    if (!b) return;
    const x = cands[+b.dataset.sub], f = x.gr/100;
    const novo = { n:x.a.n, q:Math.round(x.gr), u:'g',
      p:+(x.a.p*f).toFixed(1), c:+(x.a.c*f).toFixed(1), g:+(x.a.g*f).toFixed(1),
      kcal:kcalDe(x.a.p*f, x.a.c*f, x.a.g*f, (x.a.alc||0)*f), h: it.h || horaAgora() };
    if (x.a.alc) novo.alc = +((x.a.alc)*f).toFixed(1);
    dia().refs[refId][idx] = novo;
    gravar(); fecharGaveta(); pintarTopo(); pintarHoje(); toast('Trocado por '+x.a.n);
  });
}


/* ══ CÓDIGO DE BARRAS ═════════════════════════════════ */
let leitor = null;

function abrirScanner() {
  const temCam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && temDetector();
  abrirGaveta('Escanear produto', `
    <label class="campo"><span>Adicionar em</span><select id="bc-ref">
      ${REFS.map(r=>`<option value="${r.id}"${r.id===refAlvo?' selected':''}>${r.nome}</option>`).join('')}</select></label>
    ${temCam ? `<div class="scanner"><video id="bc-video" muted playsinline></video><div class="mira"></div></div>
      <p class="nota" id="bc-status">Aponte para o código de barras da embalagem.</p>` :
      `<div class="alerta ocre"><div class="alerta-tit">Câmera indisponível</div>
       <p>Este navegador não tem leitor de código de barras nativo. Digite o número impresso abaixo do código —
       funciona igual.</p></div>`}
    <label class="campo" style="margin-top:10px"><span>Ou digite o código</span>
      <div class="linha-flex"><input type="number" id="bc-num" inputmode="numeric" placeholder="7891000000000">
      <button type="button" class="btn mini" id="bc-buscar">Buscar</button></div></label>
    <button type="button" class="btn vazado mini" id="bc-nome">Buscar por nome no banco de produtos</button>
    <p class="nota">Consulta o Open Food Facts, banco público e gratuito. O que você escanear fica salvo
    aqui e passa a funcionar sem internet.</p>`);

  const fim = () => { if (leitor) { leitor.encerrar(); leitor = null; } };
  $('#gaveta-x').addEventListener('click', fim, { once: true });
  $('#fundo').addEventListener('click', ev => { if (ev.target.id === 'fundo') fim(); }, { once: true });

  if (temCam) {
    leitor = criarLeitor($('#bc-video'),
      cod => { fim(); buscarCodigo(cod); },
      err => { const st = $('#bc-status'); if (st) st.textContent = err.message === 'sem-detector'
        ? 'Leitor nativo indisponível. Use a digitação abaixo.' : err.message; });
    leitor.iniciar();
  }

  $('#gaveta-corpo').addEventListener('click', ev => {
    if (ev.target.id === 'bc-buscar') {
      const c = ($('#bc-num').value || '').trim();
      if (!/^\d{8,14}$/.test(c)) { toast('Código deve ter de 8 a 14 dígitos.'); return; }
      refAlvo = $('#bc-ref').value; fim(); buscarCodigo(c);
    }
    if (ev.target.id === 'bc-nome') { refAlvo = $('#bc-ref').value; fim(); buscarNomeOFF(); }
  });
  $('#gaveta-corpo').addEventListener('change', ev => {
    if (ev.target.id === 'bc-ref') refAlvo = ev.target.value;
  });
}

async function buscarCodigo(cod) {
  abrirGaveta('Consultando', '<div class="carregando"><div class="spin"></div><p>Procurando o produto…</p></div>');
  try {
    const a = await ofPorCodigo(cod);
    salvarEscaneado(a);
    abrirPorcao(a.n);
    toast('Produto encontrado: ' + a.n);
  } catch (err) {
    abrirGaveta('Não encontrei', `<div class="alerta ocre"><div class="alerta-tit">${esc(cod)}</div>
      <p>${esc(err.message)}</p></div>
      <p class="nota">Bancos abertos dependem de quem cadastra. Se o produto não estiver lá, o cadastro manual
      leva meia dúzia de campos e vale para sempre.</p>
      <button type="button" class="btn" id="bc-manual">Cadastrar manualmente</button>`);
    $('#gaveta-corpo').addEventListener('click', e => {
      if (e.target.id === 'bc-manual') abrirNovoAlimento();
    });
  }
}

async function buscarNomeOFF() {
  abrirGaveta('Buscar no banco de produtos', `
    <div class="linha-flex" style="margin-bottom:9px">
      <input type="text" id="off-q" placeholder="Ex.: whey max titanium" autocomplete="off">
      <button type="button" class="btn mini" id="off-go">Buscar</button></div>
    <ul class="res" id="off-res"></ul>
    <p class="nota">Resultados do Open Food Facts. Confira sempre os macros contra o rótulo —
    o banco é alimentado por voluntários e o produto pode ter mudado de fórmula.</p>`);

  let achados = [];
  async function ir() {
    const q = ($('#off-q').value || '').trim();
    if (q.length < 3) { toast('Digite pelo menos 3 letras.'); return; }
    $('#off-res').innerHTML = '<li><div class="carregando"><div class="spin"></div><p>Buscando…</p></div></li>';
    try {
      achados = await ofPorNome(q);
      $('#off-res').innerHTML = achados.length
        ? achados.map((a,i) => `<li><button type="button" data-off="${i}">
            <span><b>${esc(a.n)}</b><small>P${a.p} C${a.c} G${a.g} /100g${a.un?' · porção '+a.un+' g':''}</small></span>
            <span class="res-k">${kcalDe(a.p,a.c,a.g,a.alc)}</span></button></li>`).join('')
        : '<li><div class="vazio">Nada encontrado com tabela nutricional preenchida.</div></li>';
    } catch (err) {
      $('#off-res').innerHTML = `<li><div class="vazio">${esc(err.message)}</div></li>`;
    }
  }
  $('#off-go').addEventListener('click', ir);
  $('#off-q').addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
  $('#gaveta-corpo').addEventListener('click', e => {
    const b = e.target.closest('[data-off]');
    if (!b) return;
    const a = achados[+b.dataset.off];
    salvarEscaneado(a); abrirPorcao(a.n);
  });
  setTimeout(() => { const el = $('#off-q'); if (el) el.focus(); }, 120);
}

/* Produto vindo do banco vira alimento próprio: funciona offline depois. */
function salvarEscaneado(a) {
  const ja = E.custom.findIndex(x => x.n === a.n || (a.codigo && x.codigo === a.codigo));
  if (ja >= 0) E.custom[ja] = a; else E.custom.push(a);
  gravar();
}

/* ══ TELA TREINO ══════════════════════════════════════ */
function recordes(nome) {
  let carga=0, rm=0, vol=0;
  E.sessoes.forEach(s => (s.ex||[]).forEach(e => {
    if (e.n !== nome) return;
    (e.series||[]).forEach(x => {
      if (x.t === 'w') return;                       // aquecimento não vira recorde
      const kg=+x.kg||0, r=+x.reps||0;
      if (!kg||!r) return;
      if (kg>carga) carga=kg;
      const e1=kg*(1+r/30); if (e1>rm) rm=e1;
      if (kg*r>vol) vol=kg*r;
    });
  }));
  return { carga, rm:Math.round(rm), vol };
}
function proximaRotina() {
  const f = E.sessoes.filter(s=>s.rotina!=='C');
  return !f.length ? 'A' : (f[f.length-1].rotina==='A' ? 'B' : 'A');
}
const serieFeita = s => s.ok && s.kg !== '' && s.reps !== '';


function blocoGrupos() {
  const dias = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate()-i); dias.push(iso(d)); }
  const mapa = seriesPorGrupo(E.sessoes, dias);
  const orf = gruposOrfaos(mapa);
  const linhas = GRUPOS_PRINCIPAIS.map(g => ({ g, n: mapa[g] || 0, av: avaliarGrupo(mapa[g] || 0) }));
  const max = Math.max(FAIXA_SERIES.alto, ...linhas.map(l => l.n));

  return `<div class="bloco"><div class="bloco-tit"><span>Séries por músculo — 7 dias</span>
      <b>${Object.values(mapa).reduce((a,b)=>a+b,0)} séries</b></div>
    ${linhas.map(l => `<div class="gm-linha">
      <span class="gm-nome">${esc(l.g)}</span>
      <span class="gm-barra"><i class="gm-${l.av}" style="width:${Math.min(100,(l.n/max)*100).toFixed(0)}%"></i></span>
      <span class="gm-n gm-${l.av}">${l.n}</span></div>`).join('')}
    <div class="gm-escala"><span>0</span><span>faixa de trabalho ${FAIXA_SERIES.ideal[0]}–${FAIXA_SERIES.ideal[1]}</span><span>${max}</span></div>
    ${orf.length ? `<div class="alerta ocre" style="margin-top:11px"><div class="alerta-tit">Sem estímulo direto</div>
      <p>${esc(orf.join(', '))}. Em déficit, músculo sem estímulo é o primeiro a ser consumido.
      Uma ou duas séries por semana já mudam isso.</p></div>` : ''}
    <p class="nota">Séries semanais por músculo é a métrica que a literatura aponta como principal motor de
    hipertrofia — mais do que o volume em quilos. Série de aquecimento não entra na conta.</p></div>`;
}

function pintarTreino() {
  const f = faseAtual(), sem = semanaNoCiclo();
  let h = `<div class="bloco fase"><div class="bloco-tit"><span>Ciclo ${cicloNum()} · semana ${sem} de 12</span><b>${esc(f.nome)}</b></div>
    <div class="fase-barra">${FASES.map(x=>x.sem.map(s=>
      `<i class="${s===sem?'ag':(s<sem?'ok':'')}" title="Semana ${s} · ${esc(x.nome)}"></i>`).join('')).join('')}</div>
    <div class="grade3" style="margin-top:10px">
      <div><div class="kpi-num">${f.series}</div><div class="kpi-rot">Séries</div></div>
      <div><div class="kpi-num">${f.repMin}–${f.repMax}</div><div class="kpi-rot">Reps</div></div>
      <div><div class="kpi-num">${f.rirAlvo}</div><div class="kpi-rot">RIR alvo</div></div></div>
    <p style="font-size:13px;margin:10px 0 0">${esc(f.foco)}</p>
    <p class="nota">${esc(f.nota)}</p></div>`;

  if (!E.sessaoAtiva) {
    h += blocoGrupos();
    const prox = proximaRotina();
    h += `<div class="bloco"><div class="bloco-tit"><span>Próxima sessão</span><b>${E.sessoes.length} feitas</b></div>
      <div style="margin-bottom:10px"><span class="selo">${esc(E.rotinas[prox].nome)}</span></div>
      <button type="button" class="btn" data-iniciar="${prox}" style="margin-bottom:8px">Iniciar treino ${prox}</button>
      <div class="linha-flex">
        <button type="button" class="btn vazado mini" data-iniciar="${prox==='A'?'B':'A'}">Treino ${prox==='A'?'B':'A'}</button>
        <button type="button" class="btn vazado mini" data-iniciar="C">Cardio</button></div></div>`;

    h += `<div class="bloco"><div class="bloco-tit"><span>Cargas sugeridas</span><b>${esc(E.rotinas[prox].nome)}</b></div>`;
    h += E.rotinas[prox].ex.map(e => {
      const s = sugerir(e.n, f);
      return `<div class="hist"><div class="hist-esq"><b>${esc(e.n)}</b>${esc(s.msg)}</div>
        <div style="text-align:right;white-space:nowrap">${s.kg?`<span class="${s.sobe?'sobe':s.desce?'desce':''}">${br(s.kg)} kg</span>`:'—'}<br>
        <span style="color:var(--tinta2)">${s.reps} reps</span></div></div>`;
    }).join('');
    h += `<p class="nota">Progressão dupla: a carga só sobe quando você fecha ${f.repMax} reps em <b>todas</b> as séries com RIR ${f.rirAlvo} ou menos.</p></div>`;

    const s7 = E.sessoes.filter(s=>diasEntre(s.d,HOJE)<7);
    const vol = s7.reduce((t,s)=>t+(s.ex||[]).reduce((u,e)=>u+(e.series||[]).reduce((v,x)=>v+(x.t==='w'?0:(+x.kg||0)*(+x.reps||0)),0),0),0);
    h += `<div class="grade2">
      <div class="bloco"><div class="kpi-num">${s7.length}</div><div class="kpi-rot">Treinos em 7 dias</div></div>
      <div class="bloco"><div class="kpi-num">${(vol/1000).toFixed(1)}<small> t</small></div><div class="kpi-rot">Volume 7 dias</div></div></div>`;

    h += '<div class="bloco"><div class="bloco-tit"><span>Histórico</span><b>'+E.sessoes.length+'</b></div>';
    h += E.sessoes.length ? E.sessoes.slice().reverse().slice(0,8).map(s => {
      const v = (s.ex||[]).reduce((u,e)=>u+(e.series||[]).reduce((w,x)=>w+(x.t==='w'?0:(+x.kg||0)*(+x.reps||0)),0),0);
      return `<div class="hist"><div class="hist-esq"><b>${esc(E.rotinas[s.rotina]?E.rotinas[s.rotina].nome:s.rotina)}</b>${fmtData(s.d)}${s.fase?' · '+esc(s.fase):''}${s.min?' · '+s.min+' min':''}</div>
        <div style="text-align:right">${Math.round(v)} kg</div></div>`;
    }).join('') : '<div class="vazio">Nenhum treino registrado.</div>';
    h += '</div>';

    const nomes = [...new Set(E.sessoes.flatMap(s=>(s.ex||[]).map(e=>e.n)))];
    if (nomes.length) {
      h += '<div class="bloco"><div class="bloco-tit"><span>Recordes pessoais</span></div>'
        + nomes.map(n => { const r = recordes(n);
          return `<button type="button" class="hist hist-btn" data-hist-ex="${esc(n)}">
            <span class="hist-esq"><b>${esc(n)}</b>melhor série ${br(r.carga)} kg</span>
            <span style="text-align:right">1RM ≈ ${r.rm} kg<br><span style="color:var(--tinta2)">ver histórico →</span></span></button>`; }).join('')
        + '<p class="nota">1RM estimado por Epley, só para comparar evolução. Não tente o levantamento.</p></div>';
    }
  } else {
    const s = E.sessaoAtiva, min = Math.round((Date.now()-s.ini)/60000);
    const ok = s.ex.reduce((t,e)=>t+e.series.filter(serieFeita).length,0);
    const tot = s.ex.reduce((t,e)=>t+e.series.length,0);
    h += `<div class="bloco"><div class="bloco-tit"><span>Em andamento</span><b>${min} min</b></div>
      <span class="selo ok">${esc(E.rotinas[s.rotina].nome)}</span>
      <span style="font-family:var(--mono);font-size:12px;color:var(--tinta2)"> ${ok}/${tot} séries</span></div>`;

    s.ex.forEach((e, ei) => {
      const sug = e.sug||{}, bib = EXERCICIOS.find(x=>x.n===e.n)||{};
      const unid = bib.tempo ? 'seg' : 'reps';
      h += `<div class="exb"><div class="exb-cab"><div>
        <div class="exb-nome">${esc(e.n)}</div>
        <div class="exb-meta">${sug.kg?'sugerido '+br(sug.kg)+' kg × '+sug.reps:f.repMin+'–'+f.repMax+' '+unid}${bib.gm?' · '+esc(bib.gm):''}</div>
        </div>${TECNICA[e.n]?`<button type="button" class="btn-tec" data-tec="${esc(e.n)}" aria-label="Como executar">?</button>`:''}</div>`;
      e.series.forEach((x, si) => {
        h += `<div class="serie${serieFeita(x)?' feita':''}">
          <button type="button" class="serie-n tipo-${x.t||'n'}" data-tipo="${ei}:${si}"
            aria-label="Tipo da série ${si+1}">${x.t==='w'?'A':x.t==='d'?'D':(si+1)}</button>
          <input type="number" inputmode="decimal" step="any" placeholder="${sug.kg?br(sug.kg):'kg'}" value="${x.kg}" data-s="${ei}:${si}:kg" aria-label="Carga série ${si+1}">
          <input type="number" inputmode="numeric" placeholder="${sug.reps||unid}" value="${x.reps}" data-s="${ei}:${si}:reps" aria-label="Reps série ${si+1}">
          <select data-s="${ei}:${si}:rir" aria-label="RIR série ${si+1}">
            <option value=""${x.rir===''?' selected':''}>RIR</option>
            ${[0,1,2,3,4,5].map(v=>`<option value="${v}"${x.rir==v?' selected':''}>${v}</option>`).join('')}</select>
          <button type="button" class="serie-ok" data-ok="${ei}:${si}" aria-label="Concluir série">✓</button></div>`;
      });
      h += `<div class="exb-rod">
        <button type="button" data-mais="${ei}">+ série</button>
        <button type="button" data-menos="${ei}">− série</button>
        <button type="button" data-troca="${ei}">trocar</button></div></div>`;
    });
    h += `<div class="linha-flex" style="margin-bottom:10px">
      <button type="button" class="btn vazado mini" id="add-ex">+ exercício</button>
      <button type="button" class="btn vazado mini" id="calc-anilhas">Anilhas</button></div>
      <button type="button" class="btn vazado mini oculto">.</button>
      <button type="button" class="btn" id="encerrar" style="margin-bottom:8px">Encerrar treino</button>
      <button type="button" class="btn vazado mini" id="descartar">Descartar sessão</button>`;
  }
  $('#tela-treino').innerHTML = h;
}

function iniciarSessao(rot) {
  const f = faseAtual(), r = E.rotinas[rot];
  const n = rot==='C' ? 1 : f.series;
  E.sessaoAtiva = { d:HOJE, rotina:rot, fase:f.nome, semana:semanaCiclo(), ini:Date.now(),
    ex: r.ex.map(e => ({ n:e.n, sug:sugerir(e.n,f),
      series: Array.from({length:n}, () => ({ kg:'', reps:'', rir:'', t:'', ok:false })) })) };
  gravar(); pintarTreino();
  toast(f.nome+' · '+f.series+' séries de '+f.repMin+'–'+f.repMax);
}
function encerrarSessao() {
  const s = E.sessaoAtiva;
  s.ex.forEach(e => { e.series = e.series.filter(x=>x.kg!==''||x.reps!==''); });
  s.ex = s.ex.filter(e => e.series.length);
  if (!s.ex.length) { toast('Nenhuma série preenchida.'); return; }
  s.min = Math.max(1, Math.round((Date.now()-s.ini)/60000));
  delete s.ini;
  s.ex.forEach(e => delete e.sug);
  E.sessoes.push(s); E.sessaoAtiva = null;
  pararCron(); gravar(); pintarTreino();
  toast('Treino salvo · '+s.min+' min'); vibrar([30,60,30]);
}
function mostrarTecnica(nome) {
  const t = TECNICA[nome]||{}, b = EXERCICIOS.find(x=>x.n===nome)||{};
  abrirGaveta(nome, `
    <div class="bloco"><div class="bloco-tit"><span>Execução</span><b>${esc(b.gm||'')}</b></div>
      <p style="font-size:14px;margin:0">${esc(t.cue||'Sem descrição cadastrada.')}</p></div>
    ${t.erro?`<div class="alerta ocre"><div class="alerta-tit">Erro comum</div><p>${esc(t.erro)}</p></div>`:''}
    <div class="grade2">
      <div class="bloco"><div class="kpi-num" style="font-size:15px">${esc(b.eq||'—')}</div><div class="kpi-rot">Equipamento</div></div>
      <div class="bloco"><div class="kpi-num" style="font-size:15px">${esc(b.imp||'—')}</div><div class="kpi-rot">Impacto articular</div></div></div>`);
}

let cronFim=0, cronInt=null;
function iniciarCron(seg) {
  cronFim = Date.now()+seg*1000;
  $('#cron').hidden = false;
  clearInterval(cronInt); cronInt = setInterval(tickCron,250); tickCron();
}
function tickCron() {
  const r = Math.max(0, Math.round((cronFim-Date.now())/1000));
  $('#cron-t').textContent = Math.floor(r/60)+':'+String(r%60).padStart(2,'0');
  if (r<=0) { pararCron(); vibrar([200,100,200]); bip(); notificar('Descanso acabou','Próxima série.'); }
}
function pararCron() { clearInterval(cronInt); cronInt=null; $('#cron').hidden = true; }
function bip() {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine'; o.frequency.value=880;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.5);
  } catch(e) {}
}


/* ══ GASTO ADAPTATIVO ═════════════════════════════════ */
function consumoDoDia(k) {
  const d = E.diario[k];
  if (!d || !d.refs) return 0;
  let t = 0;
  REFS.forEach(r => (d.refs[r.id]||[]).forEach(i => { t += (i.kcal != null ? i.kcal : kcalDe(i.p,i.c,i.g)); }));
  return t;
}
function gastoReal() { return gastoAdaptativo(E.pesos, consumoDoDia, HOJE); }

/* Aplica a meta derivada do gasto medido. Só roda quando o
   motor tem dado suficiente e o usuário deixou no automático. */
function aplicarMetaAdaptativa(silencioso) {
  if (!E.cfg.metaAdaptativa) return null;
  const g = gastoReal();
  if (!g.ok) return null;
  const m = metaPorFase(E.cfg.fasePlano, g.tdee, pesoAtual(), E.cfg.ritmoAlvo,
                        PISO_KCAL[E.cfg.sexo] || 1500, estadoReganhoAtual());
  const antes = E.cfg.kcal;
  E.cfg.kcal = m.kcal;
  const ideal = 25 * Math.pow(E.cfg.altura/100, 2);
  const ajust = pesoAtual() > ideal ? ideal + 0.25*(pesoAtual()-ideal) : pesoAtual();
  E.cfg.prot = Math.round(REF.protAlvo * ajust);
  E.cfg.gord = Math.round(0.8 * ajust);
  E.cfg.carb = Math.max(60, Math.round((E.cfg.kcal - E.cfg.prot*4 - E.cfg.gord*9)/4));
  gravar();
  if (!silencioso && antes !== E.cfg.kcal) {
    toast('Meta atualizada pelo gasto medido: ' + antes + ' → ' + E.cfg.kcal + ' kcal', 4200);
  }
  return { g, m, antes };
}

function blocoGasto() {
  const g = gastoReal();
  const f = calcularMetas();

  if (!g.ok) {
    return `<div class="bloco"><div class="bloco-tit"><span>Gasto energético</span><b>calibrando</b></div>
      <div class="kpi-num" style="font-size:30px;color:var(--tinta2)">${f.tdee}<small> kcal/dia</small></div>
      <div class="kpi-rot">Estimativa por fórmula</div>
      <div class="alerta" style="margin-top:11px"><div class="alerta-tit">Ainda medindo seu gasto real</div>
      <p>${esc(g.texto)}</p></div>
      <p class="nota">Fórmula é média populacional e pode errar de 200 a 500 kcal para um indivíduo.
      Com diário e pesagens regulares, o app passa a <b>medir</b> seu gasto em vez de estimar —
      leva de 4 a 6 semanas para ficar confiável.</p></div>`;
  }

  const dif = g.tdee - f.tdee;
  /* Gasto medido abaixo do metabolismo basal é impossível em pessoa
     viva. Quando aparece, a causa é sempre dado: dias não registrados
     ou pesagem errada. Avisar isso vale mais que exibir o número. */
  const implausivel = g.tdee < f.tmb;
  const m = metaPorFase(E.cfg.fasePlano, g.tdee, pesoAtual(), E.cfg.ritmoAlvo,
                        PISO_KCAL[E.cfg.sexo] || 1500, estadoReganhoAtual());
  const serie = serieGasto(E.pesos, consumoDoDia, HOJE, 10);
  const corConf = g.confianca === 'alta' ? 'var(--sinal)' : g.confianca === 'média' ? 'var(--carb)' : 'var(--oxido)';

  return `<div class="bloco"><div class="bloco-tit"><span>Gasto energético medido</span>
      <b style="color:${corConf}">confiança ${g.confianca}</b></div>
    <div class="kpi-num" style="font-size:38px">${g.tdee}<small> kcal/dia</small></div>
    <div class="kpi-rot">Retrocalculado do seu consumo e da tendência de peso</div>

    <div class="grade3" style="margin-top:12px">
      <div><div class="kpi-num" style="font-size:18px">${g.consumoMedio}</div><div class="kpi-rot">Consumo médio</div></div>
      <div><div class="kpi-num" style="font-size:18px">${br(g.kgSemana.toFixed(2))}</div><div class="kpi-rot">kg/semana</div></div>
      <div><div class="kpi-num" style="font-size:18px">${dif>=0?'+':''}${dif}</div><div class="kpi-rot">vs. fórmula</div></div>
    </div>

    ${serie.length >= 2 ? `<div style="margin-top:12px">${grafLinha(serie, { rot:'Gasto estimado' })}
      <div class="legenda"><span><i style="background:var(--frio)"></i>gasto semana a semana</span></div></div>` : ''}

    <p class="nota">Base: ${g.diasReg} de ${g.janela} dias com diário, ${g.pesagens} pesagens cobrindo ${g.span} dias,
    aderência da reta de peso R² ${br(g.r2)}.
    ${Math.abs(dif) > 150 ? `A fórmula erraria <b>${Math.abs(dif)} kcal por dia</b> no seu caso — ${dif>0?'para menos':'para mais'}.` : 'Sua fórmula e a medição estão próximas.'}</p>

    ${implausivel ? `<div class="alerta ocre"><div class="alerta-tit">Este número não é possível</div>
      <p>O gasto medido (${g.tdee} kcal) ficou <b>abaixo do seu metabolismo basal</b> (${f.tmb} kcal), o que
      não acontece em pessoa viva. A causa é sempre o dado: dias sem registro, porção subestimada ou pesagem
      digitada errada. Corrija antes de confiar na meta — e o piso de segurança segue valendo.</p></div>` : ''}
    ${g.vies ? `<div class="alerta ocre"><div class="alerta-tit">Cobertura de registro baixa</div>
      <p>${Math.round(g.cobertura*100)}% dos dias têm diário. Os dias sem registro entram na conta assumindo
      o mesmo consumo dos registrados. Se você justamente deixa de registrar nos dias que come mais,
      o gasto medido sai <b>abaixo</b> do real e a meta fica apertada demais. Registre os dias ruins também —
      é o que torna o número confiável.</p></div>` : ''}

    <div class="bloco" style="margin:11px 0 0;border:0;padding:0">
      <label class="campo"><span>Ritmo alvo de perda</span><select id="cfg-ritmo">
        ${RITMOS.map(r=>`<option value="${r.v}"${E.cfg.ritmoAlvo==r.v?' selected':''}>${esc(r.rot)}</option>`).join('')}</select></label>
      <label class="campo"><span>Meta calórica</span><select id="cfg-adapt">
        <option value="1"${E.cfg.metaAdaptativa?' selected':''}>Automática — segue o gasto medido</option>
        <option value="0"${!E.cfg.metaAdaptativa?' selected':''}>Manual — eu defino</option></select></label>
    </div>

    <div class="alerta"><div class="alerta-tit">Meta sugerida</div>
      <p><b>${m.kcal} kcal/dia</b> — déficit de ${m.deficit}, que projeta ${br(m.ritmoReal)}% do peso por semana.
      ${m.limitado ? ' O déficit foi limitado: o pedido passava de 30% do gasto ou do piso de segurança.' : ''}
      ${E.cfg.metaAdaptativa ? (E.cfg.kcal === m.kcal ? ' Já aplicada.' : '') : ' Você está no modo manual, então ela não foi aplicada.'}</p>
      ${E.cfg.metaAdaptativa && E.cfg.kcal !== m.kcal ? '<button type="button" class="btn mini" id="aplicar-adapt">Aplicar agora</button>' : ''}
    </div></div>`;
}


/* ══ HISTÓRICO POR EXERCÍCIO ══════════════════════════ */
function abrirHistoricoEx(nome) {
  const pontos = [];
  E.sessoes.forEach(sx => (sx.ex||[]).forEach(e => {
    if (e.n !== nome) return;
    const kg = Math.max(0, ...(e.series||[]).filter(x => x.t!=='w').map(x => +x.kg||0));
    if (kg > 0) pontos.push({ d: sx.d, v: kg });
  }));
  pontos.sort((a,b)=>a.d<b.d?-1:1);
  const r = recordes(nome), bib = EXERCICIOS.find(x=>x.n===nome)||{};

  abrirGaveta(nome, `
    <div class="grade3"><div class="bloco"><div class="kpi-num">${br(r.carga)}<small>kg</small></div><div class="kpi-rot">Melhor carga</div></div>
      <div class="bloco"><div class="kpi-num">${r.rm}<small>kg</small></div><div class="kpi-rot">1RM estimado</div></div>
      <div class="bloco"><div class="kpi-num">${pontos.length}</div><div class="kpi-rot">Sessões</div></div></div>
    <div class="bloco"><div class="bloco-tit"><span>Carga ao longo do tempo</span><b>${esc(bib.gm||'')}</b></div>
      ${pontos.length>=2 ? grafLinha(pontos, { rot:'Carga' }) : '<div class="vazio">Precisa de pelo menos duas sessões.</div>'}</div>
    ${TECNICA[nome] ? `<div class="bloco"><div class="bloco-tit"><span>Execução</span></div>
      <p style="font-size:13.5px;margin:0">${esc(TECNICA[nome].cue)}</p></div>` : ''}
    <button type="button" class="btn vazado mini" data-anilha="${br(r.carga||20)}">Calcular anilhas</button>`);

  $('#gaveta-corpo').addEventListener('click', ev => {
    const b = ev.target.closest('[data-anilha]');
    if (b) abrirAnilhas(parseFloat(String(b.dataset.anilha).replace(',','.')) || 20);
  });
}

/* ══ CALCULADORA DE ANILHAS ═══════════════════════════ */
const ANILHAS = [20, 15, 10, 5, 2.5, 1.25];
function abrirAnilhas(alvo) {
  abrirGaveta('Anilhas por lado', `
    <div class="linha-flex" style="margin-bottom:10px">
      <label class="campo" style="flex:1;margin:0"><span>Carga total (kg)</span>
        <input type="number" id="an-total" value="${alvo}" step="0.5" inputmode="decimal"></label>
      <label class="campo" style="flex:1;margin:0"><span>Barra (kg)</span>
        <input type="number" id="an-barra" value="20" step="0.5" inputmode="decimal"></label></div>
    <div id="an-out"></div>
    <p class="nota">Considera anilhas de 20, 15, 10, 5, 2,5 e 1,25 kg. Se o resultado sobrar,
    a carga exata não é montável com esse par de anilhas.</p>`);

  const calc = () => {
    const total = parseFloat($('#an-total').value)||0;
    const barra = parseFloat($('#an-barra').value)||0;
    const lado = (total - barra) / 2;
    if (lado < 0) { $('#an-out').innerHTML = '<div class="vazio">A carga é menor que a barra.</div>'; return; }
    let resto = lado; const usadas = [];
    ANILHAS.forEach(p => { const q = Math.floor(resto / p + 1e-9); if (q > 0) { usadas.push({p, q}); resto -= q*p; } });
    $('#an-out').innerHTML = `<div class="bloco"><div class="bloco-tit"><span>Por lado</span><b>${br(lado.toFixed(2))} kg</b></div>
      ${usadas.length ? usadas.map(u=>`<div class="hist"><div class="hist-esq"><b>${br(u.p)} kg</b></div><div>× ${u.q}</div></div>`).join('')
        : '<div class="vazio">Só a barra.</div>'}
      ${resto > 0.01 ? `<p class="nota">Sobram ${br(resto.toFixed(2))} kg que não fecham com as anilhas disponíveis.</p>` : ''}</div>`;
  };
  calc();
  $('#an-total').addEventListener('input', calc);
  $('#an-barra').addEventListener('input', calc);
}



/* ══ APRENDIZADO SOBRE A PESSOA ═══════════════════════ */
function ctxObservador() {
  const dias = [];
  for (let i = JANELA_OBS - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate()-i); dias.push(iso(d)); }
  const reg = k => E.diario[k];
  return {
    hoje: HOJE, dias, REFS, sessoes: E.sessoes.filter(s => dias.includes(s.d)),
    metaProt: E.cfg.prot,
    diasComRegistro: dias.filter(k => reg(k) && somaDia(k).kcal > 0).length,
    diaSemana: k => deIso(k).getDay(),
    temAlgo: k => !!(reg(k) && somaDia(k).kcal > 0),
    temRef: (k, id) => !!(reg(k) && ((reg(k).refs||{})[id]||[]).length),
    kcal: k => reg(k) ? somaDia(k).kcal : 0,
    prot: k => reg(k) ? somaDia(k).p : 0,
    itens: k => reg(k) ? REFS.flatMap(r => (reg(k).refs||{})[r.id]||[]) : [],
    treinou: k => E.sessoes.some(s => s.d === k),
    jejumNoturno: k => { const j = jejumDoDia(k, x => E.diario[x], REFS, null); return j.noturno; },
    ultimaHora: k => { const h = horariosDoDia(reg(k), REFS); return h.pontos.length ? h.pontos[h.pontos.length-1].min : null; }
  };
}

function rodarObservador() {
  try {
    const novas = observar(ctxObservador());
    const f = fundirMemorias(E.memoria.fatos || [], novas);
    E.memoria.fatos = f.memorias;
    gravar();
    return f;
  } catch (e) { return { memorias: E.memoria.fatos || [], removidas: [] }; }
}

/* ══ FASES DO PLANO ═══════════════════════════════════ */
function serieTendencia() {
  const ps = ordPesos();
  return ps.length ? pesoTendencia(ps).map(x => ({ d: x.d, tend: x.tend })) : [];
}
function faixaAtual() {
  if (E.cfg.faixaManut) return E.cfg.faixaManut;
  return E.cfg.fasePlano === 'perda' ? null : faixaManutencao(E.cfg.pesoMeta);
}
function estadoReganhoAtual() {
  const f = faixaAtual();
  if (!f) return null;
  return estadoReganho(serieTendencia(), f);
}
function tendAtual() {
  const st = serieTendencia();
  return st.length ? st[st.length-1].tend : null;
}

function entrarEmFase(fase, pesoBase) {
  const antes = E.cfg.fasePlano;
  // fecha o ciclo anterior antes de abrir o novo
  const ini = (E.ciclos.length ? E.ciclos[E.ciclos.length-1].fim : null) || E.cfg.cicloInicio || HOJE;
  const ps = ordPesos();
  if (ps.length >= 2 && antes !== fase) {
    E.ciclos.push({ ini, fim: HOJE, fase: antes,
      pesoIni: ps[0].kg, pesoFim: ps[ps.length-1].kg,
      aderencia: (function(){ try { return aderencia7d().pct; } catch(e){ return null; } })() });
  }
  E.cfg.fasePlano = fase;
  if (fase === 'manutencao') {
    E.cfg.faixaManut = faixaManutencao(pesoBase || tendAtual() || pesoAtual());
    E.cfg.autoRecalc = false; E.cfg.metaAdaptativa = true;
  }
  if (fase === 'perda') E.cfg.faixaManut = null;
  aplicarMetaAdaptativa(true);
  gravar();
}

/* ══ TELA PROGRESSO ═══════════════════════════════════ */
function grafLinha(serie, opts) {
  opts = opts||{};
  const W=320,H=120,pad=10;
  if (serie.length<2) return '<div class="vazio">Precisa de pelo menos dois registros.</div>';
  const vals = serie.map(p=>p.v);
  let min=Math.min(...vals), max=Math.max(...vals);
  if (opts.alvo!=null) { min=Math.min(min,opts.alvo); max=Math.max(max,opts.alvo); }
  min-=1; max+=1;
  const span=(max-min)||1, temD=serie.every(p=>p.d);
  const t0 = temD?deIso(serie[0].d).getTime():0;
  const dur = temD?((deIso(serie[serie.length-1].d).getTime()-t0)||1):1;
  const X = i => temD ? pad+((deIso(serie[i].d).getTime()-t0)/dur)*(W-pad*2) : pad+(i/(serie.length-1))*(W-pad*2);
  const Y = v => pad+(1-(v-min)/span)*(H-pad*2);
  const pts = serie.map((p,i)=>X(i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ');
  let mm='';
  if (serie.length>=4) {
    const m = serie.map((p,i)=>{
      const w = serie.slice(Math.max(0,i-2),i+1);
      return X(i).toFixed(1)+','+Y(w.reduce((t,x)=>t+x.v,0)/w.length).toFixed(1);
    }).join(' ');
    mm = `<polyline points="${m}" fill="none" stroke="var(--oxido)" stroke-width="1.6" stroke-dasharray="4 3" opacity=".9"/>`;
  }
  const alvo = opts.alvo!=null
    ? `<line x1="${pad}" y1="${Y(opts.alvo).toFixed(1)}" x2="${W-pad}" y2="${Y(opts.alvo).toFixed(1)}" stroke="var(--sinal)" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>`:'';
  const u = serie[serie.length-1];
  return `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.rot||'Gráfico')}">
    ${alvo}<polyline points="${pts}" fill="none" stroke="var(--frio)" stroke-width="2" stroke-linejoin="round"/>${mm}
    <circle cx="${X(serie.length-1).toFixed(1)}" cy="${Y(u.v).toFixed(1)}" r="3.5" fill="var(--oxido)"/></svg>`;
}


function blocoFase() {
  const fase = FASES_PLANO[E.cfg.fasePlano] || FASES_PLANO.perda;
  const faixa = faixaAtual(), rg = estadoReganhoAtual(), td = tendAtual();
  const trans = transicaoSugerida(E.cfg.fasePlano, td, E.cfg.pesoMeta,
                                  (composicao()||{}).bf, E.cfg.sexo);
  const trava = alertaDeficitDesnecessario((composicao()||{}).bf, E.cfg.sexo, E.cfg.fasePlano);
  const regra = regraDisparada(E.cfg.regraAcao, td);

  let h = `<div class="bloco fase-bloco fb-${fase.cor}"><div class="bloco-tit"><span>Fase do plano</span>
      <b>${esc(fase.rot)}</b></div>
    <p style="font-size:13px;margin:0 0 10px">${esc(fase.desc)}</p>`;

  if (faixa) {
    const dentro = rg && rg.nivel === 'dentro';
    h += `<div class="faixa-vis ${rg ? 'rg-'+rg.nivel : ''}">
      <div class="faixa-num">${br(faixa.min.toFixed(1))} – ${br(faixa.max.toFixed(1))} <small>kg</small></div>
      <div class="kpi-rot">Faixa de manutenção${td != null ? ' · tendência ' + br(td.toFixed(1)) + ' kg' : ''}</div></div>`;
    if (rg && rg.nivel !== 'sem-dados') {
      h += `<div class="alerta ${rg.nivel==='dentro'?'':'ocre'}" style="margin-top:10px">
        <div class="alerta-tit">${rg.nivel==='dentro'?'Dentro da faixa':rg.nivel==='abaixo'?'Abaixo da faixa':'Reganho — nível '+rg.nivel}</div>
        <p>${esc(rg.txt)}</p>
        ${rg.nivel==='laranja'||rg.nivel==='vermelho'
          ? '<button type="button" class="btn mini" data-fase="recuperacao">Entrar em recuperação</button>' : ''}</div>`;
    }
  }

  if (regra) {
    h += `<div class="alerta ocre"><div class="alerta-tit">Sua regra combinada disparou</div>
      <p>${regra.txt.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p></div>`;
  }

  if (trans && E.cfg.transicaoVista !== HOJE) {
    h += `<div class="alerta"><div class="alerta-tit">Você chegou. E agora?</div>
      <p>${trans.txt.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n\n/g,'</p><p>')}</p>
      <div class="linha-flex"><button type="button" class="btn mini" data-fase="manutencao">Entrar em manutenção</button>
        <button type="button" class="btn vazado mini" id="adiar-trans">Ainda não</button></div></div>`;
  }

  if (trava) {
    h += `<div class="alerta ocre"><div class="alerta-tit">Vale parar e pensar</div>
      <p>${trava.replace(/\n\n/g,'</p><p>')}</p></div>`;
  }

  // troca manual de fase
  h += `<label class="campo" style="margin-top:11px"><span>Mudar de fase</span>
    <select id="cfg-fase">${Object.keys(FASES_PLANO).map(k=>
      `<option value="${k}"${E.cfg.fasePlano===k?' selected':''}>${esc(FASES_PLANO[k].rot)}</option>`).join('')}</select></label>`;

  // regra de ação combinada
  const r = E.cfg.regraAcao;
  h += `<div class="bloco-tit" style="margin:12px 0 7px"><span>Regra combinada</span></div>
    <p class="nota" style="margin:0 0 8px">Decida <b>agora</b>, com a cabeça fria, o peso em que você volta a agir
    e o que vai fazer. Decidir na hora do problema é o que não funciona.</p>
    <div class="linha-flex">
      <input type="number" id="ra-peso" step="0.1" inputmode="decimal" placeholder="kg" value="${r&&r.peso?r.peso:''}" style="flex:0 0 32%">
      <input type="text" id="ra-acao" placeholder="o que farei" value="${r?esc(r.acao||''):''}">
      <button type="button" class="btn mini" id="ra-salvar">Salvar</button></div>
    ${r&&r.peso?`<p class="nota">Combinado em ${fmtData(r.d)}: ao passar de ${br(r.peso)} kg, ${esc(r.acao||'')}.</p>`:''}`;

  // histórico de ciclos
  if (E.ciclos.length) {
    h += `<div class="bloco-tit" style="margin:12px 0 7px"><span>Ciclos anteriores</span><b>${E.ciclos.length}</b></div>`;
    h += E.ciclos.slice().reverse().slice(0,5).map(c => {
      const r2 = resumoCiclo(c);
      if (!r2) return '';
      return `<div class="hist"><div class="hist-esq"><b>${esc((FASES_PLANO[r2.fase]||{}).rot||r2.fase)} · ${r2.semanas} semanas</b>${fmtData(r2.ini)} a ${fmtData(r2.fim)}</div>
        <div style="text-align:right">${r2.delta>=0?'+':''}${br(r2.delta)} kg<br>
        <span style="color:var(--tinta2)">${br(r2.ritmo)} kg/sem</span></div></div>`;
    }).join('');
  }

  h += '</div>';
  return h;
}

function pintarProgresso() {
  const c = E.cfg, ps = ordPesos(), at = pesoAtual();
  const delta = at-c.pesoInicial, imc = at/Math.pow(c.altura/100,2);
  const comp = composicao(), r = ritmoSemanal(28);
  let h = '';

  const serieT = pesoTendencia(ps);
  const tend = serieT.length ? serieT[serieT.length-1].tend : at;
  h += `<div class="bloco"><div class="bloco-tit"><span>Peso</span><b>${ps.length} registros</b></div>
    <div class="kpi-num" style="font-size:42px">${br(tend.toFixed(1))}<small> kg</small></div>
    <div class="kpi-rot">Tendência · balança de hoje marcou ${br(at.toFixed(1))} kg</div>
    <div style="font-family:var(--mono);font-size:13px;color:${delta<0?'var(--sinal)':delta>0?'var(--oxido)':'var(--tinta2)'}">
      ${delta===0?'sem variação registrada':(delta<0?'▼ ':'▲ ')+br(Math.abs(delta).toFixed(1))+' kg desde o início'}</div>
    <div class="grade2" style="margin-top:12px">
      <label class="campo"><span>Peso (kg)</span><input type="number" id="in-peso" step="0.1" inputmode="decimal" placeholder="${br(at.toFixed(1))}"></label>
      <label class="campo"><span>Cintura (cm)</span><input type="number" id="in-cint" step="0.5" inputmode="decimal" placeholder="${comp&&comp.cintura?br(comp.cintura):'—'}"></label>
      <label class="campo"><span>Pescoço (cm)</span><input type="number" id="in-pesc" step="0.5" inputmode="decimal" placeholder="${c.pescoco?br(c.pescoco):'—'}"></label>
      <div style="display:flex;align-items:flex-end;padding-bottom:9px"><button type="button" class="btn" id="btn-peso">Gravar</button></div></div>
    <p class="nota">Cintura na altura do umbigo, sem apertar. Pescoço abaixo do pomo de adão.
    <b>Pese-se todo dia se puder</b>: o número grande acima é a tendência, que filtra água e sal — é nela
    que se olha, e ela fica mais precisa quanto mais pesagens existirem.</p></div>`;

  h += blocoFase();

  h += blocoGasto();

  h += '<div class="bloco"><div class="bloco-tit"><span>Composição corporal</span>'
    + (comp&&comp.bf?`<b>${br(comp.bf)}% de gordura</b>`:'') + '</div>';
  if (comp && comp.bf) {
    h += `<div class="grade3">
      <div><div class="kpi-num">${br(comp.gordura.toFixed(1))}<small>kg</small></div><div class="kpi-rot">Gordura</div></div>
      <div><div class="kpi-num">${br(comp.magra.toFixed(1))}<small>kg</small></div><div class="kpi-rot">Massa magra</div></div>
      <div><div class="kpi-num" style="font-size:15px">${esc(comp.rot)}</div><div class="kpi-rot">Faixa</div></div></div>`;
    const bfs = ps.filter(p=>p.bf);
    if (bfs.length>=2) {
      const a0=bfs[0], a1=bfs[bfs.length-1];
      const dm = a1.kg*(1-a1.bf/100) - a0.kg*(1-a0.bf/100);
      const dg = a1.kg*a1.bf/100 - a0.kg*a0.bf/100;
      h += `<p class="nota" style="margin-top:10px">Desde a primeira medida completa:
        <b>${dg<0?'−':'+'}${br(Math.abs(dg).toFixed(1))} kg de gordura</b> e ${dm<0?'−':'+'}${br(Math.abs(dm).toFixed(1))} kg de massa magra.
        ${dm<-1.5?'Perda de massa magra relevante — aumente proteína e não corte mais caloria.'
          : dm>=-0.5?'Massa magra praticamente preservada, que é exatamente o alvo.'
          : 'Leve perda de massa magra, dentro do esperado.'}</p>`
        + grafLinha(bfs.map(p=>({v:p.bf,d:p.d})), { rot:'Percentual de gordura' });
    }
    if (comp.cintura >= REF.cinturaRisco[c.sexo]) {
      h += `<div class="alerta ocre" style="margin-top:10px"><div class="alerta-tit">Cintura acima do corte de risco</div>
        <p>${br(comp.cintura)} cm, contra ${REF.cinturaRisco[c.sexo]} cm de referência para risco cardiometabólico elevado.
        É a medida que mais cai no começo — acompanhe ela, não só a balança.</p></div>`;
    }
  } else {
    h += '<div class="vazio">Informe cintura e pescoço na pesagem para estimar gordura e massa magra pelo método Navy.</div>';
  }
  h += '</div>';

  h += `<div class="grade3">
    <div class="bloco"><div class="kpi-num">${br((at-c.pesoMeta).toFixed(1))}</div><div class="kpi-rot">Até a meta</div></div>
    <div class="bloco"><div class="kpi-num">${br(imc.toFixed(1))}</div><div class="kpi-rot">${esc(classificar(imc,REF.imc))}</div></div>
    <div class="bloco"><div class="kpi-num">${Math.round(Math.max(0,Math.min(100,((c.pesoInicial-at)/(c.pesoInicial-c.pesoMeta))*100)))}<small>%</small></div><div class="kpi-rot">Do caminho</div></div></div>`;

  if (ps.length>=2) {
    const falta = at-c.pesoMeta;
    const sems = r && r.kgSem<-0.05 ? Math.round(falta/Math.abs(r.kgSem)) : null;
    const dentro = r && r.pct>=REF.ritmoMin && r.pct<=REF.ritmoMax && r.kgSem<0;
    h += `<div class="bloco"><div class="bloco-tit"><span>Ritmo</span>
      <b class="${r?(dentro?'sobe':'desce'):''}">${r?br(r.kgSem.toFixed(2))+' kg/sem':'—'}</b></div>
      ${grafLinha(serieT.map(p=>({v:p.tend,d:p.d})), { alvo:c.pesoMeta, rot:'Peso-tendência' })}
      <div class="legenda"><span><i style="background:var(--frio)"></i>tendência</span>
        <span><i style="background:var(--oxido)"></i>média de 3</span>
        <span><i style="background:var(--sinal)"></i>meta ${c.pesoMeta} kg</span></div>
      ${r?`<p class="nota">${br((r.pct*100).toFixed(2))}% do peso corporal por semana.
        Faixa que preserva massa magra: 0,5% a 1,0%.
        ${dentro?'Você está dentro dela.':r.kgSem>=0?'Sem perda no período.':r.pct>REF.ritmoMax?'Rápido demais — risco de perder massa magra.':'Lento demais para o déficit planejado.'}
        ${sems?' Nesse ritmo, meta em ~'+sems+' semanas.':''}</p>`
        :'<p class="nota">Duas pesagens com pelo menos 7 dias de intervalo para calcular o ritmo.</p>'}</div>`;
  }

  h += `<div class="bloco"><div class="bloco-tit"><span>Fotos de progresso</span>
    <button type="button" id="add-foto">+ foto</button></div>
    <div id="galeria"><div class="vazio">Carregando…</div></div>
    <p class="nota">Mesma luz, mesma distância, mesma pose, a cada 4 semanas. É o que revela mudança quando a balança trava.</p></div>`;

  if (E.reavaliacoes.length) {
    h += '<div class="bloco"><div class="bloco-tit"><span>Reavaliações</span></div>'
      + E.reavaliacoes.slice().reverse().map(x=>`<div class="hist"><div class="hist-esq"><b>Semana ${x.semana}</b>${fmtData(x.d)} · ${esc(x.acao)}</div>
        <div style="text-align:right">${x.kcalAntes} → ${x.kcalDepois}<br><span style="color:var(--tinta2)">${br((x.ritmoPct*100).toFixed(2))}%/sem</span></div></div>`).join('')
      + '</div>';
  }

  h += '<div class="bloco"><div class="bloco-tit"><span>Aderência — 28 dias</span></div>';
  h += '<div class="cal-dias">'+['D','S','T','Q','Q','S','S'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="cal">';
  const fim = new Date(), ini = new Date(); ini.setDate(ini.getDate()-27);
  for (let i=0;i<ini.getDay();i++) h += '<div style="opacity:.25"></div>';
  for (const d = new Date(ini); d <= fim; d.setDate(d.getDate()+1)) {
    const k = iso(d), reg = E.diario[k];
    let n = 0;
    if (reg) REFS.slice(0,4).forEach(x => { if ((reg.refs[x.id]||[]).length) n++; });
    const tr = E.sessoes.some(s=>s.d===k);
    h += `<div data-n="${n}" class="${tr?'treinou':''}" title="${k}: ${n}/4 refeições${tr?' + treino':''}"></div>`;
  }
  h += '</div><p class="nota">Verde = refeições registradas. Ponto claro no canto = dia de treino.</p></div>';

  $('#tela-progresso').innerHTML = h;
  carregarGaleria();
}

function carregarGaleria() {
  const alvo = $('#galeria');
  if (!alvo) return;
  FotoDB.listar('progresso').then(fotos => {
    if (!alvo.isConnected) return;
    if (!fotos.length) { alvo.innerHTML = '<div class="vazio">Nenhuma foto ainda. A primeira é a referência de tudo.</div>'; return; }
    const mostrar = fotos.length>1 ? [fotos[0], fotos[fotos.length-1]] : [fotos[0]];
    alvo.innerHTML = `<div class="galeria">${mostrar.map(f=>`<figure>
      <img alt="Foto de ${fmtData(f.data)}" src="${URL.createObjectURL(f.blob)}">
      <figcaption>${fmtData(f.data)}${f.peso?' · '+br(f.peso)+' kg':''}</figcaption></figure>`).join('')}</div>
      ${fotos.length>2?`<p class="nota">Mostrando a primeira e a mais recente de ${fotos.length}.</p>`:''}
      <div class="tiras">${fotos.map(f=>`<button type="button" class="tira" data-verfoto="${f.id}">
        <img alt="" src="${URL.createObjectURL(f.blob)}"><span>${String(f.data).slice(5)}</span></button>`).join('')}</div>`;
  }).catch(() => { alvo.innerHTML = '<div class="vazio">Não foi possível abrir o álbum neste navegador.</div>'; });
}


/* ══ TELA ANÁLISE ═════════════════════════════════════ */
function ctxDiag() {
  return {
    hoje: HOJE, cfg: E.cfg, diario: E.diario, pesos: E.pesos,
    sessoes: E.sessoes, rotinas: E.rotinas, REFS,
    consumoDia: consumoDoDia,
    macrosDia: k => somaDia(k),
    gasto: gastoReal(),
    composicao: composicao(),
    ritmo: ritmoSemanal(28),
    semanaCiclo: semanaCiclo(),
    faseAtual: faseAtual(),
    pesoAtual: pesoAtual(),
    fasePlano: E.cfg.fasePlano, faixa: faixaAtual(),
    reganho: estadoReganhoAtual(), tendencia: tendAtual(),
    memorias: memoriasTexto(8),
    PISO: PISO_KCAL[E.cfg.sexo] || 1500
  };
}

const SEV_ROT = { critico:'crítico', atencao:'atenção', ok:'ok', neutro:'sem dado' };

/* Dados que a base de conhecimento injeta nas respostas. */
function dadosSaber() {
  const g = gastoReal(), c = composicao(), r = ritmoSemanal(28), f = faseAtual();
  const sete = [];
  for (let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); sete.push(iso(d)); }
  let cob = null;
  try {
    const a = diagnosticar(ctxDiag()).find(x => x.id === 'cobertura');
    cob = a ? a.n : null;
  } catch (e) {}
  return {
    prot: E.cfg.prot, carb: E.cfg.carb, gord: E.cfg.gord, kcal: E.cfg.kcal,
    aguaMeta: E.cfg.aguaMeta, peso: pesoAtual(),
    tdee: g.ok ? g.tdee : null, confianca: g.ok ? g.confianca : null,
    bf: c && c.bf ? String(c.bf).replace('.', ',') : null,
    ritmo: r ? r.pct*100 : null, cobertura: cob,
    fase: f ? f.nome : null, semana: semanaNoCiclo(), rirAlvo: f ? f.rirAlvo : null,
    fasePlano: E.cfg.fasePlano, faixa: faixaAtual(),
    reganho: estadoReganhoAtual(), tendencia: tendAtual(),
    orfaos: gruposOrfaos(seriesPorGrupo(E.sessoes, sete))
  };
}

function memoriasTexto(n) {
  const m = (E.memoria.fatos||[]).slice(0, n || 8);
  if (!m.length) return '';
  return m.map(x => `- ${x.t}${x.ev ? ' (' + x.ev + ')' : ''}`).join('\n');
}

function ctxAssist() {
  const sete = [];
  for (let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); sete.push(iso(d)); }
  return {
    cfg: E.cfg, hojeMacros: somaDia(), composicao: composicao(),
    ritmo: ritmoSemanal(28), gasto: gastoReal(), pesoAtual: pesoAtual(),
    fase: faseAtual(), semana: semanaNoCiclo(), proxRotina: E.rotinas[proximaRotina()].nome,
    fasePlano: E.cfg.fasePlano, faixa: faixaAtual(), reganho: estadoReganhoAtual(), tendencia: tendAtual(),
    orfaos: gruposOrfaos(seriesPorGrupo(E.sessoes, sete))
  };
}
const fmtMd = t => esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/_(.+?)_/g,'<i>$1</i>').replace(/\n/g,'<br>');

function cartaoAchado(a) {
  return `<div class="achado ${a.sev}">
    <div class="achado-cab"><span class="achado-tit">${esc(a.titulo)}</span>
      <span class="sev">${SEV_ROT[a.sev]}</span></div>
    <p class="achado-txt">${a.achado.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>
    <p class="achado-acao">${a.acao.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>
  </div>`;
}

function pintarAnalise() {
  const achados = diagnosticar(ctxDiag());
  const crit = achados.filter(a=>a.sev==='critico').length;
  const aten = achados.filter(a=>a.sev==='atencao').length;
  const ok   = achados.filter(a=>a.sev==='ok').length;

  let h = `<div class="bloco"><div class="bloco-tit"><span>Diagnóstico</span><b>${achados.length} verificações</b></div>
    <div class="grade3">
      <div><div class="kpi-num" style="color:var(--oxido)">${crit}</div><div class="kpi-rot">Críticos</div></div>
      <div><div class="kpi-num" style="color:var(--carb)">${aten}</div><div class="kpi-rot">Atenção</div></div>
      <div><div class="kpi-num" style="color:var(--sinal)">${ok}</div><div class="kpi-rot">Em ordem</div></div>
    </div>
    <p class="nota">Tudo aqui sai de conta sobre o que você registrou. Nada é estimado e nada sai do aparelho.</p></div>`;

  const sete = [];
  for (let i=6;i>=0;i--){ const dd=new Date(); dd.setDate(dd.getDate()-i); sete.push(iso(dd)); }
  const sinds = sindromes(achados, { fase: faseAtual(), orfaos: gruposOrfaos(seriesPorGrupo(E.sessoes, sete)) });
  if (sinds.length) {
    h += `<div class="bloco-tit" style="margin:4px 0 8px"><span>Padrões cruzados</span>
      <b>${sinds.length}</b></div>`;
    h += sinds.map(x => `<div class="sindrome">
      <div class="sind-nome">${esc(x.nome)}</div>
      <p class="sind-o">${esc(x.o)}</p>
      ${x.evid.length ? `<div class="sind-evid">${x.evid.map(id => {
        const a = achados.find(y=>y.id===id);
        return a ? `<span>${esc(a.titulo)}</span>` : ''; }).join('')}</div>` : ''}
      <p class="sind-faz">${esc(x.faz)}</p></div>`).join('');
    h += `<p class="nota" style="margin:0 0 14px">Cada padrão acima só aparece quando dieta, treino e composição
    são lidos juntos. É o que um app só de nutrição ou só de treino não consegue ver.</p>`;
  }

  h += `<div class="bloco"><div class="bloco-tit"><span>Perguntas frequentes</span></div>
    ${PERGUNTAS.map((p,i)=>`<button type="button" class="pergunta" data-perg="${i}">${esc(p.q)}</button>`).join('')}</div>`;

  h += `<div class="bloco assist-bloco"><div class="bloco-tit"><span>${esc(E.cfg.iaNome||'Assistente')}</span>
      <b>${SABER.length + (E.saberProprio||[]).length} tópicos</b></div>
    <p style="font-size:13px;margin:0 0 10px">Pergunte em texto livre sobre os seus números.
    Vem pronto no app, responde na hora, funciona offline e <b>nunca inventa dado</b> —
    toda resposta sai do seu registro.</p>
    <button type="button" class="btn" id="abrir-chat">Conversar</button></div>`;

  h += `<div class="bloco-tit" style="margin:16px 0 8px"><span>Todos os achados</span></div>`;
  h += achados.map(cartaoAchado).join('');

  h += `<p class="nota" style="margin:14px 0 4px">Este diagnóstico organiza execução. Não é avaliação clínica
  e não substitui médico, nutricionista ou educador físico.</p>`;

  $('#tela-analise').innerHTML = h;
}

function abrirResposta(i) {
  const achados = diagnosticar(ctxDiag());
  const p = PERGUNTAS[i];
  const r = responder(p, achados);
  abrirGaveta(p.q, `
    <p style="font-size:14px;margin:0 0 12px">${r.intro.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>
    ${r.achados.length ? r.achados.map(cartaoAchado).join('')
      : '<div class="vazio">Ainda não há dados suficientes para responder com número.</div>'}`);
}


/* Abertura: cumprimenta pelo nome, dá o número do dia e, se
   houver algo escorregando, puxa a orelha na mesma mensagem. */
function aberturaChat(A) {
  const M = E.memoria, C = ctxAssist();
  const s = somaDia();
  if (!M.nome) {
    return 'Antes de começar: **como você se chama?**\n\nEscreve "meu nome é ..." — eu guardo aqui no aparelho e passo a te chamar pelo nome.';
  }
  const h = new Date().getHours();
  const ola = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const crit = A.filter(a => a.sev === 'critico');
  let t = `${ola}, **${M.nome}**. Hoje: ${s.kcal} de ${E.cfg.kcal} kcal e ${Math.round(s.p)} de ${E.cfg.prot} g de proteína.`;
  if (crit.length) t += '\n\n' + puxaoDeOrelha(A, C, M);
  else t += '\n\nPode me dizer o que comeu que eu registro: *"comi 100g de arroz, um bife e uma salada"*.';
  return t;
}

let ultimoTopico = null;

/* Quando nada casa, mostra o que ele sabe em vez de repetir
   "não entendi". Assistente que não diz o próprio escopo
   treina o usuário a desistir dele. */
function naoEntendi(A) {
  const exemplos = [
    'quanto posso comer hoje', 'por que travei', 'quanta proteína eu preciso',
    'posso beber cerveja', 'quantas séries por músculo', 'o que é deload',
    'monta minha dieta de hoje', 'comi 100g de arroz e um bife'
  ];
  const crit = A.filter(a => a.sev === 'critico').slice(0,1);
  return 'Não peguei essa. Eu respondo sobre **nutrição**, **treino**, **método do app** e **seus próprios números** — e registro refeição por texto livre.\n\n'
    + (crit.length ? `Enquanto isso, o que está pedindo atenção: **${crit[0].titulo}** — ${crit[0].achado}\n\n` : '')
    + 'Tente, por exemplo:\n' + exemplos.slice(0,5).map(x => '• ' + x).join('\n');
}


/* ══ API DO AGENTE ════════════════════════════════════
   Superfície fechada: a IA só alcança o que está aqui. */
const API_AGENTE = {
  registrarPorFrase(frase) {
    const res = interpretarRefeicao(frase, baseCompleta(), new Date().getHours());
    if (!res.itens.length) {
      const dica = res.perdidos.length
        ? res.perdidos.map(p => p.sugestoes.length
            ? `${p.dito} (você quis dizer: ${p.sugestoes.join(', ')}?)`
            : p.dito).join('; ')
        : '';
      throw new Error('não reconheci nenhum alimento' + (dica ? ': ' + dica : ''));
    }
    chatHist.forEach(m => { if (m.t === '__PREVIEW__') m.t = '_(sugestão anterior)_'; });
    pendente = res;
    return { previa: true, n: res.itens.length };
  },
  registrarPeso(kg, cintura, pescoco) {
    if (pescoco) E.cfg.pescoco = pescoco;
    E.pesos = E.pesos.filter(p => p.d !== HOJE);
    const reg = { d: HOJE, kg };
    if (cintura) reg.cintura = cintura;
    const pe = pescoco || E.cfg.pescoco;
    if (pe) reg.pescoco = pe;
    if (reg.cintura && pe) {
      const bf = gorduraNavy(E.cfg.sexo, E.cfg.altura, reg.cintura, pe);
      if (bf != null) reg.bf = bf;
    }
    E.pesos.push(reg);
    aplicarMetaAdaptativa(true);
    gravar(); pintarTopo(); pintarProgresso();
    return { kg, bf: reg.bf || null };
  },
  registrarPassos(n) { dia().passos = n; gravar(); pintarHoje(); return { passos:n }; },
  registrarCardio(nome, min) {
    const chave = Object.keys(MET).find(k => norm(k).includes(norm(nome||''))) || Object.keys(MET)[0];
    const kcal = Math.round((MET[chave]||3) * 3.5 * pesoAtual() / 200 * min);
    dia().cardio.push({ n: chave, min, kcal });
    gravar(); pintarHoje();
    return { atividade: chave, min, kcal };
  },
  concluirTarefa(id) {
    const l = E.coach.concluidas[HOJE] = E.coach.concluidas[HOJE] || [];
    if (!l.includes(id)) l.push(id);
    gravar(); pintarHoje();
    return { id };
  },
  gerarCardapio(modo) {
    if (modo) E.cfg.modoCardapio = modo;
    const c = novoCardapio(); pintarPlano();
    return { modo: E.cfg.modoCardapio, kcal: c.total.kcal, desvio: c.desvio.pctKcal };
  },
  gerarCompras() {
    if (!E.cardapio) novoCardapio();
    E.compras = { d: HOJE, grupos: listaCompras([E.cardapio], 7), feitos: [] };
    gravar(); pintarPlano();
    return { grupos: Object.keys(E.compras.grupos).length };
  },
  evitarAlimento(nome) {
    const casado = baseCompleta().find(x => norm(x.n) === norm(nome)) ||
                   baseCompleta().find(x => norm(x.n).includes(norm(nome)));
    const n = casado ? casado.n : nome;
    if (!E.cfg.evitarAlimentos.includes(n)) E.cfg.evitarAlimentos.push(n);
    E.cardapio = null; gravar();
    return { alimento: n, casou: !!casado };
  },
  mudarFase(fase) {
    entrarEmFase(fase, tendAtual());
    pintarTopo(); pintarHoje();
    return { fase, kcal: E.cfg.kcal, faixa: E.cfg.faixaManut };
  },
  mudarIntensidade(nivel) {
    if (travaCobranca(E.coach.seguranca) && NIVEL[nivel] >= 2)
      throw new Error('modo HARD travado por segurança');
    E.cfg.intensidade = nivel; gravar(); pintarHoje();
    return { nivel };
  },
  definirRegra(peso, acao) {
    E.cfg.regraAcao = { peso, acao: acao || 'voltar a registrar todos os dias por duas semanas', d: HOJE };
    gravar(); pintarProgresso();
    return E.cfg.regraAcao;
  },
  ensinar(q, r2) {
    E.saberProprio.unshift({ q, a: r2, d: HOJE }); gravar();
    return { q };
  },
  lembrarFato(t2) { lembrar(E.memoria, t2); gravar(); return { fato: t2 }; }
};

/* Executa e registra no log. Confirmação vira botão no chat. */
let acaoPendente = null;

function agenteExecutar(nome, args, confirmado) {
  const r = executarFerramenta(nome, args, API_AGENTE, confirmado);
  if (r.ok) {
    E.logAgente = registrarNoLog(E.logAgente, { f: nome, args, ok: true });
    gravar();
  } else if (r.proibido) {
    E.logAgente = registrarNoLog(E.logAgente, { f: nome, args, ok: false, motivo: 'proibido' });
    gravar();
  }
  return r;
}


/* Ponto de integração do agente.

   Existe porque as camadas de IA vivem em arquivos separados e
   precisam de um caminho para agir. Expor isto NÃO contorna
   nada: toda chamada passa por executarFerramenta, que valida
   argumentos, recusa ferramenta proibida e exige confirmação
   nas ações que gravam dado. É a mesma porta que o chat usa. */
window.ControleAgente = {
  executar: (nome, args, confirmado) => agenteExecutar(nome, args, confirmado),
  ferramentas: () => catalogoFerramentas(),
  log: () => (E.logAgente || []).slice(0, 50)
};

/* Traduz o resultado de uma ferramenta em conversa. */
function respostaDaAcao(res, acao) {
  if (res.proibido) return '**Não faço isso.** ' + res.msg;
  if (res.precisaConfirmar) {
    acaoPendente = { nome: res.nome, args: res.args };
    return '__CONFIRMA__';
  }
  if (!res.ok) return 'Não consegui: ' + res.msg;

  const r = res.resultado || {};
  switch (res.nome) {
    case 'registrar_refeicao': return '__PREVIEW__';
    case 'registrar_peso': return `Peso registrado: **${br(String(r.kg))} kg**` +
      (r.bf ? `, ${br(String(r.bf))}% de gordura.` : '.');
    case 'registrar_passos': return `Passos de hoje: **${r.passos}**.`;
    case 'registrar_cardio': return `Registrado: ${r.atividade}, ${r.min} min, cerca de **${r.kcal} kcal**. Lembrando que não somo isso ao seu orçamento.`;
    case 'concluir_tarefa': return 'Tarefa marcada como concluída.';
    case 'gerar_cardapio': return `Cardápio montado no modo **${(MODOS[r.modo]||{}).rot || r.modo}**: ${r.kcal} kcal, desvio de ${r.desvio>=0?'+':''}${r.desvio}%. Está na aba Plano.`;
    case 'gerar_lista_compras': return `Lista de 7 dias pronta, ${r.grupos} grupos. Aba Plano.`;
    case 'evitar_alimento': return r.casou
      ? `Certo, vou evitar **${r.alimento}** no cardápio e nas trocas.`
      : `Anotei **${r.alimento}**. Não achei esse nome na base, mas fica registrado.`;
    case 'mudar_fase': return `Fase alterada para **${(FASES_PLANO[r.fase]||{}).rot || r.fase}**. Meta: ${r.kcal} kcal.` +
      (r.faixa ? ` Faixa de ${br(r.faixa.min.toFixed(1))} a ${br(r.faixa.max.toFixed(1))} kg.` : '');
    case 'mudar_intensidade': return `Coach em modo **${(INTENSIDADES.find(x=>x.id===r.nivel)||{}).rot || r.nivel}**.`;
    case 'definir_regra_acao': return `Combinado: ao passar de **${br(String(r.peso))} kg**, ${r.acao}.`;
    case 'ensinar': return `Guardado. Quando você perguntar *"${esc(r.q)}"*, respondo o que você escreveu.`;
    case 'lembrar_fato': return `Anotado: *${esc(r.fato)}*.`;
    default: return 'Feito.';
  }
}

/* ══ AÇÕES DO ASSISTENTE ══════════════════════════════
   O assistente propõe, a pessoa confirma. Nada é gravado
   no diário sem o toque de confirmar.                    */
let pendente = null;

function executarAcao(r, A, C, render) {
  const M = E.memoria;

  if (r.tipo === 'nome') {
    const m = norm(r.frase).match(/(?:meu nome e|me chamo|pode me chamar de|pode me chamar|sou o|sou a|nome)\s+([a-z]+)/);
    const nome = m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : '';
    if (!nome) { chatHist.push({ r:'ia', t:'Não peguei o nome. Escreve só assim: "meu nome é Fulano".' }); return; }
    M.nome = nome; E.cfg.nome = nome; gravar();
    chatHist.push({ r:'ia', t:`Fechado, **${nome}**. Vou te chamar assim daqui pra frente — e vou cobrar pelo nome também.` });
    return;
  }

  if (r.tipo === 'lembrar') {
    const t = r.frase.replace(/^.*?(lembra que|lembre que|anota que|guarda que|grava que|memoriza que|memoriza)\s*/i, '').trim();
    if (!t) { chatHist.push({ r:'ia', t:'O que você quer que eu lembre? Escreve "lembra que ..."' }); return; }
    lembrar(M, t); gravar();
    chatHist.push({ r:'ia', t:`Guardado: *${esc(t)}*.\n\nFica só neste aparelho, junto com o resto dos seus dados.` });
    return;
  }

  if (r.tipo === 'memorias') {
    const l = [];
    if (M.nome) l.push(`Seu nome: **${M.nome}**`);
    if (M.motivo) l.push(`Seu motivo: ${M.motivo}`);
    M.fatos.slice(0,10).forEach(f => l.push(`• ${f.t}`));
    chatHist.push({ r:'ia', t: l.length
      ? 'O que eu guardei sobre você:\n\n' + l.join('\n') + '\n\nPara apagar tudo, use Ajustes → Apagar todos os dados.'
      : 'Ainda não guardei nada. Diga "meu nome é ..." ou "lembra que ..." e eu passo a usar isso.' });
    return;
  }

  if (r.tipo === 'cobranca') {
    const t = r.desanimo
      ? acolher(A, M) + '\n\n' + puxaoDeOrelha(A, C, M)
      : puxaoDeOrelha(A, C, M);
    chatHist.push({ r:'ia', t });
    return;
  }

  if (r.tipo === 'tarefas') {
    const tf = missaoDoDia(ctxMissao());
    const pend = tf.filter(x => x.status !== 'concluida').slice(0,3);
    chatHist.push({ r:'ia', t: pend.length
      ? 'Suas três prioridades agora:\n\n' + pend.map((x,i)=>`**${i+1}. ${x.titulo}**${x.hora?' ('+x.hora+')':''} — ${x.detalhe||''}`).join('\n')
      : 'Missão do dia fechada. Nada pendente.' });
    return;
  }

  if (r.tipo === 'cobre') {
    const tf = missaoDoDia(ctxMissao());
    const trava = travaCobranca(E.coach.seguranca);
    const cb = cobrar(tf, E.cfg.intensidade, M.nome, trava ? { bloqueia:true, mensagem:'Cobrança suspensa por segurança.' } : null);
    chatHist.push({ r:'ia', t: cb.txt });
    return;
  }

  if (r.tipo === 'modo') {
    const alvo = r.nivel;
    if (travaCobranca(E.coach.seguranca) && NIVEL[alvo] >= 2) {
      chatHist.push({ r:'ia', t:'Não vou ligar o modo HARD agora. Você relatou algo que pede cuidado antes de disciplina — segurança vem primeiro, e isso destrava em até 14 dias.' });
      return;
    }
    E.cfg.intensidade = alvo; gravar(); pintarHoje();
    const d = INTENSIDADES.find(x=>x.id===alvo) || {};
    chatHist.push({ r:'ia', t:`Modo **${d.rot}** ligado. ${d.desc}\n\nLembrando: muda a frequência da cobrança, não o respeito.` });
    return;
  }

  if (r.tipo === 'cardapio') {
    if (r.modo) { E.cfg.modoCardapio = r.modo; }
    const c = novoCardapio();
    const linhas = REFS.slice(0,4).map(rf => {
      const it = (c.refs[rf.id]||[]);
      if (!it.length) return '';
      return `**${rf.nome}** — ` + it.map(i => `${i.n} ${i.gramas} g`).join(', ');
    }).filter(Boolean);
    pintarPlano();
    chatHist.push({ r:'ia', t:
      `Cardápio de hoje no modo **${(MODOS[E.cfg.modoCardapio]||{}).rot}**:\n\n` + linhas.join('\n\n') +
      `\n\nTotal: **${c.total.kcal} kcal**, ${c.total.p} g de proteína — desvio de ${c.desvio.pctKcal>=0?'+':''}${c.desvio.pctKcal}% da meta.` +
      `\n\nEstá na aba Plano, com botão para registrar cada refeição e trocar qualquer item por equivalente.` });
    return;
  }

  if (r.tipo === 'compras') {
    if (!E.cardapio) novoCardapio();
    E.compras = { d: HOJE, grupos: listaCompras([E.cardapio], 7), feitos: [] };
    gravar(); pintarPlano();
    const g = E.compras.grupos;
    const txt = Object.keys(g).map(k => `**${k}**\n` + g[k].map(x => `• ${x.n} — ${x.exibe}`).join('\n')).join('\n\n');
    chatHist.push({ r:'ia', t: 'Lista para 7 dias do cardápio atual:\n\n' + txt + '\n\nDá para marcar comprado na aba Plano.' });
    return;
  }

  if (r.tipo === 'fase') {
    const f = FASES_PLANO[E.cfg.fasePlano] || FASES_PLANO.perda;
    const fx = faixaAtual(), rg = estadoReganhoAtual(), td = tendAtual();
    let txt = `Você está na fase **${f.rot}**. ${f.desc}`;
    if (fx) txt += `\n\nFaixa de manutenção: **${br(fx.min.toFixed(1))} a ${br(fx.max.toFixed(1))} kg**` +
      (td != null ? `, tendência atual em ${br(td.toFixed(1))} kg.` : '.');
    if (rg && rg.nivel !== 'sem-dados') txt += `\n\n${rg.txt}`;
    if (E.cfg.regraAcao && E.cfg.regraAcao.peso)
      txt += `\n\nSua regra combinada: ao passar de ${br(E.cfg.regraAcao.peso)} kg, ${E.cfg.regraAcao.acao}.`;
    chatHist.push({ r:'ia', t: txt });
    return;
  }

  if (r.tipo === 'mudar-fase') {
    const alvo = r.fase, rot = (FASES_PLANO[alvo]||{}).rot || alvo;
    entrarEmFase(alvo, tendAtual());
    pintarTopo(); pintarHoje();
    chatHist.push({ r:'ia', t: `Fase alterada para **${rot}**. Sua meta agora é **${E.cfg.kcal} kcal**.` +
      (alvo === 'manutencao' && E.cfg.faixaManut
        ? `\n\nFaixa: ${br(E.cfg.faixaManut.min.toFixed(1))} a ${br(E.cfg.faixaManut.max.toFixed(1))} kg. Ficar dentro dela é sucesso — não persiga o número do meio.`
        : '') });
    return;
  }

  if (r.tipo === 'jejum') {
    const j = ctxJejum();
    const l = lerJejum(j.noturno != null ? j.noturno/60 : null);
    if (!j.refeicoes && !j.ultimaAnt) {
      chatHist.push({ r:'ia', t:'Ainda não tenho refeição registrada para calcular. O jejum sai do horário real em que você come — registre e ele aparece sozinho.' });
      return;
    }
    let txt = j.atual != null
      ? `Você está em jejum há **${fmtDur(j.atual)}**, desde as ${j.ultima}.`
      : 'Nenhuma refeição registrada hoje ainda.';
    if (j.noturno != null) txt += `\n\nJejum noturno: **${fmtDur(j.noturno)}** (fechou ontem às ${j.ultimaAnt}, abriu hoje às ${j.primeira}).`;
    if (j.janela) txt += ` Janela de alimentação: ${fmtDur(j.janela)}.`;
    if (l) txt += `\n\n**${l.rot}.** ${l.txt}`;
    chatHist.push({ r:'ia', t: txt });
    return;
  }

  if (r.tipo === 'registrar-peso') {
    const kg = r.kg;
    if (!kg || kg < 30 || kg > 300) { chatHist.push({ r:'ia', t:'Peso inválido. Confirma o número em kg.' }); return; }
    const res = agenteExecutar('registrar_peso', { kg }, true);
    chatHist.push({ r:'ia', t: res.ok
      ? `Peso de **${br(String(kg))} kg** registrado hoje. ${res.resultado && res.resultado.bf ? 'Gordura estimada: ' + br(String(res.resultado.bf)) + '%.' : ''}`
      : 'Não consegui registrar: ' + (res.msg || '') });
    return;
  }

  if (r.tipo === 'registrar') {
    const hora = new Date().getHours();
    const res = interpretarRefeicao(r.frase, baseCompleta(), hora);
    if (!res.itens.length) {
      const linhas = res.perdidos.map(p => p.sugestoes.length
        ? `**${esc(p.dito)}** — você quis dizer: ${p.sugestoes.map(esc).join(', ')}?`
        : `**${esc(p.dito)}**`);
      chatHist.push({ r:'ia', t: linhas.length
        ? `Não achei na base:\n\n${linhas.join('\n')}\n\nDigita de novo com um desses nomes, ou cadastra o alimento na aba Hoje.`
        : 'Não entendi quais alimentos você comeu. Escreve assim: "comi 100g de arroz, 1 bife e uma salada de tomate".' });
      return;
    }
    // uma prévia viva por vez: as antigas viram texto, senão o
    // histórico inteiro re-renderiza como se fosse a sugestão atual
    chatHist.forEach(m => { if (m.t === '__PREVIEW__') m.t = '_(sugestão anterior — substituída pela de baixo)_'; });
    pendente = res;
    chatHist.push({ r:'ia', t:'__PREVIEW__' });
    return;
  }
}


function htmlConfirma() {
  if (!acaoPendente) return '<div class="vazio">Ação já resolvida.</div>';
  const f = FERRAMENTAS[acaoPendente.nome] || {};
  const args = Object.keys(acaoPendente.args || {})
    .map(k => `<span class="cf-arg"><b>${esc(k)}</b> ${esc(String(acaoPendente.args[k]))}</span>`).join('');
  return `<div class="confirma">
    <div class="cf-tit">Confirmar ação</div>
    <p class="cf-desc">${esc(f.desc || acaoPendente.nome)}</p>
    ${args ? `<div class="cf-args">${args}</div>` : ''}
    <div class="linha-flex">
      <button type="button" class="btn mini" id="cf-ok">Confirmar</button>
      <button type="button" class="btn vazado mini" id="cf-no">Cancelar</button></div>
  </div>`;
}

function htmlPreview() {
  if (!pendente) return '';
  let p=0,c=0,g=0,al=0;
  pendente.itens.forEach(i => { p+=i.p; c+=i.c; g+=i.g; al+=i.alc||0; });
  const ref = REFS.find(x => x.id === pendente.refeicao) || REFS[1];
  return `<div class="prev">
    <div class="prev-tit">Entendi isto — confira antes de gravar</div>
    ${pendente.itens.map((i,ix)=>`<div class="prev-item">
      <span class="prev-nome"><b>${esc(i.nome)}</b><small>você disse: "${esc(i.dito)}"</small></span>
      <input type="number" value="${i.gramas}" data-prevg="${ix}" inputmode="numeric" aria-label="Gramas de ${esc(i.nome)}">
      <span class="fr-un">g</span>
      <button type="button" class="item-x" data-prevrm="${ix}" aria-label="Remover">×</button></div>`).join('')}
    ${pendente.perdidos.length ? `<p class="prev-perd">Não incluí: ${pendente.perdidos.map(p =>
      `<b>${esc(p.dito)}</b>${p.sugestoes.length ? ` (quis dizer ${esc(p.sugestoes.join(', '))}?)` : ''}`).join('; ')}. Adicione à mão se for relevante.</p>` : ''}
    <div class="prev-tot">Total <b>${kcalDe(p,c,g,al)} kcal</b> · P ${p.toFixed(0)} · C ${c.toFixed(0)} · G ${g.toFixed(0)}</div>
    <div class="linha-flex" style="margin-top:9px">
      <select id="prev-ref" style="flex:1">${REFS.map(x=>`<option value="${x.id}"${x.id===pendente.refeicao?' selected':''}>${x.nome}</option>`).join('')}</select>
      <button type="button" class="btn mini" id="prev-ok">Gravar</button></div>
  </div>`;
}

function gravarPendente() {
  if (!pendente || !pendente.itens.length) return;
  const ref = $('#prev-ref') ? $('#prev-ref').value : pendente.refeicao;
  const d = dia();
  if (!d.refs[ref]) d.refs[ref] = [];
  pendente.itens.forEach(i => {
    const reg = { n:i.nome, q:i.q, u:i.u, p:i.p, c:i.c, g:i.g, kcal:kcalDe(i.p,i.c,i.g,i.alc), h: horaAgora() };
    if (i.alc) reg.alc = i.alc;
    d.refs[ref].push(reg);
    E.recentes = [i.nome].concat(E.recentes.filter(x=>x!==i.nome)).slice(0,20);
  });
  const n = pendente.itens.length;
  const nomeRef = (REFS.find(x=>x.id===ref)||{}).nome;
  pendente = null;
  gravar(); pintarTopo(); pintarHoje();
  const s2 = somaDia(), resta = E.cfg.kcal - s2.kcal;
  chatHist.forEach(m => { if (m.t === '__PREVIEW__') m.t = '_(registrado)_'; });
  chatHist[chatHist.length-1] = { r:'ia', t:
    `Gravado: ${n} ${n===1?'item':'itens'} em **${nomeRef}**.\n\n` +
    (resta >= 0
      ? `Sobram **${resta} kcal** e ${Math.max(0,Math.round(E.cfg.prot - s2.p))} g de proteína pra hoje.`
      : `Você passou da meta em ${Math.abs(resta)} kcal. Um dia não desfaz a semana — volte ao normal amanhã, sem compensar cortando.`) };
  vibrar(20);
}

/* ── assistente: embutido por padrão, modelo local opcional ── */
let chatHist = [];
let modoLLM = false;

function abrirChat() {
  const A = diagnosticar(ctxDiag());
  const sug = sugestoes(A);
  abrirGaveta(E.cfg.iaNome || 'Assistente', `
    <div class="chat" id="chat-log">${chatHist.length
      ? chatHist.map(m => `<div class="msg ${m.r}">${fmtMd(m.t)}</div>`).join('')
      : `<div class="msg ia">${fmtMd(aberturaChat(A))}</div>`}</div>
    <div class="sugs" id="sugs">${sug.concat(['Quanta proteína eu preciso?','Posso beber cerveja?'])
      .slice(0,6).map(q=>`<button type="button" class="sug" data-sug="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="linha-flex" style="margin-top:9px">
      <input type="text" id="chat-in" placeholder="Pergunte sobre seus números…" autocomplete="off">
      <button type="button" class="btn mini" id="chat-go">Enviar</button></div>
    <p class="nota">Respostas montadas a partir do seu diagnóstico. Nada sai do aparelho e nada é estimado.
    Assunto clínico eu não respondo — para isso, procure um profissional.</p>
    <button type="button" class="btn vazado mini" id="modo-llm">
      ${modoLLM ? 'Voltar ao assistente embutido'
        : IAChave.ler(E.cfg.iaProv) ? 'Conversa livre com ' + esc((IA_PROVEDORES[E.cfg.iaProv]||{}).rot || 'IA')
        : 'Ativar conversa livre com IA'}</button>`);

  const log = () => $('#chat-log');
  const render = () => { const l = log(); if (!l) return;
    l.innerHTML = chatHist.map(m =>
      m.t === '__PREVIEW__' ? `<div class="msg ia sem-bolha">${htmlPreview()}</div>`
      : m.t === '__CONFIRMA__' ? `<div class="msg ia sem-bolha">${htmlConfirma()}</div>`
      : `<div class="msg ${m.r}">${fmtMd(m.t)}</div>`).join('');
    l.scrollTop = l.scrollHeight; };

  const enviar = async (texto) => {
    const el = $('#chat-in');
    const txt = (texto != null ? texto : (el ? el.value : '')).trim();
    if (!txt) return;
    if (el) el.value = '';
    const A2 = diagnosticar(ctxDiag()), C2 = ctxAssist();
    chatHist.push({ r:'eu', t:txt });

    // Safety Engine antes de tudo: nenhuma cobrança, plano ou
    // registro acontece se houver sinal de risco na mensagem.
    const risco = checarSeguranca(txt);
    if (risco) {
      E.coach.seguranca.push({ d: HOJE, grupo: risco.grupo, mensagem: risco.mensagem });
      if (NIVEL[E.cfg.intensidade] >= 2) E.cfg.intensidade = 'normal';
      gravar();
      chatHist.push({ r:'ia', t: risco.mensagem });
      render(); pintarHoje();
      return;
    }

    if (!modoLLM) {
      /* Ordem do raciocínio, e ela importa:
         1. ação pedida (registrar, cardápio, modo, tarefa) executa
         2. base de conhecimento responde, já com os números da pessoa
         3. intenções de dados respondem
         4. fallback mostra o escopo
         Sem essa ordem, "quanta proteína eu preciso" caía na
         intenção de dados e a pessoa recebia só o número, sem o
         porquê — que é justamente o que ela perguntou. */
      const resp = responderLivre(txt, A2, C2);

      if (typeof resp === 'object' && resp && resp.tipo) {
        executarAcao(resp, A2, C2, render);
      } else {
        const topico = buscarSaber(txt, E.saberProprio);
        if (topico) {
          ultimoTopico = topico.id;
          chatHist.push({ r:'ia', t: tonalizar(topico.t(dadosSaber()), E.cfg.intensidade, E.memoria.nome) });
        } else if (typeof resp === 'string' && resp.indexOf('Não entendi bem') === 0) {
          chatHist.push({ r:'ia', t: naoEntendi(A2) });
        } else {
          chatHist.push({ r:'ia', t: tonalizar(resp, E.cfg.intensidade, E.memoria.nome) });
        }
      }
      render();
      const sg = $('#sugs');
      if (sg) sg.innerHTML = sugestoes(A2).map(q=>`<button type="button" class="sug" data-sug="${esc(q)}">${esc(q)}</button>`).join('');
      return;
    }

    chatHist.push({ r:'ia', t:'…' }); render();
    const contexto = resumoParaIA(A2, ctxDiag());
    try {
      if (IAChave.ler(E.cfg.iaProv)) {
        // chave do próprio usuário, chamada direta ao provedor
        const ctxAgente = contexto + '\n\nFERRAMENTAS DISPONÍVEIS (use só se a pessoa pediu uma ação):\n'
          + catalogoFerramentas()
          + '\n\nPara executar, responda com o JSON {"ferramenta":"nome","argumentos":{...}} e nada mais.'
          + ' Para conversar, responda em texto normal. Nunca invente ferramenta que não está na lista.';
        const r2 = await perguntarIA(E.cfg.iaProv, E.cfg.iaModelo || undefined,
                                     ctxAgente, txt, E.cfg.intensidade);
        const acao = extrairAcao(r2);
        if (acao) {
          const res = agenteExecutar(acao.nome, acao.args, false);
          chatHist[chatHist.length-1].t = respostaDaAcao(res, acao);
        } else {
          chatHist[chatHist.length-1].t = r2 || '(resposta vazia)';
        }
      } else {
        // ia-local.js precisa de dados objetivos (não da string `contexto`,
        // que é o resumo em prosa usado só pelo caminho de LLM externo) e
        // executa ações via window.ControleAgente.executar — já existe,
        // já valida, já confirma e já loga. Nada mais precisa ser passado.
        const ctxIAL = {
          nome: E.memoria.nome || E.cfg.nome || '',
          kcal: E.cfg.kcal,
          saldoKcal: E.cfg.kcal - somaDia().kcal,
          protRestante: Math.max(0, E.cfg.prot - somaDia().p),
          ritmoSemana: (function () {
            const r = ritmoSemanal(28);
            return r ? (r.pct * 100).toFixed(2) : null;
          })()
        };
        await IAL.perguntar(txt, ctxIAL, p => { chatHist[chatHist.length-1].t = p; render(); });
      }
    } catch (err) {
      /* Queda para o embutido em QUALQUER falha. Chave errada,
         cota estourada, provedor fora, sem internet — a pergunta
         é respondida de todo jeito. */
      const topico = buscarSaber(txt, E.saberProprio);
      const alternativa = topico
        ? tonalizar(topico.t(dadosSaber()), E.cfg.intensidade, E.memoria.nome)
        : responderLivre(txt, A2, C2);
      chatHist[chatHist.length-1].t =
        '_A IA externa falhou: ' + esc(err.message) + '. Respondendo pelo conhecimento embutido._\n\n' +
        (typeof alternativa === 'string' ? alternativa : naoEntendi(A2));
      modoLLM = false;
    }
    render();
  };

  $('#chat-go').addEventListener('click', () => enviar());
  $('#chat-in').addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  $('#gaveta-corpo').addEventListener('input', e => {
    const i = e.target.dataset.prevg;
    if (i != null && pendente) {
      const it = pendente.itens[+i], a = it.alimento;
      it.gramas = Math.max(0, parseFloat(e.target.value) || 0);
      const f = it.gramas/100;
      it.p=+(a.p*f).toFixed(1); it.c=+(a.c*f).toFixed(1); it.g=+(a.g*f).toFixed(1);
      it.alc = a.alc ? +(a.alc*f).toFixed(1) : 0;
      it.q = it.gramas; it.u = 'g';
    }
  });
  $('#gaveta-corpo').addEventListener('click', e => {
    if (e.target.id === 'cf-ok') {
      const ap = acaoPendente;
      acaoPendente = null;
      const res = agenteExecutar(ap.nome, ap.args, true);
      chatHist[chatHist.length-1] = { r:'ia', t: respostaDaAcao(res, ap) };
      render(); pintarTopo(); return;
    }
    if (e.target.id === 'cf-no') {
      acaoPendente = null;
      chatHist[chatHist.length-1] = { r:'ia', t:'Cancelado. Nada foi alterado.' };
      render(); return;
    }
    if (e.target.id === 'prev-ok') { gravarPendente(); render(); return; }
    const rm = e.target.closest('[data-prevrm]');
    if (rm && pendente) { pendente.itens.splice(+rm.dataset.prevrm,1); render(); return; }
    const b = e.target.closest('[data-sug]');
    if (b) return enviar(b.dataset.sug);
    if (e.target.id === 'modo-llm') {
      if (modoLLM) { modoLLM = false; abrirChat(); return; }
      configurarLLM();
    }
  });
}

/* Sem camada de servidor por decisão de projeto: chave do dono
   do app publicada significa cota do dono sendo consumida por
   qualquer visitante. O conhecimento embutido cobre o caso de
   uso, e a conversa livre é download do próprio usuário. */
function configurarLLM() {
  // chave do usuário já configurada: entra direto
  if (IAChave.ler(E.cfg.iaProv)) {
    modoLLM = true;
    toast('Conversa livre com ' + ((IA_PROVEDORES[E.cfg.iaProv]||{}).rot || 'IA') + '.', 3200);
    abrirChat();
    return;
  }

  // sem chave: explica as duas opções em vez de empurrar o download
  abrirGaveta('Conversa livre', `
    <div class="alerta"><div class="alerta-tit">Você não precisa disto</div>
    <p>O assistente do app responde ${SABER.length + (E.saberProprio||[]).length} tópicos de nutrição e treino
    offline, sem chave e sem custo — e é mais preciso sobre os <b>seus números</b> que qualquer modelo genérico.
    A conversa livre serve para perguntar coisas fora desse escopo.</p></div>

    <div class="bloco"><div class="bloco-tit"><span>Opção 1 · sua própria chave</span><b>recomendada</b></div>
      <p style="font-size:13px;margin:0 0 9px">Você cola a chave de um provedor em Ajustes. No Gemini a camada
      gratuita não pede cartão e cada pessoa tem a própria cota. Nada é cobrado do app nem de outro usuário.</p>
      <button type="button" class="btn mini" id="ir-ajustes-ia">Configurar em Ajustes</button></div>

    <div class="bloco"><div class="bloco-tit"><span>Opção 2 · modelo no navegador</span><b>sem chave</b></div>
      <p style="font-size:13px;margin:0 0 9px">Baixa um modelo que roda dentro do aparelho, de centenas de MB
      a alguns GB, uma vez. Depois funciona offline. <b>Use Wi-Fi.</b> Modelo pequeno conversa pior e
      não calcula nada.</p>
      ${IAL.suportado()
        ? '<button type="button" class="btn vazado mini" id="ir-webgpu">Ver modelos disponíveis</button>'
        : '<p class="nota" style="margin:0">Indisponível: este navegador não expõe a GPU para páginas web.</p>'}</div>

    <button type="button" class="btn vazado mini" id="voltar-chat">Voltar ao assistente embutido</button>`);

  $('#gaveta-corpo').addEventListener('click', e => {
    if (e.target.id === 'ir-ajustes-ia') { fecharGaveta(); irPara('ajustes'); return; }
    if (e.target.id === 'voltar-chat') { abrirChat(); return; }
    if (e.target.id === 'ir-webgpu') { escolherModeloLocal(); return; }
  });
}

function escolherModeloLocal() {
  if (!IAL.suportado()) {
    abrirGaveta('Conversa livre', `<div class="alerta ocre"><div class="alerta-tit">WebGPU indisponível</div>
      <p>Este navegador não expõe a GPU para páginas web, então não dá para rodar um modelo aqui.</p></div>
      <p class="nota">O assistente embutido continua funcionando normalmente — ele nunca dependeu de IA.</p>
      <button type="button" class="btn" id="voltar-chat">Voltar ao assistente</button>`);
    $('#gaveta-corpo').addEventListener('click', e => { if (e.target.id==='voltar-chat') abrirChat(); });
    return;
  }
  if (IAL.pronto()) { modoLLM = true; abrirChat(); return; }

  abrirGaveta('Conversa livre', `
    <div class="alerta ocre"><div class="alerta-tit">Isto baixa um modelo grande</div>
    <p>De centenas de MB a alguns GB, uma vez, guardado no navegador. <b>Use Wi-Fi.</b>
    Não vem no app porque o GitHub bloqueia arquivo acima de 100 MB e o Pages tem teto de 1 GB.</p></div>
    <div class="alerta"><div class="alerta-tit">Vale a pena?</div>
    <p>O modelo conversa com mais naturalidade, mas <b>não calcula nada</b>: ele recebe o mesmo diagnóstico
    que o assistente embutido já usa. Para perguntar sobre seus números, o embutido é mais preciso e instantâneo.</p></div>
    <div id="mod-lista"><div class="carregando"><div class="spin"></div><p>Consultando modelos…</p></div></div>
    <button type="button" class="btn vazado mini" id="voltar-chat" style="margin-top:10px">Voltar ao assistente embutido</button>`);

  IAL.modelos().then(ms => {
    const alvo = $('#mod-lista'); if (!alvo) return;
    alvo.innerHTML = ms.length
      ? '<ul class="res">' + ms.map(m => `<li><button type="button" data-mod="${esc(m.id)}">
          <span><b>${esc(m.rot)}</b><small>memória ~${m.mb} MB</small></span>
          <span class="res-k">${m.mb<1200?'leve':m.mb<2400?'médio':'pesado'}</span></button></li>`).join('') + '</ul>'
      : '<div class="vazio">Não consegui listar os modelos. Verifique a conexão.</div>';
  }).catch(err => {
    const alvo = $('#mod-lista');
    if (alvo) alvo.innerHTML = `<div class="vazio">Falha ao carregar: ${esc(err.message)}</div>`;
  });

  $('#gaveta-corpo').addEventListener('click', ev => {
    if (ev.target.id === 'voltar-chat') return abrirChat();
    const b = ev.target.closest('[data-mod]');
    if (b) baixarModelo(b.dataset.mod);
  });
}

function baixarModelo(id) {
  abrirGaveta('Baixando modelo', `
    <div class="carregando"><div class="spin"></div><p id="dl-txt">Iniciando…</p></div>
    <div class="trilha" style="height:10px;background:var(--linha)"><div class="preenche" id="dl-bar" style="background:var(--frio);width:0%"></div></div>
    <p class="nota">Pode levar vários minutos. Deixe a tela ligada.</p>`);
  IAL.carregar(id, (txt, prog) => {
    const t=$('#dl-txt'), bar=$('#dl-bar');
    if (t) t.textContent = txt || 'Carregando…';
    if (bar && prog != null) bar.style.width = Math.round(prog*100)+'%';
  }).then(() => {
    E.cfg.modeloIA = id; gravar(); modoLLM = true;
    toast('Modelo pronto. Funciona offline a partir de agora.', 4200);
    abrirChat();
  }).catch(err => {
    abrirGaveta('Não deu', `<div class="alerta ocre"><div class="alerta-tit">Falha ao carregar</div>
      <p>${esc(err.message)}</p></div>
      <button type="button" class="btn" id="voltar-chat">Voltar ao assistente embutido</button>`);
    $('#gaveta-corpo').addEventListener('click', e => { if (e.target.id==='voltar-chat') abrirChat(); });
  });
}


/* ══ CARDÁPIO E LISTA DE COMPRAS ══════════════════════ */
function opcoesCardapio() {
  return {
    base: baseCompleta(), modo: E.cfg.modoCardapio,
    preferir: E.recentes.slice(0,12), favoritos: E.favoritos,
    evitar: E.cfg.evitarAlimentos || []
  };
}

function novoCardapio() {
  const m = { kcal: E.cfg.kcal, prot: E.cfg.prot, carb: E.cfg.carb, gord: E.cfg.gord };
  E.cardapio = gerarCardapio(m, opcoesCardapio());
  E.cardapio.d = HOJE;
  gravar();
  return E.cardapio;
}

function blocoCardapio() {
  const c = E.cardapio;
  const modo = MODOS[E.cfg.modoCardapio] || MODOS.padrao;

  let h = `<div class="bloco"><div class="bloco-tit"><span>Cardápio do dia</span>
      <b>${esc(modo.rot)}</b></div>
    <label class="campo"><span>Modo</span><select id="cfg-modocard">
      ${Object.keys(MODOS).map(k=>`<option value="${k}"${E.cfg.modoCardapio===k?' selected':''}>${esc(MODOS[k].rot)}</option>`).join('')}</select></label>
    <p class="nota" style="margin-top:0">${esc(modo.desc)}</p>`;

  if (!c || c.d !== HOJE) {
    h += `<button type="button" class="btn" id="gerar-card">Montar cardápio de hoje</button>
      <p class="nota">Usa suas metas atuais e prioriza o que você já come — aderência vence teoria.</p></div>`;
    return h;
  }

  const dv = c.desvio;
  h += REFS.slice(0,4).map(r => {
    const itens = c.refs[r.id] || [];
    if (!itens.length) return '';
    const k = itens.reduce((t,i)=>t+i.kcal,0);
    return `<div class="card-ref"><div class="card-cab"><span>${r.hora} · ${r.nome}</span><b>${k} kcal</b></div>
      ${itens.map((i,ix)=>`<div class="card-item">
        <span class="card-nome"><b>${esc(i.n)}</b><small>${i.gramas} g · P ${i.p} C ${i.c} G ${i.g_}</small></span>
        <button type="button" class="card-troca" data-trocacard="${r.id}:${ix}" aria-label="Trocar">⇄</button></div>`).join('')}
      <button type="button" class="card-add" data-usarref="${r.id}">Registrar esta refeição</button></div>`;
  }).join('');

  h += `<div class="card-tot">Total <b>${c.total.kcal} kcal</b> · P ${c.total.p} · C ${c.total.c} · G ${c.total.g}
    <small>meta ${E.cfg.kcal} kcal · ${E.cfg.prot} g de proteína</small></div>
    <p class="nota">Desvio de ${dv.kcal>=0?'+':''}${dv.kcal} kcal (${dv.pctKcal>=0?'+':''}${dv.pctKcal}%) e
    ${dv.prot>=0?'+':''}${Math.round(dv.prot)} g de proteína. Comida não fecha em número redondo —
    até 10% de desvio é irrelevante no resultado.</p>
    <div class="linha-flex">
      <button type="button" class="btn vazado mini" id="gerar-card">Gerar outro</button>
      <button type="button" class="btn vazado mini" id="usar-tudo">Registrar o dia</button></div></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Lista de compras</span>
      <button type="button" id="gerar-compras">7 dias</button></div>`;
  if (E.compras && E.compras.d === HOJE) {
    const g = E.compras.grupos;
    h += Object.keys(g).map(nome => `<div class="compra-grupo"><div class="compra-tit">${esc(nome)}</div>
      ${g[nome].map((x,i)=>`<button type="button" class="compra-item${(E.compras.feitos||[]).includes(x.n)?' feito':''}" data-compra="${esc(x.n)}">
        <span>${esc(x.n)}</span><b>${esc(x.exibe)}</b></button>`).join('')}</div>`).join('');
    h += `<p class="nota">Toque para marcar comprado. Quantidades consolidadas para 7 dias do cardápio atual.</p>`;
  } else {
    h += '<div class="vazio">Gere o cardápio e depois a lista para 7 dias.</div>';
  }
  h += '</div>';
  return h;
}

/* ══ TELA PLANO ═══════════════════════════════════════ */
function pintarPlano() {
  const c = E.cfg, m = calcularMetas(), sem = semanaNoCiclo();
  let h = `<div class="alerta ocre"><div class="alerta-tit">Antes de tudo</div>
    <p>Com IMC nessa faixa, faça check-up (pressão, glicemia/HbA1c, lipídeos, TSH) e avise que vai treinar força.
    Este app organiza execução e mede resultado. Ele não diagnostica e não substitui médico nem nutricionista.</p></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Metas de hoje</span><b>${c.kcal} kcal</b></div>
    <div class="grade3">
      <div><div class="kpi-num">${c.prot}<small>g</small></div><div class="kpi-rot">Proteína</div></div>
      <div><div class="kpi-num">${c.carb}<small>g</small></div><div class="kpi-rot">Carbo</div></div>
      <div><div class="kpi-num">${c.gord}<small>g</small></div><div class="kpi-rot">Gordura</div></div></div>
    <p class="nota">Gasto estimado ${m.tdee} kcal (basal ${m.tmb} × atividade ${br(c.atividade)}), déficit de ${c.deficit}.
    Proteína calculada sobre peso ajustado de ${m.ajust} kg — usar o peso atual inflaria o alvo sem benefício.</p></div>`;

  h += blocoCardapio();

  h += '<div class="bloco"><div class="bloco-tit"><span>Mesociclo de 12 semanas</span><b>semana '+sem+'</b></div>'
    + FASES.map(f=>`<div class="hist${f.sem.includes(sem)?' ag':''}"><div class="hist-esq">
      <b>${esc(f.nome)} · sem ${f.sem[0]}${f.sem.length>1?'–'+f.sem[f.sem.length-1]:''}</b>${esc(f.foco)}</div>
      <div style="text-align:right;white-space:nowrap">${f.series}×${f.repMin}–${f.repMax}<br>
      <span style="color:var(--tinta2)">RIR ${f.rirAlvo}${f.fatorCarga<1?' · '+Math.round(f.fatorCarga*100)+'%':''}</span></div></div>`).join('')
    + `<p class="nota">Ao fim da semana 12 um novo ciclo começa, mantendo as cargas conquistadas.
      Em déficit, volume alto é o primeiro a comprometer recuperação — por isso o ciclo controla volume e preserva intensidade.</p>
      <button type="button" class="btn vazado mini" id="reiniciar-ciclo" style="margin-top:8px">Reiniciar ciclo hoje</button></div>`;

  ['A','B','C'].forEach(k => {
    const r = E.rotinas[k];
    h += `<div class="bloco"><div class="bloco-tit"><span>${esc(r.nome)}</span>
      <button type="button" data-add-rot="${k}">+ exercício</button></div>`
      + r.ex.map((e,i)=>{
        const b = EXERCICIOS.find(x=>x.n===e.n)||{};
        return `<div class="hist"><div class="hist-esq"><b>${i+1}. ${esc(e.n)}</b>${esc(b.gm||'')} · ${esc(b.eq||'')} · impacto ${esc(b.imp||'—')}</div>
          <div class="item-dir">${TECNICA[e.n]?`<button type="button" class="btn-tec" data-tec="${esc(e.n)}" aria-label="Como executar">?</button>`:''}
          <button type="button" class="item-x" data-rm-rot="${k}:${i}" aria-label="Remover">×</button></div></div>`;
      }).join('') + '</div>';
  });

  h += `<div class="bloco"><div class="bloco-tit"><span>Cardio e passos</span><b>${c.passosMeta}/dia</b></div>
    <p style="font-size:13px;margin:0">Caminhada, não corrida. Acima de 100 kg, cada passo de corrida multiplica a carga no joelho
    e no tornozelo sem entregar gasto que a caminhada inclinada não entregue. Esteira a 5 km/h com 6–8% de inclinação,
    25 minutos nos dias sem musculação. Bicicleta se aparecer dor articular.</p>
    <p class="nota">Migre para peso livre por volta dos 105 kg, quando a alavanca do próprio corpo já estiver menor.</p></div>`;

  $('#tela-plano').innerHTML = h;
}


function registrarDoCardapio(ref, silencioso) {
  const c = E.cardapio;
  if (!c || !c.refs[ref]) return;
  const d = dia();
  if (!d.refs[ref]) d.refs[ref] = [];
  c.refs[ref].forEach(i => {
    d.refs[ref].push({ n:i.n, q:i.q, u:i.u, p:i.p, c:i.c, g:i.g_, kcal:i.kcal, h: horaAgora() });
    E.recentes = [i.n].concat(E.recentes.filter(x=>x!==i.n)).slice(0,20);
  });
  if (!silencioso) {
    gravar(); pintarTopo(); pintarHoje();
    toast((REFS.find(r=>r.id===ref)||{}).nome + ' registrada');
  }
}

function abrirTrocaCardapio(ref, ix) {
  const item = E.cardapio.refs[ref][ix];
  const alt = substituirPorFuncao(item, baseCompleta(), E.cfg.modoCardapio);
  const FN = { proteina:'fonte de proteína', carboidrato:'fonte de carboidrato',
               gordura:'fonte de gordura', vegetal:'vegetal', fruta:'fruta',
               laticinio:'laticínio', bebida:'bebida', misto:'item' };
  abrirGaveta('Trocar ' + item.n, `
    <div class="bloco"><div class="bloco-tit"><span>Item atual</span><b>${item.kcal} kcal</b></div>
      <div style="font-family:var(--mono);font-size:13px">${esc(item.n)} · ${item.gramas} g · P ${item.p}</div>
      <p class="nota">As opções abaixo são <b>${esc(FN[item.funcao]||'equivalentes')}</b> com a mesma caloria e o
      macro que define essa função dentro de 30%. Trocar só por caloria colocaria pão no lugar de frango.</p></div>
    ${alt.length ? `<ul class="res">${alt.map((x,i)=>`<li><button type="button" data-altcard="${i}">
      <span><b>${esc(x.a.n)}</b><small>${x.gramas} g · P ${x.p} · C ${x.c} · G ${x.g_}</small></span>
      <span class="res-k">${Math.round(x.a.p*4*x.gramas/100 + x.a.c*4*x.gramas/100 + x.a.g*9*x.gramas/100)}</span></button></li>`).join('')}</ul>`
      : '<div class="vazio">Sem equivalente próximo nesse modo. Tente o modo Padrão.</div>'}`);

  $('#gaveta-corpo').addEventListener('click', ev => {
    const b = ev.target.closest('[data-altcard]');
    if (!b) return;
    const x = alt[+b.dataset.altcard], f = x.gramas/100;
    E.cardapio.refs[ref][ix] = {
      n:x.a.n, alimento:x.a, funcao:item.funcao, gramas:x.gramas,
      q: x.a.un && x.gramas % x.a.un === 0 ? x.gramas/x.a.un : x.gramas,
      u: x.a.un && x.gramas % x.a.un === 0 ? x.a.unNome : 'g',
      p:x.p, c:x.c, g_:x.g_, kcal: Math.round((x.a.p*4+x.a.c*4+x.a.g*9)*f)
    };
    const t = { p:0,c:0,g:0,kcal:0 };
    Object.keys(E.cardapio.refs).forEach(r => E.cardapio.refs[r].forEach(i => {
      t.p+=i.p; t.c+=i.c; t.g+=i.g_; t.kcal+=i.kcal; }));
    E.cardapio.total = { p:Math.round(t.p), c:Math.round(t.c), g:Math.round(t.g), kcal:t.kcal };
    E.cardapio.desvio = { kcal: t.kcal-E.cfg.kcal, prot: t.p-E.cfg.prot,
                          pctKcal: Math.round(((t.kcal-E.cfg.kcal)/E.cfg.kcal)*100) };
    gravar(); fecharGaveta(); pintarPlano(); toast('Trocado por ' + x.a.n);
  });
}

/* ══ TELA AJUSTES ═════════════════════════════════════ */
function notifLista() {
  const D = ['D','S','T','Q','Q','S','S'];
  if (!E.cfg.notif || !E.cfg.notif.length) return '<div class="vazio">Nenhum lembrete.</div>';
  return E.cfg.notif.map(n=>`<div class="hist"><div class="hist-esq">
    <b>${n.hora} · ${D.map((x,i)=>n.dias.includes(i)?x:'·').join('')}</b>${esc(n.txt)}</div>
    <button type="button" class="item-x" data-rm-notif="${n.id}" aria-label="Remover">×</button></div>`).join('');
}

function pintarAjustes() {
  const c = E.cfg;
  const perm = ('Notification' in window) ? Notification.permission : 'indisponível';
  let h = '';

  const trava = travaCobranca(E.coach.seguranca);
  h += `<div class="bloco"><div class="bloco-tit"><span>Intensidade do coach</span>
      <b>${esc((INTENSIDADES.find(x=>x.id===c.intensidade)||INTENSIDADES[1]).rot)}</b></div>
    <label class="campo"><span>Como você quer ser cobrado</span><select id="cfg-intens"${trava?' disabled':''}>
      ${INTENSIDADES.map(x=>`<option value="${x.id}"${c.intensidade===x.id?' selected':''}>${esc(x.rot)}</option>`).join('')}</select></label>
    <p class="nota" style="margin-top:0">${esc((INTENSIDADES.find(x=>x.id===c.intensidade)||INTENSIDADES[1]).desc)}</p>
    ${trava ? `<div class="alerta ocre"><div class="alerta-tit">Cobrança suspensa</div>
      <p>Você relatou algo que pede cuidado antes de disciplina. Os níveis HARD ficam travados por até 14 dias —
      e isso não é punição, é a ordem certa das prioridades.</p></div>` : ''}
    <p class="nota">A escala muda <b>frequência e objetividade</b> da cobrança, nunca a dureza da linguagem.
    Nenhum nível autoriza culpa, humilhação ou meta extrema — segurança vence cobrança em todos eles.</p></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Notificações</span><b>${perm}</b></div>
    <label class="campo"><span>Lembretes ativos</span><select id="cfg-notif">
      <option value="1"${c.notifAtivo?' selected':''}>Sim</option>
      <option value="0"${!c.notifAtivo?' selected':''}>Não</option></select></label>
    ${notifLista()}
    <button type="button" class="btn vazado mini" id="add-notif" style="margin-top:8px">+ novo lembrete</button>
    <p class="nota">App web só dispara lembrete com o app aberto ou em segundo plano recente.
    Mantenha em paralelo os alarmes nativos do Android para os horários fixos.</p></div>`;

  const mem = (E.memoria.fatos||[]);
  const obsv = mem.filter(x => x.origem === 'observado');
  const manu = mem.filter(x => x.origem !== 'observado');
  h += `<div class="bloco aprendi"><div class="bloco-tit"><span>O que aprendi sobre você</span>
      <b>${obsv.length} padrões</b></div>
    <p class="nota" style="margin:0 0 9px">Observado dos seus próprios dados, sempre com a evidência à vista.
    Isso é personalização, não diagnóstico — e você pode apagar qualquer linha.</p>
    ${obsv.length ? obsv.map((x,i)=>`<div class="mem-item">
        <span class="mem-txt"><b>${esc(x.t)}</b><small>${esc(x.ev||'')}${x.desde?' · desde '+fmtData(x.desde):''}</small></span>
        <button type="button" class="item-x" data-mem-rm="${esc(x.chave||x.t)}" aria-label="Apagar">×</button></div>`).join('')
      : '<div class="vazio">Ainda sem padrão suficiente. São necessários alguns dias de registro.</div>'}
    ${manu.length ? `<div class="bloco-tit" style="margin:12px 0 6px"><span>O que você me contou</span></div>` +
      manu.map(x=>`<div class="mem-item"><span class="mem-txt"><b>${esc(x.t)}</b><small>${x.d?fmtData(x.d):''}</small></span>
        <button type="button" class="item-x" data-mem-rm="${esc(x.t)}" aria-label="Apagar">×</button></div>`).join('') : ''}
    <button type="button" class="btn vazado mini" id="mem-rodar" style="margin-top:9px">Reanalisar agora</button></div>`;

  if (E.logAgente.length) {
    h += `<div class="bloco"><div class="bloco-tit"><span>Ações do assistente</span><b>${E.logAgente.length}</b></div>
      <p class="nota" style="margin:0 0 8px">Tudo que o assistente executou. Se algo mudou no app, está aqui.</p>
      ${E.logAgente.slice(0,12).map(l=>`<div class="hist"><div class="hist-esq">
        <b>${esc(l.f)}</b>${esc(l.d)}${l.motivo?' · '+esc(l.motivo):''}</div>
        <div style="color:${l.ok?'var(--sinal)':'var(--oxido)'}">${l.ok?'ok':'recusado'}</div></div>`).join('')}
      <button type="button" class="btn vazado mini" id="log-limpar" style="margin-top:8px">Limpar histórico</button></div>`;
  }

  h += `<div class="bloco ia-bloco"><div class="bloco-tit"><span>Assistente</span>
      <b>${SABER.length + (E.saberProprio||[]).length} tópicos</b></div>
    <label class="campo"><span>Como quer chamar o assistente</span>
      <input type="text" id="cfg-ianome" value="${esc(c.iaNome||'Coach')}" maxlength="20"></label>

    <div class="bloco-tit" style="margin:12px 0 7px"><span>Alimentos a evitar</span></div>
    <p class="nota" style="margin:0 0 8px">O cardápio e as substituições param de sugerir estes. Vale para
    o que você não gosta, não tolera ou não tem em casa.</p>
    <div class="linha-flex" style="margin-bottom:7px">
      <input type="text" id="ev-novo" placeholder="Ex.: Fígado bovino grelhado" autocomplete="off">
      <button type="button" class="btn mini" id="ev-add">Adicionar</button></div>
    ${(c.evitarAlimentos||[]).length
      ? `<div class="chips" style="flex-wrap:wrap">${c.evitarAlimentos.map(n=>
          `<button type="button" class="chip" data-ev-rm="${esc(n)}">${esc(n)} ×</button>`).join('')}</div>`
      : '<div class="vazio">Nenhum alimento na lista.</div>'}

    <div class="bloco-tit" style="margin:14px 0 7px"><span>Ensinar o assistente</span>
      <b>${(E.saberProprio||[]).length}</b></div>
    <p class="nota" style="margin:0 0 8px">Escreva uma pergunta e a resposta que você quer receber. Fica
    salvo neste aparelho e <b>tem prioridade</b> sobre o conhecimento de fábrica.</p>
    <label class="campo"><span>Quando eu perguntar…</span>
      <input type="text" id="sp-q" placeholder="Ex.: qual meu horário de treino" autocomplete="off"></label>
    <label class="campo"><span>Responda isto</span>
      <textarea id="sp-a" rows="3" placeholder="Ex.: Você treina às 18h30, segunda, quarta e sexta, na academia perto do trabalho."></textarea></label>
    <button type="button" class="btn vazado mini" id="sp-add">Salvar no assistente</button>
    ${(E.saberProprio||[]).length ? `<div style="margin-top:10px">${E.saberProprio.map((x,i)=>`
      <div class="hist"><div class="hist-esq"><b>${esc(x.q)}</b>${esc(x.a.slice(0,70))}${x.a.length>70?'…':''}</div>
      <button type="button" class="item-x" data-sp-rm="${i}" aria-label="Remover">×</button></div>`).join('')}</div>` : ''}

    <div class="linha-flex" style="margin-top:11px">
      <button type="button" class="btn vazado mini" id="sp-exp">Exportar o que ensinei</button>
      <button type="button" class="btn vazado mini" id="sp-imp">Importar</button></div>
    <input type="file" id="arq-saber" accept="application/json" class="oculto">
    <p class="nota">Nenhuma chave de API, nenhum servidor, nenhum custo. Todo o conhecimento roda neste
    aparelho e funciona offline.</p></div>`;

  const pv = IA_PROVEDORES[c.iaProv] || IA_PROVEDORES.gemini;
  const temChaveIA = !!IAChave.ler(c.iaProv);
  h += `<div class="bloco ia-ext"><div class="bloco-tit"><span>Conversa livre com IA</span>
      <b>${temChaveIA ? 'configurada' : 'opcional'}</b></div>
    <p style="font-size:13px;margin:0 0 10px">O assistente do app <b>já funciona sem isto</b> —
    ${SABER.length + (E.saberProprio||[]).length} tópicos, offline, sem chave e sem custo.
    Esta opção existe para quem quer conversa aberta com um modelo de linguagem.
    <b>Você põe a sua própria chave</b>; nada é cobrado de ninguém além de você.</p>

    <label class="campo"><span>Provedor</span><select id="iae-prov">
      ${Object.keys(IA_PROVEDORES).map(k=>`<option value="${k}"${c.iaProv===k?' selected':''}>${esc(IA_PROVEDORES[k].rot)} — ${esc(IA_PROVEDORES[k].etiqueta)}</option>`).join('')}</select></label>
    ${c.iaProv==='gemini' ? `<div class="alerta" style="margin:0 0 10px;border-left-color:var(--sinal)">
      <div class="alerta-tit">Como configurar o Gemini — 5 passos</div>
      <p style="margin:0">1. Acesse <b>aistudio.google.com</b> e faz login com Google<br>
      2. Clique em <b>Get API key → Create API key</b><br>
      3. Copia a chave e cola no campo abaixo<br>
      4. Confirma que o modelo é <b>${esc((IA_PROVEDORES.gemini||{}).modeloPadrao||'gemini-1.5-flash')}</b><br>
      5. Clica Salvar → Testar conexão</p></div>` :
      `<p class="nota" style="margin-top:0">${esc(pv.custo)} Chave em: <b>${esc(pv.ondePegar)}</b>.</p>`}

    <label class="campo"><span>Sua chave</span>
      <input type="password" id="iae-chave" placeholder="${temChaveIA?'••••••••  já salva neste aparelho':'cole aqui'}" autocomplete="off"></label>
    <label class="campo"><span>Modelo</span><select id="iae-modelo">
      ${pv.modelos.map(m=>`<option value="${esc(m)}"${(c.iaModelo||pv.modeloPadrao)===m?' selected':''}>${esc(m)}</option>`).join('')}
    </select></label>
    <p class="nota" style="margin-top:2px;color:var(--tinta2)">Modelo padrão recomendado: <b>${esc(pv.modeloPadrao)}</b></p>

    <div class="linha-flex">
      <button type="button" class="btn mini" id="iae-salvar">Salvar</button>
      <button type="button" class="btn vazado mini" id="iae-testar"${temChaveIA?'':' disabled'}>Testar conexão</button>
      ${temChaveIA?'<button type="button" class="btn vazado mini" id="iae-apagar">Remover</button>':''}
    </div>
    <div id="iae-status"></div>

    <div class="alerta ocre" style="margin-top:11px"><div class="alerta-tit">Privacidade deste provedor</div>
      <p>${esc(pv.privacidade)}</p></div>
    <div class="alerta"><div class="alerta-tit">O que você precisa saber</div>
      <p>A chave fica no armazenamento deste navegador e <b>não entra no backup</b>. Ela sai daqui só para
      o provedor que você escolheu. Mas qualquer pessoa com acesso a este aparelho pode enxergá-la —
      trate como senha. Se o app cair, ficar sem internet ou a cota acabar, o assistente embutido
      assume sozinho.</p></div>
    <p class="nota">O modelo recebe o seu diagnóstico <b>já calculado</b> e é instruído a não inventar número,
    não citar estudo e não falar de medicação. Ele conversa; a conta é do app.</p></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Seus dados</span></div>
    <div class="grade2">
      <label class="campo"><span>Altura (cm)</span><input type="number" id="cfg-altura" value="${c.altura}" inputmode="numeric"></label>
      <label class="campo"><span>Idade</span><input type="number" id="cfg-idade" value="${c.idade}" inputmode="numeric"></label>
      <label class="campo"><span>Peso inicial</span><input type="number" id="cfg-pini" value="${c.pesoInicial}" step="0.1" inputmode="decimal"></label>
      <label class="campo"><span>Peso meta</span><input type="number" id="cfg-pmeta" value="${c.pesoMeta}" step="0.1" inputmode="decimal"></label>
      <label class="campo"><span>Meta de passos</span><input type="number" id="cfg-passos" value="${c.passosMeta}" inputmode="numeric"></label>
      <label class="campo"><span>Sexo</span><select id="cfg-sexo">
        <option value="m"${c.sexo==='m'?' selected':''}>Masculino</option>
        <option value="f"${c.sexo==='f'?' selected':''}>Feminino</option></select></label></div>
    <label class="campo"><span>Nível de atividade</span><select id="cfg-ativ">
      <option value="1.2"${c.atividade==1.2?' selected':''}>Sedentário</option>
      <option value="1.35"${c.atividade==1.35?' selected':''}>Leve — treino 3x + caminhada</option>
      <option value="1.5"${c.atividade==1.5?' selected':''}>Moderado — treino 4–5x</option>
      <option value="1.65"${c.atividade==1.65?' selected':''}>Intenso</option></select></label>
    <label class="campo"><span>Déficit diário</span><select id="cfg-def">
      <option value="400"${c.deficit==400?' selected':''}>400 kcal — lento</option>
      <option value="600"${c.deficit==600?' selected':''}>600 kcal — recomendado</option>
      <option value="800"${c.deficit==800?' selected':''}>800 kcal — agressivo</option></select></label>
    <label class="campo"><span>Recalcular metas conforme o peso cai</span><select id="cfg-auto">
      <option value="1"${c.autoRecalc?' selected':''}>Sim</option>
      <option value="0"${!c.autoRecalc?' selected':''}>Não, fixas</option></select></label>
    <button type="button" class="btn" id="salvar-cfg">Salvar e recalcular</button></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Metas manuais</span></div>
    <div class="grade2">
      <label class="campo"><span>Calorias</span><input type="number" id="cfg-kcal" value="${c.kcal}" inputmode="numeric"></label>
      <label class="campo"><span>Proteína (g)</span><input type="number" id="cfg-prot" value="${c.prot}" inputmode="numeric"></label>
      <label class="campo"><span>Carbo (g)</span><input type="number" id="cfg-carb" value="${c.carb}" inputmode="numeric"></label>
      <label class="campo"><span>Gordura (g)</span><input type="number" id="cfg-gord" value="${c.gord}" inputmode="numeric"></label>
      <label class="campo"><span>Água (ml)</span><input type="number" id="cfg-agua" value="${c.aguaMeta}" inputmode="numeric"></label>
      <label class="campo"><span>Copo (ml)</span><input type="number" id="cfg-copo" value="${c.copoMl}" inputmode="numeric"></label></div>
    <button type="button" class="btn vazado" id="salvar-metas">Salvar metas manuais</button></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Backup e exportação</span><b id="uso-disco">—</b></div>
    <button type="button" class="btn vazado mini" id="exp-json" style="margin-bottom:7px">Backup completo (JSON)</button>
    <button type="button" class="btn vazado mini" id="exp-csv-dieta" style="margin-bottom:7px">Diário alimentar (CSV)</button>
    <button type="button" class="btn vazado mini" id="exp-csv-treino" style="margin-bottom:7px">Treinos com RIR e 1RM (CSV)</button>
    <button type="button" class="btn vazado mini" id="exp-csv-corpo" style="margin-bottom:7px">Composição corporal (CSV)</button>
    <button type="button" class="btn vazado mini" id="imp-json">Importar backup</button>
    <input type="file" id="arq" accept="application/json" class="oculto">
    <p class="nota">O backup não inclui as fotos (ficam no banco do navegador) nem a chave da API.
    Exporte uma vez por mês — limpar dados do navegador apaga tudo.</p></div>`;

  h += `<div class="bloco"><div class="bloco-tit"><span>Zona de risco</span></div>
    <button type="button" class="btn perigo mini" id="apagar">Apagar todos os dados</button></div>
    <div class="bloco creditos"><div class="bloco-tit"><span>Sobre</span><b>Controle 4.1</b></div>
      <p style="font-size:13px;margin:0 0 4px"><b>${esc(AUTOR.nome)}</b></p>
      <p class="nota" style="margin:0 0 11px">${esc(AUTOR.desc)}</p>
      <a class="btn vazado" href="${AUTOR.wa}" target="_blank" rel="noopener">Falar no WhatsApp</a>
      <p class="nota">App gratuito, sem anúncio e sem assinatura. Se ele te ajudou e você quiser apoiar,
      chama no WhatsApp — qualquer valor ajuda a manter o projeto.</p></div>
    <p class="nota" style="text-align:center;margin:16px 0">Controle 4.1 · dados locais · sem conta, sem servidor, sem anúncio</p>`;

  $('#tela-ajustes').innerHTML = h;
  FotoDB.tamanho().then(t => {
    const el = $('#uso-disco');
    if (el && t) el.textContent = (t.uso/1048576).toFixed(1)+' MB';
  }).catch(()=>{});
}

/* ══ NOTIFICAÇÕES ═════════════════════════════════════ */
let timers = [];
function notificar(titulo, corpo) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body:corpo, icon:'icons/icon-192.png', badge:'icons/icon-192.png', vibrate:[180,80,180], tag:'ctrl' };
  if (navigator.serviceWorker) navigator.serviceWorker.ready.then(r=>r.showNotification(titulo,opts)).catch(()=>{ try { new Notification(titulo,opts); } catch(e){} });
  else try { new Notification(titulo,opts); } catch(e) {}
}
function reagendar() {
  timers.forEach(clearTimeout); timers = [];
  if (!E.cfg.notifAtivo || !E.cfg.notif || !('Notification' in window) || Notification.permission !== 'granted') return;
  const agora = new Date();
  E.cfg.notif.forEach(n => {
    for (let d=0; d<8; d++) {
      const q = new Date(agora); q.setDate(q.getDate()+d);
      const [hh,mm] = n.hora.split(':').map(Number);
      q.setHours(hh,mm,0,0);
      if (q <= agora || !n.dias.includes(q.getDay())) continue;
      const ms = q - agora;
      if (ms>0 && ms < 26*3600*1000) timers.push(setTimeout(()=>{ notificar('Controle', n.txt); reagendar(); }, ms));
      break;
    }
  });
}
async function pedirPermissao() {
  if (!('Notification' in window)) { toast('Navegador sem suporte a notificação.'); return false; }
  if (Notification.permission === 'granted') return true;
  const r = await Notification.requestPermission();
  if (r !== 'granted') { toast('Permissão negada. Libere nas configurações do Chrome.'); return false; }
  return true;
}

/* ══ EXPORTAÇÃO ═══════════════════════════════════════ */
function csvDieta() {
  const l = ['data;hora;refeicao;alimento;quantidade;unidade;origem;proteina_g;carbo_g;gordura_g;alcool_g;kcal'];
  Object.keys(E.diario).sort().forEach(k => REFS.forEach(r =>
    (E.diario[k].refs[r.id]||[]).forEach(i =>
      l.push([k,i.h||'',r.nome,i.n,br(i.q),i.u,i.off?'rotulo':'tabela',br(i.p),br(i.c),br(i.g),br(i.alc||0),i.kcal].join(';')))));
  return '\uFEFF'+l.join('\n');
}
function csvTreino() {
  const l = ['data;semana_ciclo;fase;rotina;exercicio;serie;tipo;carga_kg;reps;rir;volume_kg;rm_estimado'];
  E.sessoes.forEach(s => (s.ex||[]).forEach(e => (e.series||[]).forEach((x,i)=>{
    const kg=+x.kg||0, r=+x.reps||0;
    l.push([s.d, s.semana||'', s.fase||'', E.rotinas[s.rotina]?E.rotinas[s.rotina].nome:s.rotina, e.n, i+1,
      x.t==='w'?'aquecimento':x.t==='d'?'drop':'valida', br(kg), r, (x.rir===''||x.rir==null)?'':x.rir, br(kg*r), br((kg*(1+r/30)).toFixed(1))].join(';'));
  })));
  return '\uFEFF'+l.join('\n');
}
function csvCorpo() {
  const l = ['data;peso_kg;cintura_cm;pescoco_cm;gordura_pct;massa_gordura_kg;massa_magra_kg;imc'];
  ordPesos().forEach(p => {
    const bf = p.bf||null;
    l.push([p.d, br(p.kg), p.cintura?br(p.cintura):'', p.pescoco?br(p.pescoco):'',
      bf?br(bf):'', bf?br((p.kg*bf/100).toFixed(1)):'', bf?br((p.kg*(1-bf/100)).toFixed(1)):'',
      br((p.kg/Math.pow(E.cfg.altura/100,2)).toFixed(1))].join(';'));
  });
  return '\uFEFF'+l.join('\n');
}

/* ══ NAVEGAÇÃO ════════════════════════════════════════ */
function irPara(t) {
  ['hoje','treino','analise','progresso','plano','ajustes'].forEach(x => { $('#tela-'+x).hidden = (x!==t); });
  $$('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.tela===t?'page':'false'));
  $('.topo').classList.toggle('compacto', t==='treino');
  if (t==='treino') pintarTreino();
  if (t==='analise') pintarAnalise();
  if (t==='progresso') pintarProgresso();
  if (t==='plano') pintarPlano();
  if (t==='ajustes') pintarAjustes();
  atualizarFab();
  window.scrollTo(0,0);
}

function escolherExercicio(cb) {
  const gms = ['Todos', ...new Set(EXERCICIOS.map(x=>x.gm))];
  abrirGaveta('Escolher exercício', `
    <input type="text" id="qe" placeholder="Buscar exercício…" autocomplete="off" style="margin-bottom:9px">
    <div class="chips" id="chipse">${gms.map(g=>`<button type="button" class="chip" data-gm="${esc(g)}" aria-pressed="${g==='Todos'}">${esc(g)}</button>`).join('')}</div>
    <ul class="res" id="rese"></ul>`);
  let gm = 'Todos';
  const lst = () => {
    const q = normalizar($('#qe').value);
    const base = EXERCICIOS.filter(x=>(gm==='Todos'||x.gm===gm)&&(!q||normalizar(x.n).includes(q)));
    $('#rese').innerHTML = base.map(x=>`<li><button type="button" data-ex="${esc(x.n)}">
      <span><b>${esc(x.n)}</b><small>${esc(x.gm)} · ${esc(x.eq)} · impacto ${esc(x.imp)}</small></span></button></li>`).join('')
      || '<li><div class="vazio">Nada encontrado.</div></li>';
  };
  lst();
  $('#qe').addEventListener('input', lst);
  $('#gaveta-corpo').addEventListener('click', ev => {
    const c = ev.target.closest('[data-gm]');
    if (c) { gm = c.dataset.gm; $$('#chipse .chip').forEach(x=>x.setAttribute('aria-pressed', x===c)); lst(); return; }
    const x = ev.target.closest('[data-ex]');
    if (x) cb(x.dataset.ex);
  });
}

function abrirCardio() {
  abrirGaveta('Registrar cardio', `
    <label class="campo"><span>Atividade</span><select id="cd-n">
      ${Object.keys(MET).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select></label>
    <label class="campo"><span>Minutos</span><input type="number" id="cd-min" value="25" inputmode="numeric"></label>
    <div class="bloco" id="cd-previa"></div>
    <button type="button" class="btn" id="cd-salvar">Registrar</button>
    <p class="nota">Gasto estimado por equivalente metabólico (MET) usando seu peso atual.
    Fica como referência, mas <b>não é somado</b> ao orçamento de calorias.</p>`);
  const calc = () => Math.round((MET[$('#cd-n').value]||3) * 3.5 * pesoAtual() / 200 * (+$('#cd-min').value||0));
  const prev = () => { $('#cd-previa').innerHTML = `<div class="bloco-tit"><span>Gasto estimado</span><b>${calc()} kcal</b></div>`; };
  prev();
  $('#cd-min').addEventListener('input', prev);
  $('#cd-n').addEventListener('change', prev);
  $('#cd-salvar').addEventListener('click', () => {
    const min = +$('#cd-min').value||0;
    if (min<=0) return;
    dia().cardio.push({ n:$('#cd-n').value, min, kcal:calc() });
    gravar(); fecharGaveta(); pintarHoje(); toast('Cardio registrado');
  });
}

function ligarEventos() {
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button[data-tela]');
    if (b) irPara(b.dataset.tela);
  });
  $('#btn-tema').addEventListener('click', () => {
    E.cfg.tema = E.cfg.tema==='escuro'?'claro':'escuro';
    document.body.classList.toggle('escuro', E.cfg.tema==='escuro');
    document.querySelector('meta[name=theme-color]').content = E.cfg.tema==='escuro'?'#0C0F11':'#16191A';
    gravar(); pintarTopo();
  });
  $('#fab-ia').addEventListener('click', () => abrirChat());
  $('#gaveta-x').addEventListener('click', fecharGaveta);
  $('#fundo').addEventListener('click', e => { if (e.target.id==='fundo') fecharGaveta(); });
  // badge com o que pede atenção, para o ícone não ser só decorativo
  atualizarFab();
  $('#cron').addEventListener('click', e => {
    const b = e.target.closest('button[data-cron]');
    if (!b) return;
    const v = +b.dataset.cron;
    if (v===0) pararCron(); else { cronFim += v*1000; tickCron(); }
  });

  $('#arq-progresso').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const blob = await comprimirImagem(f, 1100, 0.85);
      await FotoDB.salvar({ id:'p'+Date.now(), data:HOJE, tipo:'progresso', blob, peso:pesoAtual() });
      toast('Foto salva'); carregarGaleria();
    } catch (err) { toast('Não foi possível salvar a foto.'); }
  });

  document.body.addEventListener('click', async e => {
    const t = e.target; let b;

    if ((b = t.closest('[data-add]')))       return abrirBusca(b.dataset.add);
    if ((b = t.closest('[data-rm]')))        { const [r,i]=b.dataset.rm.split(':'); dia().refs[r].splice(+i,1); gravar(); pintarTopo(); pintarHoje(); return; }
    if ((b = t.closest('[data-troca-al]')))  { const [r,i]=b.dataset.trocaAl.split(':'); return abrirSubstituicao(r,+i); }
    if ((b = t.closest('[data-copo]')))      { const n=+b.dataset.copo, d=dia(); d.agua=(d.agua===n)?n-1:n; gravar(); pintarHoje(); vibrar(12); return; }
    if ((b = t.closest('[data-rm-cardio]'))) { dia().cardio.splice(+b.dataset.rmCardio,1); gravar(); pintarHoje(); return; }
    if ((b = t.closest('[data-tarefa]'))) {
      const id = b.dataset.tarefa;
      const lista = E.coach.concluidas[HOJE] = E.coach.concluidas[HOJE] || [];
      const i = lista.indexOf(id);
      if (i >= 0) lista.splice(i,1); else lista.push(id);
      if (id === 'agua' && i < 0) { dia().agua = Math.ceil(E.cfg.aguaMeta/E.cfg.copoMl); }
      gravar(); pintarHoje(); pintarTopo(); vibrar(15); return;
    }
    if ((b = t.closest('[data-causa]'))) {
      const [tid, causa] = b.dataset.causa.split('|');   // id de tarefa contém ':' (ex.: ref:cafe)
      const j = E.coach.justificativas[HOJE] = E.coach.justificativas[HOJE] || {};
      j[tid] = causa;
      const tarefa = missaoDoDia(ctxMissao()).find(x => x.id === tid) || { tipo:'outro', titulo:tid };
      const plano = replanejar(tarefa, causa, ctxMissao());
      gravar(); pintarHoje();
      abrirGaveta('Plano ajustado', `
        <div class="alerta"><div class="alerta-tit">${esc(tarefa.titulo)} · ${esc((CAUSAS.find(c=>c.id===causa)||{}).rot||causa)}</div>
        <p>${esc(plano.txt)}</p></div>
        ${plano.acao==='seguranca' ? '<p class="nota">Enquanto houver dor, a cobrança do treino fica suspensa.</p>' : ''}
        <button type="button" class="btn" id="gav-ok">Entendi</button>`);
      $('#gaveta-corpo').addEventListener('click', ev => { if (ev.target.id==='gav-ok') fecharGaveta(); });
      if (causa === 'dor') {
        E.coach.seguranca.push({ d:HOJE, grupo:'lesao',
          mensagem:'Você relatou dor. Enquanto isso persistir, a cobrança do treino fica suspensa.' });
        gravar(); pintarHoje();
      }
      return;
    }
    if (t.id==='ler-codigo') { refAlvo = 'almoco'; return abrirScanner(); }
    if (t.id==='add-foto')      { $('#arq-progresso').click(); return; }
    if (t.id==='add-cardio')    return abrirCardio();
    if (t.id==='btn-passos')    { dia().passos = +$('#in-passos').value||0; gravar(); pintarHoje(); toast('Passos salvos'); return; }
    if (t.id==='copiar-ontem') {
      const y = new Date(); y.setDate(y.getDate()-1);
      const a = E.diario[iso(y)];
      if (!a || !somaDia(iso(y)).itens) { toast('Ontem não tem registro.'); return; }
      dia().refs = JSON.parse(JSON.stringify(a.refs));
      gravar(); pintarTopo(); pintarHoje(); toast('Dia de ontem copiado'); return;
    }
    if (t.id==='ir-pesagem') return irPara('progresso');

    if ((b = t.closest('[data-reav]'))) {
      const rv = reavaliacaoDevida();
      if (!rv) return;
      const antes = E.cfg.kcal;
      if (b.dataset.reav==='aplicar' && rv.delta) {
        E.cfg.kcal = Math.max(PISO_KCAL[E.cfg.sexo] || 1500, E.cfg.kcal + rv.delta);
        E.cfg.carb = Math.max(60, Math.round((E.cfg.kcal - E.cfg.prot*4 - E.cfg.gord*9)/4));
        E.cfg.autoRecalc = false;
      }
      E.reavaliacoes.push({ d:HOJE, semana:rv.semana, ritmoPct:rv.ritmo?rv.ritmo.pct:0,
        acao: b.dataset.reav==='aplicar'?rv.acao:'manter', kcalAntes:antes, kcalDepois:E.cfg.kcal });
      gravar(); pintarTopo(); pintarHoje();
      toast(b.dataset.reav==='aplicar'?'Meta ajustada para '+E.cfg.kcal+' kcal':'Reavaliação registrada');
      return;
    }

    if ((b = t.closest('[data-cat]'))) { filtroCat=b.dataset.cat; $$('#chips .chip').forEach(c=>c.setAttribute('aria-pressed',c===b)); listar($('#q')?$('#q').value:''); return; }
    if ((b = t.closest('[data-alim]'))) return abrirPorcao(b.dataset.alim);
    if ((b = t.closest('[data-receita]'))) {
      const r = E.receitas.find(x=>x.n===b.dataset.receita);
      if (!r) return;
      const d = dia();
      if (!d.refs[refAlvo]) d.refs[refAlvo] = [];
      r.itens.forEach(i => d.refs[refAlvo].push(JSON.parse(JSON.stringify(i))));
      gravar(); fecharGaveta(); pintarTopo(); pintarHoje(); return;
    }
    if (t.id==='novo-alimento') return abrirNovoAlimento();
    if ((b = t.closest('[data-hist-ex]'))) return abrirHistoricoEx(b.dataset.histEx);
    if (t.id === 'calc-anilhas') return abrirAnilhas(20);
    if ((b = t.closest('[data-tec]'))) return mostrarTecnica(b.dataset.tec);
    if ((b = t.closest('[data-verfoto]'))) {
      const f = await FotoDB.obter(b.dataset.verfoto);
      if (!f) return;
      abrirGaveta(fmtData(f.data), `<img class="foto-cheia" alt="Foto de ${fmtData(f.data)}" src="${URL.createObjectURL(f.blob)}">
        <p class="nota">${f.peso?'Peso na data: '+br(f.peso)+' kg':''}</p>
        <button type="button" class="btn perigo mini" data-apagafoto="${f.id}">Apagar esta foto</button>`);
      return;
    }
    if ((b = t.closest('[data-apagafoto]'))) {
      if (!confirm('Apagar esta foto?')) return;
      await FotoDB.apagar(b.dataset.apagafoto);
      fecharGaveta(); carregarGaleria(); return;
    }

    if ((b = t.closest('[data-iniciar]'))) return iniciarSessao(b.dataset.iniciar);
    if ((b = t.closest('[data-ok]'))) {
      const [ei,si] = b.dataset.ok.split(':').map(Number);
      const s = E.sessaoAtiva.ex[ei].series[si];
      s.ok = !s.ok;
      if (s.ok) { iniciarCron(faseAtual().descanso); vibrar(20); }
      gravar(); pintarTreino(); return;
    }
    if ((b = t.closest('[data-tipo]'))) {
      const [ei,si] = b.dataset.tipo.split(':').map(Number);
      const x = E.sessaoAtiva.ex[ei].series[si];
      x.t = x.t === '' ? 'w' : x.t === 'w' ? 'd' : '';
      gravar(); pintarTreino(); return;
    }
    if ((b = t.closest('[data-mais]')))  { E.sessaoAtiva.ex[+b.dataset.mais].series.push({kg:'',reps:'',rir:'',t:'',ok:false}); gravar(); pintarTreino(); return; }
    if ((b = t.closest('[data-menos]'))) { const a=E.sessaoAtiva.ex[+b.dataset.menos].series; if (a.length>1) a.pop(); gravar(); pintarTreino(); return; }
    if ((b = t.closest('[data-troca]'))) { const i=+b.dataset.troca; return escolherExercicio(ex => {
      E.sessaoAtiva.ex[i].n = ex;
      E.sessaoAtiva.ex[i].sug = sugerir(ex, faseAtual());
      gravar(); fecharGaveta(); pintarTreino(); }); }
    if (t.id==='add-ex') return escolherExercicio(ex => {
      const f = faseAtual();
      E.sessaoAtiva.ex.push({ n:ex, sug:sugerir(ex,f),
        series: Array.from({length:f.series}, ()=>({kg:'',reps:'',rir:'',t:'',ok:false})) });
      gravar(); fecharGaveta(); pintarTreino();
    });
    if (t.id==='encerrar') return encerrarSessao();
    if (t.id==='descartar') { if (!confirm('Descartar sem salvar?')) return; E.sessaoAtiva=null; pararCron(); gravar(); pintarTreino(); return; }

    if ((b = t.closest('[data-rm-rot]'))) { const [k,i]=b.dataset.rmRot.split(':'); E.rotinas[k].ex.splice(+i,1); gravar(); pintarPlano(); return; }
    if ((b = t.closest('[data-add-rot]'))) { const k=b.dataset.addRot; return escolherExercicio(ex => {
      E.rotinas[k].ex.push({ n:ex, series:3, repMin:10, repMax:15, descanso:E.cfg.descanso });
      gravar(); fecharGaveta(); pintarPlano(); }); }
    if (t.id==='gerar-card') { novoCardapio(); pintarPlano(); toast('Cardápio montado'); return; }
    if (t.id==='gerar-compras') {
      if (!E.cardapio) { toast('Monte o cardápio primeiro.'); return; }
      E.compras = { d: HOJE, grupos: listaCompras([E.cardapio], 7), feitos: [] };
      gravar(); pintarPlano(); toast('Lista de 7 dias gerada'); return;
    }
    if ((b = t.closest('[data-compra]'))) {
      const n = b.dataset.compra;
      E.compras.feitos = E.compras.feitos || [];
      const i = E.compras.feitos.indexOf(n);
      if (i>=0) E.compras.feitos.splice(i,1); else E.compras.feitos.push(n);
      gravar(); pintarPlano(); return;
    }
    if ((b = t.closest('[data-usarref]'))) {
      const ref = b.dataset.usarref;
      registrarDoCardapio(ref);
      return;
    }
    if (t.id==='usar-tudo') {
      REFS.slice(0,4).forEach(r => registrarDoCardapio(r.id, true));
      gravar(); pintarTopo(); pintarHoje(); toast('Dia inteiro registrado'); return;
    }
    if ((b = t.closest('[data-trocacard]'))) {
      const [ref, ix] = b.dataset.trocacard.split(':');
      return abrirTrocaCardapio(ref, +ix);
    }
    if (t.id==='reiniciar-ciclo') {
      if (!confirm('Reiniciar o mesociclo a partir de hoje? As cargas registradas são mantidas.')) return;
      E.cfg.cicloInicio = HOJE; gravar(); pintarPlano(); pintarTopo(); toast('Ciclo reiniciado na semana 1'); return;
    }

    if ((b = t.closest('[data-perg]'))) return abrirResposta(+b.dataset.perg);
    if (t.id==='abrir-chat') return abrirChat();
    if ((b = t.closest('[data-fase]'))) {
      const alvo = b.dataset.fase;
      const rot = (FASES_PLANO[alvo]||{}).rot || alvo;
      if (!confirm('Entrar na fase ' + rot + '? O ciclo atual é fechado e vira histórico.')) return;
      entrarEmFase(alvo, tendAtual());
      pintarTopo(); pintarProgresso(); pintarHoje();
      toast('Fase: ' + rot + ' · meta ' + E.cfg.kcal + ' kcal', 4000);
      return;
    }
    if (t.id==='adiar-trans') { E.cfg.transicaoVista = HOJE; gravar(); pintarProgresso(); return; }
    if (t.id==='ra-salvar') {
      const p2 = parseFloat($('#ra-peso').value);
      const ac = ($('#ra-acao').value||'').trim();
      if (!p2 || p2 < 40 || p2 > 300) { toast('Informe um peso válido.'); return; }
      E.cfg.regraAcao = { peso: p2, acao: ac || 'voltar a registrar todos os dias por duas semanas', d: HOJE };
      gravar(); pintarProgresso();
      toast('Combinado. Vou cobrar isso quando chegar.');
      return;
    }
    if (t.id==='aplicar-adapt') { const r = aplicarMetaAdaptativa(); if (r) { pintarTopo(); pintarProgresso(); } return; }
    if (t.id==='btn-peso') {
      const kg = parseFloat($('#in-peso').value);
      const ci = parseFloat($('#in-cint').value);
      const pe = parseFloat($('#in-pesc').value);
      if (!kg || kg<40 || kg>300) { $('#in-peso').focus(); toast('Peso inválido.'); return; }
      if (pe>0) E.cfg.pescoco = pe;
      E.pesos = E.pesos.filter(p=>p.d!==HOJE);
      const reg = { d:HOJE, kg };
      if (ci>0) reg.cintura = ci;
      const pesc = pe>0 ? pe : E.cfg.pescoco;
      if (pesc) reg.pescoco = pesc;
      if (reg.cintura && pesc) {
        const bf = gorduraNavy(E.cfg.sexo, E.cfg.altura, reg.cintura, pesc);
        if (bf != null) reg.bf = bf;
      }
      E.pesos.push(reg);
      const adapt = aplicarMetaAdaptativa(true);
      if (!adapt && E.cfg.autoRecalc) aplicarMetas();
      gravar(); pintarProgresso(); pintarTopo();
      toast('Registrado'+(reg.bf?' · '+br(reg.bf)+'% de gordura':'')
        + (adapt && adapt.antes !== E.cfg.kcal ? ' · meta '+adapt.antes+' → '+E.cfg.kcal+' kcal' : ''));
      return;
    }


    if (t.id==='mem-rodar') {
      const f = rodarObservador();
      pintarAjustes();
      toast((f.memorias.filter(x=>x.origem==='observado').length) + ' padrões identificados');
      return;
    }
    if ((b = t.closest('[data-mem-rm]'))) {
      const k = b.dataset.memRm;
      E.memoria.fatos = (E.memoria.fatos||[]).filter(x => (x.chave||x.t) !== k && x.t !== k);
      gravar(); pintarAjustes(); return;
    }
    if (t.id==='log-limpar') { E.logAgente = []; gravar(); pintarAjustes(); return; }
    if (t.id==='iae-salvar') {
      const v = ($('#iae-chave').value||'').trim();
      const mSel = ($('#iae-modelo') || {}).value || '';
      E.cfg.iaModelo = mSel || (IA_PROVEDORES[E.cfg.iaProv] || {}).modeloPadrao || '';
      if (v) IAChave.gravar(E.cfg.iaProv, v);
      gravar(); pintarAjustes();
      toast(IAChave.ler(E.cfg.iaProv) ? 'Salvo. Teste a conexão antes de usar.' : 'Modelo salvo — ainda falta a chave.');
      return;
    }
    if (t.id==='iae-apagar') {
      IAChave.gravar(E.cfg.iaProv, '');
      if (!IAChave.algumaConfigurada()) { E.cfg.iaLivre = false; modoLLM = false; }
      gravar(); pintarAjustes(); toast('Chave removida. O embutido continua funcionando.');
      return;
    }
    if (t.id==='iae-testar') {
      const el = $('#iae-status');
      el.innerHTML = '<div class="carregando" style="padding:12px 0"><div class="spin"></div><p>Testando…</p></div>';
      testarIA(E.cfg.iaProv, E.cfg.iaModelo || undefined).then(r => {
        E.cfg.iaLivre = true; gravar();
        el.innerHTML = `<div class="alerta" style="margin-top:10px;border-left-color:var(--sinal)">
          <div class="alerta-tit">Funcionando</div><p>O provedor respondeu: “${esc(r)}”.
          A conversa livre já está disponível no assistente.</p></div>`;
      }).catch(err => {
        E.cfg.iaLivre = false; gravar();
        el.innerHTML = `<div class="alerta ocre" style="margin-top:10px">
          <div class="alerta-tit">Não funcionou</div><p>${esc(err.message)}</p>
          <p class="nota" style="margin:7px 0 0">O assistente embutido continua respondendo normalmente —
          nada do app depende disto.</p></div>`;
      });
      return;
    }
    if (t.id==='ev-add') {
      const v = ($('#ev-novo').value||'').trim();
      if (!v) return;
      const casado = baseCompleta().find(x => norm(x.n) === norm(v)) ||
                     baseCompleta().find(x => norm(x.n).includes(norm(v)));
      const nome = casado ? casado.n : v;
      if (!E.cfg.evitarAlimentos.includes(nome)) E.cfg.evitarAlimentos.push(nome);
      E.cardapio = null;                 // cardápio antigo pode conter o item evitado
      gravar(); pintarAjustes();
      toast(casado ? 'Evitando ' + nome : 'Adicionado: ' + nome + ' (não achei na base, mas fica registrado)');
      return;
    }
    if ((b = t.closest('[data-ev-rm]'))) {
      E.cfg.evitarAlimentos = E.cfg.evitarAlimentos.filter(x => x !== b.dataset.evRm);
      gravar(); pintarAjustes(); return;
    }
    if (t.id==='sp-add') {
      const q = ($('#sp-q').value||'').trim(), r2 = ($('#sp-a').value||'').trim();
      if (q.length < 4 || r2.length < 4) { toast('Preencha a pergunta e a resposta.'); return; }
      E.saberProprio.unshift({ q, a: r2, d: HOJE });
      gravar(); pintarAjustes();
      toast('Guardado. O assistente já responde isso.');
      return;
    }
    if ((b = t.closest('[data-sp-rm]'))) {
      E.saberProprio.splice(+b.dataset.spRm, 1); gravar(); pintarAjustes(); return;
    }
    if (t.id==='sp-exp') {
      baixar('assistente-'+HOJE+'.json', JSON.stringify({ saber: E.saberProprio,
        evitar: E.cfg.evitarAlimentos, nome: E.cfg.iaNome }, null, 2), 'application/json');
      return;
    }
    if (t.id==='sp-imp') { $('#arq-saber').click(); return; }
    if (t.id==='salvar-cfg') {
      const c2 = E.cfg;
      c2.altura = +$('#cfg-altura').value||c2.altura;
      c2.idade = +$('#cfg-idade').value||c2.idade;
      c2.pesoInicial = +$('#cfg-pini').value||c2.pesoInicial;
      c2.pesoMeta = +$('#cfg-pmeta').value||c2.pesoMeta;
      c2.passosMeta = +$('#cfg-passos').value||c2.passosMeta;
      c2.sexo = $('#cfg-sexo').value;
      c2.atividade = +$('#cfg-ativ').value;
      c2.deficit = +$('#cfg-def').value;
      c2.autoRecalc = $('#cfg-auto').value==='1';
      const nIa = $('#cfg-ianome');
      if (nIa && nIa.value.trim()) c2.iaNome = nIa.value.trim();
      aplicarMetas(); gravar(); pintarAjustes(); pintarTopo();
      toast('Recalculado: '+c2.kcal+' kcal, '+c2.prot+' g de proteína'); return;
    }
    if (t.id==='salvar-metas') {
      const c2 = E.cfg;
      ['kcal','prot','carb','gord'].forEach(k => { c2[k] = +$('#cfg-'+k).value||c2[k]; });
      c2.aguaMeta = +$('#cfg-agua').value||c2.aguaMeta;
      c2.copoMl = +$('#cfg-copo').value||c2.copoMl;
      c2.autoRecalc = false; c2.metaAdaptativa = false;
      gravar(); pintarAjustes(); pintarTopo(); toast('Metas manuais salvas · adaptativo desligado'); return;
    }
    if ((b = t.closest('[data-rm-notif]'))) { E.cfg.notif = E.cfg.notif.filter(n=>n.id!==b.dataset.rmNotif); gravar(); pintarAjustes(); reagendar(); return; }
    if (t.id==='add-notif') {
      abrirGaveta('Novo lembrete', `
        <label class="campo"><span>Horário</span><input type="time" id="ln-h" value="12:00"></label>
        <label class="campo"><span>Mensagem</span><input type="text" id="ln-t" placeholder="Ex.: Tomar creatina"></label>
        <label class="campo"><span>Dias</span></label>
        <div class="chips" style="flex-wrap:wrap">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,i)=>`<button type="button" class="chip" data-dia="${i}" aria-pressed="true">${d}</button>`).join('')}</div>
        <button type="button" class="btn" id="ln-salvar" style="margin-top:10px">Criar lembrete</button>`);
      $('#gaveta-corpo').addEventListener('click', ev => {
        const c3 = ev.target.closest('[data-dia]');
        if (c3) c3.setAttribute('aria-pressed', c3.getAttribute('aria-pressed')!=='true');
        if (ev.target.id==='ln-salvar') {
          const dias = $$('#gaveta-corpo [data-dia]').filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>+x.dataset.dia);
          const txt = $('#ln-t').value.trim();
          if (!txt || !dias.length) { toast('Preencha a mensagem e escolha os dias.'); return; }
          E.cfg.notif.push({ id:'n'+Date.now(), hora:$('#ln-h').value, txt, dias });
          gravar(); fecharGaveta(); pintarAjustes(); reagendar(); toast('Lembrete criado');
        }
      });
      return;
    }
    if (t.id==='exp-json') {
      const copia = JSON.parse(JSON.stringify(E));
      delete copia.sessaoAtiva;
      // nenhuma chave viaja no backup, mesmo por acidente
      // versões 3.0 a 3.8 guardavam uma URL de proxy em cfg. O campo não
      // existe mais, mas backups antigos reimportados podem trazê-lo.
      if (copia.cfg) { delete copia.cfg.proxyUrl; }
      baixar('backup-controle3-'+HOJE+'.json', JSON.stringify(copia), 'application/json');
      E.cfg.ultimoBackup = HOJE; gravar(); return;
    }
    if (t.id==='exp-csv-dieta')  { baixar('diario-'+HOJE+'.csv', csvDieta(), 'text/csv'); return; }
    if (t.id==='exp-csv-treino') { baixar('treinos-'+HOJE+'.csv', csvTreino(), 'text/csv'); return; }
    if (t.id==='exp-csv-corpo')  { baixar('composicao-'+HOJE+'.csv', csvCorpo(), 'text/csv'); return; }
    if (t.id==='imp-json') { $('#arq').click(); return; }
    if (t.id==='apagar') {
      if (!confirm('Isso apaga diário, treinos, pesos e fotos. Tem backup?')) return;
      if (!confirm('Confirma? Não tem como voltar.')) return;
      localStorage.removeItem(CHAVE);
      FotoDB.listar().then(f=>Promise.all(f.map(x=>FotoDB.apagar(x.id)))).catch(()=>{}).then(()=>location.reload());
      return;
    }
  });

  document.body.addEventListener('input', e => {
    const t = e.target;
    if (t.id==='q') return listar(t.value);
    if (t.dataset && t.dataset.s && E.sessaoAtiva) {
      const [ei,si,campo] = t.dataset.s.split(':');
      E.sessaoAtiva.ex[+ei].series[+si][campo] = t.value;
      gravar();
    }
  });

  document.body.addEventListener('change', async e => {
    if (e.target.dataset && e.target.dataset.s && E.sessaoAtiva) {
      const [ei,si,campo] = e.target.dataset.s.split(':');
      E.sessaoAtiva.ex[+ei].series[+si][campo] = e.target.value;
      gravar(); return;
    }
    if (e.target.id==='iae-prov') {
      const novoProv = e.target.value;
      E.cfg.iaProv = novoProv;
      // reseta modelo para o padrão do novo provedor
      E.cfg.iaModelo = (IA_PROVEDORES[novoProv] || {}).modeloPadrao || '';
      gravar(); pintarAjustes(); return;
    }
    if (e.target.id==='cfg-modocard') {
      E.cfg.modoCardapio = e.target.value; E.cardapio = null; gravar(); pintarPlano(); return;
    }
    if (e.target.id==='cfg-intens') {
      E.cfg.intensidade = e.target.value; gravar(); pintarAjustes(); pintarHoje();
      toast('Coach em modo ' + (INTENSIDADES.find(x=>x.id===E.cfg.intensidade)||{}).rot); return;
    }
    if (e.target.id==='cfg-fase') {
      const alvo = e.target.value;
      if (alvo === E.cfg.fasePlano) return;
      entrarEmFase(alvo, tendAtual());
      pintarTopo(); pintarProgresso(); pintarHoje();
      toast('Fase: ' + (FASES_PLANO[alvo]||{}).rot, 3500);
      return;
    }
    if (e.target.id==='cfg-ritmo') {
      E.cfg.ritmoAlvo = +e.target.value; gravar();
      aplicarMetaAdaptativa(true); pintarTopo(); pintarProgresso(); return;
    }
    if (e.target.id==='cfg-adapt') {
      E.cfg.metaAdaptativa = e.target.value === '1';
      if (E.cfg.metaAdaptativa) { E.cfg.autoRecalc = false; aplicarMetaAdaptativa(true); }
      gravar(); pintarTopo(); pintarProgresso(); return;
    }
    if (e.target.id==='cfg-notif') {
      const on = e.target.value==='1';
      if (on && !(await pedirPermissao())) { e.target.value='0'; return; }
      E.cfg.notifAtivo = on; gravar(); reagendar(); pintarAjustes();
      toast(on?'Lembretes ligados':'Lembretes desligados'); return;
    }
    if (e.target.id==='arq-saber') {
      const f = e.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        const novos = Array.isArray(j.saber) ? j.saber.filter(x => x && x.q && x.a) : [];
        if (!novos.length && !Array.isArray(j.evitar)) throw new Error('formato');
        // soma em vez de substituir: ninguém quer perder o que já ensinou
        novos.forEach(n => { if (!E.saberProprio.some(x => norm(x.q) === norm(n.q))) E.saberProprio.push(n); });
        if (Array.isArray(j.evitar)) j.evitar.forEach(n => {
          if (!E.cfg.evitarAlimentos.includes(n)) E.cfg.evitarAlimentos.push(n); });
        if (j.nome) E.cfg.iaNome = j.nome;
        gravar(); pintarAjustes();
        toast(novos.length + ' tópicos importados e somados aos existentes.');
      } catch (err) { toast('Arquivo inválido.'); }
      e.target.value = ''; return;
    }
    if (e.target.id==='arq') {
      const f = e.target.files[0]; if (!f) return;
      try {
        const novo = JSON.parse(await f.text());
        if (!novo.cfg) throw new Error('formato');
        if (!confirm('Substituir os dados atuais pelo backup?')) return;
        localStorage.setItem(CHAVE, JSON.stringify(novo));
        location.reload();
      } catch (err) { toast('Arquivo inválido.'); }
    }
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) reagendar(); });
}

/* ══ ONBOARDING ═══════════════════════════════════════ */
function mostrarAceite() {
  abrirGaveta('Antes de começar', `
    <div class="alerta ocre"><div class="alerta-tit">Isto não é orientação médica</div>
    <p>Este app organiza registro e mede resultado. Ele <b>não diagnostica</b> e não substitui
    médico, nutricionista ou educador físico. As metas de caloria e as sugestões de carga são
    cálculos a partir do que você informa, não uma prescrição individualizada.</p></div>

    <div class="bloco"><div class="bloco-tit"><span>Procure um profissional antes se</span></div>
    <p style="font-size:13px;margin:0">Você tem condição de saúde diagnosticada, usa medicação
    contínua, está grávida ou amamentando, tem menos de 18 anos, ou já teve dificuldade na relação
    com comida ou com o peso. Em qualquer desses casos, um plano genérico calculado por app pode
    fazer mais mal que bem.</p></div>

    <div class="bloco"><div class="bloco-tit"><span>Seus dados</span></div>
    <p style="font-size:13px;margin:0">Tudo fica gravado <b>só neste aparelho</b>. Não existe conta,
    servidor nem conta. A única coisa que sai daqui é a consulta de código de barras ao
    Open Food Facts, um banco público e gratuito — e vai só o número do código, mais nada.</p></div>

    <label class="campo" style="margin-top:12px"><span>Como você se chama?</span>
      <input type="text" id="ac-nome" placeholder="Seu primeiro nome" autocomplete="given-name"></label>
    <label class="campo">
      <span>Confirmo que tenho 18 anos ou mais e li o acima</span>
      <select id="ac-ok"><option value="">Selecione…</option><option value="1">Sim, confirmo</option></select></label>
    <button type="button" class="btn" id="ac-seguir">Começar</button>`);

  $('#gaveta-x').style.visibility = 'hidden';
  $('#gaveta-corpo').addEventListener('click', e => {
    if (e.target.id !== 'ac-seguir') return;
    if ($('#ac-ok').value !== '1') { toast('Confirme a leitura para seguir.'); return; }
    const n = ($('#ac-nome').value || '').trim();
    if (n) { E.cfg.nome = n.charAt(0).toUpperCase() + n.slice(1); E.memoria.nome = E.cfg.nome; }
    E.cfg.aceite = true; gravar();
    pintarTopo(); pintarHoje();
    $('#gaveta-x').style.visibility = '';
    fecharGaveta();
  });
}

/* ══ INÍCIO ═══════════════════════════════════════════ */
carregar();
document.body.classList.toggle('escuro', E.cfg.tema==='escuro');
ligarEventos();
pintarTopo();
pintarHoje();
irPara('hoje');
reagendar();
rodarObservador();

if (!E.cfg.aceite) mostrarAceite();

if (E._migrado) {
  const n = E.pesos.length, s = E.sessoes.length;
  delete E._migrado;
  setTimeout(() => toast('Dados da versão 1 migrados: '+n+' pesagens, '+s+' treinos.', 5000), 800);
}
gravar();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

})();
