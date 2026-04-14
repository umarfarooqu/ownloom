import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';
import './FilePreviewModal.css';

function FilePreviewModal({ isOpen, onClose, file, fileUrl }) {
  if (!isOpen || !file || !fileUrl) {
    return null;
  }

  const fileType = file.filename ? file.filename.split('.').pop().toLowerCase() : '';

  const renderContent = () => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <img 
          src={fileUrl} 
          alt={file.filename} 
          className="preview-image" 
        />
      );
    }
    
    if (fileType === 'pdf') {
      return (
        <iframe 
          src={`${fileUrl}#toolbar=0`} 
          className="preview-iframe" 
          title="PDF Preview"
        ></iframe>
      );
    }
    
    if (['txt', 'json', 'js', 'py', 'css', 'html', 'md'].includes(fileType)) {
      return (
        <iframe 
          src={fileUrl} 
          className="preview-iframe white-bg" 
          title="Text Preview"
        ></iframe>
      );
    }
    
    if (['mp3', 'wav', 'ogg'].includes(fileType)) {
      return (
        <audio controls className="preview-audio">
          <source src={fileUrl} />
          Your browser does not support the audio element.
        </audio>
      );
    }

    if (['mp4', 'webm'].includes(fileType)) {
      return (
        <video controls className="preview-video">
          <source src={fileUrl} />
          Your browser does not support the video element.
        </video>
      );
    }

    return (
      <div className="preview-unsupported">
        <p>No preview available for this file type.</p>
        <a href={fileUrl} download={file.filename} className="btn-download">
          <FaDownload /> Download to View
        </a>
      </div>
    );
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-container" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <span className="preview-filename">{file.filename}</span>
          <div className="preview-actions">
            <a 
              href={fileUrl} 
              download={file.filename} 
              className="preview-action-btn" 
              title="Download"
            >
              <FaDownload />
            </a>
            <button onClick={onClose} className="preview-close-btn">
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="preview-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;