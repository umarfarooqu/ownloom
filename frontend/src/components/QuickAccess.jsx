// frontend/src/components/QuickAccess.jsx

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getFileIcon } from './FileItem'; 
import './QuickAccess.css'; 

const openFile = async (file) => {
    if (file.iv) { 
        alert("Cannot open vault files from Quick Access yet.");
        return;
    }

    const urlToFetch = `/api/files/${file.id}/open/`;
    try {
        const response = await api.get(urlToFetch, { responseType: 'blob' });
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
        console.error("Error opening file:", err);
        alert("Cannot open file.");
    }
};

function QuickAccess() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await api.get('/api/recent/');
                setFiles(response.data.slice(0, 5) || []);
            } catch (err) {
                console.error("Failed to fetch recent files for Quick Access", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, []);

    if (loading || files.length === 0) {
        return null; 
    }

    return (
        <div className="quick-access-container">
            <h3>Quick Access</h3>
            <div className="quick-access-grid">
                {files.map(file => (
                    <div 
                        key={file.id} 
                        className="quick-access-item"
                        onClick={() => openFile(file)}
                        title={file.filename}
                    >
                        <div className="quick-access-icon">
                            {getFileIcon(file.filename, false)}
                        </div>
                        <span className="quick-access-name">{file.filename}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuickAccess;