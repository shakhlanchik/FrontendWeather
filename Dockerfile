FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY .env ./
RUN npm install --frozen-lockfile --production=false

COPY . .

ENV SKIP_PREFLIGHT_CHECK=true

RUN npm run build

FROM nginx:alpine

ENV REACT_APP_BACKEND_URL=http://backend:8080

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]