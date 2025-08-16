import React, { useState, useRef } from 'react';
import { apiService } from '../services';
import { DIdFileUploadResponse, DIdAuthenticationResponse } from '../types';

const DIdApiTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authResult, setAuthResult] = useState<DIdAuthenticationResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<DIdFileUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testAuthentication = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.testDIdAuthentication();
      setAuthResult(result);
      console.log('Authentication test result:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication test failed');
      console.error('Authentication test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.uploadImageToDId(file);
      setUploadResult(result);
      console.log('Image upload result:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
      console.error('Image upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 bg-elevated rounded-lg border border-primary">
      <h2 className="text-2xl font-bold text-primary mb-6">D-ID API Tester</h2>
      
      {/* Authentication Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-3">Authentication Test</h3>
        <button
          onClick={testAuthentication}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Testing...' : 'Test Authentication'}
        </button>
        
        {authResult && (
          <div className={`mt-3 p-3 rounded ${authResult.authenticated ? 'bg-success/20' : 'bg-error/20'}`}>
            <p className="font-semibold">
              Status: {authResult.authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            </p>
            <p className="text-sm text-secondary">{authResult.message}</p>
          </div>
        )}
      </div>

      {/* File Upload Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-3">Image Upload Test</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={handleFileClick}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          {isLoading ? 'Uploading...' : 'Select Image to Upload'}
        </button>
        
        {uploadResult && (
          <div className="mt-3 p-3 rounded bg-success/20">
            <p className="font-semibold">✅ Upload Successful</p>
            <p className="text-sm text-secondary">File ID: {uploadResult.file_id}</p>
            <p className="text-sm text-secondary">URL: {uploadResult.url}</p>
            <p className="text-sm text-secondary">Created: {uploadResult.created_at}</p>
            {uploadResult.expires_at && (
              <p className="text-sm text-secondary">Expires: {uploadResult.expires_at}</p>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded bg-error/20 border border-error">
          <p className="font-semibold text-error">❌ Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-primary/10 rounded">
        <h4 className="font-semibold text-primary mb-2">Instructions:</h4>
        <ul className="text-sm text-secondary space-y-1">
          <li>1. First test authentication to ensure D-ID API is accessible</li>
          <li>2. Select an image file to upload to D-ID storage</li>
          <li>3. Check the console for detailed API responses</li>
          <li>4. Make sure backend is running on http://localhost:8000</li>
        </ul>
      </div>
    </div>
  );
};

export default DIdApiTester;
