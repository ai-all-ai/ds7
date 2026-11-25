# Multi-stage production container for a DS7 static build.
# Only `nuxt generate` is accepted: if it fails, the image build fails, so a site without pages is never shipped.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run generate && test -f .output/public/index.html

FROM nginx:alpine AS runner
COPY ds7/templates/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/.output/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
