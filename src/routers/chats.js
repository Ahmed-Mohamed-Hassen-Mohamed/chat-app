const express = require("express");
const router = express.Router();
const userAuth = require("../middelware/userAuth");
const chats = require("../controllers/chats");

router.get("/chats", userAuth, chats.getChats);
router.get("/chats/:id", userAuth, chats.getChatById);

module.exports = router;
