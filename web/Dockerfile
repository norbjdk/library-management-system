FROM node:22-bookworm-slim

WORKDIR /workspace/web

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "run", "start:docker"]
