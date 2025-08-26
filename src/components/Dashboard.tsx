import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Prescreen from './Prescreen';
import PrescreenResult from './PrescreenResult';
import OnboardingFlow from './OnboardingFlow';

interface OnboardingProgress {
  prescreen_completed: boolean;
  personal_info_completed: boolean;
  identity_verified: boolean;
  professional_background_completed: boolean;
  health_assessment_completed: boolean;
  references_completed: boolean;
  documents_uploaded: boolean;
  profile_submitted: boolean;
}

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'prescreen' | 'prescreen-result' | 'onboarding'>('dashboard');
  const [prescreenResult, setPrescreenResult] = useState<'pass' | 'caution' | 'fail' | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({
    prescreen_completed: false,
    personal_info_completed: false,
    identity_verified: false,
    professional_background_completed: false,
    health_assessment_completed: false,
    references_completed: false,
    documents_uploaded: false,
    profile_submitted: false
  });

  useEffect(() => {
    fetchOnboardingProgress();
  }, []);

  const fetchOnboardingProgress = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !user) {
        setLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedSteps = () => {
    return Object.values(onboardingProgress).filter(Boolean).length;
  };

  const getTotalSteps = () => {
    return Object.keys(onboardingProgress).length;
  };

  const getProgressPercentage = () => {
    return Math.round((getCompletedSteps() / getTotalSteps()) * 100);
  };

  const getStepStatus = (step: keyof OnboardingProgress) => {
    if (onboardingProgress[step]) return 'completed';
    if (step === 'prescreen_completed') return 'current';
    // Find the first incomplete step
    const steps = Object.keys(onboardingProgress) as (keyof OnboardingProgress)[];
    const firstIncomplete = steps.find(s => !onboardingProgress[s]);
    if (step === firstIncomplete) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: keyof OnboardingProgress) => {
    const status = getStepStatus(step);
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      case 'pending':
        return '⏳';
    }
  };

  const getStepTitle = (step: keyof OnboardingProgress) => {
    const titles = {
      prescreen_completed: 'Prescreen Assessment',
      personal_info_completed: 'Personal Information',
      identity_verified: 'Identity Verification',
      professional_background_completed: 'Professional Background',
      health_assessment_completed: 'Health Assessment',
      references_completed: 'References',
      documents_uploaded: 'Document Upload',
      profile_submitted: 'Profile Submission'
    };
    return titles[step];
  };

  const getStepDescription = (step: keyof OnboardingProgress) => {
    const descriptions = {
      prescreen_completed: 'Complete initial assessment to verify eligibility',
      personal_info_completed: 'Provide your personal details and contact information',
      identity_verified: 'Verify your identity with official documents',
      professional_background_completed: 'Share your work experience and qualifications',
      health_assessment_completed: 'Complete health screening and medical history',
      references_completed: 'Provide professional and personal references',
      documents_uploaded: 'Upload required certificates and documents',
      profile_submitted: 'Review and submit your complete profile'
    };
    
    // If the step is completed, show "Update Information" instead of the original description
    const status = getStepStatus(step);
    if (status === 'completed') {
      return 'Update Information';
    }
    
    return descriptions[step];
  };

  const handleStepClick = (step: keyof OnboardingProgress) => {
    if (step === 'prescreen_completed' && !onboardingProgress.prescreen_completed) {
      setCurrentView('prescreen');
    } else if (!onboardingProgress.prescreen_completed) {
      // If prescreen is not completed, show prescreen first
      setCurrentView('prescreen');
    } else {
      // Show full onboarding flow for other steps
      // Map the step to the correct onboarding step
      const stepMapping: Record<string, string> = {
        'personal_info_completed': 'personal_info',
        'identity_verified': 'identity_verification',
        'professional_background_completed': 'professional_background',
        'health_assessment_completed': 'health_assessment',
        'references_completed': 'references',
        'documents_uploaded': 'documents',
        'profile_submitted': 'profile_submission'
      };
      const onboardingStep = stepMapping[step] || 'personal_info';
      setCurrentView('onboarding');
      // Store the target step to be used by OnboardingFlow
      sessionStorage.setItem('targetOnboardingStep', onboardingStep);
    }
  };

  // Handle prescreen completion
  const handlePrescreenComplete = (result: 'pass' | 'caution' | 'fail', data: any) => {
    setPrescreenResult(result);
    setCurrentView('prescreen-result');
    // Update onboarding progress
    setOnboardingProgress(prev => ({
      ...prev,
      prescreen_completed: true
    }));
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setPrescreenResult(null);
    fetchOnboardingProgress(); // Refresh progress
  };

  const handleContinueToOnboarding = () => {
    setCurrentView('onboarding');
  };

  // Render different views
  if (currentView === 'prescreen') {
    return (
      <Prescreen
        applicationId={user?.id || ''} // Using user ID as application ID for now
        jobTitle={profile?.jobTitle || 'nurse'}
        jobSubtype={null}
        city={profile?.baseCity || 'Delhi NCR'}
        onComplete={handlePrescreenComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'prescreen-result' && prescreenResult) {
    return (
      <PrescreenResult
        result={prescreenResult}
        onContinue={handleContinueToOnboarding}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <OnboardingFlow onComplete={handleBackToDashboard} />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.fullName}</h1>
              <p className="text-gray-600">
                {profile?.jobTitle ? profile.jobTitle.charAt(0).toUpperCase() + profile.jobTitle.slice(1) : 'Healthcare Professional'} • Complete your profile
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile Completion</h2>
            <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600">
            {getCompletedSteps()} of {getTotalSteps()} steps completed
          </p>
        </div>

        {/* Application Status */}
        {profile?.applicationStatus && profile.applicationStatus !== 'draft' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.applicationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                profile.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                profile.applicationStatus === 'submitted' || profile.applicationStatus === 'under_review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profile.applicationStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3">
              {profile.applicationStatus === 'approved' && (
                <div className="flex items-center space-x-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Congratulations! Your profile has been approved.</span>
                </div>
              )}
              
              {profile.applicationStatus === 'rejected' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Your profile has been rejected. Please review the feedback below and resubmit.</span>
                  </div>
                  
                  {profile.notes && profile.notes.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Feedback:</h4>
                      {profile.notes.map((note, index) => (
                        <div key={index} className="text-red-700 text-sm">
                          <p className="mb-1">{note.message}</p>
                          <p className="text-red-600 text-xs">{new Date(note.timestamp).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {(profile.applicationStatus === 'submitted' || profile.applicationStatus === 'under_review') && (
                <div className="flex items-center space-x-2 text-blue-700">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Your profile is currently under review by our team.</span>
                </div>
              )}
              
              {profile.submissionDate && (
                <p className="text-sm text-gray-600">
                  Submitted on: {new Date(profile.submissionDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Onboarding Steps */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Onboarding Steps</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {(Object.keys(onboardingProgress) as (keyof OnboardingProgress)[]).map((step, index) => {
                const status = getStepStatus(step);
                const isClickable = status === 'current' || status === 'pending';
                
                return (
                  <div
                    key={step}
                    onClick={() => isClickable && handleStepClick(step)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      status === 'completed' 
                        ? 'border-green-200 bg-green-50' 
                        : status === 'current'
                        ? 'border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-300'
                        : 'border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getStepIcon(step)}</div>
                        <div>
                          <h3 className={`font-medium ${
                            status === 'completed' ? 'text-green-800' : 
                            status === 'current' ? 'text-blue-800' : 'text-gray-600'
                          }`}>
                            {getStepTitle(step)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {getStepDescription(step)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {status === 'completed' && (
                          <span className="text-sm text-green-600 font-medium">Completed</span>
                        )}
                        {status === 'current' && (
                          <span className="text-sm text-blue-600 font-medium">Continue</span>
                        )}
                        {status === 'pending' && (
                          <span className="text-sm text-gray-500">Locked</span>
                        )}
                        {isClickable && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Review & Update button for completed steps */}
                    {status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <button
                          onClick={() => handleStepClick(step)}
                          className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Review & Update</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {getProgressPercentage() === 100 && !profile?.applicationStatus && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Profile Complete!</h3>
                <p className="text-green-700 mt-1">Your profile is ready for submission. Click below to submit for review.</p>
              </div>
              <button 
                onClick={() => handleStepClick('profile_submitted')}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Submit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
