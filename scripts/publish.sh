#!/bin/bash

pi=${1:-walnut} # locust

echo "copying files to test machine (${pi})"
rsync -au * ${pi}:~/power-outage-checker
rsync .env ${pi}:~/power-outage-checker
rsync .nvmrc ${pi}:~/power-outage-checker

# echo running install script
# ssh ${pi} << EOF
#   cd power-outage-checker
#   ./scripts/install.sh
# EOF