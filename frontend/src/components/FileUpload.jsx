import React, { useState } from "react";
import api from "../services/api";
import { toast } from 'react-hot-toast';
import "../App.css";

function FileUpload({ onUploadSuccess, currentFolderId }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFiles = (incomingFiles) => {
    const newFiles = Array.from(incomingFiles);
    let validationError = "";

    const validatedFiles = newFiles.filter((file) => {
      if (file.size > 50 * 1024 * 1024) {
        validationError = `Error: ${file.name} is too large (max 50MB).`;
        return false;
      }
      return true;
    });

    if (validationError) {
      setError(validationError);
      setFiles([]);
    } else {
      setFiles(validatedFiles);
      setError("");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) handleFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select one or more files first.");
      return;
    }
    setUploading(true);
    setError("");
    setUploadProgress({});

    const uploadPromises = files.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      if (currentFolderId) formData.append("folder", currentFolderId);

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
        },
      };

      return api.post("/api/files/", formData, config);
    });

    try {
      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded successfully!`);
      onUploadSuccess();
      setFiles([]);
      setUploadProgress({});
    } catch (err) {
      console.error("Upload error details:", err); // Console mein error dekhein

      // 1. Agar Duplicate File hai (Status 409)
      if (err.response && err.response.status === 409) {
          const msg = "⚠️ Duplicate File! A file with this name already exists.";
          setError(msg);
          toast.error(msg);
      } 
      // 2. Agar Backend se koi specific message aaya hai (jaise Storage Full)
      else if (err.response && err.response.data && err.response.data.detail) {
           const msg = `Error: ${err.response.data.detail}`;
           setError(msg);
           toast.error(msg);
      }
      // 3. Generic Error
      else {
          const msg = "An error occurred during upload.";
          setError(msg);
          toast.error(msg);
      }
      // -------------------------------
      
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileName) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <div
      className={`action-box file-upload ${isDragging ? "dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3>Upload Files</h3>
      <p style={{ fontSize: "0.9rem", color: "#555", margin: "-5px 0 10px 0" }}>
        Drag & Drop files here or
      </p>

      <div className="file-upload-area">
        <input
          type="file"
          id="file-input"
          onChange={handleFileChange}
          style={{ display: "none" }}
          multiple
        />
        <label htmlFor="file-input" className="file-upload-label">
          Choose Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="file-list-preview">
          {files.map((f) => (
            <div key={f.name} className="file-preview-item">
              <span className="file-name-display">
                {f.name} ({(f.size / 1024).toFixed(1)} KB)
              </span>
              {uploading && (
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress[f.name] || 0}%` }}
                  ></div>
                </div>
              )}
              {!uploading && (
                <button onClick={() => handleRemoveFile(f.name)} className="remove-file-btn">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="auth-button"
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
      >
        {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default FileUpload;
