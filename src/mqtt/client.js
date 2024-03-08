import mqtt from 'mqtt'
const client = mqtt.connect(import.meta.env.VITE_MQTT_WSS, {
    username : import.meta.env.VITE_MQTT_USER,
    password: import.meta.env.VITE_MQTT_PASS,
    keepalive: 30,
  });


// const client = mqtt.connect("wss://f3e281e2eacc419590073eb780e56ee0.s1.eu.hivemq.cloud:8884/mqtt", {
//   // log: console.log.bind(console),
//    username : "poirinoecprod",
//    password: "ki;~UPi2Ze8vi5$3",
//    keepalive: 30,
//  });

client.pub = function(t,m) {
  client.publish(t, JSON.stringify(m))
}

export default client;