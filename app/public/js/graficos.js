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

function atualizarRelogio() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();

  const elHora = document.getElementById('relogio-hora');
  const elData = document.getElementById('relogio-data');

  if (elHora) elHora.textContent = `${horas}:${minutos}:${segundos}`;
  if (elData) elData.textContent = `${dia}/${mes}/${ano}`;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

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

    if (dados.graficos) {
      renderizarGraficoFluxo(dados.graficos.fluxo_operacional);
      renderizarGraficoDistribuicao(dados.graficos.distribuicao_chamados);
      renderizarGraficoAnaliseLoja(dados.graficos.analise_por_loja);
    }
  } catch (error) {
    console.error('Erro ao consumir o JSON:', error);
  }
}

function renderizarGraficoFluxo(dadosFluxo) {
  const elTitulo = document.getElementById('titulo-fluxo');
  if (elTitulo && dadosFluxo.titulo_grafico) elTitulo.textContent = dadosFluxo.titulo_grafico;

  const ctxFluxo = document.getElementById('chartFluxo').getContext('2d');
  
  const gradAbertos = ctxFluxo.createLinearGradient(0, 0, 0, 200);
  gradAbertos.addColorStop(0, 'rgba(222, 48, 43, 0.35)');
  gradAbertos.addColorStop(1, 'rgba(222, 48, 43, 0.0)');

  const gradResolvidos = ctxFluxo.createLinearGradient(0, 0, 0, 200);
  gradResolvidos.addColorStop(0, 'rgba(0, 92, 158, 0.35)');
  gradResolvidos.addColorStop(1, 'rgba(0, 92, 158, 0.0)');

  new Chart(ctxFluxo, {
    type: 'line',
    data: {
      labels: dadosFluxo.labels,
      datasets: [
        {
          label: 'Chamados em Aberto',
          data: dadosFluxo.chamados_abertos,
          borderColor: '#DE302B',
          backgroundColor: gradAbertos,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#DE302B'
        },
        {
          label: 'Chamados Resolvidos',
          data: dadosFluxo.chamados_resolvidos,
          borderColor: '#005C9E',
          backgroundColor: gradResolvidos,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#005C9E'
        }
      ]
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

function renderizarGraficoDistribuicao(dadosDistribuicao) {
  const elTitulo = document.getElementById('titulo-distribuicao');
  if (elTitulo && dadosDistribuicao.titulo_grafico) elTitulo.textContent = dadosDistribuicao.titulo_grafico;

  const ctxCanal = document.getElementById('chartCanal').getContext('2d');
  new Chart(ctxCanal, {
    type: 'doughnut',
    data: {
      labels: dadosDistribuicao.labels,
      datasets: [{
        data: dadosDistribuicao.valores,
        backgroundColor: ['#DE302B', '#005C9E', '#FFB800'],
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

function renderizarGraficoAnaliseLoja(dadosLoja) {
  const elTitulo = document.getElementById('titulo-loja');
  if (elTitulo && dadosLoja.titulo_grafico) elTitulo.textContent = dadosLoja.titulo_grafico;

  const ctxRendimento = document.getElementById('chartRendimento').getContext('2d');
  new Chart(ctxRendimento, {
    type: 'bar',
    data: {
      labels: dadosLoja.labels,
      datasets: [
        {
          type: 'line',
          label: 'Total O.S.',
          data: dadosLoja.total_os,
          borderColor: '#DE302B',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#DE302B',
          fill: false
        },
        {
          label: 'Resolvidos',
          data: dadosLoja.resolvidos,
          backgroundColor: '#005C9E',
          borderRadius: 2
        },
        {
          label: 'Pendentes / Em Aberto',
          data: dadosLoja.pendentes,
          backgroundColor: '#FFB800',
          borderRadius: 2
        }
      ]
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

document.addEventListener('DOMContentLoaded', carregarDadosPainel);