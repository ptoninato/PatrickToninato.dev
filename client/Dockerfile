# # pull official base image
# FROM node:14.4

# # set working directory
# WORKDIR /usr/src/app

# # install app dependencies
# COPY package*.json ./

# RUN npm install

# # add app
# COPY . .

# # start app
# CMD ["npm", "start"]

FROM node:14.4
WORKDIR /app
ADD . /app
