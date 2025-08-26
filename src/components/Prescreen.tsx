import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';
import { CheckCircle } from 'lucide-react'; // Added import for CheckCircle icon

interface PrescreenData {
  experience_months: number;
  icu_exposure: boolean;
  ventilator_handling: boolean;
  shift_preference: '12h' | '24h' | 'either';
  travel_km: number;
  languages: string[];
  education_level: string;
  certifications: string[];
  availability: 'immediate' | '1_week' | '2_weeks' | '1_month';
  salary_expectation: number;
  current_location: string;
  willing_to_relocate: boolean;
  preferred_cities: string[];
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface PrescreenProps {
  applicationId: string;
  jobTitle: string;
  jobSubtype: string | null;
  city: string;
  onComplete: (result: 'pass' | 'caution' | 'fail', data: PrescreenData) => void;
  onBack: () => void;
}

const Prescreen: React.FC<PrescreenProps> = ({
  applicationId,
  jobTitle,
  jobSubtype,
  city,
  onComplete,
  onBack
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<PrescreenData>({
    experience_months: 0,
    icu_exposure: false,
    ventilator_handling: false,
    shift_preference: 'either',
    travel_km: 0,
    languages: [],
    education_level: '',
    certifications: [],
    availability: 'immediate',
    salary_expectation: 0,
    current_location: '',
    willing_to_relocate: false,
    preferred_cities: [],
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-save functionality
  const autoSave = useAutoSave(data, {
    delay: 2000, // 2 seconds
    onSave: async (formData) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/prescreen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save');
      }
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    }
  });

  // Load existing prescreen data
  useEffect(() => {
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
          console.log('Loaded profile data for prescreen:', data.profile);
          if (data.profile && data.profile.prescreenData) {
            console.log('Found prescreen data:', data.profile.prescreenData);
            
            // Map backend field names to frontend field names
            const mappedData = {
              experience_months: data.profile.prescreenData.experienceMonths || 0,
              icu_exposure: data.profile.prescreenData.icuExposure || false,
              ventilator_handling: data.profile.prescreenData.ventilatorHandling || false,
              shift_preference: data.profile.prescreenData.shiftPreference || 'either',
              travel_km: data.profile.prescreenData.travelKm || 0,
              languages: data.profile.prescreenData.languages || [],
              education_level: data.profile.prescreenData.educationLevel || '',
              certifications: data.profile.prescreenData.certifications || [],
              availability: data.profile.prescreenData.availability || 'immediate',
              salary_expectation: data.profile.prescreenData.salaryExpectation || 0,
              current_location: data.profile.prescreenData.currentLocation || '',
              willing_to_relocate: data.profile.prescreenData.willingToRelocate || false,
              preferred_cities: data.profile.prescreenData.preferredCities || [],
              emergency_contact: {
                name: data.profile.prescreenData.emergencyContact?.name || '',
                phone: data.profile.prescreenData.emergencyContact?.phone || '',
                relationship: data.profile.prescreenData.emergencyContact?.relationship || ''
              }
            };
            
            console.log('Mapped prescreen data for frontend:', mappedData);
            setData(mappedData);
          } else {
            console.log('No prescreen data found in profile');
          }
        }
      } catch (error) {
        console.error('Error loading prescreen data:', error);
      }
    };

    loadExistingData();
  }, []);

  // Available options
  const languageOptions = ['English', 'Hindi', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Odia', 'Assamese'];
  const educationOptions = ['High School', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'];
  const certificationOptions = ['BLS', 'ACLS', 'PALS', 'NALS', 'NICU', 'PICU', 'ICU', 'Emergency Nursing', 'Critical Care', 'Oncology', 'Pediatric', 'Geriatric', 'Mental Health', 'Other'];

  // Real-time validation
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'experience_months':
        if (value < 0) return 'Experience cannot be negative';
        if (value > 50) return 'Experience seems too high';
        break;
      case 'travel_km':
        if (value < 0) return 'Distance cannot be negative';
        if (value > 1000) return 'Distance seems too high';
        break;
      case 'salary_expectation':
        if (value < 5000) return 'Salary expectation seems too low';
        if (value > 500000) return 'Salary expectation seems too high';
        break;
      case 'emergency_contact.name':
        if (!value.trim()) return 'Emergency contact name is required';
        break;
      case 'emergency_contact.phone':
        if (!value.trim()) return 'Emergency contact phone is required';
        if (!/^[0-9+\-\s()]{10,15}$/.test(value)) return 'Invalid phone number format';
        break;
      case 'emergency_contact.relationship':
        if (!value.trim()) return 'Relationship is required';
        break;
      case 'current_location':
        if (!value.trim()) return 'Current location is required';
        break;
    }
    return '';
  };

  const handleFieldChange = (field: string, value: any) => {
    setData(prev => {
      const newData = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'emergency_contact') {
          newData.emergency_contact = {
            ...newData.emergency_contact,
            [child]: value
          };
        }
      } else {
        (newData as any)[field] = value;
      }
      return newData;
    });

    // Clear error when user starts typing
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleCertificationToggle = (cert: string) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    const requiredFields = [
      'experience_months',
      'current_location',
      'emergency_contact.name',
      'emergency_contact.phone',
      'emergency_contact.relationship'
    ];

    requiredFields.forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj[key as keyof any], data as any)
        : data[field as keyof PrescreenData];
      
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    // Job-specific validations
    if (jobTitle === 'nurse') {
      if (data.languages.length === 0) {
        newErrors.languages = 'At least one language is required';
      }
      if (!data.education_level) {
        newErrors.education_level = 'Education level is required for nurses';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/profile/prescreen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save progress error:', response.status, errorText);
        throw new Error(`Failed to save progress: ${response.status} - ${errorText}`);
      }

      console.log('Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const evaluatePrescreen = async (): Promise<'pass' | 'caution' | 'fail'> => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Get requirement matrix for this job/city
      const matrixResponse = await fetch(
        `${API_BASE_URL}/requirements/matrix?jobTitle=${jobTitle}&city=${city}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!matrixResponse.ok) {
        throw new Error('Failed to fetch requirements');
      }

      const matrixData = await matrixResponse.json();
      const requirements = matrixData.requirements;

      if (!requirements) {
        // No specific requirements found, use default logic
        return evaluateDefaultLogic();
      }

      // Evaluate against specific requirements
      return evaluateAgainstRequirements(requirements, data);
    } catch (error) {
      console.error('Error evaluating prescreen:', error);
      return evaluateDefaultLogic();
    }
  };

  const evaluateDefaultLogic = (): 'pass' | 'caution' | 'fail' => {
    let score = 0;
    let maxScore = 0;

    // Experience scoring
    maxScore += 30;
    if (data.experience_months >= 24) score += 30;
    else if (data.experience_months >= 12) score += 20;
    else if (data.experience_months >= 6) score += 10;

    // ICU experience
    maxScore += 20;
    if (data.icu_exposure) score += 20;

    // Languages
    maxScore += 15;
    score += Math.min(data.languages.length * 5, 15);

    // Education
    maxScore += 15;
    if (data.education_level === 'Bachelor\'s Degree') score += 15;
    else if (data.education_level === 'Diploma') score += 10;
    else if (data.education_level === 'High School') score += 5;

    // Certifications
    maxScore += 20;
    score += Math.min(data.certifications.length * 5, 20);

    const percentage = (score / maxScore) * 100;

    if (percentage >= 80) return 'pass';
    if (percentage >= 60) return 'caution';
    return 'fail';
  };

  const evaluateAgainstRequirements = (requirements: any, data: PrescreenData): 'pass' | 'caution' | 'fail' => {
    // This would implement the specific logic based on requirement_matrix
    // For now, using default logic
    return evaluateDefaultLogic();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      // First, auto-save any pending changes
      await autoSave.saveNow();

      // Evaluate prescreen
      const result = await evaluatePrescreen();

      // Save prescreen data to the new endpoint
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const prescreenResponse = await fetch(`${API_BASE_URL}/profile/prescreen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!prescreenResponse.ok) {
        const errorText = await prescreenResponse.text();
        console.error('Save prescreen data error:', prescreenResponse.status, errorText);
        throw new Error(`Failed to save prescreen data: ${prescreenResponse.status} - ${errorText}`);
      }

      // Update profile with result and basic info
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescreenResult: result,
          prescreenCompleted: true,
          baseCity: data.current_location || '',
          languages: data.languages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update profile error:', response.status, errorText);
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onComplete(result, data);
    } catch (error) {
      console.error('Error submitting prescreen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prescreen Assessment</h1>
                <p className="text-gray-600 mt-1">
                  {jobTitle ? jobTitle.charAt(0).toUpperCase() + jobTitle.slice(1) : 'Healthcare Professional'} position in {city}
                  {jobSubtype && ` - ${jobSubtype}`}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <AutoSaveIndicator
                  isSaving={autoSave.isSaving}
                  isSaved={autoSave.isSaved}
                  hasUnsavedChanges={autoSave.hasUnsavedChanges}
                  lastSaved={autoSave.lastSaved}
                  error={autoSave.error}
                  onSaveNow={autoSave.saveNow}
                />
                <button
                  onClick={onBack}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      value={data.experience_months / 12}
                      onChange={(e) => handleFieldChange('experience_months', Math.round(parseFloat(e.target.value) * 12))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.experience_months ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      max="50"
                      step="0.5"
                    />
                    {errors.experience_months && (
                      <p className="mt-1 text-sm text-red-600">{errors.experience_months}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Location *
                    </label>
                    <input
                      type="text"
                      value={data.current_location}
                      onChange={(e) => handleFieldChange('current_location', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.current_location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Delhi NCR"
                    />
                    {errors.current_location && (
                      <p className="mt-1 text-sm text-red-600">{errors.current_location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job-Specific Questions */}
              {jobTitle === 'nurse' && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Nursing Experience</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ICU Experience
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={data.icu_exposure}
                            onChange={() => handleFieldChange('icu_exposure', true)}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!data.icu_exposure}
                            onChange={() => handleFieldChange('icu_exposure', false)}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ventilator Handling Experience
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={data.ventilator_handling}
                            onChange={() => handleFieldChange('ventilator_handling', true)}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!data.ventilator_handling}
                            onChange={() => handleFieldChange('ventilator_handling', false)}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education Level *
                    </label>
                    <select
                      value={data.education_level}
                      onChange={(e) => handleFieldChange('education_level', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.education_level ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select education level</option>
                      {educationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.education_level && (
                      <p className="mt-1 text-sm text-red-600">{errors.education_level}</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {certificationOptions.map(cert => (
                        <label key={cert} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={data.certifications.includes(cert)}
                            onChange={() => handleCertificationToggle(cert)}
                            className="mr-2"
                          />
                          {cert}
                        </label>
                      ))}
                    </div>
                    {errors.certifications && (
                      <p className="mt-1 text-sm text-red-600">{errors.certifications}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Languages */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Languages</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languageOptions.map(language => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={data.languages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="mr-2"
                      />
                      {language}
                    </label>
                  ))}
                </div>
                {errors.languages && (
                  <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
                )}
              </div>

              {/* Preferences */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Preferences</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift Preference
                    </label>
                    <select
                      value={data.shift_preference}
                      onChange={(e) => handleFieldChange('shift_preference', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="either">Either 12h or 24h</option>
                      <option value="12h">12-hour shifts only</option>
                      <option value="24h">24-hour shifts only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Travel Distance (km)
                    </label>
                    <input
                      type="number"
                      value={data.travel_km}
                      onChange={(e) => handleFieldChange('travel_km', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      value={data.availability}
                      onChange={(e) => handleFieldChange('availability', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="1_week">Within 1 week</option>
                      <option value="2_weeks">Within 2 weeks</option>
                      <option value="1_month">Within 1 month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Salary (₹/month)
                    </label>
                    <input
                      type="number"
                      value={data.salary_expectation}
                      onChange={(e) => handleFieldChange('salary_expectation', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5000"
                      max="500000"
                      step="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={data.emergency_contact.name}
                      onChange={(e) => handleFieldChange('emergency_contact.name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors['emergency_contact.name'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['emergency_contact.name'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['emergency_contact.name']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={data.emergency_contact.phone}
                      onChange={(e) => handleFieldChange('emergency_contact.phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors['emergency_contact.phone'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors['emergency_contact.phone'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['emergency_contact.phone']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      value={data.emergency_contact.relationship}
                      onChange={(e) => handleFieldChange('emergency_contact.relationship', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors['emergency_contact.relationship'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Spouse, Parent"
                    />
                    {errors['emergency_contact.relationship'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['emergency_contact.relationship']}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">Prescreen assessment saved successfully!</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Evaluating...' : 'Submit Prescreen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prescreen;
