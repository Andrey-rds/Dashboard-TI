// Horário de Brasília — o container roda em UTC
function atualizarRelogio() {
  const agora = new Date();
  const fuso = { timeZone: 'America/Sao_Paulo' };

  const elHora = document.getElementById('relogio-hora');
  const elData = document.getElementById('relogio-data');

  if (elHora) elHora.textContent = agora.toLocaleTimeString('pt-BR', fuso);
  if (elData) elData.textContent = agora.toLocaleDateString('pt-BR', fuso);
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// Configuração visual por tipo de insight (cor, rótulo e ícone)
const CONFIG_TIPO = {
  alerta: {
    corPadrao: '#DE302B',
    rotulo: 'ALERTA',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>'
  },
  tendencia: {
    corPadrao: '#FFB800',
    rotulo: 'TENDÊNCIA',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"/>'
  },
  destaque: {
    corPadrao: '#005C9E',
    rotulo: 'DESTAQUE',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>'
  },
  positivo: {
    corPadrao: '#10B981',
    rotulo: 'POSITIVO',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
  }
};

function hexParaRgba(hex, alpha) {
  const h = (hex || '#9CA3AF').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function carregarDadosPainel() {
  try {
    const response = await fetch('./dados_painel.json');
    if (!response.ok) throw new Error('Falha ao carregar o arquivo JSON');

    const dados = await response.json();

    if (dados.painel_titulo) {
      document.getElementById('painel-titulo').textContent = dados.painel_titulo;
    }
    if (dados.painel_subtitulo) {
      document.getElementById('painel-subtitulo').textContent = dados.painel_subtitulo;
    }

    // "insights" (ou "insight_ia") pode vir como objeto, no formato do hub, ou
    // como array de cards, no formato antigo do app. Os dois são aceitos.
    const bruto = dados.insights ?? dados.insight_ia;
    if (bruto && typeof bruto === 'object' && !Array.isArray(bruto)) {
      renderizarResumoGestor(bruto);
    }
    renderizarInsights(Array.isArray(bruto) ? bruto : cardsDeInsights(bruto));
  } catch (error) {
    console.error('Erro ao consumir o JSON:', error);
  }
}

function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

// Cada lista de insights vira um card, na ordem abaixo. Listas vazias ou
// ausentes são ignoradas, e a grade se ajusta à quantidade de cards.
const LISTAS_INSIGHT = [
  { chave: 'alerta', tipo: 'alerta', titulo: 'Alertas' },
  { chave: 'riscos', tipo: 'alerta', titulo: 'Riscos' },
  { chave: 'tendencia', tipo: 'tendencia', titulo: 'Tendências' },
  { chave: 'positivo', tipo: 'positivo', titulo: 'Pontos positivos' },
  { chave: 'recomendacoes', tipo: 'destaque', titulo: 'Recomendações' }
];

function cardsDeInsights(insights) {
  if (!insights || typeof insights !== 'object' || Array.isArray(insights)) return [];

  const cards = [];

  LISTAS_INSIGHT.forEach(({ chave, tipo, titulo }) => {
    const valor = insights[chave];
    const itens = Array.isArray(valor) ? valor : (valor ? [valor] : []);
    const limpos = itens.filter(item => String(item ?? '').trim() !== '');
    if (limpos.length) cards.push({ tipo, titulo, itens: limpos });
  });

  const concentracao = insights.concentracao_cliente;
  if (concentracao && Array.isArray(concentracao.metricas)) {
    cards.push({
      tipo: concentracao.tipo || 'alerta',
      cor: concentracao.cor || CONFIG_TIPO.alerta.corPadrao,
      titulo: concentracao.titulo || 'Concentração por cliente',
      metricas: concentracao.metricas
    });
  }

  return cards;
}

function renderizarResumoGestor(insights) {
  const containerKpis = document.getElementById('resumo-kpis');
  const containerOperacional = document.getElementById('resumo-operacional');
  if (!containerKpis || !containerOperacional) return;

  const indicadores = Array.isArray(insights.indicadores) ? insights.indicadores : [];
  containerKpis.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      ${indicadores.map(item => `
        <div class="bg-[#131927] border border-gray-800/80 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
          <span class="text-base uppercase text-gray-300">${escaparHtml(item.indicador)}</span>
          <strong class="text-3xl text-white">${escaparHtml(item.valor)}</strong>
        </div>
      `).join('')}
    </div>
  `;

  const cfg = CONFIG_TIPO.destaque;
  containerOperacional.innerHTML = `
    <div class="insight-card bg-[#131927] border border-gray-800/80 rounded-lg px-3 py-2.5 flex items-start gap-3 shadow-md" style="border-left: 4px solid ${cfg.corPadrao};">
      <div class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background-color:${hexParaRgba(cfg.corPadrao, 0.15)};">
        <svg class="w-5 h-5" style="color:${cfg.corPadrao};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${cfg.icone}
        </svg>
      </div>
      <div class="min-w-0">
        <h3 class="text-lg uppercase font-bold text-white leading-tight mb-1">${escaparHtml(insights.titulo_dashboard || 'Insight Operacional')}</h3>
        <p class="text-base uppercase text-gray-300 leading-snug">${escaparHtml(insights.mensagem)}</p>
      </div>
    </div>
  `;
}

function renderizarInsights(insights) {
  const container = document.getElementById('container-insights');
  if (!container) return;

  container.innerHTML = '';

  if (!insights.length) {
    container.className = 'flex-1 grid grid-cols-1 grid-rows-1 gap-2.5 min-h-0';
    container.innerHTML = `
      <div class="bg-[#131927] border border-gray-800/80 rounded-lg p-3 flex items-center justify-center shadow-md">
        <span class="text-sm text-gray-500 italic">Nenhum insight disponível no momento.</span>
      </div>`;
    return;
  }

  // Ajusta a grade automaticamente conforme a quantidade de cards
  const total = insights.length;
  let colunas = 2;
  let linhas = 2;
  if (total <= 2) { colunas = total; linhas = 1; }
  else if (total === 3) { colunas = 3; linhas = 1; }
  else if (total <= 4) { colunas = 2; linhas = 2; }
  else if (total <= 6) { colunas = 3; linhas = 2; }
  else { colunas = 3; linhas = Math.ceil(total / 3); }

  container.className = `flex-1 grid gap-2.5 min-h-0`;
  container.style.gridTemplateColumns = `repeat(${colunas}, minmax(0, 1fr))`;
  container.style.gridTemplateRows = `repeat(${linhas}, minmax(0, 1fr))`;

  insights.forEach(item => {
    const cfg = CONFIG_TIPO[item.tipo] || CONFIG_TIPO.destaque;
    const cor = item.cor || cfg.corPadrao;

    const card = document.createElement('div');
    card.className = 'insight-card bg-[#131927] border border-gray-800/80 rounded-lg p-2.5 flex flex-col shadow-md min-h-0 overflow-hidden';
    card.style.borderLeft = `4px solid ${cor}`;

    card.innerHTML = `
      <div class="flex items-center gap-2 mb-2 shrink-0">
        <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style="background-color:${hexParaRgba(cor, 0.15)};">
          <svg class="w-4 h-4" style="color:${cor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${cfg.icone}
          </svg>
        </div>
        <span class="text-sm uppercase font-bold tracking-wider" style="color:${cor};">${cfg.rotulo}</span>
      </div>
      <h3 class="text-base md:text-lg uppercase font-bold text-white leading-tight mb-1.5">${escaparHtml(item.titulo)}</h3>
      ${Array.isArray(item.metricas) && item.metricas.length
        ? `<ul class="text-base md:text-lg uppercase text-gray-400 leading-snug overflow-hidden list-disc pl-4 space-y-0.5">
             ${item.metricas.map(metrica => `<li>${escaparHtml(metrica.cliente)}: ${escaparHtml(metrica.chamados)} CHAMADOS (${escaparHtml(metrica.percentual)})</li>`).join('')}
           </ul>`
        : Array.isArray(item.itens) && item.itens.length
        ? `<ul class="text-base md:text-lg uppercase text-gray-400 leading-snug overflow-hidden list-disc pl-4 space-y-0.5">
             ${item.itens.map(t => `<li>${escaparHtml(t)}</li>`).join('')}
           </ul>`
        : `<p class="text-base md:text-lg uppercase text-gray-400 leading-snug overflow-hidden">${escaparHtml(item.descricao)}</p>`}
    `;

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', carregarDadosPainel);
