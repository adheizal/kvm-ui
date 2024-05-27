FROM node:18.22-buster-slim

RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install

RUN echo "#!/bin/bash" > run.sh
RUN echo "node index.js" >> run.sh
RUN chmod +x run.sh
CMD ./run.sh