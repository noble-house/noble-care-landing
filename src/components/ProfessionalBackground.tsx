import React, { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Award, Plus, Trash2, Save, ArrowRight, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  field: string;
  graduationYear: number;
  gpa: number;
}

interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
}

interface ProfessionalBackgroundData {
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
}

const ProfessionalBackground = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<ProfessionalBackgroundData>({
    experience: [],
    education: [],
    certifications: []
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

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/professional-background`, {
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

  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as yyyy-MM-dd for HTML date input
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

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
          if (data.profile) {
            setFormData(prev => ({
              ...prev,
              experience: data.profile.experience || [],
              education: data.profile.education || [],
              certifications: data.profile.certifications || []
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

    // Validate experience
    formData.experience.forEach((exp, index) => {
      if (!exp.title.trim()) {
        newErrors[`expTitle${index}`] = 'Job title is required';
      }
      if (!exp.company.trim()) {
        newErrors[`expCompany${index}`] = 'Company name is required';
      }
      if (!exp.startDate) {
        newErrors[`expStartDate${index}`] = 'Start date is required';
      }
      if (!exp.current && !exp.endDate) {
        newErrors[`expEndDate${index}`] = 'End date is required';
      }
    });

    // Validate education
    formData.education.forEach((edu, index) => {
      if (!edu.degree.trim()) {
        newErrors[`eduDegree${index}`] = 'Degree is required';
      }
      if (!edu.institution.trim()) {
        newErrors[`eduInstitution${index}`] = 'Institution is required';
      }
      if (!edu.graduationYear) {
        newErrors[`eduGraduationYear${index}`] = 'Graduation year is required';
      }
    });

    // Validate certifications
    formData.certifications.forEach((cert, index) => {
      if (!cert.name.trim()) {
        newErrors[`certName${index}`] = 'Certification name is required';
      }
      if (!cert.issuingOrganization.trim()) {
        newErrors[`certOrg${index}`] = 'Issuing organization is required';
      }
      if (!cert.issueDate) {
        newErrors[`certIssueDate${index}`] = 'Issue date is required';
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

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/professional-background`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Update onboarding step
        await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'professional_background', completed: true })
        });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save professional background');
      }
    } catch (error) {
      console.error('Error saving professional background:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  // Experience functions
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: ''
        }
      ]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  // Education functions
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: '',
          institution: '',
          field: '',
          graduationYear: new Date().getFullYear(),
          gpa: 0
        }
      ]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Certification functions
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: '',
          issuingOrganization: '',
          issueDate: '',
          expiryDate: '',
          credentialId: ''
        }
      ]
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Professional Background</h2>
        <p className="text-gray-600">Share your work experience, education, and certifications</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Work Experience */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Work Experience
            </h3>
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Experience
            </button>
          </div>

          {formData.experience.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No work experience added yet</p>
              <p className="text-sm">Click "Add Experience" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`expTitle${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Registered Nurse"
                      />
                      {errors[`expTitle${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`expTitle${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`expCompany${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., City General Hospital"
                      />
                      {errors[`expCompany${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`expCompany${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., New York, NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(exp.startDate)}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`expStartDate${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`expStartDate${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`expStartDate${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(exp.endDate)}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        disabled={exp.current}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`expEndDate${index}`] ? 'border-red-500' : 'border-gray-300'
                        } ${exp.current ? 'bg-gray-100' : ''}`}
                      />
                      {errors[`expEndDate${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`expEndDate${index}`]}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">I currently work here</span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your responsibilities and achievements..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
              Education
            </h3>
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Education
            </button>
          </div>

          {formData.education.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No education added yet</p>
              <p className="text-sm">Click "Add Education" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`eduDegree${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Bachelor of Science in Nursing"
                      />
                      {errors[`eduDegree${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`eduDegree${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`eduInstitution${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., University of California"
                      />
                      {errors[`eduInstitution${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`eduInstitution${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Nursing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Graduation Year *
                      </label>
                      <input
                        type="number"
                        value={edu.graduationYear}
                        onChange={(e) => updateEducation(index, 'graduationYear', parseInt(e.target.value))}
                        min="1900"
                        max={new Date().getFullYear() + 10}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`eduGraduationYear${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="2020"
                      />
                      {errors[`eduGraduationYear${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`eduGraduationYear${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GPA (Optional)
                      </label>
                      <input
                        type="number"
                        value={edu.gpa}
                        onChange={(e) => updateEducation(index, 'gpa', parseFloat(e.target.value))}
                        min="0"
                        max="4"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Certifications
            </h3>
            <button
              type="button"
              onClick={addCertification}
              className="flex items-center px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Certification
            </button>
          </div>

          {formData.certifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No certifications added yet</p>
              <p className="text-sm">Click "Add Certification" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Certification {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certification Name *
                      </label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`certName${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Basic Life Support (BLS)"
                      />
                      {errors[`certName${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`certName${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issuing Organization *
                      </label>
                      <input
                        type="text"
                        value={cert.issuingOrganization}
                        onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`certOrg${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., American Heart Association"
                      />
                      {errors[`certOrg${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`certOrg${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Date *
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(cert.issueDate)}
                        onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`certIssueDate${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`certIssueDate${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`certIssueDate${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formatDateForInput(cert.expiryDate)}
                        onChange={(e) => updateCertification(index, 'expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credential ID
                      </label>
                      <input
                        type="text"
                        value={cert.credentialId}
                        onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., BLS-123456"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <p className="text-green-600">Professional background data saved successfully!</p>
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

export default ProfessionalBackground;