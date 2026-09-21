/* ══════════════════════════════════════════════════════════
   MESOCICLO — periodização de 12 semanas para fase de perda
   de gordura.

   Princípio: em déficit calórico o volume alto é o primeiro a
   comprometer a recuperação. A intensidade relativa é o que
   preserva massa magra. Por isso o ciclo mantém carga
   progressiva e controla volume, em vez do contrário.
   ══════════════════════════════════════════════════════════ */

const FASES = [
  { id: 'adap', nome: 'Adaptação', sem: [1, 2, 3],
    series: 2, repMin: 12, repMax: 15, rirAlvo: 3, descanso: 90, fatorCarga: 1,
    foco: 'Aprender execução e condicionar tendão e cartilagem antes de buscar carga.',
    nota: 'Nada de falha. Se dá pra fazer mais 3 reps no fim da série, está certo.' },

  { id: 'acum', nome: 'Acúmulo', sem: [4, 5, 6, 7],
    series: 3, repMin: 10, repMax: 15, rirAlvo: 2, descanso: 90, fatorCarga: 1,
    foco: 'Construir volume tolerável e subir carga de forma consistente.',
    nota: 'Aqui a progressão de carga acelera. Reserve 2 reps no tanque.' },

  { id: 'inten', nome: 'Intensificação', sem: [8, 9, 10, 11],
    series: 3, repMin: 8, repMax: 12, rirAlvo: 1, descanso: 120, fatorCarga: 1,
    foco: 'Manter estímulo de força com déficit calórico já acumulado.',
    nota: 'Menos reps, mais carga, descanso maior. É o que protege massa magra.' },

  { id: 'deload', nome: 'Deload', sem: [12],
    series: 2, repMin: 10, repMax: 12, rirAlvo: 4, descanso: 90, fatorCarga: 0.6,
    foco: 'Descarregar articulação e sistema nervoso antes do próximo ciclo.',
    nota: 'Carga em 60%. Semana leve não é semana perdida — é o que permite a próxima.' }
];

function faseDaSemana(sem) {
  const s = ((sem - 1) % 12) + 1;
  return FASES.find(f => f.sem.includes(s)) || FASES[0];
}

/* ══════════════════════════════════════════════════════════
   PROGRESSÃO DUPLA (double progression)

   Sobe carga somente quando TODAS as séries prescritas
   atingiram o topo da faixa de repetições com o RIR alvo ou
   menos. Ao subir, as reps voltam ao piso da faixa.

   Incremento por tipo de equipamento: máquina e membro
   inferior toleram salto maior; halter de isolamento, menor.
   ══════════════════════════════════════════════════════════ */

const INCREMENTO = {
  'Máquina': 5, 'Polia': 5, 'Barra': 5, 'Esteira': 0, 'Bike': 0, 'Elíptico': 0,
  'Halter': 2, 'Livre': 0
};

const INCREMENTO_GM = { 'Pernas': 10, 'Glúteos': 10, 'Costas': 5 };

function incrementoDe(nomeEx, cargaAtual) {
  const b = EXERCICIOS.find(x => x.n === nomeEx) || {};
  if (b.tempo) return 0;
  const porEq = INCREMENTO[b.eq];
  if (porEq === 0) return 0;
  const porGm = (b.eq === 'Máquina' || b.eq === 'Polia') ? (INCREMENTO_GM[b.gm] || 0) : 0;
  let inc = Math.max(porEq || 2.5, porGm) || 2.5;

  // Teto de 10% da carga atual. Sem isso, um salto fixo de 10 kg num leg
  // press de 80 kg representa 12,5% — degrau grande demais para manter a
  // faixa de repetições, o que quebra a progressão dupla na sessão seguinte.
  if (cargaAtual > 0) {
    const teto = Math.max(2.5, Math.floor(cargaAtual * 0.10 / 2.5) * 2.5);
    inc = Math.min(inc, teto);
  }
  return inc;
}

/* ══════════════════════════════════════════════════════════
   EXECUÇÃO E BIOMECÂNICA
   cue  = o que fazer para o estímulo cair no músculo certo
   erro = o desvio mais comum, e o que ele custa
   ══════════════════════════════════════════════════════════ */

const TECNICA = {
  'Leg press 45°': {
    cue: 'Pés na largura do ombro, joelho acompanhando a linha do pé. Desça até o quadril começar a arredondar e pare aí.',
    erro: 'Descer até a lombar sair do apoio. Tira a carga do quadríceps e joga no disco lombar.' },
  'Leg press horizontal': {
    cue: 'Costas coladas no banco, calcanhar apoiado. Não estenda o joelho até travar no fim.',
    erro: 'Travar o joelho no topo transfere a carga da musculatura para a articulação.' },
  'Cadeira extensora': {
    cue: 'Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina. Segure 1 segundo em cima.',
    erro: 'Eixo desalinhado gera cisalhamento no joelho. É o ajuste que quase ninguém faz.' },
  'Cadeira flexora': {
    cue: 'Quadril fixo no banco, puxe com o calcanhar, não com a ponta do pé.',
    erro: 'Levantar o quadril para puxar mais carga elimina o posterior de coxa do movimento.' },
  'Mesa flexora': {
    cue: 'Quadril colado, joelho um pouco além da borda do apoio.',
    erro: 'Arquear a lombar para ganhar amplitude. Compensação típica de carga alta demais.' },
  'Agachamento no Smith': {
    cue: 'Pé um pouco à frente do quadril, desça controlando 3 segundos.',
    erro: 'Pé alinhado sob o quadril na guia fixa força o joelho a absorver tudo.' },
  'Agachamento livre': {
    cue: 'Barra apoiada no trapézio, torácica firme, joelho seguindo a linha do pé.',
    erro: 'Perder a tensão do core no fundo. Acima de 100 kg de peso corporal, prefira máquina por enquanto.' },
  'Agachamento goblet': {
    cue: 'Halter contra o peito, cotovelo apontado pra baixo, tronco vertical.',
    erro: 'Deixar o halter afastar do corpo. Multiplica a alavanca na lombar.' },
  'Stiff com halteres': {
    cue: 'Joelho levemente flexionado e fixo. O movimento é do quadril, não da coluna.',
    erro: 'Arredondar as costas. É o exercício com maior taxa de lesão lombar quando mal feito.' },
  'Elevação pélvica': {
    cue: 'Queixo levemente pra dentro, suba até a linha do tronco e do quadril, sem passar.',
    erro: 'Hiperextender a lombar no topo em vez de contrair o glúteo.' },
  'Panturrilha em pé': {
    cue: 'Amplitude completa: desça o calcanhar até esticar e suba até o topo. Pausa embaixo.',
    erro: 'Fazer meia amplitude rápida. A panturrilha só responde a amplitude cheia.' },
  'Panturrilha sentado': {
    cue: 'Joelho a 90°, mesma amplitude completa, sem balançar o tronco.',
    erro: 'Usar o tronco para dar impulso.' },
  'Supino máquina': {
    cue: 'Ajuste o assento para o pegador ficar na linha do meio do peito. Escápula travada atrás.',
    erro: 'Assento alto demais transforma em desenvolvimento e sobrecarrega o ombro.' },
  'Supino reto com halteres': {
    cue: 'Escápula retraída, cotovelo a ~45° do tronco, desça até a linha do peito.',
    erro: 'Cotovelo aberto a 90° é a posição de maior estresse no ombro.' },
  'Supino reto com barra': {
    cue: 'Pegada pouco além da largura do ombro, barra descendo na linha do mamilo.',
    erro: 'Descer a barra na altura do pescoço. Pinça o ombro.' },
  'Supino inclinado máquina': {
    cue: 'Inclinação de 30°. Mais que isso vira ombro.',
    erro: 'Inclinar a 45° pensando que pega mais peito superior.' },
  'Supino inclinado halteres': {
    cue: 'Banco a 30°, halteres descendo até a clavícula.',
    erro: 'Perder a retração escapular no fim da série.' },
  'Crucifixo máquina (voador)': {
    cue: 'Cotovelo levemente flexionado e fixo. Junte pensando em aproximar os cotovelos, não as mãos.',
    erro: 'Estender e flexionar o cotovelo transforma em tríceps.' },
  'Crossover na polia': {
    cue: 'Um pé à frente, tronco levemente inclinado, arco constante.',
    erro: 'Usar o tronco pra empurrar quando a carga aperta.' },
  'Puxada alta frontal': {
    cue: 'Peito pra cima, puxe o cotovelo pra baixo e pra trás até a barra na clavícula.',
    erro: 'Puxar atrás da nuca ou jogar o tronco muito pra trás. O primeiro machuca o ombro, o segundo vira remada.' },
  'Puxada supinada': {
    cue: 'Pegada na largura do ombro, cotovelo colado ao tronco na descida.',
    erro: 'Encolher o ombro no início. Rouba o dorsal.' },
  'Remada baixa': {
    cue: 'Tronco quase vertical, puxe até o abdômen, escápula fechando no fim.',
    erro: 'Balançar o tronco pra frente e pra trás. Vira exercício de lombar.' },
  'Remada máquina': {
    cue: 'Peito apoiado, puxe com o cotovelo rente ao corpo.',
    erro: 'Terminar o movimento com o bíceps em vez de fechar a escápula.' },
  'Remada curvada com barra': {
    cue: 'Quadril pra trás, coluna neutra, barra subindo até o umbigo.',
    erro: 'Coluna arredondada sob carga. Evite nessa fase.' },
  'Remada unilateral halter': {
    cue: 'Apoio no banco, tronco paralelo ao chão, puxe rente ao quadril.',
    erro: 'Rodar o tronco pra completar a subida.' },
  'Desenvolvimento máquina': {
    cue: 'Encosto ajustado, pegador na altura da orelha no início. Não trave o cotovelo em cima.',
    erro: 'Começar muito abaixo, forçando rotação externa extrema do ombro.' },
  'Desenvolvimento halteres': {
    cue: 'Cotovelo levemente à frente do plano do tronco, não alinhado atrás.',
    erro: 'Cotovelo aberto totalmente para trás pinça o supraespinhal.' },
  'Elevação lateral': {
    cue: 'Cotovelo levemente flexionado, suba até a linha do ombro. Mindinho um pouco acima do polegar.',
    erro: 'Passar da linha do ombro e usar o trapézio. Carga leve aqui é a regra, não a exceção.' },
  'Elevação frontal': {
    cue: 'Suba até a altura do ombro, controle na descida.',
    erro: 'Usar impulso de quadril.' },
  'Crucifixo inverso': {
    cue: 'Cotovelo quase estendido, abra pensando em separar as escápulas.',
    erro: 'Encolher os ombros. Transfere pro trapézio superior.' },
  'Rosca direta': {
    cue: 'Cotovelo fixo na linha do tronco, sobe e desce sem mover o ombro.',
    erro: 'Levar o cotovelo pra frente no topo. Alivia o bíceps justamente no pico.' },
  'Rosca alternada': {
    cue: 'Supine o antebraço durante a subida, punho neutro.',
    erro: 'Balançar o tronco pra alternar.' },
  'Rosca martelo': {
    cue: 'Pegada neutra do começo ao fim, cotovelo colado.',
    erro: 'Girar o punho no meio do caminho.' },
  'Tríceps corda': {
    cue: 'Cotovelo colado ao tronco, abra a corda no final da extensão.',
    erro: 'Afastar o cotovelo do corpo transforma em empurrão de peito.' },
  'Tríceps barra reta': {
    cue: 'Cotovelo fixo, extensão completa sem travar.',
    erro: 'Inclinar o tronco pra usar peso maior.' },
  'Tríceps francês': {
    cue: 'Cotovelo apontado pro teto e parado. Só o antebraço se move.',
    erro: 'Abrir o cotovelo pros lados.' },
  'Prancha frontal': {
    cue: 'Cotovelo abaixo do ombro, glúteo contraído, costela pra baixo. Linha reta da orelha ao tornozelo.',
    erro: 'Quadril subindo (vira descanso) ou caindo (carrega a lombar).' },
  'Prancha lateral': {
    cue: 'Quadril elevado, corpo num plano só, ombro empilhado sobre o cotovelo.',
    erro: 'Rodar o tronco pra frente.' },
  'Abdominal máquina': {
    cue: 'Movimento é encurtar a distância entre esterno e púbis. Sem puxar com o braço.',
    erro: 'Flexionar o quadril em vez da coluna.' },
  'Caminhada na esteira': {
    cue: 'Postura ereta, sem segurar no apoio. Passada natural.',
    erro: 'Segurar no corrimão reduz o gasto e altera a marcha.' },
  'Esteira inclinada': {
    cue: 'Inclinação 6–8% a 5 km/h. Alvo é conversar com dificuldade, não ficar sem ar.',
    erro: 'Aumentar velocidade em vez de inclinação. A 125 kg, velocidade é impacto.' },
  'Bicicleta ergométrica': {
    cue: 'Altura do selim: joelho quase estendido no ponto mais baixo.',
    erro: 'Selim baixo sobrecarrega o joelho a cada pedalada.' }
};

/* ══════════════════════════════════════════════════════════
   GASTO DE CARDIO — equivalentes metabólicos (MET)
   kcal/min ≈ MET × 3,5 × peso(kg) / 200
   ══════════════════════════════════════════════════════════ */

const MET = {
  'Caminhada leve (4 km/h)': 3.0,
  'Caminhada moderada (5,5 km/h)': 4.3,
  'Esteira inclinada (5 km/h, 6-8%)': 6.0,
  'Bicicleta ergométrica leve': 4.0,
  'Bicicleta ergométrica moderada': 6.8,
  'Elíptico': 5.0,
  'Musculação (circuito moderado)': 3.5,
  'Natação leve': 6.0
};

/* ══════════════════════════════════════════════════════════
   FAIXAS DE REFERÊNCIA CLÍNICA
   ══════════════════════════════════════════════════════════ */

const REF = {
  // ritmo de perda semanal, como % do peso corporal
  ritmoMin: 0.005,   // 0,5% — abaixo disso o déficit provavelmente não está sendo cumprido
  ritmoMax: 0.010,   // 1,0% — acima disso a perda de massa magra cresce de forma relevante

  // proteína em g por kg de peso ajustado
  protMin: 1.6, protAlvo: 1.9, protMax: 2.4,

  // classificação de IMC (OMS)
  imc: [
    { max: 18.5, rot: 'Abaixo do peso' },
    { max: 25,   rot: 'Peso adequado' },
    { max: 30,   rot: 'Sobrepeso' },
    { max: 35,   rot: 'Obesidade grau I' },
    { max: 40,   rot: 'Obesidade grau II' },
    { max: 999,  rot: 'Obesidade grau III' }
  ],

  // circunferência de cintura — risco cardiometabólico elevado
  cinturaRisco: { m: 102, f: 88 },

  // percentual de gordura de referência para homens (ACE)
  gorduraFaixa: [
    { max: 6,   rot: 'Essencial' },
    { max: 14,  rot: 'Atlético' },
    { max: 18,  rot: 'Fitness' },
    { max: 25,  rot: 'Aceitável' },
    { max: 999, rot: 'Obesidade' }
  ]
};

function classificar(valor, tabela) {
  const f = tabela.find(x => valor < x.max);
  return f ? f.rot : tabela[tabela.length - 1].rot;
}

/* ══════════════════════════════════════════════════════════
   PERCENTUAL DE GORDURA — método U.S. Navy
   Só precisa de fita métrica. Erro típico de 3–4 pontos
   contra DEXA, o que é suficiente para acompanhar tendência.
   ══════════════════════════════════════════════════════════ */

function gorduraNavy(sexo, alturaCm, cinturaCm, pescocoCm, quadrilCm) {
  const pol = v => v / 2.54;
  const h = pol(alturaCm), c = pol(cinturaCm), p = pol(pescocoCm);
  if (!h || !c || !p || c <= p) return null;
  let bf;
  if (sexo === 'm') {
    bf = 86.010 * Math.log10(c - p) - 70.041 * Math.log10(h) + 36.76;
  } else {
    const q = pol(quadrilCm || 0);
    if (!q) return null;
    bf = 163.205 * Math.log10(c + q - p) - 97.684 * Math.log10(h) - 78.387;
  }
  return (bf > 2 && bf < 70) ? +bf.toFixed(1) : null;
}
