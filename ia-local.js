/* ══════════════════════════════════════════════════════════
   ASSISTENTE LOCAL (Evolução Engine 1.0)
   Integração do motor de RAG (Retrieval-Augmented Generation) 
   e execução de LLM via WebGPU. Fallback garantido sem quebrar a UI.
   ══════════════════════════════════════════════════════════ */

const IA_CDN = 'https://esm.run/@mlc-ai/web-llm';

const IAL = {
  engine: null,
  modelo: null,
  carregando: false,
  lib: null,
  baseConhecimento: [],

  suportado() {
    return typeof navigator !== 'undefined' && !!navigator.gpu;
  },

  async _lib() {
    if (this.lib) return this.lib;
    this.lib = await import(/* webpackIgnore: true */ IA_CDN);
    return this.lib;
  },

  /* Mantém a compatibilidade com a lista de modelos original lida pela UI */
  async modelos() {
    const w = await this._lib();
    const cfg = w.prebuiltAppConfig;
    if (!cfg || !cfg.model_list) return [];
    return cfg.model_list
      .filter(m => {
        const vram = m.vram_required_MB || 0;
        const id = (m.model_id || '').toLowerCase();
        return vram > 0 && vram <= 3600
          && id.includes('instruct')
          && !id.includes('1k')
          && (id.includes('q4f16') || id.includes('q4f32'));
      })
      .map(m => ({
        id: m.model_id,
        mb: Math.round(m.vram_required_MB),
        rot: m.model_id.replace(/-MLC$/, '').replace(/-q4f\d+_\d+/, '')
      }))
      .sort((a, b) => a.mb - b.mb)
      .slice(0, 8);
  },

  async carregar(modeloId, aoProgresso) {
    if (this.carregando) throw new Error('Já existe um carregamento em andamento.');
    if (!this.suportado()) throw new Error('Este navegador não tem suporte a WebGPU. O assistente local avançado não roda aqui.');
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

  _normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  },

  _pesquisarBase(pergunta, limite = 3) {
    // Carregamento preguiçoso do saber.js para evitar problemas de ordem de importação nas scripts
    if (!this.baseConhecimento.length && typeof SABER !== 'undefined') {
      this.baseConhecimento = SABER.map(s => ({
        id: s.id,
        topic: s.tag,
        title: (s.kw && s.kw[0]) ? s.kw[0].toUpperCase() : 'TÓPICO',
        summary: typeof s.t === 'function' ? s.t({}) : s.t,
        tags: s.kw || [],
        reference: "Base de Conhecimento Oficial do App"
      }));
    }

    if (!this.baseConhecimento.length) return [];
    
    const termos = this._normalizar(pergunta).split(/[^a-z0-9]+/).filter(t => t.length > 2);
    if (!termos.length) return [];

    return this.baseConhecimento
      .map(entry => {
        const haystack = this._normalizar([entry.topic, entry.title, entry.summary, ...entry.tags].join(" "));
        const score = termos.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
        return { entry, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(x => x.entry);
  },

  _validarResposta(texto, fontes) {
    const claimsSource = /fonte:|refer[eê]ncia:|estudo de/i.test(texto);
    if (claimsSource && fontes.length === 0) {
      return texto + "\n\n*(Nota do Sistema: Não encontrei referência na base estática para validar a fonte citada. Considere a informação com cautela.)*";
    }
    return texto.trim() || "Não consegui gerar uma resposta clara. Tente reformular a pergunta.";
  },

  async perguntar(texto, contexto, aoPedaco) {
    const fontesRAG = this._pesquisarBase(texto);
    const contextoConhecimento = fontesRAG.map(s =>
      `TEMA: ${s.topic}\nTÍTULO: ${s.title}\nRESUMO: ${s.summary}\nFONTE: ${s.reference}`
    ).join("\n\n");

    // FALLBACK: O dispositivo não suporta modelo local ou está offline sem o cache pronto
    if (!this.pronto()) {
      const respostaFallback = fontesRAG.length > 0
        ? `**${fontesRAG[0].title}**\n\n${fontesRAG[0].summary}\n\n*(Modo offline: resposta direta da base de conhecimento)*`
        : "O motor de inteligência não está carregado e não encontrei este tópico na base estática. Verifique a sua ligação à internet para descarregar o modelo.";
      
      if (aoPedaco) aoPedaco(respostaFallback);
      return respostaFallback;
    }

    // EXECUÇÃO SEGURA DO MODELO COM GUARDRAILS E RAG
    const sistema = 
`Você é o coach de um app de dieta e treino. Responda em português do Brasil.

REGRAS ABSOLUTAS:
1. Use SOMENTE os números do CONTEXTO e a BASE LOCAL abaixo. Nunca invente dados.
2. Se a pergunta exigir um dado que não está no contexto, diga o que a pessoa precisa registrar.
3. Não dê diagnóstico médico, não prescreva medicamentos nem sugira restrição extrema.
4. Seja curto e direto: no máximo dois parágrafos.
5. Não repita o contexto inteiro na resposta. Use apenas o necessário.

CONTEXTO (dados reais desta pessoa):
${contexto}

BASE LOCAL (Conhecimento recuperado):
${contextoConhecimento || "Nenhum trecho estático acionado."}`;

    try {
      const fluxo = await this.engine.chat.completions.create({
        messages: [{ role: 'system', content: sistema }, { role: 'user', content: texto }],
        temperature: 0.2, // Reduzido para focar na base semântica sem inventar detalhes
        max_tokens: 420, 
        stream: true
      });

      let out = '';
      for await (const p of fluxo) {
        const d = p.choices && p.choices[0] && p.choices[0].delta;
        if (d && d.content) { 
          out += d.content; 
          if (aoPedaco) aoPedaco(out); 
        }
      }
      
      return this._validarResposta(out, fontesRAG);
    } catch (e) {
      // Evita o crash da UI caso o navegador mate o processo de GPU por falta de RAM a meio da inferência
      const erroMsg = "\n\n*(A geração foi interrompida. Verifique a memória do dispositivo ou tente novamente.)*";
      if (aoPedaco) aoPedaco(erroMsg);
      return erroMsg;
    }
  },

  async descarregar() {
    if (this.engine && this.engine.unload) { try { await this.engine.unload(); } catch (e) {} }
    this.engine = null; this.modelo = null;
  }
};