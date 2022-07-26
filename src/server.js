import http from "http";
import express from "express";
import cors from "cors";
import { emit } from "process";

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

let rooms = new Map();
let users = [];

wsServer.on("connection", (socket) => {
  const address = socket.conn.remoteAddress;
  console.log("Connect to browser: " + address);
  socket.username = address;

  socket.on("disconnect", () => {
    console.log("Disconnect from browser: " + address);
  });

  socket.on("username", (username) => {
    socket.username = username;
    console.log("username: " + socket.username);
  });

  socket.on("create-room", (roomname, description) => {
    socket.join(roomname);
    rooms.set(roomname, description);
    console.log(`✔ ${socket.username}: create room ${roomname}`);
    socket.broadcast.emit("rooms", Object.fromEntries(rooms));
  });

  socket.on("rooms", () => {
    console.log("emit room");

    // map 을 넘기면 빈 오브젝트로 넘어가서 변환해줘야함
    socket.emit("rooms", Object.fromEntries(rooms));
  });
});

httpServer.listen(3001, handleListen);
