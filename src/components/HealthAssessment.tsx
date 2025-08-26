import React, { useState, useEffect } from 'react';
import { Heart, Activity, AlertTriangle, CheckCircle, Save, ArrowRight, Plus, Trash2, Pill } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface HealthAssessmentData {
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  bloodType: string;
  height: number;
  weight: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const HealthAssessment = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<HealthAssessmentData>({
    medicalConditions: [],
    allergies: [],
    medications: [],
    bloodType: '',
    height: 0,
    weight: 0,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-save functionality
  const autoSave = useAutoSave(formData, {
    delay: 2000, // 2 seconds
    onSave: async (data) => {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/health-assessment`, {
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

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

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
          if (data.profile && data.profile.healthAssessment) {
            setFormData(prev => ({
              ...prev,
              ...data.profile.healthAssessment
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

    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    }

    if (!formData.emergencyContact.relationship.trim()) {
      newErrors.emergencyRelationship = 'Emergency contact relationship is required';
    }

    if (formData.height <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }

    if (formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
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
      const response = await fetch(`${API_BASE_URL}/profile/health-assessment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ healthAssessment: formData })
      });

      if (response.ok) {
        // Update onboarding step
        await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'health_assessment', completed: true })
        });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save health assessment');
      }
    } catch (error) {
      console.error('Error saving health assessment:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field: keyof HealthAssessmentData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeItem = (field: keyof HealthAssessmentData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateEmergencyContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const calculateBMI = () => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Health Assessment</h2>
              <p className="text-gray-600 mt-1">Please provide your health information and medical history</p>
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
        {/* Basic Health Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Basic Health Information
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm) *
              </label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.height ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="170"
                min="50"
                max="300"
              />
              {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="70"
                min="20"
                max="300"
              />
              {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Body Mass Index (BMI)</p>
                  <p className="text-2xl font-bold text-gray-900">{bmi}</p>
                </div>
                {bmiCategory && (
                  <div className="text-right">
                    <p className={`text-sm font-medium ${bmiCategory.color}`}>
                      {bmiCategory.category}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Medical Conditions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-600" />
            Medical Conditions
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a medical condition"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('medicalConditions', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addItem('medicalConditions', input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.medicalConditions.length > 0 && (
              <div className="space-y-2">
                {formData.medicalConditions.map((condition, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-red-800">{condition}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('medicalConditions', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.medicalConditions.length === 0 && (
              <p className="text-gray-500 text-sm">No medical conditions added yet</p>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Allergies
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add an allergy"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('allergies', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addItem('allergies', input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.allergies.length > 0 && (
              <div className="space-y-2">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <span className="text-yellow-800">{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('allergies', index)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.allergies.length === 0 && (
              <p className="text-gray-500 text-sm">No allergies added yet</p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2 text-purple-600" />
            Current Medications
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a medication"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('medications', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addItem('medications', input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.medications.length > 0 && (
              <div className="space-y-2">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <span className="text-purple-800">{medication}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('medications', index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.medications.length === 0 && (
              <p className="text-gray-500 text-sm">No medications added yet</p>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-600" />
            Emergency Contact
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => updateEmergencyContact('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Emergency contact name"
              />
              {errors.emergencyName && <p className="text-red-500 text-sm mt-1">{errors.emergencyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.emergencyPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => updateEmergencyContact('relationship', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyRelationship ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Spouse, Parent, etc."
              />
              {errors.emergencyRelationship && <p className="text-red-500 text-sm mt-1">{errors.emergencyRelationship}</p>}
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Health Information Privacy</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your health information is protected under HIPAA regulations and will only be used for 
                healthcare-related purposes. This information helps us provide appropriate care and 
                ensure your safety while working.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-600">Health assessment saved successfully!</p>
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
            disabled={loading}
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

export default HealthAssessment;
