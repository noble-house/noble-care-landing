import React, { useState, useEffect } from 'react';
import { Users, User, Building, Plus, Trash2, Save, ArrowRight, Mail, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface Reference {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
  type: 'professional' | 'personal';
  yearsKnown: number;
  canContact: boolean;
}

interface ReferencesData {
  references: Reference[];
}

const References = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<ReferencesData>({
    references: []
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

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/references`, {
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

        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile && data.profile.references) {
            setFormData(prev => ({
              ...prev,
              references: data.profile.references.map((ref: any) => ({
                ...ref,
                type: ref.type || 'professional',
                yearsKnown: ref.yearsKnown || 1,
                canContact: ref.canContact !== undefined ? ref.canContact : true
              }))
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

    // Check if we have at least 2 professional references
    const professionalRefs = formData.references.filter(ref => ref.type === 'professional');
    if (professionalRefs.length < 2) {
      newErrors.references = 'At least 2 professional references are required';
    }

    // Check if we have at least 1 personal reference
    const personalRefs = formData.references.filter(ref => ref.type === 'personal');
    if (personalRefs.length < 1) {
      newErrors.references = 'At least 1 personal reference is required';
    }

    // Validate each reference
    formData.references.forEach((ref, index) => {
      if (!ref.name.trim()) {
        newErrors[`refName${index}`] = 'Reference name is required';
      }
      if (!ref.email.trim()) {
        newErrors[`refEmail${index}`] = 'Reference email is required';
      }
      if (!ref.phone.trim()) {
        newErrors[`refPhone${index}`] = 'Reference phone is required';
      }
      if (!ref.relationship.trim()) {
        newErrors[`refRelationship${index}`] = 'Relationship is required';
      }
      if (ref.yearsKnown <= 0) {
        newErrors[`refYearsKnown${index}`] = 'Years known must be greater than 0';
      }
    });

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

      const response = await fetch(`${API_BASE_URL}/profile/references`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ references: formData.references })
      });

      if (response.ok) {
        // Update onboarding step
        await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'references', completed: true })
        });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save references');
      }
    } catch (error) {
      console.error('Error saving references:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  const addReference = (type: 'professional' | 'personal') => {
    const newReference: Reference = {
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      relationship: '',
      type,
      yearsKnown: 1,
      canContact: true
    };

    setFormData(prev => ({
      ...prev,
      references: [...prev.references, newReference]
    }));
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const updateReference = (index: number, field: keyof Reference, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const getProfessionalReferences = () => formData.references.filter(ref => ref.type === 'professional');
  const getPersonalReferences = () => formData.references.filter(ref => ref.type === 'personal');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">References</h2>
              <p className="text-gray-600 mt-1">Please provide professional and personal references</p>
              {profile?.references && profile.references.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Note:</span> Some reference information has been pre-filled from your previous entries. 
                    You can review and update them if needed.
                  </p>
                </div>
              )}
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
        {/* Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Reference Requirements</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• At least 2 professional references (supervisors, colleagues, clients)</li>
                <li>• At least 1 personal reference (family, friends, community members)</li>
                <li>• All references must be contactable and willing to provide a reference</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Professional References */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Professional References
              <span className="ml-2 text-sm text-gray-500">
                ({getProfessionalReferences().length}/2 minimum)
              </span>
            </h3>
            <button
              type="button"
              onClick={() => addReference('professional')}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Professional Reference
            </button>
          </div>

          {getProfessionalReferences().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No professional references added yet</p>
              <p className="text-sm">Click "Add Professional Reference" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.references
                .map((ref, index) => ({ ref, index }))
                .filter(({ ref }) => ref.type === 'professional')
                .map(({ ref, index }) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Professional Reference {getProfessionalReferences().findIndex(r => r === ref) + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refName${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="John Doe"
                        />
                        {errors[`refName${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refName${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={ref.title}
                          onChange={(e) => updateReference(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Manager, Supervisor, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company/Organization
                        </label>
                        <input
                          type="text"
                          value={ref.company}
                          onChange={(e) => updateReference(index, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship *
                        </label>
                        <input
                          type="text"
                          value={ref.relationship}
                          onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refRelationship${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Supervisor, Colleague, Client"
                        />
                        {errors[`refRelationship${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refRelationship${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={ref.email}
                            onChange={(e) => updateReference(index, 'email', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`refEmail${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="john.doe@company.com"
                          />
                        </div>
                        {errors[`refEmail${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refEmail${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={ref.phone}
                            onChange={(e) => updateReference(index, 'phone', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`refPhone${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        {errors[`refPhone${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refPhone${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years Known *
                        </label>
                        <input
                          type="number"
                          value={ref.yearsKnown}
                          onChange={(e) => updateReference(index, 'yearsKnown', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refYearsKnown${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min="1"
                          max="50"
                          placeholder="2"
                        />
                        {errors[`refYearsKnown${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refYearsKnown${index}`]}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={ref.canContact}
                            onChange={(e) => updateReference(index, 'canContact', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            This reference has agreed to be contacted
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Personal References */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Personal References
              <span className="ml-2 text-sm text-gray-500">
                ({getPersonalReferences().length}/1 minimum)
              </span>
            </h3>
            <button
              type="button"
              onClick={() => addReference('personal')}
              className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Personal Reference
            </button>
          </div>

          {getPersonalReferences().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No personal references added yet</p>
              <p className="text-sm">Click "Add Personal Reference" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.references
                .map((ref, index) => ({ ref, index }))
                .filter(({ ref }) => ref.type === 'personal')
                .map(({ ref, index }) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Personal Reference {getPersonalReferences().findIndex(r => r === ref) + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refName${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Jane Smith"
                        />
                        {errors[`refName${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refName${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship *
                        </label>
                        <input
                          type="text"
                          value={ref.relationship}
                          onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refRelationship${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Friend, Family Member, Neighbor"
                        />
                        {errors[`refRelationship${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refRelationship${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={ref.email}
                            onChange={(e) => updateReference(index, 'email', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`refEmail${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="jane.smith@email.com"
                          />
                        </div>
                        {errors[`refEmail${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refEmail${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={ref.phone}
                            onChange={(e) => updateReference(index, 'phone', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`refPhone${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        {errors[`refPhone${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refPhone${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years Known *
                        </label>
                        <input
                          type="number"
                          value={ref.yearsKnown}
                          onChange={(e) => updateReference(index, 'yearsKnown', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`refYearsKnown${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min="1"
                          max="50"
                          placeholder="5"
                        />
                        {errors[`refYearsKnown${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`refYearsKnown${index}`]}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={ref.canContact}
                            onChange={(e) => updateReference(index, 'canContact', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            This reference has agreed to be contacted
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Reference Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Reference Summary</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Professional References: <span className="font-medium text-gray-900">{getProfessionalReferences().length}</span></p>
              <p className="text-gray-600">Personal References: <span className="font-medium text-gray-900">{getPersonalReferences().length}</span></p>
            </div>
            <div>
              <p className="text-gray-600">Total References: <span className="font-medium text-gray-900">{formData.references.length}</span></p>
              <p className="text-gray-600">Contactable: <span className="font-medium text-gray-900">{formData.references.filter(ref => ref.canContact).length}</span></p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {errors.references && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.references}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">References saved successfully!</p>
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

export default References;
