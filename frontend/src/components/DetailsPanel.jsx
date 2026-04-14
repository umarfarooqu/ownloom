// frontend/src/components/DetailsPanel.jsx

import React, { useEffect } from 'react';
import { FaTimes, FaFileAlt } from 'react-icons/fa';
import { getFileIcon } from './FileItem'; // Hum icon function reuse karenge
import './DetailsPanel.css'; // Hum is file ko agle kadam mein banayenge

// File size ko MB ya KB mein format karne ke liye
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function DetailsPanel({ file, onClose }) {
    // Agar koi file selected nahi hai, toh component ko render na karein
    if (!file) {
        return null;
    }
    
    // Summary na hone par default message
    const summary = file.summary || "No summary available for this file type.";
    const isSummaryLoading = !file.summary && (file.filename.endsWith('.pdf') || file.filename.endsWith('.docx') || file.filename.endsWith('.txt'));

    return (
        <div className="details-panel-overlay" onClick={onClose}>
            <div className="details-panel" onClick={(e) => e.stopPropagation()}>
                
                {/* 1. Header: File Icon aur Naam */}
                <div className="panel-header">
                    <span className="panel-file-icon">
                        {getFileIcon(file.filename, false)}
                    </span>
                    <h3 className="panel-file-name" title={file.filename}>
                        {file.filename}
                    </h3>
                    <button className="panel-close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* 2. Body: Summary aur Details */}
                <div className="panel-body">
                    <h4>AI Summary</h4>
                    <div className="summary-box">
                        {isSummaryLoading ? (
                            <p className="summary-loading">Generating summary... (Please wait a moment and reopen)</p>
                        ) : (
                            <p>{summary}</p>
                        )}
                    </div>
                    
                    <hr className="panel-divider" />

                    <h4>File Details</h4>
                    <ul className="details-list">
                        <li>
                            <strong>Size:</strong>
                            <span>{formatBytes(file.size)}</span>
                        </li>
                        <li>
                            <strong>Uploaded:</strong>
                            <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        </li>
                        <li>
                            <strong>Folder:</strong>
                            <span>{file.folder_name || "My Drive"}</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}

export default DetailsPanel;