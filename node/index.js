const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// Define the directory to save uploaded file chunks
const uploadDir = path.join(__dirname, "uploads");

// Middleware to create the upload directory if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware to handle CORS
app.use(cors());

// Middleware to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle file chunk uploads
app.post("/upload", upload.array("fileChunk"), (req, res) => {
  const fileChunks = req.files;
  const fileName = req.files[0].originalname;

  const filePath = path.join(uploadDir, fileName);

  const writeStream = fs.createWriteStream(filePath, { flags: "a" }); // 'a' flag for append mode

  fileChunks.forEach((chunk) => {
    writeStream.write(chunk.buffer);
  });

  writeStream.end();

  writeStream.on("finish", () => {
    console.log("finish");
    res.json({ message: "File chunks uploaded successfully" });
  });

  writeStream.on("error", (err) => {
    console.error("Error writing file chunk:", err);
    res.status(500).json({ error: "Error uploading file chunks" });
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
