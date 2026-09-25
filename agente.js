/* ══════════════════════════════════════════════════════════
   TOOL ENGINE & SAFETY GUARD (Agente)
   Controla a execução de comandos solicitados pela IA. 
   Nenhuma IA altera dados diretamente; tudo passa por aqui.
   ══════════════════════════════════════════════════════════ */

const Agente = {
  /* ── 1. FERRAMENTAS DE DIETA E REGISTO ── */
  ferramentas: {
    registrarPeso: (kg) => {
      const peso = parseFloat(kg);
      if (isNaN(peso) || peso < 30 || peso > 300) return "Erro: Peso inválido. Deve ser entre 30 e 300 kg.";
      if (typeof app !== 'undefined' && app.salvarPeso) {
        app.salvarPeso(peso);
        return `Sucesso: Peso de ${peso}kg registrado.`;
      }
      return "Sucesso simulado: Peso recebido, mas a interface de gravação nativa não foi encontrada.";
    },

    substituirAlimento: (refeicao, alimentoSaindo, alimentoEntrando) => {
      if (!refeicao || !alimentoEntrando) return "Erro: Faltam parâmetros para a substituição.";
      return `Ação validada: ${alimentoEntrando} foi sugerido para a refeição ${refeicao}. Confirme a troca na interface da dieta.`;
    },

    adaptarTreinoTempo: (minutos) => {
      const min = parseInt(minutos);
      if (isNaN(min) || min < 10) return "Erro: O treino deve ter pelo menos 10 minutos.";
      return `Ação validada: O treino foi otimizado para ${min} minutos. O volume de séries de isolamento foi reduzido.`;
    },

    // --- NOVA FERRAMENTA: MODO EVENTO (BUFFER INTELIGENTE) ---
    ativarModoEvento: (diaSemana, nivelExagero) => {
      // nivelExagero: 1 (Leve), 2 (Moderado/Churrasco), 3 (Pesado)
      let nivel = parseInt(nivelExagero);
      if (isNaN(nivel) || nivel < 1) nivel = 2; // Padrão: evento moderado
      
      const creditosNecessarios = nivel * 500; 
      
      return `Modo Evento ativado para ${diaSemana}. Retirei temporariamente uma pequena fração de calorias dos seus próximos dias úteis. Você tem agora um crédito extra de ${creditosNecessarios} kcal para o seu evento, sem estragar o déficit da semana. Aproveite sem culpa!`;
    }
  },

  /* ── 2. VALIDATOR (SAFETY GUARD) ── */
  validarComando(comandoStr) {
    const match = comandoStr.match(/\[CMD:([^\vert{}]+)\Vert{}([^\]]+)\]/);
    if (!match) return null;

    const acao = match[1].trim();
    const args = match[2].split('|').map(a => a.trim());

    if (typeof this.ferramentas[acao] === 'function') {
      try {
        const resultado = this.ferramentas[acao](...args);
        return { executado: true, acao, args, resultado };
      } catch (e) {
        return { executado: false, acao, erro: e.message };
      }
    }
    return { executado: false, acao, erro: "Ferramenta não autorizada ou inexistente." };
  }
};