import React, { useState, useEffect, useRef } from "react";
import {
  FaFilePdf,
  FaFileImage,
  FaFolder,
  FaFileAlt,
  FaFileWord,
  FaFileExcel,
  FaEdit,
  FaTrash,
  FaStar,
  FaEllipsisV,
  FaDownload,
  FaShareSquare,
  FaBan,
  FaInfoCircle,
  FaGlobe,
} from "react-icons/fa";
import { FaFileZipper } from "react-icons/fa6";
import "../App.css";
import './FileItem.css';
import api from "../services/api"

export const getFileIcon = (filename, isFolder) => {
  if (isFolder) return <FaFolder style={{ color: "#4299E1" }} />;
  if (!filename) return <FaFileAlt style={{ color: "#718096" }} />;

  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf":
      return <FaFilePdf style={{ color: "#E53E3E" }} />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <FaFileImage style={{ color: "#48BB78" }} />;
    case "doc":
    case "docx":
      return <FaFileWord style={{ color: "#2B579A" }} />;
    case "xls":
    case "xlsx":
    case "xlsm":
      return <FaFileExcel style={{ color: "#1D6F42" }} />;
    case "zip":
    case "rar":
      return <FaFileZipper style={{ color: "#F8CD2C" }} />;
    default:
      return <FaFileAlt style={{ color: "#718096" }} />;
  }
};
function FileItem({ file, token, onDelete, isSelected, onSelect, editing, setEditing, onRename, onToggleFavorite, onShare,isInVault, onUnlockNeeded,onToggleSpam,onShowDetails, customActions}) {
  const isEditingThis = editing && editing.id === file.id && editing.type === 'file';
  
  if (!file) return null;

  // --- Open file in new tab ---
  const handleFileOpen = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInVault) {
      onUnlockNeeded(file);
      return; 
    }

    const urlToFetch = `/api/files/${file.id}/open/`;
    try {
      const response = await api.get(urlToFetch, {
        responseType: 'blob', 
      });
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error opening file:", err);
      alert("Cannot open file. Check console for details.");
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Bahar click karne par menu ko band karne ke liye
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // --- Delete file ---
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      onDelete(file.id);
    }
  };

  // --- Download file ---
  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(file.file, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Cannot download file. Check console for details.");
    }
  };

  const handleRenameTrigger = () => {
    onRename(file.id, "file", editing.name); 
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      handleRenameTrigger(); 
    }
  };

  return (
    <div className={`file-item ${isSelected ? "selected" : ""} ${isMenuOpen ? 'menu-open' : ''} ${isEditingThis ? 'is-editing' : ''}`}>
      <div className="file-details-left">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={isSelected}
          onChange={() => onSelect(file.id, "file")}
        />
        <div className="file-info">
          <span className="file-icon">{getFileIcon(file.filename, file.is_folder)}</span>

          <div className="file-name-container">
            {editing && editing.id === file.id && editing.type === "file" ? (
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onBlur={handleRenameTrigger}
                onKeyDown={handleKeyDown}
                autoFocus
                className="rename-input"
              />
            ) : (
              <span
                className="file-link"
                style={{ cursor: "pointer" }}
                onClick={handleFileOpen}
              >
                {file.filename}
              </span>
            )}

              {file.folder_name && (
              <span className="file-location">
                in {file.folder_name}
              </span>
            )}
            {file.is_shared && (
                <span style={{ fontSize: '0.75rem', color: '#0d6efd', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <FaGlobe /> Public Link Active
                </span>
             )}
          </div>
        </div>
      </div>

      {customActions && (
          <div className="file-custom-actions" style={{ marginLeft: 'auto', marginRight: '10px', display: 'flex', alignItems: 'center' }}>
              {customActions}
          </div>
      )}

      <div className="file-actions" ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="action-button dots-button">
          <FaEllipsisV />
        </button>
        {isMenuOpen && (
          <div className="actions-dropdown-menu">
            <button onClick={() => onShare(file.id)} className="dropdown-item">
              <FaShareSquare /> Share
            </button>
            <button 
              onClick={() => {
                setEditing({ id: file.id, type: "file", name: file.filename });
                setIsMenuOpen(false); 
              }} 
              className="dropdown-item"
            >
              <FaEdit /> Rename
            </button>
            <button onClick={() => onToggleFavorite(file.id, 'file', file.is_favorite)} className={`dropdown-item ${file.is_favorite ? 'favorite-active' : ''}`}>
              <FaStar /> {file.is_favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <button onClick={() => onToggleSpam(file.id)} className="dropdown-item">
              <FaBan /> Mark as Spam
            </button>
            <div className="dropdown-divider"></div>
            <button onClick={handleDelete} className="dropdown-item delete-item">
              <FaTrash /> Delete
            </button>
            <button onClick={handleDownload} className="dropdown-item">
              <FaDownload /> Download
            </button>
            <button 
              onClick={() => {
                onShowDetails(file); 
                setIsMenuOpen(false); 
              }} 
              className="dropdown-item"
            >
              <FaInfoCircle /> Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileItem;
