FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY index.js ./
RUN apk add --no-cache iproute2
USER root
CMD ["node","index.js"]
