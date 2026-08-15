import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import config from "./config";
import cron from "node-cron";
import { initFirebase } from "./lib/firebase";

const port = config.port || 6007;

export let io: SocketIOServer;

async function main() {
  initFirebase();

  const server: Server = app.listen(port, () => {
    console.log("Server is running on port", port);
  });

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Optional: User can join a room with their userId to receive personal notifications
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}

main();
