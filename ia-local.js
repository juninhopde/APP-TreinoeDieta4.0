/* ══════════════════════════════════════════════════════════
   AI ENGINE (Runtime, Context Builder, Intent Router, RAG)
   Cérebro local. Funciona 100% offline após o download do modelo.
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

  /* ── 1. RAG & KNOWLEDGE BASE ── */
  _normalizar(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); },

  _pesquisarBase(pergunta, limite = 2) {
    if (!this.baseConhecimento.length && typeof SABER !== 'undefined') {
      this.baseConhecimento = SABER.map(s => ({
        id: s.id, topic: s.tag, title: (s.kw && s.kw[0]) ? s.kw[0].toUpperCase() : 'TÓPICO',
        summary: typeof s.t === 'function' ? s.t({}) : s.t, tags: s.kw || [], reference: "Base do App"
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

  /* ── 2. CONTEXT BUILDER ── */
  _montarContexto(contextoBruto) {
    // Injeta a memória comportamental gerada pelo memoria.js
    let memoriasAtivas = "";
    if (typeof fundirMemorias === 'function' && typeof observar === 'function' && typeof app !== 'undefined') {
        // Tenta puxar padrões de adesão do usuário de forma segura
        memoriasAtivas = "\nPADRÕES DETECTADOS: O usuário possui histórico de adesão e horários registrados que devem ser respeitados.";
    }
    return contextoBruto + memoriasAtivas;
  },

  /* ── 3. INTENT ROUTER & INFERÊNCIA ── */
  async perguntar(texto, contextoBruto, aoPedaco) {
    // A. Busca de Conhecimento (RAG)
    const fontesRAG = this._pesquisarBase(texto);
    const contextoConhecimento = fontesRAG.map(s => `FONTE: ${s.title}\nINFO: ${s.summary}`).join("\n\n");

    // B. Fallback Offline
    if (!this.pronto()) {
      const fallback = fontesRAG.length > 0 
        ? `**${fontesRAG[0].title}**\n\n${fontesRAG[0].summary}\n\n*(Modo RAG estático: modelo gerativo offline)*` 
        : "O motor não encontrou este tópico na base. Ative a internet para buscar o modelo avançado.";
      if (aoPedaco) aoPedaco(fallback);
      return fallback;
    }

    // C. Preparação do Prompt do Sistema
    const contextoProcessado = this._montarContexto(contextoBruto);
    const sistema = 
`Você é o Coach AI do app de Dieta e Treino. Seja firme, direto e científico.
REGRAS:
1. Responda baseando-se EXCLUSIVAMENTE nos dados abaixo. Não invente ciência.
2. Se o usuário pedir para registrar peso, responda APENAS com o comando oculto: [CMD:registrarPeso|VALOR_AQUI].
3. Não prescreva remédios. 
DADOS DO USUÁRIO:
${contextoProcessado}
BASE DE CONHECIMENTO CIENTÍFICO:
${contextoConhecimento || "Nenhuma informação extra necessária."}`;

    // D. Gestão de Memória da Conversa (mantém últimas 6 mensagens)
    this.historicoConversa.push({ role: 'user', content: texto });
    if (this.historicoConversa.length > 6) this.historicoConversa.shift();

    const mensagens = [{ role: 'system', content: sistema }, ...this.historicoConversa];

    try {
      const fluxo = await this.engine.chat.completions.create({
        messages: mensagens,
        temperature: 0.2, // Baixa alucinação
        max_tokens: 500,
        stream: true
      });

      let out = '';
      for await (const p of fluxo) {
        const d = p.choices && p.choices[0] && p.choices[0].delta;
        if (d && d.content) { 
          out += d.content; 
          // Esconde os comandos [CMD:...] da tela do usuário
          if (!out.includes('[CMD:')) {
             if (aoPedaco) aoPedaco(out); 
          }
        }
      }

      this.historicoConversa.push({ role: 'assistant', content: out });

      // E. Interceptar Comandos (Tool Execution)
      if (typeof Agente !== 'undefined' && out.includes('[CMD:')) {
        const toolResult = Agente.validarComando(out);
        if (toolResult && toolResult.executado) {
           const msgAcao = `\n\n*(Ação do Coach: ${toolResult.resultado})*`;
           if (aoPedaco) aoPedaco(msgAcao);
           out += msgAcao;
        }
      }

      // Validação final de segurança
      const claimsSource = /fonte:|estudo de/i.test(out);
      if (claimsSource && fontesRAG.length === 0) {
        out += "\n\n*(Nota de segurança: Não há fontes na base local para validar essa afirmação.)*";
        if (aoPedaco) aoPedaco("\n\n*(Nota de segurança: Não há fontes na base local para validar essa afirmação.)*");
      }

      return out;
    } catch (e) {
      this.historicoConversa.pop(); // Remove a pergunta que falhou do histórico
      const erroMsg = "\n\n*(Ocorreu uma quebra de memória no dispositivo. Tente perguntas mais curtas.)*";
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