Chart.defaults.color = '#9CA3AF';
Chart.defaults.font.size = 11;
Chart.defaults.font.family = "'Segoe UI', Roboto, sans-serif";

// Plugin nativo para desenhar rótulos de valores nos gráficos
const pluginDataLabels = {
  id: 'customDataLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const val = dataset.data[index];
        if (val === null || val === undefined) return;

        ctx.save();
        ctx.font = 'bold 11px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Gráfico de Rosca (Doughnut)
        if (chart.config.type === 'doughnut') {
          const { x, y } = element.tooltipPosition();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(val, x, y);
        } 
        // Gráfico de Linha ou de Barras
        else {
          const { x, y } = element;
          
          // Se for a linha vermelha do gráfico de barras (Total O.S.)
          if (dataset.type === 'line' || chart.config.type === 'line') {
            ctx.fillStyle = dataset.borderColor || '#FFFFFF';
            ctx.fillText(val, x, y - 10);
          } 
          // Se forem as barras
          else if (chart.config.type === 'bar') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(val, x, y - 8);
          }
        }
        ctx.restore();
      });
    });
  }
};

// Registra o plugin globalmente
Chart.register(pluginDataLabels);

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

// Paleta de cores padrão para séries sem correspondência de palavra-chave
const PALETA_CORES = ['#DE302B', '#005C9E', '#FFB800', '#10B981', '#8B5CF6', '#EC4899'];

// Associa uma cor a uma série com base em palavras-chave do rótulo (mantém a identidade visual original)
function corParaLabel(label, index) {
  const l = (label || '').toLowerCase();
  if (l.includes('abert')) return '#DE302B';
  if (l.includes('total')) return '#DE302B';
  if (l.includes('resolv')) return '#005C9E';
  if (l.includes('pend')) return '#FFB800';
  return PALETA_CORES[index % PALETA_CORES.length];
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

    if (Array.isArray(dados.graficos)) {
      renderizarGraficos(dados.graficos);
    }
  } catch (error) {
    console.error('Erro ao consumir o JSON:', error);
  }
}

// Distribui cada item do array "graficos" para o gráfico correto, pelo tipo_grafico
function renderizarGraficos(graficos) {
  const linhas = graficos.filter(g => g.tipo_grafico === 'line');
  const roscas = graficos.filter(g => g.tipo_grafico === 'doughnut');
  const barras = graficos.filter(g => g.tipo_grafico === 'bar');

  // FLUXO OPERACIONAL DIÁRIO -> primeiro gráfico de linha
  if (linhas[0]) renderizarGraficoFluxo(linhas[0]);

  // DISTRIBUIÇÃO DE CHAMADOS -> primeiro gráfico de rosca
  if (roscas[0]) renderizarGraficoDistribuicao(roscas[0]);

  // ANÁLISE DE CHAMADOS POR LOJA -> primeiro gráfico de barras
  if (barras[0]) renderizarGraficoAnaliseLoja(barras[0]);
}

function renderizarGraficoFluxo(grafico) {
  const params = grafico.parametros_grafico || {};
  const elTitulo = document.getElementById('titulo-fluxo');
  if (elTitulo && grafico.titulo_grafico) elTitulo.textContent = grafico.titulo_grafico;

  const ctxFluxo = document.getElementById('chartFluxo').getContext('2d');

  const datasets = (params.series || []).map((serie, index) => {
    const cor = corParaLabel(serie.label, index);
    const grad = ctxFluxo.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, hexParaRgba(cor, 0.35));
    grad.addColorStop(1, hexParaRgba(cor, 0.0));

    return {
      label: serie.label,
      data: serie.valores,
      borderColor: cor,
      backgroundColor: grad,
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: cor
    };
  });

  new Chart(ctxFluxo, {
    type: 'line',
    data: {
      labels: params.labels || [],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#FFFFFF', font: { size: 11 }, boxWidth: 10, padding: 8 }
        }
      },
      scales: {
        x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#1F2937' } },
        y: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#1F2937' } }
      }
    }
  });
}

function renderizarGraficoDistribuicao(grafico) {
  const params = grafico.parametros_grafico || {};
  const elTitulo = document.getElementById('titulo-distribuicao');
  if (elTitulo && grafico.titulo_grafico) elTitulo.textContent = grafico.titulo_grafico;

  const labels = params.labels || [];
  const cores = labels.map((label, index) => corParaLabel(label, index));

  const ctxCanal = document.getElementById('chartCanal').getContext('2d');
  new Chart(ctxCanal, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: params.valores || [],
        backgroundColor: cores,
        borderWidth: 2,
        borderColor: '#131927'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#FFFFFF', font: { size: 10 }, padding: 8, boxWidth: 10 }
        }
      },
      cutout: '62%'
    }
  });
}

function renderizarGraficoAnaliseLoja(grafico) {
  const params = grafico.parametros_grafico || {};
  const elTitulo = document.getElementById('titulo-loja');
  if (elTitulo && grafico.titulo_grafico) elTitulo.textContent = grafico.titulo_grafico;

  const ctxRendimento = document.getElementById('chartRendimento').getContext('2d');

  const datasets = (params.series || []).map((serie, index) => {
    const cor = corParaLabel(serie.label, index);
    const ehTotal = (serie.label || '').toLowerCase().includes('total');

    if (ehTotal) {
      return {
        type: 'line',
        label: serie.label,
        data: serie.valores,
        borderColor: cor,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: cor,
        fill: false
      };
    }

    return {
      label: serie.label,
      data: serie.valores,
      backgroundColor: cor,
      borderRadius: 2
    };
  });

  new Chart(ctxRendimento, {
    type: 'bar',
    data: {
      labels: params.labels || [],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#FFFFFF', font: { size: 10 }, boxWidth: 10, padding: 6 }
        }
      },
      scales: {
        x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#1F2937' } }
      }
    }
  });
}

// Converte cor hexadecimal (#RRGGBB) para rgba(), usado nos gradientes
function hexParaRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

document.addEventListener('DOMContentLoaded', carregarDadosPainel);
