import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Prescreen from './Prescreen';
import PersonalInfo from './PersonalInfo';
import IdentityVerification from './IdentityVerification';
import ProfessionalBackground from './ProfessionalBackground';
import HealthAssessment from './HealthAssessment';
import References from './References';
import DocumentUpload from './DocumentUpload';
import ProfileSubmission from './ProfileSubmission';
import { CheckCircle, Clock, Lock, ArrowLeft, Home } from 'lucide-react';

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

type OnboardingStep = 
  | 'prescreen'
  | 'personal_info'
  | 'identity_verification'
  | 'professional_background'
  | 'health_assessment'
  | 'references'
  | 'documents'
  | 'profile_submission';

const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('prescreen');
  const [loading, setLoading] = useState(true);
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

  const steps: Array<{
    id: OnboardingStep;
    title: string;
    description: string;
    component: React.ComponentType<any>;
  }> = [
    {
      id: 'prescreen',
      title: 'Prescreen Assessment',
      description: 'Complete initial qualification assessment',
      component: Prescreen
    },
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Provide your personal details and contact information',
      component: PersonalInfo
    },
    {
      id: 'identity_verification',
      title: 'Identity Verification',
      description: 'Verify your identity with official documents',
      component: IdentityVerification
    },
    {
      id: 'professional_background',
      title: 'Professional Background',
      description: 'Share your work experience and qualifications',
      component: ProfessionalBackground
    },
    {
      id: 'health_assessment',
      title: 'Health Assessment',
      description: 'Complete health screening and medical history',
      component: HealthAssessment
    },
    {
      id: 'references',
      title: 'References',
      description: 'Provide professional and personal references',
      component: References
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required certificates and documents',
      component: DocumentUpload
    },
    {
      id: 'profile_submission',
      title: 'Profile Submission',
      description: 'Review and submit your complete profile',
      component: ProfileSubmission
    }
  ];

  useEffect(() => {
    fetchOnboardingProgress();
  }, []);

  useEffect(() => {
    // Check if there's a target step from Dashboard
    const targetStep = sessionStorage.getItem('targetOnboardingStep');
    if (targetStep && steps.find(step => step.id === targetStep)) {
      setCurrentStep(targetStep as OnboardingStep);
      sessionStorage.removeItem('targetOnboardingStep'); // Clear after use
    }
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
        
        // Only set current step if it's still the default 'prescreen'
        // This allows users to navigate to specific steps from Dashboard
        if (currentStep === 'prescreen') {
          const currentStepIndex = determineCurrentStep(data.progress);
          setCurrentStep(steps[currentStepIndex].id);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineCurrentStep = (progress: OnboardingProgress): number => {
    if (!progress.prescreen_completed) return 0;
    if (!progress.personal_info_completed) return 1;
    if (!progress.identity_verified) return 2;
    if (!progress.professional_background_completed) return 3;
    if (!progress.health_assessment_completed) return 4;
    if (!progress.references_completed) return 5;
    if (!progress.documents_uploaded) return 6;
    if (!progress.profile_submitted) return 7;
    return 7; // All completed
  };

  const getStepStatus = (stepId: OnboardingStep) => {
    const progressKey = stepId === 'prescreen' ? 'prescreen_completed' :
                       stepId === 'personal_info' ? 'personal_info_completed' :
                       stepId === 'identity_verification' ? 'identity_verified' :
                       stepId === 'professional_background' ? 'professional_background_completed' :
                       stepId === 'health_assessment' ? 'health_assessment_completed' :
                       stepId === 'references' ? 'references_completed' :
                       stepId === 'documents' ? 'documents_uploaded' :
                       'profile_submitted';
    
    return onboardingProgress[progressKey as keyof OnboardingProgress];
  };

  const getStepIcon = (stepId: OnboardingStep) => {
    const isCompleted = getStepStatus(stepId);
    const isCurrent = currentStep === stepId;
    
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (isCurrent) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    } else {
      return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (stepId: OnboardingStep) => {
    const isCompleted = getStepStatus(stepId);
    const isCurrent = currentStep === stepId;
    
    if (isCompleted) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (isCurrent) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: OnboardingStep) => {
    // Only allow navigation to completed steps or the next available step
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    const targetIndex = steps.findIndex(step => step.id === stepId);
    
    if (getStepStatus(stepId) || targetIndex <= currentIndex + 1) {
      setCurrentStep(stepId);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </button>
              <div className="text-gray-400">|</div>
              <h1 className="text-xl font-semibold text-gray-900">Onboarding</h1>
            </div>
            <div className="text-sm text-gray-500">
              Step {steps.findIndex(step => step.id === currentStep) + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Progress Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = getStepStatus(step.id);
                  const isCurrent = currentStep === step.id;
                  const isAccessible = isCompleted || steps.findIndex(s => s.id === currentStep) >= index;
                  
                  return (
                    <div key={step.id} className="space-y-2">
                      <button
                        onClick={() => handleStepClick(step.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${getStepColor(step.id)} ${
                          isAccessible
                            ? 'cursor-pointer hover:bg-opacity-80'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        disabled={!isAccessible}
                      >
                        <div className="flex items-center space-x-3">
                          {getStepIcon(step.id)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{step.title}</p>
                            <p className="text-xs opacity-75 truncate">
                              {isCompleted ? 'Completed' : step.description}
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      {/* Review/Update button for completed steps */}
                      {isCompleted && (
                        <button
                          onClick={() => handleStepClick(step.id)}
                          className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Review & Update</span>
                        </button>
                      )}
                      
                      
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((Object.values(onboardingProgress).filter(Boolean).length / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(Object.values(onboardingProgress).filter(Boolean).length / steps.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Review/Update indicator */}
              {getStepStatus(currentStep) && (
                <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-green-800">
                      Reviewing & Updating: {currentStepData?.title}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    You can modify your previously submitted information
                  </p>
                </div>
              )}
              
              {CurrentComponent && (
                <CurrentComponent
                  onNext={handleNext}
                  onBack={handleBack}
                  onComplete={handleComplete}
                  // Additional props for Prescreen component
                  applicationId={user?.id || ''}
                  jobTitle={profile?.jobTitle || 'nurse'}
                  jobSubtype={null}
                  city={profile?.baseCity || 'Delhi NCR'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
