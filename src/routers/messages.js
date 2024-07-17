const express = require("express");
const router = express.Router();
const userAuth = require("../middelware/userAuth");
const messages = require("../controllers/messages");

router.get("/messages/:id", userAuth, messages.getMessages);
router.patch("/seen/:id", userAuth, messages.updateSeen);
router.get("/lastMessages", userAuth, messages.getLastMessages);

module.exports = router;
