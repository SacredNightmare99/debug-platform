FROM node:20-alpine
WORKDIR /app
USER node
CMD ["node", "main.js"]

