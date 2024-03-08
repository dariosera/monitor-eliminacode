import mqtt from 'mqtt'
const client = mqtt.connect(import.meta.env.VITE_MQTT_WSS, {
   // log: console.log.bind(console),
    username : import.meta.env.VITE_MQTT_USER,
    password: import.meta.env.VITE_MQTT_PASS,
    keepalive: 30,
  });

client.pub = function(t,m) {
  client.publish(t, JSON.stringify(m))
}

export default client;