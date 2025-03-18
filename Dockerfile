FROM node:22.14.0-alpine

RUN mkdir /draco

COPY draco-point-cloud-server.zip /draco/draco-point-cloud-server.zip
WORKDIR /draco

RUN unzip draco-point-cloud-server.zip && rm draco-point-cloud-server.zip
RUN mv draco-point-cloud-server server

WORKDIR /draco/server
RUN npm i

ENV PORT=8000
CMD ["node", "./bin/www"]