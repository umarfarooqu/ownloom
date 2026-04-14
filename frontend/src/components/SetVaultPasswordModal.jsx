// frontend/src/components/SetVaultPasswordModal.jsx

import React, { useState } from "react";
import api from "../services/api";
import "./CreateFolderModal.css"; // We reuse the same modal style
import "./ShareModal.css"; // We reuse the password input style

function SetVaultPasswordModal({ isOpen, onClose, folder, onVaultCreated }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await api.post(`/api/folders/${folder.id}/set-password/`, {
        password: password,
      });
      onVaultCreated(folder.id); // Tell parent component to update
      onClose(); // Close modal on success
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to create vault.";
      if (errorMsg.includes("non-empty folder")) {
          setError("Error: Cannot turn a non-empty folder into a vault.");
      } else {
          setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Encrypted Vault</h2>
        <p>
          You are turning <strong>{folder.name}</strong> into an encrypted vault.
          This action is permanent and can only be done on **empty folders**.
        </p>
        <p>
          Set a strong password. If you lose this password, your data will be
          lost forever.
        </p>

        <div className="password-input-container">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter vault password"
            autoFocus
          />
        </div>

        {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-create"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Vault"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetVaultPasswordModal;