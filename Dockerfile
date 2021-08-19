FROM node:lts-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install
CMD "node" "server-wrapper.js" "server-config.json"