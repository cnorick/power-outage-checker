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

// See https://www.home-assistant.io/integrations/mqtt
function sendDiscoveryMessages() {
  console.log("sending discovery messages");

  mqttClient.publish(
    sensorConfigTopic,
    JSON.stringify({
      state_topic: sensorStateTopic,
      availability_topic: availabilityTopic,
      unique_id: `${deviceId}-status`,
      name: "Online Status",
      device: {
        identifiers: [deviceId],
        name: `Power Outage Checker - ${hostname}`,
        manufacturer: "Nathan Orick",
      },
    })
  );
}

function sendBirthMessage() {
  console.log("sending birth message");
  mqttClient.publish(availabilityTopic, "online");
}

const mqttClient = mqtt.connect(mqttBrokerAddress, {
  username: mqtt_username,
  password: mqtt_password,
  will: {
    topic: availabilityTopic,
    payload: "offline",
  },
});

mqttClient.subscribe(homeassistantStatusTopic);

mqttClient.on("error", (e) => {
  console.log("error", e);
});

mqttClient.on("message", (topic, message) => {
  console.log("received message:", topic, message.toString());
  if (topic === homeassistantStatusTopic) {
    if (message.toString() === "online") {
      console.log("home assistant online");
      sendDiscoveryMessages();
      sendOnlineStatus();
    }
  }
});

async function sendOnlineStatus() {
  console.log('sending onine status')
  await mqttClient.publishAsync(sensorStateTopic, 'ON');
}

mqttClient.on("connect", async () => {
  console.log("connected");
  sendBirthMessage();
  sendDiscoveryMessages();
  await sendOnlineStatus();
});
