/* ══════════════════════════════════════════════════════════
   JEJUM

   Calcula a janela de jejum a partir dos horários reais em
   que a pessoa registrou comida — não de uma configuração
   que ela preenche e esquece.

   Três números diferentes, e confundi-los é comum:

   • JEJUM NOTURNO — da última refeição de ontem à primeira
     de hoje. É o número que as pessoas chamam de "meu jejum".
   • JANELA DE ALIMENTAÇÃO — da primeira à última refeição do
     dia. O complemento do jejum dentro das 24 h.
   • JEJUM ATUAL — da última refeição registrada até agora.
     É o único que muda enquanto você olha a tela.

   Item antigo, registrado antes desta versão, não tem hora
   gravada. Nesse caso usamos o horário padrão da refeição e
   marcamos o resultado como estimado — melhor admitir a
   estimativa que apresentar chute como medição.
   ══════════════════════════════════════════════════════════ */

const HORA_PADRAO = { cafe:'07:15', almoco:'11:30', lanche:'15:30', jantar:'19:45', extra:'21:00' };

function minutosDe(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return (+m[1]) * 60 + (+m[2]);
}
const paraHora = min => String(Math.floor(((min%1440)+1440)%1440/60)).padStart(2,'0') + ':' +
                         String(Math.round(((min%1440)+1440)%1440)%60).padStart(2,'0');
const fmtDur = min => {
  if (min == null) return '—';
  const h = Math.floor(min/60), m = Math.round(min%60);
  return h + 'h' + (m ? String(m).padStart(2,'0') : '');
};

/* Horários de comida de um dia, em ordem.
   refs = [{id, hora}] para o fallback.  */
function horariosDoDia(diaObj, refsDef) {
  if (!diaObj || !diaObj.refs) return { pontos: [], estimado: false };
  const pontos = [];
  let estimado = false;

  (refsDef || []).forEach(r => {
    (diaObj.refs[r.id] || []).forEach(i => {
      let min = minutosDe(i.h);
      if (min == null) { min = minutosDe(HORA_PADRAO[r.id] || r.hora); estimado = true; }
      if (min != null) pontos.push({ min, ref: r.id, n: i.n });
    });
  });

  pontos.sort((a, b) => a.min - b.min);
  return { pontos, estimado };
}

/* Panorama de jejum de uma data.
   pegaDia(iso) -> objeto do diário daquele dia.  */
function jejumDoDia(iso, pegaDia, refsDef, agoraMin) {
  const hoje = horariosDoDia(pegaDia(iso), refsDef);
  const d = new Date(iso.slice(0,4), +iso.slice(5,7)-1, +iso.slice(8,10));
  d.setDate(d.getDate() - 1);
  const isoAnt = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const ant = horariosDoDia(pegaDia(isoAnt), refsDef);

  const primeira = hoje.pontos.length ? hoje.pontos[0] : null;
  const ultima   = hoje.pontos.length ? hoje.pontos[hoje.pontos.length-1] : null;
  const ultimaAnt = ant.pontos.length ? ant.pontos[ant.pontos.length-1] : null;

  // jejum noturno: 1440 menos o fim de ontem, mais o começo de hoje
  let noturno = null;
  if (primeira && ultimaAnt) noturno = (1440 - ultimaAnt.min) + primeira.min;

  // janela de alimentação do dia
  const janela = (primeira && ultima && hoje.pontos.length > 1) ? (ultima.min - primeira.min) : (primeira ? 0 : null);

  // jejum em curso, se a data é hoje
  let atual = null;
  if (agoraMin != null && ultima) atual = Math.max(0, agoraMin - ultima.min);

  return {
    iso, noturno, janela, atual,
    primeira: primeira ? paraHora(primeira.min) : null,
    ultima: ultima ? paraHora(ultima.min) : null,
    ultimaAnt: ultimaAnt ? paraHora(ultimaAnt.min) : null,
    refeicoes: hoje.pontos.length,
    estimado: hoje.estimado || ant.estimado
  };
}

/* Série dos últimos N dias, para média e gráfico. */
function serieJejum(isos, pegaDia, refsDef) {
  const out = [];
  isos.forEach(k => {
    const j = jejumDoDia(k, pegaDia, refsDef, null);
    if (j.noturno != null) out.push({ d: k, v: +(j.noturno/60).toFixed(1), janela: j.janela, est: j.estimado });
  });
  return out;
}

/* Leitura honesta do número. Jejum não é meta do app: é
   consequência do horário em que a pessoa come. Só vira
   assunto quando ela transforma em estratégia.            */
const PROTOCOLOS = [
  { max: 10,  rot: 'Janela larga',        txt: 'Você come ao longo de quase todo o dia. Não há problema nenhum nisso — o que decide o resultado é a caloria total, não o horário.' },
  { max: 14,  rot: 'Noite convencional',  txt: 'Jejum noturno comum, do jantar ao café. É o padrão da maioria das pessoas e não exige nada de você.' },
  { max: 16,  rot: 'Janela reduzida',     txt: 'Você está próximo do que chamam de 14:10 ou 16:8. Se surgiu naturalmente, ótimo. Se é intencional, o benefício vem da praticidade, não de mágica metabólica.' },
  { max: 20,  rot: 'Jejum prolongado',    txt: 'Janela estreita. Funciona para quem cumpre a proteína do dia nela — e é aí que a maioria falha. Confira se você está batendo o alvo em 2 ou 3 refeições.' },
  { max: 999, rot: 'Janela muito estreita', txt: 'Mais de 20 horas sem comer de forma habitual. Não vou recomendar isso: fica difícil atingir proteína, e o risco de compulsão na janela cresce. Se é intencional e frequente, converse com um nutricionista.' }
];

function lerJejum(horas) {
  if (horas == null) return null;
  return PROTOCOLOS.find(p => horas < p.max) || PROTOCOLOS[PROTOCOLOS.length-1];
}
