const Message = require("../models/messages");
const { handleSeen } = require("../socket");

// Example controller functions

let IO;
exports.sharedSocket = (io) => {
  IO = io;
};

exports.getMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const message = await Message.findOne({ chatId }).sort({ _id: -1 });
    if (String(req.user._id) == String(message.receiverId)) {
      const _messages = await Message.updateMany({ chatId }, { isRead: true });
    }
    const messages = await Message.find({ chatId }).populate(
      "senderId receiverId replyToId"
    );
    if (!messages.length) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "Not messages is found" });
    }
    if (
      String(req.user._id) ==
      String(messages[messages.length - 1].receiverId._id)
    ) {
      handleSeen(
        {
          senderId: messages[messages.length - 1].senderId._id,
          chatId,
        },
        IO
      );
    }
    res.status(200).send(messages);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getLastMessages = async (req, res) => {
  try {
    let chats = [];
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $group: {
          _id: "$chatId",
          message: { $first: "$$ROOT" }, // Select the first message in each group (oldest message)
        },
      },
      {
        $replaceRoot: { newRoot: "$message" }, // Replace the root with the selected message
      },
    ]).sort({ _id: -1 });
    const populatedMessages = await await Message.populate(messages, {
      path: "senderId receiverId",
    });

    for (let message of populatedMessages) {
      let messagesNumber = await Message.countDocuments({
        chatId: message.chatId,
        receiverId: req.user._id,
        isRead: false,
      });
      chats.push({
        ...message,
        messagesNumber,
      });
    }
    res.status(200).send(chats);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.updateSeen = async (req, res) => {
  try {
    const chatId = req.params.id;
    const messages = await Message.updateMany({ chatId }, { isRead: true });
    const message = await Message.findOne({ chatId }).sort({ _id: -1 });
    if (String(req.user._id) == String(message.receiverId._id)) {
      handleSeen(
        {
          senderId: message.senderId._id,
          chatId,
        },
        IO
      );
    }
    res.status(200).send({ message: "ok" });
  } catch (err) {
    res.status(500).send(err);
  }
};
