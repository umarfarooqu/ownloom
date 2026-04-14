import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import FileItem from "./FileItem";
import { FaLink, FaUnlink, FaShareSquare, FaBan } from "react-icons/fa";
import { toast } from 'react-hot-toast';

function SharedPage({ handleShareClick }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const fetchSharedFiles = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/shared-files/");
            setFiles(response.data || []); 
        } catch (error) {
            console.error("Failed to fetch shared files", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    // --- UNSHARE LOGIC ---
    const handleUnshare = async (fileId) => {
        if(window.confirm("Are you sure? This will break the existing link.")) {
            try {
                await api.post(`/api/files/${fileId}/unshare/`);
                toast.success("Link revoked. File is now private.");
                fetchSharedFiles(); // List refresh karein
            } catch (err) {
                toast.error("Failed to unshare file.");
            }
        }
    };

    if (loading) return <p style={{padding: '20px'}}>Loading shared files...</p>;

    return (
        <div className="shared-page page-container">
            <h2>Shared Links Manager</h2>
            <p className="trash-info-text">Manage files you have shared with others via link.</p>

            {files.length > 0 ? (
                <div className="file-browser-container list">
                    <div className="file-list">
                        {files.map(file => (
                            <FileItem
                                key={file.id}
                                file={file}
                                onSelect={() => {}}
                                isSelected={false}
                                menuRef={menuRef}
                                isMenuOpen={openMenuId}
                                setIsMenuOpen={setOpenMenuId}
                                onShare={handleShareClick}
                                
                                // --- YEH BUTTONS ABHI MISSING THE ---
                                customActions={
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleShareClick(file.id)}
                                            className="action-button"
                                            style={{ 
                                                fontSize: '0.85rem', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                border: '1px solid #ccc', 
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                backgroundColor: 'white',
                                                color: '#333'
                                            }}
                                            title="Copy Link"
                                        >
                                            <FaLink /> Copy Link
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleUnshare(file.id)}
                                            className="action-button"
                                            style={{ 
                                                fontSize: '0.85rem', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                border: '1px solid #dc3545', 
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                backgroundColor: 'white',
                                                color: '#dc3545'
                                            }}
                                            title="Stop Sharing"
                                        >
                                            <FaUnlink /> Stop Sharing
                                        </button>
                                    </div>
                                }
                                // -------------------------------------
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <FaShareSquare className="empty-state-icon" />
                    <h3>No shared files</h3>
                    <p>Files you share via link will appear here for management.</p>
                </div>
            )}
        </div>
    );
}

export default SharedPage;