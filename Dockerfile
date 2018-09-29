FROM node:10

WORKDIR /usr/src/nutv

COPY package*.json /usr/src/nutv

RUN npm install --only=production

COPY . /usr/src/nutv

EXPOSE 3001
CMD [ "npm", "start" ]