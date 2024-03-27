const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173"],
    // Adjust origin based on your client URL
  },
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Initialize Multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const upload = multer({ storage: storage }).single("file");

app.use(cors());

io.on("connection", (socket) => {
  console.log("A client connected socket id is ", socket.id);

  io.emit("userConnected", socket.id);

  socket.on("clickme", (message) => {
    console.log("Received message:", message);
    socket.emit("clickmereturn", message);
  });

  socket.on("uploadChunk", ({ fileName, chunkIndex, totalChunks }) => {

    console.log("uploadChunk catch the data ");
    
    console.log("Data :", fileName, chunkIndex, totalChunks);

    const filePath = path.join(uploadDir, fileName + ".part" + chunkIndex);

    fs.appendFile(filePath, chunk, (err) => {
      if (err) {
        console.error("Error writing file chunk:", err);
        socket.emit("uploadChunkError", { chunkIndex });
      } else {
        console.log(
          `Chunk ${chunkIndex + 1}/${totalChunks} received and saved`
        );
        socket.emit("uploadChunkSuccess", { chunkIndex });
      }
    });
  });

  socket.on("disconnect", () => {
    // Handle disconnection logic
    console.log("Disconnected from server");
  });

  socket.on("uploadComplete", ({ fileName }) => {
    const fileParts = [];
    for (let i = 0; i < totalChunks; i++) {
      fileParts.push(
        fs.readFileSync(path.join(uploadDir, fileName + ".part" + i))
      );
    }
    const finalFilePath = path.join(uploadDir, fileName);
    fs.writeFileSync(finalFilePath, Buffer.concat(fileParts));
    console.log("File reconstructed successfully");
    io.emit("uploadComplete", { fileName });
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
