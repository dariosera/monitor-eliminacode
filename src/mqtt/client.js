import mqtt from 'mqtt'
const client = mqtt.connect('wss://f3e281e2eacc419590073eb780e56ee0.s1.eu.hivemq.cloud:8884/mqtt', {
   // log: console.log.bind(console),
    username : 'TestMQTT',
    password: 'TestMQTT.1',
    keepalive: 30,
  });

client.pub = function(t,m) {
  client.publish(t, JSON.stringify(m))
}

export default client;