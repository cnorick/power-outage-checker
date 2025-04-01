import "dotenv/config";
import mqtt from "mqtt";
import getMac from "getmac";
import os from 'os';

const mqtt_username = process.env.MQTT_USERNAME;
const mqtt_password = process.env.MQTT_PASSWORD;
const mqttBrokerAddress = process.env.MQTT_BROKER_ADDRESS;

const homeassistantPrefix = "homeassistant";
const homeassistantStatusTopic = `${homeassistantPrefix}/status`;
const deviceId = `power-outage-checker-${getMac().replaceAll(':', '')}`;
const component = 'binary_sensor';
const sensorTopicPrefix = `${homeassistantPrefix}/${component}/${deviceId}`;
const sensorConfigTopic = `${sensorTopicPrefix}/config`;
const sensorStateTopic = `${sensorTopicPrefix}/state`;
const availabilityTopic = `${sensorTopicPrefix}/availability`;
const hostname = os.hostname() || getMac();

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// See https://www.home-assistant.io/integrations/mqtt
async function sendDiscoveryMessage() {
  console.log("sending discovery messages");

  await mqttClient.publishAsync(
    sensorConfigTopic,
    JSON.stringify(
      {
        state_topic: sensorStateTopic,
        availability_topic: availabilityTopic,
        unique_id: `${deviceId}-online-status`,
        name: "Online Status",
        device: {
          identifiers: [`${deviceId}-online-status`],
          name: `Power Outage Checker - ${hostname}`,
          manufacturer: "Nathan Orick",
          model: "Power Outage Checker",
        },
      },
      {
        retain: true
      }
    )
  );
}

async function sendBirthMessage() {
  console.log("sending birth message");
  await mqttClient.publishAsync(availabilityTopic, "online", {
    retain: true
  });
}

async function sendSensorStatus() {
  console.log('sending online status')
  await mqttClient.publishAsync(sensorStateTopic, "ON", {
    retain: true
  });
}

const mqttClient = mqtt.connect(mqttBrokerAddress, {
  username: mqtt_username,
  password: mqtt_password,
  will: {
    topic: availabilityTopic,
    payload: "offline",
    retain: true
  },
});

mqttClient.on("error", (e) => {
  console.log("error", e);
});

mqttClient.on("message", async (topic, message) => {
  console.log("received message:", topic, message.toString());
  if (topic === homeassistantStatusTopic) {
    if (message.toString() === "online") {
      await delay(Math.floor(Math.random() * 5_000));
      console.log("home assistant online");
      await sendDiscoveryMessage();
      await sendBirthMessage();
      await sendSensorStatus();
    }
    if (message.toString() === 'offline') {
      console.log('home assistant offline')
    }
  }
});

mqttClient.on("connect", async () => {
  console.log("connected");
  mqttClient.subscribe(homeassistantStatusTopic);
});
