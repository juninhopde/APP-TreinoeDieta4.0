# Controle 4.1 — Dieta e Treino

App web instalável (PWA) para fase de perda de gordura. Funciona offline,
sem conta e sem servidor. Todos os dados ficam **no próprio celular**.

---

## O que mudou da 1.0 para a 2.0

A 1.0 era um sistema de **registro**: anotava o que você fez.
A 2.0 é um sistema de **prescrição**: diz o que fazer na semana 7.

| Novo na 2.0 | Para que serve |
|---|---|
| Mesociclo de 12 semanas | Adaptação (1–3), Acúmulo (4–7), Intensificação (8–11), Deload (12). Séries, faixa de reps e RIR mudam por fase. |
| Progressão dupla automática | A carga sobe sozinha quando você fecha o topo da faixa em todas as séries com o RIR alvo. Salto limitado a 10% da carga. |
| Campo de RIR por série | Sem saber o esforço, não se distingue progressão de teimosia. Alimenta a sugestão de carga. |
| Reavaliação a cada 4 semanas | Compara ritmo real com a faixa de 0,5–1% do peso por semana e propõe ajuste de calorias com base no seu dado. |
| Composição corporal (Navy) | Cintura + pescoço + altura → percentual de gordura, massa magra e massa de gordura. Só precisa de fita métrica. |
| Fotos de progresso | Antes/depois lado a lado, guardadas em IndexedDB. |
| Substituição por equivalente | Troca qualquer item do diário por outro com a mesma caloria e proteína próxima, com a gramagem já calculada. |
| Foto da refeição | Identifica os alimentos, casa com a tabela do app, e exige conferência das gramagens antes de salvar. |
| Cues de execução | Como fazer e qual o erro comum, em 43 exercícios. |
| Passos e cardio | Registro manual com gasto estimado por MET — mostrado, mas **não somado** ao orçamento. |
| Migração automática | Peso, diário, treinos, alimentos próprios e favoritos da 1.0 são importados no primeiro acesso. |

## Novidades da 4.1 — o assistente virou agente

**13 ferramentas** que a IA executa de verdade: registrar refeição, peso, passos
e cardio; gerar cardápio e lista de compras; mudar fase e intensidade; definir a
regra combinada; ensinar e lembrar.

Ação que grava dado **pede confirmação** com um cartão no chat mostrando o que
será feito e com quais valores. Ação reversível executa direto. Tudo fica num
**log auditável** em Ajustes — se algo mudou no app, está lá.

### Três coisas que a IA não faz

`alterar_codigo`, `ajustar_meta_livre` e `apagar_dados` existem declaradas como
proibidas, para que o modelo saiba o limite em vez de tentar contorná-lo.

Sobre a primeira, sendo direto: **IA que reescreve o próprio app é a pior ideia
possível** aqui. Um erro silencioso em código que calcula meta calórica para
pessoa obesa não tem quem revise.

### O app aprende sobre você

Um observador roda a cada abertura e transforma padrões em memórias com
**evidência à vista**:

> Costuma pular ou não registrar café da manhã — *28 de 28 dias (100%)*
> Come bem mais no fim de semana — *+831 kcal por dia contra os dias úteis*
> Costuma ficar bem abaixo da meta de proteína — *média de 28 g contra alvo de 180 g*
> Jejum noturno habitual de cerca de 15 horas — *média de 27 noites medidas*

Nove observadores ao todo. Só vira memória com repetição mínima — um dia não é
padrão. Tudo visível e apagável em Ajustes, e tudo entra no contexto das
respostas do assistente.


## Novidades da 4.0 — o app aprendeu a manter

Até aqui o app sabia uma coisa só: perder peso. Isso o deixava cego justamente
onde a maioria falha. **Obesidade é condição crônica** — tratamento que termina
em doze semanas não é tratamento, é temporada.

### Três fases

| Fase | O que muda |
|---|---|
| **Perda** | O que já existia: déficit ativo. |
| **Manutenção** | Meta igual ao gasto medido, déficit zero. Alvo vira **faixa de ±2%** em vez de número. Registro cai para 3 dias por semana; pesagem continua. |
| **Recuperação** | Acionada por reganho confirmado. Déficit leve, por tempo definido. |

A proteína **não** cai na manutenção — é ela que segura a massa magra construída.

### Detecção de reganho em três níveis

Tudo pela tendência, nunca pela balança do dia:

- **Amarelo** — acima da faixa por 2 semanas. Primeiro passo é conferir o registro.
- **Laranja** — 3% acima. Volta a déficit leve.
- **Vermelho** — 5% acima. O padrão mudou; reavalie o plano inteiro.

A diferença entre quem mantém e quem não mantém não é força de vontade: é agir
em 3% em vez de agir em 15%.

### Regra combinada

Você decide **antes**, com a cabeça fria, o peso-gatilho e o que fará. Quando a
tendência chega lá, o app não pergunta o que fazer — lembra o que **você**
decidiu. Decidir no momento do problema é o que não funciona.

### Peso-tendência agora acompanha

A suavização passou a ser consciente do intervalo entre pesagens: `alfa = 1 − e^(−Δdias/10)`.
Com alfa fixo, quem se pesava uma vez por semana tinha tendência atrasada em dois
meses — e o app deixaria de avisar reganho justamente por isso.

### Piso em todas as fases

Gasto medido implausivelmente baixo (registro incompleto, pesagem errada) não
vira meta: o piso de 1.500 kcal para homens e 1.200 para mulheres vale em perda,
manutenção e recuperação. E quando o gasto medido sai **abaixo do metabolismo
basal** — fisicamente impossível — o app avisa que o problema é o dado.

### Histórico de ciclos

Cada fase fechada vira registro comparável: duração, variação de peso, ritmo
médio e aderência. Depois de dois ciclos você enxerga o próprio padrão.


## Novidades da 3.9 — conversa livre com a sua chave

Em **Ajustes → Conversa livre com IA** cada pessoa pode colar a própria chave e
conversar com um modelo de linguagem. Três provedores: Gemini (camada gratuita,
sem cartão), OpenAI e Anthropic.

**Ninguém paga pela conta de ninguém.** Não existe chave do dono do app.

### O app não depende disso

Tudo continua funcionando sem chave nenhuma. E se a IA externa falhar — chave
errada, cota estourada, provedor fora do ar, sem internet — o assistente embutido
responde a mesma pergunta e avisa o motivo da queda. Testado: com chave inválida,
a pergunta "quanta proteína eu preciso" foi respondida pelo conhecimento
embutido, com a meta correta.

### Cuidados

- A chave fica no armazenamento deste navegador, em espaço separado, e **não entra
  no backup**
- Quem tiver acesso ao aparelho consegue vê-la. Trate como senha
- Cada provedor mostra o que faz com os dados, na hora da escolha
- O modelo recebe o diagnóstico **já calculado** e é instruído a não inventar
  número, não citar estudo e não falar de medicação


## Novidades da 3.8

| | |
|---|---|
| **Jejum automático** | Calculado pelo **horário real** em que você registra comida. Nada de configurar janela nem apertar "iniciar". |
| **83 tópicos de conhecimento** | Eram 43. Entrou o dobro de nutrição e de treino, sempre ligado aos seus números. |
| **Ensinar o assistente** | Em Ajustes você escreve pergunta e resposta. Fica salvo no aparelho e **tem prioridade** sobre o conhecimento de fábrica. |
| **Alimentos a evitar** | Lista em Ajustes que o cardápio e as substituições passam a respeitar. |
| **Nome do assistente** | Chame de Coach, Sargento ou o que quiser. |
| **Ícone flutuante** | Abre a IA de qualquer tela, com badge do número de pontos críticos. |
| **Sem chave de API** | A função serverless foi **removida**. Publicar com chave do dono significaria cota do dono paga por visitante. |

### Os três números do jejum

- **Em jejum agora** — da última refeição registrada até este momento
- **Jejum noturno** — da última refeição de ontem à primeira de hoje
- **Janela de comida** — da primeira à última refeição do dia

Mais gráfico de 7 dias com a média. Item registrado antes desta versão não tem
hora gravada: nesses casos o app usa o horário padrão da refeição e **avisa que
parte é estimada**.

Jejum não é meta aqui — é consequência de quando você come, e só vira assunto se
você transformar em estratégia.

### Ensinar o assistente

Ajustes → Assistente. Escreva a pergunta e a resposta que você quer receber.
Exporte e importe em JSON para levar entre aparelhos: a importação **soma** ao
que já existe em vez de substituir.


## Novidades da 3.7 — o cérebro do assistente

**43 tópicos de nutrição, treino e método** escritos e revisados, cada um ligado
aos seus próprios números. Não é texto genérico: quando você pergunta quanta
proteína precisa, a resposta traz a sua meta, o motivo de ela ser calculada sobre
peso ajustado, e o que fazer na prática.

Cobre: déficit, proteína, carboidrato, gordura, fibra, água, álcool, refeição
livre, jejum, metabolismo lento, platô, contar caloria, IMC, oscilação da balança,
comer à noite, adoçante, ultraprocessado, sódio, suplementos, ovo, comer fora ·
por que musculação em déficit, cardio, séries por músculo, RIR e falha, progressão,
deload, dor muscular, aquecimento, descanso, recomposição, abdominal, tempo de
resultado, sono, treinar doente, treino em casa · como o gasto é calculado, método
Navy, ritmo ideal · motivação, recomeçar, comparação.

### Por que não um modelo de linguagem embutido

Um modelo pequeno o bastante para rodar offline sabe **menos** nutrição que esta
base — e inventa dose, confunde proteína com caloria e cita estudo que não existe.
Aqui nada é gerado: tudo foi escrito, conferido e ligado ao seu dado real.

### O tom muda com a intensidade

A mesma resposta em Normal, HARD e HARD MAX: o HARD chama pelo nome e vai direto
ao ponto; o HARD MAX corta de 395 para 246 caracteres, entregando só o essencial.
Muda a objetividade, nunca o respeito.

### Segurança continua acima de tudo

O Safety Engine roda **antes** da base de conhecimento. Pergunta sobre medicação,
meta extrema ou sinal de risco não recebe resposta técnica — recebe encaminhamento.


## Novidades da 3.6 — Cardápio e compras

| | |
|---|---|
| **Cardápio do dia** | Monta as 4 refeições a partir das suas metas atuais, priorizando o que você já come. Informa o desvio real em vez de fingir que fechou redondo. |
| **Três modos** | Padrão · **Econômico** (só o que é acessível e comum no Brasil) · **Da roça** (minimamente processado). |
| **Troca por função nutricional** | Proteína troca por proteína com o mesmo macro dentro de 30%, não só a mesma caloria. Trocar por caloria colocaria pão no lugar de frango. |
| **Registrar em um toque** | Cada refeição vai para o diário direto, ou o dia inteiro de uma vez. |
| **Lista de compras** | 7 dias consolidados, agrupada por tipo, com quantidades e marcação de comprado. |

Comandos no assistente: *"monta minha dieta de hoje"*, *"quero uma opção mais barata"*,
*"quero fazer dieta da roça"*, *"lista de compras"*.


## Novidades da 3.5 — Coach

| | |
|---|---|
| **Missão do dia** | Refeições, treino, água, passos e pesagem como tarefas com status: pendente, concluída, perdida, reagendada. |
| **Quatro intensidades** | Normal, Firme, HARD e HARD MAX. A escala muda frequência e objetividade da cobrança, nunca a dureza da linguagem. |
| **Justificativa e replanejamento** | Tarefa perdida no HARD pede o motivo em um toque e o app ajusta o plano: faltou tempo vira treino de 18 minutos, cansaço vira carga 20% menor. |
| **Safety Engine** | Intercepta toda mensagem antes de qualquer interpretação. Sete grupos de risco, encaminhamento certo e trava do modo HARD por 14 dias. |
| **Aderência 7 dias** | Média móvel, sem sequência que zera. Streak quebrada é o gatilho nº 1 de abandono. |
| **Função serverless** | api/coach.js para Vercel ou Netlify, com a chave protegida no servidor. |


## Novidades da 3.3 — assistente embutido

Conversa em **texto livre** sobre os seus números. Vem pronto no download, responde
instantaneamente, funciona offline e **nunca inventa dado**.

Pergunte como quiser: *"por que travei"*, *"quanto ainda posso comer hoje"*,
*"devo cortar caloria"*, *"to perdendo músculo"*, *"qual o treino de hoje"*,
*"quando chego na meta"*, *"to com fome o tempo todo"*, *"a balança subiu 2 kg"*.

Ele interpreta a intenção e monta a resposta a partir do diagnóstico real. Assunto
clínico — remédio, doença, jejum extremo — ele recusa e manda procurar profissional,
oferecendo o CSV do app para levar na consulta.

### Por que não vem um modelo de IA embutido

Não é escolha, é limite de plataforma:

- O GitHub **bloqueia arquivo acima de 100 MB**
- O GitHub Pages permite **site de no máximo 1 GB** e tem **100 GB/mês** de banda

O menor modelo de linguagem utilizável pesa 350–500 MB. Não cabe num arquivo, e se
coubesse, 200 downloads consumiriam a cota mensal inteira do site.

E há um motivo melhor: **um modelo de 269 MB não sabe quanto você comeu ontem.**
O assistente embutido sabe. Para perguntas sobre os seus dados, ele é mais preciso
que qualquer modelo pequeno — e instantâneo.

### Conversa livre continua disponível

Dentro do chat há o botão *"Modo conversa livre"*, que baixa um modelo sob demanda
via WebGPU — sem login, sem chave, sem custo. É opcional, avisa o tamanho antes, e
o modelo recebe o mesmo diagnóstico pronto: ele conversa, não calcula.


## Novidades da 3.2

| | |
|---|---|
| **Séries por músculo** | A métrica que a literatura aponta como principal motor de hipertrofia — mais que volume em quilos. Barra por grupo, faixa de trabalho e alerta de músculo sem estímulo. |
| **Tipo de série** | Aquecimento, válida e drop. Toque no número da série para alternar. Aquecimento deixa de inflar volume, recorde e 1RM. |
| **Padrões cruzados** | Diagnósticos que só aparecem lendo dieta, treino e composição juntos. |
| **Peso-tendência** | Média móvel exponencial. O número grande passa a ser a tendência; a balança do dia vem ao lado. |
| **Fibra e sódio** | Nos alimentos em que mudam decisão, com cobertura declarada honestamente. |
| **Histórico por exercício** | Toque num recorde e veja a curva de carga daquele movimento. |
| **Calculadora de anilhas** | Carga alvo, peso da barra, anilhas por lado. |

### Os padrões cruzados

Catabolismo em déficit · Déficit fantasma · Sabotagem de fim de semana · Fadiga
acumulada · Registro decorativo · Grupo muscular sem estímulo · Retenção mascarando
o resultado.

Cada um combina achados de domínios diferentes numa causa só. Exemplo real do teste:

> **Sabotagem de fim de semana** — Sua semana está certa. Seus sábados e domingos
> apagam o que ela construiu.
> *Evidência: Fim de semana + Ritmo de perda + Álcool*

Isso é o que um app só de nutrição ou só de treino não consegue ver, porque cada um
enxerga metade dos dados.

### Sobre as séries de aquecimento

Toque no número da série para alternar entre **1** (válida), **A** (aquecimento) e
**D** (drop). Aquecimento não conta em volume, não vira recorde, não entra no 1RM
estimado e não influencia a sugestão de carga. No teste, distinguir isso mudou o
volume de 29.400 para 25.200 kg — 14% de diferença que antes distorcia todos os gráficos.


## Novidades da 3.1 — aba Análise

**21 variáveis** calculadas sobre o que você registrou, cada uma com número, gravidade e ação:

cobertura de registro · consumo médio × meta · consistência diária · fim de semana ×
dias úteis · proteína · refeição que mais falta · ritmo de perda · déficit planejado ×
realizado · massa magra · cintura · frequência de treino · progressão de carga ·
esforço (RIR) · aderência ao mesociclo · volume de treino · álcool · hidratação ·
passos · confiabilidade do gasto medido · dias desde a última pesagem · backup

Mais **6 perguntas prontas** que montam a resposta a partir dos achados, na ordem de
causa provável: por que não estou emagrecendo, estou perdendo músculo, devo cortar
calorias agora, por que a carga não sobe, meu registro está bom, o que mais atrapalha.

Nada disso usa IA nem internet. É conta sobre dado real — por isso não alucina,
não inventa número e funciona no avião.

### Por que isso vale mais que um chat genérico

"Por que não estou emagrecendo?" num chat de IA vira conselho de blog. Aqui vira:

> Fim de semana: 3.655 kcal aos sábados e domingos contra 2.350 nos dias úteis —
> diferença de 1.305 kcal. Dois dias assim somam 2.610 kcal por semana, o equivalente
> a 0,34 kg de gordura por mês que deixam de sair.

A diferença é que o app enxerga seus dados. Um chat só enxerga se você mandar tudo
para fora do aparelho.

## Assistente local (opcional)

Conversa livre com um modelo que roda **dentro do próprio navegador**, via WebGPU.
Sem login, sem chave, sem custo, sem servidor, e sem nada saindo do aparelho.

**O preço é o download.** De centenas de MB a alguns GB na primeira vez, guardado em
cache — depois funciona offline. Use Wi-Fi. O app lista os modelos disponíveis com o
tamanho de cada um; comece pelo menor se o aparelho for modesto.

**O modelo não calcula nada.** Ele recebe o diagnóstico pronto como contexto e só
conversa em cima dele. Modelo pequeno raciocina mal — por isso o número vem sempre do
app. O prompt de sistema o proíbe de inventar dado, de dar diagnóstico médico e de
falar sobre medicamento ou restrição extrema.

Onde não houver WebGPU, o app diz isso claramente e o diagnóstico continua funcionando,
porque ele nunca dependeu de IA.


## Novidades da 3.0

| | |
|---|---|
| **Gasto energético medido** | O app para de estimar seu TDEE por fórmula e passa a **medi-lo** pelo balanço energético, a partir do seu consumo registrado e da tendência real de peso. |
| **Código de barras** | Câmera aponta para a embalagem e o produto entra com os macros do rótulo, via Open Food Facts — banco público, gratuito, sem chave. |
| **460 alimentos na base local** | Eram 315. E o que você escaneia vira alimento próprio, funcionando offline depois. |
| **Foto por IA removida** | Trazia chave de API, escolha de provedor, aviso de privacidade e proxy para dentro de um app que não precisava disso. O código de barras resolve o mesmo problema sem nada disso. |

### Como o gasto medido funciona

A fórmula de Mifflin-St Jeor é uma média populacional. Para um indivíduo ela erra
centenas de calorias, e erra mais conforme o peso cai e o metabolismo se adapta.
É por isso que tanta gente come o "déficit" por seis semanas e não perde nada.

O balanço energético resolve isso sem fórmula nenhuma:

    TDEE_dia = consumo_médio_dia − (Δpeso_kg × 7700) / dias

Se você comeu 2.000 kcal por dia e perdeu 0,5 kg por semana, seu gasto real é
2.550 kcal. Não é estimativa — é aritmética sobre o que aconteceu.

A tendência de peso vem de **regressão linear** sobre as pesagens da janela, não da
última leitura. Peso isolado oscila com hidratação, sal e volume intestinal; duas
balanças isoladas são ruído, uma reta sobre seis pontos é sinal.

### Quando ele se recusa a dar um número

De propósito. Um gasto errado vira meta errada, e meta errada para baixo é perigosa.
O motor exige:

- pelo menos **3 pesagens** nos últimos 28 dias
- cobrindo pelo menos **14 dias** de intervalo
- e **60% dos dias** com diário preenchido

Enquanto isso não existe, ele mostra a fórmula e diz o que falta. Leva de 4 a 6
semanas de registro consistente para a estimativa ficar confiável — é o tempo mínimo
para separar tendência real de ruído.

### O viés que você precisa conhecer

Dias sem registro entram na conta assumindo o mesmo consumo dos dias registrados.
Se você justamente deixa de registrar nos dias que come mais, o gasto medido sai
**abaixo** do real, e a meta derivada dele fica apertada demais. O app avisa quando
a cobertura está abaixo de 85%. Registrar o dia ruim é o que torna o número confiável.

### Meta por ritmo, não por déficit fixo

Você escolhe o ritmo alvo em % do peso por semana (0,5% / 0,75% / 1,0%) e o app deriva
a caloria do gasto medido. Dois limites de segurança sempre valem: o déficit nunca passa
de **30% do gasto** e a meta nunca desce abaixo do **piso** (1.500 kcal homens, 1.200 mulheres).
Quando um dos dois trava o pedido, o app diz.

Em "Manual" nada disso é aplicado — você define e o app obedece.

### Código de barras

Aponte para o código da embalagem. Onde o navegador não tiver leitor nativo, digite o
número impresso — funciona igual. Também dá para buscar por nome no banco.

O banco é alimentado por voluntários: confira os macros contra o rótulo, porque o produto
pode ter mudado de fórmula. Produto sem tabela nutricional preenchida é recusado em vez
de entrar com zeros.

### O que não deu para fazer

**Sincronia de passos com Health Connect ou Google Fit.** Não existe API web para isso.
Exigiria app nativo ou OAuth com servidor, o que quebraria a premissa de não ter conta
nem back-end. Os passos continuam manuais.


## Novidades da 2.2

| | |
|---|---|
| Base com 315 alimentos | Eram 139. Entraram industrializados, padaria, delivery, congelados, molhos e suplementos — muito menos cadastro manual. |
| Três categorias novas | Padaria, Congelados e Molhos, além das 14 existentes. |
| Álcool passa a contar | Bebida alcoólica tinha caloria quase zero no app, porque o cálculo só olhava proteína, carbo e gordura. Agora o álcool entra com 7 kcal/g. |

### O que o álcool mudou na prática

Antes, uma dose de 50 ml de destilado era registrada como **0 kcal** e uma taça de
vinho como 11. Agora a dose dá 140 kcal e a taça, 127. Isso vale para o total do dia,
para a substituição por equivalente, para a leitura por foto e para o CSV, que ganhou
uma coluna `alcool_g`.

Para quem está em déficit, isso não é detalhe: três long necks num sábado são cerca
de 450 kcal que simplesmente não apareciam.

## Novidades da 2.1

| | |
|---|---|
| Tela de aceite | Isenção médica e confirmação de 18+ no primeiro acesso. |
| Piso de calorias | 1.500 kcal (homens) / 1.200 (mulheres) — a reavaliação nunca corta abaixo. |

---

## Publicando (5 minutos, de graça)

Instalação e notificação só funcionam em endereço **https**. Abrir o
`index.html` direto do gerenciador de arquivos não habilita nenhum dos dois.

### GitHub Pages

1. Crie um repositório em <https://github.com/new>. Nome: `controle`. Marque **Public**.
2. **Add file → Upload files** e arraste **todo o conteúdo desta pasta**,
   mantendo a estrutura: `index.html`, `sw.js`, `manifest.webmanifest`,
   `LEIA-ME.md` e as pastas `css/`, `js/`, `icons/`.
3. **Commit changes**.
4. **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, pasta `/ (root)`. Salve.
5. Em 1–2 minutos o endereço aparece: `https://SEU-USUARIO.github.io/controle/`

Não suba o zip — o GitHub trataria como um arquivo só e o Pages não funcionaria.

### Alternativa: Netlify Drop

<https://app.netlify.com/drop> — arraste a pasta e sai um https na hora.

### Instalar no celular

Abra o endereço no Chrome do Android → menu ⋮ → **Instalar app**.

---

## Notificações

**Ajustes → Notificações → Sim** e aceite a permissão do Chrome.
Sete lembretes já vêm configurados. Dá para editar, apagar e criar novos.

**Limitação da plataforma:** app web só dispara lembrete enquanto está aberto
ou em segundo plano recente. Com o celular no bolso e o app fechado por horas,
o Android mata o processo. Mantenha em paralelo os **alarmes nativos** para os
horários fixos — o alarme avisa, o app registra.

---

## Como o treino progride

**Progressão dupla.** A carga sobe quando você fecha o topo da faixa de
repetições em **todas** as séries prescritas, com RIR igual ou menor que o
alvo da fase. Ao subir, as reps voltam ao piso da faixa.

O incremento respeita dois limites: o tipo de equipamento (máquina e membro
inferior toleram salto maior que halter de isolamento) e um teto de **10% da
carga atual**. Sem esse teto, um salto fixo de 10 kg num leg press de 80 kg
seria 12,5% — degrau grande demais para manter a faixa de reps, o que quebra
a progressão na sessão seguinte.

Se você ficar abaixo do piso da faixa, o app sugere reduzir ~8% e reconstruir.

**Por que o volume cai e a intensidade não.** Em déficit calórico, volume alto
é o primeiro fator a comprometer a recuperação. A intensidade relativa é o que
preserva massa magra. Por isso o ciclo controla volume e mantém carga
progressiva, e não o contrário.

---

## Como ler a reavaliação

A cada 4 semanas o app calcula seu ritmo real e compara com a faixa de
**0,5% a 1,0% do peso corporal por semana**:

- **Abaixo de 0,5%** → sugere cortar 200 kcal ou somar 1.500 passos
- **Entre 0,5% e 1,0%** → não mexe em nada
- **Acima de 1,0%** → sugere **adicionar** 150 kcal, porque perda rápida custa massa magra
- **Sem perda nenhuma** → antes de cortar, confere se o registro está completo

Você decide se aplica. Toda reavaliação fica registrada com o ritmo da época
e a caloria antes e depois.

---

## Guardas para distribuição pública

Quando o app deixa de ser só seu, algumas coisas mudam:

- **Tela de aceite no primeiro acesso.** Deixa explícito que não é orientação médica,
  lista as situações em que a pessoa deve procurar um profissional antes, e pede
  confirmação de 18 anos ou mais.
- **Piso de calorias.** 1.500 kcal para homens, 1.200 para mulheres. A reavaliação
  automática nunca sugere cortar abaixo disso — quando o ritmo está baixo e a meta já
  está perto do piso, ela recomenda aumentar gasto e procurar um profissional, em vez
  de cortar mais.
- **Privacidade por padrão.** Nenhum dado sai do aparelho, exceto a foto de refeição
  para o provedor que a pessoa escolheu.

---

## Manutenção

- **Exporte o backup uma vez por mês.** Limpar dados do navegador apaga tudo.
- O backup não inclui as fotos (ficam no IndexedDB) nem a chave da API.
- Três CSVs disponíveis: diário alimentar, treinos com RIR e 1RM, composição
  corporal. Todos com ponto-e-vírgula e BOM, abrem direto no Excel e no Power BI.
- Valores nutricionais são aproximados (~10% de margem), como em qualquer app
  do gênero. O 1RM estimado (Epley) serve para comparar evolução — não tente
  o levantamento.
- O percentual de gordura pelo método Navy tem erro de 3–4 pontos contra DEXA.
  Serve para acompanhar **tendência**, não para cravar um número.

---

## Autoria

Desenvolvido e mantido de forma independente por **Mariano**, em Bragança Paulista (SP).

App gratuito, sem anúncio, sem assinatura e sem coleta de dados. Quem quiser apoiar o
projeto pode chamar no WhatsApp **(11) 97382-9765** — o link está dentro do app, em
Ajustes → Sobre.

## Aviso

Este app organiza execução e mede resultado. Ele **não diagnostica** e não
substitui médico nem nutricionista. Faça check-up antes de começar (pressão,
glicemia/HbA1c, lipídeos, TSH) e avise que vai iniciar treino de força.

O que os aplicativos de atleta entregam e este não entrega: um profissional
olhando sua foto e ajustando o protocolo. O que este app faz é automatizar a
parte mecânica desse ajuste e deixar seu dado organizado para levar a um
profissional quando você quiser.
