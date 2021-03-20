const WebSocket = require('ws');
const express = require("express"),
  http = require("http"),
  app = express(),
  server = http.createServer(app);
server.listen(8000);

const ws = new WebSocket.Server({ server, path: "/ws" });

ws.on('open', function open() {
  console.log('connected');
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('connection', function connection(client, req) {
  // const ip = req.connection.remoteAddress;
  const port = req.connection.remotePort;
  const clientName = port;

  console.log('%s is connected', clientName)

  // 发送欢迎信息给客户端
  sendMessage({ type: "connect", data: { clientName: clientName } }, client);

  client.on('message', function incoming(message) {
    console.log('received: %s from %s', message, clientName);

    // 广播消息给其他所有客户端
    ws.clients.forEach(function each(item) {
      if (item.readyState === WebSocket.OPEN && item !== client) {
        item.send(message);
      }
    });

  });

});
function sendMessage(data, client) {
  client.send(JSON.stringify(data))
}