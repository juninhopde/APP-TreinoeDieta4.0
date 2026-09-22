/* ══════════════════════════════════════════════════════════
   CARDÁPIO ADAPTATIVO E LISTA DE COMPRAS
   Seções 10, 12, 13, 33 e 34 do documento mestre.

   O gerador monta o dia a partir das metas já calculadas pelo
   motor adaptativo, e depois informa o desvio real em vez de
   fingir que bateu certinho. Comida não fecha em número redondo.
   ══════════════════════════════════════════════════════════ */

/* ── 1. FUNÇÃO NUTRICIONAL ──────────────────────────────
   Classifica pelo papel que o alimento cumpre no prato, não
   pela categoria de mercado. É isso que permite substituir
   por função (seção 13) em vez de só por caloria.          */

function funcaoDe(a) {
  const kcal = a.p*4 + a.c*4 + a.g*9 + (a.alc||0)*7;
  if (kcal < 25) return 'vegetal';
  const fp = (a.p*4)/kcal, fc = (a.c*4)/kcal, fg = (a.g*9)/kcal;
  if (a.alc) return 'bebida';
  if (a.cat === 'Legumes') return 'vegetal';
  if (a.cat === 'Frutas')  return 'fruta';
  if (fp >= 0.35 && a.p >= 12 && kcal >= 70) return 'proteina';
  if (fg >= 0.55 && kcal >= 200) return 'gordura';
  // densidade mínima: sem isso "arroz de couve-flor" (27 kcal/100g)
  // vira fonte de carboidrato e o cardápio pede 3,5 kg dele
  if (fc >= 0.50 && kcal >= 70) return 'carboidrato';
  if (a.cat === 'Laticínios') return 'laticinio';
  return 'misto';
}

/* ── 2. MODOS DE CARDÁPIO ───────────────────────────────  */

const CAT_PROCESSADA = ['Doces','Prontos','Congelados','Molhos','Padaria','Suplementos','Escaneados'];

/* Seção 33: barato e real. Lista do que é acessível e comum
   no Brasil — não presume que a pessoa compra suplemento. */
const ECONOMICOS = [
  'Arroz branco cozido','Arroz integral cozido','Feijão carioca cozido','Feijão preto cozido',
  'Ovo de galinha inteiro','Ovo cozido','Ovo mexido','Peito de frango grelhado','Peito de frango cru',
  'Coxa de frango sem pele assada','Sobrecoxa com pele assada','Frango desfiado cozido',
  'Sardinha em óleo (lata)','Sardinha grelhada','Patinho moído cozido','Carne moída refogada',
  'Músculo cozido','Fígado bovino grelhado','Batata inglesa cozida','Batata doce cozida',
  'Mandioca cozida','Inhame cozido','Mandioquinha cozida','Aveia em flocos','Farelo de aveia',
  'Cuscuz de milho cozido','Macarrão cozido','Pão francês','Pão de forma integral','Farinha de mandioca',
  'Banana prata','Banana nanica','Maçã','Laranja','Mamão papaia','Melancia','Goiaba','Limão',
  'Cenoura crua','Repolho cru','Couve refogada','Abóbora cozida','Chuchu cozido','Tomate','Alface',
  'Beterraba cozida','Abobrinha cozida','Berinjela cozida','Vagem cozida','Cebola','Alho',
  'Leite integral','Leite em pó integral','Óleo de soja','Lentilha cozida','Ervilha cozida'
];

const MODOS = {
  padrao:    { rot:'Padrão',    desc:'Toda a base de alimentos.' },
  economico: { rot:'Econômico', desc:'Só alimentos acessíveis e comuns no Brasil. Sem suplemento nem item premium.' },
  roca:      { rot:'Da roça',   desc:'Comida de verdade, minimamente processada: arroz, feijão, ovo, carne, raiz, fruta e verdura.' }
};

/* Alimentos que fazem sentido no café e no lanche. Sem isso o
   gerador propõe bife acebolado às 7 da manhã — tecnicamente
   correto nos macros e impossível de cumprir na vida real. */
const MANHA_OK = [
  'Ovo de galinha inteiro','Ovo cozido','Ovo mexido','Ovo frito','Clara de ovo','Omelete simples',
  'Leite integral','Leite desnatado','Leite semidesnatado','Leite sem lactose','Iogurte natural integral',
  'Iogurte natural desnatado','Iogurte grego zero','Iogurte proteico (tipo YoPro)','Queijo cottage',
  'Queijo cottage light','Queijo minas frescal','Queijo mussarela','Ricota','Whey protein concentrado',
  'Whey protein isolado','Peito de peru defumado','Presunto magro','Frango desfiado cozido',
  'Pão francês','Pão francês integral','Pão de forma integral','Pão de forma branco','Pão integral com grãos',
  'Pão de centeio','Torrada integral','Tapioca (goma hidratada)','Cuscuz de milho cozido','Aveia em flocos',
  'Farelo de aveia','Granola','Corn flakes','Mingau de aveia com leite','Crepioca (ovo + goma)',
  'Batata doce cozida','Banana prata','Banana nanica','Maçã','Mamão papaia','Laranja','Morango',
  'Abacate','Melancia','Manga','Goiaba','Pera','Kiwi','Abacaxi','Uva','Salada de frutas',
  'Pasta de amendoim integral','Castanha de caju','Amêndoa','Castanha do Pará','Aveia','Mel'
];

/* Nunca entram em cardápio automático. */
const FORA_DO_CARDAPIO = ['Suplementos','Bebidas','Escaneados'];

/* Itens crus e temperos: corretos na tabela, absurdos num prato.
   "Peito de frango cru 250 g" e "Alho 3 g" como guarnição. */
const NAO_SERVE = ['Peito de frango cru','Milho de pipoca (cru)','Alho','Cebola','Salsa/cheiro-verde',
  'Adoçante líquido','Pitada','Açúcar refinado','Óleo de soja','Farinha de trigo','Goma de tapioca seca',
  'Proteína de soja texturizada','Albumina','Leite em pó integral','Creatina monohidratada'];

function poolDoModo(base, modo) {
  const limpo = base.filter(a => !FORA_DO_CARDAPIO.includes(a.cat) && !a.alc && !NAO_SERVE.includes(a.n));
  if (modo === 'economico') return limpo.filter(a => ECONOMICOS.includes(a.n));
  if (modo === 'roca') return limpo.filter(a => !CAT_PROCESSADA.includes(a.cat));
  return limpo.filter(a => !['Doces','Prontos','Congelados','Molhos'].includes(a.cat));
}

/* ── 3. GERADOR DE CARDÁPIO ─────────────────────────────
   Distribui a meta do dia entre as refeições e resolve a
   gramagem de cada peça. Depois relata o desvio real.     */

const FATIA_REF = { cafe:0.22, almoco:0.34, lanche:0.12, jantar:0.32 };

const MOLDE = {
  cafe:   ['proteina','carboidrato','fruta'],
  almoco: ['proteina','carboidrato','vegetal','vegetal'],
  lanche: ['proteina','fruta'],
  jantar: ['proteina','carboidrato','vegetal']
};

function escolher(pool, funcao, evitar, preferir, ref) {
  let cands = pool.filter(a => funcaoDe(a) === funcao && !evitar.includes(a.n));
  if (ref === 'cafe' || ref === 'lanche') {
    const manha = cands.filter(a => MANHA_OK.includes(a.n) || funcaoDe(a) === 'fruta');
    if (manha.length) cands = manha;
  }
  if (!cands.length) return null;
  // o que a pessoa já come tem prioridade: aderência vence teoria
  const pref = cands.filter(a => (preferir || []).includes(a.n));
  const alvo = pref.length ? pref : cands;
  return alvo[Math.floor(Math.random() * alvo.length)];
}

function gramasPara(a, kcalAlvo) {
  const k100 = a.p*4 + a.c*4 + a.g*9 + (a.alc||0)*7;
  if (k100 <= 0) return 0;
  return Math.max(10, Math.min(500, Math.round((kcalAlvo / k100) * 100 / 5) * 5));
}

function gerarCardapio(metas, opcoes) {
  const o = opcoes || {};
  const pool = poolDoModo(o.base || ALIMENTOS, o.modo || 'padrao');
  const preferir = (o.preferir || []).concat(o.favoritos || []);
  const evitar = (o.evitar || []).slice();
  const refs = Object.keys(FATIA_REF);
  const out = {};

  const usados = [];                      // item não se repete no dia inteiro

  refs.forEach(ref => {
    const kcalRef = metas.kcal * FATIA_REF[ref];
    const protRef = metas.prot * FATIA_REF[ref];
    const itens = [];

    (MOLDE[ref] || []).forEach((funcao, i) => {
      const a = escolher(pool, funcao, evitar.concat(usados), preferir, ref);
      if (!a) return;
      usados.push(a.n);
      let g;
      if (funcao === 'proteina') {
        // a proteína define a gramagem; o resto preenche a caloria
        g = Math.max(60, Math.min(250, Math.round((protRef / Math.max(1, a.p)) * 100 / 5) * 5));
      } else if (funcao === 'vegetal') {
        g = Math.min(200, a.un ? a.un : 100);
      } else if (funcao === 'fruta') {
        g = Math.min(200, a.un ? a.un : 120);
      } else {
        const jaKcal = itens.reduce((t, x) => t + x.kcal, 0);
        g = Math.min(280, gramasPara(a, Math.max(80, kcalRef - jaKcal)));
      }
      const f = g/100;
      itens.push({
        n: a.n, alimento: a, funcao, gramas: g,
        q: a.un && g % a.un === 0 ? g/a.un : g,
        u: a.un && g % a.un === 0 ? a.unNome : 'g',
        p:+(a.p*f).toFixed(1), c:+(a.c*f).toFixed(1), g_:+(a.g*f).toFixed(1),
        kcal: Math.round((a.p*4 + a.c*4 + a.g*9)*f)
      });
    });

    out[ref] = itens;
  });

  const somar = () => {
    const t = { p:0, c:0, g:0, kcal:0 };
    refs.forEach(r => out[r].forEach(i => { t.p+=i.p; t.c+=i.c; t.g+=i.g_; t.kcal+=i.kcal; }));
    return t;
  };

  /* Passe de ajuste. Montar refeição a refeição acumula erro: cada
     escolha arredonda a gramagem e o total podia fechar 30% fora da
     meta. Aqui o excesso ou a falta é distribuído nas fontes de
     carboidrato e gordura — proteína e vegetal ficam intactos,
     porque são eles que sustentam saciedade e massa magra. */
  let tot = somar();
  const ajustaveis = [];
  refs.forEach(r => out[r].forEach(i => {
    if (i.funcao === 'carboidrato' || i.funcao === 'gordura') ajustaveis.push(i);
  }));

  if (ajustaveis.length && metas.kcal > 0) {
    const kcalAjustavel = ajustaveis.reduce((t2, i) => t2 + i.kcal, 0);
    const sobra = tot.kcal - metas.kcal;
    if (kcalAjustavel > 0 && Math.abs(sobra) / metas.kcal > 0.05) {
      // fator limitado: melhor errar um pouco que servir 15 g de arroz
      const fator = Math.max(0.45, Math.min(1.8, (kcalAjustavel - sobra) / kcalAjustavel));
      ajustaveis.forEach(i => {
        const a = i.alimento;
        const g = Math.max(15, Math.min(400, Math.round(i.gramas * fator / 5) * 5));
        const f = g / 100;
        i.gramas = g;
        i.q = a.un && g % a.un === 0 ? g/a.un : g;
        i.u = a.un && g % a.un === 0 ? a.unNome : 'g';
        i.p = +(a.p*f).toFixed(1); i.c = +(a.c*f).toFixed(1); i.g_ = +(a.g*f).toFixed(1);
        i.kcal = Math.round((a.p*4 + a.c*4 + a.g*9) * f);
      });
      tot = somar();
    }
  }

  tot.p = Math.round(tot.p); tot.c = Math.round(tot.c); tot.g = Math.round(tot.g);

  return {
    refs: out, total: tot, modo: o.modo || 'padrao',
    desvio: {
      kcal: tot.kcal - metas.kcal,
      prot: tot.p - metas.prot,
      pctKcal: Math.round(((tot.kcal - metas.kcal)/metas.kcal)*100)
    }
  };
}

/* ── 4. SUBSTITUIÇÃO POR FUNÇÃO (seção 13) ──────────────
   Troca dentro da mesma função nutricional, casando caloria
   E o macro que define aquela função. Substituir só por
   caloria troca proteína por pão e finge que é equivalente. */

function substituirPorFuncao(item, base, modo) {
  const orig = base.find(a => a.n === item.n);
  if (!orig) return [];
  const fn = funcaoDe(orig);
  const pool = poolDoModo(base, modo || 'padrao');
  const kcalAlvo = item.kcal, gramasOrig = item.gramas || item.q;

  return pool.filter(a => a.n !== item.n && funcaoDe(a) === fn).map(a => {
    const k100 = a.p*4 + a.c*4 + a.g*9;
    if (k100 <= 0) return null;
    const g = (kcalAlvo / k100) * 100;
    if (g < 10 || g > 900) return null;
    const f = g/100;
    const macro = { proteina:'p', carboidrato:'c', gordura:'g' }[fn];
    let dif = 0;
    if (macro) {
      const alvoM = orig[macro] * (gramasOrig/100);
      const novoM = a[macro] * f;
      dif = Math.abs(novoM - alvoM) / Math.max(1, alvoM);
      if (dif > 0.30) return null;          // fora de 30% não é equivalente
    }
    return { a, gramas: Math.round(g/5)*5, dif, fn,
             p:+(a.p*f).toFixed(1), c:+(a.c*f).toFixed(1), g_:+(a.g*f).toFixed(1) };
  }).filter(Boolean).sort((x,y) => x.dif - y.dif).slice(0, 10);
}

/* ── 5. LISTA DE COMPRAS (seção 34) ─────────────────────  */

const GRUPO_COMPRA = {
  proteina:'Proteínas', carboidrato:'Carboidratos', vegetal:'Verduras e legumes',
  fruta:'Frutas', laticinio:'Laticínios', gordura:'Gorduras e óleos',
  bebida:'Bebidas', misto:'Outros'
};

function listaCompras(cardapios, dias) {
  const acc = {};
  (cardapios || []).forEach(card => {
    Object.keys(card.refs).forEach(ref => card.refs[ref].forEach(i => {
      const k = i.n;
      if (!acc[k]) acc[k] = { n: i.n, gramas: 0, grupo: GRUPO_COMPRA[i.funcao] || 'Outros', un: i.alimento && i.alimento.un, unNome: i.alimento && i.alimento.unNome };
      acc[k].gramas += i.gramas;
    }));
  });

  const porGrupo = {};
  Object.values(acc).forEach(x => {
    const total = x.gramas * (dias || 1);
    x.total = total;
    x.exibe = total >= 1000 ? (total/1000).toFixed(1).replace('.',',') + ' kg'
            : x.un && total >= x.un ? Math.ceil(total/x.un) + ' ' + x.unNome + (Math.ceil(total/x.un)>1?'s':'') + ' (' + Math.round(total) + ' g)'
            : Math.round(total) + ' g';
    (porGrupo[x.grupo] = porGrupo[x.grupo] || []).push(x);
  });

  Object.keys(porGrupo).forEach(g => porGrupo[g].sort((a,b) => b.total - a.total));
  return porGrupo;
}
