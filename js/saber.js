/* ══════════════════════════════════════════════════════════
   SABER — base de conhecimento de nutrição e treino

   Isto é o cérebro do assistente. Não é um modelo de
   linguagem: é conhecimento escrito, revisado e ligado aos
   dados reais da pessoa.

   A escolha é deliberada. Um modelo pequeno o bastante para
   caber num app offline sabe menos nutrição do que esta
   tabela, e ainda por cima inventa. Aqui nada é gerado —
   tudo foi escrito e conferido.

   Cada tópico tem:
     kw    palavras que levam até ele
     t(D)  texto, recebendo os dados do usuário quando útil
     tag   'nutricao' | 'treino' | 'mente' | 'metodo'

   Tom: firme e direto. Cobra comportamento e processo,
   nunca o valor da pessoa.
   ══════════════════════════════════════════════════════════ */

const SABER = [

/* ─────────────── NUTRIÇÃO: fundamentos ─────────────── */
{ id:'deficit', tag:'nutricao',
  kw:['deficit calorico','déficit','como emagrece','como perder gordura','balanco energetico','emagrecer funciona'],
  t: D => `Gordura sai por uma via só: você gasta mais energia do que consome. Todo o resto — horário, combinação, "acelerar metabolismo" — mexe na margem ou na sua capacidade de sustentar o déficit.

No seu caso o app **mede** seu gasto${D.tdee ? ` (${D.tdee} kcal/dia)` : ''} em vez de estimar por fórmula, e a meta sai de lá. Não existe truque. Existe execução.` },

{ id:'proteina-quanto', tag:'nutricao',
  kw:['quanta proteina','proteina por dia','quanto de proteina','preciso de proteina','proteina suficiente'],
  t: D => `Sua meta é **${D.prot} g por dia**, calculada sobre peso ajustado e não sobre o peso atual — usar o peso total inflaria o alvo sem benefício nenhum.

Em déficit, proteína não é "para ganhar músculo": é o que decide se o peso que sai é gordura ou massa magra. É o único macro que eu cobro todo dia.

Prática: uma fonte em toda refeição. Se as quatro tiverem, o alvo fecha sozinho.` },

{ id:'proteina-fontes', tag:'nutricao',
  kw:['fonte de proteina','o que comer de proteina','alimento proteico','onde tem proteina'],
  t: () => `Por custo e densidade, nesta ordem: **ovo** (13 g/100 g e o mais barato), **frango** (32 g grelhado), **patinho moído** (32 g), **tilápia** (26 g), **sardinha em lata** (24 g e não precisa cozinhar), **queijo cottage** (12 g), **iogurte proteico** (10 g).

Feijão e arroz juntos somam proteína, mas você precisaria de volume grande para chegar perto. Use como complemento, não como base.` },

{ id:'carbo', tag:'nutricao',
  kw:['carboidrato','preciso cortar carbo','low carb','arroz engorda','pao engorda','carbo a noite'],
  t: D => `Carboidrato não engorda. **Excesso de caloria engorda**, e carboidrato é fácil de comer em excesso — essa é a diferença real.

Sua meta é ${D.carb} g/dia. Cortar quase tudo funciona para quem cumpre, e a maioria não cumpre por muito tempo. Arroz, feijão, batata e mandioca cabem no seu plano: o que não cabe é comer sem medir.

Carboidrato à noite não engorda mais que de manhã. O corpo não tem relógio de balanço energético.` },

{ id:'gordura', tag:'nutricao',
  kw:['gordura','preciso de gordura','dieta zero gordura','gordura faz mal','azeite'],
  t: D => `Sua meta de ${D.gord} g existe por um motivo: abaixo de cerca de 0,6 g por quilo, hormônio e absorção de vitaminas lipossolúveis sofrem. Não corte gordura para "economizar caloria" — corte porção.

O problema da gordura é densidade: 9 kcal por grama contra 4 dos outros. Uma colher de azeite a mais são 70 kcal que passam despercebidas.` },

{ id:'fibra', tag:'nutricao',
  kw:['fibra','intestino preso','saciedade','ficar satisfeito','comida que enche'],
  t: () => `Referência de 25 g por dia, e é a alavanca mais subestimada contra fome. Fibra ocupa volume, atrasa esvaziamento gástrico e custa quase caloria nenhuma.

Onde está, por porção real: feijão (8,5 g/100 g), aveia (9 g), brócolis (3,3 g), goiaba (5,4 g), chia (34 g). Uma concha de feijão no almoço já resolve um terço do dia.` },

{ id:'agua', tag:'nutricao',
  kw:['agua','quanto de agua','beber agua emagrece','hidratacao'],
  t: D => `Meta de ${(D.aguaMeta/1000).toFixed(1).replace('.',',')} L. Água não queima gordura — quem diz isso está vendendo algo.

O que ela faz: sustenta desempenho no treino, ajuda a saciedade quando tomada antes da refeição, e evita que sua balança minta. Desidratação leve muda o peso em até 1 kg e você interpreta como progresso ou fracasso que não existiu.` },

{ id:'alcool', tag:'nutricao',
  kw:['alcool','cerveja','bebida alcoolica','posso beber','fim de semana bebida','whisky','vinho'],
  t: () => `Álcool tem **7 kcal por grama** — quase o mesmo da gordura, e a maioria dos apps simplesmente não conta. O nosso conta.

Números reais: três long necks = 450 kcal. Uma dose de destilado = 140. Uma taça de vinho = 127.

Pior que a caloria: enquanto há álcool no sangue, seu corpo prioriza metabolizá-lo e a oxidação de gordura despenca por horas. E ele derruba o freio das escolhas alimentares — quase ninguém bebe e come pouco.

Não vou te dizer para não beber. Vou dizer para registrar. Álcool não registrado é o buraco mais comum num déficit que "não funciona".` },

{ id:'refeicao-livre', tag:'nutricao',
  kw:['refeicao livre','dia do lixo','cheat meal','posso sair da dieta','comer besteira'],
  t: () => `Uma refeição livre por semana cabe. **Um dia livre normalmente não.**

Conta: se seu déficit é 600 kcal/dia, a semana acumula 4.200. Um domingo de 2.500 kcal acima apaga 60% do que você construiu em seis dias.

Refeição livre é planejada e tem fim. "Dia do lixo" é licença sem prazo — e é ela que faz o mês fechar em zero.` },

{ id:'jejum', tag:'nutricao',
  kw:['jejum intermitente','jejum','16 8','pular cafe da manha','nao tomar cafe'],
  t: () => `Jejum intermitente não emagrece mais que dieta comum com a mesma caloria. Isso está bem estabelecido — a vantagem, quando existe, é praticidade: menos refeições, menos decisões, menos oportunidade de exagerar.

Se comer só em 8 horas te faz cumprir a meta, use. Se te faz chegar faminto às 12h e comer 1.200 kcal de uma vez, não use.

Um porém no seu caso: concentrar proteína em poucas refeições dificulta bater ${'o alvo'}. E em déficit, proteína é a prioridade.` },

{ id:'metabolismo-lento', tag:'nutricao',
  kw:['metabolismo lento','meu metabolismo','metabolismo travado','engordo so de olhar'],
  t: D => `"Metabolismo lento" quase sempre significa uma de duas coisas: gasto menor do que a fórmula estimou, ou consumo maior do que o registrado. Estudos com registro alimentar mostram subestimação de 20% a 50% — não por má-fé, por esquecimento e porção.

Por isso este app **mede** seu gasto em vez de estimar${D.tdee ? `. O seu está em ${D.tdee} kcal/dia` : ''}. Se ele estiver mesmo baixo, o número aparece e a meta se ajusta.

Adaptação metabólica existe e é real, mas é da ordem de 10% a 15%, não de "meu corpo não perde peso".` },

{ id:'plato', tag:'nutricao',
  kw:['plato','platô','parei de emagrecer','peso estagnou','nao desce mais'],
  t: D => `Antes de chamar de platô, três perguntas — nesta ordem:

**1.** Quantos dias você registrou de verdade nas últimas quatro semanas?${D.cobertura != null ? ` (seus: ${D.cobertura}%)` : ''}
**2.** Sua média real bateu a meta, ou ficou acima?
**3.** Passaram-se pelo menos três semanas? Duas semanas sem queda é ruído de água, não platô.

Platô verdadeiro — registro completo, meta cumprida, três semanas sem queda na tendência — pede ajuste. Os outros 90% dos casos pedem execução, não mudança de plano.` },

{ id:'contar-caloria', tag:'nutricao',
  kw:['preciso contar caloria','pesar comida','pesar a comida','preciso pesar','tem que pesar','contar caloria','contar para sempre','balanca de cozinha','medir comida'],
  t: () => `Não para sempre. Mas no começo, sim — e por um motivo específico: ninguém estima porção direito sem calibrar primeiro.

Pese por quatro a seis semanas. Depois disso você bate o olho e erra pouco, e pode registrar só o que costuma escapar. A balança de cozinha custa 30 reais e é o equipamento com melhor retorno de toda essa jornada.

O erro comum é o oposto: parar de pesar antes de calibrar e voltar a subestimar.` },

{ id:'imc', tag:'nutricao',
  kw:['imc','indice de massa corporal','imc serve','imc esta errado'],
  t: D => `IMC é ferramenta populacional, não individual. Ele não distingue músculo de gordura — por isso atleta forte "aparece" como sobrepeso.

Para você ele funciona como marcador grosseiro de risco, mas **cintura e percentual de gordura dizem muito mais**${D.bf ? `. O seu está em ${D.bf}% de gordura` : ''}. Acompanhe esses dois, não o IMC.` },

{ id:'balanca-varia', tag:'nutricao',
  kw:['balanca subiu','peso oscila','engordei de um dia pro outro','peso varia','retencao'],
  t: () => `Peso de um dia carrega água, sal, glicogênio e conteúdo intestinal. Variação de 1 a 2 kg entre dias é normal e não tem nada a ver com gordura.

Gordura não entra nem sai em 24 horas. Para ganhar 1 kg de gordura real você precisaria de 7.700 kcal acima do gasto — em um dia, é praticamente impossível.

Por isso o número grande na tela é a **tendência**, não a leitura. Olhe a linha.` },

{ id:'noite', tag:'nutricao',
  kw:['comer a noite','comer tarde engorda','jantar tarde','comer antes de dormir'],
  t: () => `Não engorda. O corpo não muda de regra depois das 20h.

O que existe de real: quem come tarde costuma comer pior e sem registrar, porque é o momento de cansaço e menor controle. O problema é o **contexto**, não o horário.

Se seu jantar às 22h cabe na meta e está registrado, está certo.` },

{ id:'adocante', tag:'nutricao',
  kw:['adocante','adoçante','sucralose','aspartame','stevia','faz mal'],
  t: () => `Nas doses de uso normal, adoçantes aprovados são considerados seguros pelos órgãos regulatórios. Quem afirma o contrário com certeza está indo além da evidência.

Utilidade prática: substituir açúcar corta caloria sem custo de aderência. É um dos truques mais simples que existem.

Se te dá desconforto intestinal, troque o tipo — alguns poliois fazem isso em pessoas sensíveis.` },

{ id:'ultraprocessado', tag:'nutricao',
  kw:['ultraprocessado','comida industrializada','processado faz mal','comida de verdade'],
  t: () => `Ultraprocessado não é veneno e nenhum alimento isolado te faz engordar. Mas eles são projetados para serem fáceis de comer em excesso: muita caloria, pouco volume, pouca saciedade.

Na prática: 100 g de salgadinho são 560 kcal e não enchem ninguém. 100 g de frango com 100 g de arroz são 440 e te seguram por horas.

Por isso o modo "Da roça" do cardápio existe. Não é moralismo — é densidade calórica.` },

{ id:'sodio', tag:'nutricao',
  kw:['sodio','sal','muito sal','retencao de liquido','inchado'],
  t: () => `Referência de até 2.300 mg/dia. Sódio alto retém água e trava a balança por dias, mesmo com gordura saindo — e é aí que muita gente corta caloria sem motivo.

Onde mais se esconde: shoyu (5.500 mg/100 ml), azeitona (1.550), miojo (1.800), embutidos (1.100 a 1.800), queijo parmesão (1.600).

Se seu peso empacou sem explicação, olhe aqui antes de mexer na meta.` },

{ id:'suplemento', tag:'nutricao',
  kw:['suplemento','whey vale a pena','preciso de whey','bcaa','termogenico','pre treino','glutamina'],
  t: () => `Ordem honesta de utilidade, com evidência atrás:

**Creatina** — o suplemento com melhor evidência para força e massa. 3 a 5 g por dia, barato, não precisa de ciclo.
**Whey** — é comida em pó. Conveniência, não magia. Se você bate a proteína com comida, não precisa.
**Cafeína** — melhora desempenho de forma consistente.

Sem evidência que justifique o preço: BCAA (se você come proteína suficiente, é redundante), glutamina, termogênico, "detox", queimador de gordura.

Suplemento resolve os últimos 5%. Você ainda está nos primeiros 60%.` },

{ id:'ovo', tag:'nutricao',
  kw:['ovo','ovo faz mal','colesterol','quantos ovos'],
  t: () => `Ovo é a melhor relação proteína-preço da sua lista de compras. O medo do colesterol da dieta foi revisado: para a maioria das pessoas, colesterol alimentar tem impacto pequeno no colesterol sanguíneo.

Quem tem alteração lipídica diagnosticada deve seguir a orientação do próprio médico — essa é a exceção que importa.

Três a quatro ovos no café resolvem 40 g de proteína antes das 8h.` },

{ id:'comer-fora', tag:'nutricao',
  kw:['comer fora','restaurante','self service','almoco fora','viagem','churrasco'],
  t: () => `Regras que funcionam sem você calcular nada:

**Monte o prato na ordem certa:** primeiro proteína (um terço do prato), depois salada (um terço), por último carboidrato. Quem começa pelo arroz não sobra espaço para o resto.

**Evite o que é frito e o que vem em molho** — é onde a gordura invisível mora.

**Registre por estimativa ainda assim.** Registro impreciso vale muito mais que registro nenhum.` },

/* ─────────────── TREINO ─────────────── */
{ id:'porque-musculacao', tag:'treino',
  kw:['por que musculacao','preciso treinar','musculacao emagrece','so cardio','treino de forca'],
  t: () => `Musculação não emagrece pela caloria que gasta — ela gasta pouco. Ela decide **a composição do que você perde**.

Em déficit sem treino de força, parte relevante do peso que sai é músculo. Com treino e proteína adequada, o corpo entende que aquele músculo está em uso e preserva.

Resultado prático: duas pessoas perdem 10 kg. A que treinou perdeu 9 de gordura. A que não treinou perdeu 6 de gordura e 4 de músculo — e vai reganhar peso mais rápido, porque gasta menos.` },

{ id:'cardio-vs', tag:'treino',
  kw:['cardio','esteira','correr','caminhada','aerobico','cardio em jejum','quanto cardio'],
  t: D => `Cardio é ferramenta de gasto, não de composição. Use para abrir espaço no déficit sem cortar mais comida.

**Cardio em jejum não queima mais gordura** ao fim do dia. A oxidação muda durante o exercício e se compensa depois. Faça no horário em que você rende mais.

No seu caso, caminhada inclinada em vez de corrida${D.peso ? '' : ''}: acima de 100 kg de peso corporal, cada passo de corrida multiplica a carga no joelho sem entregar gasto que a inclinação não entregue.` },

{ id:'series-musculo', tag:'treino',
  kw:['quantas series','volume de treino','series por musculo','quanto treinar','quantos exercicios'],
  t: D => `A métrica que importa é **séries semanais por músculo**, não volume em quilos nem tempo de academia. A literatura aponta o volume assim medido como principal motor de hipertrofia.

Faixa de trabalho: 10 a 20 séries por músculo por semana. Abaixo de 6 é manutenção fraca; acima de 22 em déficit costuma comprometer recuperação, que é o gargalo real quando se come pouco.${D.orfaos && D.orfaos.length ? `

**Seu problema agora não é volume, é distribuição:** ${D.orfaos.join(', ')} não recebem estímulo direto na sua rotina.` : ''}` },

{ id:'falha-rir', tag:'treino',
  kw:['falha muscular','rir','ate a falha','até a falha','treinar ate a falha','quantas reps ate','reserva de repeticao','esforco na serie','quantas repeticoes'],
  t: D => `Treinar até a falha em toda série não entrega mais resultado e cobra muito mais recuperação — que em déficit você não tem sobrando.

Trabalhe com **RIR** (repetições em reserva): pare com 1 a 3 reps ainda disponíveis.${D.rirAlvo != null ? ` Na sua fase atual o alvo é RIR ${D.rirAlvo}.` : ''}

Se você não anota o RIR, não dá para distinguir progressão de teimosia — nem para o app sugerir carga com segurança.` },

{ id:'progressao', tag:'treino',
  kw:['aumentar carga','aumentar a carga','quando subir peso','quando subir a carga','progressao de carga','dupla progressao','como evoluir','subir peso','evoluir no treino'],
  t: D => `**Progressão dupla**, que é o que o app aplica: você sobe carga só quando fecha o topo da faixa de repetições em **todas** as séries, com o RIR alvo ou menos. Ao subir, as reps voltam ao piso.

O incremento respeita um teto de 10% da carga. Salto maior derruba você para fora da faixa de reps e trava a progressão na sessão seguinte.

Em déficit, manter carga já é vitória. Subir é bônus.` },

{ id:'deload', tag:'treino',
  kw:['deload','semana leve','descanso','preciso parar','sobretreino','fadiga'],
  t: D => `Deload não é semana perdida — é o que permite a próxima. Carga em 60%, mesmas séries, RIR alto.${D.fase ? ` Você está na fase ${D.fase}${D.semana ? `, semana ${D.semana} de 12` : ''}.` : ''}

Sinais de que você precisa antes do programado: carga caindo em exercícios diferentes, sono ruim, articulação dolorida, vontade de treinar no chão.

Em déficit a recuperação é o fator limitante. Insistir na carga quando ela não sobe só acumula desgaste.` },

{ id:'dor-muscular', tag:'treino',
  kw:['dor muscular','dor depois do treino','doms','dor tardia','nao senti dor','dor e sinal'],
  t: () => `Dor tardia **não** é medida de qualidade do treino. Ela reflete novidade do estímulo, não eficácia. Treino bom e repetido dói cada vez menos e continua funcionando.

Se você não sente dor mas a carga está subindo, está tudo certo. Se sente muita dor e a carga não sobe, você está trocando estímulo por dano.

Dor **articular** é outra conversa: essa é sinal de parar e avaliar.` },

{ id:'aquecimento', tag:'treino',
  kw:['aquecimento','aquecer','alongar antes','alongamento','preciso alongar'],
  t: () => `Aquecimento: 5 minutos de cardio leve e 1 a 2 séries leves do primeiro exercício. É suficiente e é o que reduz risco.

**Alongamento estático antes do treino reduz produção de força temporariamente.** Se quiser alongar, faça depois ou em sessão separada.

No app, marque as séries de aquecimento com **A**: elas não entram no volume nem viram recorde — senão seus gráficos mentem em 14%.` },

{ id:'descanso-serie', tag:'treino',
  kw:['descanso entre series','quanto tempo descansar','intervalo','descanso curto'],
  t: () => `Descanso curto não "queima mais gordura" — só reduz a carga que você consegue usar na série seguinte, o que é exatamente o que você não quer em déficit.

Faixa útil: **90 a 120 segundos** para multiarticulares, 60 a 90 para isolados. O cronômetro do app dispara sozinho quando você conclui a série.

Se você está ofegante demais para fazer a próxima série direito, descansou pouco.` },

{ id:'recomposicao', tag:'treino',
  kw:['ganhar musculo e perder gordura','recomposicao','bulking','cutting','ganhar massa'],
  t: () => `Ganhar músculo e perder gordura ao mesmo tempo é possível, e é mais provável em três situações: iniciante em treino, percentual de gordura alto, ou retorno depois de pausa.

Você provavelmente está em pelo menos uma delas — então **não** separe em fases. Faça déficit moderado com proteína alta e treino de força, e as duas coisas acontecem juntas.

Quem já é treinado e magro precisa escolher uma. Não é o seu caso agora.` },

{ id:'abdominal', tag:'treino',
  kw:['abdominal','barriga','perder barriga','localizada','secar a barriga','abdomen'],
  t: () => `**Não existe perda localizada.** Fazer abdominal não retira gordura da barriga — retira de onde seu corpo decidir, e essa ordem é genética.

Abdominal fortalece o core, o que serve para estabilidade e postura. Não desenha nada enquanto houver gordura por cima.

A barriga sai com déficit. O abdominal só aparece depois. Nessa ordem, sempre.` },

{ id:'tempo-resultado', tag:'treino',
  kw:['quanto tempo para ver resultado','quando vou ver','demora quanto','em quanto tempo mudo'],
  t: () => `Cronologia realista, e ela desaponta quem quer resposta rápida:

**2 a 4 semanas** — roupa começa a mudar antes da balança convencer
**6 a 8 semanas** — cintura cai de forma nítida, força sobe
**12 semanas** — mudança visível em foto comparativa
**6 meses** — mudança que outras pessoas comentam

Quem desiste normalmente desiste entre a semana 3 e a 6 — justamente quando o trabalho já está funcionando e ainda não parece.` },

{ id:'sono', tag:'treino',
  kw:['sono','dormir','dormir pouco','insonia','cansado o dia todo','recuperacao'],
  t: () => `Sono curto aumenta fome, piora escolha alimentar e derruba desempenho no treino. Estudos mostram que restrição de sono durante dieta aumenta a proporção de massa magra perdida.

Traduzindo: dormir mal faz você perder mais músculo e menos gordura, comendo a mesma coisa.

É a variável que mais gente ignora e que mais barato custa consertar.` },

{ id:'treinar-doente', tag:'treino',
  kw:['treinar doente','gripado','resfriado','febre','posso treinar doente'],
  t: () => `Regra prática: sintoma **acima do pescoço** (nariz entupido, garganta leve) — pode treinar leve. Sintoma **abaixo** (febre, tosse produtiva, dor no corpo, falta de ar) — não treine.

Febre com exercício é combinação que pode dar problema sério. Não negocie essa.

Perder três dias de treino não desfaz nada. Treinar febril pode custar semanas.` },

{ id:'casa', tag:'treino',
  kw:['treinar em casa','treino em casa','sem academia','peso corporal','treino funcional','sem equipamento','em casa funciona','halteres'],
  t: () => `Funciona, com uma ressalva honesta: progressão de carga é muito mais difícil sem peso externo, e progressão é o que preserva músculo em déficit.

Se é o que você tem, use agachamento, avanço, flexão (inclinada se precisar), remada com elástico ou mochila, elevação de quadril e prancha. Progrida por repetição, cadência lenta e amplitude — nessa ordem.

Um par de halteres ajustáveis muda o jogo e custa menos que três meses de academia.` },

/* ─────────────── MÉTODO DO APP ─────────────── */
{ id:'como-calcula', tag:'metodo',
  kw:['como voce calcula','de onde vem esse numero','como funciona o app','como e calculado','confio nesse numero'],
  t: D => `Seu gasto **não** vem de fórmula. Vem de balanço energético: consumo médio registrado menos a variação de peso convertida em caloria, ao longo de 28 dias.

    TDEE = consumo médio − (Δpeso × 7700) / dias

A tendência de peso sai de regressão linear sobre suas pesagens, não da última balança.${D.tdee ? `

Seu número atual: **${D.tdee} kcal/dia**${D.confianca ? `, confiança ${D.confianca}` : ''}.` : ''}

E o motor se recusa a dar número quando não tem dado suficiente — porque gasto errado vira meta errada, e meta errada para baixo é perigosa.` },

{ id:'navy', tag:'metodo',
  kw:['percentual de gordura','metodo navy','como calcula gordura','fita metrica','cintura pescoco'],
  t: D => `Método U.S. Navy: cintura, pescoço e altura. Erro típico de 3 a 4 pontos contra exame de imagem — serve para acompanhar **tendência**, não para cravar um número.

É o único jeito barato de responder a pergunta que a balança não responde: o que saiu era gordura ou músculo?${D.bf ? `

Você está em ${D.bf}%.` : `

Você ainda não mediu. Cintura na altura do umbigo, pescoço abaixo do pomo de adão, na próxima pesagem.`}` },

{ id:'ritmo-ideal', tag:'metodo',
  kw:['quanto devo perder por semana','ritmo ideal','perder rapido','posso acelerar','muito devagar'],
  t: D => `Faixa que preserva massa magra: **0,5% a 1% do peso corporal por semana**.${D.ritmo != null ? ` O seu está em ${Math.abs(D.ritmo).toFixed(2).replace('.',',')}%.` : ''}

Mais rápido que isso não é "mais eficiente" — é trocar músculo por velocidade, e o músculo perdido é o que mantém seu gasto alto depois.

O app não deixa a meta descer abaixo do piso de segurança nem com pedido explícito. Isso não é limitação: é a parte que impede você de sabotar a si mesmo num dia de pressa.` },

/* ─────────────── CABEÇA E ADESÃO ─────────────── */
{ id:'motivacao', tag:'mente',
  kw:['motivacao','sem motivacao','nao tenho forca de vontade','disciplina','como manter'],
  t: () => `Motivação é consequência, não causa. Ela aparece depois que você começa, não antes — quem espera vontade chegar espera para sempre.

O que substitui motivação: **ambiente e rotina**. Comida pronta na geladeira. Treino no mesmo horário. Registro logo após comer, não à noite tentando lembrar.

Disciplina não é força de vontade. É reduzir o número de decisões que você precisa tomar quando está cansado.` },

{ id:'recomecar', tag:'mente',
  kw:['furei a dieta','sai da dieta','voltar do zero','perdi tudo','estraguei','recomecar'],
  t: () => `Você não perdeu tudo. Um dia ruim custa uma fração do que uma semana boa constrói.

O que realmente atrapalha não é o exagero — é o que vem depois: compensar cortando demais no dia seguinte, e aí chegar com fome à noite e repetir. Esse ciclo, sim, destrói meses.

Volte à meta normal hoje. Sem penitência, sem compensar, sem "segunda-feira eu começo".` },

{ id:'comparacao', tag:'mente',
  kw:['fulano emagreceu mais','comparar','todo mundo consegue','so eu que nao','demora demais comigo'],
  t: () => `Comparar velocidade de emagrecimento é inútil: peso inicial, altura, histórico de dieta e massa magra mudam tudo. Quem começa mais pesado perde mais rápido no começo, sempre.

A única comparação que serve é com você de quatro semanas atrás. O app guarda exatamente isso.` }
];


/* ══════════════════════════════════════════════════════════
   EXPANSÃO — mais nutrição e mais treino.
   Escrito com base em diretrizes reconhecidas (OMS, Guia
   Alimentar para a População Brasileira, ABESO, ACSM) e em
   consenso estabelecido da área. Nenhum estudo é citado por
   nome ou número: citar referência que não posso verificar
   seria inventar, e isso é pior que não citar.
   ══════════════════════════════════════════════════════════ */

SABER.push(

{ id:'manutencao', tag:'metodo',
  kw:['manutencao','manutenção','manter o peso','depois que emagrecer','como nao voltar',
      'terminar a dieta','parar a dieta','e depois'],
  t: D => `Perder peso é a parte fácil. **Manter é onde quase todo mundo falha** — e é por isso que o app tem uma fase própria para isso.

O que muda ao entrar em manutenção: a meta passa a ser igual ao seu gasto medido (déficit zero), o alvo vira uma **faixa de ±2%** em vez de um número, o registro cai para três dias por semana, e a pesagem continua — é ela que avisa se algo mudou.

A proteína **não** cai. É ela que segura a massa magra que você construiu.${D.fasePlano === 'manutencao' && D.faixa ? `

Você já está em manutenção, faixa de ${String(D.faixa.min).replace('.',',')} a ${String(D.faixa.max).replace('.',',')} kg.` : ''}` },

{ id:'reganho', tag:'metodo',
  kw:['reganho','voltei a engordar','peso voltou','recuperei o peso','efeito sanfona','engordei de novo'],
  t: D => `Reganho não é falha de caráter: é o comportamento esperado de um corpo que defende o peso anterior. Por isso o app vigia por você.

Três níveis, todos pela **tendência** e nunca pela balança do dia:

**Amarelo** — acima da faixa por 2 semanas. Primeiro passo é conferir o registro, não cortar caloria.
**Laranja** — 3% acima. Volta a déficit leve. Quanto antes, menor o corte.
**Vermelho** — 5% acima. O padrão mudou de verdade; reavalie o plano inteiro.

A diferença entre quem mantém e quem não mantém não é força de vontade: é **agir em 3% em vez de agir em 15%**.${D.reganho && D.reganho.nivel && D.reganho.nivel !== 'sem-dados' ? `

Seu estado agora: ${D.reganho.nivel}.` : ''}` },

{ id:'regra-combinada', tag:'mente',
  kw:['regra combinada','peso de acao','o que faco se engordar','plano b','se eu voltar'],
  t: () => `Decidir no momento do problema é justamente o que não funciona — é quando você está cansado, frustrado e com menos capacidade de escolher bem.

Por isso o app pede que você combine **antes**: um peso-gatilho e uma ação específica. Por exemplo, *"ao passar de 98 kg, volto a registrar todos os dias por duas semanas"*.

Quando a tendência chega lá, o app não pergunta o que fazer. Ele lembra o que **você** decidiu. Isso tira a decisão da hora ruim e coloca na hora boa.

Configure na aba Progresso, em Regra combinada.` },

{ id:'jejum-como-conta', tag:'metodo',
  kw:['como calcula o jejum','como voce calcula o jejum','como o app calcula o jejum','de onde vem o jejum','jejum automatico','contagem de jejum','como conta jejum','como funciona o jejum'],
  t: () => `O app não pede que você configure janela nem aperte "iniciar jejum". Ele calcula pelo **horário real** em que você registrou comida.

São três números diferentes, e muita gente confunde:

**Jejum noturno** — da última refeição de ontem à primeira de hoje. É o que as pessoas chamam de "meu jejum".
**Janela de alimentação** — da primeira à última refeição do dia.
**Em jejum agora** — da última refeição registrada até este momento.

Jejum não é meta aqui. É consequência de quando você come — e só vira assunto se você transformar em estratégia.` },

/* ── NUTRIÇÃO: detalhes que mudam decisão ─────────── */
{ id:'densidade', tag:'nutricao',
  kw:['densidade calorica','comer mais volume','comida que rende','pouca caloria muito volume','prato cheio'],
  t: () => `Densidade calórica é caloria por grama, e é a variável mais prática do emagrecimento.

Compare 400 kcal: são 70 g de salgadinho (some num intervalo) ou 500 g de frango com legumes (te segura por horas).

Estratégia: encha metade do prato com vegetais antes de servir o resto. Você come o mesmo volume de sempre com bem menos caloria, sem "força de vontade".` },

{ id:'indice-glicemico', tag:'nutricao',
  kw:['indice glicemico','ig','carboidrato rapido','pico de insulina','insulina engorda'],
  t: () => `Índice glicêmico importa muito menos do que vendem. Num prato misto com proteína, gordura e fibra, o IG do carboidrato isolado praticamente some.

Insulina não engorda. Superávit calórico engorda. Insulina é o mensageiro, não a causa.

Onde IG é útil de verdade: para quem tem diabetes e para timing perto do treino. Fora isso, priorize saciedade e caloria total.` },

{ id:'timing-proteina', tag:'nutricao',
  kw:['janela anabolica','depois do treino','shake pos treino','quando tomar whey','timing de proteina'],
  t: D => `A "janela anabólica" de 30 minutos é mito. O que importa é o **total do dia** (${D.prot} g no seu caso) e a distribuição.

O que tem respaldo: dividir a proteína em 3 a 4 doses de 30 a 40 g rende mais que concentrar tudo numa refeição. O corpo tem um teto de uso por refeição.

Se você treina em jejum, comer nas horas seguintes é sensato. Correr para o shake em 20 minutos não é.` },

{ id:'proteina-vegetal', tag:'nutricao',
  kw:['proteina vegetal','vegetariano','vegano','proteina de planta','soja','sem carne'],
  t: () => `Proteína vegetal funciona, com dois ajustes: a digestibilidade é menor e o perfil de aminoácidos costuma ser incompleto isoladamente.

Prática: some 20% ao alvo se a base for vegetal, e combine fontes no mesmo dia — arroz com feijão, leguminosa com cereal. Soja, tofu e proteína texturizada de soja são as fontes mais completas.

Vitamina B12 exige suplementação em dieta vegana. Isso não é opcional e é assunto de nutricionista.` },

{ id:'creatina', tag:'nutricao',
  kw:['creatina','creatina funciona','como tomar creatina','creatina faz mal','retem liquido creatina'],
  t: () => `O suplemento com melhor evidência para força e massa magra. 3 a 5 g por dia, todo dia, inclusive nos dias sem treino. Não precisa de ciclo e não precisa de fase de saturação.

Horário não importa. Tomar com carboidrato ajuda marginalmente.

Ela retém água **dentro do músculo**, não embaixo da pele. A balança pode subir 1 a 2 kg nas primeiras semanas — isso não é gordura e não é inchaço.

Segura em pessoas saudáveis. Quem tem doença renal deve conversar com o médico antes.` },

{ id:'cafeina', tag:'nutricao',
  kw:['cafeina','cafe antes do treino','pre treino cafeina','quanto cafe'],
  t: () => `Melhora desempenho de forma consistente: 3 a 6 mg por quilo, 30 a 60 minutos antes. Para 100 kg, são 300 a 600 mg — um café coado tem cerca de 100.

Dois cuidados: tolerância sobe rápido com uso diário alto, e cafeína depois das 16h atrapalha o sono de muita gente — o que custa mais do que o treino ganha.

Quem tem arritmia ou hipertensão não controlada deve falar com o médico.` },

{ id:'refri-zero', tag:'nutricao',
  kw:['refrigerante zero','coca zero','refri diet','zero acucar','bebida zero'],
  t: () => `Refrigerante zero tem caloria desprezível e não atrapalha o déficit. Como substituto do açucarado, é ganho direto: uma lata comum são 140 kcal que você bebe sem perceber.

Não é alimento saudável — é uma troca inteligente. Diferença importante.` },

{ id:'suco', tag:'nutricao',
  kw:['suco','suco de fruta','suco natural','suco detox','vitamina'],
  t: () => `Suco natural é açúcar sem a fibra. Uma laranja tem 60 kcal e te enche; um copo de suco tem três laranjas, 180 kcal e não enche ninguém.

"Detox" não existe: fígado e rim fazem esse trabalho, e nenhum suco melhora isso.

Coma a fruta, beba água. Se for tomar suco, conte como caloria líquida e registre.` },

{ id:'fruta-engorda', tag:'nutricao',
  kw:['fruta engorda','fruta a noite','muita fruta','fruta tem acucar','frutose'],
  t: () => `Não. Frutose de fruta vem com fibra, água e volume — é praticamente impossível exagerar comendo fruta inteira.

O problema é frutose isolada de industrializado, e isso é outra coisa.

Banana, manga e uva têm mais caloria que morango e melancia. Todas cabem. Só conte.` },

{ id:'gordura-saturada', tag:'nutricao',
  kw:['gordura saturada','banha','oleo de coco','manteiga faz mal','colesterol alto'],
  t: () => `As diretrizes recomendam limitar gordura saturada a cerca de 10% das calorias do dia. Óleo de coco é 90% saturada — ele não é superalimento, apesar do marketing.

Priorize azeite, abacate, castanha e peixe. Não precisa eliminar manteiga nem gordura de carne, precisa não fazer dela a base.

Quem tem dislipidemia diagnosticada segue a orientação do próprio médico.` },

{ id:'integral', tag:'nutricao',
  kw:['pao integral','arroz integral vale a pena','integral e melhor','farinha integral','de verdade integral'],
  t: () => `Integral entrega mais fibra e mais saciedade pela mesma caloria. Essa é a vantagem real — não é "menos engordativo".

Cuidado no supermercado: muito pão "integral" tem farinha branca como primeiro ingrediente e um pouco de fibra adicionada. Leia a lista: o primeiro item deve ser farinha integral.

Arroz integral tem 2,7 g de fibra contra 1,6 do branco. Diferença pequena. Se você odeia, coma o branco e tire fibra do feijão e dos vegetais.` },

{ id:'batata', tag:'nutricao',
  kw:['batata doce','batata inglesa','batata engorda','qual batata','carbo melhor'],
  t: () => `Batata doce não é superior à inglesa para emagrecimento. A diferença de índice glicêmico é irrelevante num prato misto.

Batata inglesa cozida tem 20 g de carboidrato por 100 g; a doce tem 24. Batata inglesa está entre os alimentos mais saciantes que existem.

Coma a que você gosta. A que você gosta é a que você mantém.` },

{ id:'lactose', tag:'nutricao',
  kw:['lactose','leite faz mal','intolerancia','sem lactose','leite incha'],
  t: () => `Intolerância à lactose é real e comum, e o sintoma é digestivo: gases, distensão, diarreia. Se você não tem sintoma, não há motivo para cortar leite.

Leite é uma das fontes de proteína mais baratas do mercado, e produtos sem lactose mantêm a proteína intacta.

Alergia à proteína do leite é outra coisa, mais rara e mais séria — essa é diagnóstico médico, não autoavaliação.` },

{ id:'antes-treino', tag:'nutricao',
  kw:['comer antes do treino','pre treino comida','treinar de barriga cheia','o que comer antes'],
  t: () => `Regra prática: 1 a 2 horas antes, carboidrato com proteína, gordura baixa. Fruta com iogurte, pão com ovo, tapioca com frango.

Se você treina cedo e não tolera comer, treine em jejum mesmo — em sessão de até uma hora a diferença de desempenho é pequena.

Gordura e fibra em volume perto do treino atrasam o esvaziamento e causam desconforto. Deixe para depois.` },

{ id:'depois-treino', tag:'nutricao',
  kw:['comer depois do treino','pos treino','o que comer apos','refeicao pos treino'],
  t: D => `Faça a refeição normal com proteína. Não precisa ser em 30 minutos e não precisa ser shake.

Se você treinou em jejum ou vai ficar mais de 3 horas sem comer depois, aí sim priorize uma refeição com 30 a 40 g de proteína em até duas horas.

O que decide seu resultado é o total de ${D.prot} g no dia, não o relógio.` },

{ id:'fome-noturna', tag:'nutricao',
  kw:['fome a noite','belisco a noite','ataco a geladeira','fome depois do jantar','descontrole a noite'],
  t: () => `Quase sempre tem uma de três causas, e nenhuma é falta de caráter:

**1.** Você comeu pouco durante o dia e está pagando a conta.
**2.** Proteína e fibra baixas nas refeições anteriores.
**3.** Cansaço — sono curto aumenta fome no fim do dia de forma mensurável.

Solução prática: distribua melhor a caloria, ancore o jantar em proteína e deixe uma opção pronta (iogurte proteico, ovo cozido) para quando bater. Proibir não funciona; substituir funciona.` },

{ id:'turno', tag:'nutricao',
  kw:['trabalho noturno','turno','plantao','horario invertido','viagem a trabalho'],
  t: () => `Rotina irregular não impede emagrecimento — ela impede improviso. Quem trabalha em turno precisa de preparo, não de disciplina extra.

O que funciona: leve comida pronta, mantenha a mesma quantidade total mesmo com horários trocados, e não use o cansaço como permissão. Cansaço aumenta fome, e saber disso já ajuda.

Sono fragmentado prejudica composição corporal. Não dá para anular, dá para compensar com proteína alta e treino mantido.` },

{ id:'familia', tag:'nutricao',
  kw:['familia come diferente','minha esposa','cozinhar duas vezes','comida da casa','so eu de dieta'],
  t: () => `Não cozinhe duas refeições. Cozinhe uma e mude a **proporção** do seu prato: mais proteína, mais vegetal, menos carboidrato e menos gordura de preparo.

Arroz, feijão, carne e salada servem a casa inteira. O que muda é quanto você põe de cada um.

Dieta que exige comida separada morre em três semanas.` },

/* ── TREINO: literatura aplicada ──────────────────── */
{ id:'hiit', tag:'treino',
  kw:['hiit','treino intervalado','hiit emagrece','tabata','intervalado'],
  t: () => `HIIT gasta caloria em menos tempo, e essa é a vantagem real. Não gasta "muito mais depois" — o efeito residual existe mas é pequeno, na ordem de dezenas de calorias.

Em comparação justa por caloria gasta, HIIT e cardio contínuo dão resultado parecido em perda de gordura.

No seu caso tem um porém: HIIT cobra recuperação, e você já está gastando essa recuperação no treino de força dentro de um déficit. Caminhada inclinada entrega o mesmo gasto sem competir.` },

{ id:'zona2', tag:'treino',
  kw:['zona 2','cardio leve','frequencia cardiaca','zona de queima de gordura'],
  t: () => `A "zona de queima de gordura" existe — em intensidade baixa o corpo usa proporcionalmente mais gordura. Mas isso é proporção, não total.

Correr forte usa menos gordura em porcentagem e mais gordura em quantidade absoluta, porque gasta muito mais.

O que importa para emagrecer é o gasto total, não de onde vem o combustível durante a hora de exercício. Escolha a intensidade que você sustenta.` },

{ id:'neat', tag:'treino',
  kw:['neat','gasto fora do treino','passos importam','movimento diario','sedentario'],
  t: D => `NEAT é tudo que você gasta fora do exercício: andar, subir escada, ficar de pé, gesticular. Entre pessoas, ele varia em **centenas de calorias por dia** — mais do que a maioria dos treinos.

E ele cai em déficit sem você perceber: o corpo economiza movimento. É por isso que meta de passos existe${D.peso ? '' : ''}.

Subir passos é a forma mais barata de aumentar déficit sem tirar comida do prato.` },

{ id:'full-body-abc', tag:'treino',
  kw:['full body','abc','divisao de treino','melhor divisao','treino abc'],
  t: D => `Para 3 sessões por semana, full body ganha: cada músculo recebe estímulo 3 vezes, contra 1 no ABC. Frequência distribui melhor o volume.

ABC faz sentido a partir de 4 a 5 sessões semanais.${D.fase ? `

Você está em full body A/B alternado, semana ${D.semana} de 12.` : ''}

Não existe divisão mágica. Existe a que cabe na sua semana e você cumpre.` },

{ id:'ordem-exercicio', tag:'treino',
  kw:['ordem dos exercicios','qual exercicio primeiro','comecar por qual','sequencia do treino'],
  t: () => `Comece pelo que exige mais coordenação e carga: multiarticulares antes de isolados, e o exercício mais importante do dia primeiro.

Motivo simples: o primeiro exercício recebe sua melhor energia. O que você põe no fim recebe o resto.

Se um grupo está atrasado, mova-o para o início do treino por algumas semanas. Isso resolve mais que adicionar exercício.` },

{ id:'maquina-livre', tag:'treino',
  kw:['maquina ou peso livre','halteres ou maquina','peso livre e melhor','musculacao livre'],
  t: D => `Peso livre exige mais estabilização e transfere melhor para a vida. Máquina permite carga alta com menos risco técnico e menos custo de coordenação.

Para hipertrofia, a diferença é menor do que a internet diz — o que decide é volume, progressão e execução.

No seu momento, máquina é a escolha certa: ela permite progredir sem que a técnica sob fadiga vire fator de risco. Migre para peso livre conforme o peso corporal baixar.` },

{ id:'amplitude', tag:'treino',
  kw:['amplitude','amplitude completa','meio movimento','descer tudo','agachar fundo'],
  t: () => `Amplitude completa entrega mais hipertrofia que amplitude parcial na mesma carga — especialmente na fase alongada do movimento.

Prática: reduza a carga até conseguir a amplitude que sua articulação permite **sem dor e sem compensar** com a coluna. Amplitude que exige gambiarra não é amplitude, é risco.

Meia repetição com peso grande é o erro mais comum da academia.` },

{ id:'cadencia', tag:'treino',
  kw:['cadencia','tempo sob tensao','velocidade da repeticao','descer devagar','explosao'],
  t: () => `Controle a fase de descida em 2 a 3 segundos e suba com intenção. Não precisa contar: precisa não largar o peso.

"Tempo sob tensão" virou obsessão sem necessidade. Cadências muito lentas reduzem a carga total e não compensam.

O que realmente importa: a descida controlada é onde mora boa parte do estímulo, e é justamente onde todo mundo relaxa.` },

{ id:'respiracao', tag:'treino',
  kw:['respiracao','como respirar','prender a respiracao','respirar no treino'],
  t: () => `Inspire antes da fase de descida, segure com o core firme durante o esforço, expire ao terminar a repetição.

Prender por 1 a 2 segundos em carga alta é normal e estabiliza a coluna. O que não pode é prender várias repetições seguidas — isso eleva a pressão e pode causar tontura.

Quem tem hipertensão não controlada deve conversar com o médico sobre isso especificamente.` },

{ id:'joelho', tag:'treino',
  kw:['joelho passa do pe','dor no joelho no agachamento','agachamento faz mal ao joelho','joelho estala'],
  t: () => `"Joelho não pode passar do pé" é mito antigo e já superado. Em agachamento e avanço, o joelho avança naturalmente e isso é anatômico.

O que causa dor de verdade: carga acima da capacidade, amplitude forçada, joelho colapsando para dentro e ausência de progressão gradual.

Estalo sem dor não é problema. Dor é — e dor persistente é avaliação, não é treinar por cima.` },

{ id:'lombar', tag:'treino',
  kw:['dor na lombar','dor nas costas','coluna','hernia de disco','protusao'],
  t: () => `Dor lombar ocasional depois de treino pesado com técnica ruim é comum. Dor que persiste, irradia para a perna ou vem com formigamento **não é** assunto de app.

Treino de força bem conduzido é um dos melhores tratamentos para lombalgia crônica — feito **com avaliação**, não por conta própria.

Se você tem hérnia ou protrusão diagnosticada, o programa precisa ser adaptado por profissional. Procure um fisioterapeuta antes de seguir o cardápio de exercícios padrão.` },

{ id:'ombro', tag:'treino',
  kw:['dor no ombro','manguito rotador','ombro estala','desenvolvimento dor','supino dor no ombro'],
  t: () => `Ombro é a articulação mais móvel e a mais fácil de irritar. As três causas mais comuns na academia: desenvolvimento atrás da nuca, supino com cotovelo aberto a 90 graus e puxada atrás da nuca.

Correção: cotovelo a cerca de 45 graus do tronco, tudo à frente do corpo, e fortalecimento do manguito e do trapézio inferior.

Dor que persiste por semanas ou limita levantar o braço é avaliação profissional.` },

{ id:'destreino', tag:'treino',
  kw:['parei de treinar','quanto tempo perco','destreino','voltar depois de meses','perdi tudo treino'],
  t: () => `Boa notícia: força cai bem mais devagar do que as pessoas temem. Duas semanas parado praticamente não mudam nada. Um mês custa pouco e volta rápido.

Existe **memória muscular** real: quem já teve o músculo recupera muito mais rápido que quem nunca teve.

Voltar depois de pausa: comece com 60% da carga anterior e suba em duas a três semanas. O erro é voltar na carga antiga e se machucar na primeira semana.` },

{ id:'idade', tag:'treino',
  kw:['idade','depois dos 40','depois dos 50','velho para treinar','sarcopenia','tarde demais'],
  t: () => `Ganho de massa e força acontece em qualquer idade. A partir dos 30 a 40 anos há perda progressiva natural de massa magra — e treino de força é a intervenção mais eficaz contra isso, não uma vaidade.

O que muda com a idade: recuperação mais lenta e mais cuidado com articulação. Não muda a capacidade de melhorar.

Começar aos 50 é melhor que não começar. Sempre.` },

{ id:'mulher-treino', tag:'treino',
  kw:['mulher musculacao','vou ficar bombada','ficar bombada','bombada','mulher pode pegar peso','peso pesado mulher','masculinizar','mulher treino pesado','vou ficar masculina'],
  t: () => `Mulher não fica "bombada" treinando pesado. O perfil hormonal torna isso extremamente difícil sem intervenção farmacológica — e quem tem esse visual buscou ativamente por anos.

Musculação com carga é o que dá o resultado que a maioria procura: mais massa magra, mais gasto de repouso, mais densidade óssea.

Treino leve com muita repetição não é "mais feminino". É só menos eficaz.` },

{ id:'supersete', tag:'treino',
  kw:['superserie','drop set','bi set','tecnica de intensificacao','rest pause'],
  t: () => `Técnicas de intensificação economizam tempo e aumentam densidade de treino. Elas **não** substituem volume e progressão.

Drop set e rest-pause cobram recuperação, que é exatamente o que falta em déficit. Use com parcimônia: uma ou duas séries finais de exercício isolado, não o treino todo.

No app, marque a série como **D** — ela conta no volume mas não entra na progressão de carga.` },

{ id:'cardio-ordem', tag:'treino',
  kw:['cardio antes ou depois','esteira antes do treino','cardio depois da musculacao','ordem cardio'],
  t: () => `Se o objetivo é preservar massa magra, faça a musculação primeiro. Cardio antes consome a energia que deveria ir para a carga.

Ideal seria em sessões separadas. Realista: musculação, depois 20 a 25 minutos de caminhada inclinada.

Aquecimento de 5 minutos de esteira antes não conta como cardio — conta como aquecimento e é bem-vindo.` },

{ id:'plato-forca', tag:'treino',
  kw:['plato de forca','carga travou','nao consigo subir carga','forca estagnou'],
  t: D => `Carga parada em déficit é esperado, não é falha. Você está tentando progredir com menos energia disponível — manter já é vitória.

Antes de mudar o programa, cheque nesta ordem: proteína${D.prot ? ` (${D.prot} g)` : ''}, sono, frequência de treino e se você não está indo perto demais da falha em toda série.

Se tudo isso estiver certo e a carga não sobe há três semanas, antecipe o deload em vez de insistir.` },

{ id:'execucao', tag:'treino',
  kw:['execucao','tecnica','estou fazendo certo','forma correta','espelho'],
  t: () => `No app, toque no **?** ao lado de cada exercício durante o treino: tem o cue de execução e o erro mais comum daquele movimento.

Três regras que valem para quase tudo: controle a descida, não perca a posição da escápula nos exercícios de tronco, e não troque amplitude por carga.

Se puder, grave um vídeo de lado na primeira série. Você vai ver coisas que não sente.` },

{ id:'quantas-vezes', tag:'treino',
  kw:['quantas vezes por semana','frequencia de treino','treinar todo dia','2x por semana basta'],
  t: () => `Duas sessões semanais já sustentam massa magra em déficit. Três é o ponto onde o retorno é melhor pelo tempo investido. Acima de quatro, o ganho extra é pequeno e o custo de recuperação cresce.

Treinar todos os dias não acelera nada e atrapalha a recuperação — que em déficit já está comprometida.

Constância bate intensidade. Três sessões médias por 12 semanas ganham de seis sessões pesadas por três semanas seguidas de abandono.` }

);

/* Procura o tópico pela pergunta. Exige palavra inteira —
   substring casava "sal" dentro de "salada". */
function buscarSaber(texto, proprio) {
  const q = norm(texto);
  if (!q) return null;

  // o que a pessoa ensinou vence o que veio de fábrica
  if (proprio && proprio.length) {
    let bp = null, pp = 0;
    proprio.forEach(item => {
      const toks = norm(item.q).split(' ').filter(t => t.length > 3);
      if (!toks.length) return;
      const casados = toks.filter(t => new RegExp('(^|\\s)' + t + '(\\s|$)').test(q)).length;
      const p = casados >= Math.max(1, Math.ceil(toks.length * 0.6)) ? casados * 5 : 0;
      if (p > pp) { pp = p; bp = item; }
    });
    if (bp) return { id:'proprio:'+bp.q, tag:'proprio', proprio:true, t: () => bp.a };
  }

  let melhor = null, ponto = 0;
  SABER.forEach(s => {
    let p = 0;
    s.kw.forEach(k => {
      const kn = norm(k);
      const re = new RegExp('(^|\\s)' + kn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(\\s|$)');
      // pontua por especificidade: "como calcula o jejum" tem de vencer
      // "como voce calcula", senão a pergunta cai no tópico errado
      if (re.test(q)) p += kn.split(' ').length * 4;
    });
    if (p > ponto) { ponto = p; melhor = s; }
  });
  return ponto >= 3 ? melhor : null;
}

/* Aplica o tom conforme a intensidade escolhida (seção 21).
   Muda objetividade, nunca o respeito. */
function tonalizar(texto, intensidade, nome) {
  const n = { normal:0, firme:1, hard:2, hardmax:3 }[intensidade];
  if (n === 3) {
    // corta ao essencial: primeiro e último parágrafo
    const ps = texto.split('\n\n').filter(Boolean);
    return ps.length > 2 ? ps[0] + '\n\n' + ps[ps.length-1] : texto;
  }
  if (n >= 2 && nome) return nome + ', ' + texto.charAt(0).toLowerCase() + texto.slice(1);
  return texto;
}
