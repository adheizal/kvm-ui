FROM node:22-buster-slim

WORKDIR /app
COPY . .
RUN npm install

RUN echo "#!/bin/bash" > run.sh
RUN echo "node index.js" >> run.sh
RUN chmod +x run.sh
CMD ./run.sh