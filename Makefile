default: build-docker
tag=latest

build-docker:
	docker build -t hyperpilot/benchmark-controller:$(tag) .

docker-push:
	docker push hyperpilot/benchmark-controller:$(tag)

dev-build-docker:
	docker build -t hyperpilot/benchmark-controller:dev .

dev-docker-push:
	docker push hyperpilot/benchmark-controller:dev
