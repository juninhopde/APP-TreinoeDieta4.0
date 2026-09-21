/* ══════════════════════════════════════════════════════════
   ANÁLISE AVANÇADA 3.2

   Três coisas que os apps pagos fazem separadas e que aqui
   ficam na mesma tabela:

   1. Séries semanais por grupo muscular — a métrica que a
      literatura aponta como principal motor de hipertrofia,
      e não o volume em quilos que o app mostrava antes.
   2. Peso-tendência — média móvel exponencial sobre pesagens,
      que é o número no qual se deve olhar, não a balança crua.
   3. Diagnóstico cruzado — padrões que só aparecem quando
      nutrição, treino e composição são lidos juntos.
   ══════════════════════════════════════════════════════════ */

/* ── 1. VOLUME POR GRUPO MUSCULAR ───────────────────────
   Faixas de referência por músculo por semana. São faixas de
   trabalho, não lei: em déficit calórico o teto útil cai,
   porque a recuperação é o fator limitante.                */

const GRUPOS_PRINCIPAIS = ['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Glúteos','Core'];
const FAIXA_SERIES = { min: 6, ideal: [10, 20], alto: 22 };

/* Conta séries VÁLIDAS por grupo (aquecimento não conta). */
function seriesPorGrupo(sessoes, diasISO) {
  const acc = {};
  sessoes.filter(s => diasISO.includes(s.d)).forEach(s => {
    (s.ex || []).forEach(e => {
      const bib = EXERCICIOS.find(x => x.n === e.n);
      if (!bib || bib.gm === 'Cardio') return;
      const n = (e.series || []).filter(x => x.t !== 'w' && (+x.reps > 0 || +x.kg > 0)).length;
      if (!n) return;
      acc[bib.gm] = (acc[bib.gm] || 0) + n;
    });
  });
  return acc;
}

function avaliarGrupo(n) {
  if (!n) return 'ausente';
  if (n < FAIXA_SERIES.min) return 'baixo';
  if (n > FAIXA_SERIES.alto) return 'alto';
  return 'ok';
}

/* Grupos que a pessoa simplesmente não treina. */
function gruposOrfaos(mapa) {
  return GRUPOS_PRINCIPAIS.filter(g => !mapa[g]);
}

/* ── 2. PESO-TENDÊNCIA ──────────────────────────────────
   Média móvel exponencial. O peso cru de um dia carrega
   água, sal e volume intestinal; a tendência carrega gordura.
   Alfa 0,25 responde em cerca de duas semanas com pesagem
   diária, sem virar ruído.                                 */

/* Suavização exponencial CONSCIENTE DO INTERVALO.

   Com alfa fixo, quem se pesa uma vez por semana fica com uma
   tendência que leva dois meses para alcançar a realidade — e
   o app deixaria de avisar reganho justamente por isso.

   Aqui o peso de cada leitura vem do tempo desde a anterior:
       alfa = 1 − e^(−Δdias / TAU)
   Com TAU de 10 dias, pesagem diária pesa ~10% e semanal ~50%.
   Quem se pesa mais tem tendência mais estável; quem se pesa
   pouco tem tendência que ainda assim acompanha. */
const TAU_TENDENCIA = 10;

function pesoTendencia(pesos, tau) {
  tau = tau || TAU_TENDENCIA;
  const ord = pesos.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const dia = s => new Date(s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10)).getTime() / 86400000;
  let t = null, anterior = null;
  return ord.map(p => {
    if (t == null) { t = p.kg; }
    else {
      const gap = Math.max(0.5, Math.min(30, dia(p.d) - anterior));
      const alfa = 1 - Math.exp(-gap / tau);
      t = alfa * p.kg + (1 - alfa) * t;
    }
    anterior = dia(p.d);
    return { d: p.d, kg: p.kg, tend: +t.toFixed(2) };
  });
}

/* ── 3. MICRONUTRIENTES SELECIONADOS ────────────────────
   Só fibra e sódio, e só nos alimentos em que a informação
   muda decisão: fibra pela saciedade, sódio porque explica
   balança travada por retenção. Valores por 100 g.
   Cobertura é parcial de propósito — o app mostra de quantos
   itens do dia ele tinha o dado, em vez de fingir total.   */

const MICRO = {
  'Feijão carioca cozido':[8.5,2],'Feijão preto cozido':[8.4,2],'Lentilha cozida':[7.9,2],
  'Grão-de-bico cozido':[7.6,6],'Ervilha cozida':[5.5,3],'Feijão fradinho cozido':[6.5,4],
  'Feijão branco cozido':[6.3,5],'Soja cozida':[6,2],'Homus':[6,380],'Tofu':[1,7],
  'Aveia em flocos':[9.1,3],'Farelo de aveia':[15,4],'Farinha de aveia':[9,3],
  'Granola':[7,25],'Corn flakes':[3,650],'Sucrilhos açucarados':[2,450],
  'Arroz integral cozido':[2.7,2],'Arroz branco cozido':[1.6,1],'Quinoa cozida':[2.8,7],
  'Pão de forma integral':[6.5,450],'Pão integral com grãos':[7,430],'Pão francês':[2.3,580],
  'Pão de forma branco':[2.5,490],'Pão de centeio':[5.8,600],'Torrada integral':[7,520],
  'Macarrão integral cozido':[4.5,3],'Macarrão cozido':[1.8,1],'Tapioca (goma hidratada)':[0.5,2],
  'Cuscuz de milho cozido':[1.5,6],'Batata doce cozida':[3,27],'Batata inglesa cozida':[1.8,5],
  'Mandioca cozida':[1.6,14],'Inhame cozido':[3.9,9],'Milho verde em conserva':[2.4,220],
  'Brócolis cozido':[3.3,25],'Couve refogada':[3.1,30],'Espinafre cozido':[2.4,70],
  'Cenoura crua':[2.8,69],'Beterraba cozida':[2,78],'Abóbora cozida':[1.5,3],
  'Repolho cru':[2.5,18],'Alface':[1.3,10],'Tomate':[1.2,5],'Pepino':[0.7,2],
  'Vagem cozida':[3.2,6],'Couve-flor cozida':[2.3,20],'Berinjela cozida':[2.5,2],
  'Quiabo refogado':[3.2,7],'Palmito em conserva':[2.5,450],'Azeitona verde':[3.3,1550],
  'Pepino em conserva':[1.2,1200],'Tomate seco':[5.8,260],'Champignon em conserva':[2,420],
  'Banana prata':[2,1],'Banana nanica':[2.6,1],'Maçã':[2.4,1],'Laranja':[2.4,0],
  'Mamão papaia':[1.8,8],'Abacate':[6.7,7],'Goiaba':[5.4,2],'Manga':[1.6,1],
  'Melancia':[0.4,1],'Morango':[2,1],'Pera':[3.1,1],'Kiwi':[3,3],'Ameixa seca':[7,2],
  'Uva passa':[3.7,11],'Abacaxi':[1.4,1],'Coco fresco':[9,20],
  'Castanha de caju':[3.3,12],'Castanha do Pará':[7.5,3],'Amendoim torrado':[8,6],
  'Pasta de amendoim integral':[6,10],'Amêndoa':[12.5,1],'Nozes':[6.7,2],
  'Chia':[34,16],'Linhaça':[27,30],'Semente de girassol':[8.6,9],'Gergelim':[11.8,11],
  'Presunto magro':[0,1100],'Peito de peru defumado':[0,1000],'Mortadela':[0,1250],
  'Salame':[0,1800],'Bacon frito':[0,1700],'Linguiça toscana grelhada':[0,900],
  'Salsicha':[0,1100],'Carne seca cozida':[0,1400],'Apresuntado':[0,1050],
  'Peito de peru fatiado light':[0,900],'Bacalhau dessalgado cozido':[0,300],
  'Atum em água (lata)':[0,320],'Sardinha em óleo (lata)':[0,420],
  'Queijo mussarela':[0,620],'Queijo prato':[0,580],'Queijo parmesão ralado':[0,1600],
  'Requeijão light':[0,620],'Catupiry / requeijão cremoso':[0,650],'Queijo minas frescal':[0,350],
  'Queijo cottage':[0,400],'Manteiga':[0,580],
  'Salgadinho de pacote':[3,900],'Biscoito água e sal':[2.5,900],
  'Biscoito salgado (tipo Club)':[2.5,780],'Biscoito recheado':[2,300],
  'Pipoca de micro-ondas':[10,750],'Amendoim japonês':[4,600],
  'Ketchup':[1,1100],'Mostarda':[3,1100],'Shoyu':[0.8,5500],'Molho barbecue':[1,1000],
  'Molho de tomate pronto':[1.5,480],'Maionese':[0,700],'Maionese light':[0,800],
  'Molho de pimenta':[1.5,2200],'Molho caesar':[0,1000],'Molho tártaro':[0,700],
  'Macarrão instantâneo':[3,1800],'Pizza calabresa':[2,700],'Pizza portuguesa':[2,650],
  'Hambúrguer de fast food':[1.5,480],'Cachorro-quente':[1.5,700],'Batata frita de fast food':[3.5,250],
  'Nuggets de frango':[1.5,500],'Farofa':[5,600],'Feijoada':[4,600],'Marmita executiva média':[2,450],
  'Chocolate 70% cacau':[11,20],'Chocolate ao leite':[3,80],'Creme de avelã (tipo Nutella)':[3,40],
  'Iogurte natural integral':[0,50],'Iogurte proteico (tipo YoPro)':[0,60],'Leite integral':[0,44],
  'Whey protein concentrado':[1,250],'Whey protein isolado':[0,200],'Albumina':[0,800],
  'Ovo de galinha inteiro':[0,124],'Clara de ovo':[0,166],'Água de coco':[1.1,105],
  'Isotônico':[0,110],'Refrigerante comum':[0,10],'Cerveja':[0,4]
};

function microDoItem(nome, gramas) {
  const m = MICRO[nome];
  if (!m) return null;
  const f = gramas / 100;
  return { fib: +(m[0] * f).toFixed(1), sod: Math.round(m[1] * f) };
}

/* Soma fibra e sódio do dia, informando a cobertura real. */
function microsDoDia(dia, REFS) {
  let fib = 0, sod = 0, com = 0, total = 0;
  (REFS || []).forEach(r => ((dia.refs || {})[r.id] || []).forEach(i => {
    total++;
    const g = i.u === 'g' ? i.q : null;
    const gramas = g != null ? g : null;
    const m = gramas != null ? microDoItem(i.n, gramas) : microDoItem(i.n, estimarGramas(i));
    if (m) { fib += m.fib; sod += m.sod; com++; }
  }));
  return { fib: +fib.toFixed(1), sod: Math.round(sod), com, total };
}

/* Quando o item foi registrado em medida caseira, recupera a
   gramagem pelo cadastro do alimento. */
function estimarGramas(item) {
  const a = ALIMENTOS.find(x => x.n === item.n);
  if (a && a.un && item.u !== 'g') return item.q * a.un;
  return item.q;
}

const REF_MICRO = { fibra: 25, sodioMax: 2300 };

/* ── 4. DIAGNÓSTICO CRUZADO ─────────────────────────────
   Padrões que exigem ler nutrição, treino e composição
   juntos. É o que nenhum app de domínio único enxerga.    */

function sindromes(achados, extra) {
  const g = id => achados.find(a => a.id === id);
  const grave = id => { const a = g(id); return a && (a.sev === 'critico' || a.sev === 'atencao'); };
  const critico = id => { const a = g(id); return a && a.sev === 'critico'; };
  const out = [];

  /* Catabolismo em déficit */
  if (grave('massa-magra') && (grave('proteina') || grave('frequencia') || grave('progressao'))) {
    out.push({
      nome: 'Catabolismo em déficit',
      o: 'Você não está só perdendo gordura — está perdendo músculo junto, e as causas estão visíveis.',
      evid: ['massa-magra','proteina','frequencia','progressao'].filter(grave),
      faz: 'Nesta ordem, e só uma coisa por vez: primeiro subir proteína até o alvo por duas semanas. Se a massa magra não estabilizar, subir a caloria em 150. Cortar mais é o caminho oposto do que resolve.'
    });
  }

  /* Déficit fantasma */
  if ((critico('ritmo') || grave('deficit-real')) && (grave('aderencia-kcal') || grave('cobertura'))) {
    out.push({
      nome: 'Déficit fantasma',
      o: 'O déficit existe no papel e não na prática. O número da meta não é o problema.',
      evid: ['ritmo','deficit-real','aderencia-kcal','cobertura'].filter(grave),
      faz: 'Não mexa na meta. Feche a execução por duas semanas: registre todo dia, inclusive os ruins. Se o peso cair sem mudar a meta, estava resolvido o tempo todo.'
    });
  }

  /* Sabotagem de fim de semana */
  if (grave('fim-de-semana') && (grave('ritmo') || grave('deficit-real'))) {
    const fds = g('fim-de-semana');
    out.push({
      nome: 'Sabotagem de fim de semana',
      o: 'Sua semana está certa. Seus sábados e domingos apagam o que ela construiu.',
      evid: ['fim-de-semana','ritmo','alcool'].filter(grave),
      faz: 'Não é preciso fazer dieta no fim de semana. Basta não passar de ' + (fds && fds.n ? Math.round(fds.n/2) : 300) + ' kcal acima do dia útil. Proteína alta no almoço de sábado resolve metade disso sozinha.'
    });
  }

  /* Fadiga acumulada */
  if (grave('progressao') && (grave('volume') || grave('rir')) && extra && extra.fase && extra.fase.id !== 'deload') {
    out.push({
      nome: 'Fadiga acumulada',
      o: 'Carga parada junto com volume ou esforço caindo, fora de semana de deload.',
      evid: ['progressao','volume','rir','frequencia'].filter(grave),
      faz: 'Antecipe o deload: uma semana a 60% da carga. Em déficit a recuperação é o fator limitante, e insistir na carga quando ela não sobe só acumula desgaste.'
    });
  }

  /* Registro decorativo */
  if (grave('cobertura') && (grave('gasto') || grave('pesagem'))) {
    out.push({
      nome: 'Registro decorativo',
      o: 'O app está calculando em cima de dados ralos demais para valerem.',
      evid: ['cobertura','gasto','pesagem','consistencia'].filter(grave),
      faz: 'Duas semanas de registro completo antes de tirar qualquer conclusão. Tudo que está escrito nas outras telas hoje tem margem de erro grande.'
    });
  }

  /* Grupo muscular negligenciado */
  if (extra && extra.orfaos && extra.orfaos.length) {
    out.push({
      nome: 'Grupo muscular sem estímulo',
      o: 'Há músculos que sua rotina não treina de forma direta: ' + extra.orfaos.join(', ') + '.',
      evid: ['progressao'].filter(grave),
      faz: 'Em déficit, músculo sem estímulo é o primeiro a ser consumido. Uma ou duas séries semanais já mudam esse quadro — não precisa de treino separado.'
    });
  }

  /* Retenção mascarando resultado */
  const cint = g('cintura'), rit = g('ritmo');
  if (cint && cint.n != null && cint.n <= -1 && rit && rit.n != null && rit.n < 0.3) {
    out.push({
      nome: 'Retenção mascarando o resultado',
      o: 'Sua cintura está caindo enquanto a balança quase não mexe. Isso é água, não ausência de progresso.',
      evid: ['cintura','ritmo'].filter(id => g(id)),
      faz: 'Não corte caloria por causa disso. Cheque sódio e sono, mantenha a hidratação e olhe a tendência de peso, não a leitura do dia.'
    });
  }

  return out;
}
