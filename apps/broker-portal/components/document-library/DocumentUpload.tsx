'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { AlertCircle, Upload, FileText, Check } from 'lucide-react';

// Document types matching HR portal
const DOCUMENT_TYPES = [
  { value: 'benefits_booklet', label: 'Benefits Booklet' },
  { value: 'claim', label: 'Claim' },
  { value: 'compliance_notice', label: 'Compliance Notice' },
  { value: 'contract', label: 'Contract' },
  { value: 'employee_census', label: 'Employee Census' },
  { value: 'form', label: 'Form' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'other', label: 'Other' },
];

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete: () => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Auto-populate title with filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
      // Reset states
      setUploadError(null);
      setUploadSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile || !title || !documentType) {
      setUploadError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('description', title);

      const response = await fetch(`/api/clients/${clientId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      // Success!
      setUploadSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setDocumentType('');

      // Notify parent component
      onUploadComplete();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          {selectedFile ? (
            <p className="text-sm font-medium">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag and drop a PDF file here, or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF files only</p>
            </>
          )}
        </div>

        {/* Form Fields */}
        {selectedFile && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Error Alert */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <Check className="h-4 w-4" />
            <AlertDescription>Document uploaded successfully!</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !title || !documentType || isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
}