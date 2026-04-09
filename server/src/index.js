require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/report");
const { socketAuth } = require("./middleware/socketAuth");
const chatHandler = require("./socket/chatHandler");

const app = express();
app.set("trust proxy", 1);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

app.get("/api/online", (_req, res) => res.json({ count: io.of("/").sockets.size }));

io.use(socketAuth);
chatHandler.register(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`bitsTV server listening on :${PORT}`);
});
