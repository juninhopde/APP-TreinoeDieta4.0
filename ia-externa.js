/* ══════════════════════════════════════════════════════════
   CONVERSA LIVRE COM IA EXTERNA — opcional

   Cada usuário põe a chave dele. Não existe chave do dono do
   app: ninguém consome cota de ninguém.

   A chamada sai do navegador direto para o provedor, sem
   servidor no meio. A chave fica no armazenamento local do
   aparelho de quem digitou, em espaço separado do resto, e
   nunca entra no backup.

   REGRA QUE ATRAVESSA TUDO: isto é um extra. O assistente
   embutido responde sem chave, sem internet e sem custo. Se
   esta camada falhar por qualquer motivo — chave errada,
   cota estourada, provedor fora, avião sem wi-fi — o app
   volta sozinho para o embutido e avisa. Nada aqui é
   caminho crítico.
   ══════════════════════════════════════════════════════════ */

const CHAVE_IA_PREFIXO = 'ctrl.ia.';   // uma por provedor, fora do backup

const IA_PROVEDORES = {
  gemini: {
    rot: 'Google Gemini',
    etiqueta: 'camada gratuita',
    modeloPadrao: 'gemini-2.5-flash',
    modelos: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    ondePegar: 'aistudio.google.com/apikey',
    custo: 'Camada gratuita permanente, sem cartão de crédito. Cada pessoa tem a própria cota diária.',
    privacidade: 'O Google declara que requisições da camada gratuita podem ser usadas para treinar os modelos dele. Suas perguntas e seus números passam por isso. Na camada paga, não.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        + encodeURIComponent(modelo || this.modeloPadrao) + ':generateContent';
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ parts: [{ text: pergunta }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
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
          model: modelo || this.modeloPadrao, max_tokens: 600, temperature: 0.3,
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
    modeloPadrao: 'claude-haiku-4-5-20251001',
    modelos: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
    ondePegar: 'console.anthropic.com',
    custo: 'Pago por uso.',
    privacidade: 'A Anthropic não treina com dados de API por padrão. O provedor exige um cabeçalho que autoriza chamada direta do navegador — eles consideram isso má prática justamente porque a chave fica no cliente.',
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
  if (status === 401 || status === 403) return new Error('Chave inválida ou sem permissão.');
  if (status === 404) return new Error('Modelo não encontrado neste provedor.');
  if (status === 429) return new Error('Cota do dia esgotada ou chamadas rápidas demais.');
  if (status >= 500) return new Error('O provedor está fora do ar (' + status + ').');
  return new Error('Erro ' + status + '. ' + t);
}

/* Regras que o modelo recebe. O número vem sempre do app:
   modelo de linguagem erra aritmética, e aqui número errado
   vira meta errada. */
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
2. Se faltar dado, diga o que a pessoa precisa registrar. Não estime para preencher lacuna.
3. Nunca cite estudo, artigo, autor ou número de pesquisa. Se a pergunta exigir isso, diga que a recomendação segue diretrizes gerais e oriente confirmar com profissional.
4. Não diagnostique. Não oriente início, troca, dose ou suspensão de medicamento. Não prescreva.
5. Não sugira perda acima de 1% do peso corporal por semana, jejum prolongado, nem ingestão abaixo de 1500 kcal para homens ou 1200 para mulheres.
6. Diante de sinal de risco — dor torácica, falta de ar, desmaio, vômito provocado, uso de laxante, gestação, lesão aguda — pare a orientação e encaminhe para profissional.
7. Cobre COMPORTAMENTO e PROCESSO. Nunca humilhe, nunca culpe a pessoa, nunca julgue o corpo dela.
8. No máximo dois parágrafos.

${tom}

CONTEXTO (dados reais desta pessoa, calculados pelo app):
${contexto}`;
}

/* Acesso à chave, por provedor, fora do backup. */
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

/* Teste de conexão: gasta uma chamada mínima e diz se funciona.
   Melhor descobrir aqui do que no meio de uma pergunta. */
/* fetch rejeita com TypeError quando não há rede, o domínio está
   bloqueado ou o CORS barrou. "Failed to fetch" não ajuda ninguém. */
function traduzirFalha(err) {
  const m = String(err && err.message || err);
  if (/failed to fetch|networkerror|load failed/i.test(m))
    return new Error('Não consegui alcançar o provedor. Verifique a internet — e se estiver numa rede corporativa, ela pode bloquear o domínio.');
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

async function perguntarIA(prov, modelo, contexto, pergunta, intensidade) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Sem chave configurada para ' + p.rot + '.');
  return p.chamar({ chave, modelo, sistema: sistemaIA(contexto, intensidade), pergunta })
    .catch(e => { throw traduzirFalha(e); });
}
