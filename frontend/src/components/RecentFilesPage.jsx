// frontend/src/components/RecentFilesPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import FileItem from "./FileItem";
import { FaClock, FaEdit, FaTrash, FaStar, FaShareSquare, FaDownload } from "react-icons/fa"; // Import necessary icons

// Receive necessary handlers from MainLayout
function RecentFilesPage({ handleShareClick}) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [editing, setEditing] = useState({ id: null, type: null, name: "" }); 

    const fetchRecentFiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/recent/");
            setFiles(response.data || []); 
        } catch (error) {
            console.error("Failed to fetch recent files", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentFiles();
    }, [fetchRecentFiles]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const onSelectPlaceholder = (id, type) => console.log("Select:", id, type);

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

    // Rename logic 
   const handleRenameLogic = async (id, type, newNameFromChild) => {
        const newName = newNameFromChild.trim();
        let originalName = "";
        
        const item = files.find(i => i.id === id);
        if (item) originalName = item.filename;

        setEditing({ id: null, type: null, name: "" });

        if (!newName || newName === originalName) {
          return;
        }

        setFiles(prev => prev.map(item => 
            item.id === id ? { ...item, name: newName, filename: newName } : item
        ));
        
        try {
            const payload = { filename: newName };
            await api.patch(`/api/${type}s/${id}/`, payload);
        } catch (err) {
            alert("Failed to rename.");
            setFiles(prev => prev.map(item => 
                item.id === id ? { ...item, name: originalName, filename: originalName } : item
            ));
        }
    };

    // Delete logic 
    const handleDeleteLogic = async (id) => {
        if (window.confirm(`Are you sure you want to move this file to trash?`)) {
            try {
                await api.post(`/api/files/${id}/trash/`);
                fetchRecentFiles(); 
            } catch (error) {
                alert(`Failed to move file to trash.`);
            }
        }
    };
    // Favorite logic
    const handleToggleFavoriteLogic = async (id, type, currentStatus) => {
        try {
            await api.post(`/api/files/${id}/favorite/`);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, is_favorite: !currentStatus } : f));
        } catch (err) { alert(`Failed to toggle favorite status.`); }
    };

    if (loading) return <p>Loading recent files...</p>;

    return (
        <div className="recent-page page-container">
            <h2>Recent Files</h2>

            {files.length > 0 ? (
                <div className="file-browser-container list">
                    <div className="file-list">
                        {files.map(file => (
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
                                onRename={handleRenameLogic}
                                onDelete={handleDeleteLogic} 
                                onToggleFavorite={ handleToggleFavoriteLogic}
                                onShare={handleShareClick}
                            >
                                {/* Dropdown menu for recent files */}
                                <div className="actions-dropdown-menu">
                                    <button onClick={() => handleShareClick(file.id)} className="dropdown-item"> <FaShareSquare /> Share </button>
                                    <button onClick={() => setEditing({ id: file.id, type: 'file', name: file.filename })} className="dropdown-item"> <FaEdit /> Rename </button>
                                    <button onClick={() => handleToggleFavorite(file.id, 'file', file.is_favorite)} className={`dropdown-item ${file.is_favorite ? 'favorite-active' : ''}`}> <FaStar /> {file.is_favorite ? 'Unfavorite' : 'Favorite'} </button>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={() => handleDeleteFile(file.id)} className="dropdown-item delete-item"> <FaTrash /> Delete </button>
                                    <button onClick={() => handleDownload(file)} className="dropdown-item"> <FaDownload /> Download </button>
                                </div>
                            </FileItem>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <FaClock className="empty-state-icon" />
                    <h3>No recent files</h3>
                    <p>Files you've recently uploaded or modified will appear here.</p>
                </div>
            )}
        </div>
    );
}

export default RecentFilesPage;