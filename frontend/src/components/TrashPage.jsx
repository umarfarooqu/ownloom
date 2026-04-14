// frontend/src/components/TrashPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import FolderItem from "./FolderItem"; 
import FileItem, { getFileIcon }from "./FileItem";   
import { FaTrash, FaUndo } from "react-icons/fa"; 

function TrashPage() {
    const [items, setItems] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);
    // State to manage which item's menu is open (though not needed for trash actions directly)
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const fetchTrashItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/trash/");
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch trash items", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrashItems();
    }, [fetchTrashItems]);

    // Effect to close menu on outside click (good practice, though menu not used here)
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleRestore = async (id, type) => {
        try {
            // Assuming you have separate restore endpoints or will create them
            // For now, only implementing file restore
            if (type === 'file') {
                await api.post(`/api/files/${id}/restore/`);
                fetchTrashItems(); // Refresh the list
            } else {
                 alert("Folder restore not implemented yet.");
                 // await api.post(`/api/folders/${id}/restore/`);
                 // fetchTrashItems();
            }
        } catch (error) {
            alert(`Failed to restore ${type}.`);
        }
    };

    const handlePermanentDelete = async (id, type) => {
        const itemTypeName = type === 'folder' ? 'folder' : 'file';
        if (window.confirm(`Are you sure you want to permanently delete this ${itemTypeName}? This action cannot be undone.`)) {
            try {
                // Use the correct endpoint based on type
                await api.delete(`/api/${type}s/${id}/`);
                fetchTrashItems(); // Refresh the list
            } catch (error) {
                alert(`Failed to permanently delete ${itemTypeName}.`);
            }
        }
    };

    if (loading) return <p>Loading trash...</p>;

    const isEmpty = items.folders.length === 0 && items.files.length === 0;

    return (
        <div className="trash-page page-container"> {/* Added page-container class */}
            
            <p className="trash-info-text"></p>

            {isEmpty ? (
                <div className="empty-state">
                    <FaTrash className="empty-state-icon" />
                    <h3>Trash is empty</h3>
                    <p>Items you move to the trash will appear here.</p>
                </div>
            ) : (
                <div className="file-browser-container list"> {/* Force list view */}
                    <div className="file-list">
                        {items.folders.map(folder => (
                            // Using a simplified view for trash items
                            <div key={`folder-${folder.id}`} className="file-item trash-item">
                                <div className="file-details-left">
                                     <FaFolder style={{ marginRight: "10px", color: "#FFC107" }} />
                                    <span>{folder.name}</span>
                                </div>
                                <div className="file-actions">
                                    <button onClick={() => handleRestore(folder.id, 'folder')} className="action-button restore-btn">
                                        <FaUndo /> Restore
                                    </button>
                                    <button onClick={() => handlePermanentDelete(folder.id, 'folder')} className="action-button delete">
                                        <FaTrash /> Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))}

                        {items.files.map(file => (
                             <div key={`file-${file.id}`} className="file-item trash-item">
                                <div className="file-details-left">
                                    <span className="file-icon" style={{marginRight: '10px'}}>
                                        {getFileIcon(file.filename)}
                                    </span>
                                    <span>{file.filename}</span>
                                </div>
                                <div className="file-actions">
                                    <button onClick={() => handleRestore(file.id, 'file')} className="action-button restore-btn">
                                        <FaUndo /> Restore
                                    </button>
                                    <button onClick={() => handlePermanentDelete(file.id, 'file')} className="action-button delete">
                                        <FaTrash /> Delete Forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrashPage;

// NOTE: You'll need to make sure getFileIcon is available, perhaps by exporting it
// from FileItem.jsx or moving it to a shared utility file.