/* ══════════════════════════════════════════════════════════
   MEMÓRIA COMPORTAMENTAL

   O app observa os próprios dados e escreve o que aprendeu
   sobre a pessoa. Isso é PERSONALIZAÇÃO, não treinamento: o
   modelo não muda, o contexto muda.

   Regras de projeto:

   • Toda memória carrega EVIDÊNCIA — quantas ocorrências, em
     que janela. Memória sem evidência é palpite disfarçado.
   • Só vira memória com repetição mínima. Um dia não é padrão.
   • Tudo é visível e apagável pela pessoa. Aprendizado que o
     usuário não pode auditar nem corrigir é caixa-preta.
   • Nada aqui vira conclusão de saúde. São padrões de
     comportamento, não diagnóstico.
   ══════════════════════════════════════════════════════════ */

const MIN_OCORRENCIAS = 4;
const JANELA_OBS = 28;

/* Cada observador recebe o contexto e devolve memória ou null.
   `chave` identifica a memória para atualizar em vez de duplicar. */
const OBSERVADORES = [

  { chave: 'refeicao-pulada',
    ver: ctx => {
      const alvo = ctx.REFS.slice(0,4).map(r => ({
        r, n: ctx.dias.filter(d => ctx.temRef(d, r.id) === false && ctx.temAlgo(d)).length
      })).sort((a,b) => b.n - a.n)[0];
      if (!alvo || alvo.n < MIN_OCORRENCIAS) return null;
      const pct = Math.round(alvo.n / Math.max(1, ctx.diasComRegistro) * 100);
      if (pct < 40) return null;
      return { t: `Costuma pular ou não registrar ${alvo.r.nome.toLowerCase()}`,
               ev: `${alvo.n} de ${ctx.diasComRegistro} dias registrados (${pct}%)`, n: alvo.n };
    } },

  { chave: 'dia-fraco',
    ver: ctx => {
      const nomes = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
      const por = [0,0,0,0,0,0,0], tot = [0,0,0,0,0,0,0];
      ctx.dias.forEach(d => {
        const g = ctx.diaSemana(d);
        tot[g]++;
        if (ctx.temAlgo(d)) por[g]++;
      });
      let pior = -1, piorPct = 1;
      for (let i=0;i<7;i++) {
        if (tot[i] < 3) continue;
        const p = por[i]/tot[i];
        if (p < piorPct) { piorPct = p; pior = i; }
      }
      if (pior < 0 || piorPct > 0.5) return null;
      return { t: `Registra menos ${nomes[pior] === 'domingo' || nomes[pior] === 'sábado' ? 'no' : 'na'} ${nomes[pior]}`,
               ev: `${Math.round(piorPct*100)}% dos ${nomes[pior]}s do período`, n: tot[pior] };
    } },

  { chave: 'fim-de-semana-alto',
    ver: ctx => {
      const util = [], fds = [];
      ctx.dias.forEach(d => {
        const k = ctx.kcal(d);
        if (!k) return;
        const g = ctx.diaSemana(d);
        (g === 0 || g === 6 ? fds : util).push(k);
      });
      if (util.length < 5 || fds.length < 3) return null;
      const m = a => a.reduce((x,y)=>x+y,0)/a.length;
      const dif = m(fds) - m(util);
      if (dif < 350) return null;
      return { t: 'Come bem mais no fim de semana',
               ev: `+${Math.round(dif)} kcal por dia contra os dias úteis`, n: fds.length };
    } },

  { chave: 'alimentos-base',
    ver: ctx => {
      const cont = {};
      ctx.dias.forEach(d => ctx.itens(d).forEach(i => { cont[i.n] = (cont[i.n]||0) + 1; }));
      const top = Object.keys(cont).map(n => ({ n, c: cont[n] }))
        .filter(x => x.c >= MIN_OCORRENCIAS).sort((a,b) => b.c - a.c).slice(0,4);
      if (top.length < 2) return null;
      return { t: `Base alimentar: ${top.map(x=>x.n.toLowerCase()).join(', ')}`,
               ev: `os mais repetidos em ${ctx.diasComRegistro} dias`, n: top[0].c };
    } },

  { chave: 'horario-treino',
    ver: ctx => {
      if (ctx.sessoes.length < MIN_OCORRENCIAS) return null;
      const nomes = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
      const cont = [0,0,0,0,0,0,0];
      ctx.sessoes.forEach(s => cont[ctx.diaSemana(s.d)]++);
      const top = cont.map((c,i)=>({c,i})).sort((a,b)=>b.c-a.c).filter(x=>x.c>=2).slice(0,3);
      if (!top.length) return null;
      return { t: `Treina mais ${top.map(x=>nomes[x.i]).join(', ')}`,
               ev: `${ctx.sessoes.length} sessões no período`, n: ctx.sessoes.length };
    } },

  { chave: 'aderencia-treino-registro',
    ver: ctx => {
      const comTreino = [], semTreino = [];
      ctx.dias.forEach(d => {
        const k = ctx.kcal(d);
        (ctx.treinou(d) ? comTreino : semTreino).push(k > 0 ? 1 : 0);
      });
      if (comTreino.length < 3 || semTreino.length < 5) return null;
      const m = a => a.reduce((x,y)=>x+y,0)/a.length;
      const dif = m(comTreino) - m(semTreino);
      if (Math.abs(dif) < 0.25) return null;
      return dif > 0
        ? { t: 'Registra melhor nos dias em que treina',
            ev: `${Math.round(m(comTreino)*100)}% contra ${Math.round(m(semTreino)*100)}% nos outros`, n: comTreino.length }
        : { t: 'Registra pior nos dias em que treina',
            ev: `${Math.round(m(comTreino)*100)}% contra ${Math.round(m(semTreino)*100)}% nos outros`, n: comTreino.length };
    } },

  { chave: 'proteina-padrao',
    ver: ctx => {
      const ps = ctx.dias.map(d => ctx.prot(d)).filter(x => x > 0);
      if (ps.length < MIN_OCORRENCIAS * 2) return null;
      const m = ps.reduce((a,b)=>a+b,0)/ps.length;
      const pct = m / Math.max(1, ctx.metaProt);
      if (pct >= 0.9) return { t: 'Costuma bater a meta de proteína',
        ev: `média de ${Math.round(m)} g em ${ps.length} dias`, n: ps.length };
      if (pct < 0.7) return { t: 'Costuma ficar bem abaixo da meta de proteína',
        ev: `média de ${Math.round(m)} g contra alvo de ${ctx.metaProt} g`, n: ps.length };
      return null;
    } },

  { chave: 'janela-alimentar',
    ver: ctx => {
      const js = ctx.dias.map(d => ctx.jejumNoturno(d)).filter(x => x != null);
      if (js.length < MIN_OCORRENCIAS) return null;
      const m = js.reduce((a,b)=>a+b,0)/js.length/60;
      if (m < 11) return null;
      return { t: `Jejum noturno habitual de cerca de ${m.toFixed(0)} horas`,
               ev: `média de ${js.length} noites medidas`, n: js.length };
    } },

  { chave: 'hora-ultima-refeicao',
    ver: ctx => {
      const hs = ctx.dias.map(d => ctx.ultimaHora(d)).filter(x => x != null);
      if (hs.length < MIN_OCORRENCIAS) return null;
      const m = hs.reduce((a,b)=>a+b,0)/hs.length;
      if (m < 21*60) return null;
      const hh = Math.floor(m/60), mm = Math.round(m%60);
      return { t: `Última refeição tarde, por volta das ${hh}h${String(mm).padStart(2,'0')}`,
               ev: `média de ${hs.length} dias`, n: hs.length };
    } }
];

/* Roda os observadores e devolve as memórias novas ou atualizadas. */
function observar(ctx) {
  const achadas = [];
  OBSERVADORES.forEach(o => {
    let m = null;
    try { m = o.ver(ctx); } catch (e) { m = null; }
    if (m) achadas.push(Object.assign({ chave: o.chave, origem: 'observado', d: ctx.hoje }, m));
  });
  return achadas;
}

/* Funde com o que já existe: atualiza pela chave em vez de
   duplicar, e preserva o que a pessoa escreveu à mão. */
function fundirMemorias(atuais, novas) {
  const out = (atuais || []).filter(x => x.origem !== 'observado' ||
                                         novas.some(n => n.chave === x.chave) === false
                                         ? true : false);
  const manual = (atuais || []).filter(x => x.origem !== 'observado');
  const obsAntigas = (atuais || []).filter(x => x.origem === 'observado');

  const mescladas = novas.map(n => {
    const ja = obsAntigas.find(x => x.chave === n.chave);
    return ja ? Object.assign({}, ja, n, { desde: ja.desde || ja.d }) : Object.assign({}, n, { desde: n.d });
  });

  // observações que sumiram: o padrão deixou de existir
  const sumiram = obsAntigas.filter(x => !novas.some(n => n.chave === x.chave));
  return { memorias: manual.concat(mescladas), removidas: sumiram };
}
