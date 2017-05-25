default: build-docker

build-docker:
	docker build -t hyperpilot/benchmark-controller .

docker-push:
	docker push hyperpilot/benchmark-controller
