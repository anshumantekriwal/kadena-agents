import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB.');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setUploadUrl(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file first.');
      return;
    }
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('network', 'public');

    try {
      const res = await fetch('https://uploads.pinata.cloud/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
            const errorData = await res.json();
            errorMsg = errorData?.error?.details || errorData?.error || JSON.stringify(errorData);
        } catch (e) {
            errorMsg = await res.text();
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.data.cid}`;
      setUploadUrl(ipfsUrl);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  }

  const copyToClipboard = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl);
    }
  }

  return (
    <div className="image-upload-container">
      <h2 className="upload-title">Upload Image to Pinata</h2>
      <p className="upload-subtitle">Upload an image to get a shareable IPFS URL.</p>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <div className="upload-area" onClick={triggerFileSelect}>
        {preview ? (
          <img src={preview} alt="Preview" className="image-preview" />
        ) : (
          <p>Click here to select an image</p>
        )}
      </div>

      <button onClick={handleUpload} disabled={isUploading || !file} className="upload-button">
        {isUploading ? 'Uploading...' : 'Upload to Pinata'}
      </button>

      {error && <p className="error-message">{error}</p>}

      {uploadUrl && (
        <div className="result-container">
          <p>Upload successful!</p>
          <div className="url-container">
            <input type="text" value={uploadUrl} readOnly />
            <button onClick={copyToClipboard}>Copy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 