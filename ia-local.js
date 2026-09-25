/* ══════════════════════════════════════════════════════════
   AI ENGINE (Runtime, Context Builder, Intent Router, RAG)
   Cérebro local NÍVEL ELITE. Comportamento Tático e Direto.
   ══════════════════════════════════════════════════════════ */

const IA_CDN = 'https://esm.run/@mlc-ai/web-llm';

const IAL = {
  engine: null,
  modelo: null,
  carregando: false,
  lib: null,
  baseConhecimento: [],
  historicoConversa: [], // CONVERSATION MEMORY

  suportado() {
    return typeof navigator !== 'undefined' && !!navigator.gpu;
  },

  async _lib() {
    if (this.lib) return this.lib;
    this.lib = await import(/* webpackIgnore: true */ IA_CDN);
    return this.lib;
  },

  async modelos() {
    const w = await this._lib();
    const cfg = w.prebuiltAppConfig;
    if (!cfg || !cfg.model_list) return [];
    return cfg.model_list
      .filter(m => {
        const vram = m.vram_required_MB || 0;
        const id = (m.model_id || '').toLowerCase();
        return vram > 0 && vram <= 3600 && id.includes('instruct') && !id.includes('1k') && (id.includes('q4f16') || id.includes('q4f32'));
      })
      .map(m => ({ id: m.model_id, mb: Math.round(m.vram_required_MB), rot: m.model_id.replace(/-MLC$/, '').replace(/-q4f\d+_\d+/, '') }))
      .sort((a, b) => a.mb - b.mb)
      .slice(0, 8);
  },

  async carregar(modeloId, aoProgresso) {
    if (this.carregando) throw new Error('Carregamento já em andamento.');
    if (!this.suportado()) throw new Error('WebGPU não suportado.');
    this.carregando = true;
    try {
      const w = await this._lib();
      this.engine = await w.CreateMLCEngine(modeloId, {
        initProgressCallback: r => {
          if (aoProgresso) aoProgresso(r.text || '', typeof r.progress === 'number' ? r.progress : null);
        }
      });
      this.modelo = modeloId;
      return true;
    } finally {
      this.carregando = false;
    }
  },

  pronto() { return !!this.engine; },

  /* ── 1. RAG & KNOWLEDGE BASE (Melhorado para precisão) ── */
  _normalizar(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); },

  _pesquisarBase(pergunta, limite = 2) {
    if (!this.baseConhecimento.length && typeof SABER !== 'undefined') {
      this.baseConhecimento = SABER.map(s => ({
        id: s.id, topic: s.tag, title: (s.kw && s.kw[0]) ? s.kw[0].toUpperCase() : 'TÓPICO',
        summary: typeof s.t === 'function' ? s.t({}) : s.t, tags: s.kw || [], reference: "Base de Conhecimento Oficial"
      }));
    }
    if (!this.baseConhecimento.length) return [];
    
    const termos = this._normalizar(pergunta).split(/[^a-z0-9]+/).filter(t => t.length > 2);
    if (!termos.length) return [];

    return this.baseConhecimento.map(entry => {
      const haystack = this._normalizar([entry.topic, entry.title, entry.summary, ...entry.tags].join(" "));
      const score = termos.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
      return { entry, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limite).map(x => x.entry);
  },

  /* ── 2. CONTEXT BUILDER (Injeção de Perfil Tático) ── */
  _montarContexto(contextoBruto) {
    // Aqui damos a instrução comportamental de bastidores para a IA
    const diretrizLogistica = `
[PERFIL OPERACIONAL DO USUÁRIO]:
- Trate o emagrecimento como gestão de recursos e logística.
- O usuário busca soluções reais, viáveis para quem tem uma rotina intensa.
- Não exija perfeição irreal. Foco na consistência e na contenção de danos.`;
    
    return contextoBruto + diretrizLogistica;
  },

  /* ── 3. INTENT ROUTER & INFERÊNCIA ── */
  async perguntar(texto, contextoBruto, aoPedaco) {
    const fontesRAG = this._pesquisarBase(texto);
    const contextoConhecimento = fontesRAG.map(s => `[FONTE]: ${s.title}\n[DADOS]: ${s.summary}`).join("\n\n");

    if (!this.pronto()) {
      const fallback = fontesRAG.length > 0 
        ? `**${fontesRAG[0].title}**\n\n${fontesRAG[0].summary}\n\n*(Motor principal offline: Resposta estática rápida)*` 
        : "Nenhuma diretriz tática encontrada para este tema na base offline. Conecte-se para análise avançada.";
      if (aoPedaco) aoPedaco(fallback);
      return fallback;
    }

    const contextoProcessado = this._montarContexto(contextoBruto);
    
    // O PROMPT MESTRE (A verdadeira alma da IA acima da média)
    const sistema = `Você é um Coach de Elite em Nutrição e Treino. Sua mentalidade é tática, focada em resultados reais e logística do dia a dia.

DIRETRIZES DE OURO:
1. VÁ DIRETO AO PONTO: Sem introduções como "Olá" ou "Claro, posso ajudar". Entregue a tática imediatamente.
2. GESTÃO DE DANOS: Não existe "falha moral" na dieta, apenas matemática. Se o usuário relatar um exagero ou evento, ofereça uma solução de ajuste calórico sem sermões.
3. CIÊNCIA PRÁTICA: Use EXCLUSIVAMENTE os dados fornecidos. Não invente números.
4. BREVIDADE: Respostas curtas, no máximo 2 parágrafos incisivos.

FERRAMENTAS DE SISTEMA (Invoque sempre que necessário):
- Se o usuário relatar peso (ex: "estou com 85kg"), inclua no texto: [CMD:registrarPeso|85]
- Se o usuário mencionar evento, festa ou churrasco, inclua no texto: [CMD:ativarModoEvento|DIA_DO_EVENTO|2] e explique que você provisionou o saldo calórico.

[DADOS DO USUÁRIO E DIRETRIZES]:
${contextoProcessado}

[LITERATURA E DADOS DE SUPORTE LOCAL]:
${contextoConhecimento || "Use o bom senso operacional baseado na ciência do esporte."}`;

    this.historicoConversa.push({ role: 'user', content: texto });
    if (this.historicoConversa.length > 6) this.historicoConversa.shift();

    const mensagens = [{ role: 'system', content: sistema }, ...this.historicoConversa];

    try {
      const fluxo = await this.engine.chat.completions.create({
        messages: mensagens,
        temperature: 0.2, // Baixa alucinação, alta precisão lógica
        max_tokens: 500,
        stream: true
      });

      let out = '';
      let executouComando = false;

      for await (const p of fluxo) {
        const d = p.choices && p.choices[0] && p.choices[0].delta;
        if (d && d.content) { 
          out += d.content; 
          
          // Oculta a tag de comando [CMD:] da interface enquanto escreve
          if (out.includes('[CMD:')) {
             executouComando = true;
          } else if (aoPedaco && !executouComando) {
             aoPedaco(out); 
          }
        }
      }

      // Execução da Ferramenta pós-geração
      if (typeof Agente !== 'undefined' && executouComando) {
        const toolResult = Agente.validarComando(out);
        if (toolResult && toolResult.executado) {
           const msgAcao = `\n\n*(Operação Tática: ${toolResult.resultado})*`;
           out += msgAcao;
        }
        // Limpeza final do código de máquina antes de exibir ao usuário
        out = out.replace(/\[CMD:[^\]]+\]/g, '').trim();
        if (aoPedaco) aoPedaco(out);
      }

      this.historicoConversa.push({ role: 'assistant', content: out });

      // Verificação de Segurança (Alucinação bibliográfica)
      const claimsSource = /segundo estudo|referência|fonte:/i.test(out);
      if (claimsSource && fontesRAG.length === 0) {
        const alerta = "\n\n*(Alerta do Sistema: Esta afirmação não possui validação na literatura estática do app.)*";
        out += alerta;
        if (aoPedaco) aoPedaco(out);
      }

      return out;
    } catch (e) {
      this.historicoConversa.pop();
      const erroMsg = "\n\n*(Falha operacional: Limite de memória excedido. Refaça a pergunta de forma mais breve.)*";
      if (aoPedaco) aoPedaco(erroMsg);
      return erroMsg;
    }
  },

  async descarregar() {
    if (this.engine && this.engine.unload) { try { await this.engine.unload(); } catch (e) {} }
    this.engine = null; this.modelo = null;
    this.historicoConversa = [];
  }
};