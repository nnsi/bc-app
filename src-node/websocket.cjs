const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 2356 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:2356");
