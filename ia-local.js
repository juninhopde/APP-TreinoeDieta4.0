/* ══════════════════════════════════════════════════════════
   ASSISTENTE LOCAL (opcional)

   Roda um modelo de linguagem dentro do próprio navegador via
   WebGPU. Sem login, sem chave, sem servidor, sem custo — e
   sem nenhum dado saindo do aparelho.

   O preço é o download do modelo na primeira vez (centenas de
   MB a alguns GB), guardado em cache para funcionar offline
   depois.

   Regra de projeto: o modelo NÃO calcula nada. Os números vêm
   prontos do motor de diagnóstico e entram como contexto. Um
   modelo pequeno é razoável para conversar sobre fatos dados,
   e péssimo para produzir fatos. Aqui ele só faz a primeira
   coisa.
   ══════════════════════════════════════════════════════════ */

const IA_CDN = 'https://esm.run/@mlc-ai/web-llm';

const IAL = {
  engine: null,
  modelo: null,
  carregando: false,
  lib: null,

  suportado() {
    return typeof navigator !== 'undefined' && !!navigator.gpu;
  },

  async _lib() {
    if (this.lib) return this.lib;
    this.lib = await import(/* webpackIgnore: true */ IA_CDN);
    return this.lib;
  },

  /* Lista modelos pequenos o bastante para celular, tirados do
     catálogo da própria biblioteca — assim nenhum identificador
     fica fixo no código e envelhecendo. */
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
          && !id.includes('1k')                        // variantes de contexto curto
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
    if (!this.suportado()) throw new Error('Este navegador não tem WebGPU. O assistente local não roda aqui.');
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

  async perguntar(texto, contexto, aoPedaco) {
    if (!this.engine) throw new Error('Assistente ainda não carregado.');

    const sistema =
`Você é um assistente dentro de um app de dieta e treino, falando português do Brasil.

REGRAS ABSOLUTAS:
1. Use SOMENTE os números do CONTEXTO abaixo. Nunca invente peso, caloria, macro ou medida.
2. Se a pergunta exigir um dado que não está no contexto, diga que o app ainda não tem esse dado e o que a pessoa precisa registrar.
3. Não dê diagnóstico médico, não fale sobre medicamento, não sugira jejum prolongado nem restrição extrema. Nesses casos, oriente a procurar médico ou nutricionista.
4. Seja curto e direto: no máximo dois parágrafos.
5. Não repita o contexto inteiro, use só o que responde a pergunta.

CONTEXTO (dados reais desta pessoa):
${contexto}`;

    const fluxo = await this.engine.chat.completions.create({
      messages: [{ role: 'system', content: sistema }, { role: 'user', content: texto }],
      temperature: 0.4, max_tokens: 420, stream: true
    });

    let out = '';
    for await (const p of fluxo) {
      const d = p.choices && p.choices[0] && p.choices[0].delta;
      if (d && d.content) { out += d.content; if (aoPedaco) aoPedaco(out); }
    }
    return out;
  },

  async descarregar() {
    if (this.engine && this.engine.unload) { try { await this.engine.unload(); } catch (e) {} }
    this.engine = null; this.modelo = null;
  }
};
