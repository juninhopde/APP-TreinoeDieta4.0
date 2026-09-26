/* ══════════════════════════════════════════════════════════
   MOTOR DE IA LOCAL — 100% EMBUTIDO, OFFLINE, INSTANTÂNEO
   Revisão 2 — integrado de verdade com o agente.js real.

   MUDANÇA DE CONTRATO — leia antes de subir para o app:
   O app.js agora PRECISA passar, dentro do contexto (2º
   argumento de `perguntar`), um objeto com:
     - nome, kcal, saldoKcal, protRestante, ritmoSemana: dados
       informativos, aceitos via string "Chave: valor" OU direto
       como propriedades do objeto de contexto.
     - tarefaAtualId: (opcional) id da tarefa em foco na tela,
       necessário só para a intenção "concluir tarefa" — hoje
       não existe esse conceito em app.js, então essa intenção
       cai no texto de ajuda até alguém wireá-la.
   NÃO é preciso passar `api` nem `log`: as ações chamam
   `window.ControleAgente.executar(nome, args, confirmado)`,
   que já existe em app.js e já embrulha
   `executarFerramenta` + `registrarNoLog` + `gravar()`. Chamar
   `executarFerramenta`/`registrarNoLog` direto daqui (como a
   revisão anterior deste arquivo fazia) duplicava essa lógica
   e tinha um bug: descartava o retorno de `registrarNoLog`,
   então o log nunca era truncado nos 120 registros certos.

   O QUE ESTE ARQUIVO NÃO FAZ:
   - Não chama `catalogoFerramentas()` nem `extrairAcao()` —
     essas duas existem em agente.js só para o caminho de LLM
     externo (modelo gera texto, app reextrai JSON). Como aqui
     quem decide a intenção é JS puro, chamamos
     `ControleAgente.executar` direto — mais simples e sem a
     camada frágil de gerar texto e reinterpretar.
   - Não inventa ferramentas que não existem em FERRAMENTAS.
     "Modo Evento" (churrasco/evento) NÃO tem ferramenta real
     hoje — a resposta é só orientação em texto, sem gravar
     nada. Se quiser automatizar isso de verdade, é preciso
     criar uma ferramenta nova em agente.js primeiro (decisão
     dele, não deste arquivo).
   - Nunca chama ferramentas de política "proibido"
     (alterar_codigo, ajustar_meta_livre, apagar_dados) — elas
     nem aparecem na tabela de intenções abaixo, por construção.
   ══════════════════════════════════════════════════════════ */

const IAL = {
  engine: null,
  modelo: null,
  carregando: false,
  lib: null,
  baseConhecimento: [],
  historicoConversa: [],
  estado: {
    pendente: null,        // { nome, args, ts } — aguardando confirmação de uma ferramenta "confirma"
    ultimaIntencao: null,
    contagemIntencao: {}
  },

  suportado() { return false; },
  async modelos() { return []; },
  async carregar(modeloId, aoProgresso) {
    if (aoProgresso) aoProgresso('Motor embutido já pronto — sem download necessário.', 1);
    return true;
  },
  pronto() { return false; },

  /* ══════════════ NORMALIZAÇÃO ══════════════ */
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
    'trem': ['comida'],
    'rango': ['comida', 'refeicao'],
    'fominha': ['fome', 'comportamento'],
    'role': ['evento'],
    'rolê': ['evento']
  },

  _expandirTermo(termo) {
    const s = this._stem(termo);
    const extras = this._sinonimos[termo] || this._sinonimos[s] || [];
    return [termo, s, ...extras];
  },

  /* ══════════════ PARSER ÚNICO DE CONTEXTO ══════════════
     Aceita string "Chave: valor" por linha OU objeto pronto.
     Quando é objeto, api/log/tarefaAtualId passam direto. */
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
      tarefaAtualId: null   // string não carrega isso — passe contexto como objeto se precisar
    };
  },

  /* ══════════════ RAG SOBRE saber.js ══════════════ */
  _pesquisarBase(pergunta, limite) {
    limite = limite || 3;
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

  /* ══════════════ EXTRAÇÃO DE ENTIDADES AUXILIARES ══════════════ */
  _extrairDiaEvento(texto) {
    const q = this._norm(texto);
    const dias = {
      'segunda': 'segunda-feira', 'terca': 'terça-feira', 'quarta': 'quarta-feira',
      'quinta': 'quinta-feira', 'sexta': 'sexta-feira', 'sabado': 'sábado', 'domingo': 'domingo'
    };
    for (const chave in dias) if (q.includes(chave)) return dias[chave];
    if (/\bhoje\b/.test(q)) return 'hoje';
    if (/\bamanha\b/.test(q)) return 'amanhã';
    const dataMatch = q.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (dataMatch) return `${dataMatch[1]}/${dataMatch[2]}`;
    return null;
  },

  _extrairPesoKg(texto) {
    const m = texto.match(/\b(\d{2,3}(?:[.,]\d)?)\s*kg\b/i);
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

  /* ══════════════ TABELA ÚNICA: INTENÇÃO → (peso, gatilho, ferramenta real ou null) ══════════════
     `acao` é o NOME EXATO da chave em FERRAMENTAS (agente.js).
     Intenções com acao:null são só conversa/consulta, sem gravar nada.
     Nenhuma entrada aqui referencia ferramenta de política "proibido"
     — isso é proposital, não omissão. */
  _regras: [
    { intencao: 'motivacao',            peso: 3, acao: null,                  re: /nao estou conseguindo|nao consigo|dificil|desanimei|desisti|falhei|nao aguento/i },
    { intencao: 'evento',               peso: 2, acao: null,                  re: /churrasco|evento|festa|aniversario|casamento|confraternizacao|happy hour|viagem|fim de semana|sabado|domingo/i },
    { intencao: 'registrar_peso',       peso: 2, acao: 'registrar_peso',      re: /\b\d{2,3}(?:[.,]\d)?\s*kg\b|balanca|pesagem|pesei|me pesei/i },
    { intencao: 'saldo-calorico',       peso: 2, acao: null,                  re: /quanto posso comer|meta calorica|quantas calorias|kcal restante|sobrou|saldo|quanto falta/i },
    { intencao: 'registrar_passos',     peso: 2, acao: 'registrar_passos',    re: /\d{3,6}\s*passos|andei bastante|caminhei o dia/i },
    { intencao: 'registrar_cardio',     peso: 2, acao: 'registrar_cardio',    re: /\bcorri\b|\bpedalei\b|\bnadei\b|\bbike\b|corrida|pedalada|natacao|hiit/i },
    { intencao: 'gerar_cardapio',       peso: 2, acao: 'gerar_cardapio',      re: /cardapio|cardápio|menu da semana|menu do dia/i },
    { intencao: 'gerar_lista_compras',  peso: 2, acao: 'gerar_lista_compras', re: /lista de compras|o que (eu )?preciso comprar|compras da semana/i },
    { intencao: 'mudar_fase',           peso: 2, acao: 'mudar_fase',          re: /(mudar|trocar|entrar em) .*fase|fase de (perda|manutencao|recuperacao)/i },
    { intencao: 'mudar_intensidade',    peso: 2, acao: 'mudar_intensidade',   re: /modo hard ?max|modo hard\b|modo firme|modo normal|aperta (mais)?|suaviza/i },
    { intencao: 'concluir_tarefa',      peso: 2, acao: 'concluir_tarefa',     re: /conclui|terminei (a tarefa|isso|o treino)|marca como feito|missao concluida/i },
    { intencao: 'evitar_alimento',      peso: 1, acao: 'evitar_alimento',     re: /nao (quero|gosto de|como) |^evita |tira o |tira a |odeio |sem (o|a) /i },
    { intencao: 'definir_regra_acao',   peso: 1, acao: 'definir_regra_acao',  re: /se (eu )?(chegar|passar|bater) .*\d{2,3} ?kg/i },
    { intencao: 'ensinar',              peso: 1, acao: 'ensinar',             re: /da proxima vez que eu perguntar|sempre que eu perguntar|quando eu perguntar/i },
    { intencao: 'lembrar_fato',         peso: 1, acao: 'lembrar_fato',        re: /lembra que eu|guarda que eu|anota que eu|saiba que eu/i },
    { intencao: 'registrar_refeicao',   peso: 1, acao: 'registrar_refeicao',  re: /comi|almocei|jantei|lanchei|tomei cafe|bebi|registra (isso|que)|anota (isso|que)/i },
    { intencao: 'jejum',                peso: 1, acao: null,                  re: /jejum|janela alimentar|quantas horas sem comer/i },
    { intencao: 'fase-info',            peso: 1, acao: null,                  re: /o que e fase de|explica (a )?fase/i },
    { intencao: 'treino-info',          peso: 1, acao: null,                  re: /treino|exercicio|academia|malha|serie|repeticao|carga|hipertrofia/i },
    { intencao: 'macros',               peso: 1, acao: null,                  re: /proteina|carboidrato|gordura|macro|fibra|sodio/i },
    { intencao: 'comportamento',        peso: 1, acao: null,                  re: /mau humor|fome emocional|ansiedade|vontade de comer|compulsao|belisc/i }
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

  _variar(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  },

  _atualizarRepeticao(intencao) {
    if (this.estado.ultimaIntencao === intencao) {
      this.estado.contagemIntencao[intencao] = (this.estado.contagemIntencao[intencao] || 1) + 1;
    } else {
      this.estado.contagemIntencao[intencao] = 1;
    }
    this.estado.ultimaIntencao = intencao;
    return this.estado.contagemIntencao[intencao];
  },

  /* ══════════════ EXTRAÇÃO DE ARGUMENTOS POR FERRAMENTA ══════════════
     Retorna null quando não conseguiu extrair com segurança — nesse
     caso NUNCA chamamos executarFerramenta, só devolvemos uma ajuda
     ensinando a frase certa. Isto é deliberado: regex não tem certeza
     de verdade, então o padrão é pedir esclarecimento, não arriscar. */
  _extrairArgs(acaoId, texto, ctx) {
    switch (acaoId) {
      case 'registrar_refeicao':
        return { frase: texto };

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
        const m = texto.match(/(\d{3,6})\s*passos/i);
        return m ? { passos: +m[1] } : null;
      }

      case 'registrar_cardio': {
        const minutos = (texto.match(/(\d{1,3})\s*min/i) || [])[1];
        const mapaAtividade = { corri: 'corrida', pedalei: 'pedalada', nadei: 'natacao', bike: 'bike', hiit: 'hiit' };
        const q = this._norm(texto);
        let atividade = null;
        for (const k in mapaAtividade) if (q.includes(k)) { atividade = mapaAtividade[k]; break; }
        if (!minutos || !atividade) return null;
        return { atividade, minutos: +minutos };
      }

      case 'gerar_cardapio': {
        const q = this._norm(texto);
        let modo = 'padrao';
        if (/economic/.test(q)) modo = 'economico';
        else if (/roca|caipira/.test(q)) modo = 'roca';
        return { modo };
      }

      case 'gerar_lista_compras':
        return {};

      case 'mudar_fase': {
        const q = this._norm(texto);
        let fase = null;
        if (/perda|emagrec/.test(q)) fase = 'perda';
        else if (/manutenc/.test(q)) fase = 'manutencao';
        else if (/recuperac|bulking/.test(q)) fase = 'recuperacao';
        return fase ? { fase } : null;
      }

      case 'mudar_intensidade': {
        const q = this._norm(texto);
        let nivel = null;
        if (/hard ?max/.test(q)) nivel = 'hardmax';
        else if (/\bhard\b/.test(q)) nivel = 'hard';
        else if (/firme/.test(q)) nivel = 'firme';
        else if (/normal|suaviza|tranquilo/.test(q)) nivel = 'normal';
        return nivel ? { nivel } : null;
      }

      case 'concluir_tarefa':
        return ctx.tarefaAtualId ? { id: ctx.tarefaAtualId } : null;

      case 'evitar_alimento': {
        const m = texto.match(/(?:nao quero|nao gosto de|nao como|evita|tira o|tira a|odeio|sem o|sem a)\s+(.+)/i);
        const nome = m && m[1] ? m[1].replace(/[.!?].*$/, '').trim() : null;
        return nome && nome.length > 2 ? { nome } : null;
      }

      case 'definir_regra_acao': {
        const pesoM = texto.match(/(\d{2,3})\s*kg/i);
        if (!pesoM) return null;
        const partes = texto.split(/entao|então|,|\bme\b|\bfaz\b/i);
        const acao = partes.length > 1 ? partes.slice(1).join(' ').trim() : null;
        return { peso: +pesoM[1], acao: acao || 'me avisar' };
      }

      case 'ensinar': {
        const m = texto.match(/quando eu perguntar\s+(.+?)\s+(?:responde|diz)\s+(.+)/i)
               || texto.match(/da proxima vez que eu perguntar\s+(.+?)\s+(?:responde|diz)\s+(.+)/i);
        if (!m) return null;
        return { pergunta: m[1].trim(), resposta: m[2].trim() };
      }

      case 'lembrar_fato': {
        const m = texto.match(/(?:lembra que eu|guarda que eu|anota que eu|saiba que eu)\s+(.+)/i);
        return m && m[1] ? { fato: m[1].trim() } : null;
      }

      default:
        return null;
    }
  },

  _ajudaAcao(acaoId, ctx) {
    const nome = ctx.nome || 'chefe';
    const mapa = {
      registrar_peso: `${nome}, diz o peso em kg, tipo "85kg" ou "pesei 85,4 kg".`,
      registrar_passos: `${nome}, me diz quantos passos, tipo "8000 passos hoje".`,
      registrar_cardio: `${nome}, me diz atividade e minutos, tipo "corri 30 min".`,
      concluir_tarefa: `${nome}, não sei qual tarefa você concluiu — marca direto na lista de tarefas do app.`,
      evitar_alimento: `${nome}, me diz o nome do alimento, tipo "evita brócolis".`,
      definir_regra_acao: `${nome}, tenta assim: "se eu bater 95kg, então reduz o cardápio".`,
      ensinar: `${nome}, tenta assim: "quando eu perguntar sobre X, responde Y".`,
      lembrar_fato: `${nome}, tenta assim: "lembra que eu tenho intolerância a lactose".`
    };
    return mapa[acaoId] || `${nome}, não entendi direito o pedido — pode reformular?`;
  },

  _fraseSucesso(acaoId, args, ctx) {
    const nome = ctx.nome || 'chefe';
    switch (acaoId) {
      case 'registrar_refeicao': return `${nome}, registrado.`;
      case 'registrar_peso': return `${nome}, registrei **${args.kg} kg**${args.cintura ? `, cintura ${args.cintura}cm` : ''}${args.pescoco ? `, pescoço ${args.pescoco}cm` : ''}.`;
      case 'registrar_passos': return `${nome}, **${args.passos} passos** registrados.`;
      case 'registrar_cardio': return `${nome}, **${args.minutos} min de ${args.atividade}** registrados.`;
      case 'gerar_cardapio': return `${nome}, cardápio (modo ${args.modo}) gerado.`;
      case 'gerar_lista_compras': return `${nome}, lista de compras gerada.`;
      case 'mudar_fase': return `${nome}, fase alterada para **${args.fase}**.`;
      case 'mudar_intensidade': return `${nome}, intensidade agora em **${args.nivel}**.`;
      case 'concluir_tarefa': return `${nome}, tarefa concluída.`;
      case 'evitar_alimento': return `${nome}, **${args.nome}** vai ficar fora do cardápio.`;
      case 'definir_regra_acao': return `${nome}, regra criada: se bater **${args.peso} kg**, ${args.acao}.`;
      case 'ensinar': return `${nome}, guardado — da próxima vez que perguntar isso, uso essa resposta.`;
      case 'lembrar_fato': return `${nome}, guardei isso.`;
      default: return `${nome}, feito.`;
    }
  },

  /* ══════════════ EXECUÇÃO REAL VIA window.ControleAgente ══════════════
     ControleAgente.executar já embrulha executarFerramenta +
     registrarNoLog + gravar() — não reimplementamos nada disso aqui. */
  _executarAcao(acaoId, texto, ctx) {
    const nome = ctx.nome || 'chefe';
    const args = this._extrairArgs(acaoId, texto, ctx);
    if (args == null) return this._ajudaAcao(acaoId, ctx);

    if (typeof ControleAgente === 'undefined' || !ControleAgente.executar) {
      return `${nome}, o motor de ações do app não está disponível agora — tenta de novo em instantes.`;
    }

    const r = ControleAgente.executar(acaoId, args, false);

    if (r.precisaConfirmar) {
      this.estado.pendente = { nome: r.nome, args: r.args, ts: Date.now() };
      return `${r.msg} Confirma? (responde "sim" ou "não")`;
    }
    if (r.proibido) return r.msg;
    if (!r.ok) return r.msg || `${nome}, não consegui completar essa ação.`;

    return this._fraseSucesso(acaoId, args, ctx);
  },

  /* ══════════════ RESPOSTAS CONVERSACIONAIS (sem gravar nada) ══════════════ */
  _responderEvento(texto, ctx) {
    const nome = ctx.nome || 'chefe';
    const kcal = ctx.kcal || 2000;
    const bufferKcal = Math.round(kcal * 0.15);
    const dia = this._extrairDiaEvento(texto);

    const abertura = this._variar([
      `${nome}, para o evento${dia ? ` (${dia})` : ''}`,
      `Combinado, ${nome}. Para o evento${dia ? ` (${dia})` : ''}`
    ]);

    let resposta = `${abertura}: nos 2 a 3 dias anteriores reduz uns **150 kcal por dia** para abrir margem — dá cerca de **${bufferKcal} kcal extras** no dia do evento.\n\n`;
    resposta += `No dia: prioriza proteína na primeira refeição, come devagar, bebe água entre as coisas. Sem culpa depois — só fecha a semana direito.\n\n`;
    resposta += `*(Isso é orientação — hoje não existe uma ferramenta em agente.js que ajuste a meta automaticamente nesses dias. Se quiser isso de verdade, precisamos criar essa ferramenta lá primeiro.)*`;
    return resposta;
  },

  _responderSaldo(texto, ctx) {
    const saldo = ctx.saldoKcal;
    const prot = ctx.protRestante;
    const nome = ctx.nome || 'chefe';
    if (saldo == null) return `${nome}, ainda não há dados suficientes de hoje. Registra o que comeu e te mostro o saldo em tempo real.`;
    if (saldo <= 0) return `${nome}, a meta calórica de hoje já foi atingida. ${prot > 0 ? `Ainda faltam **${Math.round(prot)} g de proteína** — foca nisso.` : 'Mantém o rumo.'}`;
    return `${nome}, você tem **${Math.round(saldo)} kcal** de saldo para hoje.${prot > 0 ? ` Proteína: ainda precisas de **${Math.round(prot)} g**.` : ''} Distribui o saldo em alimentos de proteína primeiro.`;
  },

  _responderMotivacao(texto, ctx, repeticao) {
    const nome = ctx.nome || 'chefe';
    const ritmo = ctx.ritmoSemana;
    if (repeticao >= 2) {
      return `${nome}, é a segunda vez seguida que isso aparece. Quer conversar sobre o que está pesando, ou prefere só um empurrão prático para hoje? Se for o segundo: registra uma refeição agora, só isso.`;
    }
    const abertura = this._variar([
      `${nome}, é normal ter dias assim.`,
      `${nome}, respira. Isso acontece com todo mundo nessa fase.`,
      `${nome}, entendo. Dia difícil não apaga o progresso que já foi feito.`
    ]);
    return `${abertura} Emagrecimento não é linear — a curva tem platôs, oscilações e semanas ruins que não refletem o resultado real.\n\n${ritmo ? `Nos últimos dias você está em **${ritmo} kg/semana**. Isso é progresso real.` : 'O que conta é não abandonar.'}\n\nMeta mínima para hoje: registra **uma refeição** e bebe água. Isso já quebra o ciclo.`;
  },

  _responderConhecimento(texto, ctx) {
    const fontes = this._pesquisarBase(texto, 2);
    if (!fontes.length) {
      return `${ctx.nome || 'chefe'}, não encontrei este tópico exato na base offline. Podes ser mais específico? Por exemplo: "quanto de proteína preciso", "o que é jejum intermitente", "como funciona o cardápio".`;
    }
    const f = fontes[0];
    let txt = f.texto;
    try {
      const topico = typeof SABER !== 'undefined' && SABER.find(s => s.id === f.id);
      if (topico && typeof topico.t === 'function') txt = topico.t(ctx);
    } catch (e) { /* usa f.texto já resolvido */ }
    let resposta = txt;
    if (fontes.length > 1) resposta += `\n\n**Relacionado:** ${fontes[1].titulo.toLowerCase()}.`;
    return resposta;
  },

  /* ══════════════ PONTO DE ENTRADA PRINCIPAL ══════════════ */
  async perguntar(texto, contextoStr, aoPedaco) {
    const ctx = this._parseContexto(contextoStr);
    const nome = ctx.nome || 'chefe';

    // 1) resolve pendência (confirmação/cancelamento/expiração) ANTES de classificar,
    //    senão "sim"/"não" cairia em 'conhecimento' e a ação ficaria esquecida.
    if (this.estado.pendente) {
      const expirado = (Date.now() - this.estado.pendente.ts) > 5 * 60 * 1000;
      if (expirado) {
        this.estado.pendente = null;
      } else if (this._éConfirmacaoCurta(texto)) {
        const pend = this.estado.pendente;
        this.estado.pendente = null;
        if (typeof ControleAgente === 'undefined' || !ControleAgente.executar) {
          return this._registrarTurno(texto, `${nome}, não tenho acesso às ações do app agora — tenta de novo mais tarde.`, 'confirmacao', aoPedaco);
        }
        const r = ControleAgente.executar(pend.nome, pend.args, true);
        if (r.ok) {
          return this._registrarTurno(texto, this._fraseSucesso(pend.nome, pend.args, ctx), 'confirmacao', aoPedaco);
        }
        return this._registrarTurno(texto, r.msg || `${nome}, não consegui concluir essa ação.`, 'confirmacao', aoPedaco);
      } else if (this._éCancelamento(texto)) {
        this.estado.pendente = null;
        return this._registrarTurno(texto, `${nome}, cancelado.`, 'cancelamento', aoPedaco);
      }
      // nem confirmou nem cancelou: segue o fluxo normal, mas avisa que algo ficou em aberto
    }

    const { intencao, secundaria, acaoId } = this._classificar(texto);
    const repeticao = this._atualizarRepeticao(intencao);

    let resposta;
    if (acaoId) {
      resposta = this._executarAcao(acaoId, texto, ctx);
      if (acaoId === 'gerar_cardapio' && secundaria === 'gerar_lista_compras') {
        resposta += `\n\nQuer que eu já gere a lista de compras desse cardápio também?`;
      }
    } else {
      switch (intencao) {
        case 'evento': resposta = this._responderEvento(texto, ctx); break;
        case 'saldo-calorico': resposta = this._responderSaldo(texto, ctx); break;
        case 'motivacao': resposta = this._responderMotivacao(texto, ctx, repeticao); break;
        default: resposta = this._responderConhecimento(texto, ctx);
      }
    }

    if (this.estado.pendente && this.estado.pendente.nome !== acaoId) {
      resposta += `\n\n*(ainda estou esperando você confirmar ou cancelar a ação anterior — "sim" ou "não")*`;
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
