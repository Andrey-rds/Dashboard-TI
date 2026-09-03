// Relógio em tempo real
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR');
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
    if (Array.isArray(data.lista_esquerda) && data.lista_esquerda.length > 0) {
      const configEsq = data.lista_esquerda[0];

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
    if (Array.isArray(data.lista_direita) && data.lista_direita.length > 0) {
      const configDir = data.lista_direita[0];

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

fetchDashboardData();
setInterval(fetchDashboardData, 5000);