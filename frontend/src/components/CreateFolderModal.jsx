// frontend/src/components/CreateFolderModal.js

import React, { useState, useEffect } from "react";
import "./CreateFolderModal.css";

function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState("");

  // Reset input whenever the modal opens
  useEffect(() => {
    if (isOpen) setFolderName("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName(""); // Reset input
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Folder</h2>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter folder name"
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-create">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateFolderModal;
