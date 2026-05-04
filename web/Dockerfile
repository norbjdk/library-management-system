FROM node:22-bookworm-slim

WORKDIR /workspace/web

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
