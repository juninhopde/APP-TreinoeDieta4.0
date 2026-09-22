/* ══════════════════════════════════════════════════════════
   MOTOR DE DIAGNÓSTICO

   Lê os dados que o app já tem e devolve achados com número,
   severidade e ação. Não estima, não chuta, não alucina: cada
   achado nasce de uma conta sobre registro real.

   É o que responde "por que não estou emagrecendo" com o
   motivo, em vez de conselho de blog.

   Severidade:  critico | atencao | ok | neutro
   ══════════════════════════════════════════════════════════ */

const DIAG_JANELA = 28;

function _dias(hojeISO, n) {
  const base = new Date(hojeISO.slice(0,4), +hojeISO.slice(5,7)-1, +hojeISO.slice(8,10));
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    out.push(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'));
  }
  return out;
}
const _media = a => a.length ? a.reduce((t,x)=>t+x,0)/a.length : 0;
const _dp = a => {
  if (a.length < 2) return 0;
  const m = _media(a);
  return Math.sqrt(a.reduce((t,x)=>t+(x-m)*(x-m),0)/(a.length-1));
};

/* ctx = {
     hoje, cfg, diario, pesos, sessoes, rotinas, REFS,
     consumoDia(iso) -> kcal, macrosDia(iso) -> {p,c,g,kcal,itens},
     gasto, composicao, ritmo, semanaCiclo, faseAtual, recordes, PISO
   } */
function diagnosticar(ctx) {
  const A = [];
  const add = (id, sev, titulo, achado, acao, n) =>
    A.push({ id, sev, titulo, achado, acao, n: n == null ? null : n });

  const dias = _dias(ctx.hoje, DIAG_JANELA);
  const regs = dias.map(d => ({ d, m: ctx.macrosDia(d) }));
  const comDiario = regs.filter(r => r.m.kcal > 0);
  const cobertura = comDiario.length / DIAG_JANELA;
  const kcals = comDiario.map(r => r.m.kcal);
  const prots = comDiario.map(r => r.m.p);
  const mediaKcal = _media(kcals), mediaProt = _media(prots);

  /* ── 1. Cobertura de registro ───────────────────────── */
  add('cobertura',
    cobertura >= 0.85 ? 'ok' : cobertura >= 0.6 ? 'atencao' : 'critico',
    'Cobertura de registro',
    `${comDiario.length} de ${DIAG_JANELA} dias com diário (${Math.round(cobertura*100)}%).`,
    cobertura >= 0.85 ? 'Está no nível que torna todos os outros números confiáveis.'
      : 'Registre também os dias ruins. Pular justamente os dias que come mais é o que faz o app calcular um gasto menor que o real e apertar sua meta sem motivo.',
    Math.round(cobertura*100));

  /* ── 2. Aderência calórica ──────────────────────────── */
  if (comDiario.length >= 5) {
    const desvio = mediaKcal - ctx.cfg.kcal;
    const pct = (desvio / ctx.cfg.kcal) * 100;
    add('aderencia-kcal',
      Math.abs(pct) <= 7 ? 'ok' : Math.abs(pct) <= 15 ? 'atencao' : 'critico',
      'Consumo médio × meta',
      `${Math.round(mediaKcal)} kcal/dia contra meta de ${ctx.cfg.kcal}. ${desvio >= 0 ? 'Acima' : 'Abaixo'} em ${Math.abs(Math.round(desvio))} kcal (${Math.abs(pct).toFixed(0)}%).`,
      Math.abs(pct) <= 7 ? 'A meta está sendo cumprida. Não mexa em nada.'
        : desvio > 0 ? 'O déficit planejado não está acontecendo. Antes de cortar a meta, feche a execução — cortar o que já não é cumprido só aumenta a distância.'
        : 'Você está comendo bem abaixo da meta. Déficit maior que o planejado custa massa magra e derruba aderência. Suba para a meta.',
      Math.round(mediaKcal));
  }

  /* ── 3. Consistência dia a dia ──────────────────────── */
  if (comDiario.length >= 10) {
    const dp = _dp(kcals), cv = dp / (mediaKcal || 1);
    add('consistencia',
      cv <= 0.15 ? 'ok' : cv <= 0.28 ? 'atencao' : 'critico',
      'Consistência do consumo',
      `Variação diária de ${Math.round(dp)} kcal em torno da média (${Math.round(cv*100)}%).`,
      cv <= 0.15 ? 'Rotina alimentar estável, que é o que faz a média semanal valer.'
        : 'Oscilação alta. Dias muito acima cancelam dias muito abaixo e a semana fecha sem déficit, mesmo parecendo que teve.',
      Math.round(cv*100));
  }

  /* ── 4. Fim de semana × dias úteis ──────────────────── */
  const semana = comDiario.filter(r => { const g = new Date(r.d).getUTCDay(); return g >= 1 && g <= 5; });
  const fds = comDiario.filter(r => { const g = new Date(r.d).getUTCDay(); return g === 0 || g === 6; });
  if (semana.length >= 5 && fds.length >= 2) {
    const ms = _media(semana.map(r=>r.m.kcal)), mf = _media(fds.map(r=>r.m.kcal));
    const dif = mf - ms;
    const custoSemanal = dif * 2;
    add('fim-de-semana',
      dif <= 200 ? 'ok' : dif <= 500 ? 'atencao' : 'critico',
      'Fim de semana',
      `${Math.round(mf)} kcal aos sábados e domingos contra ${Math.round(ms)} nos dias úteis — diferença de ${Math.round(dif)} kcal.`,
      dif <= 200 ? 'O fim de semana não está sabotando a semana.'
        : `Dois dias assim somam ${Math.round(custoSemanal)} kcal por semana, o equivalente a ${(custoSemanal/7700).toFixed(2).replace('.',',')} kg de gordura por mês que deixam de sair. É quase sempre aqui que o mês trava, não na dieta de segunda a sexta.`,
      Math.round(dif));
  }

  /* ── 5. Proteína ────────────────────────────────────── */
  if (comDiario.length >= 5) {
    const alvo = ctx.cfg.prot;
    const pctP = (mediaProt / alvo) * 100;
    const diasBaixos = comDiario.filter(r => r.m.p < alvo * 0.8).length;
    add('proteina',
      pctP >= 90 ? 'ok' : pctP >= 75 ? 'atencao' : 'critico',
      'Proteína',
      `Média de ${Math.round(mediaProt)} g/dia contra alvo de ${alvo} g (${Math.round(pctP)}%). ${diasBaixos} dias abaixo de 80% do alvo.`,
      pctP >= 90 ? 'Proteína no nível que preserva massa magra durante o déficit.'
        : 'Em déficit, proteína baixa é o que transforma perda de peso em perda de músculo. Ancore em cada refeição: se toda refeição tiver uma fonte, o alvo sai sozinho.',
      Math.round(mediaProt));
  }

  /* ── 6. Refeição mais falha ─────────────────────────── */
  if (comDiario.length >= 7 && ctx.REFS) {
    const falhas = ctx.REFS.slice(0,4).map(r => ({
      nome: r.nome,
      vazias: comDiario.filter(x => !((ctx.diario[x.d].refs || {})[r.id] || []).length).length
    })).sort((a,b) => b.vazias - a.vazias);
    const pior = falhas[0];
    if (pior && pior.vazias >= Math.max(3, comDiario.length * 0.3)) {
      add('refeicao-falha', 'atencao', 'Refeição que mais falta',
        `${pior.nome} ficou sem registro em ${pior.vazias} dos ${comDiario.length} dias registrados.`,
        'Ou você pula essa refeição, e aí a proteína do dia não fecha, ou come e não registra, e aí todo cálculo do app fica otimista. Vale descobrir qual dos dois é.',
        pior.vazias);
    }
  }

  /* ── 7. Ritmo de perda ──────────────────────────────── */
  if (ctx.ritmo) {
    const pct = ctx.ritmo.pct * 100;
    const perdendo = ctx.ritmo.kgSem < 0;
    add('ritmo',
      !perdendo ? 'critico' : (pct >= 0.5 && pct <= 1.0) ? 'ok' : 'atencao',
      'Ritmo de perda',
      `${ctx.ritmo.kgSem.toFixed(2).replace('.',',')} kg por semana (${pct.toFixed(2).replace('.',',')}% do peso).`,
      !perdendo ? 'Sem perda no período. A causa quase nunca é metabólica: é consumo acima do estimado, registro incompleto, ou as duas coisas.'
        : pct > 1.0 ? 'Rápido demais. Acima de 1% por semana a perda de massa magra cresce de forma relevante. Suba a meta calórica.'
        : pct < 0.5 ? 'Abaixo da faixa que o déficit planejado deveria produzir. Cruze com a aderência antes de cortar mais caloria.'
        : 'Dentro da faixa que preserva massa magra.',
      +pct.toFixed(2));
  }

  /* ── 8. Déficit planejado × déficit real ────────────── */
  if (ctx.gasto && ctx.gasto.ok && comDiario.length >= 10) {
    const realizado = ctx.gasto.tdee - mediaKcal;
    const planejado = ctx.gasto.tdee - ctx.cfg.kcal;
    const lacuna = planejado - realizado;
    add('deficit-real',
      Math.abs(lacuna) <= 120 ? 'ok' : Math.abs(lacuna) <= 300 ? 'atencao' : 'critico',
      'Déficit planejado × realizado',
      `Planejado ${Math.round(planejado)} kcal/dia, realizado ${Math.round(realizado)} kcal/dia.`,
      Math.abs(lacuna) <= 120 ? 'O plano e a execução estão alinhados.'
        : lacuna > 0 ? `Faltam ${Math.round(lacuna)} kcal de déficit por dia — ${(lacuna*30/7700).toFixed(1).replace('.',',')} kg por mês que não saem. O problema é execução, não o número da meta.`
        : 'Você está criando mais déficit do que planejou. Confira se não está por baixo demais.',
      Math.round(realizado));
  }

  /* ── 9. Massa magra ─────────────────────────────────── */
  const comBf = ctx.pesos.filter(p => p.bf).sort((a,b)=>a.d<b.d?-1:1);
  if (comBf.length >= 2) {
    const a0 = comBf[0], a1 = comBf[comBf.length-1];
    const mg0 = a0.kg*(1-a0.bf/100), mg1 = a1.kg*(1-a1.bf/100);
    const dm = mg1 - mg0, dg = (a1.kg*a1.bf/100) - (a0.kg*a0.bf/100);
    const total = (a1.kg - a0.kg) || -0.001;
    const fracGordura = Math.min(1, Math.max(0, dg / total));
    add('massa-magra',
      dm >= -0.5 ? 'ok' : dm >= -1.5 ? 'atencao' : 'critico',
      'Massa magra',
      `${dg < 0 ? '−' : '+'}${Math.abs(dg).toFixed(1).replace('.',',')} kg de gordura e ${dm < 0 ? '−' : '+'}${Math.abs(dm).toFixed(1).replace('.',',')} kg de massa magra. ${Math.round(fracGordura*100)}% do que saiu era gordura.`,
      dm >= -0.5 ? 'Massa magra praticamente preservada — é exatamente o alvo de um déficit bem conduzido.'
        : 'Perda de massa magra relevante. As três alavancas, nessa ordem: subir proteína, não cortar mais caloria, e não faltar treino.',
      Math.round(fracGordura*100));
  } else if (ctx.pesos.length >= 2) {
    add('massa-magra', 'neutro', 'Massa magra',
      'Sem duas medidas completas de cintura e pescoço, não dá para separar gordura de músculo.',
      'Meça cintura e pescoço nas próximas duas pesagens. É fita métrica e trinta segundos — e responde a única pergunta que a balança não responde.');
  }

  /* ── 10. Cintura ────────────────────────────────────── */
  const comCint = ctx.pesos.filter(p => p.cintura).sort((a,b)=>a.d<b.d?-1:1);
  if (comCint.length >= 2) {
    const dC = comCint[comCint.length-1].cintura - comCint[0].cintura;
    const pesoMudou = ctx.pesos.length >= 2;
    add('cintura', dC <= -1 ? 'ok' : dC <= 0.5 ? 'neutro' : 'atencao', 'Cintura',
      `${dC <= 0 ? '−' : '+'}${Math.abs(dC).toFixed(1).replace('.',',')} cm no período, agora em ${comCint[comCint.length-1].cintura} cm.`,
      dC <= -1 ? 'Cintura caindo é o melhor sinal de perda de gordura visceral, e costuma continuar caindo mesmo em semanas que a balança empaca.'
        : 'Cintura parada junto com peso parado confirma que o déficit não está acontecendo. Cintura parada com peso caindo é sinal de perda de água ou de massa magra.',
      +dC.toFixed(1));
  }

  /* ── 11. Frequência de treino ───────────────────────── */
  const sess28 = ctx.sessoes.filter(s => dias.includes(s.d));
  const porSemana = sess28.length / 4;
  add('frequencia',
    porSemana >= 2.5 ? 'ok' : porSemana >= 1.5 ? 'atencao' : 'critico',
    'Frequência de treino',
    `${sess28.length} sessões em 28 dias — ${porSemana.toFixed(1).replace('.',',')} por semana.`,
    porSemana >= 2.5 ? 'Frequência suficiente para o estímulo que preserva massa magra.'
      : 'Em déficit, o treino de força não é o que queima caloria — é o que diz ao corpo para não gastar músculo. Faltar treino muda a composição do que você perde.',
    sess28.length);

  /* ── 12. Progressão de carga ────────────────────────── */
  const porEx = {};
  ctx.sessoes.forEach(s => (s.ex||[]).forEach(e => {
    const kg = Math.max(...(e.series||[]).map(x => +x.kg || 0), 0);
    if (!kg) return;
    (porEx[e.n] = porEx[e.n] || []).push({ d: s.d, kg });
  }));
  const nomes = Object.keys(porEx).filter(n => porEx[n].length >= 3);
  if (nomes.length) {
    const subiram = nomes.filter(n => {
      const h = porEx[n].sort((a,b)=>a.d<b.d?-1:1);
      return h[h.length-1].kg > h[0].kg;
    });
    const estagnados = nomes.filter(n => {
      const h = porEx[n].sort((a,b)=>a.d<b.d?-1:1).slice(-3);
      return h.length === 3 && h[0].kg === h[2].kg;
    });
    const pctSub = (subiram.length / nomes.length) * 100;
    add('progressao',
      pctSub >= 60 ? 'ok' : pctSub >= 30 ? 'atencao' : 'critico',
      'Progressão de carga',
      `${subiram.length} de ${nomes.length} exercícios com carga maior que no início. ${estagnados.length ? estagnados.length + ' parados há 3 sessões: ' + estagnados.slice(0,3).join(', ') + '.' : ''}`,
      pctSub >= 60 ? 'Ganhando força em déficit é o melhor indicador de que o músculo está sendo preservado.'
        : 'Carga parada em déficit não é necessariamente erro, mas se vem junto com perda de massa magra, é sinal de que falta proteína, recuperação ou estímulo.',
      Math.round(pctSub));
  }

  /* ── 13. Esforço (RIR) ──────────────────────────────── */
  const rirs = [];
  sess28.forEach(s => (s.ex||[]).forEach(e => (e.series||[]).forEach(x => {
    if (x.rir !== '' && x.rir != null && !isNaN(+x.rir)) rirs.push(+x.rir);
  })));
  if (rirs.length >= 8 && ctx.faseAtual) {
    const m = _media(rirs), alvo = ctx.faseAtual.rirAlvo;
    const dif = m - alvo;
    add('rir',
      Math.abs(dif) <= 1 ? 'ok' : 'atencao',
      'Esforço nas séries',
      `RIR médio de ${m.toFixed(1).replace('.',',')} contra alvo de ${alvo} na fase ${ctx.faseAtual.nome}. ${rirs.length} séries com esforço anotado.`,
      Math.abs(dif) <= 1 ? 'Intensidade calibrada com a fase.'
        : dif > 1 ? 'Você está parando longe demais da falha. Sobra estímulo na mesa e a carga não tem por que subir.'
        : 'Você está indo perto demais da falha para esta fase. Em déficit isso atrapalha a recuperação sem entregar estímulo extra.',
      +m.toFixed(1));
  } else if (sess28.length >= 3) {
    add('rir', 'neutro', 'Esforço nas séries',
      'Poucas séries com RIR anotado.',
      'Sem o esforço registrado, não dá para distinguir progressão de teimosia — nem para o app sugerir carga com segurança.');
  }

  /* ── 14. Aderência ao mesociclo ─────────────────────── */
  if (ctx.semanaCiclo) {
    const esperado = Math.min(ctx.semanaCiclo, 12) * 3;
    const feito = ctx.sessoes.length;
    const pct = esperado ? (feito / esperado) * 100 : 0;
    add('mesociclo',
      pct >= 80 ? 'ok' : pct >= 55 ? 'atencao' : 'critico',
      'Aderência ao ciclo',
      `Semana ${Math.min(ctx.semanaCiclo,12)} de 12: ${feito} sessões feitas de ${esperado} previstas (${Math.round(pct)}%).`,
      pct >= 80 ? 'O ciclo está sendo cumprido, então as fases fazem sentido.'
        : 'Com muitas sessões perdidas, a periodização vira enfeite: você chega na fase de intensificação sem a base que ela pressupõe. Vale reiniciar o ciclo em vez de seguir no papel.',
      Math.round(pct));
  }

  /* ── 15. Volume de treino ───────────────────────────── */
  const volSem = [0,1,2,3].map(i => {
    const janela = dias.slice(i*7, i*7+7);
    return ctx.sessoes.filter(s => janela.includes(s.d))
      .reduce((t,s) => t + (s.ex||[]).reduce((u,e) => u + (e.series||[]).reduce((v,x) => v + (+x.kg||0)*(+x.reps||0), 0), 0), 0);
  });
  if (volSem.filter(v=>v>0).length >= 3) {
    const tend = volSem[3] - volSem[0];
    add('volume', tend >= 0 ? 'ok' : 'neutro', 'Volume de treino',
      `Última semana: ${Math.round(volSem[3]/1000*10)/10} t. Quatro semanas atrás: ${Math.round(volSem[0]/1000*10)/10} t.`,
      tend >= 0 ? 'Volume estável ou subindo em déficit é um bom sinal de recuperação adequada.'
        : 'Volume caindo pode ser fase de deload (normal) ou fadiga acumulada (não normal). Cruze com a fase atual do ciclo.',
      Math.round(volSem[3]));
  }

  /* ── 16. Álcool ─────────────────────────────────────── */
  let alcKcal = 0;
  comDiario.forEach(r => {
    const d = ctx.diario[r.d];
    (ctx.REFS||[]).forEach(ref => ((d.refs||{})[ref.id]||[]).forEach(i => { if (i.alc) alcKcal += i.alc * 7; }));
  });
  if (alcKcal > 0) {
    const porSem = alcKcal / 4;
    add('alcool', porSem < 400 ? 'neutro' : porSem < 900 ? 'atencao' : 'critico', 'Álcool',
      `${Math.round(alcKcal)} kcal de álcool em 28 dias — cerca de ${Math.round(porSem)} por semana.`,
      porSem < 400 ? 'Volume baixo, não muda o resultado.'
        : `Equivale a ${(alcKcal/7700).toFixed(2).replace('.',',')} kg de gordura no mês. Além da caloria, o álcool suprime a oxidação de gordura por horas e costuma vir acompanhado de comida fora do plano.`,
      Math.round(porSem));
  }

  /* ── 17. Hidratação ─────────────────────────────────── */
  const aguas = dias.map(d => (ctx.diario[d] || {}).agua || 0).filter(x => x > 0);
  if (aguas.length >= 7) {
    const mlMedio = _media(aguas) * ctx.cfg.copoMl;
    const pct = (mlMedio / ctx.cfg.aguaMeta) * 100;
    add('agua', pct >= 80 ? 'ok' : 'atencao', 'Hidratação',
      `${(mlMedio/1000).toFixed(1).replace('.',',')} L por dia em média (${Math.round(pct)}% da meta).`,
      pct >= 80 ? 'Hidratação adequada.'
        : 'Desidratação leve atrapalha desempenho no treino e bagunça a leitura da balança, porque água pesa e mascara a tendência.',
      Math.round(pct));
  }

  /* ── 18. Passos ─────────────────────────────────────── */
  const passos = dias.map(d => (ctx.diario[d] || {}).passos || 0).filter(x => x > 0);
  if (passos.length >= 5) {
    const m = _media(passos);
    const pct = (m / ctx.cfg.passosMeta) * 100;
    add('passos', pct >= 85 ? 'ok' : 'atencao', 'Passos',
      `${Math.round(m).toLocaleString('pt-BR')} passos/dia em ${passos.length} dias registrados (${Math.round(pct)}% da meta).`,
      pct >= 85 ? 'Gasto de atividade não-exercício em bom nível — é ele que sustenta o déficit sem cortar mais comida.'
        : `Faltam ${Math.round(ctx.cfg.passosMeta - m).toLocaleString('pt-BR')} passos por dia. Subir isso é o caminho mais barato de aumentar déficit sem tirar comida do prato.`,
      Math.round(m));
  }

  /* ── 19. Confiabilidade do gasto medido ─────────────── */
  if (ctx.gasto) {
    add('gasto', ctx.gasto.ok ? (ctx.gasto.confianca === 'alta' ? 'ok' : 'atencao') : 'atencao',
      'Gasto energético medido',
      ctx.gasto.ok
        ? `${ctx.gasto.tdee} kcal/dia, confiança ${ctx.gasto.confianca}, com ${ctx.gasto.diasReg} dias de diário e ${ctx.gasto.pesagens} pesagens.`
        : ctx.gasto.texto,
      ctx.gasto.ok
        ? (ctx.gasto.confianca === 'alta' ? 'Número confiável. É nele que a sua meta deve se basear, não na fórmula.'
           : 'Confiança ainda média. Mais dias de diário e mais pesagens apertam a estimativa.')
        : 'Enquanto isso o app usa a fórmula, que pode errar centenas de calorias para um indivíduo.',
      ctx.gasto.ok ? ctx.gasto.tdee : null);
  }

  /* ── 20. Tempo desde a última pesagem ───────────────── */
  if (ctx.pesos.length) {
    const ult = ctx.pesos.slice().sort((a,b)=>a.d<b.d?-1:1).slice(-1)[0];
    const q = Math.round((new Date(ctx.hoje) - new Date(ult.d)) / 86400000);
    add('pesagem', q <= 9 ? 'ok' : q <= 20 ? 'atencao' : 'critico', 'Última pesagem',
      q === 0 ? 'Hoje.' : `Há ${q} dias.`,
      q <= 9 ? 'Cadência adequada. É a pesagem que alimenta o gasto medido.'
        : 'Sem pesagem recente o motor de gasto degrada e a meta para de acompanhar o corpo. Uma vez por semana, em jejum, mesmo dia.',
      q);
  }

  /* ── 21. Séries por grupo muscular ──────────────────── */
  if (typeof seriesPorGrupo === 'function' && ctx.sessoes.length) {
    const sete = dias.slice(-7);
    const mapa = seriesPorGrupo(ctx.sessoes, sete);
    const orf = gruposOrfaos(mapa);
    const baixos = GRUPOS_PRINCIPAIS.filter(x => mapa[x] && mapa[x] < FAIXA_SERIES.min);
    const total = Object.values(mapa).reduce((a,b)=>a+b,0);
    add('series-grupo',
      orf.length >= 3 ? 'critico' : (orf.length || baixos.length) ? 'atencao' : 'ok',
      'Séries por músculo',
      `${total} séries válidas em 7 dias. ${orf.length ? 'Sem estímulo direto: ' + orf.join(', ') + '.' : 'Todos os grupos receberam estímulo.'}${baixos.length ? ' Abaixo da faixa: ' + baixos.join(', ') + '.' : ''}`,
      orf.length ? 'Séries semanais por músculo é o principal motor de hipertrofia. Grupo sem estímulo em déficit é o primeiro a ser consumido — uma ou duas séries já resolvem.'
        : 'Distribuição adequada entre os grupos.',
      total);
  }

  /* ── 22. Fibra e sódio ──────────────────────────────── */
  if (typeof microsDoDia === 'function' && comDiario.length >= 7) {
    let fib = 0, sod = 0, comDado = 0, itens = 0, diasComDado = 0;
    comDiario.forEach(r => {
      const m = microsDoDia(ctx.diario[r.d], ctx.REFS);
      if (m.com) { fib += m.fib; sod += m.sod; comDado += m.com; itens += m.total; diasComDado++; }
    });
    if (diasComDado >= 5) {
      const fibMedia = fib / diasComDado, sodMedio = sod / diasComDado;
      const cob = comDado / (itens || 1);
      add('fibra', fibMedia >= REF_MICRO.fibra*0.8 ? 'ok' : 'atencao', 'Fibra',
        `${fibMedia.toFixed(0)} g/dia em média, contra referência de ${REF_MICRO.fibra} g. Dado disponível para ${Math.round(cob*100)}% dos itens registrados.`,
        fibMedia >= REF_MICRO.fibra*0.8 ? 'Fibra adequada, o que ajuda muito a saciedade dentro do déficit.'
          : 'Fibra baixa é uma das causas mais subestimadas de fome em déficit. Feijão, aveia, brócolis e frutas com casca resolvem sem custar quase caloria nenhuma.',
        Math.round(fibMedia));
      add('sodio', sodMedio <= REF_MICRO.sodioMax ? 'ok' : 'atencao', 'Sódio',
        `${Math.round(sodMedio)} mg/dia em média, contra limite de referência de ${REF_MICRO.sodioMax} mg.`,
        sodMedio <= REF_MICRO.sodioMax ? 'Dentro da faixa.'
          : 'Sódio alto retém água e trava a balança por dias, mesmo com gordura saindo. Se o peso empacou sem explicação, olhe aqui antes de cortar caloria.',
        Math.round(sodMedio));
    }
  }

  /* ── 23. Fase do plano e reganho ────────────────────── */
  if (ctx.fasePlano) {
    const f = ctx.fasePlano, rg = ctx.reganho;
    if (f === 'manutencao' && rg && rg.nivel !== 'sem-dados') {
      const sev = rg.nivel === 'dentro' ? 'ok'
                : rg.nivel === 'abaixo' ? 'atencao'
                : rg.nivel === 'amarelo' ? 'atencao' : 'critico';
      add('reganho', sev, 'Manutenção',
        `Tendência em ${String(rg.atual.toFixed(1)).replace('.',',')} kg, faixa de ${String(ctx.faixa.min).replace('.',',')} a ${String(ctx.faixa.max).replace('.',',')} kg.`,
        rg.txt, +rg.atual.toFixed(1));
    } else if (f === 'perda' && ctx.tendencia != null && ctx.tendencia <= ctx.cfg.pesoMeta * 1.01) {
      add('transicao', 'atencao', 'Meta atingida',
        `Sua tendência chegou em ${String(ctx.tendencia.toFixed(1)).replace('.',',')} kg.`,
        'Continuar em déficit depois de chegar é como se perde massa magra e como se cansa da rotina. Passe para manutenção na aba Progresso.',
        +ctx.tendencia.toFixed(1));
    }
  }

  /* ── 24. Backup ─────────────────────────────────────── */
  const ultBackup = ctx.cfg.ultimoBackup;
  const qb = ultBackup ? Math.round((new Date(ctx.hoje) - new Date(ultBackup)) / 86400000) : null;
  add('backup', qb == null || qb > 45 ? 'atencao' : 'ok', 'Backup',
    qb == null ? 'Nenhum backup exportado ainda.' : `Último backup há ${qb} dias.`,
    'Os dados vivem só neste aparelho. Limpar os dados do navegador, trocar de celular ou desinstalar apaga tudo. Exporte em Ajustes uma vez por mês.',
    qb);

  const ordem = { critico: 0, atencao: 1, neutro: 2, ok: 3 };
  A.sort((a, b) => ordem[a.sev] - ordem[b.sev]);
  return A;
}

/* ══ PERGUNTAS PRONTAS ════════════════════════════════
   Cada uma monta a resposta a partir dos achados, na ordem
   de causa provável. Sem IA e sem internet.            */

const PERGUNTAS = [
  { q: 'Por que não estou emagrecendo?',
    usa: ['ritmo','deficit-real','aderencia-kcal','cobertura','fim-de-semana','alcool','passos'],
    intro: a => {
      const r = a.find(x => x.id === 'ritmo');
      if (!r) return 'Faltam pesagens para responder isso com número. Registre o peso semanalmente por 3 semanas.';
      if (r.n < -0.5) return 'Você **está** emagrecendo, e no ritmo certo. Veja abaixo por que talvez não pareça.';
      return 'A causa quase nunca é metabólica. Na ordem de probabilidade:';
    } },

  { q: 'Estou perdendo músculo?',
    usa: ['massa-magra','proteina','frequencia','progressao','ritmo'],
    intro: () => 'Quatro sinais respondem isso melhor que a balança:' },

  { q: 'Devo cortar calorias agora?',
    usa: ['ritmo','aderencia-kcal','cobertura','deficit-real','gasto'],
    intro: a => {
      const ad = a.find(x => x.id === 'aderencia-kcal');
      const cob = a.find(x => x.id === 'cobertura');
      if (cob && cob.n < 70) return '**Não.** Com registro incompleto você não sabe quanto come hoje — cortar um número que você não conhece é chutar para baixo.';
      if (ad && ad.n > 0 && ad.sev !== 'ok') return '**Provavelmente não.** A meta atual ainda não está sendo cumprida. Corte só o que já é executado.';
      return 'Depende do que os números abaixo mostram:';
    } },

  { q: 'Por que minha carga não sobe?',
    usa: ['progressao','rir','frequencia','proteina','mesociclo','volume'],
    intro: () => 'Carga parada tem cinco causas comuns, nesta ordem:' },

  { q: 'Meu registro está bom o bastante?',
    usa: ['cobertura','consistencia','refeicao-falha','pesagem','rir','gasto'],
    intro: () => 'A qualidade de tudo que o app calcula depende disto:' },

  { q: 'O que mais atrapalha meu resultado hoje?',
    usa: null,
    intro: () => 'Os três pontos mais críticos agora:' }
];

function responder(pergunta, achados) {
  const sel = pergunta.usa
    ? pergunta.usa.map(id => achados.find(a => a.id === id)).filter(Boolean)
    : achados.filter(a => a.sev === 'critico' || a.sev === 'atencao').slice(0, 3);
  return { intro: pergunta.intro(achados), achados: sel };
}

/* Resumo compacto do estado, usado como contexto do assistente
   local. Números reais, para o modelo não precisar inventar. */
function resumoParaIA(achados, ctx) {
  const l = [];
  l.push(`Perfil: ${ctx.cfg.idade} anos, ${ctx.cfg.altura} cm, ${ctx.pesoAtual} kg, meta ${ctx.cfg.pesoMeta} kg.`);
  l.push(`Meta diária: ${ctx.cfg.kcal} kcal, ${ctx.cfg.prot} g de proteína.`);
  if (ctx.gasto && ctx.gasto.ok) l.push(`Gasto medido: ${ctx.gasto.tdee} kcal/dia (confiança ${ctx.gasto.confianca}).`);
  if (ctx.semanaCiclo) l.push(`Treino: semana ${Math.min(ctx.semanaCiclo,12)} de 12, fase ${ctx.faseAtual ? ctx.faseAtual.nome : '—'}.`);
  if (ctx.memorias) {
    l.push('');
    l.push('Padrões observados nesta pessoa:');
    l.push(ctx.memorias);
  }
  l.push('');
  l.push('Diagnóstico atual (dados reais, não invente outros):');
  achados.filter(a => a.sev !== 'ok').slice(0, 8).forEach(a => {
    l.push(`- [${a.sev.toUpperCase()}] ${a.titulo}: ${a.achado}`);
  });
  return l.join('\n');
}
