// frontend/src/components/PublicSharePage.jsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getFileIcon } from "./FileItem"; 
import { FaDownload, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "../App.css"; 

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function PublicSharePage() {
  const { token } = useParams(); 
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchFileInfo = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/api/shared/${token}/`);
        setFileInfo(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("This link is invalid or has expired.");
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFileInfo();
  }, [token]);

  const handleDownload = async (e) => {
    e.preventDefault();
    setIsDownloading(true);
    setError("");

    try {
      const response = await api.post(
        `/api/shared/${token}/`,
        { password: password || null }, 
        { responseType: 'blob' } 
      );

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo.filename; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Password required. Please enter the password.");
      } else if (err.response && err.response.status === 403) {
        setError("Invalid password. Please try again.");
      } else {
        setError("Failed to download file. The link may be broken.");
      }
    } finally {
      setIsDownloading(false);
    }
  };


  const renderContent = () => {
    if (loading) {
      return <p>Loading file information...</p>;
    }
    if (error && !fileInfo) {
      return <p className="error-message">{error}</p>;
    }
    if (!fileInfo) {
      return <p>Could not load file details.</p>;
    }

    return (
      <form className="auth-box" onSubmit={handleDownload}>
        <div className="public-file-icon">
          {getFileIcon(fileInfo.filename, false)}
        </div>
        <h2>{fileInfo.filename}</h2>
        <p>{formatBytes(fileInfo.size)}</p>

        {fileInfo.password_required && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password"><FaLock /> Password Protected</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password to download"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '40px' }} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
              style={{ top: '45px' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="auth-button" disabled={isDownloading}>
          {isDownloading ? "Downloading..." : (
            <>
              <FaDownload style={{ marginRight: '8px' }} /> Download
            </>
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <h1>OwnLoom</h1>
          <p>Your Personal AI Cloud. Secure, Private, and Intelligent.</p>
        </div>
      </div>
      <div className="auth-form-section">
        {renderContent()}
      </div>
    </div>
  );
}

export default PublicSharePage;