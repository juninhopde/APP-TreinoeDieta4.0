/* ══════════════════════════════════════════════════════════
   REGISTRO POR LINGUAGEM NATURAL

   Transforma "comi 100g de arroz, 100g de feijão, 1 bife e
   salada de tomate com um copo de coca" em itens do diário,
   com gramagem resolvida e macros da tabela.

   Três regras de projeto:
   1. Nunca grava sozinho. Sempre mostra o que entendeu e
      espera confirmação — errar para mais no registro é o
      mesmo que mentir para o próprio déficit.
   2. Quando não acha o alimento, diz qual não achou em vez
      de inventar um parecido.
   3. Medida informal ("um bife", "uma concha") vira gramagem
      explícita e editável, nunca um chute escondido.
   ══════════════════════════════════════════════════════════ */

const NUM_PALAVRA = {
  'um':1,'uma':1,'hum':1,'dois':2,'duas':2,'tres':3,'três':3,'quatro':4,'cinco':5,
  'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,'onze':11,'doze':12,
  'meio':0.5,'meia':0.5,'metade':0.5,'um quarto':0.25
};

/* Medidas informais → gramas. Quando o alimento tem porção
   própria cadastrada, ela tem prioridade sobre esta tabela. */
const MEDIDA_INFORMAL = {
  'g':1,'grama':1,'gramas':1,'gr':1,
  'kg':1000,'quilo':1000,'quilos':1000,
  'ml':1,'mililitro':1,'mililitros':1,'l':1000,'litro':1000,'litros':1000,
  'colher':15,'colheres':15,'colher de sopa':15,'colheres de sopa':15,
  'colher de cha':5,'colheres de cha':5,'colher de chá':5,
  'concha':80,'conchas':80,
  'fatia':25,'fatias':25,
  'copo':200,'copos':200,'copao':350,
  'xicara':200,'xicaras':200,'xícara':200,
  'lata':350,'latas':350,
  'garrafa':500,'garrafas':500,
  'prato':400,'pratos':400,'pratinho':250,
  'bife':150,'bifes':150,'file':150,'filé':150,'files':150,'filés':150,
  'posta':150,'postas':150,'peito':180,'coxa':100,'sobrecoxa':130,'asa':45,
  'pedaco':100,'pedaço':100,'pedacos':100,'pedaços':100,
  'porcao':120,'porção':120,'porcoes':120,'porções':120,
  'punhado':30,'punhados':30,'pitada':1,
  'unidade':100,'unidades':100,'un':100,
  'scoop':30,'scoops':30,'dose':50,'doses':50,'pote':170,'potes':170,
  'espeto':80,'espetos':80,'concha cheia':100,'tigela':300
};

/* Como as pessoas realmente falam. Sem isto, "coca" e "miojo"
   simplesmente não existem na base. */
const SINONIMOS = {
  'coca':'Refrigerante comum','coca cola':'Refrigerante comum','refri':'Refrigerante comum',
  'guarana':'Refrigerante comum','refrigerante':'Refrigerante comum',
  'coca zero':'Refrigerante zero','refri zero':'Refrigerante zero','guarana zero':'Refrigerante zero',
  'miojo':'Macarrão instantâneo','macarrao instantaneo':'Macarrão instantâneo',
  'paozinho':'Pão francês','pao':'Pão francês','pao frances':'Pão francês',
  'pao integral':'Pão de forma integral','pao de forma':'Pão de forma branco',
  'frango':'Peito de frango grelhado','peito de frango':'Peito de frango grelhado',
  'carne':'Bife acebolado','bife':'Bife acebolado','bife de carne':'Bife acebolado',
  'patinho':'Patinho moído cozido','carne moida':'Carne moída refogada',
  'arroz':'Arroz branco cozido','feijao':'Feijão carioca cozido',
  'salada':'Alface','salada de tomate':'Tomate','salada verde':'Alface',
  'batata':'Batata inglesa cozida','batata doce':'Batata doce cozida',
  'macarrao':'Macarrão cozido','ovo':'Ovo de galinha inteiro','ovos':'Ovo de galinha inteiro',
  'whey':'Whey protein concentrado','iogurte':'Iogurte natural integral',
  'leite':'Leite integral','queijo':'Queijo mussarela','presunto':'Presunto magro',
  'banana':'Banana prata','maca':'Maçã','cafe':'Café sem açúcar',
  'cerveja':'Cerveja','suco':'Suco de laranja natural','agua de coco':'Água de coco',
  'aveia':'Aveia em flocos','tapioca':'Tapioca (goma hidratada)','cuscuz':'Cuscuz de milho cozido',
  'farofa':'Farofa','mandioca':'Mandioca cozida','peixe':'Tilápia grelhada','tilapia':'Tilápia grelhada',
  'atum':'Atum em água (lata)','azeite':'Azeite de oliva','manteiga':'Manteiga',
  'pizza':'Pizza calabresa','hamburguer':'X-burger','lanche':'X-salada','marmita':'Marmita executiva média',
  'chocolate':'Chocolate ao leite','sorvete':'Sorvete de massa','bolacha':'Biscoito água e sal',
  'pao de queijo':'Pão de queijo','requeijao':'Requeijão light','brocolis':'Brócolis cozido'
};

const VERBOS_REG = ['comi','comer','almocei','jantei','lanchei','tomei','bebi','ingeri',
  'devorei','registra','registrar','registre','anota','anotar','anote','adiciona','adicionar',
  'adicione','lanca','lancar','lance','coloca','colocar','poe','põe','marca','marcar'];

const REF_POR_VERBO = { almocei:'almoco', jantei:'jantar', lanchei:'lanche' };
const REF_POR_PALAVRA = {
  'cafe da manha':'cafe','café da manhã':'cafe','cafe':'cafe','manha':'cafe','manhã':'cafe',
  'almoco':'almoco','almoço':'almoco','almocei':'almoco',
  'lanche':'lanche','tarde':'lanche','lanchei':'lanche',
  'janta':'jantar','jantar':'jantar','jantei':'jantar','noite':'jantar',
  'ceia':'extra','extra':'extra','madrugada':'extra'
};

/* Palavras que aparecem em frases de comida e não são alimento. */
const RUIDO = new Set(['de','do','da','dos','das','com','sem','e','mais','um','uma','o','a','os','as',
  'no','na','nos','nas','pra','para','hoje','agora','ontem','cedo','tarde','noite','manha','manhã',
  'meu','minha','eu','ja','já','tambem','também','acabei','acabo','tipo','uns','umas','só','so']);

/* Divide a frase em pedaços que representam um alimento cada.

   Duas passagens, porque quase ninguém escreve com vírgula:
   1. conectivos (e / com / mais / vírgula / +)
   2. início de nova quantidade — "100g de arroz 100g de feijão"
      não tem separador nenhum, mas o segundo "100g" marca
      claramente onde começa o próximo alimento.              */
const RE_QTD_INICIO = new RegExp(
  '(?=(?:^|\\s)(?:\\d+(?:[.,]\\d+)?\\s*(?:kg|g|gr|gramas?|ml|l|litros?)\\b' +
  '|\\d+(?:[.,]\\d+)?\\s|' +
  '(?:' + Object.keys(NUM_PALAVRA).join('|') + ')\\s))', 'g');

function fatiarItens(frase) {
  const grosso = norm(frase)
    .replace(/\be\s+(mais\s+)?/g, ',')
    .replace(/\bcom\b/g, ',')
    .replace(/\bmais\b/g, ',')
    .replace(/[;+\n]/g, ',')
    .split(',');

  const fino = [];
  grosso.forEach(bloco => {
    const t = ' ' + bloco.trim() + ' ';
    t.split(RE_QTD_INICIO).forEach(x => {
      const v = x.trim();
      if (v.length > 1) fino.push(v);
    });
  });
  return fino;
}

/* Extrai quantidade, medida e nome de um pedaço. */
function lerPedaco(txt) {
  let t = ' ' + norm(txt) + ' ';
  VERBOS_REG.forEach(v => { t = t.replace(new RegExp('\\s' + v + '\\s', 'g'), ' '); });

  let qtd = null, medida = null;

  // "100g", "100 g", "250ml", "1,5 kg"
  const mNum = t.match(/\s(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas?|ml|l|litros?)\s/);
  if (mNum) {
    qtd = parseFloat(mNum[1].replace(',', '.'));
    medida = mNum[2];
    t = t.replace(mNum[0], ' ');
  }

  // "2 fatias", "um copo", "meio prato"
  if (qtd == null) {
    const palavras = Object.keys(NUM_PALAVRA).join('|');
    const medidas = Object.keys(MEDIDA_INFORMAL).map(m => m.replace(/ /g,'\\s')).join('|');
    const re = new RegExp('\\s(\\d+(?:[.,]\\d+)?|' + palavras + ')\\s+(' + medidas + ')\\s');
    const mm = t.match(re);
    if (mm) {
      qtd = NUM_PALAVRA[mm[1]] != null ? NUM_PALAVRA[mm[1]] : parseFloat(mm[1].replace(',', '.'));
      medida = mm[2];
      t = t.replace(mm[0], ' ');
    }
  }

  // só o número: "2 ovos", "3 bananas"
  if (qtd == null) {
    const palavras = Object.keys(NUM_PALAVRA).join('|');
    const ms = t.match(new RegExp('\\s(\\d+(?:[.,]\\d+)?|' + palavras + ')\\s'));
    if (ms) {
      qtd = NUM_PALAVRA[ms[1]] != null ? NUM_PALAVRA[ms[1]] : parseFloat(ms[1].replace(',', '.'));
      t = t.replace(ms[0], ' ');
    }
  }

  const nome = t.split(' ').filter(w => w && !RUIDO.has(w)).join(' ').trim();
  return { nome, qtd, medida };
}

/* Pontua todos os candidatos da base contra o nome dito, do mais
   parecido ao menos. Usada tanto para achar com confiança
   (acharAlimento) quanto para sugerir parecidos quando nada bate
   o piso de confiança (sugerirAlimentos) — a mesma régua nos dois casos. */
function _pontuarCandidatos(nomeDito, base) {
  const alvo = norm(nomeDito);
  if (!alvo) return [];
  const toks = alvo.split(' ').filter(t => t.length > 2 && !RUIDO.has(t));
  if (!toks.length) return [];

  const out = [];
  base.forEach(a => {
    const c = norm(a.n).replace(/[()]/g,'');
    const ct = c.split(' ').filter(w => w.length > 2 && !RUIDO.has(w));
    if (!ct.length) return;
    let p = 0;
    if (c === alvo) { p = 1000; }
    else {
      let casados = 0;
      toks.forEach(t => {
        if (ct.some(w => w === t)) { p += 40; casados++; }
        else if (ct.some(w => w.length > 3 && t.length > 3 &&
                 (w.startsWith(t.slice(0,4)) || t.startsWith(w.slice(0,4))))) { p += 22; casados++; }
      });
      if (!casados) return;
      // Penaliza palavra do candidato que a pessoa NÃO disse.
      // Sem isso "salada de tomate" casava com "Salada de maionese".
      const sobrando = ct.filter(w => !toks.some(t => w === t ||
        (w.length > 3 && t.length > 3 && (w.startsWith(t.slice(0,4)) || t.startsWith(w.slice(0,4)))))).length;
      p -= sobrando * 14;
    }
    if (p > 0) out.push({ a, p });
  });
  return out.sort((x, y) => y.p - x.p);
}

/* Casa com a base, priorizando quem tem mais palavras em comum. */
function acharAlimento(nome, base) {
  const alvo = norm(nome);
  if (!alvo) return null;

  // apelido do dia a dia tem prioridade sobre qualquer busca
  const apelido = SINONIMOS[alvo];
  if (apelido) {
    const direto = base.find(a => a.n === apelido);
    if (direto) return direto;
  }

  const cands = _pontuarCandidatos(nome, base);
  return cands.length && cands[0].p >= 20 ? cands[0].a : null;
}

/* Quando NÃO acha com confiança, sugere os alimentos REAIS mais
   próximos do banco — nunca inventa um novo nem chuta macro. A regra
   do topo deste arquivo continua valendo: dizer o que não achou, não
   fabricar um parecido. Isto só aponta para o que já existe e já foi
   conferido. */
function sugerirAlimentos(nome, base, n) {
  n = n || 3;
  return _pontuarCandidatos(nome, base).slice(0, n).map(x => x.a.n);
}

/* Resolve a gramagem final de um item. */
function resolverGramas(a, qtd, medida) {
  // sem quantidade: usa a porção do alimento, senão 100 g
  if (qtd == null) {
    return a.un ? { gramas: a.un, q: 1, u: a.unNome } : { gramas: 100, q: 100, u: 'g' };
  }
  if (!medida) {
    // número puro + alimento que tem unidade → "2 ovos"
    if (a.un) return { gramas: qtd * a.un, q: qtd, u: a.unNome };
    return { gramas: qtd, q: qtd, u: 'g' };
  }
  const m = norm(medida);
  // peso ou volume direto
  if (['g','gr','grama','gramas','ml','mililitro','mililitros'].includes(m))
    return { gramas: qtd, q: qtd, u: 'g' };
  if (['kg','quilo','quilos','l','litro','litros'].includes(m))
    return { gramas: qtd * 1000, q: qtd * 1000, u: 'g' };
  // Medida caseira. A porção cadastrada do alimento só vale quando é a
  // MESMA medida que a pessoa falou — senão "um copo de coca" virava
  // uma lata de 350 ml só porque a lata é a porção cadastrada.
  const sing = m.replace(/s$/, '');
  const un = a.unNome ? norm(a.unNome) : '';
  const mesmaMedida = a.un && un && (un === sing || un.split(' ').includes(sing) || sing === 'unidade' || sing === 'un');
  const fator = mesmaMedida ? a.un : (MEDIDA_INFORMAL[m] || MEDIDA_INFORMAL[sing] || a.un || 100);
  return { gramas: qtd * fator, q: qtd, u: mesmaMedida ? a.unNome : medida };
}

/* Qual refeição, pelo verbo, pela palavra ou pela hora. */
function inferirRefeicao(frase, hora) {
  const q = norm(frase);
  for (const k in REF_POR_PALAVRA) {
    if (new RegExp('(^|\\s)' + norm(k) + '(\\s|$)').test(q)) return REF_POR_PALAVRA[k];
  }
  if (hora < 10) return 'cafe';
  if (hora < 15) return 'almoco';
  if (hora < 18) return 'lanche';
  if (hora < 23) return 'jantar';
  return 'extra';
}

/* Ponto de entrada. `base` = ALIMENTOS + customizados. */
function interpretarRefeicao(frase, base, hora) {
  const pedacos = fatiarItens(frase);
  const itens = [], perdidos = [];

  pedacos.forEach(p => {
    const { nome, qtd, medida } = lerPedaco(p);
    // "1 bife de carne": "bife" é medida E é alimento. Tenta as duas
    // leituras e fica com a que casa melhor.
    const candidatos = [nome];
    if (medida && !/^\d/.test(medida)) candidatos.push((medida + ' ' + nome).trim());
    let a = null;
    candidatos.forEach(cn => { if (!a && cn && cn.length >= 3) a = acharAlimento(cn, base); });
    if (!a) {
      if (nome && nome.length >= 3) perdidos.push({ dito: nome, sugestoes: sugerirAlimentos(nome, base, 3) });
      return;
    }
    const g = resolverGramas(a, qtd, medida);
    if (g.gramas <= 0 || g.gramas > 5000) return;
    const f = g.gramas / 100;
    itens.push({
      alimento: a, nome: a.n, gramas: Math.round(g.gramas), q: g.q, u: g.u,
      p: +(a.p*f).toFixed(1), c: +(a.c*f).toFixed(1), g: +(a.g*f).toFixed(1),
      alc: a.alc ? +(a.alc*f).toFixed(1) : 0,
      dito: p.trim()
    });
  });

  return { itens, perdidos, refeicao: inferirRefeicao(frase, hora) };
}
