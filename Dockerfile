FROM node:12-alpine
WORKDIR /usr/src/app
COPY . .
RUN yarn install
RUN yarn build
EXPOSE 8080
CMD ["yarn", "run", "start:prod"]
