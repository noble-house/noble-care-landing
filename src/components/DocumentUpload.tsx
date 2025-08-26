import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, X, Plus, Trash2, Save, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  url: string;
  uploadedAt: Date | string;
  size: number;
  status: 'uploaded' | 'verified' | 'rejected';
  notes?: string;
}

interface DocumentUploadData {
  documents: Document[];
}

const DocumentUpload = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<DocumentUploadData>({
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const documentCategories = [
    {
      id: 'licenses',
      name: 'Professional Licenses',
      description: 'Nursing license, medical certifications, etc.',
      required: true
    },
    {
      id: 'certifications',
      name: 'Training Certifications',
      description: 'CPR, BLS, ACLS, specialty training certificates',
      required: true
    },
    {
      id: 'education',
      name: 'Education Documents',
      description: 'Diplomas, transcripts, continuing education certificates',
      required: false
    },
    {
      id: 'employment',
      name: 'Employment Documents',
      description: 'Previous employment verification, performance reviews',
      required: false
    },
    {
      id: 'other',
      name: 'Other Documents',
      description: 'Any other relevant documents',
      required: false
    }
  ];

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-save functionality
  const autoSave = useAutoSave(formData, {
    delay: 3000, // 3 seconds for file uploads
    onSave: async (data) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/documents`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save');
      }
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  useEffect(() => {
    // Load existing data if available
    const loadExistingData = async () => {
          try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile && data.profile.documents) {
            setFormData(prev => ({
              ...prev,
              documents: data.profile.documents || []
            }));
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadExistingData();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Check if required document categories have at least one document
    const requiredCategories = documentCategories.filter(cat => cat.required);
    const uploadedCategories = new Set(formData.documents.map(doc => doc.category));

    const missingCategories = requiredCategories.filter(cat => !uploadedCategories.has(cat.id));
    if (missingCategories.length > 0) {
      newErrors.documents = `Please upload documents for: ${missingCategories.map(cat => cat.name).join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // First, auto-save any pending changes
      await autoSave.saveNow();

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/documents`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents: formData.documents })
      });

      if (response.ok) {
        // Update onboarding step
        await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'documents', completed: true })
        });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save documents');
      }
    } catch (error) {
      console.error('Error saving documents:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, category: string) => {
    setUploading(true);

    try {
      // Convert file to base64 for storage
      const base64String = await convertFileToBase64(file);

      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        category,
        url: base64String, // Store base64 string instead of blob URL
        uploadedAt: new Date(),
        size: file.size,
        status: 'uploaded'
      };

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument]
      }));

    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors({ upload: 'Failed to upload file. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const removeDocument = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== documentId)
    }));
  };

  const getDocumentsByCategory = (categoryId: string) => {
    return formData.documents.filter(doc => doc.category === categoryId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'uploaded':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'uploaded':
        return 'Uploaded';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
              <p className="text-gray-600 mt-1">Upload required certificates, licenses, and other documents</p>
            </div>
            <AutoSaveIndicator
              isSaving={autoSave.isSaving}
              isSaved={autoSave.isSaved}
              hasUnsavedChanges={autoSave.hasUnsavedChanges}
              lastSaved={autoSave.lastSaved}
              error={autoSave.error}
              onSaveNow={autoSave.saveNow}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Document Categories */}
        {documentCategories.map((category) => {
          const categoryDocuments = getDocumentsByCategory(category.id);
          const hasDocuments = categoryDocuments.length > 0;

          return (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    {category.name}
                    {category.required && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileUpload(file, category.id);
                      }
                    };
                    input.click();
                  }}
                  disabled={uploading}
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {uploading ? 'Uploading...' : 'Add Document'}
                </button>
              </div>

              {!hasDocuments ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No documents uploaded yet</p>
                  <p className="text-sm text-gray-500">
                    {category.required ? 'This category requires at least one document' : 'This category is optional'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryDocuments.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(document.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{document.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.size)} • Uploaded {typeof document.uploadedAt === 'string' 
                              ? new Date(document.uploadedAt).toLocaleDateString() 
                              : document.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          document.status === 'verified' ? 'bg-green-100 text-green-800' :
                          document.status === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getStatusText(document.status)}
                        </span>
                        <button
                          type="button"
                          onClick={() => window.open(document.url, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDocument(document.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Document Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Document Summary</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Documents: <span className="font-medium text-gray-900">{formData.documents.length}</span></p>
              <p className="text-gray-600">Verified: <span className="font-medium text-green-600">{formData.documents.filter(doc => doc.status === 'verified').length}</span></p>
            </div>
            <div>
              <p className="text-gray-600">Pending Review: <span className="font-medium text-blue-600">{formData.documents.filter(doc => doc.status === 'uploaded').length}</span></p>
              <p className="text-gray-600">Rejected: <span className="font-medium text-red-600">{formData.documents.filter(doc => doc.status === 'rejected').length}</span></p>
            </div>
          </div>
        </div>

        {/* Upload Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Document Upload Guidelines</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX</li>
                <li>• Maximum file size: 10MB per document</li>
                <li>• Ensure documents are clear and legible</li>
                <li>• All required documents must be uploaded before proceeding</li>
                <li>• Documents will be reviewed within 24-48 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {errors.documents && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.documents}</p>
          </div>
        )}

        {errors.upload && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.upload}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">Documents saved successfully!</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back
          </button>
          
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;
