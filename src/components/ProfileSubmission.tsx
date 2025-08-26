import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Send, ArrowLeft, User, Shield, FileText, Heart, Activity, Users, AlertTriangle, Save, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface ProfileData {
  _id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  baseCity: string;
  jobTitle: string;
  prescreenCompleted: boolean;
  personalInfoCompleted: boolean;
  identityVerified: boolean;
  professionalBackgroundCompleted: boolean;
  healthAssessmentCompleted: boolean;
  referencesCompleted: boolean;
  documentsUploaded: boolean;
  profileSubmitted: boolean;
  applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submissionDate?: string;
  notes?: Array<{
    content: string;
    author: string;
    createdAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const ProfileSubmission = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-save functionality
  const autoSave = useAutoSave(profileData, {
    delay: 2000, // 2 seconds
    onSave: async (data) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/submission`, {
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
    // Load profile data
    const loadProfileData = async () => {
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
          if (data.profile) {
            setProfileData(data.profile);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const handleSubmit = async () => {
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
      const response = await fetch(`${API_BASE_URL}/profile/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit profile');
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit profile' });
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (completed: boolean) => {
    return completed ? 'completed' : 'incomplete';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'incomplete':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'incomplete':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const onboardingSteps = [
    {
      id: 'prescreen',
      name: 'Prescreen Assessment',
      description: 'Initial qualification assessment',
      status: getStepStatus(profileData?.prescreenCompleted || false),
      icon: Activity
    },
    {
      id: 'personal_info',
      name: 'Personal Information',
      description: 'Basic personal details and contact information',
      status: getStepStatus(profileData?.personalInfoCompleted || false),
      icon: User
    },
    {
      id: 'identity',
      name: 'Identity Verification',
      description: 'Document verification and identity confirmation',
      status: getStepStatus(profileData?.identityVerified || false),
      icon: Shield
    },
    {
      id: 'professional_background',
      name: 'Professional Background',
      description: 'Work experience, education, and certifications',
      status: getStepStatus(profileData?.professionalBackgroundCompleted || false),
      icon: FileText
    },
    {
      id: 'health_assessment',
      name: 'Health Assessment',
      description: 'Medical history and health information',
      status: getStepStatus(profileData?.healthAssessmentCompleted || false),
      icon: Heart
    },
    {
      id: 'references',
      name: 'References',
      description: 'Professional and personal references',
      status: getStepStatus(profileData?.referencesCompleted || false),
      icon: Users
    },
    {
      id: 'documents',
      name: 'Document Upload',
      description: 'Required certificates and documents',
      status: getStepStatus(profileData?.documentsUploaded || false),
      icon: FileText
    }
  ];

  const allStepsCompleted = onboardingSteps.every(step => step.status === 'completed');

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Profile Submitted Successfully!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for completing your onboarding profile. Your application has been submitted for review.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Document Review</p>
                  <p className="text-sm text-blue-700">Our team will review all uploaded documents within 24-48 hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Reference Verification</p>
                  <p className="text-sm text-blue-700">We'll contact your references to verify your background</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Final Approval</p>
                  <p className="text-sm text-blue-700">Once all checks are complete, you'll receive approval notification</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Name: <span className="font-medium text-gray-900">{profileData?.fullName}</span></p>
                <p className="text-gray-600">Email: <span className="font-medium text-gray-900">{profileData?.email}</span></p>
                <p className="text-gray-600">Phone: <span className="font-medium text-gray-900">{profileData?.phone}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Location: <span className="font-medium text-gray-900">{profileData?.baseCity}</span></p>
                <p className="text-gray-600">Position: <span className="font-medium text-gray-900">{profileData?.jobTitle}</span></p>
                <p className="text-gray-600">Submission Date: <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Submission</h2>
              <p className="text-gray-600 mt-1">Review your completed profile and submit for approval</p>
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

      {/* Profile Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600">Full Name: <span className="font-medium text-gray-900">{profileData?.fullName}</span></p>
            <p className="text-gray-600">Email: <span className="font-medium text-gray-900">{profileData?.email}</span></p>
            <p className="text-gray-600">Phone: <span className="font-medium text-gray-900">{profileData?.phone}</span></p>
          </div>
          <div>
            <p className="text-gray-600">Location: <span className="font-medium text-gray-900">{profileData?.baseCity}</span></p>
            <p className="text-gray-600">Position: <span className="font-medium text-gray-900">{profileData?.jobTitle}</span></p>
            <p className="text-gray-600">Application Date: <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span></p>
            <p className="text-gray-600">Status: <span className={`font-medium ${
              profileData?.applicationStatus === 'approved' ? 'text-green-600' :
              profileData?.applicationStatus === 'rejected' ? 'text-red-600' :
              profileData?.applicationStatus === 'submitted' || profileData?.applicationStatus === 'under_review' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {profileData?.applicationStatus ? profileData.applicationStatus.replace('_', ' ').toUpperCase() : 'DRAFT'}
            </span></p>
          </div>
        </div>
      </div>

      {/* Rejection Feedback */}
      {profileData?.applicationStatus === 'rejected' && profileData?.notes && profileData.notes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Profile Rejected</h4>
              <p className="text-sm text-red-700 mt-1 mb-3">Your profile was rejected. Please review the feedback below and make necessary changes before resubmitting.</p>
              {profileData.notes?.map((note: { content: string; author: string; createdAt: string }, index: number) => (
                <div key={index} className="bg-white p-3 rounded border border-red-200 mb-2">
                  <p className="text-sm text-red-800">{note.content}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {note.author} • {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Steps Review */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Onboarding Progress</h3>
        <div className="space-y-4">
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${getStepColor(step.status)}`}
            >
              <div className="flex items-center space-x-3">
                {getStepIcon(step.status)}
                <div>
                  <p className="font-medium">{step.name}</p>
                  <p className="text-sm opacity-75">{step.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'incomplete' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {step.status === 'completed' ? 'Completed' : 'Incomplete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Before You Submit</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• All required onboarding steps must be completed</li>
              <li>• All uploaded documents will be reviewed by our team</li>
              <li>• References will be contacted for verification</li>
              <li>• You will receive email updates on your application status</li>
              <li>• You can edit your profile after submission if needed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-green-600">Profile submitted successfully!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Documents
        </button>
        
        <div className="flex space-x-4">
          {!allStepsCompleted && (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Complete all required steps to submit</p>
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={loading || !allStepsCompleted}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {profileData?.applicationStatus === 'rejected' ? 'Resubmitting...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {profileData?.applicationStatus === 'rejected' ? 'Resubmit Profile' : 'Submit Profile'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSubmission;
