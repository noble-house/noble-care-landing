import React, { useState, useEffect } from 'react';
import { Shield, Upload, FileText, CheckCircle, X, Camera, Save, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface IdentityDocument {
  type: string;
  name: string;
  url: string;
  uploadedAt: Date | string;
  verified: boolean;
  verificationNotes?: string;
}

interface IdentityVerificationData {
  identityDocuments: IdentityDocument[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

const IdentityVerification = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<IdentityVerificationData>({
    identityDocuments: [],
    verificationStatus: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-save functionality
  const autoSave = useAutoSave(formData, {
    delay: 3000, // 3 seconds for file uploads
    onSave: async (data) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/identity-verification`, {
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

  const requiredDocuments = [
    { type: 'government_id', name: 'Government ID', description: 'Passport, Driver\'s License, or National ID' },
    { type: 'ssn_card', name: 'Social Security Card', description: 'SSN card or equivalent' },
    { type: 'background_check', name: 'Background Check', description: 'Recent background check report' }
  ];

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
          console.log('Loaded profile data for identity verification:', data.profile);
          if (data.profile) {
            setFormData(prev => ({
              ...prev,
              identityDocuments: data.profile.identityDocuments || [],
              verificationStatus: data.profile.identityVerified ? 'verified' : 'pending'
            }));
            console.log('Set form data:', {
              identityDocuments: data.profile.identityDocuments || [],
              verificationStatus: data.profile.identityVerified ? 'verified' : 'pending'
            });
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

    // Check if at least one document of each required type is uploaded
    const uploadedTypes = [...new Set(formData.identityDocuments.map(doc => doc.type))];
    const missingDocuments = requiredDocuments.filter(doc => !uploadedTypes.includes(doc.type));

    if (missingDocuments.length > 0) {
      newErrors.documents = `Please upload at least one: ${missingDocuments.map(doc => doc.name).join(', ')}`;
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

      console.log('Submitting identity verification with data:', {
        identityDocuments: formData.identityDocuments,
        verificationStatus: formData.verificationStatus
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/identity-verification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identityDocuments: formData.identityDocuments,
          verificationStatus: formData.verificationStatus
        })
      });

      if (response.ok) {
        // Update onboarding step
        await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'identity_verification', completed: true })
        });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save identity verification');
      }
    } catch (error) {
      console.error('Error saving identity verification:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    setUploading(true);

    try {
      // Convert file to base64 for storage
      const base64String = await convertFileToBase64(file);

      const newDocument: IdentityDocument = {
        type: documentType,
        name: file.name,
        url: base64String, // Store base64 string instead of blob URL
        uploadedAt: new Date().toISOString(),
        verified: false
      };

      // Add the new document to the existing documents (allow multiple documents of same type)
      const updatedDocuments = [
        ...formData.identityDocuments,
        newDocument
      ];

      setFormData(prev => ({
        ...prev,
        identityDocuments: updatedDocuments
      }));

      // Save the updated documents to the database immediately
      await saveDocumentsToDatabase(updatedDocuments);

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

  const saveDocumentsToDatabase = async (documents?: IdentityDocument[]) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const documentsToSave = documents || formData.identityDocuments;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/identity-verification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identityDocuments: documentsToSave,
          verificationStatus: formData.verificationStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save documents');
      }

      console.log('Documents saved to database successfully');
    } catch (error) {
      console.error('Error saving documents to database:', error);
      setErrors({ save: 'Failed to save documents. Please try again.' });
    }
  };

  const removeDocument = async (documentIndex: number) => {
    const updatedDocuments = formData.identityDocuments.filter((_, index) => index !== documentIndex);
    
    setFormData(prev => ({
      ...prev,
      identityDocuments: updatedDocuments
    }));

    // Save the updated documents to the database
    await saveDocumentsToDatabase(updatedDocuments);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'uploaded':
        return 'Uploaded';
      default:
        return 'Missing';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with Auto-save Indicator */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
              <p className="text-gray-600 mt-1">Please upload the required documents to verify your identity</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Document Upload Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Required Documents
            </h3>
            
            <div className="space-y-6">
              {requiredDocuments.map((doc) => {
                const documentsOfType = formData.identityDocuments.filter(d => d.type === doc.type);
                const hasDocuments = documentsOfType.length > 0;

                return (
                  <div key={doc.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-600">{doc.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasDocuments ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {documentsOfType.length} document{documentsOfType.length > 1 ? 's' : ''} uploaded
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">No documents</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Upload area - always show to allow adding more documents */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {hasDocuments ? `Add another ${doc.name}` : `Upload ${doc.name}`}
                      </p>
                      <input
                        type="file"
                        id={`file-${doc.type}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, doc.type);
                          }
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label
                        htmlFor={`file-${doc.type}`}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {uploading ? 'Uploading...' : 'Choose File'}
                      </label>
                    </div>

                    {/* Show all uploaded documents of this type */}
                    {hasDocuments && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Uploaded Documents:</h5>
                        {documentsOfType.map((document, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{document.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded on {typeof document.uploadedAt === 'string' 
                                      ? new Date(document.uploadedAt).toLocaleDateString() 
                                      : document.uploadedAt.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {document.verified && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeDocument(formData.identityDocuments.indexOf(document))}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">Identity verification saved successfully!</p>
              </div>
            </div>
          )}

          {/* Error Messages */}
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

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
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
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IdentityVerification;
