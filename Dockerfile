FROM node:10-stretch AS assets

WORKDIR /usr/src/nutv

COPY . /usr/src/nutv
RUN npm install --only=production --quiet

FROM node:10-alpine

VOLUME /media
VOLUME /downloads

RUN apk --no-cache add ffmpeg 

WORKDIR /usr/src/nutv
COPY --from=assets /usr/src/nutv/ /usr/src/nutv/

EXPOSE 3001
CMD ["npm","start"]



