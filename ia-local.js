/* ══════════════════════════════════════════════════════════
   MOTOR DE IA LOCAL — 100% EMBUTIDO, OFFLINE, INSTANTÂNEO
   Agente Inteligente de Nutrição, Treino e Ações no App
   ══════════════════════════════════════════════════════════ */

const IAL = {
  engine: null,
  modelo: null,
  carregando: false,
  lib: null,
  baseConhecimento: [],
  historicoConversa: [],
  estado: {
    pendente: null, // { nome, args, ts } — aguardando confirmação
    ultimaIntencao: null,
    contagemIntencao: {}
  },

  suportado() { return true; },
  async modelos() { return []; },
  async carregar(modeloId, aoProgresso) {
    if (aoProgresso) aoProgresso('Motor embutido nativo pronto.', 1);
    return true;
  },
  pronto() { return true; },

  _norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  },

  _stem(palavra) {
    return palavra
      .replace(/(coes|çoes)$/, 'cao')
      .replace(/(inhas|inhos)$/, '')
      .replace(/(issimo|issima)$/, '')
      .replace(/(mente)$/, '')
      .replace(/s$/, '');
  },

  _sinonimos: {
    'malhar': ['treino', 'exercicio', 'academia'],
    'bateferro': ['treino', 'musculacao'],
    'perrengue': ['dificuldade', 'motivacao'],
    'rango': ['comida', 'refeicao', 'dieta'],
    'fominha': ['fome', 'comportamento'],
    'role': ['evento', 'churrasco', 'festa'],
    'rolê': ['evento', 'churrasco', 'festa']
  },

  _expandirTermo(termo) {
    const s = this._stem(termo);
    const extras = this._sinonimos[termo] || this._sinonimos[s] || [];
    return [termo, s, ...extras];
  },

  _parseContexto(raw) {
    if (raw && typeof raw === 'object') {
      return {
        nome: raw.nome || '',
        kcal: raw.kcal || 2000,
        saldoKcal: raw.saldoKcal != null ? raw.saldoKcal : null,
        protRestante: raw.protRestante || 0,
        ritmoSemana: raw.ritmoSemana || null,
        tarefaAtualId: raw.tarefaAtualId || null
      };
    }

    const bruto = String(raw || '');
    const buscaNum = (re, alvo) => {
      const m = bruto.match(re);
      return m ? +m[1] : alvo;
    };

    return {
      nome: (bruto.match(/^nome:\s*(.+)$/im) || [])[1] || '',
      kcal: buscaNum(/meta[^\d]*(\d{3,4})\s*kcal/i, 2000),
      saldoKcal: buscaNum(/saldo[^\d]*(-?\d+)/i, null),
      protRestante: buscaNum(/proteina[^\d]*falt[^\d]*(\d+)/i, 0),
      ritmoSemana: (bruto.match(/([\d.,]+)\s*kg\/sem/i) || [])[1] || null,
      tarefaAtualId: null
    };
  },

  /* RAG SOBRE A BASE DE CONHECIMENTO (saber.js) */
  _pesquisarBase(pergunta, limite = 2) {
    if (!this.baseConhecimento.length && typeof SABER !== 'undefined') {
      this.baseConhecimento = SABER.map(s => ({
        id: s.id, tag: s.tag,
        titulo: (s.kw && s.kw[0]) ? s.kw[0] : s.id,
        texto: typeof s.t === 'function' ? s.t({}) : String(s.t || ''),
        kw: s.kw || []
      }));
    }
    if (!this.baseConhecimento.length) return [];

    const termosBrutos = this._norm(pergunta).split(/[^a-z0-9]+/).filter(t => t.length > 2);
    if (!termosBrutos.length) return [];
    const termos = [...new Set(termosBrutos.flatMap(t => this._expandirTermo(t)))];

    return this.baseConhecimento
      .map(entry => {
        const haystack = this._norm([entry.titulo, entry.tag, ...entry.kw, entry.texto].join(' '));
        const score = termos.reduce((n, t) => n + (haystack.includes(t) ? 1 : 0), 0);
        return { entry, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(x => x.entry);
  },

  _extrairDiaEvento(texto) {
    const q = this._norm(texto);
    const dias = {
      'segunda': 'segunda-feira', 'terca': 'terça-feira', 'quarta': 'quarta-feira',
      'quinta': 'quinta-feira', 'sexta': 'sexta-feira', 'sabado': 'sábado', 'domingo': 'domingo'
    };
    for (const chave in dias) if (q.includes(chave)) return dias[chave];
    if (/\bhoje\b/.test(q)) return 'hoje';
    if (/\bamanha\b/.test(q)) return 'amanhã';
    return null;
  },

  _extrairPesoKg(texto) {
    const m = texto.match(/\b(\d{2,3}(?:[.,]\d)?)\s*kg\b/i) || texto.match(/\b(\d{2,3}(?:[.,]\d)?)\b/i);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  },

  _éConfirmacaoCurta(texto) {
    const q = this._norm(texto).trim();
    return /^(sim|s|confirma|confirmado|pode|manda ver|isso|exato|correto|ok|beleza)\.?!?$/.test(q);
  },

  _éCancelamento(texto) {
    const q = this._norm(texto).trim();
    return /^(nao|n|cancela|deixa (pra|para) la|esquece|para|nem)\.?!?$/.test(q);
  },

  /* Mapeamento de Intenções e Ferramentas do Agente */
  _regras: [
    { intencao: 'motivacao',            peso: 3, acao: null,                  re: /nao estou conseguindo|nao consigo|dificil|desanimei|desisti|falhei|nao aguento|furei|exagerei/i },
    { intencao: 'evento',               peso: 2, acao: null,                  re: /churrasco|evento|festa|aniversario|casamento|confraternizacao|happy hour|viagem|fim de semana|sabado|domingo/i },
    { intencao: 'registrar_peso',       peso: 2, acao: 'registrar_peso',      re: /\b\d{2,3}(?:[.,]\d)?\s*kg\b|balanca|pesagem|pesei|me pesei/i },
    { intencao: 'saldo-calorico',       peso: 2, acao: null,                  re: /quanto posso comer|meta calorica|quantas calorias|kcal restante|sobrou|saldo|quanto falta/i },
    { intencao: 'registrar_passos',     peso: 2, acao: 'registrar_passos',    re: /\d{3,6}\s*passos|andei bastante|caminhei/i },
    { intencao: 'registrar_cardio',     peso: 2, acao: 'registrar_cardio',    re: /\bcorri\b|\bpedalei\b|\bnadei\b|\bbike\b|corrida|pedalada|natacao|hiit/i },
    { intencao: 'gerar_cardapio',       peso: 2, acao: 'gerar_cardapio',      re: /cardapio|cardápio|menu da semana|menu do dia/i },
    { intencao: 'gerar_lista_compras',  peso: 2, acao: 'gerar_lista_compras', re: /lista de compras|o que (eu )?preciso comprar|compras/i },
    { intencao: 'mudar_fase',           peso: 2, acao: 'mudar_fase',          re: /(mudar|trocar|entrar em) .*fase|fase de (perda|manutencao|recuperacao)/i },
    { intencao: 'mudar_intensidade',    peso: 2, acao: 'mudar_intensidade',   re: /modo hard ?max|modo hard\b|modo firme|modo normal|aperta/i },
    { intencao: 'concluir_tarefa',      peso: 2, acao: 'concluir_tarefa',     re: /conclui|terminei|marca como feito|missao concluida/i },
    { intencao: 'evitar_alimento',      peso: 1, acao: 'evitar_alimento',     re: /nao (quero|gosto de|como) |^evita |tira o |tira a |odeio |sem (o|a) /i },
    { intencao: 'definir_regra_acao',   peso: 1, acao: 'definir_regra_acao',  re: /se (eu )?(chegar|passar|bater) .*\d{2,3} ?kg/i },
    { intencao: 'ensinar',              peso: 1, acao: 'ensinar',             re: /da proxima vez que eu perguntar|quando eu perguntar/i },
    { intencao: 'lembrar_fato',         peso: 1, acao: 'lembrar_fato',        re: /lembra que eu|guarda que eu|anota que eu/i },
    { intencao: 'registrar_refeicao',   peso: 1, acao: 'registrar_refeicao',  re: /comi|almocei|jantei|lanchei|tomei cafe|bebi|registra|anota/i },
    { intencao: 'duda_nutricao',        peso: 1, acao: null,                  re: /ovo|frango|arroz|carboidrato|proteina|doce|substituir|fome|marmita|agua|creatina|suplemento/i },
    { intencao: 'duvida_treino',        peso: 1, acao: null,                  re: /treino|exercicio|musculo|dor|agachamento|supino|cardio|esteira|hipertrofia|série|repetic/i }
  ],

  _classificar(texto) {
    const scores = {};
    for (const regra of this._regras) {
      if (regra.re.test(texto)) scores[regra.intencao] = (scores[regra.intencao] || 0) + regra.peso;
    }
    const entradas = Object.entries(scores);
    if (!entradas.length) return { intencao: 'conhecimento', secundaria: null, acaoId: null };

    entradas.sort((a, b) => b[1] - a[1]);
    const [top, segundo] = entradas;
    const regraTop = this._regras.find(r => r.intencao === top[0]);
    return {
      intencao: top[0],
      secundaria: segundo && segundo[1] > 0 ? segundo[0] : null,
      acaoId: regraTop ? regraTop.acao : null
    };
  },

  _extrairArgs(acaoId, texto, ctx) {
    switch (acaoId) {
      case 'registrar_refeicao': return { frase: texto };
      case 'registrar_peso': {
        const kg = this._extrairPesoKg(texto);
        if (kg == null) return null;
        const cintura = (texto.match(/cintura[^\d]*(\d{2,3})/i) || [])[1];
        const pescoco = (texto.match(/pescoc[oó][^\d]*(\d{2,3})/i) || [])[1];
        const args = { kg };
        if (cintura) args.cintura = +cintura;
        if (pescoco) args.pescoco = +pescoco;
        return args;
      }
      case 'registrar_passos': {
        const m = texto.match(/(\d{3,6})\s*passos/i) || texto.match(/(\d{3,6})/i);
        return m ? { passos: +m[1] } : null;
      }
      case 'registrar_cardio': {
        const minutos = (texto.match(/(\d{1,3})\s*min/i) || [])[1] || 30;
        return { atividade: 'caminhada/cardio', minutos: +minutos };
      }
      case 'gerar_cardapio': return { modo: 'padrao' };
      case 'gerar_lista_compras': return {};
      case 'evitar_alimento': {
        const m = texto.match(/(?:nao quero|nao gosto de|nao como|evita|tira o|tira a|odeio|sem o|sem a)\s+(.+)/i);
        return { nome: m && m[1] ? m[1].trim() : texto };
      }
      default: return null;
    }
  },

  _fraseSucesso(acaoId, args, ctx) {
    const nome = ctx.nome || 'Mariano';
    switch (acaoId) {
      case 'registrar_peso': return `${nome}, registrei **${args.kg} kg** no seu diário. O gráfico de tendência foi atualizado.`;
      case 'registrar_passos': return `${nome}, registrei **${args.passos} passos** para o dia de hoje.`;
      case 'registrar_cardio': return `${nome}, registrei **${args.minutos} min de cardio**. Excelente foco!`;
      case 'gerar_cardapio': return `${nome}, montei um novo cardápio ajustado para a sua meta diária. Confira na aba Plano.`;
      case 'gerar_lista_compras': return `${nome}, sua lista de compras para 7 dias está pronta na aba Plano.`;
      case 'evitar_alimento': return `${nome}, anotei. Vou remover **${args.nome}** das recomendações de cardápio.`;
      default: return `${nome}, operação executada com sucesso!`;
    }
  },

  _executarAcao(acaoId, texto, ctx) {
    const nome = ctx.nome || 'Mariano';
    const args = this._extrairArgs(acaoId, texto, ctx);
    if (args == null) return `${nome}, me diga o valor exato para que eu possa registrar (ex: "85kg" ou "8000 passos").`;

    if (typeof ControleAgente === 'undefined' || !ControleAgente.executar) {
      return `${nome}, o sistema de registro do app não respondeu. Tente novamente em instantes.`;
    }

    const r = ControleAgente.executar(acaoId, args, false);

    if (r.precisaConfirmar) {
      this.estado.pendente = { nome: r.nome, args: r.args, ts: Date.now() };
      return `${r.msg} Confirma a gravação? (Responda "sim" ou "não")`;
    }
    if (r.proibido) return r.msg;
    if (!r.ok) return r.msg || `${nome}, não consegui completar a operação.`;

    return this._fraseSucesso(acaoId, args, ctx);
  },

  /* RESPOSTAS CONVERSACIONAIS INTELIGENTES OFFLINE */
  _responderDuvidaGeral(texto, ctx) {
    const q = this._norm(texto);
    const nome = ctx.nome || 'Mariano';

    // RAG Local primeiro
    const fontes = this._pesquisarBase(texto, 1);
    if (fontes.length > 0) {
      const f = fontes[0];
      return `**${f.titulo.toUpperCase()}**\n\n${f.texto}\n\n*Diretriz baseada no protocolo oficial do aplicativo.*`;
    }

    // Respostas fluídas para dúvidas comuns sem alucinação
    if (q.includes("ovo") || q.includes("proteina")) {
      return `${nome}, a proteína é o macronutriente mais importante no déficit calórico porque preserva a sua massa magra e aumenta a saciedade. Boas fontes: ovos, peito de frango, patinho moído, peixes e iogurte desnatado.`;
    }
    if (q.includes("doce") || q.includes("fome") || q.includes("ansiedade")) {
      return `${nome}, a vontade de doce na dieta geralmente vem de baixa ingestão de proteína ou pouca água. Se bater a vontade, prefira frutas com alta densidade (como morango ou melancia) ou encaixe um quadrado de chocolate amargo dentro da sua meta de carboidratos.`;
    }
    if (q.includes("treino") || q.includes("dor") || q.includes("musculo")) {
      return `${nome}, a dor muscular tardia é normal no início ou ao trocar de treino. O essencial para hipertrofia e definição em déficit é a constância e a progressão de carga com boa técnica, respeitando pelo menos 48h de descanso por grupo muscular.`;
    }

    return `${nome}, para manter o processo simples e eficiente: foque em bater a sua meta de proteína, beber água suficiente e manter a consistência no treino. Quer que eu ajuste o seu cardápio ou registre algo?`;
  },

  /* PONTO DE ENTRADA PRINCIPAL DA IA */
  async perguntar(texto, contextoStr, aoPedaco) {
    const ctx = this._parseContexto(contextoStr);
    const nome = ctx.nome || 'Mariano';

    // 1. Confirmação pendente
    if (this.estado.pendente) {
      const expirado = (Date.now() - this.estado.pendente.ts) > 5 * 60 * 1000;
      if (expirado) {
        this.estado.pendente = null;
      } else if (this._éConfirmacaoCurta(texto)) {
        const pend = this.estado.pendente;
        this.estado.pendente = null;
        if (typeof ControleAgente !== 'undefined' && ControleAgente.executar) {
          const r = ControleAgente.executar(pend.nome, pend.args, true);
          const msg = r.ok ? this._fraseSucesso(pend.nome, pend.args, ctx) : (r.msg || 'Ação concluída.');
          return this._registrarTurno(texto, msg, 'confirmacao', aoPedaco);
        }
      } else if (this._éCancelamento(texto)) {
        this.estado.pendente = null;
        return this._registrarTurno(texto, `${nome}, ação cancelada. Nada foi alterado.`, 'cancelamento', aoPedaco);
      }
    }

    // 2. Classificação de Intenção
    const { intencao, acaoId } = this._classificar(texto);

    let resposta;
    if (acaoId) {
      resposta = this._executarAcao(acaoId, texto, ctx);
    } else {
      resposta = this._responderDuvidaGeral(texto, ctx);
    }

    return this._registrarTurno(texto, resposta, intencao, aoPedaco);
  },

  _registrarTurno(texto, resposta, intencao, aoPedaco) {
    this.historicoConversa.push({ papel: 'usuario', texto, intencao: intencao || null, ts: Date.now() });
    this.historicoConversa.push({ papel: 'ia', texto: resposta, ts: Date.now() });
    if (this.historicoConversa.length > 12) this.historicoConversa = this.historicoConversa.slice(-12);
    if (aoPedaco) aoPedaco(resposta);
    return resposta;
  },

  async descarregar() {
    this.historicoConversa = [];
    this.estado = { pendente: null, ultimaIntencao: null, contagemIntencao: {} };
  }
};