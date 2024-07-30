const Chat = require("../models/chats");
const Message = require("../models/messages");
const ApiError = require("../utils/ApiError");

// Example controller functions

exports.getChats = async (req, res, next) => {
  try {
    // let chats = [];
    const chats = await Chat.find({
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }],
    })
      .populate("user1Id")
      .populate("user2Id")
      .sort({ _id: -1 });
    res.status(200).send(chats);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.getChatById = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const chat = await Chat.findById(_id)
      .populate("user1Id")
      .populate("user2Id");
    res.status(200).send(chat);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};
