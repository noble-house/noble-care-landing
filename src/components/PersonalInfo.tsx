import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, MapPin, Heart, Save, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface PersonalInfoData {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
  }>;
}

const PersonalInfo = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<PersonalInfoData>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContacts: [
      {
        name: '',
        phone: '',
        relationship: '',
        isPrimary: true
      }
    ]
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

      const response = await fetch(`${API_BASE_URL}/profile/auto-save/personal-info`, {
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
    // Prefill form with existing profile data
    if (profile) {
      setFormData(prev => {
        let emergencyContacts = profile.emergencyContacts || prev.emergencyContacts;
        
        // If no emergency contacts exist but we have prescreen emergency contact data, use that
        if ((!emergencyContacts || emergencyContacts.length === 0) && 
            profile.prescreenData?.emergencyContact && 
            profile.prescreenData.emergencyContact.name && 
            profile.prescreenData.emergencyContact.phone) {
          emergencyContacts = [{
            name: profile.prescreenData.emergencyContact.name,
            phone: profile.prescreenData.emergencyContact.phone,
            relationship: profile.prescreenData.emergencyContact.relationship || 'Emergency Contact',
            isPrimary: true
          }];
        }
        
        return {
          ...prev,
          fullName: profile.fullName || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: profile.gender || '',
          address: profile.address || prev.address,
          emergencyContacts: emergencyContacts
        };
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    // Validate emergency contacts
    formData.emergencyContacts.forEach((contact, index) => {
      if (!contact.name.trim()) {
        newErrors[`emergencyName${index}`] = 'Emergency contact name is required';
      }
      if (!contact.phone.trim()) {
        newErrors[`emergencyPhone${index}`] = 'Emergency contact phone is required';
      }
      if (!contact.relationship.trim()) {
        newErrors[`emergencyRelationship${index}`] = 'Relationship is required';
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

      console.log('Saving personal info:', formData);
      const response = await fetch(`${API_BASE_URL}/profile/personal-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Personal info response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Personal info saved successfully:', responseData);
        
        // Update onboarding step
        console.log('Updating onboarding step to personal_info');
        const stepResponse = await fetch(`${API_BASE_URL}/profile/onboarding-step`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ step: 'personal_info', completed: true })
        });
        
        console.log('Step update response status:', stepResponse.status);
        if (stepResponse.ok) {
          const stepData = await stepResponse.json();
          console.log('Step updated successfully:', stepData);
        } else {
          const stepError = await stepResponse.json();
          console.error('Step update failed:', stepError);
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onNext();
      } else {
        const errorData = await response.json();
        console.error('Personal info save failed:', errorData);
        throw new Error(errorData.message || 'Failed to save personal information');
      }
    } catch (error) {
      console.error('Error saving personal information:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' });
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: '', phone: '', relationship: '', isPrimary: false }
      ]
    }));
  };

  const removeEmergencyContact = (index: number) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
      }));
    }
  };

  const updateEmergencyContact = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with Auto-save Indicator */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600 mt-1">Please provide your personal details and contact information</p>
              {(profile?.fullName || profile?.prescreenData?.emergencyContact) && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Note:</span> Some fields have been pre-filled with information from your registration and prescreen assessment. 
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

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name * {profile?.fullName && <span className="text-green-600 text-xs">(Pre-filled)</span>}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? 'border-red-500' : profile?.fullName ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number * {profile?.phone && <span className="text-green-600 text-xs">(Pre-filled)</span>}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : profile?.phone ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="(555) 123-4567"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formatDateForInput(formData.dateOfBirth)}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Address Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street"
                />
                {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="State"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zipCode: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.zipCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345"
                  />
                  {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-600" />
                Emergency Contacts
              </h3>
              <button
                type="button"
                onClick={addEmergencyContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Contact
              </button>
            </div>
            
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">
                    Emergency Contact {index + 1}
                    {contact.isPrimary && <span className="text-blue-600 ml-2">(Primary)</span>}
                  </h4>
                  {formData.emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmergencyContact(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`emergencyName${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Contact name"
                    />
                    {errors[`emergencyName${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`emergencyName${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`emergencyPhone${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {errors[`emergencyPhone${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`emergencyPhone${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`emergencyRelationship${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Spouse, Parent, etc."
                    />
                    {errors[`emergencyRelationship${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`emergencyRelationship${index}`]}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(e) => updateEmergencyContact(index, 'isPrimary', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Primary emergency contact</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">Personal information saved successfully!</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.submit}</p>
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
    </div>
  );
};

export default PersonalInfo;
