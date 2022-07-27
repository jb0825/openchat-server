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

wsServer.on("connection", (socket) => {
  const address = socket.conn.remoteAddress;
  console.log("Connect to browser: " + address);
  socket.username = address;

  const getUserCount = (roomname) => {
    let count;
    try {
      count = socket.adapter.rooms.get(roomname).size;
    } catch (error) {
      count = 0;
    }

    return count;
  };

  socket.on("disconnect", () => {
    console.log("Disconnect from browser: " + address);
  });

  socket.on("icecandidate", (icecandidate, roomname) => {
    socket.to(roomname).emit("icecandidate", icecandidate);
  });

  socket.on("offer", (offer, roomname) => {
    console.log("receive offer, send to remote");
    socket.to(roomname).emit("offer", offer);
  });

  socket.on("answer", (answer, roomname) => {
    console.log("receive answer, send to local");
    socket.to(roomname).emit("answer", answer);
  });

  socket.on("username", (username) => {
    socket.username = username;
    console.log("username: " + socket.username);
  });

  socket.on("create-room", (roomname, description, createDate) => {
    socket.join(roomname);
    rooms.set(roomname, { description, createDate });
    console.log(`✔ ${socket.username}: create room ${roomname}`);
    socket.broadcast.emit("rooms", Object.fromEntries(rooms));
  });

  socket.on("join-room", (roomname) => {
    console.log("join-room: " + socket.username);
    socket.join(roomname);
    socket.to(roomname).emit("welcome", socket.username, getUserCount(roomname));
  });

  socket.on("rooms", () => {
    console.log("emit room");
    // map 을 넘기면 빈 오브젝트로 넘어가서 변환해줘야함
    socket.emit("rooms", Object.fromEntries(rooms));
  });

  socket.on("user-count", (roomname) => {
    socket.emit("user-count", getUserCount(roomname));
  });
});

httpServer.listen(3001, handleListen);
