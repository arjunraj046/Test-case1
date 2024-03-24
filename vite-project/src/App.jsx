import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log("No file selected");
      return;
    }

    const chunkSize = 1024 * 1024; // 1MB chunk size (adjust as needed)
    const chunks = Math.ceil(selectedFile.size / chunkSize);
    const formData = new FormData();

    for (let index = 0; index < chunks; index++) {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, selectedFile.size);
      const chunk = selectedFile.slice(start, end);

      formData.append("fileChunk", chunk, selectedFile.name + ".part" + index);
    }

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
        // Report upload progress
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });
      console.log("File uploaded successfully", response);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file", error);
      toast.error("Error uploading file");
    }
  };

  return (
    <div className="container mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold underline mb-4 text-center">Hello world!</h1>
      <div className="flex flex-col items-center space-y-4">
        <input type="file" onChange={handleFileChange} className="border border-gray-300 py-2 px-4 rounded-lg w-64" />
        <button onClick={handleUpload} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
          Upload
        </button>
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {uploadProgress > 0 && (
        <div className="mt-4 text-center">
          Uploading: {uploadProgress}%
          <div className="w-full bg-gray-200 mt-2">
            <div className="bg-blue-500 h-2" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
