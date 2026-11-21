
FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/render.js"]

