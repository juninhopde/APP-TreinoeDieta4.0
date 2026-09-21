# Controle 4.1 — Dieta, Treino e Coach

PWA de emagrecimento com periodização de treino, gasto energético medido, coach
com cobrança calibrável e assistente de conhecimento embutido. Funciona offline.
Os dados ficam no aparelho.

---

## Onde publicar

| Host | Funciona? |
|---|---|
| **Netlify** | Sim |
| **Vercel** | Sim |
| **Cloudflare Pages** | Sim |
| **GitHub Pages** | Sim |

O app é estático puro e **não precisa de servidor para nada**. Escolha o que
preferir: todos funcionam igual, com https e instalação na tela inicial.

### Publicando

1. Suba o conteúdo desta pasta num repositório do GitHub, mantendo as pastas.
2. **Vercel / Netlify / Cloudflare:** importe o repositório. Framework Preset
   **Other**. Não há build. Deploy.
3. **GitHub Pages:** Settings → Pages → branch `main`, pasta `/ (root)`.

Para um teste rápido sem repositório: arraste a pasta em
[app.netlify.com/drop](https://app.netlify.com/drop).

### Instalar no celular

Abra o endereço no Chrome do Android → menu ⋮ → **Instalar app**.

---

## Nenhuma chave sua no projeto

**Você não configura chave nenhuma para publicar.** Nada de `.env`, nada de
variável de ambiente, nada de função serverless. Publicar com uma chave do dono
significaria que todo visitante consumiria aquela cota.

Cada usuário pode, **se quiser**, colar a própria chave em Ajustes para ter
conversa livre com um modelo de linguagem. A chave fica no `localStorage` do
aparelho dele, em espaço separado (`ctrl.ia.<provedor>`), **nunca entra no
backup exportado** e sai dali apenas para o provedor que ele escolheu.

O `index.html` traz um CSP restritivo justamente por isso: `connect-src` libera
só os provedores de IA e o banco público de alimentos, e nenhum script de
terceiro pode ser injetado para vazar a chave de alguém.

### Isso é opcional de verdade

O app inteiro funciona sem chave: seis telas, registro por texto livre, cardápio,
coach, jejum e 83 tópicos de conhecimento. Se a IA externa falhar por qualquer
motivo — chave errada, cota estourada, provedor fora, sem internet — o assistente
embutido **responde a mesma pergunta** e avisa o que houve.

---

## A IA como agente

O assistente não só responde: **executa**. São 13 ferramentas declaradas —
registrar refeição, peso, passos e cardio; gerar cardápio e lista de compras;
mudar fase e intensidade; definir a regra combinada; ensinar e lembrar.

Cada ferramenta tem validação de argumentos e política de confirmação. Ação que
grava dado do usuário **pede confirmação**; ação reversível executa direto. Tudo
vai para um log auditável visível em Ajustes.

### O que a IA não pode fazer

Três ferramentas existem apenas para que o modelo saiba que são proibidas — um
modelo que não conhece o limite tenta contorná-lo:

- `alterar_codigo` — o código do app não é editável em tempo de execução. Um erro
  silencioso ali viraria meta calórica errada sem revisão humana.
- `ajustar_meta_livre` — meta abaixo do piso ou déficit acima de 30% do gasto não
  são permitidos por nenhum caminho, inclusive por pedido direto.
- `apagar_dados` — ação destrutiva não fica ao alcance de interpretação de linguagem.

### Memórias com evidência

O app observa os próprios dados e escreve o que aprendeu: refeição que costuma
pular, dia da semana mais fraco, diferença de consumo no fim de semana, base
alimentar, dias de treino, padrão de proteína, janela de jejum habitual.

Toda memória carrega a **evidência** (quantas ocorrências, em que janela) e é
visível e apagável em Ajustes. Isso é personalização, não treinamento: o modelo
não muda, o contexto muda.

## A IA embutida

**Assistente embutido, determinístico, offline.** Sem chave, sem servidor, sem custo.

- **83 tópicos** de nutrição, treino e método, escritos e revisados
- Interpreta intenção e **executa**: registra refeição por texto livre, monta
  cardápio, gera lista de compras, liga o modo HARD, marca tarefa
- Consulta o que **você ensinou** em Ajustes, com prioridade sobre o de fábrica
- Ícone flutuante em todas as telas, com badge do número de pontos críticos

Ordem do raciocínio, e ela importa:

```
segurança → ação pedida → conhecimento próprio → conhecimento de fábrica
          → dados do usuário → escopo
```

Cada resposta da base já vem com os números da pessoa injetados.

Opcionalmente, quem quiser conversa livre com modelo pode baixar um via WebGPU
pelo próprio navegador. É download do usuário, não custo do publicador.

**Por que não um LLM embutido:** um modelo pequeno o bastante para caber offline
sabe menos nutrição que esta base e inventa dose, macro e estudo. Aqui nada é
gerado — tudo foi escrito, conferido e ligado ao dado real.

---

## Arquitetura

```
js/dados.js         460 alimentos + 57 exercícios
js/treino.js        mesociclo, progressão dupla, técnica, % gordura Navy
js/metabolismo.js   gasto adaptativo por balanço energético
js/analise2.js      séries por músculo, peso-tendência, micros, padrões cruzados
js/diagnostico.js   24 variáveis de diagnóstico
js/cardapio.js      gerador de cardápio, modos, troca por função, lista de compras
js/coach.js         missão do dia, intensidade, cobrança, Safety Engine
js/agente.js        ferramentas que a IA pode executar, com validação e log
js/memoria.js       observador de padrões: memórias com evidência
js/fases.js         perda, manutenção e recuperação; faixa, reganho, regra combinada
js/jejum.js         janela de jejum pelos horários reais das refeições
js/saber.js         base de conhecimento de nutrição, treino e método
js/registro-nl.js   registro por linguagem natural
js/assistente.js    interpretação de intenção e memória offline
js/off.js           Open Food Facts + código de barras
js/ia-externa.js    conversa livre com a chave do próprio usuário (opcional)
js/ia-local.js      modelo no navegador (opcional, WebGPU)
js/app.js           estado, telas e eventos
```

Sem framework, sem build, sem dependência. HTML, CSS e JavaScript.

---

## Segurança

O `Safety Engine` (`js/coach.js`) intercepta toda mensagem **antes** de qualquer
interpretação, inclusive antes da base de conhecimento. Sete grupos: emergência,
lesão aguda, comportamento alimentar de risco, meta extrema, dúvida sobre
medicação, gestação e usuário menor de idade.

Quando dispara: encaminha para o profissional adequado, rebaixa a intensidade do
coach para Normal e **trava os modos HARD por até 14 dias**. Segurança vence
cobrança em todos os níveis, sem exceção.

O app não diagnostica, não prescreve e não substitui médico, nutricionista,
psicólogo ou educador físico.

---

## Testes

Oito suítes em Playwright, fora do repositório do app, cobrindo: migração entre
versões, app zerado nas seis telas, fluxo completo do zero, as 24 variáveis de
diagnóstico, registro por linguagem natural, roteamento de intenção e de
conhecimento, missão do dia, os quatro níveis de intensidade, justificativa com
replanejamento, sete cenários do Safety Engine, cardápio nos três modos, troca
por função nutricional, lista de compras, jejum, ajustes do assistente,
exportações e tema escuro.
