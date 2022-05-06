#!/bin/bash

cd ./docker/compose
if [ $# -eq 0 ]; then
    echo "Args are required."
else
    docker-compose -f docker-compose.prod.yml $@
fi
exit 0