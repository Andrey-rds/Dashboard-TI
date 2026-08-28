require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const publicPath = path.resolve(__dirname, 'app', 'public');

// Servir arquivos estáticos (HTML, CSS, JS e JSON)
app.use(express.static(publicPath));

// ==============================
// ROTA EXPLICITA PARA O DADOS_PAINEL.JSON
// ==============================
app.get('/dados_painel.json', (req, res) => {
  const jsonFilePath = path.join(publicPath, 'dados_painel.json');

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro de leitura no server.js:', err);
      return res.status(404).json({ error: 'Arquivo JSON não encontrado no servidor' });
    }
    
    // Força o Chromium a nunca armazenar resposta antiga em cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(data);
  });
});

app.get('/api/dashboard', (req, res) => {
  res.redirect('/dados_painel.json');
});

// ==============================
// PÁGINA PRINCIPAL (Última Rota)
// ==============================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==============================
// INICIALIZAÇÃO
// ==============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});