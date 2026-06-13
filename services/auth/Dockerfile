FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript tsx && npx tsc
EXPOSE 3002
CMD ["node", "dist/index.js"]
