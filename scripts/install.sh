#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

SYSTEMD_DIR=/lib/systemd/system/
APP_DIR=/opt/power-outage-checker
SERVICE_NAME=power-outage-checker.service

echo clearing app folder
rm -rf "${APP_DIR}"/*

echo copying files
mkdir -p "${APP_DIR}"
cp -rf . "${APP_DIR}"
cp .env "${APP_DIR}"
cp .nvmrc "${APP_DIR}"
sudo chmod -R 777 "${APP_DIR}"

echo npm installing
cd "${APP_DIR}"
/home/nathan/.nvm/nvm-exec npm i

echo installing systemd unit
mkdir -p $SYSTEMD_DIR
cp -f "${SERVICE_NAME}" $SYSTEMD_DIR
systemctl daemon-reload

echo enabling service
systemctl enable $SERVICE_NAME

echo restarting service
systemctl restart $SERVICE_NAME

echo setup done