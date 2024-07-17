const Chat = require("./models/chats");
const Message = require("./models/messages");
const jwt = require("jsonwebtoken");
const redisClient = require("./db/redis");

exports.socketEvents = (io) => {
  io.on("connection", async (socket) => {
    const token = socket.handshake.query.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded) {
          socket.userId = decoded._id;
          await redisClient.hSet(decoded._id, "socketId", socket.id);
          console.log("A user connected");
        }
      } catch (err) {
        console.error("Token verification failed:", err.message);
      }
    } else {
      console.error("Token is missing");
    }
    socket.on("authenticated", (data) => authenticated(data, socket));

    // Listen for chat events
    socket.on("chat", (data) => handleChat(data, io));

    // Listen for message events
    socket.on("message", (data) => handleMessage(data, io));

    socket.on("disconnect", () => removeSocket(socket));
  });
};

async function removeSocket(socket) {
  try {
    // const socketId = socket.id;
    // await Socket.findOneAndDelete({ socketId });
    // console.log("User disconnected");
  } catch (err) {
    console.error(err.message);
  }
}

async function authenticated(data, socket) {
  try {
    const decoded = jwt.verify(data.token, process.env.SECRET_KEY);
    if (decoded) {
      socket.userId = decoded._id;
      await redisClient.hSet(decoded._id, "socketId", socket.id);
    }
  } catch (err) {
    console.error(err.message);
  }
}

async function handleChat(chatData, io) {
  try {
    const chat = new Chat(chatData);
    await chat.save();
    await chat.populate("user1Id user2Id");
    const recipient = chatData.user2Id;
    const recipientSocket = await redisClient.hGetAll(recipient);
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("chat", chat);
    }
  } catch (error) {
    console.error("Error handling chat event:", error);
  }
}

async function handleMessage(messageData, io) {
  try {
    const message = new Message(messageData);
    await message.save();
    let messagesNumber = await Message.countDocuments({
      chatId: message.chatId,
      receiverId: message.receiverId,
      isRead: false,
    });
    let populatedMessage = await Message.populate(message, {
      path: "senderId receiverId replyToId",
    });
    const recipientSocket = await redisClient.hGetAll(messageData.receiverId);
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("message", {
        ...populatedMessage._doc,
        messagesNumber,
      });
    }
  } catch (error) {
    console.error("Error handling message event:", error);
  }
}

exports.handleSeen = async (data, io) => {
  try {
    const recipientSocket = await redisClient.hGetAll(String(data.senderId));
    const _data = {
      chatId: data.chatId,
    };
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("seen", _data );
    }
  } catch (error) {
    console.error("Error handling seen event:", error);
  }
};
