// Relógio em tempo real (horário de Brasília — o container roda em UTC)
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const clockElement = document.getElementById('clock');
  if (clockElement) clockElement.innerText = timeString;
}
setInterval(updateClock, 1000);
updateClock();

async function fetchDashboardData() {
  const statusEl = document.getElementById('status-conexao');

  try {
    const response = await fetch(`/dados_painel.json?t=${new Date().getTime()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Arquivo não retornado pelo server`);
    }

    const data = await response.json();

    // O JSON enviado pelo hub traz as tabelas em cards.card[] (tipo_card "tabela").
    // O layout tem duas tabelas fixas: usamos a 1a e a 2a tabela do array.
    // Se vier no formato antigo (lista_esquerda/lista_direita), ele continua valendo.
    const tabelas = Array.isArray(data.cards && data.cards.card)
      ? data.cards.card.filter(c => c && (c.tipo_card === 'tabela' || (c.cabecalho && c.linhas)))
      : [];
    const listaEsquerda = Array.isArray(data.lista_esquerda) ? data.lista_esquerda
      : (tabelas[0] ? [tabelas[0]] : []);
    const listaDireita = Array.isArray(data.lista_direita) ? data.lista_direita
      : (tabelas[1] ? [tabelas[1]] : []);

    // 1. Títulos Principais
    const elTitulo = document.getElementById('painel-titulo');
    if (elTitulo && data.painel_titulo) elTitulo.innerText = data.painel_titulo;

    const elSubtitulo = document.getElementById('painel-subtitulo');
    if (elSubtitulo && data.painel_subtitulo) elSubtitulo.innerText = data.painel_subtitulo;

    // 2. Preenchimento Dinâmico dos KPIs
    if (Array.isArray(data.kpis)) {
      data.kpis.forEach((kpi, index) => {
        const elValor = document.getElementById(`kpi-valor-${index}`);
        const elTituloKpi = document.getElementById(`kpi-titulo-${index}`);

        if (elValor) {
          elValor.innerText = kpi.valor ?? '--';
          elValor.style.color = '';
        }

        if (elTituloKpi) {
          elTituloKpi.innerText = kpi.titulo ?? '';
          elTituloKpi.style.color = '';
        }
      });
    }

    // 3. Tabela Esquerda (Produtividade)
    if (listaEsquerda.length > 0) {
      const configEsq = listaEsquerda[0];

      const elTituloEsq = document.getElementById('titulo-lista-esquerda');
      if (elTituloEsq && configEsq.titulo_lista) {
        elTituloEsq.innerText = configEsq.titulo_lista;
      }

      if (configEsq.cabecalho) {
        const trCabecalhoEsq = document.getElementById('cabecalho-lista-esquerda');
        if (trCabecalhoEsq) {
          trCabecalhoEsq.innerHTML = Object.values(configEsq.cabecalho)
            .map(col => `<th class="py-2 px-2 font-bold text-xs text-slate-400 uppercase tracking-wider">${col}</th>`)
            .join('');
        }
      }

      const tbodyEsq = document.getElementById('tbody-lista-esquerda');
      if (tbodyEsq && Array.isArray(configEsq.linhas)) {
        tbodyEsq.innerHTML = configEsq.linhas.map(linha => `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="py-2 px-2 text-base font-black text-white">${linha.celula1 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-bold text-slate-100 uppercase">${linha.celula2 ?? ''}</td>
            <td class="py-2 px-2 text-xs">
              <span class="px-2 py-0.5 rounded text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap inline-block text-center uppercase tracking-wider">
                ${linha.celula3 ?? ''}
              </span>
            </td>
            <td class="py-2 px-2 text-sm font-semibold text-slate-300">${linha.celula4 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-bold text-slate-200 uppercase">${linha.celula5 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-medium text-slate-300">${linha.celula6 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-medium text-slate-200 truncate max-w-[200px]">${linha.celula7 ?? ''}</td>
          </tr>
        `).join('');
      }
    }

    // 4. Tabela Direita (Chamados Recentes)
    if (listaDireita.length > 0) {
      const configDir = listaDireita[0];

      const elTituloDir = document.getElementById('titulo-lista-direita');
      if (elTituloDir && configDir.titulo_lista) {
        elTituloDir.innerText = configDir.titulo_lista;
      }

      if (configDir.cabecalho) {
        const trCabecalhoDir = document.getElementById('cabecalho-lista-direita');
        if (trCabecalhoDir) {
          trCabecalhoDir.innerHTML = Object.values(configDir.cabecalho)
            .map(col => `<th class="py-2 px-2 font-bold text-xs text-slate-400 uppercase tracking-wider">${col}</th>`)
            .join('');
        }
      }

      const tbodyDir = document.getElementById('tbody-lista-direita');
      if (tbodyDir && Array.isArray(configDir.linhas)) {
        tbodyDir.innerHTML = configDir.linhas.map(linha => `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="py-2 px-2 text-base font-black text-white">${linha.celula1 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-bold text-slate-100 uppercase">${linha.celula2 ?? ''}</td>
            <td class="py-2 px-2 text-xs">
              <span class="px-2 py-0.5 rounded text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap inline-block text-center uppercase tracking-wider">
                ${linha.celula3 ?? ''}
              </span>
            </td>
            <td class="py-2 px-2 text-sm font-semibold text-slate-300">${linha.celula4 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-medium text-slate-300">${linha.celula5 ?? ''}</td>
            <td class="py-2 px-2 text-sm font-medium text-slate-300">${linha.celula6 ?? ''}</td>
          </tr>
        `).join('');
      }
    }

    if (statusEl) statusEl.innerText = 'Sincronizado • Dados JSON carregados';

  } catch (error) {
    if (statusEl) statusEl.innerText = `Erro no Front: ${error.message}`;
    console.error('Falha ao processar dados:', error);
  }
}

// Diagnóstico de resolução: manda uma vez para o servidor o que o navegador vê.
// Aparece em `balena logs <uuid> --service web` com o prefixo [diag].
function reportarTela() {
  const dados = {
    screen: [screen.width, screen.height],
    disponivel: [screen.availWidth, screen.availHeight],
    janela: [window.innerWidth, window.innerHeight],
    documento: [document.documentElement.clientWidth, document.documentElement.clientHeight],
    dpr: window.devicePixelRatio,
    zoomVisual: window.visualViewport ? window.visualViewport.scale : null
  };
  fetch('/diag/tela', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  }).catch(() => {});
}

fetchDashboardData();
setInterval(fetchDashboardData, 5000);
reportarTela();