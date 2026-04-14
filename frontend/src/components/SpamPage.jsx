// frontend/src/components/SpamPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { getFileIcon } from "./FileItem"; // FileItem se icon function import karein
import { FaBan, FaUndo } from "react-icons/fa"; // Spam ke liye FaBan icon

function SpamPage() {
    const [items, setItems] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);

    const fetchSpamItems = useCallback(async () => {
        setLoading(true);
        try {
            // Aapke backend view 'SpamContentView' ko call karega
            const response = await api.get("/api/spam/");
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch spam items", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpamItems();
    }, [fetchSpamItems]);

    // File ko spam se hatane ke liye
    const handleUnmarkSpam = async (id, type) => {
        if (type === 'folder') {
            alert("Folder spam functionality not supported yet.");
            return;
        }
        
        try {
            // Aapke backend view 'FileMoveToSpamView' ko call karega
            await api.post(`/api/files/${id}/spam/`); // Yeh toggle karega
            fetchSpamItems(); // List ko refresh karega
        } catch (error) {
            alert(`Failed to unmark spam.`);
        }
    };

    if (loading) return <p>Loading spam...</p>;

    const isEmpty = items.folders.length === 0 && items.files.length === 0;

    return (
        <div className="spam-page page-container">
            
            <p className="trash-info-text">Files you mark as spam will appear here.</p>

            {isEmpty ? (
                <div className="empty-state">
                    <FaBan className="empty-state-icon" />
                    <h3>No spam files</h3>
                    <p>You haven't marked any files as spam.</p>
                </div>
            ) : (
                <div className="file-browser-container list">
                    <div className="file-list">
                        {/* Folders ke liye (agar future mein add karein) */}
                        {items.folders.map(folder => (
                             <div key={`folder-${folder.id}`} className="file-item trash-item">
                                <div className="file-details-left">
                                     <span className="file-icon" style={{marginRight: '10px'}}>
                                        {getFileIcon(null, true)}
                                     </span>
                                    <span>{folder.name}</span>
                                </div>
                             </div>
                        ))}

                        {/* Files ke liye */}
                        {items.files.map(file => (
                             <div key={`file-${file.id}`} className="file-item trash-item">
                                <div className="file-details-left">
                                     <span className="file-icon" style={{marginRight: '10px'}}>
                                        {getFileIcon(file.filename)}
                                     </span>
                                    <span>{file.filename}</span>
                                </div>
                                <div className="file-actions">
                                    <button onClick={() => handleUnmarkSpam(file.id, 'file')} className="action-button restore-btn">
                                        <FaUndo /> Not Spam
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

export default SpamPage;