/* ══════════════════════════════════════════════════════════
   ASSISTENTE EMBUTIDO

   Conversa em texto livre sem modelo de linguagem: interpreta
   a intenção por palavras-chave e compõe a resposta a partir
   dos achados reais do diagnóstico.

   Por que não um LLM pequeno embutido: um modelo utilizável
   pesa centenas de MB, o GitHub bloqueia arquivo acima de
   100 MB e o Pages tem teto de 1 GB e 100 GB de banda por mês.
   E mesmo que coubesse, um modelo de 269M não sabe quanto você
   comeu ontem — este assistente sabe.

   Vem pronto no download, responde instantaneamente, funciona
   offline e nunca inventa número.
   ══════════════════════════════════════════════════════════ */

const norm = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();

/* Cada intenção tem palavras-chave e um compositor de resposta.
   `A` = lista de achados, `C` = contexto vivo do app.        */
const INTENCOES = [

  { id:'reg-peso', peso: 9,
    kw:['pesei','peso hoje','registra meu peso','meu peso e','estou com kg','to com kg',
        'registra kg','anota meu peso','peso de hoje','registra peso','meu peso','peso atual'],
    fn: (A, C, q) => {
      const m = q.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
      if (!m) return { tipo:'perguntar', txt:'Qual é o seu peso de hoje em kg?' };
      return { tipo:'registrar-peso', kg: parseFloat(m[1].replace(',','.')) };
    } },


  { id:'fase-plano', peso: 7,
    kw:['minha fase','fase do plano','estou em manutencao','estou mantendo','minha faixa',
        'faixa de manutencao','em que fase estou','estou perdendo ou mantendo'],
    fn: () => ({ tipo:'fase' }) },

  { id:'mudar-fase', peso: 9,
    kw:['entrar em manutencao','quero manter','parar de emagrecer','mudar para manutencao',
        'voltar para perda','voltar a emagrecer','entrar em recuperacao','modo manutencao'],
    fn: (A,C,q) => {
      const n = norm(q||'');
      const fase = /recupera/.test(n) ? 'recuperacao'
        : /manutenc|manter|parar de emagrecer/.test(n) ? 'manutencao' : 'perda';
      return { tipo:'mudar-fase', fase };
    } },

  { id:'jejum-meu', peso: 7,
    kw:['quanto tempo de jejum','meu jejum','estou em jejum','quantas horas sem comer',
        'minha janela','janela de alimentacao','jejuei quanto','ha quanto tempo nao como'],
    fn: () => ({ tipo:'jejum' }) },

  { id:'cardapio', peso: 8,
    kw:['monta minha dieta','montar dieta','meu cardapio','cardapio de hoje','cardápio','monta o cardapio',
        'o que eu como hoje','sugere refeicao','plano alimentar','monta minha alimentacao','dieta de hoje',
        'opcao mais barata','opção mais barata','mais barato','dieta barata','dieta da roca','dieta da roça',
        'comida simples','comida de verdade','modo economico','modo econômico','cardapio barato'],
    fn: (A,C,q) => {
      const n = norm(q||'');
      const modo = /barat|economic|econômic/.test(n) ? 'economico'
                 : /roca|roça|simples|comida de verdade/.test(n) ? 'roca' : null;
      return { tipo:'cardapio', modo };
    } },

  { id:'compras', peso: 8,
    kw:['lista de compras','lista do mercado','o que comprar','compras da semana','mercado'],
    fn: () => ({ tipo:'compras' }) },

  { id:'tarefas', peso: 7,
    kw:['minhas tarefas','tarefas de hoje','o que falta hoje','missao do dia','missão do dia',
        'tres tarefas','três tarefas','o que tenho que fazer','pendencias','pendências'],
    fn: () => ({ tipo:'tarefas' }) },

  { id:'cobre', peso: 7,
    kw:['me cobra','me cobre','cobra de mim','to procrastinando','estou procrastinando','me pressiona',
        'nao fiz nada hoje','não fiz nada hoje','me da um puxao'],
    fn: () => ({ tipo:'cobre' }) },

  { id:'modo', peso: 9,
    kw:['modo hard','ativa hard','ativar hard','modo firme','modo normal','hard max','modo hard max',
        'zero desculpas','pega leve comigo','modo suave'],
    fn: (A,C,q) => {
      const n = norm(q||'');
      const nivel = /hard max|hardmax|zero desculpa/.test(n) ? 'hardmax'
        : /hard/.test(n) ? 'hard'
        : /firme/.test(n) ? 'firme' : 'normal';
      return { tipo:'modo', nivel };
    } },

  { id:'registrar', peso: 9,
    kw:['comi','comer','almocei','jantei','lanchei','tomei','bebi','registra','registrar','registre',
        'anota','anotar','anote','adiciona','adicionar','adicione','lanca','lance','coloca','marca',
        'acabei de comer','to comendo','estou comendo'],
    fn: (A,C,q) => ({ tipo:'registrar', frase:q }) },

  { id:'meu-nome', peso: 8,
    kw:['meu nome e','meu nome é','me chamo','pode me chamar','sou o','sou a','nome:'],
    fn: (A,C,q) => ({ tipo:'nome', frase:q }) },

  { id:'lembrar', peso: 8,
    kw:['lembra que','lembre que','anota que','guarda que','nao esqueca','não esqueça','memoriza',
        'quero que voce lembre','grava que'],
    fn: (A,C,q) => ({ tipo:'lembrar', frase:q }) },

  { id:'o-que-lembra', peso: 7,
    kw:['o que voce lembra','o que voce sabe de mim','minhas memorias','o que voce guardou',
        'voce lembra de mim','o que sabe sobre mim'],
    fn: (A,C) => ({ tipo:'memorias' }) },

  { id:'motivacao', peso: 5,
    kw:['me motiva','desanimado','desanimei','sem vontade','quero desistir','vou desistir','cansei',
        'nao aguento','não aguento','to sem forca','me da um gas','me cobra','puxa minha orelha',
        'me chama atencao','preciso de motivacao'],
    fn: (A,C,q) => ({ tipo:'cobranca', desanimo: /desanim|desist|cansei|aguento|sem vontade|sem forca|sem força/.test(norm(q||'')) }) },

  { id:'clinico', peso: 10,
    kw:['remedio','medicamento','medicacao','ozempic','mounjaro','saxenda','tirzepatida','semaglutida',
        'anabolizante','hormonio','testosterona','tireoide','diabetes','pressao alta','hipertensao',
        'depressao','ansiedade','transtorno','compulsao','anorexia','bulimia','vomitar','laxante',
        'jejum prolongado','jejum de 3','nao comer nada','parar de comer','diagnostico','doenca','exame de sangue'],
    fn: () => 'Isso sai do que eu consigo responder com seus dados, e é justamente o tipo de coisa em que um palpite de app faz mal.\n\nFale com médico ou nutricionista. Leve o CSV que o app exporta em Ajustes — seu histórico de peso, composição corporal, consumo e treino organizado vale muito numa consulta, e economiza o tempo que o profissional gastaria coletando isso.' },

  { id:'travou', peso: 5,
    kw:['nao estou emagrecendo','nao emagreco','travou','travei','empacou','empaquei','estagnou','platô','plato',
        'nao perco peso','nao desce','balanca parada','peso parado','por que nao','porque nao'],
    fn: (A,C) => {
      const r = A.find(a=>a.id==='ritmo');
      const cab = !r ? 'Ainda não tenho pesagens suficientes para dizer se você travou de verdade.'
        : r.n < -0.5 ? `Você **não** travou: está perdendo ${Math.abs(r.n).toFixed(2).replace('.',',')}% do peso por semana, dentro da faixa boa. O que pode estar confundindo é a balança do dia — olhe a tendência na aba Progresso.`
        : 'Na ordem de probabilidade, a causa é uma destas:';
      return cab + '\n\n' + listar(A, ['deficit-real','aderencia-kcal','cobertura','fim-de-semana','alcool','passos']);
    } },

  { id:'cortar', peso: 5,
    kw:['cortar caloria','cortar kcal','diminuir caloria','abaixar meta','reduzir caloria','comer menos',
        'devo cortar','baixar a meta','meta menor'],
    fn: (A,C) => {
      const cob = A.find(a=>a.id==='cobertura'), ad = A.find(a=>a.id==='aderencia-kcal');
      if (cob && cob.n != null && cob.n < 70)
        return `**Não.** Você registrou só ${cob.n}% dos últimos 28 dias. Cortar um número que você ainda não conhece é chutar para baixo.\n\nDuas semanas de registro completo primeiro. Depois a gente olha de novo — e muitas vezes o peso volta a cair sem mexer em nada.`;
      if (ad && ad.n != null && ad.n > C.cfg.kcal)
        return `**Provavelmente não.** Sua média é ${ad.n} kcal contra meta de ${C.cfg.kcal}. A meta atual ainda não está sendo cumprida, então cortar só aumenta a distância entre o plano e a prática.\n\nFeche a execução da meta de hoje por duas semanas.`;
      return 'Depende do ritmo medido:\n\n' + listar(A, ['ritmo','gasto','deficit-real']);
    } },

  { id:'musculo', peso: 5,
    kw:['perdendo musculo','perder musculo','massa magra','catabolismo','catabolico','flacidez','murchando',
        'estou perdendo musculo','musculo junto'],
    fn: A => 'Quatro sinais respondem isso melhor que a balança:\n\n' +
      listar(A, ['massa-magra','proteina','frequencia','progressao','series-grupo']) },

  { id:'carga', peso: 4,
    kw:['carga nao sobe','nao consigo aumentar','forca parada','nao evoluo no treino','peso do treino',
        'progressao','nao progrido','estagnado no treino','mesma carga'],
    fn: A => 'Carga parada em déficit tem cinco causas comuns, nesta ordem:\n\n' +
      listar(A, ['progressao','rir','frequencia','proteina','mesociclo','volume']) },

  { id:'proteina', peso: 4,
    kw:['proteina','whey','quanta proteina','bate proteina','proteina suficiente'],
    fn: (A,C) => {
      const p = A.find(a=>a.id==='proteina');
      const falta = Math.max(0, C.cfg.prot - C.hojeMacros.p);
      const base = p ? p.achado + '\n\n' + p.acao : 'Ainda não tenho dias registrados o bastante para avaliar sua média de proteína.';
      return base + (falta > 0
        ? `\n\n**Hoje** faltam ${Math.round(falta)} g. São cerca de ${Math.ceil(falta/30)} porções de 150 g de frango, ou ${Math.ceil(falta/22)} scoops de whey.`
        : '\n\n**Hoje** você já bateu o alvo.');
    } },

  { id:'comer-hoje', peso: 6,
    kw:['posso comer','o que como','sobrou quanto','quanto falta hoje','quanto posso','ainda posso',
        'resta quanto','o que cabe','ainda cabe','cabe hoje','sobra hoje','sobrou hoje',
        'tenho quantas calorias','quantas calorias','caloria restante','restam','sobrando'],
    fn: (A,C) => {
      const m = C.hojeMacros, c = C.cfg;
      const rk = c.kcal - m.kcal, rp = c.prot - m.p, rc = c.carb - m.c, rg = c.gord - m.g;
      if (rk <= 0) return `Você já passou da meta de hoje em ${Math.abs(rk)} kcal.\n\nUm dia acima não desfaz a semana — o que desfaz é compensar cortando demais amanhã. Volte à meta normal e siga.`;
      let t = `Sobram **${rk} kcal** hoje: ${Math.max(0,Math.round(rp))} g de proteína, ${Math.max(0,Math.round(rc))} g de carboidrato e ${Math.max(0,Math.round(rg))} g de gordura.\n\n`;
      if (rp > rk/4*0.6) t += 'A proteína é o que está mais atrasado. Priorize uma fonte magra: peito de frango, tilápia, ovos, iogurte proteico ou whey resolvem quase tudo que falta sem estourar a caloria.';
      else t += 'Os macros estão equilibrados no que falta. Qualquer refeição da sua rotina cabe.';
      return t;
    } },

  { id:'registro', peso: 4,
    kw:['registro','anotar','esqueci de anotar','vale a pena registrar','preciso registrar','tenho que anotar',
        'meus dados estao bons','confiavel'],
    fn: A => 'A qualidade de tudo que o app calcula depende disto:\n\n' +
      listar(A, ['cobertura','consistencia','refeicao-falha','pesagem','rir','gasto']) },

  { id:'fim-semana', peso: 4,
    kw:['fim de semana','final de semana','sabado','domingo','churrasco','saida','festa','aniversario',
        'restaurante','comer fora'],
    fn: A => {
      const f = A.find(a=>a.id==='fim-de-semana');
      if (!f) return 'Ainda não tenho fins de semana registrados o bastante para comparar com seus dias úteis. Registre dois sábados e dois domingos e eu te mostro a conta.';
      return f.achado + '\n\n' + f.acao;
    } },

  { id:'balanca', peso: 4,
    kw:['balanca subiu','engordei','peso subiu','ganhei peso','peso oscila','pesar todo dia','quando pesar',
        'retencao','inchado','agua no corpo'],
    fn: (A,C) => {
      const t = A.find(a=>a.id==='sodio');
      return 'Peso de um dia carrega água, sal e volume intestinal — pode variar 2 kg sem nada de gordura ter mudado. Por isso o número grande na aba Progresso é a **tendência**, não a balança do dia.\n\n'
        + (t ? t.achado + ' ' + t.acao : 'Pese-se sempre no mesmo horário, em jejum, e olhe a linha, não o ponto.');
    } },

  { id:'gordura', peso: 4,
    kw:['percentual de gordura','bf','body fat','quanto de gordura','composicao corporal','massa de gordura'],
    fn: (A,C) => {
      const c = C.composicao;
      if (!c || !c.bf) return 'Ainda não dá para calcular. Preciso de peso, **cintura** e **pescoço** na mesma pesagem — é fita métrica e trinta segundos, na aba Progresso.';
      return `Você está em **${c.bf.toString().replace('.',',')}% de gordura** (faixa: ${c.rot}). São ${c.gordura.toFixed(1).replace('.',',')} kg de gordura e ${c.magra.toFixed(1).replace('.',',')} kg de massa magra.\n\nMétodo Navy, erro típico de 3 a 4 pontos contra exame. Serve para acompanhar a tendência, não para cravar o número.`;
    } },

  { id:'treino-hoje', peso: 5,
    kw:['treino de hoje','o que treino','qual treino','treinar hoje','qual rotina','que exercicio'],
    fn: (A,C) => {
      const f = C.fase;
      return `Hoje é **${C.proxRotina}**, semana ${C.semana} de 12 na fase **${f.nome}**: ${f.series} séries de ${f.repMin} a ${f.repMax} repetições, RIR alvo ${f.rirAlvo}, descanso de ${f.descanso}s.\n\n${f.nota}\n\nAs cargas sugeridas para cada exercício estão na aba Treino.`;
    } },

  { id:'deload', peso: 3,
    kw:['descanso','deload','cansado','fadiga','sem energia','dor muscular','recuperacao','preciso parar'],
    fn: (A,C) => {
      const f = C.fase;
      const base = f.id === 'deload'
        ? 'Você **já está** na semana de deload: carga em 60%, RIR alto. É pra ser leve mesmo.'
        : `Você está na fase ${f.nome}, semana ${C.semana} de 12. O deload programado é na semana 12.`;
      return base + '\n\n' + listar(A, ['volume','rir','progressao','frequencia']);
    } },

  { id:'agua-fibra', peso: 3,
    kw:['agua','hidratacao','beber agua','fibra','intestino','saciedade','fome','com fome','sinto fome'],
    fn: (A,C,q) => {
      const sobreAgua = /agua|hidrat|beber/.test(norm(q||''));
      const cab = sobreAgua
        ? 'Hidratação atrapalha desempenho no treino e bagunça a leitura da balança quando falta:'
        : 'Fome em déficit quase sempre é fibra ou proteína baixa, não força de vontade:';
      return cab + '\n\n' + listar(A, sobreAgua ? ['agua','fibra','sodio'] : ['fibra','proteina','agua','consistencia']);
    } },

  { id:'passos', peso: 3,
    kw:['passos','caminhada','cardio','esteira','andar','gasto calorico','queimar caloria'],
    fn: A => 'Atividade fora do treino é a alavanca mais barata de aumentar déficit sem tirar comida do prato:\n\n' +
      listar(A, ['passos','frequencia']) },

  { id:'meta-quando', peso: 3,
    kw:['quando vou chegar','quanto tempo','previsao','previsão','quando bato a meta','falta quanto',
        'em quanto tempo','quando chego','chegar na meta','chego na meta','quanto falta para','atingir a meta',
        'quando termino','prazo','demora quanto'],
    fn: (A,C) => {
      const r = C.ritmo;
      const falta = C.pesoAtual - C.cfg.pesoMeta;
      if (!r || r.kgSem >= -0.05) return `Faltam ${falta.toFixed(1).replace('.',',')} kg para sua meta. Ainda não dá para projetar prazo: preciso de pesagens que mostrem uma tendência de queda.`;
      const sem = Math.round(falta / Math.abs(r.kgSem));
      return `Faltam ${falta.toFixed(1).replace('.',',')} kg. No ritmo atual de ${Math.abs(r.kgSem).toFixed(2).replace('.',',')} kg por semana, são cerca de **${sem} semanas** (${Math.round(sem/4.3)} meses).\n\nProjeção linear é otimista: o ritmo tende a desacelerar conforme o peso cai, porque o gasto cai junto. O app recalcula sozinho a cada pesagem.`;
    } },

  { id:'musculo-faltando', peso: 3,
    kw:['grupo muscular','musculo sem treino','serie por musculo','volume por musculo','estou treinando tudo',
        'falta treinar','biceps','triceps','ombro','panturrilha'],
    fn: (A,C) => {
      const o = C.orfaos;
      const s = A.find(a=>a.id==='series-grupo');
      return (o && o.length
        ? `Sua rotina não dá estímulo direto para: **${o.join(', ')}**.\n\nEm déficit, músculo sem estímulo é o primeiro a ser consumido. Uma ou duas séries por semana já mudam isso — não precisa de treino separado, dá pra encaixar no fim do A ou do B.`
        : 'Todos os grupos principais estão recebendo estímulo.')
        + (s ? '\n\n' + s.achado : '');
    } },

  { id:'pior', peso: 4,
    kw:['o que fazer','o que faco','que faco','por onde comeco','por onde','prioridade','primeiro',
        'mais importante','o que atrapalha','me ajuda','estou perdido','o que devo fazer',
        'primeiro passo','comecar','resumo','me da um norte'],
    fn: A => {
      const top = A.filter(a=>a.sev==='critico' || a.sev==='atencao').slice(0,3);
      if (!top.length) return 'Nada crítico no seu diagnóstico agora. Siga o que está fazendo — consistência é o que falta para a maioria, e você está com ela.';
      return 'Os três pontos mais críticos agora, em ordem:\n\n' + top.map((a,i) =>
        `**${i+1}. ${a.titulo}** — ${a.achado}\n${a.acao}`).join('\n\n');
    } },

  { id:'saudacao', peso: 2,
    kw:['oi','ola','bom dia','boa tarde','boa noite','e ai','opa','tudo bem'],
    fn: (A,C) => {
      const top = A.find(a=>a.sev==='critico');
      return `Olá. Hoje você consumiu ${C.hojeMacros.kcal} de ${C.cfg.kcal} kcal.\n\n`
        + (top ? `O ponto que mais pede atenção agora: **${top.titulo}** — ${top.achado}` : 'Seu diagnóstico não tem nenhum ponto crítico no momento.')
        + '\n\nPergunte o que quiser sobre seus números.';
    } },

  { id:'ajuda', peso: 2,
    kw:['ajuda','o que voce faz','como funciona','o que posso perguntar','comandos','voce e uma ia'],
    fn: () => 'Eu leio os seus dados registrados e respondo com os seus números — nada de conselho genérico, e nada sai do aparelho.\n\nPode perguntar coisas como:\n\n• por que não estou emagrecendo\n• quanto ainda posso comer hoje\n• devo cortar calorias\n• estou perdendo músculo\n• por que a carga não sobe\n• qual o treino de hoje\n• quando chego na meta\n• o que fazer primeiro' }
];

function listar(A, ids) {
  const sel = ids.map(id => A.find(a=>a.id===id)).filter(Boolean)
    .filter(a => a.sev !== 'ok').slice(0,4);
  if (!sel.length) return 'Nenhum problema nesses pontos — todos estão dentro da faixa.';
  return sel.map(a => `**${a.titulo}** — ${a.achado}\n${a.acao}`).join('\n\n');
}


/* ══════════════════════════════════════════════════════════
   MEMÓRIA OFFLINE DO ASSISTENTE

   Guarda o que a pessoa conta sobre ela: nome, motivo de estar
   fazendo isso, compromissos assumidos. Fica no mesmo
   armazenamento local do resto — não sai do aparelho.
   ══════════════════════════════════════════════════════════ */

function memoriaVazia() { return { nome:'', motivo:'', fatos:[], compromissos:[], ultimoOi:'' }; }

function lembrar(M, texto) {
  const t = texto.trim();
  if (!t) return;
  if (!M.fatos.some(f => norm(f.t) === norm(t))) {
    M.fatos.unshift({ t, d: new Date().toISOString().slice(0,10) });
    M.fatos = M.fatos.slice(0, 30);
  }
}

/* ══ TOM DE COBRANÇA ══════════════════════════════════
   Firme com o comportamento, nunca com a pessoa. Cobra
   registro, treino perdido e promessa não cumprida. Não
   cobra peso, não julga o que foi comido e não usa culpa
   com o corpo — isso não motiva ninguém, só afasta.       */

/* Quando a pessoa diz que está desanimada, o primeiro movimento é
   reconhecer, não cobrar. Cobrança sem acolhimento afasta, e quem
   abandona não volta. Depois disso, sim: firmeza. */
function acolher(A, M) {
  const nome = M.nome || 'chefe';
  const ps = (typeof ordPesosSeguro === 'function') ? [] : [];
  const bons = A.filter(a => a.sev === 'ok');
  let t = `${nome}, desanimar num processo desses é normal — e não apaga o que você já fez.`;
  if (bons.length) {
    t += `\n\nO que **está** funcionando agora: ` + bons.slice(0,3).map(a => a.titulo.toLowerCase()).join(', ') + '.';
  }
  t += '\n\nNão tente voltar com tudo. Escolhe **uma** coisa para os próximos sete dias e ignora o resto:';
  return t;
}

function puxaoDeOrelha(A, C, M) {
  const nome = M.nome ? M.nome : '';
  const voc = nome ? nome : 'chefe';
  const crit = A.filter(a => a.sev === 'critico');
  const cob = A.find(a => a.id === 'cobertura');
  const freq = A.find(a => a.id === 'frequencia');
  const pes = A.find(a => a.id === 'pesagem');

  if (cob && cob.n != null && cob.n < 50)
    return `Olha, ${voc}: ${cob.n}% dos últimos 28 dias registrados. Isso não é dieta, é intenção. ` +
      `Eu não consigo te ajudar com dado que não existe — e você também não. Registra hoje inteiro, até o que você não quer anotar. Principalmente o que você não quer anotar.`;

  if (freq && freq.sev === 'critico')
    return `${voc}, ${freq.achado.toLowerCase()} Treino não é sobre queimar caloria — é o que decide se o peso que sai é gordura ou músculo. ` +
      `Faltar treino em déficit é escolher perder músculo. Bota na agenda os três dias e trata como reunião que não se remarca.`;

  if (pes && pes.n != null && pes.n > 14)
    return `${voc}, ${pes.n} dias sem subir na balança. Sem pesagem o app para de medir seu gasto e volta a chutar por fórmula. ` +
      `Amanhã de manhã, em jejum, trinta segundos. Não tem desculpa que sobreviva a trinta segundos.`;

  if (crit.length >= 3)
    return `${voc}, tem ${crit.length} pontos críticos no seu diagnóstico ao mesmo tempo. Não tenta resolver os três — escolhe o primeiro e fecha ele por duas semanas. ` +
      `Quem tenta consertar tudo de uma vez não conserta nada.`;

  if (crit.length)
    return `${voc}, um ponto crítico: **${crit[0].titulo}**. ${crit[0].achado} Resolve esse antes de olhar qualquer outra coisa.`;

  const seq = A.find(a => a.id === 'aderencia-kcal');
  if (seq && seq.sev === 'ok')
    return `${voc}, sem sermão hoje: sua execução está batendo com o plano. Isso é o que 90% das pessoas não conseguem. Mantém.`;

  return `${voc}, nada crítico agora. Consistência é chata e é o que funciona — segue firme.`;
}

/* Casa a pergunta com a intenção de maior pontuação. */
/* Procura o termo como palavra inteira, não como pedaço de outra. */
function contemTermo(frase, termo) {
  return new RegExp('(^|\\s)' + termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)').test(frase);
}

const VAZIAS = new Set(['o','a','os','as','de','do','da','em','no','na','um','uma','e','que','para','pra',
  'com','por','se','eu','meu','minha','esta','estou','ta','to','vou','muito','mais','ja','sobre','qual','como']);

function interpretar(texto) {
  const q = norm(texto);
  if (!q) return null;
  const toks = q.split(' ').filter(t => t.length > 2 && !VAZIAS.has(t));
  let melhor = null, ponto = 0;

  INTENCOES.forEach(it => {
    let exato = 0, parcial = 0;
    it.kw.forEach(k => {
      const kn = norm(k);
      // Casamento por LIMITE DE PALAVRA, não por substring: sem isso
      // "o QUE AInda cabe" casava com a saudação "e ai".
      if (contemTermo(q, kn)) { exato += it.peso * (kn.includes(' ') ? 3 : 2); return; }
      // Rede de segurança para quem escreve diferente do cadastrado.
      // Só o MELHOR parcial conta: somar parciais de várias chaves inflava
      // a pontuação e fazia "quantos passos" cair em "quanto posso".
      const kt = kn.split(' ').filter(t => t.length > 2 && !VAZIAS.has(t));
      if (kt.length < 2) return;
      const casadas = kt.filter(t => toks.some(u => u === t || (u.length > 4 && t.startsWith(u.slice(0,5)))));
      if (casadas.length === kt.length) parcial = Math.max(parcial, it.peso * 1.5);
    });
    const p = exato + parcial;
    if (p > ponto) { ponto = p; melhor = it; }
  });

  // abaixo deste piso a interpretação é chute, e chute aqui vira resposta errada
  return ponto >= it_piso() ? { intencao: melhor, ponto } : null;
}
function it_piso() { return 1.5; }

function responderLivre(texto, A, C) {
  const m = interpretar(texto);
  if (!m) {
    const top = A.filter(a=>a.sev==='critico'||a.sev==='atencao').slice(0,2);
    return 'Não entendi bem a pergunta. Eu respondo sobre os seus dados registrados — consumo, peso, composição, treino e registro.\n\n'
      + (top.length ? 'Enquanto isso, o que está pedindo atenção agora:\n\n'
          + top.map(a=>`**${a.titulo}** — ${a.achado}`).join('\n\n') + '\n\n' : '')
      + 'Tente algo como "quanto posso comer hoje", "por que travei" ou "qual o treino de hoje".';
  }
  return m.intencao.fn(A, C, texto);
}

/* Sugestões de acompanhamento, conforme o diagnóstico. */
function sugestoes(A) {
  const s = [];
  const tem = id => A.some(a => a.id===id && a.sev!=='ok');
  if (tem('ritmo') || tem('deficit-real')) s.push('Por que não estou emagrecendo?');
  s.push('Quanto ainda posso comer hoje?');
  if (tem('massa-magra') || tem('proteina')) s.push('Estou perdendo músculo?');
  if (tem('progressao')) s.push('Por que minha carga não sobe?');
  if (tem('series-grupo')) s.push('Estou treinando todos os músculos?');
  s.push('Qual o treino de hoje?');
  s.push('O que fazer primeiro?');
  return s.slice(0, 5);
}
