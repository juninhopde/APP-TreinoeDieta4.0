/* ══════════════════════════════════════════════════════════
   GASTO ADAPTATIVO

   Fórmula estática (Mifflin × fator de atividade) é uma média
   populacional. Para um indivíduo ela erra centenas de
   calorias, e erra mais conforme o peso cai e o metabolismo
   se adapta.

   Aqui o gasto é medido, não estimado: pela lei do balanço
   energético, o que você comeu menos o que virou (ou deixou
   de ser) tecido é o que você gastou.

       TDEE_dia = consumo_médio_dia − (Δpeso_kg × 7700) / dias

   A tendência de peso vem de regressão linear sobre as
   pesagens da janela, não da última leitura — peso diário
   oscila com hidratação, sal e volume intestinal, e a
   diferença entre duas balanças isoladas é ruído.

   Requer dados. Sem registro consistente o motor se recusa a
   dar um número, porque um número errado aqui vira meta
   errada, e meta errada para baixo é perigosa.
   ══════════════════════════════════════════════════════════ */

const KCAL_POR_KG = 7700;      // energia de 1 kg de tecido misto
const JANELA_PADRAO = 28;      // dias
const MIN_PESAGENS = 3;        // pesagens na janela
const MIN_SPAN_DIAS = 14;      // intervalo entre a primeira e a última
const MIN_COBERTURA = 0.6;     // fração mínima de dias com diário

/* Regressão linear por mínimos quadrados sobre (dia, kg).
   Devolve inclinação em kg/dia e o R² como medida de ajuste. */
function tendenciaPeso(pontos) {
  const n = pontos.length;
  if (n < 2) return null;
  const mx = pontos.reduce((t, p) => t + p.x, 0) / n;
  const my = pontos.reduce((t, p) => t + p.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  pontos.forEach(p => {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) * (p.x - mx);
    syy += (p.y - my) * (p.y - my);
  });
  if (sxx === 0) return null;
  const a = sxy / sxx;                          // kg por dia
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { kgDia: a, r2, intercepto: my - a * mx, mx, my };
}

/* Estima o gasto diário real.
   `pesos`  : [{ d:'YYYY-MM-DD', kg }]
   `consumo`: fn(dataISO) -> kcal do dia, ou 0 se não registrado
   Devolve null quando não há dado suficiente, com o motivo. */
function gastoAdaptativo(pesos, consumo, hojeISO, janela) {
  janela = janela || JANELA_PADRAO;
  const diaNum = s => Math.round(new Date(s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10)).getTime() / 86400000);
  const hoje = diaNum(hojeISO);
  const ini = hoje - janela + 1;

  const dentro = pesos
    .filter(p => diaNum(p.d) >= ini && diaNum(p.d) <= hoje)
    .sort((a, b) => a.d < b.d ? -1 : 1);

  if (dentro.length < MIN_PESAGENS)
    return { ok: false, motivo: 'pesagens', falta: MIN_PESAGENS - dentro.length,
             texto: 'Faltam pesagens. São necessárias ao menos ' + MIN_PESAGENS + ' nos últimos ' + janela + ' dias.' };

  const span = diaNum(dentro[dentro.length-1].d) - diaNum(dentro[0].d);
  if (span < MIN_SPAN_DIAS)
    return { ok: false, motivo: 'intervalo',
             texto: 'As pesagens precisam cobrir pelo menos ' + MIN_SPAN_DIAS + ' dias. Hoje cobrem ' + span + '.' };

  // consumo: só dias efetivamente registrados entram na média
  let somaKcal = 0, diasReg = 0;
  for (let d = ini; d <= hoje; d++) {
    const iso = new Date(d * 86400000).toISOString().slice(0, 10);
    const k = consumo(iso);
    if (k > 0) { somaKcal += k; diasReg++; }
  }
  const cobertura = diasReg / janela;
  if (cobertura < MIN_COBERTURA)
    return { ok: false, motivo: 'cobertura', cobertura,
             texto: 'Só ' + diasReg + ' dos últimos ' + janela + ' dias têm diário. São necessários ' +
                    Math.ceil(janela * MIN_COBERTURA) + '.' };

  const consumoMedio = somaKcal / diasReg;
  const t = tendenciaPeso(dentro.map(p => ({ x: diaNum(p.d), y: p.kg })));
  if (!t) return { ok: false, motivo: 'tendencia', texto: 'Não foi possível calcular a tendência de peso.' };

  const tdee = consumoMedio - t.kgDia * KCAL_POR_KG;

  /* Confiança: combina quantas pesagens existem, quanto do período
     tem diário e quão bem a reta descreve os pontos. */
  let pontos = 0;
  pontos += Math.min(1, dentro.length / 6) * 40;
  pontos += Math.min(1, cobertura / 0.85) * 40;
  pontos += Math.min(1, t.r2 / 0.7) * 20;
  const conf = pontos >= 80 ? 'alta' : pontos >= 55 ? 'média' : 'baixa';

  return {
    ok: true,
    tdee: Math.round(tdee),
    consumoMedio: Math.round(consumoMedio),
    kgSemana: +(t.kgDia * 7).toFixed(2),
    r2: +t.r2.toFixed(2),
    diasReg, janela, cobertura: +cobertura.toFixed(2),
    pesagens: dentro.length, span,
    confianca: conf, pontos: Math.round(pontos),
    // aviso honesto: dias sem registro assumem o mesmo consumo dos registrados
    vies: cobertura < 0.85
  };
}

/* Série histórica do gasto: recalcula a cada 7 dias para trás,
   para o gráfico mostrar se o metabolismo está caindo. */
function serieGasto(pesos, consumo, hojeISO, passos) {
  const diaNum = s => Math.round(new Date(s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10)).getTime() / 86400000);
  const out = [];
  for (let i = (passos || 8) - 1; i >= 0; i--) {
    const ref = new Date((diaNum(hojeISO) - i * 7) * 86400000).toISOString().slice(0, 10);
    const g = gastoAdaptativo(pesos, consumo, ref);
    if (g.ok) out.push({ d: ref, v: g.tdee });
  }
  return out;
}

/* Meta calórica a partir do gasto medido e de um ritmo alvo em
   % do peso corporal por semana. Respeita teto de déficit e piso. */
function metaPorRitmo(tdee, pesoKg, ritmoPct, pisoKcal) {
  const deficitBruto = (ritmoPct * pesoKg * KCAL_POR_KG) / 7;
  const tetoDeficit = tdee * 0.30;              // acima disso a perda de massa magra cresce
  const deficit = Math.min(deficitBruto, tetoDeficit);
  const alvo = Math.max(pisoKcal || 1500, Math.round((tdee - deficit) / 10) * 10);
  return {
    kcal: alvo,
    deficit: Math.round(tdee - alvo),
    limitado: deficitBruto > tetoDeficit || (tdee - deficitBruto) < (pisoKcal || 1500),
    ritmoReal: +(((tdee - alvo) * 7) / (KCAL_POR_KG * pesoKg) * 100).toFixed(2)
  };
}

const RITMOS = [
  { v: 0.005,  rot: '0,5% por semana — conservador' },
  { v: 0.0075, rot: '0,75% por semana — recomendado' },
  { v: 0.010,  rot: '1,0% por semana — agressivo' }
];
