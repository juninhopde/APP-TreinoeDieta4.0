/* ══════════════════════════════════════════════════════════
   IA EXTERNA — BYOK (Bring Your Own Key) DEFINITIVA
   ══════════════════════════════════════════════════════════ */

const CHAVE_IA_PREFIXO = 'ctrl.ia.';

const IA_PROVEDORES = {
  gemini: {
    rot: 'Google Gemini',
    etiqueta: 'camada gratuita',
    modeloPadrao: 'gemini-1.5-flash',
    modelos: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'],
    ondePegar: 'aistudio.google.com/apikey',
    custo: 'Gratuito com a sua conta Google. Crie a chave em aistudio.google.com → "Get API key".',
    privacidade: 'O Google pode usar pedidos da camada gratuita para melhorar os seus modelos.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      // Limpa espaços acidentais da chave sem travar os novos formatos (AQ. ou AIza)
      const chaveLimpa = String(chave || '').trim();
      
      if (chaveLimpa.length < 15) {
        throw new Error('Chave inválida ou muito curta. Verifique se copiou a chave completa gerada no Google AI Studio.');
      }

      // A chave é passada via URL para evitar bloqueios de CORS no navegador
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        + encodeURIComponent(modelo || this.modeloPadrao)
        + ':generateContent?key=' + encodeURIComponent(chaveLimpa);
        
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ parts: [{ text: pergunta }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      });
      
      if (!r.ok) {
        throw erroIA(r.status, await r.text(), 'gemini');
      }
      
      const j = await r.json();
      const c = (j.candidates || [])[0];
      if (!c) throw new Error('Resposta vazia do provedor Gemini.');
      return ((c.content && c.content.parts) || []).map(p => p.text || '').join('\n');
    }
  },

  openai: {
    rot: 'OpenAI',
    etiqueta: 'pago por uso',
    modeloPadrao: 'gpt-4o-mini',
    modelos: ['gpt-4o-mini', 'gpt-4o'],
    ondePegar: 'platform.openai.com/api-keys',
    custo: 'Pago por uso. Fração de centavo por pergunta no modelo mini.',
    privacidade: 'A OpenAI não treina com dados de API por padrão.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + chave.trim() },
        body: JSON.stringify({
          model: modelo || this.modeloPadrao, max_tokens: 600, temperature: 0.2,
          messages: [{ role: 'system', content: sistema }, { role: 'user', content: pergunta }]
        })
      });
      if (!r.ok) throw erroIA(r.status, await r.text(), 'openai');
      const j = await r.json();
      return (((j.choices || [])[0] || {}).message || {}).content || '';
    }
  },

  anthropic: {
    rot: 'Anthropic Claude',
    etiqueta: 'pago por uso',
    modeloPadrao: 'claude-3-haiku-20240307',
    modelos: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620'],
    ondePegar: 'console.anthropic.com',
    custo: 'Pago por uso.',
    privacidade: 'A Anthropic não treina com dados de API.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': chave.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: modelo || this.modeloPadrao, max_tokens: 600, system: sistema,
          messages: [{ role: 'user', content: pergunta }]
        })
      });
      if (!r.ok) throw erroIA(r.status, await r.text(), 'anthropic');
      const j = await r.json();
      return (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
    }
  }
};

function erroIA(status, corpo, prov) {
  let msg = String(corpo || '').replace(/\s+/g, ' ').slice(0, 200);
  try {
    const j = JSON.parse(corpo);
    if (j.error && j.error.message) msg = j.error.message;
  } catch (e) {}

  if (status === 400) return new Error('Pedido rejeitado (400). Detalhe: ' + msg);
  if (status === 401 || status === 403) return new Error('Chave recusada (401/403). Verifique se copiou corretamente.');
  if (status === 404) return new Error('Modelo ou URL não encontrado (404). Selecione gemini-1.5-flash.');
  if (status === 429) return new Error('Cota diária esgotada (429). Aguarde alguns minutos.');
  return new Error('Erro ' + status + '. ' + msg);
}

function traduzirFalha(err) {
  const m = String(err && err.message || err);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(m))
    return new Error('Sem conexão ao provedor. Verifique a sua internet.');
  return err instanceof Error ? err : new Error(m);
}

function sistemaIA(contexto, intensidade) {
  const tom = {
    normal:  'Tom: informativo e leve.',
    firme:   'Tom: firme e direto, cobrando o que ficou para trás.',
    hard:    'Tom: exigente. Peça justificativa objetiva.',
    hardmax: 'Tom: mínimo de palavras. Entregue só a ação concreta.'
  }[intensidade] || 'Tom: firme e direto.';

  return `Você é o coach dentro de um app de dieta e treino. Fale português do Brasil de forma natural.

REGRAS ABSOLUTAS:
1. Use APENAS os números do CONTEXTO abaixo.
2. Se faltarem dados, diga o que a pessoa precisa registrar.
3. Não prescreva medicamentos.
4. Diante de qualquer sinal de risco, oriente a busca por um profissional.
5. Para registrar uma ação, proponha o JSON da ferramenta exato: {"ferramenta":"nome","argumentos":{...}}

${tom}

CONTEXTO:
${contexto}`;
}

const IAChave = {
  ler(prov) { try { return localStorage.getItem(CHAVE_IA_PREFIXO + prov) || ''; } catch (e) { return ''; } },
  gravar(prov, v) {
    try { v ? localStorage.setItem(CHAVE_IA_PREFIXO + prov, v) : localStorage.removeItem(CHAVE_IA_PREFIXO + prov); }
    catch (e) {}
  },
  algumaConfigurada() { return Object.keys(IA_PROVEDORES).some(p => !!this.ler(p)); }
};

async function testarIA(prov, modelo) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Cole a chave antes de testar.');
  const t = await p.chamar({
    chave, modelo: modelo || p.modeloPadrao,
    sistema: 'Responda apenas: ok',
    pergunta: 'Responda apenas a palavra ok.'
  }).catch(e => { throw traduzirFalha(e); });
  if (!t || !t.trim()) throw new Error('O provedor respondeu vazio.');
  return t.trim().slice(0, 40);
}

async function perguntarIA(prov, modelo, contexto, pergunta, intensidade) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Sem chave configurada.');

  return await p.chamar({
    chave,
    modelo: modelo || p.modeloPadrao,
    sistema: sistemaIA(contexto, intensidade),
    pergunta
  }).catch(e => { throw traduzirFalha(e); });
}