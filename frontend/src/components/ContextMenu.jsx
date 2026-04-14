// frontend/src/components/ContextMenu.jsx

import React, { useEffect, useRef } from 'react';
import { 
  FaFolderOpen, 
  FaShareSquare, 
  FaEdit, 
  FaStar, 
  FaInfoCircle, 
  FaTrash, 
  FaDownload, 
  FaBan, 
  FaLock
} from 'react-icons/fa';
import './ContextMenu.css'; 

function ContextMenu({ position, item, onClose, onAction }) {
  const menuRef = useRef(null);

  // Bahar click karne par menu band karein
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Scroll karne par bhi band karein
    document.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  if (!position || !item) return null;

  // Menu items define karein
  const handleAction = (action) => {
    onAction(action, item);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
    >
      <div className="context-menu-header">
        {item.filename || item.name}
      </div>
      
      <div className="context-menu-divider"></div>

      {/* Common Actions */}
      <button onClick={() => handleAction('open')} className="context-menu-item">
        <FaFolderOpen /> Open
      </button>

      {item.type === 'folder' && !item.is_vault && (
        <button onClick={() => handleAction('make_vault')} className="context-menu-item">
            <FaLock /> Make Vault
        </button>
      )}
      
      {item.type === 'file' && (
        <>
            <button onClick={() => handleAction('details')} className="context-menu-item">
                <FaInfoCircle /> Info
            </button>
            <button onClick={() => handleAction('share')} className="context-menu-item">
                <FaShareSquare /> Share
            </button>
            <button onClick={() => handleAction('download')} className="context-menu-item">
                <FaDownload /> Download
            </button>
        </>
      )}

      <div className="context-menu-divider"></div>

      <button onClick={() => handleAction('rename')} className="context-menu-item">
        <FaEdit /> Rename
      </button>
      
      <button onClick={() => handleAction('favorite')} className="context-menu-item">
        <FaStar /> {item.is_favorite ? 'Unfavorite' : 'Favorite'}
      </button>

      {item.type === 'file' && (
        <button onClick={() => handleAction('spam')} className="context-menu-item">
            <FaBan /> Mark as Spam
        </button>
      )}

      <div className="context-menu-divider"></div>

      <button onClick={() => handleAction('delete')} className="context-menu-item delete">
        <FaTrash /> Delete
      </button>
    </div>
  );
}

export default ContextMenu;