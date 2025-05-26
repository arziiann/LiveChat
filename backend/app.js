import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "../backend/router/authRoutes.js";
import { Server } from "socket.io";
import http from "http";
import Message from "./dataBase/message.js";
import User from "./dataBase/users.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirName = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use(express.static(path.join(__dirName, "../frontend")));
app.use("/uploads", express.static(path.join(__dirName, "../uploads")));
app.use(express.json());
app.use(cookieParser("unique_cookie_secret"));
app.use(express.urlencoded({ extended: true }));
app.use("/", router);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  // console.log("New socket connected:", socket.id);
  socket.on("mark-messages-read", async ({ from, to }) => {
    try {
      if (!from || !to) return;

      const [updatedCount] = await Message.update(
        { read: true },
        {
          where: { from, to, read: false },
        }
      );

      await updateUnreadCounts(io, to);
    } catch (err) {
      console.error("Error marking messages read:", err);
    }
  });

  socket.on("user-online", async (userId) => {
    const userIdStr = userId.toString();
    onlineUsers.set(userIdStr, socket.id);

    const pendingMessages = await Message.findAll({
      where: { to: userId, delivered: false },
    });
    for (const msg of pendingMessages) {
      const sender = await User.findByPk(msg.from);
      if (!sender) {
        // console.error(`Sender with ID ${msg.from} not found`);
        continue;
      }

      socket.emit("new-message", {
        text: msg.text,
        from: msg.from,
        senderName: `${sender.firstName} ${sender.lastName}`,
      });
      msg.delivered = true;
      await msg.save();
    }
    updateUnreadCounts(io, userId);
  });

  socket.on("send-message", async ({ from, to, text }) => {
    // console.log("New message from:", from, "to:", to, "text:", text);
    const receiverSocketId = onlineUsers.get(to.toString());
    const message = await Message.create({
      from,
      to,
      text,
      delivered: false,
      read: false,
    });

    const senderUser = await User.findByPk(from);
    const senderName = senderUser
      ? `${senderUser.firstName} ${senderUser.lastName}`
      : "Unknown";

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new-message", {
        text,
        from,
        senderName,
      });
      message.delivered = true;
      await message.save();
      await updateUnreadCounts(io, to); 
      const unreadCount = await Message.count({
        where: { to, read: false },
      });
      io.to(receiverSocketId).emit("unread-count", {
        userId: to,
        count: unreadCount,
      });
    } else {
      // console.log("Receiver offline, message saved to DB");
      await updateUnreadCounts(io, to);
    }
  });

  socket.on("get-unread-count", async ({ from, to }) => {
    try {
      const count = await Message.count({
        where: { from, to, read: false },
      });
      socket.emit("unread-count", { userId: from, count });
    } catch (err) {
      // console.error("Error getting unread count:", err);
    }
  });

  socket.on("unread-count", ({ userId, count }) => {
    const userDiv = document.querySelector(`.user[data-id="${userId}"]`);
    if (!userDiv) return;
  
    let badge = userDiv.querySelector(".unread-count");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "unread-count";
        userDiv.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  });
  

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
      }
    }
    // console.log("User disconnected");
  });
});

async function updateUnreadCounts(io, currentUserId) {
  const users = await User.findAll({ attributes: ["id"] });
  for (const user of users) {
    if (user.id !== currentUserId) {
      const count = await Message.count({
        where: { from: user.id, to: currentUserId, read: false },
      });
      const socketId = onlineUsers.get(currentUserId.toString());
      if (socketId) {
        io.to(socketId).emit("unread-count", { userId: user.id, count });
      }
    }
  }
}



async function deleteAllUsers() {
  try {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    // console.log("All users deleted successfully!");
  } catch (err) {
    // console.error("Failed to delete users:", err);
  }
}

// deleteAllUsers();

server.listen(3001, () => {
  // console.log("Server is running on http://localhost:3001");
});
