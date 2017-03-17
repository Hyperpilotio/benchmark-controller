#!/bin/sh

echo "Build base image"

docker build -t hyperpilot/bench:base .

echo "Build base image with Open JDK 8"

docker build -f Dockerfile_openjdk_8 -t hyperpilot/bench:base-openjdk-8 .

echo "Build base image with mysql-tpcc"

docker build -f Dockerfile_mysql_tpcc -t hyperpilot/bench:base-mysql-tpcc .

echo
echo "Push images to docker hub"
echo

docker push hyperpilot/bench:base

docker push hyperpilot/bench:base-openjdk-8

docker push hyperpilot/bench:base-mysql-tpcc
