FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY proxy.mjs .
CMD ["node", "proxy.mjs"]
