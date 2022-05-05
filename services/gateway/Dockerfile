FROM node:16-alpine
WORKDIR /opt/build/services/gateway

RUN apk add --update \
	&& apk add --no-cache ca-certificates \
	&& apk add --no-cache --virtual .build-deps curl bash jq \
	&& curl -L https://yarnpkg.com/install.sh | bash

COPY ./services/gateway/package.json ./
RUN yarn install

COPY ./services/gateway/prisma/. ./prisma/
RUN yarn generate

COPY ./services/gateway/tsconfig.json ./services/gateway/nodemon.json ./
COPY ./services/gateway/src/. ./src/
RUN yarn build

FROM node:16-alpine
WORKDIR /usr/app

COPY --from=0 ./opt/build/services/gateway/. ./

WORKDIR /usr/app/services/gateway
CMD ["yarn", "run", "start"]