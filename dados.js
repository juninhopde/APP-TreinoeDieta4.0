/* ══════════════════════════════════════════════════════════
   BASE DE ALIMENTOS — valores por 100 g (ou 100 ml)
   p = proteína (g) | c = carboidrato (g) | g = gordura (g)
   un = peso de 1 unidade/medida em gramas (opcional)
   unNome = nome da medida
   Valores aproximados, baseados em tabelas de composição
   de alimentos brasileiros. Margem de erro de ~10%.
   ══════════════════════════════════════════════════════════ */

const ALIMENTOS = [
  // ── Carnes e aves ──────────────────────────────────────
  { n: 'Peito de frango grelhado',      p: 32,   c: 0,    g: 3.2,  cat: 'Carnes' },
  { n: 'Peito de frango cru',           p: 23,   c: 0,    g: 2.5,  cat: 'Carnes' },
  { n: 'Coxa de frango sem pele assada',p: 27,   c: 0,    g: 9,    cat: 'Carnes' },
  { n: 'Sobrecoxa com pele assada',     p: 24,   c: 0,    g: 16,   cat: 'Carnes' },
  { n: 'Patinho moído cozido',          p: 32,   c: 0,    g: 8,    cat: 'Carnes' },
  { n: 'Alcatra grelhada',              p: 32,   c: 0,    g: 9,    cat: 'Carnes' },
  { n: 'Coxão mole cozido',             p: 33,   c: 0,    g: 6,    cat: 'Carnes' },
  { n: 'Contrafilé grelhado',           p: 31,   c: 0,    g: 13,   cat: 'Carnes' },
  { n: 'Picanha grelhada',              p: 27,   c: 0,    g: 23,   cat: 'Carnes' },
  { n: 'Costela bovina assada',         p: 25,   c: 0,    g: 30,   cat: 'Carnes' },
  { n: 'Lombo de porco assado',         p: 30,   c: 0,    g: 7,    cat: 'Carnes' },
  { n: 'Bisteca de porco grelhada',     p: 28,   c: 0,    g: 17,   cat: 'Carnes' },
  { n: 'Linguiça toscana grelhada',     p: 19,   c: 1,    g: 27,   cat: 'Carnes' },
  { n: 'Bacon frito',                   p: 30,   c: 0,    g: 45,   cat: 'Carnes' },
  { n: 'Presunto magro',                p: 18,   c: 1,    g: 4,    cat: 'Carnes' },
  { n: 'Peito de peru defumado',        p: 18,   c: 2,    g: 2,    cat: 'Carnes' },
  { n: 'Carne seca cozida',             p: 33,   c: 0,    g: 12,   cat: 'Carnes' },

  // ── Peixes e frutos do mar ─────────────────────────────
  { n: 'Tilápia grelhada',              p: 26,   c: 0,    g: 2,    cat: 'Peixes' },
  { n: 'Merluza cozida',                p: 24,   c: 0,    g: 2,    cat: 'Peixes' },
  { n: 'Salmão grelhado',               p: 25,   c: 0,    g: 13,   cat: 'Peixes' },
  { n: 'Atum em água (lata)',           p: 26,   c: 0,    g: 1,    cat: 'Peixes', un: 120, unNome: 'lata' },
  { n: 'Atum em óleo (lata)',           p: 24,   c: 0,    g: 8,    cat: 'Peixes', un: 120, unNome: 'lata' },
  { n: 'Sardinha em óleo (lata)',       p: 24,   c: 0,    g: 11,   cat: 'Peixes', un: 125, unNome: 'lata' },
  { n: 'Camarão cozido',                p: 24,   c: 0,    g: 1,    cat: 'Peixes' },
  { n: 'Bacalhau dessalgado cozido',    p: 29,   c: 0,    g: 1,    cat: 'Peixes' },

  // ── Ovos e laticínios ──────────────────────────────────
  { n: 'Ovo de galinha inteiro',        p: 13,   c: 1,    g: 10,   cat: 'Ovos', un: 50,  unNome: 'ovo' },
  { n: 'Clara de ovo',                  p: 11,   c: 0.7,  g: 0.2,  cat: 'Ovos', un: 33,  unNome: 'clara' },
  { n: 'Gema de ovo',                   p: 16,   c: 1,    g: 27,   cat: 'Ovos', un: 17,  unNome: 'gema' },
  { n: 'Leite integral',                p: 3.2,  c: 4.7,  g: 3.5,  cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Leite desnatado',               p: 3.4,  c: 5,    g: 0.2,  cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Iogurte natural integral',      p: 4,    c: 5,    g: 3,    cat: 'Laticínios', un: 170, unNome: 'pote' },
  { n: 'Iogurte natural desnatado',     p: 5.5,  c: 6,    g: 0.2,  cat: 'Laticínios', un: 170, unNome: 'pote' },
  { n: 'Iogurte grego zero',            p: 9,    c: 4,    g: 0,    cat: 'Laticínios', un: 130, unNome: 'pote' },
  { n: 'Queijo minas frescal',          p: 17,   c: 3,    g: 20,   cat: 'Laticínios' },
  { n: 'Queijo cottage',                p: 12,   c: 3,    g: 4,    cat: 'Laticínios' },
  { n: 'Queijo mussarela',              p: 25,   c: 3,    g: 25,   cat: 'Laticínios', un: 20, unNome: 'fatia' },
  { n: 'Queijo prato',                  p: 24,   c: 2,    g: 27,   cat: 'Laticínios', un: 20, unNome: 'fatia' },
  { n: 'Requeijão light',               p: 9,    c: 4,    g: 12,   cat: 'Laticínios' },
  { n: 'Cream cheese light',            p: 7,    c: 5,    g: 15,   cat: 'Laticínios' },
  { n: 'Ricota',                        p: 11,   c: 3,    g: 8,    cat: 'Laticínios' },
  { n: 'Manteiga',                      p: 0.6,  c: 0,    g: 82,   cat: 'Laticínios' },

  // ── Suplementos ────────────────────────────────────────
  { n: 'Whey protein concentrado',      p: 75,   c: 9,    g: 6,    cat: 'Suplementos', un: 30, unNome: 'scoop' },
  { n: 'Whey protein isolado',          p: 88,   c: 2,    g: 1,    cat: 'Suplementos', un: 30, unNome: 'scoop' },
  { n: 'Albumina',                      p: 80,   c: 5,    g: 0.5,  cat: 'Suplementos' },
  { n: 'Caseína',                       p: 74,   c: 8,    g: 2,    cat: 'Suplementos', un: 30, unNome: 'scoop' },
  { n: 'Creatina monohidratada',        p: 0,    c: 0,    g: 0,    cat: 'Suplementos', un: 5,  unNome: 'dose' },

  // ── Cereais, pães e massas ─────────────────────────────
  { n: 'Arroz branco cozido',           p: 2.5,  c: 28,   g: 0.2,  cat: 'Cereais', un: 25, unNome: 'colher sopa' },
  { n: 'Arroz integral cozido',         p: 2.6,  c: 26,   g: 1,    cat: 'Cereais', un: 25, unNome: 'colher sopa' },
  { n: 'Pão francês',                   p: 8,    c: 58,   g: 3,    cat: 'Cereais', un: 50, unNome: 'unidade' },
  { n: 'Pão de forma integral',         p: 9,    c: 43,   g: 4,    cat: 'Cereais', un: 25, unNome: 'fatia' },
  { n: 'Pão de forma branco',           p: 8,    c: 50,   g: 3,    cat: 'Cereais', un: 25, unNome: 'fatia' },
  { n: 'Tapioca (goma hidratada)',      p: 0,    c: 61,   g: 0,    cat: 'Cereais' },
  { n: 'Cuscuz de milho cozido',        p: 2,    c: 25,   g: 0.5,  cat: 'Cereais' },
  { n: 'Macarrão cozido',               p: 5,    c: 30,   g: 1,    cat: 'Cereais' },
  { n: 'Macarrão integral cozido',      p: 6,    c: 27,   g: 1.2,  cat: 'Cereais' },
  { n: 'Aveia em flocos',               p: 14,   c: 66,   g: 8,    cat: 'Cereais', un: 15, unNome: 'colher sopa' },
  { n: 'Granola',                       p: 9,    c: 64,   g: 12,   cat: 'Cereais' },
  { n: 'Farinha de mandioca',           p: 1.5,  c: 84,   g: 0.5,  cat: 'Cereais' },
  { n: 'Polenta cozida',                p: 2,    c: 17,   g: 1,    cat: 'Cereais' },
  { n: 'Pão de queijo',                 p: 5,    c: 40,   g: 15,   cat: 'Cereais', un: 30, unNome: 'unidade' },
  { n: 'Torrada integral',              p: 11,   c: 70,   g: 6,    cat: 'Cereais', un: 8,  unNome: 'fatia' },
  { n: 'Biscoito de arroz',             p: 8,    c: 81,   g: 3,    cat: 'Cereais', un: 9,  unNome: 'unidade' },

  // ── Leguminosas ────────────────────────────────────────
  { n: 'Feijão carioca cozido',         p: 5,    c: 14,   g: 0.5,  cat: 'Leguminosas', un: 80, unNome: 'concha' },
  { n: 'Feijão preto cozido',           p: 4.5,  c: 14,   g: 0.5,  cat: 'Leguminosas', un: 80, unNome: 'concha' },
  { n: 'Lentilha cozida',               p: 9,    c: 20,   g: 0.4,  cat: 'Leguminosas' },
  { n: 'Grão-de-bico cozido',           p: 9,    c: 27,   g: 2.6,  cat: 'Leguminosas' },
  { n: 'Ervilha cozida',                p: 5,    c: 14,   g: 0.4,  cat: 'Leguminosas' },
  { n: 'Soja cozida',                   p: 17,   c: 10,   g: 9,    cat: 'Leguminosas' },

  // ── Tubérculos ─────────────────────────────────────────
  { n: 'Batata inglesa cozida',         p: 2,    c: 20,   g: 0.1,  cat: 'Tubérculos', un: 130, unNome: 'unidade média' },
  { n: 'Batata doce cozida',            p: 1.5,  c: 24,   g: 0.1,  cat: 'Tubérculos' },
  { n: 'Mandioca cozida',               p: 1.4,  c: 30,   g: 0.3,  cat: 'Tubérculos' },
  { n: 'Inhame cozido',                 p: 1.8,  c: 24,   g: 0.1,  cat: 'Tubérculos' },
  { n: 'Batata frita',                  p: 4,    c: 36,   g: 15,   cat: 'Tubérculos' },
  { n: 'Purê de batata',                p: 2,    c: 15,   g: 4,    cat: 'Tubérculos' },

  // ── Legumes e verduras ─────────────────────────────────
  { n: 'Alface',                        p: 1.3,  c: 2,    g: 0.2,  cat: 'Legumes' },
  { n: 'Tomate',                        p: 1,    c: 3.5,  g: 0.2,  cat: 'Legumes', un: 120, unNome: 'unidade' },
  { n: 'Brócolis cozido',               p: 2.8,  c: 4,    g: 0.4,  cat: 'Legumes' },
  { n: 'Couve refogada',                p: 3,    c: 5,    g: 3,    cat: 'Legumes' },
  { n: 'Abobrinha cozida',              p: 1,    c: 3,    g: 0.2,  cat: 'Legumes' },
  { n: 'Cenoura crua',                  p: 1,    c: 8,    g: 0.2,  cat: 'Legumes' },
  { n: 'Beterraba cozida',              p: 1.5,  c: 9,    g: 0.1,  cat: 'Legumes' },
  { n: 'Chuchu cozido',                 p: 0.6,  c: 4,    g: 0.1,  cat: 'Legumes' },
  { n: 'Pepino',                        p: 0.7,  c: 2,    g: 0.1,  cat: 'Legumes' },
  { n: 'Repolho cru',                   p: 1.3,  c: 5,    g: 0.1,  cat: 'Legumes' },
  { n: 'Abóbora cozida',                p: 1,    c: 8,    g: 0.1,  cat: 'Legumes' },
  { n: 'Berinjela cozida',              p: 1,    c: 5,    g: 0.2,  cat: 'Legumes' },
  { n: 'Cebola',                        p: 1.2,  c: 9,    g: 0.1,  cat: 'Legumes' },
  { n: 'Pimentão',                      p: 1,    c: 5,    g: 0.2,  cat: 'Legumes' },
  { n: 'Vagem cozida',                  p: 1.8,  c: 7,    g: 0.2,  cat: 'Legumes' },

  // ── Frutas ─────────────────────────────────────────────
  { n: 'Banana prata',                  p: 1.3,  c: 26,   g: 0.1,  cat: 'Frutas', un: 70,  unNome: 'unidade' },
  { n: 'Banana nanica',                 p: 1.4,  c: 23,   g: 0.1,  cat: 'Frutas', un: 100, unNome: 'unidade' },
  { n: 'Maçã',                          p: 0.3,  c: 14,   g: 0.2,  cat: 'Frutas', un: 130, unNome: 'unidade' },
  { n: 'Laranja',                       p: 1,    c: 12,   g: 0.1,  cat: 'Frutas', un: 180, unNome: 'unidade' },
  { n: 'Mamão papaia',                  p: 0.5,  c: 11,   g: 0.1,  cat: 'Frutas' },
  { n: 'Melancia',                      p: 0.6,  c: 8,    g: 0.1,  cat: 'Frutas' },
  { n: 'Manga',                         p: 0.8,  c: 15,   g: 0.2,  cat: 'Frutas' },
  { n: 'Abacaxi',                       p: 0.5,  c: 13,   g: 0.1,  cat: 'Frutas' },
  { n: 'Uva',                           p: 0.7,  c: 16,   g: 0.2,  cat: 'Frutas' },
  { n: 'Morango',                       p: 0.7,  c: 7,    g: 0.3,  cat: 'Frutas' },
  { n: 'Abacate',                       p: 2,    c: 9,    g: 15,   cat: 'Frutas' },
  { n: 'Pera',                          p: 0.4,  c: 15,   g: 0.1,  cat: 'Frutas', un: 130, unNome: 'unidade' },
  { n: 'Melão',                         p: 0.7,  c: 8,    g: 0.1,  cat: 'Frutas' },
  { n: 'Tangerina',                     p: 0.8,  c: 13,   g: 0.2,  cat: 'Frutas', un: 130, unNome: 'unidade' },
  { n: 'Kiwi',                          p: 1.1,  c: 15,   g: 0.5,  cat: 'Frutas', un: 75,  unNome: 'unidade' },
  { n: 'Açaí polpa sem açúcar',         p: 1,    c: 6,    g: 5,    cat: 'Frutas' },

  // ── Gorduras e oleaginosas ─────────────────────────────
  { n: 'Azeite de oliva',               p: 0,    c: 0,    g: 100,  cat: 'Gorduras', un: 8,  unNome: 'colher sopa' },
  { n: 'Óleo de soja',                  p: 0,    c: 0,    g: 100,  cat: 'Gorduras', un: 8,  unNome: 'colher sopa' },
  { n: 'Castanha de caju',              p: 18,   c: 30,   g: 44,   cat: 'Gorduras' },
  { n: 'Castanha do Pará',              p: 14,   c: 12,   g: 67,   cat: 'Gorduras', un: 5, unNome: 'unidade' },
  { n: 'Amendoim torrado',              p: 26,   c: 20,   g: 49,   cat: 'Gorduras' },
  { n: 'Pasta de amendoim integral',    p: 25,   c: 20,   g: 50,   cat: 'Gorduras', un: 15, unNome: 'colher sopa' },
  { n: 'Amêndoa',                       p: 21,   c: 22,   g: 50,   cat: 'Gorduras' },
  { n: 'Nozes',                         p: 15,   c: 14,   g: 65,   cat: 'Gorduras' },
  { n: 'Maionese',                      p: 1,    c: 3,    g: 75,   cat: 'Gorduras' },
  { n: 'Maionese light',                p: 1,    c: 8,    g: 30,   cat: 'Gorduras' },

  // ── Bebidas ────────────────────────────────────────────
  { n: 'Café sem açúcar',               p: 0.1,  c: 0,    g: 0,    cat: 'Bebidas', un: 50,  unNome: 'cafezinho' },
  { n: 'Refrigerante comum',            p: 0,    c: 11,   g: 0,    cat: 'Bebidas', un: 350, unNome: 'lata' },
  { n: 'Refrigerante zero',             p: 0,    c: 0,    g: 0,    cat: 'Bebidas', un: 350, unNome: 'lata' },
  { n: 'Suco de laranja natural',       p: 0.7,  c: 10,   g: 0.1,  cat: 'Bebidas', un: 200, unNome: 'copo' },
  { n: 'Cerveja',                       p: 0.5,  c: 3.5,  g: 0,    cat: 'Bebidas', un: 350, unNome: 'lata' },
  { n: 'Vinho tinto seco',              p: 0.1,  c: 2.6,  g: 0,    cat: 'Bebidas', un: 150, unNome: 'taça' },
  { n: 'Água de coco',                  p: 0.3,  c: 5,    g: 0,    cat: 'Bebidas', un: 200, unNome: 'copo' },

  // ── Ultraprocessados e doces ───────────────────────────
  { n: 'Chocolate ao leite',            p: 7,    c: 58,   g: 30,   cat: 'Doces' },
  { n: 'Chocolate 70% cacau',           p: 8,    c: 33,   g: 42,   cat: 'Doces' },
  { n: 'Biscoito recheado',             p: 5,    c: 70,   g: 20,   cat: 'Doces' },
  { n: 'Sorvete de massa',              p: 3.5,  c: 25,   g: 11,   cat: 'Doces' },
  { n: 'Bolo simples',                  p: 5,    c: 50,   g: 12,   cat: 'Doces' },
  { n: 'Brigadeiro',                    p: 4,    c: 55,   g: 12,   cat: 'Doces', un: 20, unNome: 'unidade' },
  { n: 'Açúcar refinado',               p: 0,    c: 100,  g: 0,    cat: 'Doces', un: 5,  unNome: 'colher chá' },
  { n: 'Mel',                           p: 0.3,  c: 82,   g: 0,    cat: 'Doces' },
  { n: 'Salgadinho de pacote',          p: 6,    c: 60,   g: 28,   cat: 'Doces' },
  { n: 'Pizza mussarela',               p: 11,   c: 30,   g: 10,   cat: 'Prontos', un: 100, unNome: 'fatia' },
  { n: 'Hambúrguer de fast food',       p: 14,   c: 25,   g: 14,   cat: 'Prontos' },
  { n: 'Coxinha frita',                 p: 7,    c: 25,   g: 16,   cat: 'Prontos', un: 80, unNome: 'unidade' },
  { n: 'Pastel de carne frito',         p: 9,    c: 28,   g: 20,   cat: 'Prontos', un: 100, unNome: 'unidade' },
  { n: 'Marmita executiva média',       p: 12,   c: 20,   g: 8,    cat: 'Prontos' },
  { n: 'Estrogonofe de frango',         p: 13,   c: 6,    g: 12,   cat: 'Prontos' },
  { n: 'Feijoada',                      p: 10,   c: 8,    g: 12,   cat: 'Prontos' },
  { n: 'Farofa',                        p: 2,    c: 60,   g: 12,   cat: 'Prontos' }
];

/* ══════════════════════════════════════════════════════════
   BIBLIOTECA DE EXERCÍCIOS
   gm = grupo muscular | eq = equipamento
   imp = impacto articular (baixo/medio/alto)
   ══════════════════════════════════════════════════════════ */

const EXERCICIOS = [
  // Pernas
  { n: 'Leg press 45°',            gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Leg press horizontal',     gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Cadeira extensora',        gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Cadeira flexora',          gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Mesa flexora',             gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Agachamento no Smith',     gm: 'Pernas',   eq: 'Máquina',  imp: 'medio' },
  { n: 'Agachamento livre',        gm: 'Pernas',   eq: 'Barra',    imp: 'alto'  },
  { n: 'Agachamento goblet',       gm: 'Pernas',   eq: 'Halter',   imp: 'medio' },
  { n: 'Cadeira adutora',          gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Cadeira abdutora',         gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Elevação pélvica',         gm: 'Glúteos',  eq: 'Barra',    imp: 'baixo' },
  { n: 'Glúteo na máquina',        gm: 'Glúteos',  eq: 'Máquina',  imp: 'baixo' },
  { n: 'Panturrilha em pé',        gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Panturrilha sentado',      gm: 'Pernas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Stiff com halteres',       gm: 'Pernas',   eq: 'Halter',   imp: 'medio' },
  { n: 'Afundo com halteres',      gm: 'Pernas',   eq: 'Halter',   imp: 'alto'  },

  // Peito
  { n: 'Supino máquina',           gm: 'Peito',    eq: 'Máquina',  imp: 'baixo' },
  { n: 'Supino reto com halteres', gm: 'Peito',    eq: 'Halter',   imp: 'baixo' },
  { n: 'Supino reto com barra',    gm: 'Peito',    eq: 'Barra',    imp: 'medio' },
  { n: 'Supino inclinado máquina', gm: 'Peito',    eq: 'Máquina',  imp: 'baixo' },
  { n: 'Supino inclinado halteres',gm: 'Peito',    eq: 'Halter',   imp: 'baixo' },
  { n: 'Crucifixo máquina (voador)',gm: 'Peito',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Crossover na polia',       gm: 'Peito',    eq: 'Polia',    imp: 'baixo' },
  { n: 'Flexão de braço',          gm: 'Peito',    eq: 'Livre',    imp: 'medio' },

  // Costas
  { n: 'Puxada alta frontal',      gm: 'Costas',   eq: 'Polia',    imp: 'baixo' },
  { n: 'Puxada supinada',          gm: 'Costas',   eq: 'Polia',    imp: 'baixo' },
  { n: 'Remada baixa',             gm: 'Costas',   eq: 'Polia',    imp: 'baixo' },
  { n: 'Remada máquina',           gm: 'Costas',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Remada curvada com barra', gm: 'Costas',   eq: 'Barra',    imp: 'alto'  },
  { n: 'Remada unilateral halter', gm: 'Costas',   eq: 'Halter',   imp: 'medio' },
  { n: 'Pulldown na polia',        gm: 'Costas',   eq: 'Polia',    imp: 'baixo' },
  { n: 'Levantamento terra',       gm: 'Costas',   eq: 'Barra',    imp: 'alto'  },

  // Ombros
  { n: 'Desenvolvimento máquina',  gm: 'Ombros',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Desenvolvimento halteres', gm: 'Ombros',   eq: 'Halter',   imp: 'baixo' },
  { n: 'Elevação lateral',         gm: 'Ombros',   eq: 'Halter',   imp: 'baixo' },
  { n: 'Elevação frontal',         gm: 'Ombros',   eq: 'Halter',   imp: 'baixo' },
  { n: 'Crucifixo inverso',        gm: 'Ombros',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Encolhimento de ombros',   gm: 'Ombros',   eq: 'Halter',   imp: 'baixo' },

  // Bíceps / Tríceps
  { n: 'Rosca direta',             gm: 'Bíceps',   eq: 'Barra',    imp: 'baixo' },
  { n: 'Rosca alternada',          gm: 'Bíceps',   eq: 'Halter',   imp: 'baixo' },
  { n: 'Rosca martelo',            gm: 'Bíceps',   eq: 'Halter',   imp: 'baixo' },
  { n: 'Rosca scott',              gm: 'Bíceps',   eq: 'Máquina',  imp: 'baixo' },
  { n: 'Tríceps corda',            gm: 'Tríceps',  eq: 'Polia',    imp: 'baixo' },
  { n: 'Tríceps barra reta',       gm: 'Tríceps',  eq: 'Polia',    imp: 'baixo' },
  { n: 'Tríceps francês',          gm: 'Tríceps',  eq: 'Halter',   imp: 'baixo' },
  { n: 'Tríceps testa',            gm: 'Tríceps',  eq: 'Barra',    imp: 'baixo' },
  { n: 'Mergulho no banco',        gm: 'Tríceps',  eq: 'Livre',    imp: 'medio' },

  // Core
  { n: 'Prancha frontal',          gm: 'Core',     eq: 'Livre',    imp: 'baixo', tempo: true },
  { n: 'Prancha lateral',          gm: 'Core',     eq: 'Livre',    imp: 'baixo', tempo: true },
  { n: 'Abdominal máquina',        gm: 'Core',     eq: 'Máquina',  imp: 'baixo' },
  { n: 'Abdominal supra',          gm: 'Core',     eq: 'Livre',    imp: 'baixo' },
  { n: 'Elevação de pernas',       gm: 'Core',     eq: 'Livre',    imp: 'medio' },

  // Cardio
  { n: 'Caminhada na esteira',     gm: 'Cardio',   eq: 'Esteira',  imp: 'baixo', tempo: true },
  { n: 'Esteira inclinada',        gm: 'Cardio',   eq: 'Esteira',  imp: 'baixo', tempo: true },
  { n: 'Bicicleta ergométrica',    gm: 'Cardio',   eq: 'Bike',     imp: 'baixo', tempo: true },
  { n: 'Elíptico',                 gm: 'Cardio',   eq: 'Elíptico', imp: 'baixo', tempo: true },
  { n: 'Escada / transport',       gm: 'Cardio',   eq: 'Máquina',  imp: 'medio', tempo: true }
];

/* ══════════════════════════════════════════════════════════
   ROTINAS PADRÃO — Full Body A/B, foco em baixo impacto
   ══════════════════════════════════════════════════════════ */

const ROTINAS_PADRAO = {
  A: {
    nome: 'Full Body A',
    ex: [
      { n: 'Leg press 45°',            series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Supino máquina',           series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Remada baixa',             series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Desenvolvimento máquina',  series: 2, repMin: 10, repMax: 15, descanso: 75 },
      { n: 'Cadeira flexora',          series: 3, repMin: 10, repMax: 15, descanso: 75 },
      { n: 'Prancha frontal',          series: 3, repMin: 20, repMax: 40, descanso: 60 }
    ]
  },
  B: {
    nome: 'Full Body B',
    ex: [
      { n: 'Cadeira extensora',        series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Puxada alta frontal',      series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Supino inclinado máquina', series: 3, repMin: 10, repMax: 15, descanso: 90 },
      { n: 'Elevação lateral',         series: 2, repMin: 12, repMax: 15, descanso: 60 },
      { n: 'Panturrilha em pé',        series: 3, repMin: 12, repMax: 20, descanso: 60 },
      { n: 'Rosca direta',             series: 2, repMin: 10, repMax: 15, descanso: 60 }
    ]
  },
  C: {
    nome: 'Cardio (dias livres)',
    ex: [
      { n: 'Esteira inclinada',        series: 1, repMin: 20, repMax: 30, descanso: 0 }
    ]
  }
};

/* ══════════════════════════════════════════════════════════
   AMPLIAÇÃO — produtos industrializados, padaria, delivery,
   congelados, molhos e bebidas.

   Campo novo: `alc` = gramas de álcool por 100 ml. Álcool tem
   7 kcal/g e não aparece em proteína, carboidrato nem gordura.
   Sem esse campo, uma dose de destilado seria contada como
   zero caloria e o vinho como um sexto do que realmente é.
   ══════════════════════════════════════════════════════════ */

ALIMENTOS.push(

  // ── Carnes e embutidos ───────────────────────────────
  { n: 'Frango desfiado cozido',        p: 29,  c: 0,   g: 4,   cat: 'Carnes' },
  { n: 'Filé de frango à milanesa',     p: 20,  c: 15,  g: 14,  cat: 'Carnes' },
  { n: 'Nuggets de frango',             p: 14,  c: 16,  g: 18,  cat: 'Carnes', un: 17, unNome: 'unidade' },
  { n: 'Frango à passarinho frito',     p: 25,  c: 5,   g: 20,  cat: 'Carnes' },
  { n: 'Hambúrguer bovino grelhado',    p: 24,  c: 1,   g: 17,  cat: 'Carnes', un: 90, unNome: 'unidade' },
  { n: 'Almôndega ao molho',            p: 14,  c: 6,   g: 12,  cat: 'Carnes' },
  { n: 'Carne moída refogada',          p: 17,  c: 4,   g: 10,  cat: 'Carnes' },
  { n: 'Bife acebolado',                p: 26,  c: 3,   g: 12,  cat: 'Carnes' },
  { n: 'Maminha grelhada',              p: 30,  c: 0,   g: 11,  cat: 'Carnes' },
  { n: 'Fraldinha grelhada',            p: 28,  c: 0,   g: 14,  cat: 'Carnes' },
  { n: 'Cupim assado',                  p: 24,  c: 0,   g: 28,  cat: 'Carnes' },
  { n: 'Coração de frango grelhado',    p: 26,  c: 0,   g: 10,  cat: 'Carnes' },
  { n: 'Fígado bovino grelhado',        p: 29,  c: 4,   g: 5,   cat: 'Carnes' },
  { n: 'Pernil suíno assado',           p: 28,  c: 0,   g: 12,  cat: 'Carnes' },
  { n: 'Costelinha suína assada',       p: 24,  c: 0,   g: 25,  cat: 'Carnes' },
  { n: 'Salsicha',                      p: 12,  c: 3,   g: 25,  cat: 'Carnes', un: 50, unNome: 'unidade' },
  { n: 'Mortadela',                     p: 13,  c: 3,   g: 21,  cat: 'Carnes', un: 20, unNome: 'fatia' },
  { n: 'Salame',                        p: 25,  c: 2,   g: 33,  cat: 'Carnes', un: 8,  unNome: 'fatia' },
  { n: 'Peito de frango com requeijão', p: 24,  c: 2,   g: 12,  cat: 'Carnes' },

  // ── Ovos ─────────────────────────────────────────────
  { n: 'Ovo mexido',                    p: 13,  c: 1,   g: 14,  cat: 'Ovos', un: 55, unNome: 'ovo' },
  { n: 'Ovo frito',                     p: 14,  c: 1,   g: 17,  cat: 'Ovos', un: 55, unNome: 'ovo' },
  { n: 'Ovo cozido',                    p: 13,  c: 1,   g: 10,  cat: 'Ovos', un: 50, unNome: 'ovo' },
  { n: 'Ovo de codorna',                p: 13,  c: 0.4, g: 11,  cat: 'Ovos', un: 10, unNome: 'unidade' },
  { n: 'Omelete simples',               p: 12,  c: 1,   g: 12,  cat: 'Ovos' },

  // ── Laticínios ───────────────────────────────────────
  { n: 'Iogurte proteico (tipo YoPro)', p: 10,  c: 5,   g: 0,   cat: 'Laticínios', un: 250, unNome: 'garrafa' },
  { n: 'Iogurte grego tradicional',     p: 5,   c: 12,  g: 4,   cat: 'Laticínios', un: 100, unNome: 'pote' },
  { n: 'Iogurte de morango adoçado',    p: 3,   c: 13,  g: 2,   cat: 'Laticínios', un: 170, unNome: 'pote' },
  { n: 'Bebida láctea',                 p: 2.5, c: 11,  g: 1.5, cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Leite fermentado (tipo Yakult)',p: 1.5, c: 16,  g: 0,   cat: 'Laticínios', un: 80, unNome: 'frasco' },
  { n: 'Petit suisse (tipo Danoninho)', p: 6,   c: 17,  g: 3,   cat: 'Laticínios', un: 45, unNome: 'unidade' },
  { n: 'Queijo coalho',                 p: 24,  c: 2,   g: 25,  cat: 'Laticínios' },
  { n: 'Queijo parmesão ralado',        p: 35,  c: 4,   g: 28,  cat: 'Laticínios', un: 5, unNome: 'colher sopa' },
  { n: 'Queijo cheddar',                p: 23,  c: 2,   g: 33,  cat: 'Laticínios', un: 20, unNome: 'fatia' },
  { n: 'Queijo branco light',           p: 16,  c: 3,   g: 10,  cat: 'Laticínios' },
  { n: 'Catupiry / requeijão cremoso',  p: 9,   c: 3,   g: 25,  cat: 'Laticínios', un: 15, unNome: 'colher sopa' },
  { n: 'Cream cheese tradicional',      p: 6,   c: 4,   g: 34,  cat: 'Laticínios' },
  { n: 'Creme de leite',                p: 2,   c: 4,   g: 20,  cat: 'Laticínios' },
  { n: 'Leite condensado',              p: 7,   c: 57,  g: 8,   cat: 'Laticínios', un: 20, unNome: 'colher sopa' },
  { n: 'Leite em pó integral',          p: 26,  c: 38,  g: 26,  cat: 'Laticínios', un: 15, unNome: 'colher sopa' },
  { n: 'Leite semidesnatado',           p: 3.3, c: 4.8, g: 1.5, cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Leite sem lactose',             p: 3.2, c: 4.7, g: 3,   cat: 'Laticínios', un: 200, unNome: 'copo' },

  // ── Suplementos ──────────────────────────────────────
  { n: 'Barra de proteína',             p: 30,  c: 40,  g: 12,  cat: 'Suplementos', un: 60, unNome: 'barra' },
  { n: 'Hipercalórico em pó',           p: 20,  c: 60,  g: 5,   cat: 'Suplementos', un: 100, unNome: 'dose' },
  { n: 'Maltodextrina',                 p: 0,   c: 94,  g: 0,   cat: 'Suplementos', un: 30, unNome: 'dose' },
  { n: 'Colágeno hidrolisado',          p: 90,  c: 0,   g: 0,   cat: 'Suplementos', un: 10, unNome: 'dose' },
  { n: 'BCAA em pó',                    p: 0,   c: 0,   g: 0,   cat: 'Suplementos', un: 5,  unNome: 'dose' },
  { n: 'Pré-treino',                    p: 0,   c: 10,  g: 0,   cat: 'Suplementos', un: 10, unNome: 'dose' },
  { n: 'Ômega 3 (cápsula)',             p: 0,   c: 0,   g: 100, cat: 'Suplementos', un: 1,  unNome: 'cápsula' },
  { n: 'Multivitamínico',               p: 0,   c: 0,   g: 0,   cat: 'Suplementos', un: 1,  unNome: 'cápsula' },

  // ── Cereais, pães e massas ───────────────────────────
  { n: 'Pão francês integral',          p: 9,   c: 52,  g: 3,   cat: 'Cereais', un: 50, unNome: 'unidade' },
  { n: 'Bisnaguinha',                   p: 8,   c: 55,  g: 6,   cat: 'Cereais', un: 25, unNome: 'unidade' },
  { n: 'Pão de hambúrguer',             p: 9,   c: 50,  g: 5,   cat: 'Cereais', un: 50, unNome: 'unidade' },
  { n: 'Pão sírio',                     p: 9,   c: 55,  g: 2,   cat: 'Cereais', un: 60, unNome: 'unidade' },
  { n: 'Tortilha / wrap de trigo',      p: 8,   c: 50,  g: 8,   cat: 'Cereais', un: 45, unNome: 'unidade' },
  { n: 'Macarrão instantâneo',          p: 10,  c: 60,  g: 18,  cat: 'Cereais', un: 80, unNome: 'pacote' },
  { n: 'Corn flakes',                   p: 7,   c: 84,  g: 0.4, cat: 'Cereais' },
  { n: 'Sucrilhos açucarados',          p: 6,   c: 85,  g: 1,   cat: 'Cereais' },
  { n: 'Farelo de aveia',               p: 16,  c: 50,  g: 9,   cat: 'Cereais', un: 15, unNome: 'colher sopa' },
  { n: 'Farinha de aveia',              p: 14,  c: 60,  g: 8,   cat: 'Cereais', un: 15, unNome: 'colher sopa' },
  { n: 'Quinoa cozida',                 p: 4,   c: 21,  g: 2,   cat: 'Cereais' },
  { n: 'Crepioca (ovo + goma)',         p: 10,  c: 25,  g: 7,   cat: 'Cereais' },
  { n: 'Panqueca simples',              p: 6,   c: 30,  g: 8,   cat: 'Cereais', un: 60, unNome: 'unidade' },
  { n: 'Arroz à grega',                 p: 3,   c: 27,  g: 3,   cat: 'Cereais' },
  { n: 'Macarrão ao sugo',              p: 5,   c: 25,  g: 3,   cat: 'Cereais' },
  { n: 'Macarrão à carbonara',          p: 9,   c: 24,  g: 12,  cat: 'Cereais' },

  // ── Padaria ──────────────────────────────────────────
  { n: 'Misto quente',                  p: 14,  c: 30,  g: 14,  cat: 'Padaria', un: 120, unNome: 'unidade' },
  { n: 'Pão na chapa com manteiga',     p: 8,   c: 50,  g: 12,  cat: 'Padaria', un: 60,  unNome: 'unidade' },
  { n: 'Croissant',                     p: 8,   c: 45,  g: 21,  cat: 'Padaria', un: 60,  unNome: 'unidade' },
  { n: 'Pão doce',                      p: 8,   c: 50,  g: 8,   cat: 'Padaria', un: 60,  unNome: 'unidade' },
  { n: 'Sonho',                         p: 6,   c: 45,  g: 15,  cat: 'Padaria', un: 80,  unNome: 'unidade' },
  { n: 'Enroladinho de salsicha',       p: 8,   c: 35,  g: 14,  cat: 'Padaria', un: 70,  unNome: 'unidade' },
  { n: 'Empada de frango',              p: 8,   c: 30,  g: 18,  cat: 'Padaria', un: 80,  unNome: 'unidade' },
  { n: 'Torta de frango',               p: 8,   c: 25,  g: 14,  cat: 'Padaria' },
  { n: 'Quibe frito',                   p: 12,  c: 20,  g: 15,  cat: 'Padaria', un: 80,  unNome: 'unidade' },
  { n: 'Esfiha de carne',               p: 11,  c: 30,  g: 10,  cat: 'Padaria', un: 80,  unNome: 'unidade' },
  { n: 'Pastel de queijo frito',        p: 9,   c: 30,  g: 22,  cat: 'Padaria', un: 100, unNome: 'unidade' },
  { n: 'Bolo de cenoura com cobertura', p: 4,   c: 55,  g: 14,  cat: 'Padaria' },
  { n: 'Bolo de fubá',                  p: 5,   c: 50,  g: 12,  cat: 'Padaria' },
  { n: 'Bolo de chocolate',             p: 5,   c: 52,  g: 16,  cat: 'Padaria' },

  // ── Pratos prontos e delivery ────────────────────────
  { n: 'X-burger',                      p: 14,  c: 24,  g: 14,  cat: 'Prontos', un: 180, unNome: 'lanche' },
  { n: 'X-salada',                      p: 14,  c: 22,  g: 14,  cat: 'Prontos', un: 200, unNome: 'lanche' },
  { n: 'X-bacon',                       p: 16,  c: 22,  g: 20,  cat: 'Prontos', un: 200, unNome: 'lanche' },
  { n: 'Cachorro-quente',               p: 11,  c: 28,  g: 12,  cat: 'Prontos', un: 150, unNome: 'unidade' },
  { n: 'Batata frita de fast food',     p: 3,   c: 38,  g: 16,  cat: 'Prontos', un: 115, unNome: 'porção média' },
  { n: 'Pizza calabresa',               p: 12,  c: 28,  g: 13,  cat: 'Prontos', un: 100, unNome: 'fatia' },
  { n: 'Pizza portuguesa',              p: 11,  c: 28,  g: 11,  cat: 'Prontos', un: 100, unNome: 'fatia' },
  { n: 'Lasanha à bolonhesa',           p: 10,  c: 15,  g: 9,   cat: 'Prontos' },
  { n: 'Escondidinho de carne',         p: 10,  c: 14,  g: 9,   cat: 'Prontos' },
  { n: 'Parmegiana de frango',          p: 18,  c: 12,  g: 15,  cat: 'Prontos' },
  { n: 'Yakisoba',                      p: 8,   c: 20,  g: 6,   cat: 'Prontos' },
  { n: 'Sushi (combinado)',             p: 7,   c: 25,  g: 3,   cat: 'Prontos', un: 20, unNome: 'peça' },
  { n: 'Temaki de salmão',              p: 9,   c: 22,  g: 6,   cat: 'Prontos', un: 180, unNome: 'unidade' },
  { n: 'Virado à paulista',             p: 12,  c: 25,  g: 14,  cat: 'Prontos' },
  { n: 'Arroz carreteiro',              p: 10,  c: 22,  g: 8,   cat: 'Prontos' },
  { n: 'Baião de dois',                 p: 8,   c: 24,  g: 7,   cat: 'Prontos' },
  { n: 'Galinhada',                     p: 12,  c: 20,  g: 7,   cat: 'Prontos' },
  { n: 'Frango grelhado com legumes',   p: 20,  c: 6,   g: 6,   cat: 'Prontos' },
  { n: 'Sopa de legumes',               p: 2,   c: 7,   g: 1.5, cat: 'Prontos' },
  { n: 'Caldo verde',                   p: 4,   c: 10,  g: 5,   cat: 'Prontos' },
  { n: 'Salada de maionese',            p: 2,   c: 12,  g: 15,  cat: 'Prontos' },
  { n: 'Açaí com granola e banana',     p: 2,   c: 24,  g: 5,   cat: 'Prontos', un: 300, unNome: 'copo' },

  // ── Congelados ───────────────────────────────────────
  { n: 'Hambúrguer congelado bovino',   p: 15,  c: 3,   g: 20,  cat: 'Congelados', un: 56, unNome: 'unidade' },
  { n: 'Empanado de frango congelado',  p: 13,  c: 17,  g: 13,  cat: 'Congelados' },
  { n: 'Steak de frango congelado',     p: 16,  c: 8,   g: 10,  cat: 'Congelados', un: 100, unNome: 'unidade' },
  { n: 'Pizza congelada',               p: 11,  c: 27,  g: 10,  cat: 'Congelados' },
  { n: 'Lasanha congelada',             p: 8,   c: 14,  g: 7,   cat: 'Congelados' },
  { n: 'Batata congelada assada',       p: 3,   c: 25,  g: 5,   cat: 'Congelados' },
  { n: 'Polpa de fruta congelada',      p: 0.5, c: 10,  g: 0,   cat: 'Congelados', un: 100, unNome: 'polpa' },

  // ── Legumes e verduras ───────────────────────────────
  { n: 'Quiabo refogado',               p: 2,   c: 7,   g: 2,   cat: 'Legumes' },
  { n: 'Jiló refogado',                 p: 1.4, c: 6,   g: 2,   cat: 'Legumes' },
  { n: 'Rúcula',                        p: 2.6, c: 3.6, g: 0.7, cat: 'Legumes' },
  { n: 'Agrião',                        p: 2.3, c: 1.3, g: 0.1, cat: 'Legumes' },
  { n: 'Espinafre cozido',              p: 3,   c: 4,   g: 0.3, cat: 'Legumes' },
  { n: 'Couve-flor cozida',             p: 1.8, c: 4,   g: 0.2, cat: 'Legumes' },
  { n: 'Milho verde em conserva',       p: 3,   c: 19,  g: 1,   cat: 'Legumes' },
  { n: 'Palmito em conserva',           p: 2,   c: 4,   g: 0.3, cat: 'Legumes' },
  { n: 'Azeitona verde',                p: 1,   c: 4,   g: 15,  cat: 'Legumes' },
  { n: 'Champignon em conserva',        p: 3,   c: 3,   g: 0.3, cat: 'Legumes' },
  { n: 'Alho',                          p: 6,   c: 33,  g: 0.5, cat: 'Legumes', un: 3, unNome: 'dente' },

  // ── Tubérculos ───────────────────────────────────────
  { n: 'Mandioquinha cozida',           p: 1,   c: 24,  g: 0.2, cat: 'Tubérculos' },
  { n: 'Mandioca frita',                p: 2,   c: 35,  g: 14,  cat: 'Tubérculos' },
  { n: 'Batata doce assada',            p: 2,   c: 28,  g: 0.1, cat: 'Tubérculos' },

  // ── Frutas ───────────────────────────────────────────
  { n: 'Goiaba',                        p: 1,   c: 13,  g: 0.9, cat: 'Frutas', un: 130, unNome: 'unidade' },
  { n: 'Caqui',                         p: 0.6, c: 19,  g: 0.2, cat: 'Frutas', un: 130, unNome: 'unidade' },
  { n: 'Ameixa',                        p: 0.8, c: 13,  g: 0.3, cat: 'Frutas', un: 60,  unNome: 'unidade' },
  { n: 'Pêssego',                       p: 0.8, c: 11,  g: 0.1, cat: 'Frutas', un: 100, unNome: 'unidade' },
  { n: 'Figo',                          p: 1,   c: 16,  g: 0.3, cat: 'Frutas', un: 50,  unNome: 'unidade' },
  { n: 'Acerola',                       p: 0.9, c: 8,   g: 0.2, cat: 'Frutas' },
  { n: 'Jabuticaba',                    p: 0.6, c: 15,  g: 0.1, cat: 'Frutas' },
  { n: 'Maracujá (polpa)',              p: 2,   c: 12,  g: 0.7, cat: 'Frutas' },
  { n: 'Limão',                         p: 1,   c: 11,  g: 0.3, cat: 'Frutas', un: 70,  unNome: 'unidade' },
  { n: 'Coco fresco',                   p: 3.5, c: 10,  g: 33,  cat: 'Frutas' },
  { n: 'Uva passa',                     p: 3,   c: 79,  g: 0.5, cat: 'Frutas' },
  { n: 'Banana passa',                  p: 3,   c: 64,  g: 0.4, cat: 'Frutas' },

  // ── Molhos e temperos ────────────────────────────────
  { n: 'Ketchup',                       p: 1,   c: 26,  g: 0.2, cat: 'Molhos', un: 15, unNome: 'colher sopa' },
  { n: 'Mostarda',                      p: 4,   c: 5,   g: 4,   cat: 'Molhos', un: 15, unNome: 'colher sopa' },
  { n: 'Molho de tomate pronto',        p: 1.5, c: 7,   g: 1,   cat: 'Molhos' },
  { n: 'Molho barbecue',                p: 1,   c: 40,  g: 0.5, cat: 'Molhos', un: 15, unNome: 'colher sopa' },
  { n: 'Molho branco',                  p: 3,   c: 6,   g: 8,   cat: 'Molhos' },
  { n: 'Molho de alho',                 p: 1,   c: 4,   g: 30,  cat: 'Molhos', un: 15, unNome: 'colher sopa' },
  { n: 'Shoyu',                         p: 6,   c: 6,   g: 0,   cat: 'Molhos', un: 15, unNome: 'colher sopa' },
  { n: 'Vinagrete',                     p: 1,   c: 4,   g: 3,   cat: 'Molhos' },

  // ── Doces, biscoitos e snacks ────────────────────────
  { n: 'Creme de avelã (tipo Nutella)', p: 6,   c: 57,  g: 31,  cat: 'Doces', un: 20, unNome: 'colher sopa' },
  { n: 'Achocolatado em pó',            p: 4,   c: 82,  g: 2,   cat: 'Doces', un: 20, unNome: 'colher sopa' },
  { n: 'Achocolatado pronto',           p: 3,   c: 11,  g: 1.5, cat: 'Doces', un: 200, unNome: 'caixinha' },
  { n: 'Paçoca',                        p: 12,  c: 50,  g: 28,  cat: 'Doces', un: 20, unNome: 'unidade' },
  { n: 'Doce de leite',                 p: 6,   c: 55,  g: 7,   cat: 'Doces' },
  { n: 'Goiabada',                      p: 0.5, c: 70,  g: 0.1, cat: 'Doces' },
  { n: 'Cocada',                        p: 3,   c: 60,  g: 15,  cat: 'Doces' },
  { n: 'Pudim de leite',                p: 6,   c: 35,  g: 7,   cat: 'Doces' },
  { n: 'Mousse de chocolate',           p: 4,   c: 30,  g: 12,  cat: 'Doces' },
  { n: 'Gelatina pronta',               p: 1.5, c: 14,  g: 0,   cat: 'Doces' },
  { n: 'Gelatina zero',                 p: 1,   c: 0,   g: 0,   cat: 'Doces' },
  { n: 'Sorvete de palito',             p: 2,   c: 25,  g: 5,   cat: 'Doces', un: 60, unNome: 'unidade' },
  { n: 'Barra de cereal',               p: 5,   c: 70,  g: 10,  cat: 'Doces', un: 25, unNome: 'barra' },
  { n: 'Biscoito água e sal',           p: 9,   c: 70,  g: 12,  cat: 'Doces', un: 6,  unNome: 'unidade' },
  { n: 'Biscoito salgado (tipo Club)',  p: 9,   c: 65,  g: 18,  cat: 'Doces', un: 26, unNome: 'pacote' },
  { n: 'Biscoito maisena',              p: 7,   c: 74,  g: 11,  cat: 'Doces', un: 7,  unNome: 'unidade' },
  { n: 'Pipoca de micro-ondas',         p: 9,   c: 58,  g: 22,  cat: 'Doces' },
  { n: 'Amendoim japonês',              p: 16,  c: 50,  g: 25,  cat: 'Doces' },

  // ── Bebidas (com álcool onde houver) ─────────────────
  { n: 'Suco de caixinha (néctar)',     p: 0.3, c: 12,  g: 0,   cat: 'Bebidas', un: 200, unNome: 'caixinha' },
  { n: 'Suco em pó preparado',          p: 0,   c: 10,  g: 0,   cat: 'Bebidas', un: 200, unNome: 'copo' },
  { n: 'Chá gelado industrializado',    p: 0,   c: 7,   g: 0,   cat: 'Bebidas', un: 300, unNome: 'copo' },
  { n: 'Energético',                    p: 0,   c: 11,  g: 0,   cat: 'Bebidas', un: 250, unNome: 'lata' },
  { n: 'Isotônico',                     p: 0,   c: 6,   g: 0,   cat: 'Bebidas', un: 500, unNome: 'garrafa' },
  { n: 'Água tônica',                   p: 0,   c: 9,   g: 0,   cat: 'Bebidas', un: 350, unNome: 'lata' },
  { n: 'Café com leite',                p: 2,   c: 3,   g: 2,   cat: 'Bebidas', un: 200, unNome: 'xícara' },
  { n: 'Cappuccino pronto',             p: 3,   c: 18,  g: 4,   cat: 'Bebidas', un: 200, unNome: 'xícara' },
  { n: 'Chopp',                         p: 0.5, c: 3,   g: 0,   alc: 3.5,  cat: 'Bebidas', un: 300, unNome: 'copo' },
  { n: 'Cerveja long neck',             p: 0.5, c: 3.5, g: 0,   alc: 3.9,  cat: 'Bebidas', un: 355, unNome: 'garrafa' },
  { n: 'Vinho branco seco',             p: 0.1, c: 2.6, g: 0,   alc: 10.2, cat: 'Bebidas', un: 150, unNome: 'taça' },
  { n: 'Cachaça',                       p: 0,   c: 0,   g: 0,   alc: 38,   cat: 'Bebidas', un: 50,  unNome: 'dose' },
  { n: 'Whisky',                        p: 0,   c: 0,   g: 0,   alc: 40,   cat: 'Bebidas', un: 50,  unNome: 'dose' },
  { n: 'Vodka',                         p: 0,   c: 0,   g: 0,   alc: 40,   cat: 'Bebidas', un: 50,  unNome: 'dose' },
  { n: 'Caipirinha',                    p: 0,   c: 12,  g: 0,   alc: 12,   cat: 'Bebidas', un: 250, unNome: 'copo' },
  { n: 'Gin com tônica',                p: 0,   c: 6,   g: 0,   alc: 8,    cat: 'Bebidas', un: 300, unNome: 'copo' }
);

/* Corrige entradas antigas de bebida alcoólica que não tinham
   o campo `alc` e por isso apareciam com caloria quase zero. */
(function corrigirAlcool() {
  const ajustes = { 'Cerveja': 3.9, 'Vinho tinto seco': 10.6 };
  ALIMENTOS.forEach(a => { if (ajustes[a.n] != null && a.alc == null) a.alc = ajustes[a.n]; });
})();

/* ══════════════════════════════════════════════════════════
   AMPLIAÇÃO 3.0 — mais cobertura do dia a dia brasileiro
   ══════════════════════════════════════════════════════════ */

ALIMENTOS.push(
  // ── Carnes e preparos ────────────────────────────────
  { n: 'Frango assado inteiro (com pele)', p: 25, c: 0,  g: 14, cat: 'Carnes' },
  { n: 'Peito de frango cozido desfiado',  p: 30, c: 0,  g: 3,  cat: 'Carnes' },
  { n: 'Tirinhas de frango refogadas',     p: 26, c: 2,  g: 8,  cat: 'Carnes' },
  { n: 'Carne de panela (acém cozido)',    p: 27, c: 1,  g: 12, cat: 'Carnes' },
  { n: 'Músculo cozido',                   p: 29, c: 0,  g: 8,  cat: 'Carnes' },
  { n: 'Lagarto cozido',                   p: 31, c: 0,  g: 7,  cat: 'Carnes' },
  { n: 'Fígado acebolado',                 p: 26, c: 5,  g: 9,  cat: 'Carnes' },
  { n: 'Espetinho de carne',               p: 27, c: 1,  g: 15, cat: 'Carnes', un: 80, unNome: 'espeto' },
  { n: 'Espetinho de frango',              p: 26, c: 1,  g: 8,  cat: 'Carnes', un: 80, unNome: 'espeto' },
  { n: 'Pão de alho',                      p: 7,  c: 45, g: 15, cat: 'Carnes', un: 60, unNome: 'unidade' },
  { n: 'Peito de peru fatiado light',      p: 17, c: 2,  g: 1,  cat: 'Carnes', un: 15, unNome: 'fatia' },
  { n: 'Apresuntado',                      p: 14, c: 3,  g: 8,  cat: 'Carnes', un: 15, unNome: 'fatia' },
  { n: 'Frango empanado tipo tirinha',     p: 15, c: 18, g: 14, cat: 'Carnes' },
  { n: 'Panqueca de carne',                p: 11, c: 22, g: 10, cat: 'Carnes', un: 100, unNome: 'unidade' },

  // ── Peixes e frutos do mar ───────────────────────────
  { n: 'Sardinha grelhada',                p: 25, c: 0,  g: 10, cat: 'Peixes' },
  { n: 'Pescada frita',                    p: 22, c: 6,  g: 12, cat: 'Peixes' },
  { n: 'Tilápia empanada',                 p: 18, c: 14, g: 11, cat: 'Peixes' },
  { n: 'Salmão cru (sashimi)',             p: 20, c: 0,  g: 13, cat: 'Peixes' },
  { n: 'Polvo cozido',                     p: 25, c: 4,  g: 2,  cat: 'Peixes' },
  { n: 'Lula à dorê',                      p: 16, c: 14, g: 12, cat: 'Peixes' },
  { n: 'Mexilhão cozido',                  p: 24, c: 7,  g: 4,  cat: 'Peixes' },

  // ── Laticínios ───────────────────────────────────────
  { n: 'Queijo mussarela de búfala',       p: 18, c: 2,  g: 22, cat: 'Laticínios' },
  { n: 'Queijo provolone',                 p: 26, c: 2,  g: 27, cat: 'Laticínios', un: 20, unNome: 'fatia' },
  { n: 'Queijo gorgonzola',                p: 21, c: 2,  g: 29, cat: 'Laticínios' },
  { n: 'Queijo cottage light',             p: 13, c: 3,  g: 1,  cat: 'Laticínios' },
  { n: 'Iogurte natural com mel',          p: 4,  c: 16, g: 3,  cat: 'Laticínios', un: 170, unNome: 'pote' },
  { n: 'Kefir de leite',                   p: 3.3,c: 4.5,g: 3,  cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Leite de amêndoas sem açúcar',     p: 0.5,c: 0.5,g: 1.2,cat: 'Laticínios', un: 200, unNome: 'copo' },
  { n: 'Leite de coco',                    p: 2,  c: 3,  g: 21, cat: 'Laticínios' },
  { n: 'Manteiga ghee',                    p: 0,  c: 0,  g: 99, cat: 'Laticínios', un: 10, unNome: 'colher sopa' },

  // ── Cereais, pães e massas ───────────────────────────
  { n: 'Pão integral com grãos',           p: 11, c: 41, g: 6,  cat: 'Cereais', un: 30, unNome: 'fatia' },
  { n: 'Pão australiano',                  p: 8,  c: 50, g: 5,  cat: 'Cereais', un: 50, unNome: 'fatia' },
  { n: 'Pão de centeio',                   p: 9,  c: 48, g: 3,  cat: 'Cereais', un: 30, unNome: 'fatia' },
  { n: 'Baguete',                          p: 9,  c: 55, g: 2,  cat: 'Cereais' },
  { n: 'Nhoque de batata cozido',          p: 4,  c: 30, g: 2,  cat: 'Cereais' },
  { n: 'Ravioli cozido',                   p: 8,  c: 28, g: 6,  cat: 'Cereais' },
  { n: 'Arroz sete grãos cozido',          p: 4,  c: 24, g: 1.5,cat: 'Cereais' },
  { n: 'Arroz de couve-flor',              p: 2,  c: 4,  g: 0.3,cat: 'Cereais' },
  { n: 'Cuscuz marroquino cozido',         p: 4,  c: 23, g: 0.2,cat: 'Cereais' },
  { n: 'Trigo para quibe cozido',          p: 3,  c: 19, g: 0.2,cat: 'Cereais' },
  { n: 'Milho de pipoca (cru)',            p: 11, c: 78, g: 4,  cat: 'Cereais' },
  { n: 'Farinha de trigo',                 p: 10, c: 75, g: 1,  cat: 'Cereais' },
  { n: 'Goma de tapioca seca',             p: 0,  c: 88, g: 0,  cat: 'Cereais' },
  { n: 'Mingau de aveia com leite',        p: 4,  c: 14, g: 2,  cat: 'Cereais' },

  // ── Padaria e lanches ────────────────────────────────
  { n: 'Beirute',                          p: 16, c: 26, g: 15, cat: 'Padaria', un: 250, unNome: 'lanche' },
  { n: 'Bauru',                            p: 15, c: 27, g: 12, cat: 'Padaria', un: 200, unNome: 'lanche' },
  { n: 'Pão com ovo',                      p: 12, c: 38, g: 12, cat: 'Padaria', un: 110, unNome: 'unidade' },
  { n: 'Sanduíche natural',                p: 11, c: 27, g: 8,  cat: 'Padaria', un: 150, unNome: 'unidade' },
  { n: 'Croissant de presunto e queijo',   p: 13, c: 36, g: 20, cat: 'Padaria', un: 100, unNome: 'unidade' },
  { n: 'Rosquinha frita',                  p: 6,  c: 50, g: 18, cat: 'Padaria', un: 50,  unNome: 'unidade' },
  { n: 'Broa de milho',                    p: 6,  c: 52, g: 10, cat: 'Padaria' },
  { n: 'Bolo de banana',                   p: 5,  c: 48, g: 11, cat: 'Padaria' },
  { n: 'Torta salgada de legumes',         p: 7,  c: 24, g: 12, cat: 'Padaria' },
  { n: 'Folhado de frango',                p: 9,  c: 28, g: 20, cat: 'Padaria', un: 90, unNome: 'unidade' },
  { n: 'Churros com doce de leite',        p: 5,  c: 48, g: 18, cat: 'Padaria', un: 70, unNome: 'unidade' },

  // ── Pratos prontos ───────────────────────────────────
  { n: 'Marmita fitness frango e batata',  p: 15, c: 16, g: 4,  cat: 'Prontos', un: 350, unNome: 'marmita' },
  { n: 'Prato feito completo',             p: 13, c: 26, g: 11, cat: 'Prontos', un: 500, unNome: 'prato' },
  { n: 'Salada com frango grelhado',       p: 14, c: 5,  g: 6,  cat: 'Prontos' },
  { n: 'Panqueca de frango ao molho',      p: 12, c: 20, g: 9,  cat: 'Prontos' },
  { n: 'Risoto de frango',                 p: 9,  c: 24, g: 7,  cat: 'Prontos' },
  { n: 'Moqueca de peixe',                 p: 12, c: 4,  g: 10, cat: 'Prontos' },
  { n: 'Bobó de camarão',                  p: 9,  c: 12, g: 11, cat: 'Prontos' },
  { n: 'Carne de sol com mandioca',        p: 20, c: 20, g: 14, cat: 'Prontos' },
  { n: 'Frango xadrez',                    p: 14, c: 10, g: 8,  cat: 'Prontos' },
  { n: 'Rolinho primavera',                p: 6,  c: 28, g: 14, cat: 'Prontos', un: 50, unNome: 'unidade' },
  { n: 'Guioza',                           p: 9,  c: 22, g: 8,  cat: 'Prontos', un: 25, unNome: 'unidade' },
  { n: 'Tapioca com queijo',               p: 9,  c: 42, g: 12, cat: 'Prontos', un: 120, unNome: 'unidade' },
  { n: 'Açaí puro (tigela)',               p: 1,  c: 8,  g: 5,  cat: 'Prontos', un: 300, unNome: 'tigela' },
  { n: 'Salpicão',                         p: 8,  c: 10, g: 16, cat: 'Prontos' },
  { n: 'Maionese de batata',               p: 2,  c: 14, g: 12, cat: 'Prontos' },
  { n: 'Sopa de feijão',                   p: 5,  c: 12, g: 3,  cat: 'Prontos' },
  { n: 'Caldo de mandioca com carne',      p: 6,  c: 14, g: 6,  cat: 'Prontos' },

  // ── Legumes, verduras e conservas ────────────────────
  { n: 'Alho-poró',                        p: 1.5,c: 14, g: 0.3,cat: 'Legumes' },
  { n: 'Aspargo cozido',                   p: 2.4,c: 4,  g: 0.2,cat: 'Legumes' },
  { n: 'Acelga',                           p: 1.8,c: 3.7,g: 0.2,cat: 'Legumes' },
  { n: 'Almeirão',                         p: 1.7,c: 4.7,g: 0.3,cat: 'Legumes' },
  { n: 'Escarola',                         p: 1.3,c: 3.4,g: 0.2,cat: 'Legumes' },
  { n: 'Nabo cozido',                      p: 0.7,c: 5,  g: 0.1,cat: 'Legumes' },
  { n: 'Pepino em conserva',               p: 0.5,c: 2,  g: 0.2,cat: 'Legumes' },
  { n: 'Tomate seco',                      p: 5,  c: 23, g: 14, cat: 'Legumes' },
  { n: 'Molho de tomate caseiro',          p: 1.5,c: 6,  g: 3,  cat: 'Legumes' },
  { n: 'Abóbora cabotiá cozida',           p: 1.4,c: 9,  g: 0.2,cat: 'Legumes' },
  { n: 'Repolho refogado',                 p: 1.3,c: 6,  g: 3,  cat: 'Legumes' },
  { n: 'Couve-de-bruxelas cozida',         p: 2.5,c: 7,  g: 0.4,cat: 'Legumes' },

  // ── Frutas ───────────────────────────────────────────
  { n: 'Abacaxi em calda',                 p: 0.4,c: 20, g: 0.1,cat: 'Frutas' },
  { n: 'Salada de frutas',                 p: 0.7,c: 13, g: 0.2,cat: 'Frutas' },
  { n: 'Melancia em cubos',                p: 0.6,c: 8,  g: 0.1,cat: 'Frutas' },
  { n: 'Amora',                            p: 1.4,c: 10, g: 0.5,cat: 'Frutas' },
  { n: 'Mirtilo',                          p: 0.7,c: 14, g: 0.3,cat: 'Frutas' },
  { n: 'Framboesa',                        p: 1.2,c: 12, g: 0.7,cat: 'Frutas' },
  { n: 'Pitaya',                           p: 1.1,c: 13, g: 0.4,cat: 'Frutas' },
  { n: 'Graviola',                         p: 1,  c: 17, g: 0.3,cat: 'Frutas' },
  { n: 'Cupuaçu (polpa)',                  p: 1.7,c: 11, g: 1,  cat: 'Frutas' },
  { n: 'Damasco seco',                     p: 3.4,c: 63, g: 0.5,cat: 'Frutas' },
  { n: 'Tâmara',                           p: 2.5,c: 75, g: 0.4,cat: 'Frutas', un: 8, unNome: 'unidade' },
  { n: 'Ameixa seca',                      p: 2.2,c: 64, g: 0.4,cat: 'Frutas', un: 9, unNome: 'unidade' },

  // ── Gorduras e oleaginosas ───────────────────────────
  { n: 'Azeite extravirgem',               p: 0,  c: 0,  g: 100,cat: 'Gorduras', un: 8, unNome: 'colher sopa' },
  { n: 'Óleo de coco',                     p: 0,  c: 0,  g: 100,cat: 'Gorduras', un: 8, unNome: 'colher sopa' },
  { n: 'Pistache',                         p: 20, c: 28, g: 45, cat: 'Gorduras' },
  { n: 'Macadâmia',                        p: 8,  c: 14, g: 76, cat: 'Gorduras' },
  { n: 'Avelã',                            p: 15, c: 17, g: 61, cat: 'Gorduras' },
  { n: 'Semente de girassol',              p: 21, c: 20, g: 51, cat: 'Gorduras' },
  { n: 'Chia',                             p: 17, c: 42, g: 31, cat: 'Gorduras', un: 12, unNome: 'colher sopa' },
  { n: 'Linhaça',                          p: 18, c: 29, g: 42, cat: 'Gorduras', un: 12, unNome: 'colher sopa' },
  { n: 'Gergelim',                         p: 18, c: 23, g: 50, cat: 'Gorduras' },
  { n: 'Pasta de amendoim com whey',       p: 35, c: 18, g: 38, cat: 'Gorduras', un: 15, unNome: 'colher sopa' },

  // ── Leguminosas e tubérculos ─────────────────────────
  { n: 'Feijão fradinho cozido',           p: 5,  c: 14, g: 0.5,cat: 'Leguminosas' },
  { n: 'Feijão branco cozido',             p: 6,  c: 17, g: 0.4,cat: 'Leguminosas' },
  { n: 'Homus',                            p: 8,  c: 14, g: 10, cat: 'Leguminosas' },
  { n: 'Tofu',                             p: 8,  c: 2,  g: 5,  cat: 'Leguminosas' },
  { n: 'Proteína de soja texturizada',     p: 51, c: 30, g: 1,  cat: 'Leguminosas' },
  { n: 'Batata rústica assada',            p: 2.5,c: 22, g: 4,  cat: 'Tubérculos' },
  { n: 'Cará cozido',                      p: 1.5,c: 25, g: 0.1,cat: 'Tubérculos' },

  // ── Doces e bebidas ──────────────────────────────────
  { n: 'Chocolate 50% cacau',              p: 7,  c: 45, g: 35, cat: 'Doces' },
  { n: 'Bombom recheado',                  p: 6,  c: 55, g: 28, cat: 'Doces', un: 18, unNome: 'unidade' },
  { n: 'Bala de goma',                     p: 4,  c: 78, g: 0,  cat: 'Doces' },
  { n: 'Pé de moleque',                    p: 12, c: 55, g: 22, cat: 'Doces', un: 30, unNome: 'unidade' },
  { n: 'Quindim',                          p: 5,  c: 45, g: 14, cat: 'Doces', un: 40, unNome: 'unidade' },
  { n: 'Arroz doce',                       p: 3,  c: 28, g: 3,  cat: 'Doces' },
  { n: 'Canjica',                          p: 3,  c: 25, g: 4,  cat: 'Doces' },
  { n: 'Torta de limão',                   p: 4,  c: 40, g: 15, cat: 'Doces' },
  { n: 'Petit gateau',                     p: 5,  c: 45, g: 22, cat: 'Doces' },
  { n: 'Iogurte congelado (frozen)',       p: 4,  c: 22, g: 2,  cat: 'Doces' },
  { n: 'Suco verde (couve e limão)',       p: 1,  c: 7,  g: 0.2,cat: 'Bebidas', un: 300, unNome: 'copo' },
  { n: 'Suco de uva integral',             p: 0.4,c: 15, g: 0,  cat: 'Bebidas', un: 200, unNome: 'copo' },
  { n: 'Limonada adoçada',                 p: 0.1,c: 10, g: 0,  cat: 'Bebidas', un: 300, unNome: 'copo' },
  { n: 'Chá sem açúcar',                   p: 0,  c: 0,  g: 0,  cat: 'Bebidas', un: 200, unNome: 'xícara' },
  { n: 'Café expresso',                    p: 0.1,c: 0,  g: 0,  cat: 'Bebidas', un: 30,  unNome: 'dose' },
  { n: 'Leite com achocolatado',           p: 3,  c: 12, g: 3,  cat: 'Bebidas', un: 200, unNome: 'copo' },
  { n: 'Vitamina de banana com leite',     p: 3,  c: 14, g: 2,  cat: 'Bebidas', un: 300, unNome: 'copo' },
  { n: 'Caipiroska',                       p: 0,  c: 10, g: 0,  alc: 12, cat: 'Bebidas', un: 250, unNome: 'copo' },
  { n: 'Cerveja lata 350 ml',              p: 0.5,c: 3.5,g: 0,  alc: 3.9,cat: 'Bebidas', un: 350, unNome: 'lata' },
  { n: 'Espumante',                        p: 0.2,c: 4,  g: 0,  alc: 9.5,cat: 'Bebidas', un: 150, unNome: 'taça' },

  // ── Molhos e suplementos ─────────────────────────────
  { n: 'Molho pesto',                      p: 5,  c: 6,  g: 45, cat: 'Molhos' },
  { n: 'Molho de pimenta',                 p: 1,  c: 6,  g: 0.5,cat: 'Molhos' },
  { n: 'Molho tártaro',                    p: 1,  c: 6,  g: 40, cat: 'Molhos' },
  { n: 'Molho caesar',                     p: 2,  c: 5,  g: 38, cat: 'Molhos' },
  { n: 'Molho agridoce',                   p: 0.5,c: 45, g: 0.2,cat: 'Molhos' },
  { n: 'Geleia de frutas',                 p: 0.4,c: 60, g: 0.1,cat: 'Molhos', un: 20, unNome: 'colher sopa' },
  { n: 'Adoçante líquido',                 p: 0,  c: 0,  g: 0,  cat: 'Molhos', un: 1,  unNome: 'gota' },
  { n: 'Whey protein hidrolisado',         p: 85, c: 3,  g: 1,  cat: 'Suplementos', un: 30, unNome: 'scoop' },
  { n: 'Barra de proteína low carb',       p: 33, c: 25, g: 15, cat: 'Suplementos', un: 50, unNome: 'barra' },
  { n: 'Beta-alanina',                     p: 0,  c: 0,  g: 0,  cat: 'Suplementos', un: 3,  unNome: 'dose' },
  { n: 'Cafeína em cápsula',               p: 0,  c: 0,  g: 0,  cat: 'Suplementos', un: 1,  unNome: 'cápsula' },
  { n: 'Termogênico',                      p: 0,  c: 1,  g: 0,  cat: 'Suplementos', un: 1,  unNome: 'cápsula' }
);
