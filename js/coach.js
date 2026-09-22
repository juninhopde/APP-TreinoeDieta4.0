/* ══════════════════════════════════════════════════════════
   COACH ENGINE — missão do dia, cobrança e segurança

   Implementa as seções 20 a 28 do documento mestre:
   tarefas com status, níveis de intensidade, captura de
   justificativa, replanejamento e Safety Engine.

   Princípio que atravessa tudo: a cobrança é sobre
   COMPORTAMENTO e PROCESSO, nunca sobre o valor da pessoa.
   E a segurança vence a cobrança sempre — sem exceção,
   inclusive no nível mais duro.
   ══════════════════════════════════════════════════════════ */

const INTENSIDADES = [
  { id:'normal', rot:'Normal',   desc:'Avisa o que falta e sai do caminho.' },
  { id:'firme',  rot:'Firme',    desc:'Cobra o que ficou para trás e propõe a próxima ação.' },
  { id:'hard',   rot:'HARD',     desc:'Exige justificativa de tarefa perdida e replaneja em cima dela.' },
  { id:'hardmax',rot:'HARD MAX', desc:'Conversa mínima. Replaneja sozinho e entrega só a próxima ação.' }
];

/* A escala controla FREQUÊNCIA e OBJETIVIDADE da cobrança —
   nunca a dureza da linguagem. Subir de nível não autoriza
   humilhar, culpar nem empurrar para extremos. */
const NIVEL = { normal:0, firme:1, hard:2, hardmax:3 };

/* ── 1. MISSÃO DO DIA ─────────────────────────────────── */

const PRIORIDADE = { alta:0, media:1, baixa:2 };

/* Gera as tarefas do dia a partir do estado real.
   ctx = { hoje, cfg, dia, sessoesHoje, ehDiaDeTreino, REFS,
           pesagemDevida, rotinaProx, fase } */
function missaoDoDia(ctx) {
  const t = [], d = ctx.dia, c = ctx.cfg;
  const feito = id => (ctx.concluidas || []).includes(id);
  const justif = id => (ctx.justificativas || {})[id];

  const add = (id, titulo, detalhe, prio, hora, tipo) => {
    const done = feito(id);
    const passou = hora && horaPassou(hora, 60);
    t.push({
      id, titulo, detalhe, prio, hora, tipo,
      status: done ? 'concluida' : (justif(id) ? 'reagendada' : (passou ? 'perdida' : 'pendente')),
      motivo: justif(id) || null
    });
  };

  // refeições
  (ctx.REFS || []).slice(0, 4).forEach(r => {
    const tem = ((d.refs || {})[r.id] || []).length > 0;
    const passou = horaPassou(r.hora, 90);
    t.push({
      id: 'ref:' + r.id, titulo: r.nome, detalhe: tem ? 'registrada' : 'sem registro',
      prio: 'alta', hora: r.hora, tipo: 'nutricao',
      status: tem ? 'concluida' : (justif('ref:'+r.id) ? 'reagendada' : (passou ? 'perdida' : 'pendente')),
      motivo: justif('ref:'+r.id) || null
    });
  });

  // treino
  if (ctx.ehDiaDeTreino) {
    const fez = ctx.sessoesHoje > 0;
    const passou = horaPassou('21:00', 0);
    t.push({
      id: 'treino', titulo: 'Treino ' + (ctx.rotinaProx || ''),
      detalhe: fez ? 'concluído' : (ctx.fase ? ctx.fase.series + ' séries · ' + ctx.fase.repMin + '–' + ctx.fase.repMax + ' reps' : ''),
      prio: 'alta', hora: '18:30', tipo: 'treino',
      status: fez ? 'concluida' : (justif('treino') ? 'reagendada' : (passou ? 'perdida' : 'pendente')),
      motivo: justif('treino') || null
    });
  }

  // água
  const aguaOk = (d.agua || 0) * c.copoMl >= c.aguaMeta;
  t.push({
    id: 'agua', titulo: 'Água',
    detalhe: ((d.agua||0)*c.copoMl/1000).toFixed(1).replace('.',',') + ' L de ' + (c.aguaMeta/1000).toFixed(1).replace('.',',') + ' L',
    prio: 'media', hora: null, tipo: 'habito',
    status: aguaOk ? 'concluida' : 'pendente', motivo: null
  });

  // passos
  if (c.passosMeta) {
    const p = d.passos || 0;
    t.push({
      id: 'passos', titulo: 'Passos', detalhe: p ? p + ' de ' + c.passosMeta : 'não registrado',
      prio: 'media', hora: null, tipo: 'habito',
      status: p >= c.passosMeta ? 'concluida' : 'pendente', motivo: null
    });
  }

  // pesagem
  if (ctx.pesagemDevida) {
    add('pesagem', 'Pesagem', 'em jejum, com cintura e pescoço', 'alta', '08:00', 'progresso');
  }

  t.sort((a, b) => {
    const ordS = { perdida:0, pendente:1, reagendada:2, concluida:3 };
    return (ordS[a.status] - ordS[b.status]) || (PRIORIDADE[a.prio] - PRIORIDADE[b.prio]);
  });
  return t;
}

function horaPassou(hhmm, tolMin) {
  if (!hhmm) return false;
  const [h, m] = hhmm.split(':').map(Number);
  const agora = new Date();
  const alvo = new Date(agora); alvo.setHours(h, m + (tolMin || 0), 0, 0);
  return agora > alvo;
}

/* ── 2. ADERÊNCIA ──────────────────────────────────────
   Média móvel de 7 dias. Nada de sequência que zera: streak
   quebrada é o gatilho nº 1 de abandono, e o item 22 do
   documento já alerta contra transformar isso em competição. */

function aderencia(diasStatus) {
  if (!diasStatus.length) return { pct: 0, rot: 'sem dados', tend: 0 };
  const pct = Math.round(diasStatus.reduce((a, b) => a + b, 0) / diasStatus.length * 100);
  const metade = Math.floor(diasStatus.length / 2);
  const ant = diasStatus.slice(0, metade), rec = diasStatus.slice(metade);
  const tend = rec.length && ant.length
    ? Math.round((rec.reduce((a,b)=>a+b,0)/rec.length - ant.reduce((a,b)=>a+b,0)/ant.length) * 100) : 0;
  const rot = pct >= 85 ? 'Excelente' : pct >= 70 ? 'Consistente' : pct >= 45 ? 'Instável' : 'Precisa de ajuste';
  return { pct, rot, tend };
}

/* ── 3. COBRANÇA COM JUSTIFICATIVA ─────────────────────
   Perdeu tarefa → pergunta o que houve → classifica a causa
   → replaneja em cima dela. Disciplina realista, não punição. */

const CAUSAS = [
  { id:'tempo',       rot:'Faltou tempo' },
  { id:'esqueci',     rot:'Esqueci' },
  { id:'cansaco',     rot:'Cansaço' },
  { id:'imprevisto',  rot:'Imprevisto' },
  { id:'trabalho',    rot:'Trabalho' },
  { id:'dor',         rot:'Dor ou desconforto' },
  { id:'desanimo',    rot:'Sem motivação' },
  { id:'outro',       rot:'Outro' }
];

/* Resposta operacional para cada causa. Nunca julgamento. */
function replanejar(tarefa, causa, ctx) {
  const treino = tarefa.tipo === 'treino';
  const mapa = {
    tempo: treino
      ? { acao:'encurtar', txt:'Versão curta: só os 3 primeiros exercícios, 2 séries cada. Dá 18 minutos e preserva o estímulo principal.' }
      : { acao:'simplificar', txt:'Refeição de emergência: uma fonte de proteína pronta e uma fruta. Registra em 20 segundos.' },
    esqueci: { acao:'lembrete', txt:'Vou deixar essa tarefa no topo da missão amanhã. Se você usa os alarmes do celular, esse é o horário para ajustar.' },
    cansaco: treino
      ? { acao:'reduzir', txt:'Reduza a carga em 20% e mantenha as séries. Treino leve feito vale mais que treino pesado adiado — e em déficit a recuperação é o gargalo.' }
      : { acao:'simplificar', txt:'Come algo simples e registra. Cansaço não é motivo para pular refeição em déficit — é justamente quando a proteína importa mais.' },
    imprevisto: { acao:'reagendar', txt:'Acontece. Reagendado para amanhã, sem dívida acumulada.' },
    trabalho: treino
      ? { acao:'encurtar', txt:'Versão de 20 minutos, ou remarca para o próximo dia livre. Duas sessões por semana ainda sustentam massa magra.' }
      : { acao:'simplificar', txt:'Deixa uma opção pronta na mochila. O problema aqui é logística, não disciplina.' },
    dor: { acao:'seguranca', txt:'Dor muda a conversa. Não force: se persistir mais de alguns dias, piorar ou limitar movimento, procure avaliação profissional antes de voltar.' },
    desanimo: { acao:'minimo', txt:'Meta mínima hoje: 10 minutos de caminhada e uma refeição registrada. Começar pequeno é o que quebra a inércia — voltar com tudo é o que faz abandonar de novo.' },
    outro: { acao:'reagendar', txt:'Registrado. Reagendado para amanhã.' }
  };
  return mapa[causa] || mapa.outro;
}

/* Mensagem de cobrança, calibrada pelo nível de intensidade. */
function cobrar(tarefas, intensidade, nome, seguranca) {
  const n = NIVEL[intensidade] != null ? NIVEL[intensidade] : 1;
  const voc = nome || 'chefe';
  const perdidas = tarefas.filter(t => t.status === 'perdida');
  const pend = tarefas.filter(t => t.status === 'pendente');

  // segurança desliga a cobrança, em qualquer nível
  if (seguranca && seguranca.bloqueia) {
    return { txt: seguranca.mensagem, pedirJustificativa: null, bloqueado: true };
  }

  if (!perdidas.length) {
    if (!pend.length) return { txt: `${voc}, missão do dia fechada. Nada pendente.`, pedirJustificativa: null };
    const p = pend[0];
    if (n >= 3) return { txt: `Próxima: **${p.titulo}**. ${p.detalhe || ''}`, pedirJustificativa: null };
    return { txt: `${voc}, ${pend.length} ${pend.length===1?'tarefa pendente':'tarefas pendentes'}. A próxima é **${p.titulo}**${p.hora ? ' (' + p.hora + ')' : ''}.`, pedirJustificativa: null };
  }

  const alvo = perdidas[0];
  if (n === 0)
    return { txt: `${voc}, **${alvo.titulo}** passou do horário. Ainda dá para recuperar hoje.`, pedirJustificativa: null };
  if (n === 1)
    return { txt: `${voc}, **${alvo.titulo}** não foi cumprida${perdidas.length>1 ? ` — e mais ${perdidas.length-1}` : ''}. O que dá para fazer agora?`, pedirJustificativa: null };
  if (n === 2)
    return { txt: `${voc}, **${alvo.titulo}** não foi concluída. Sem rodeio: o que aconteceu? Eu ajusto o plano em cima da resposta.`, pedirJustificativa: alvo.id };
  return { txt: `**${alvo.titulo}** — não concluída. Motivo?`, pedirJustificativa: alvo.id };
}

/* ── 4. SAFETY ENGINE (seções 26 a 28) ─────────────────
   Erra sempre para o lado de mandar procurar ajuda. Detecção
   por palavra-chave é frágil, mas falso positivo aqui custa
   uma mensagem — falso negativo custa muito mais.          */

const SINAIS = [
  { g:'emergencia', kw:['dor no peito','dor toracica','dor torácica','aperto no peito','falta de ar',
      'nao consigo respirar','não consigo respirar','desmaiei','desmaio','apaguei','perdi a consciencia',
      'formigamento no braco','boca torta','nao sinto o braco','visao turva de repente','confusao mental',
      'sangramento','vomitando sangue','batimento acelerado em repouso','taquicardia forte'],
    msg:'Pare o que está fazendo. Esses sinais podem indicar algo que precisa de avaliação **agora**, não de um app.\n\n**Procure atendimento médico imediatamente.** Em emergência no Brasil: **SAMU 192** ou **Bombeiros 193**.\n\nNão vou te passar treino nem dieta enquanto isso não for avaliado.' },

  { g:'lesao', kw:['torci','luxei','estalou','nao consigo levantar o braco','não consigo andar','inchou muito',
      'dor forte no joelho','dor forte na coluna','dor que nao passa','dor que não passa','travou as costas',
      'senti um estalo','dor aguda'],
    msg:'Dor aguda ou estalo não se resolve treinando por cima. **Não force o movimento.**\n\nProcure avaliação de médico ou fisioterapeuta antes de voltar à carga. Enquanto isso, suspendi a cobrança do treino — não vou te empurrar para uma lesão maior.' },

  { g:'alimentar', kw:['vomitar','provoquei vomito','provoquei vômito','laxante','nao como ha dias',
      'não como há dias','fiquei 3 dias sem comer','me odeio quando como','nojo do meu corpo',
      'compulsao','compulsão','descontei na comida e vomitei','purguei','jejum de 5 dias'],
    msg:'O que você descreveu merece cuidado de um profissional, e não de um app de dieta.\n\nProcure um médico, nutricionista ou psicólogo com experiência nessa área. Se quiser conversar com alguém agora, o **CVV atende no 188**, 24 horas, de graça.\n\nVou desligar a cobrança aqui. Nesse momento ela atrapalha em vez de ajudar.' },

  { g:'extremo', kw:['quero perder 10 kg em um mes','perder 10kg em 1 mes','so agua por uma semana',
      'só água por uma semana','parar de comer','comer 500 calorias','800 calorias por dia',
      'jejum de 7 dias','nao vou comer nada hoje','dieta do liquido'],
    msg:'Isso não é agressivo, é insustentável — e o custo vem em massa magra, queda de desempenho e recuperação do peso depois.\n\nA faixa que preserva músculo é de 0,5% a 1% do peso corporal por semana. Não vou montar nada abaixo do piso de segurança do app.\n\nSe a pressa tem um motivo específico (data, evento, exame), me diga qual que eu ajudo dentro do que é seguro.' },

  { g:'medicacao', kw:['posso parar o remedio','parar de tomar','dobrar a dose','aumentar a dose',
      'trocar meu remedio','qual remedio devo tomar','me receita','posso tomar ozempic','mounjaro',
      'anabolizante','ciclo de','testosterona','hormonio'],
    msg:'Não posso orientar início, troca, dose ou suspensão de medicação — nem por chat, nem com os melhores dados do mundo.\n\nEssa conversa é com **médico ou farmacêutico**. Leve o CSV que o app exporta em Ajustes: seu histórico organizado torna a consulta muito mais produtiva.\n\nO que eu posso fazer é registrar o que o profissional te orientar.' },

  { g:'gestacao', kw:['estou gravida','estou grávida','gestante','amamentando','pos parto','pós-parto',
      'descobri que estou gravida'],
    msg:'Gestação e amamentação mudam completamente as necessidades de energia e nutrientes, e déficit calórico nesse período exige acompanhamento.\n\n**Fale com seu obstetra ou nutricionista antes de seguir com qualquer plano do app.** Suspendi as metas de déficit até lá.' },

  { g:'menor', kw:['tenho 15 anos','tenho 16 anos','tenho 14 anos','tenho 13 anos','tenho 17 anos',
      'sou menor de idade','tenho 12 anos'],
    msg:'Este app foi desenhado para adultos, e o cálculo de metas que ele faz não serve para quem ainda está em crescimento.\n\nProcure um pediatra ou nutricionista. Eles vão considerar coisas que nenhum app genérico considera.' }
];

function checarSeguranca(texto) {
  const q = norm(texto || '');
  if (!q) return null;
  for (const s of SINAIS) {
    for (const k of s.kw) {
      const kn = norm(k);
      if (new RegExp('(^|\\s)' + kn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(\\s|$)').test(q)) {
        return { grupo: s.g, bloqueia: true, mensagem: s.msg, termo: k };
      }
    }
  }
  return null;
}

/* Situações que travam o modo HARD enquanto durarem. */
const GRUPOS_TRAVAM_HARD = ['emergencia','lesao','alimentar','gestacao','menor'];

function travaCobranca(historicoSeguranca) {
  if (!historicoSeguranca || !historicoSeguranca.length) return null;
  const rec = historicoSeguranca[historicoSeguranca.length - 1];
  if (!GRUPOS_TRAVAM_HARD.includes(rec.grupo)) return null;
  const dias = Math.round((Date.now() - new Date(rec.d).getTime()) / 86400000);
  if (dias > 14) return null;
  return rec;
}
