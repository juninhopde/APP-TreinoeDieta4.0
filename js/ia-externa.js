/* ══════════════════════════════════════════════════════════
   IA EXTERNA — BYOK (Bring Your Own Key)

   Cada utilizador coloca a sua própria chave.
   Nenhuma chave do dono do app. Zero custo partilhado.
   A chamada sai do browser diretamente para o provedor.

   REGRA PRINCIPAL: isto é um extra. O assistente embutido
   (ia-local.js + saber.js) funciona sem chave, offline,
   instantâneo. Se esta camada falhar, o app volta sozinho
   ao embutido e avisa — nunca fica mudo.
   ══════════════════════════════════════════════════════════ */

const CHAVE_IA_PREFIXO = 'ctrl.ia.';

const IA_PROVEDORES = {
  gemini: {
    rot: 'Google Gemini',
    etiqueta: 'camada gratuita',
    /* MODELOS QUE EXISTEM DE FACTO (verificados em 2025):
       gemini-1.5-flash  → recomendado, gratuito, estável, funciona sem restrição do browser
       gemini-1.5-pro    → mais capaz, ainda gratuito com limite menor
       gemini-2.0-flash-lite → novo, ainda em testing, pode funcionar
       NÃO EXISTEM: gemini-2.5-flash, gemini-3.5-flash, gemini-3.6-flash */
    modeloPadrao: 'gemini-1.5-flash',
    modelos: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'],
    ondePegar: 'aistudio.google.com/apikey',
    custo: 'Gratuito com a tua conta Google. Cria a chave em aistudio.google.com → "Get API key". O modelo gemini-1.5-flash funciona direto do celular sem restrição.',
    privacidade: 'O Google pode usar pedidos da camada gratuita para melhorar os seus modelos. Na camada paga (Gemini API com billing), isso não acontece.',
    async chamar({ chave, modelo, sistema, pergunta }) {
      // A chave vai na URL (parâmetro ?key=) para máxima compatibilidade com browsers mobile
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
    custo: 'Pago por uso. Fracção de cêntimo por pergunta no modelo mini.',
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
    modeloPadrao: 'claude-haiku-4-5-20251001',
    modelos: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
    ondePegar: 'console.anthropic.com',
    custo: 'Pago por uso.',
    privacidade: 'A Anthropic não treina com dados de API por padrão. Requer cabeçalho especial para chamada direta do browser.',
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
    // tenta extrair mensagem útil do JSON de erro
    try {
      const j = JSON.parse(corpo);
      const msg = (j.error && j.error.message) || t;
      if (/not found|not exist|invalid.*model/i.test(msg))
        return new Error('Modelo não existe neste provedor. Escolhe outro na lista de modelos em Ajustes.');
      return new Error('Pedido rejeitado: ' + msg.slice(0, 100));
    } catch (e) {}
    return new Error('Pedido rejeitado (400). Verifica o modelo selecionado.');
  }
  if (status === 401 || status === 403) return new Error('Chave inválida ou sem permissão. Confirma que copiaste o texto completo da chave.');
  if (status === 404) return new Error('Modelo não encontrado neste provedor. Seleciona "gemini-1.5-flash" na lista de modelos.');
  if (status === 429) return new Error('Cota do dia esgotada ou pedidos demasiado rápidos. Aguarda alguns minutos.');
  if (status >= 500) return new Error('O provedor está temporariamente fora do ar (' + status + '). Tenta de novo em instantes.');
  return new Error('Erro ' + status + '. ' + t.slice(0, 80));
}

/* Traduz falha de rede para mensagem útil */
function traduzirFalha(err) {
  const m = String(err && err.message || err);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(m))
    return new Error('Não consegui chegar ao provedor. Verifica a ligação à internet. Se estás numa rede corporativa, ela pode bloquear este domínio.');
  return err instanceof Error ? err : new Error(m);
}

/* ── Prompt do sistema ── */
function sistemaIA(contexto, intensidade) {
  const tom = {
    normal:  'Tom: informativo e leve. Vai ao ponto.',
    firme:   'Tom: firme e direto. Cobra o que ficou para trás e propõe a próxima ação.',
    hard:    'Tom: exigente. Pede justificativa objetiva do que não foi cumprido e propõe o ajuste.',
    hardmax: 'Tom: mínimo de palavras. Entrega só a próxima ação concreta.'
  }[intensidade] || 'Tom: firme e direto.';

  return `Você é o coach de saúde e desempenho dentro de um app de dieta e treino. Fala português do Brasil.

REGRAS ABSOLUTAS — nunca violes:
1. Usa APENAS os números do CONTEXTO abaixo. Nunca inventes peso, caloria, macro, medida ou data.
2. Se faltar dado, diz o que a pessoa precisa registrar. Não estimes para preencher lacunas.
3. Nunca cites estudo, artigo ou número de pesquisa específico. Usa "diretrizes gerais" e orienta confirmar com profissional.
4. Não diagnostiques. Não orientes início, troca, dose ou suspensão de medicamento.
5. Não sugiras perda acima de 1% do peso por semana, jejum prolongado, nem ingestão abaixo de 1500 kcal (homens) / 1200 (mulheres).
6. Diante de sinal de risco — dor torácica, falta de ar, desmaio, vômito provocado, laxante, gestação, lesão aguda — para e encaminha para profissional.
7. Cobra COMPORTAMENTO e PROCESSO. Nunca humilhes, culpes ou julgues o corpo da pessoa.
8. Máximo dois parágrafos curtos e diretos.
9. Para registrar ação, propõe JSON de ferramenta: {"ferramenta":"nome","argumentos":{...}}

FERRAMENTAS (usa só quando a pessoa pede uma ação):
- registrar_refeicao → frase (texto do que comeu)
- registrar_peso → kg (número)
- registrar_passos → passos (número)
- gerar_cardapio → modo (padrao|economico|roca)
- mudar_intensidade → nivel (normal|firme|hard|hardmax)
- mudar_fase → fase (perda|manutencao|recuperacao)

${tom}

CONTEXTO (dados reais desta pessoa, calculados pelo app):
${contexto}`;
}

/* ── Acesso à chave (fora do backup) ── */
const IAChave = {
  ler(prov) { try { return localStorage.getItem(CHAVE_IA_PREFIXO + prov) || ''; } catch (e) { return ''; } },
  gravar(prov, v) {
    try { v ? localStorage.setItem(CHAVE_IA_PREFIXO + prov, v) : localStorage.removeItem(CHAVE_IA_PREFIXO + prov); }
    catch (e) {}
  },
  algumaConfigurada() { return Object.keys(IA_PROVEDORES).some(p => !!this.ler(p)); }
};

/* ── Teste de conexão ── */
async function testarIA(prov, modelo) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Cola a chave antes de testar.');
  const t = await p.chamar({
    chave, modelo: modelo || p.modeloPadrao,
    sistema: 'Responde apenas: ok',
    pergunta: 'Responde apenas a palavra ok.'
  }).catch(e => { throw traduzirFalha(e); });
  if (!t || !t.trim()) throw new Error('O provedor respondeu vazio.');
  return t.trim().slice(0, 40);
}

/* ── Pergunta com integração do agente ── */
async function perguntarIA(prov, modelo, contexto, pergunta, intensidade) {
  const p = IA_PROVEDORES[prov];
  if (!p) throw new Error('Provedor desconhecido.');
  const chave = IAChave.ler(prov);
  if (!chave) throw new Error('Sem chave configurada para ' + p.rot + '.');

  const resposta = await p.chamar({
    chave,
    modelo: modelo || p.modeloPadrao,
    sistema: sistemaIA(contexto, intensidade),
    pergunta
  }).catch(e => { throw traduzirFalha(e); });

  return resposta;
}
