// frontend/src/components/UnlockVaultModal.jsx

import React, { useState } from "react";
import api from "../services/api";
import "./CreateFolderModal.css"; 
import "./ShareModal.css"; 
import { FaLock } from "react-icons/fa";

function UnlockVaultModal({ isOpen, onClose, folder, onUnlockSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post(`/api/folders/${folder.id}/unlock/`, {
        password: password,
      });
      
      setLoading(false);
      onUnlockSuccess(password); 
      onClose();
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to unlock vault.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };
  
  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2><FaLock /> Unlock Vault</h2>
        <p>
          Enter password for <strong>{folder.name}</strong> to view its contents.
        </p>

        <div className="password-input-container">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter vault password"
            autoFocus
          />
        </div>

        {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}

        <div className="modal-actions">
          <button onClick={handleClose} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-create"
            disabled={loading}
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnlockVaultModal;