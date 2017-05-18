default: build-docker

build-docker:
	sudo docker build -t hyperpilot/benchmark-controller .

docker-push:
	sudo docker push hyperpilot/benchmark-controller
