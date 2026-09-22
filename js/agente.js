/* ══════════════════════════════════════════════════════════
   AGENTE — ferramentas que a IA pode executar

   O assistente deixa de só responder e passa a agir. Cada
   ação é uma FERRAMENTA declarada: nome, parâmetros, validação
   e política de confirmação.

   Três regras que não mudam:

   1. A IA nunca toca em código. Ela chama ferramentas que já
      existem, escritas e revisadas. Um modelo reescrevendo um
      app que calcula meta calórica é como se cria um erro
      silencioso que ninguém revisa.
   2. Ação que grava dado do usuário PEDE CONFIRMAÇÃO. Ação
      que só lê ou é trivialmente reversível executa direto.
   3. Tudo fica no log. Se o app mudou algo, dá para ver o quê,
      quando e por quê.
   ══════════════════════════════════════════════════════════ */

const POLITICA = {
  direto:     'direto',      // reversível e de baixo impacto
  confirma:   'confirma',    // grava dado ou muda meta
  proibido:   'proibido'     // existe só para a IA saber que não pode
};

/* `exec` recebe (args, api). `api` é o conjunto de funções do
   app que a ferramenta pode usar — nada além disso fica ao
   alcance da IA. */
const FERRAMENTAS = {

  registrar_refeicao: {
    desc: 'Registra alimentos no diário a partir de uma frase em linguagem natural.',
    args: { frase: 'texto do que a pessoa comeu' },
    politica: POLITICA.confirma,
    valida: a => a.frase && a.frase.length > 3 ? null : 'Preciso saber o que você comeu.',
    exec: (a, api) => api.registrarPorFrase(a.frase)
  },

  registrar_peso: {
    desc: 'Grava a pesagem do dia, opcionalmente com cintura e pescoço.',
    args: { kg: 'número', cintura: 'número opcional', pescoco: 'número opcional' },
    politica: POLITICA.confirma,
    valida: a => (+a.kg >= 40 && +a.kg <= 300) ? null : 'Peso fora de faixa plausível.',
    exec: (a, api) => api.registrarPeso(+a.kg, +a.cintura || null, +a.pescoco || null)
  },

  registrar_passos: {
    desc: 'Grava os passos do dia.',
    args: { passos: 'número' },
    politica: POLITICA.direto,
    valida: a => (+a.passos >= 0 && +a.passos <= 100000) ? null : 'Número de passos implausível.',
    exec: (a, api) => api.registrarPassos(+a.passos)
  },

  registrar_cardio: {
    desc: 'Registra uma sessão de cardio com atividade e minutos.',
    args: { atividade: 'nome', minutos: 'número' },
    politica: POLITICA.direto,
    valida: a => (+a.minutos > 0 && +a.minutos <= 300) ? null : 'Duração implausível.',
    exec: (a, api) => api.registrarCardio(a.atividade, +a.minutos)
  },

  concluir_tarefa: {
    desc: 'Marca uma tarefa da missão do dia como concluída.',
    args: { id: 'identificador da tarefa' },
    politica: POLITICA.direto,
    valida: a => a.id ? null : 'Qual tarefa?',
    exec: (a, api) => api.concluirTarefa(a.id)
  },

  gerar_cardapio: {
    desc: 'Monta o cardápio do dia. Modo: padrao, economico ou roca.',
    args: { modo: 'padrao | economico | roca' },
    politica: POLITICA.direto,
    valida: a => !a.modo || ['padrao','economico','roca'].includes(a.modo) ? null : 'Modo desconhecido.',
    exec: (a, api) => api.gerarCardapio(a.modo)
  },

  gerar_lista_compras: {
    desc: 'Gera a lista de compras de 7 dias do cardápio atual.',
    args: {},
    politica: POLITICA.direto,
    valida: () => null,
    exec: (a, api) => api.gerarCompras()
  },

  evitar_alimento: {
    desc: 'Adiciona um alimento à lista de evitados do cardápio.',
    args: { nome: 'nome do alimento' },
    politica: POLITICA.direto,
    valida: a => a.nome && a.nome.length > 2 ? null : 'Qual alimento?',
    exec: (a, api) => api.evitarAlimento(a.nome)
  },

  mudar_fase: {
    desc: 'Muda a fase do plano: perda, manutencao ou recuperacao.',
    args: { fase: 'perda | manutencao | recuperacao' },
    politica: POLITICA.confirma,
    valida: a => ['perda','manutencao','recuperacao'].includes(a.fase) ? null : 'Fase desconhecida.',
    exec: (a, api) => api.mudarFase(a.fase)
  },

  mudar_intensidade: {
    desc: 'Muda o nível de cobrança do coach: normal, firme, hard ou hardmax.',
    args: { nivel: 'normal | firme | hard | hardmax' },
    politica: POLITICA.direto,
    valida: a => ['normal','firme','hard','hardmax'].includes(a.nivel) ? null : 'Nível desconhecido.',
    exec: (a, api) => api.mudarIntensidade(a.nivel)
  },

  definir_regra_acao: {
    desc: 'Define o peso-gatilho e a ação combinada para reganho.',
    args: { peso: 'número', acao: 'texto' },
    politica: POLITICA.confirma,
    valida: a => (+a.peso >= 40 && +a.peso <= 300) ? null : 'Peso-gatilho fora de faixa.',
    exec: (a, api) => api.definirRegra(+a.peso, a.acao)
  },

  ensinar: {
    desc: 'Guarda uma pergunta e resposta que o assistente deve usar no futuro.',
    args: { pergunta: 'texto', resposta: 'texto' },
    politica: POLITICA.confirma,
    valida: a => (a.pergunta||'').length > 3 && (a.resposta||'').length > 3 ? null : 'Preciso da pergunta e da resposta.',
    exec: (a, api) => api.ensinar(a.pergunta, a.resposta)
  },

  lembrar_fato: {
    desc: 'Guarda um fato sobre a pessoa na memória do assistente.',
    args: { fato: 'texto' },
    politica: POLITICA.direto,
    valida: a => (a.fato||'').length > 3 ? null : 'O que devo lembrar?',
    exec: (a, api) => api.lembrarFato(a.fato)
  },

  /* Declaradas para que a IA saiba que existem e que são proibidas.
     Modelo que não conhece o limite tenta contorná-lo. */
  alterar_codigo: {
    desc: 'NÃO EXISTE. O assistente não altera o código do app.',
    politica: POLITICA.proibido,
    motivo: 'Código do app não é editável em tempo de execução. Um erro silencioso aqui viraria meta calórica errada sem revisão humana.'
  },
  ajustar_meta_livre: {
    desc: 'NÃO EXISTE. A meta calórica sai do motor de gasto e dos limites de segurança.',
    politica: POLITICA.proibido,
    motivo: 'Meta abaixo do piso ou déficit acima de 30% do gasto não são permitidos por nenhum caminho, inclusive por pedido direto.'
  },
  apagar_dados: {
    desc: 'NÃO EXISTE para o assistente. Só a pessoa apaga dados, em Ajustes.',
    politica: POLITICA.proibido,
    motivo: 'Ação destrutiva e irreversível não fica ao alcance de interpretação de linguagem.'
  }
};

/* Catálogo em texto, para entregar ao modelo externo. */
function catalogoFerramentas() {
  return Object.keys(FERRAMENTAS)
    .filter(k => FERRAMENTAS[k].politica !== POLITICA.proibido)
    .map(k => {
      const f = FERRAMENTAS[k];
      const args = f.args && Object.keys(f.args).length
        ? Object.keys(f.args).map(x => `${x} (${f.args[x]})`).join(', ') : 'sem parâmetros';
      return `- ${k}: ${f.desc} · parâmetros: ${args}`;
    }).join('\n');
}

/* Executa uma ferramenta com validação e política.
   Devolve { ok, precisaConfirmar, msg, resultado }. */
function executarFerramenta(nome, args, api, jaConfirmado) {
  const f = FERRAMENTAS[nome];
  if (!f) return { ok:false, msg:'Não existe uma ferramenta chamada "' + nome + '".' };
  if (f.politica === POLITICA.proibido)
    return { ok:false, msg: f.motivo, proibido:true };

  const erro = f.valida ? f.valida(args || {}) : null;
  if (erro) return { ok:false, msg: erro };

  if (f.politica === POLITICA.confirma && !jaConfirmado)
    return { ok:false, precisaConfirmar:true, nome, args, msg: f.desc };

  try {
    const r = f.exec(args || {}, api);
    return { ok:true, resultado:r, nome, args };
  } catch (e) {
    return { ok:false, msg:'A ação falhou: ' + (e && e.message ? e.message : e) };
  }
}

/* Log auditável. Sem isto, "o app mudou sozinho" vira mistério. */
function registrarNoLog(log, entrada) {
  log.unshift(Object.assign({ d: new Date().toISOString().slice(0,16).replace('T',' ') }, entrada));
  return log.slice(0, 120);
}

/* Extrai uma chamada de ferramenta da resposta de um modelo
   externo. O modelo propõe; o app valida e executa. Nunca o
   contrário. */
function extrairAcao(texto) {
  const t = String(texto || '');
  const i = t.indexOf('"ferramenta"');
  if (i < 0) return null;

  // início do objeto que contém a chave
  let ini = t.lastIndexOf('{', i);
  if (ini < 0) return null;

  /* Contagem de chaves, não regex. O argumento pode ser um objeto
     aninhado, e um match preguiçoso fecharia no "}" interno —
     produzindo JSON inválido e ação silenciosamente ignorada. */
  let nivel = 0, fim = -1, dentroStr = false, escapa = false;
  for (let k = ini; k < t.length; k++) {
    const ch = t[k];
    if (escapa) { escapa = false; continue; }
    if (ch === '\\') { escapa = true; continue; }
    if (ch === '"') { dentroStr = !dentroStr; continue; }
    if (dentroStr) continue;
    if (ch === '{') nivel++;
    else if (ch === '}') { nivel--; if (nivel === 0) { fim = k; break; } }
  }
  if (fim < 0) return null;

  const bruto = t.slice(ini, fim + 1);
  try {
    const j = JSON.parse(bruto);
    if (!j.ferramenta) return null;
    return { nome: j.ferramenta, args: j.argumentos || j.args || {},
             resto: (t.slice(0, ini) + t.slice(fim + 1)).trim() };
  } catch (e) { return null; }
}
