// frontend/src/components/FolderItem.jsx

import React, { useState, useEffect, useRef } from "react";
import { FaFolder, FaEdit, FaTrash, FaStar, FaEllipsisV, FaLock } from "react-icons/fa";

function FolderItem({ folder, onSelect, isSelected, onDoubleClick, onRename, onDelete, onToggleFavorite, onMakeVault, editing, setEditing}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isEditingThis = editing && editing.id === folder.id && editing.type === 'folder';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

 const handleRename = () => {
    onRename(folder.id, 'folder', editing.name);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      handleRename(); 
    }
  };
  
  return (
    <div className={`file-item ${isSelected ? "selected" : ""} ${isMenuOpen ? 'menu-open' : ''} ${isEditingThis ? 'is-editing' : ''}`}>
      <div className="file-details-left">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={isSelected}
          onChange={() => onSelect(folder.id, "folder")}
        />
        <div
          className="file-info folder-item"
          onDoubleClick={() => editing.id !== folder.id && onDoubleClick(folder)}
        >
          {folder.is_vault ? (
            <FaLock style={{ marginRight: "10px", color: "#8ab4f8" }} />
          ) : (
            <FaFolder style={{ marginRight: "10px", color: "#FFC107" }} />
          )}
          {editing && editing.id === folder.id && editing.type === "folder" ? (
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              className="rename-input"
            />
          ) : (
            <span>{folder.name}</span>
          )}
        </div>
      </div>

      <div className="file-actions" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="action-button dots-button"
        >
          <FaEllipsisV />
        </button>

        {isMenuOpen && (
          <div className="actions-dropdown-menu">
            {!folder.is_vault && (
              <button
                onClick={() => {
                  onMakeVault(folder);
                  setIsMenuOpen(false);
                }}
                className="dropdown-item"
              >
                <FaLock /> Make Vault
              </button>
            )}
            <button
              onClick={() => {
                setEditing({ id: folder.id, type: "folder", name: folder.name });
                setIsMenuOpen(false); 
              }}
              className="dropdown-item"
            >
              <FaEdit /> Rename
            </button>
            <button
              onClick={() => onToggleFavorite(folder.id, 'folder', folder.is_favorite)}
              className={`dropdown-item ${folder.is_favorite ? 'favorite-active' : ''}`}
            >
              <FaStar /> {folder.is_favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <div className="dropdown-divider"></div>
            <button
              onClick={() => onDelete(folder.id, folder.name)}
              className="dropdown-item delete-item"
            >
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderItem;