#!/bin/sh

echo "Build base image"

docker build -t wen777/bench:base .

echo "Build base image with Open JDK 8"

docker build -f Dockerfile_openjdk_8 -t wen777/bench:base-openjdk-8 .

echo
echo "Push images to docker hub"
echo

docker push wen777/bench:base

docker push wen777/bench:base-openjdk-8


