default: build-docker

build-docker:
	docker build -e "NODE_ENV=production" -t hyperpilot/benchmark-controller .

docker-push:
	docker push hyperpilot/benchmark-controller
