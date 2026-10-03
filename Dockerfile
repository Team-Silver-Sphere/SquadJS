FROM node:18-slim

RUN yarn install

CMD [ "node", "index.js" ]
