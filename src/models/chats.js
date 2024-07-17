const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
