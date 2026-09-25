/* ══════════════════════════════════════════════════════════
   MOTOR DE IA LOCAL — 100% EMBUTIDO, OFFLINE, INSTANTÂNEO

   Decisão de arquitetura final:
   - Sem WebGPU. Sem download. Sem LLM pesado.
   - Roda no celular mais básico, na hora que o app abre.
   - Inteligência vem de três camadas:
       1. RAG sobre saber.js (86 tópicos escritos e revisados)
       2. Processador de intenção em JS puro
       3. Motor de coaching com contexto real do usuário
   - Se o usuário quiser conversa livre com LLM, ele conecta
     a própria chave em Ajustes (ia-externa.js). Isso é BYOK.
   ══════════════════════════════════════════════════════════ */

const IAL = {
  engine: null,         // sempre null — sem LLM pesado
  modelo: null,
  carregando: false,
  lib: null,
  baseConhecimento: [],
  historicoConversa: [],

  /* WebGPU não é mais necessário nem verificado */
  suportado() { return false; },

  /* Nunca há modelos para baixar */
  async modelos() { return []; },

  /* Nunca carrega nada — a IA embutida já está pronta */
  async carregar(modeloId, aoProgresso) {
    if (aoProgresso) aoProgresso('Motor embutido já pronto — sem download necessário.', 1);
    return true;
  },

  pronto() { return false; }, // força uso do caminho RAG+regras

  /* ── NORMALIZAÇÃO ── */
  _norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  },

  /* ── RAG: busca nos tópicos do saber.js ── */
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

    const termos = this._norm(pergunta).split(/[^a-z0-9]+/).filter(t => t.length > 2);
    if (!termos.length) return [];

    return this.baseConhecimento
      .map(entry => {
        const haystack = this._norm([entry.titulo, entry.tag, ...entry.kw, entry.texto.slice(0, 200)].join(' '));
        const score = termos.reduce((n, t) => n + (haystack.includes(t) ? 1 : 0), 0);
        return { entry, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(x => x.entry);
  },

  /* ── CLASSIFICAÇÃO DE INTENÇÃO ── */
  _classificar(texto) {
    const q = this._norm(texto);
    if (/churrasco|evento|festa|aniversario|sair|restaurante|viagem|fim de semana|sabado|domingo/i.test(q))
      return 'modo-evento';
    if (/quanto posso comer|meta|caloria|kcal|sobrou|saldo|quanto falta/i.test(q))
      return 'saldo-calorico';
    if (/comi|almocei|jantei|lanchei|tomei|bebi|registra|anotar/i.test(q))
      return 'registrar-refeicao';
    if (/peso|balanca|pesagem|pesei|estou com|kg/i.test(q))
      return 'registrar-peso';
    if (/treino|exercicio|academia|treinar|serie|repeticao/i.test(q))
      return 'treino';
    if (/jejum|janela|quantas horas sem comer|desde quando/i.test(q))
      return 'jejum';
    if (/fase|manutencao|perda|recuperacao/i.test(q))
      return 'fase';
    if (/proteina|carboidrato|gordura|macro|fibra|sodio/i.test(q))
      return 'macros';
    if (/mau humor|fome|ansiedade|vontade de comer|compulsao|belisco/i.test(q))
      return 'comportamento';
    if (/nao estou conseguindo|nao consigo|difícil|dificil|desanimei|desisti/i.test(q))
      return 'motivacao';
    return 'conhecimento';
  },

  /* ── RESPOSTAS TÁTICAS POR INTENÇÃO ── */
  _responderModoEvento(texto, ctx) {
    const nome = (ctx && ctx.nome) || 'chefe';
    const kcal = (ctx && ctx.kcal) || 2000;
    const saldo = (ctx && ctx.saldoKcal) || 0;

    // propõe ação via agente
    const bufferKcal = Math.round(kcal * 0.15);
    let resposta = `${nome}, antes do evento, nos 2 a 3 dias anteriores, reduz uns **150 kcal por dia** para criar uma margem. Isso te dá cerca de **${bufferKcal} kcal extras** no dia — sem estragar a semana.\n\n`;
    resposta += `No dia: prioriza proteína na primeira refeição, come devagar, bebe água entre as coisas. Sem culpa depois — só fecha a semana direito.\n\n`;
    resposta += `*(Modo Evento ativo — distribuí a compensação automaticamente nos próximos dias.)*`;

    // tenta acionar o agente se disponível
    try {
      if (typeof Agente !== 'undefined' && Agente.ferramentas && Agente.ferramentas.ativarModoEvento) {
        Agente.ferramentas.ativarModoEvento('próximo evento', 2);
      }
    } catch (e) {}

    return resposta;
  },

  _responderSaldo(texto, ctx) {
    const saldo = ctx && ctx.saldoKcal != null ? ctx.saldoKcal : null;
    const prot = ctx && ctx.protRestante != null ? ctx.protRestante : null;
    const nome = (ctx && ctx.nome) || 'chefe';
    if (saldo == null) return `${nome}, ainda não há dados suficientes de hoje. Registra o que comeu e te mostro o saldo em tempo real.`;
    if (saldo <= 0) return `${nome}, a meta calórica de hoje já foi atingida. ${prot != null && prot > 0 ? `Ainda faltam **${Math.round(prot)} g de proteína** — foca nisso.` : 'Mantém o rumo.'}`;
    return `${nome}, você tem **${Math.round(saldo)} kcal** de saldo para hoje.${prot != null && prot > 0 ? ` Proteína: ainda precisas de **${Math.round(prot)} g**.` : ''} Distribui o saldo em alimentos de proteína primeiro.`;
  },

  _responderMotivacao(texto, ctx) {
    const nome = (ctx && ctx.nome) || 'chefe';
    const ritmo = ctx && ctx.ritmoSemana;
    return `${nome}, é normal ter dias assim. Emagrecimento não é linear — a curva tem platôs, oscilações e semanas ruins que não refletem o resultado real.\n\n${ritmo ? `Nos últimos dias você está em **${ritmo} kg/semana**. Isso é progresso real.` : 'O que conta é não abandonar.'}\n\nMeta mínima para hoje: registra **uma refeição** e bebe água. Isso já quebra o ciclo.`;
  },

  /* ── PONTO DE ENTRADA PRINCIPAL ── */
  async perguntar(texto, contextoStr, aoPedaco) {
    // extrai dados do contexto (pode vir como string)
    let ctx = {};
    try {
      const linhas = String(contextoStr || '').split('\n');
      linhas.forEach(l => {
        const m = l.match(/^([^:]+):\s*(.+)$/);
        if (m) ctx[m[1].trim()] = m[2].trim();
      });
    } catch (e) {}

    // extrai nome e números
    const nome = ctx['Nome'] || ctx['nome'] || '';
    const saldoMatch = String(contextoStr).match(/saldo[^\d]*(\d+)/i);
    const ctxRico = {
      nome: nome || 'chefe',
      saldoKcal: saldoMatch ? +saldoMatch[1] : null,
      kcal: +(String(contextoStr).match(/meta.*?(\d{3,4})\s*kcal/i) || [0,2000])[1],
      protRestante: +(String(contextoStr).match(/proteina.*?falt.*?(\d+)/i) || [0,0])[1],
      ritmoSemana: (String(contextoStr).match(/([\d.,]+)\s*kg\/sem/i) || [])[1]
    };

    let resposta = '';
    const intencao = this._classificar(texto);
    const fontes = this._pesquisarBase(texto, 2);

    // roteamento por intenção
    switch (intencao) {
      case 'modo-evento':
        resposta = this._responderModoEvento(texto, ctxRico);
        break;
      case 'saldo-calorico':
        resposta = this._responderSaldo(texto, ctxRico);
        break;
      case 'motivacao':
        resposta = this._responderMotivacao(texto, ctxRico);
        break;
      case 'registrar-refeicao':
        resposta = `${ctxRico.nome}, digita o que comeu aqui mesmo — "comi 100g de arroz, 1 bife e salada" — e eu registro tudo com os macros certos, esperando a tua confirmação.`;
        break;
      case 'registrar-peso':
        const kgMatch = texto.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
        if (kgMatch) {
          const kg = parseFloat(kgMatch[1].replace(',', '.'));
          resposta = `${ctxRico.nome}, vou registrar **${kg} kg** no teu progresso.`;
          try {
            if (typeof Agente !== 'undefined' && Agente.ferramentas && Agente.ferramentas.registrarPeso)
              Agente.ferramentas.registrarPeso(kg);
          } catch (e) {}
        } else {
          resposta = `${ctxRico.nome}, qual é o peso de hoje? Diz-me em kg e registro imediatamente.`;
        }
        break;
      case 'jejum':
      case 'fase':
      case 'treino':
      case 'macros':
      case 'comportamento':
      case 'conhecimento':
      default:
        if (fontes.length > 0) {
          const f = fontes[0];
          // aplica o contexto real ao texto do tópico
          let txt = f.texto;
          try {
            const topico = typeof SABER !== 'undefined' && SABER.find(s => s.id === f.id);
            if (topico && typeof topico.t === 'function') txt = topico.t(ctxRico);
          } catch (e) {}
          resposta = txt;
          if (fontes.length > 1) {
            const f2 = fontes[1];
            resposta += `\n\n**Relacionado:** ${f2.titulo.toLowerCase()}.`;
          }
        } else {
          // fallback genérico mas útil
          resposta = `${ctxRico.nome}, não encontrei este tópico exato na base offline. Podes ser mais específico? Por exemplo: "quanto de proteína preciso", "o que é jejum intermitente", "como funciona o cardápio".`;
        }
    }

    if (aoPedaco) aoPedaco(resposta);
    return resposta;
  },

  async descarregar() {
    this.historicoConversa = [];
  }
};
