import http from "http";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

const httpServer = http.createServer(app);
const wsServer = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const handleListen = () => console.log("Listening on http://localhost:3001");

let rooms = [];
let users = [];

wsServer.on("connection", (socket) => {
  console.log("Connect to browser: " + socket.conn.remoteAddress);
  console.log(socket.adapter.rooms);
  console.log(socket.adapter.sids);

  socket.on("username", (username) => {
    socket.username = username;
    console.log("username: " + socket.username);
  });

  socket.on("create_room", (roomname) => {
    rooms = socket.adapter.rooms;
    console.log("rooms: " + rooms);

    socket.join(roomname);
    socket.to(roomname).emit("created", rooms);
  });
});

httpServer.listen(3001, handleListen);
