FROM node:20-alpine

WORKDIR /usr/src/app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala apenas as dependências de produção
RUN npm install --omit=dev

# Copia todo o projeto para o container
COPY . .

# Garante a exposição da porta 3000
EXPOSE 3000

# Executa o servidor Node diretamente (Melhor para o Balena/Docker)
CMD ["node", "server.js"]