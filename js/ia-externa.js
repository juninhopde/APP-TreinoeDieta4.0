/* ══════════════════════════════════════════════════════════
   IA EXTERNA — BYOK (Bring Your Own Key) DEFINITIVA

   Cada utilizador coloca a sua própria chave.
   Nenhuma chave do dono do app. Zero custo partilhado.
   A chamada sai do browser diretamente para o provedor.
   ══════════════════════════════════════════════════════════ */

const CHAVE_IA_PREFIXO = 'ctrl.ia.';

const IA_PROVEDORES = {
  gemini: {
    rot: 'Google Gemini',
    etiqueta: 'camada gratuita',
    modeloPadrao: 'gemini-1.5-flash',
    modelos: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    ondePegar: 'aistudio.google.com/apikey',
    custo: 'Gratuito com a sua conta Google. Crie a chave em aistudio.google.com → "Get API key". O modelo gemini-1.5-flash funciona direto do celular sem restrição.',
    privacidade: 'O Google pode usar pedidos da camada gratuita para melhorar os seus modelos. Na camada paga, isso não acontece.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      // Passagem de chave via URL resolve bloqueios de cabeçalho em chaves recentes (AQ.)
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        + encodeURIComponent(modelo || this.modeloPadrao)
        + ':generateContent?key=' + encodeURIComponent(chave);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ parts: [{ text: pergunta }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      });
      if (!r.ok) throw erroIA(r.status, await r.text(), 'gemini');
      const j = await r.json();
      const c = (j.candidates || [])[0];
      if (!c) throw new Error('Resposta vazia do Gemini.');
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
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + chave },
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
    privacidade: 'A Anthropic não treina com dados de API por padrão.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': chave,
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
  const t = String(corpo || '').replace(/\s+/g, ' ').slice(0, 200);
  if (status === 400) {
    try {
      const j = JSON.parse(corpo);
      const msg = (j.error && j.error.message) || t;
      if (/not found|not exist|invalid.*model/i.test(msg))
        return new Error('Modelo não existe neste provedor. Escolha outro na lista de modelos em Ajustes.');
      return new Error('Pedido rejeitado: ' + msg.slice(0, 100));
    } catch (e) {}
    return new Error('Pedido rejeitado (400). Verifique o modelo selecionado.');
  }
  if (status === 401 || status === 403) return new Error('Chave inválida. Confirme se copiou o texto completo da chave.');
  if (status === 404) return new Error('Modelo não encontrado. Selecione "gemini-1.5-flash" na lista.');
  if (status === 429) return new Error('Cota do dia esgotada ou chamadas rápidas demais. Aguarde alguns minutos.');
  if (status >= 500) return new Error('O provedor está fora do ar (' + status + '). Tente de novo em instantes.');
  return new Error('Erro ' + status + '. ' + t.slice(0, 80));
}

function traduzirFalha(err) {
  const m = String(err && err.message || err);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(m))
    return new Error('Não foi possível alcançar o provedor. Verifique a internet ou bloqueios de rede corporativa.');
  return err instanceof Error ? err : new Error(m);
}

function sistemaIA(contexto, intensidade) {
  const tom = {
    normal:  'Tom: informativo e leve.',
    firme:   'Tom: firme e direto, cobrando o que ficou para trás.',
    hard:    'Tom: exigente. Peça justificativa objetiva do que não foi cumprido e proponha o ajuste.',
    hardmax: 'Tom: mínimo de palavras. Entregue só a próxima ação concreta.'
  }[intensidade] || 'Tom: firme e direto.';

  return `Você é o coach dentro de um app de dieta e treino. Fale português do Brasil.

REGRAS ABSOLUTAS:
1. Use APENAS os números do CONTEXTO abaixo.
2. Se faltar dado, diga o que a pessoa precisa registrar.
3. Não prescreva remédios.
4. Diante de sinal de risco, oriente a busca por um profissional.
5. Para registrar ação, proponha JSON de ferramenta exato: {"ferramenta":"nome","argumentos":{...}}

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