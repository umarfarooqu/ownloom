// frontend/src/components/FavoritesPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import FolderItem from "./FolderItem"; // Import FolderItem
import FileItem from "./FileItem";   // Import FileItem
import { FaStar, FaEdit, FaTrash, FaShareSquare, FaDownload } from "react-icons/fa"; // Import necessary icons

function FavoritesPage({ handleShareClick ,handleDeleteFile, handleToggleSpam}) {
    const [items, setItems] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [editing, setEditing] = useState({ id: null, type: null, name: "" });

    const fetchFavoriteItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/favorites/");
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch favorite items", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavoriteItems();
    }, [fetchFavoriteItems]);

    // Effect to close menu on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleToggleFavorite = async (id, type) => {
        try {
            await api.post(`/api/${type}s/${id}/favorite/`);
            fetchFavoriteItems(); // Refresh the list after unfavoriting
        } catch (err) {
            alert(`Failed to remove favorite status for ${type}.`);
            console.error(err);
        }
    };

    const handleDownload = async (file) => {
        try {
            const urlToFetch = `/api/files/${file.id}/open/`; 
            const res = await api.get(urlToFetch, { responseType: 'blob' });
            const blob = res.data;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) { alert("Cannot download file."); }
    };

    // NAYA FUNCTION: Rename logic
    const handleRename = async (id, type, newNameFromChild) => {
      const stateKey = type === 'folder' ? 'folders' : 'files';
      const newName = newNameFromChild.trim();
      let originalName = "";

      const item = items[stateKey].find(i => i.id === id);
      if (item) originalName = item.name || item.filename;

      setEditing({ id: null, type: null, name: "" });

      if (!newName || newName === originalName) {
        return;
      }

      setItems(prev => ({
          ...prev,
          [stateKey]: prev[stateKey].map(item => 
              item.id === id ? { ...item, name: newName, filename: newName } : item
          )
      }));

      // Ab API call karein
      try {
        // --- YEH HAI ASLI FIX ---
        const payload = (type === 'folder') ? { name: newName } : { filename: newName };
        await api.patch(`/api/${type}s/${id}/`, payload);
        // --- FIX YAHAN KHATAM HOTA HAI ---
          
      } catch (err) {
          alert("Failed to rename.");
          // Rollback
          setItems(prev => ({
            ...prev,
            [stateKey]: prev[stateKey].map(item => 
                item.id === id ? { ...item, name: originalName, filename: originalName } : item
            )
          }));
      }
    };

    //Delete logic
   const handleDelete = async (id, type) => {
        const itemTypeName = type === 'folder' ? 'folder' : 'file';
        if (window.confirm(`Are you sure you want to move this ${itemTypeName} to trash?`)) {
            try {
                if (type === 'file') {
                    await api.post(`/api/files/${id}/trash/`);
                } else {
                    alert("Folder trash functionality not yet implemented in backend.");
                }
                fetchFavoriteItems();
            } catch (error) {
                alert(`Failed to move ${itemTypeName} to trash.`);
            }
        }
    };

    const handleSelectItem = (id, type) => console.log("Select:", id, type);
    const handleFolderDoubleClick = (folder) => console.log("Open folder:", folder);
    const handleShare = (id) => console.log("Share:", id);

    if (loading) return <p>Loading favorites...</p>;

    const hasFavorites = items.folders.length > 0 || items.files.length > 0;

    return (
        <div className="favorites-page page-container"> 

            {hasFavorites ? (
                <div className="file-browser-container list"> 
                    <div className="file-list">
                        {items.folders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                onSelect={handleSelectItem}
                                isSelected={false} 
                                onDoubleClick={handleFolderDoubleClick} 
                                menuRef={menuRef}
                                isMenuOpen={openMenuId}
                                setIsMenuOpen={setOpenMenuId}
                                editing={editing} 
                                setEditing={setEditing}
                                onRename={handleRename}
                                onDelete={() => handleDelete(folder.id, 'folder')} 
                                onToggleFavorite={handleToggleFavorite}
                            >
                                <div className="actions-dropdown-menu">
                                    <button onClick={() => setEditing({ id: folder.id, type: 'folder', name: folder.name })} className="dropdown-item">
                                        <FaEdit /> Rename
                                    </button>
                                    <button onClick={() => handleToggleFavorite(folder.id, 'folder')} className="dropdown-item favorite-active">
                                        <FaStar /> Unfavorite
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={() => handleDelete(folder.id, 'folder')} className="dropdown-item delete-item">
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </FolderItem>
                        ))}

                        {items.files.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                onSelect={() => {}}
                                isSelected={false}
                                onDoubleClick={() => {}} 
                                menuRef={menuRef}
                                isMenuOpen={openMenuId}
                                setIsMenuOpen={setOpenMenuId}
                                editing={editing}
                                setEditing={setEditing}
                                onRename={handleRename} 
                                onShare={handleShareClick}
                                onDelete={() => handleDelete(file.id, 'file')} 
                                onToggleFavorite={handleToggleFavorite}
                                onToggleSpam={handleToggleSpam}
                            >
                               <div className="actions-dropdown-menu">
                                    <button onClick={() => handleShareClick(file.id)} className="dropdown-item">
                                        <FaShareSquare /> Share
                                    </button>
                                    <button onClick={() => setEditing({ id: file.id, type: 'file', name: file.filename })} className="dropdown-item">
                                        <FaEdit /> Rename
                                    </button>
                                    <button onClick={() => handleToggleFavorite(file.id, 'file')} className="dropdown-item favorite-active">
                                        <FaStar /> Unfavorite
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={() => handleDelete(file.id, 'file')} className="dropdown-item delete-item">
                                        <FaTrash /> Delete
                                    </button>
                                    <button onClick={() => handleDownload(file)} className="dropdown-item">
                                        <FaDownload /> Download
                                    </button>
                                </div>
                            </FileItem>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <FaStar className="empty-state-icon" />
                    <h3>No favorite items yet</h3>
                    <p>Star items in your drive to quickly access them here.</p>
                </div>
            )}
        </div>
    );
}

export default FavoritesPage;