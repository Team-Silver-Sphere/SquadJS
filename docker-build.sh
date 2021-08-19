docker-compose down
docker build . -t squadjs
docker-compose up -d
docker image prune -f