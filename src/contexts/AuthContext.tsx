import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  baseCity: string;
  languages: string[];
  accountRole: string;
  jobTitle: string;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
  // Onboarding completion status
  prescreenCompleted?: boolean;
  personalInfoCompleted?: boolean;
  identityVerified?: boolean;
  professionalBackgroundCompleted?: boolean;
  healthAssessmentCompleted?: boolean;
  referencesCompleted?: boolean;
  documentsUploaded?: boolean;
  profileSubmitted?: boolean;
  // Application status
  applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submissionDate?: string;
  // Additional fields for onboarding steps
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
  }>;
  references?: Array<{
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
    relationship: string;
    type?: string;
    yearsKnown?: number;
    canContact?: boolean;
  }>;
  // Prescreen data
  prescreenData?: {
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  // Notes and feedback
  notes?: Array<{
    message: string;
    timestamp: string;
    type: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, profileData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          profile: profileData
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setProfile(data.profile);
        return { error: null };
      } else {
        return { error: data.message || 'Signup failed' };
      }
    } catch (error) {
      return { error: 'Network error during signup' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        setProfile(data.profile);
        return { error: null };
      } else {
        return { error: data.message || 'Signin failed' };
      }
    } catch (error) {
      return { error: 'Network error during signin' };
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error during signout:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        return { error: null };
      } else {
        return { error: data.message || 'Profile update failed' };
      }
    } catch (error) {
      return { error: 'Network error during profile update' };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
