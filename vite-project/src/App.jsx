import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
      console.log("Server URL:", socket.io.uri);
      console.log("Server Transport:", socket.io.engine.transport.name);
      console.log("Server Version:", socket.io.engine.protocol);
    });

    socket.on("uploadComplete", ({ fileName }) => {
      console.log("Upload Complete:", fileName);
      toast.success("File uploaded successfully");
      setUploadProgress(0);
    });

    return () => {
      socket.off("uploadComplete");
    };
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    // const socket = getSocket(); // Assuming getSocket() returns the socket instance

    const reader = new FileReader();

    reader.onload = function (e) {
      const data = e.target.result;
      const chunkSize = 1024 * 1024; // 1MB chunk size
      const totalChunks = Math.ceil(data.byteLength / chunkSize);
      let sentChunks = 0;

      const sendChunk = (chunkIndex) => {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, data.byteLength);
        const chunk = data.slice(start, end);
        console.log(chunk);
        const formData = new FormData();
        formData.append("file", chunk);

        // Convert FormData to a Blob or another serializable format
        const blob = new Blob([JSON.stringify([...formData])], {
          type: "application/json",
        });

        socket.emit("uploadChunk", {
          fileName: selectedFile.name,
          chunkIndex: chunkIndex,
          totalChunks: totalChunks,
          formData: blob,
        });

        sentChunks++;
        console.log("Sent chunk ", chunkIndex);
      };

      //   const sendChunksBatch = (startIndex, batchSize, delay) => {
      //     let currentChunkIndex = startIndex;
      //     const sendNextChunk = () => {
      //         if (currentChunkIndex < Math.min(startIndex + batchSize, totalChunks)) {
      //             sendChunk(currentChunkIndex);
      //             currentChunkIndex++;
      //             setTimeout(sendNextChunk, delay); // Schedule the next chunk after the delay
      //         }
      //     };
      //     sendNextChunk(); // Start sending chunks
      // };

      const sendChunksBatch = (startIndex, batchSize) => {
        for (
          let i = startIndex;
          i < Math.min(startIndex + batchSize, totalChunks);
          i++
        ) {
          sendChunk(i);
        }
      };

      const batchSize = 5; // Adjust batch size as needed
      let currentChunkIndex = 0;

      const uploadNextBatch = () => {
        sendChunksBatch(currentChunkIndex, batchSize);
        currentChunkIndex += batchSize;

        if (currentChunkIndex < totalChunks) {
          setTimeout(uploadNextBatch, 1000); // Adjust delay as needed
        } else {
          console.log("Upload complete");
        }
      };

      uploadNextBatch();
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // const handleUpload = () => {
  //   if (!selectedFile) {
  //     console.log("No file selected");
  //     return;
  //   }

  //   const reader = new FileReader();

  //   reader.onload = function (e) {
  //     const data = e.target.result;
  //     console.log(data);
  //     const chunkSize = 1024 * 1024; // 1MB chunk size
  //     const totalChunks = Math.ceil(data.byteLength / chunkSize);
  //     console.log(totalChunks);
  //     let sentChunks = 0;
  //     console.log("sentChunks : ", sentChunks);

  //     for (let i = 0; i < totalChunks; i++) {
  //       const start = i * chunkSize;

  //       const end = Math.min(start + chunkSize, data.byteLength);

  //       const chunk = data.slice(start, end);

  //       console.log("chunk : ", i, chunk);
  //       const formData = new FormData();
  //       formData.append("chunk", chunk);

  //       socket.emit("uploadChunk", {
  //         fileName: selectedFile.name,
  //         chunkIndex: i,
  //         totalChunks: totalChunks,
  //         formData,
  //       });

  //       sentChunks++;
  //       console.log("sentChunks : ", sentChunks);
  //     }
  //   };
  //   reader.readAsArrayBuffer(selectedFile);
  // };

  socket.on("clickmereturn", (msg) => {
    console.log(msg);
  });

  return (
    <div className="container mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold underline mb-4 text-center">
        File streaming !
      </h1>
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="border border-gray-300 py-2 px-4 rounded-lg w-64"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
        >
          Upload
        </button>
      </div>

      <button
        onClick={() => {
          console.log("Click me called");
          socket.emit("clickme", "clickme button called by the user");
        }}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
      >
        {" "}
        click me{" "}
      </button>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {uploadProgress > 0 && (
        <div className="mt-4 text-center">
          Uploading: {uploadProgress}%
          <div className="w-full bg-gray-200 mt-2">
            <div
              className="bg-blue-500 h-2"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
