// frontend/src/components/ShareModal.jsx

import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./CreateFolderModal.css"; 
import "./ShareModal.css"; 
import { FaEye, FaEyeSlash, FaCopy } from "react-icons/fa";

function ShareModal({ isOpen, onClose, shareUrl,fileId }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl("");
      setPassword("");
      setLoading(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/files/${fileId}/share/`, {
        password: password || null, 
      });
      setGeneratedUrl(response.data.share_url);
    } catch (err) {
      console.error("Failed to generate share link", err);
      alert("Failed to generate link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!generatedUrl ? (
          <>
            <h2>Share File</h2>
            <p>Set an optional password for your share link.</p>
            
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (optional)"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="modal-actions">
              <button onClick={onClose} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleGenerateLink} 
                className="btn-create"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Link Generated</h2>
            <p>Anyone with this link can view the file.</p>
            
            <div className="share-link-container">
              <input type="text" value={generatedUrl} readOnly />
              <button onClick={handleCopy} className="btn-create">
                {copied ? "Copied!" : <FaCopy />}
              </button>
            </div>
            
            <div className="modal-actions">
              <button onClick={onClose} className="btn-create">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShareModal;