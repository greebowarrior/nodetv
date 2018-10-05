FROM node:10-stretch

RUN apt-get update && apt-get install ffmpeg -y && apt-get autoclean

VOLUME /media
VOLUME /downloads

WORKDIR /usr/src/nutv

COPY package*.json /usr/src/nutv/

RUN npm install --only=production

COPY . /usr/src/nutv

EXPOSE 3001
CMD [ "npm", "start" ]