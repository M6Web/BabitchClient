#!/bin/bash

# Exit on first error
set -e

# Kill background processes on exit
trap 'kill $(jobs -p)' SIGINT SIGTERM EXIT

# Start docker daemon
docker -d &
sleep 1

echo $1
ls -l $1

# Use docker
docker build -t babitch_client_travis $1
docker run --privileged -it --rm babitch_client_travis test