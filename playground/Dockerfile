FROM gliderlabs/alpine-node:base
RUN apk add --no-cache mysql-client

WORKDIR /app
ADD . .
EXPOSE 3000
CMD ["npm", "start"]
