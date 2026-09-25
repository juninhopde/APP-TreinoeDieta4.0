/* ══════════════════════════════════════════════════════════
   CONVERSA LIVRE COM IA EXTERNA — opcional (Integrada com Agente)
   ══════════════════════════════════════════════════════════ */

const CHAVE_IA_PREFIXO = 'ctrl.ia.';

const IA_PROVEDORES = {
  gemini: {
    rot: 'Google Gemini',
    etiqueta: 'camada gratuita',
    modeloPadrao: 'gemini-3.6-flash',
    modelos: ['gemini-3.6-flash', 'gemini-3.5-flash'],
    ondePegar: 'aistudio.google.com/apikey',
    custo: 'Camada gratuita permanente, sem cartão de crédito. Cada pessoa tem a própria cota diária.',
    privacidade: 'O Google declara que requisições da camada gratuita podem ser usadas para treinar os modelos dele. Na camada paga, não.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      // FIX: Passando a chave AQ. diretamente na URL para evitar o bug de cabeçalho da Google
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' 
        + encodeURIComponent(modelo || this.modeloPadrao) + ':generateContent?key=' + chave;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ parts: [{ text: pergunta }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      });
      if (!r.ok) throw erroIA(r.status, await r.text());
      const j = await r.json();
      const c = (j.candidates || [])[0];
      if (!c) throw new Error('Resposta vazia do provedor.');
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
      if (!r.ok) throw erroIA(r.status, await r.text());
      const j = await r.json();
      const m = ((j.choices || [])[0] || {}).message || {};
      return m.content || '';
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
          'content-type': 'application/json', 'x-api-key': chave,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: modelo || this.modeloPadrao, max_tokens: 600, system: sistema,
          messages: [{ role: 'user', content: pergunta }]
        })
      });
      if (!r.ok) throw erroIA(r.status, await r.text());
      const j = await r.json();
      return (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
    }
  }
};

function erroIA(status, corpo) {
  const t = String(corpo || '').replace(/\s+/g, ' ').slice(0, 120);
  if (status === 400) return new Error('Requisição rejeitada. Confira o modelo escolhido. ' + t);
  if (status === 401 || status === 403) return new Error('Chave inválida. Confirme se colou o texto inteiro da chave.');
  if (status === 404) return new Error('Modelo descontinuado pela Google. Escolha o 3.6-flash na lista.');
  if (status === 429) return new Error('Cota do dia esgotada ou chamadas rápidas demais.');
  if (status >= 500) return new Error('O provedor está fora do ar (' + status + ').');
  return new Error('Erro ' + status + '. ' + t);
}

function sistemaIA(contexto, intensidade) {
  const tom = {
    normal:  'Tom: informativo e leve.',
    firme:   'Tom: firme e direto, cobrando o que ficou para trás.',
    hard:    'Tom: exigente. Peça justificativa objetiva do que não foi cumprido e proponha o ajuste.',
    hardmax: 'Tom: mínimo de palavras. Entregue só a próxima ação concreta.'
  }[intensidade] || 'Tom: firme e direto.';

  return `Você é o coach dentro de um app de dieta e treino, falando português do Brasil.

REGRAS ABSOLUTAS:
1. Use SOMENTE os números do CONTEXTO. Nunca invente peso, caloria, macro, medida ou data.
2. Se faltar dado, diga o que a pessoa precisa registrar.
3. Não diagnostique, nem prescreva medicamentos.
4. Diante de sinal de risco, pare a orientação e encaminhe para profissional.
5. Cobre COMPORTAMENTO. Nunca humilhe ou culpe a pessoa.

FERRAMENTAS DISPONÍVEIS (Use comandos exatos se necessário):
- Para registrar peso: [CMD:registrarPeso|VALOR]
- Para ativar buffer de fim de semana: [CMD:ativarModoEvento|DIA|NIVEL_1_A_3]
(Exemplo: Se o usuário disser "Sábado tenho churrasco", responda com [CMD:ativarModoEvento|Sábado|2])

${tom}

CONTEXTO (dados reais desta pessoa):
${contexto}`;
}

const IAChave = {
  ler(prov) { try { return localStorage.getItem(CHAVE_IA_PREFIXO + prov) || ''; } catch (e) { return ''; } },
  gravar(prov, v) {
    try {
      const k = CHAVE_IA_PREFIXO + prov;
      v ? localStorage.setItem(k, v) : localStorage.removeItem(k);
    } catch (e) {}
  },
  algumaConfigurada() { return Object.keys(IA_PROVEDORES).some(p => !!this.ler(p)); }
};

function traduzirFalha(err) {
  const m = String(err && err.message || err);
  if (/failed to fetch|networkerror|load failed/i.test(m))
    return new Error('Não consegui alcançar o provedor. Verifique a internet ou bloqueios de CORS/Rede Corporativa.');
  return err instanceof Error ? err : new Error(m);
}

async function testarIA(prov, modelo) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Cole a chave antes de testar.');
  const t = await p.chamar({
    chave, modelo,
    sistema: 'Responda somente: ok',
    pergunta: 'Responda somente a palavra ok.'
  }).catch(e => { throw traduzirFalha(e); });
  if (!t || !t.trim()) throw new Error('O provedor respondeu vazio.');
  return t.trim().slice(0, 40);
}

/* ── INTERCETAR COMANDOS DO AGENTE ── */
async function perguntarIA(prov, modelo, contexto, pergunta, intensidade) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Sem chave configurada para ' + p.rot + '.');
  
  let resposta = await p.chamar({ 
    chave, 
    modelo, 
    sistema: sistemaIA(contexto, intensidade), 
    pergunta 
  }).catch(e => { throw traduzirFalha(e); });

  if (typeof Agente !== 'undefined' && resposta.includes('[CMD:')) {
    const toolResult = Agente.validarComando(resposta);
    
    if (toolResult && toolResult.executado) {
       resposta += `\n\n*(Ação do Coach: ${toolResult.resultado})*`;
    }
    resposta = resposta.replace(/\[CMD:[^\]]+\]/g, '').trim();
  }

  return resposta;
}