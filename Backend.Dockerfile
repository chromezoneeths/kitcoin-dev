FROM node:lts
WORKDIR /app
EXPOSE 9876
CMD ["node", "./bin/www"]
COPY kitcoin/package*.json ./
RUN npm install --production
COPY ./kitcoin/bin/www ./bin/www
COPY ./kitcoin/clientJs ./clientJs
COPY ./dist-backend ./dist
