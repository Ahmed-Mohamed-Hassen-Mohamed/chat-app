const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: { origin: "*" },
});

require("dotenv").config();
const port = process.env.PORT;
require("./db/mongoose");
app.use(express.json());
app.use(cors());
app.use(helmet());

const { socketEvents } = require("./socket");
socketEvents(io);

const {sharedSocket} = require("./controllers/messages");
sharedSocket(io);

const usersRouter = require("./routers/users");
const chatsRouter = require("./routers/chats");
const messagesRouter = require("./routers/messages");

app.use(usersRouter);
app.use(chatsRouter);
app.use(messagesRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.all("*", (req, res, next) => {
  next(new Error(`Con't find this route: ${req.originalUrl}`));
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));
