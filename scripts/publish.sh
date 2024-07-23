#!/bin/bash

pi=${1:-walnut}

echo "copying files to test machine (${pi})"
rsync -au * ${pi}:~/power-outage-checker
rsync .env ${pi}:~/power-outage-checker
rsync .nvmrc ${pi}:~/power-outage-checker