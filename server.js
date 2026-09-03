require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3000;

const publicPath = path.resolve(__dirname, 'app', 'public');

// 1. Servir arquivos estáticos FIRST (css, js, imagens, json)

app.use(express.static(publicPath));

app.use('/js', express.static(path.join(publicPath, 'js')));

// 2. Rota explícita para o JSON

app.get('/dados_painel.json', (req, res) => {

  const jsonFilePath = path.join(publicPath, 'dados_painel.json');

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {

    if (err) {

      console.error('Erro de leitura do JSON:', err);

      return res.status(404).json({
        error: 'Arquivo JSON não encontrado'
      });

    }

    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );

    res.setHeader(
      'Content-Type',
      'application/json; charset=utf-8'
    );

    res.status(200).send(data);

  });

});

// 3. Fallback apenas para rotas desconhecidas (HTML)

app.get('*', (req, res) => {

  res.sendFile(path.join(publicPath, 'index.html'));

});

app.listen(PORT, '0.0.0.0', () => {

  console.log(`Servidor rodando na porta ${PORT}`);

});