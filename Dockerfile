FROM node:25-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN mkdir -p /app/backend/data && chown -R node:node /app/backend/data
USER node
EXPOSE 3000
CMD ["npm","start"]
