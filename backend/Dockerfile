FROM node:22-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --chown=appuser:appgroup src/ ./src/
USER appuser
EXPOSE 3000
CMD ["node", "src/index.js"]
