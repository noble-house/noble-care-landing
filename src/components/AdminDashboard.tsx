import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminAnalytics from './AdminAnalytics';
import ReminderManagement from './ReminderManagement';
import AdminActivityDashboard from './AdminActivityDashboard';
import AdminUserManagement from './AdminUserManagement';
import ContactFormSubmissions from './ContactFormSubmissions';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  BarChart3, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  TrendingUp,
  UserCheck,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileDown,
  User,
  GraduationCap,
  Briefcase,
  Heart,
  Users2,
  FolderOpen,
  Bell,
  Activity
} from 'lucide-react';

interface Profile {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  baseCity: string;
  jobTitle: string;
  applicationStatus: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submissionDate?: string;
  prescreenResult?: 'pass' | 'caution' | 'fail';
  personalInfoCompleted: boolean;
  identityVerified: boolean;
  professionalBackgroundCompleted: boolean;
  healthAssessmentCompleted: boolean;
  referencesCompleted: boolean;
  documentsUploaded: boolean;
  profileSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DetailedProfile extends Profile {
  personalInfo?: {
    dateOfBirth?: string;
    gender?: string;
    address?: any;
    emergencyContacts?: any[];
    completed: boolean;
  };
  identityVerification?: {
    identityDocuments?: any[];
    verified: boolean;
  };
  professionalBackground?: {
    experience?: any[];
    education?: any[];
    certifications?: any[];
    completed: boolean;
  };
  healthAssessment?: {
    data?: any;
    completed: boolean;
  };
  references?: {
    data?: any[];
    completed: boolean;
  };
  documents?: {
    data?: any[];
    uploaded: boolean;
  };
  prescreen?: {
    data?: any;
    result?: string;
    completed: boolean;
  };
  notes?: any[];
}

interface DashboardStats {
  totalProfiles: number;
  submittedProfiles: number;
  approvedProfiles: number;
  pendingReview: number;
  rejectedProfiles: number;
  newThisWeek: number;
  completionRate: number;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProfiles: 0,
    submittedProfiles: 0,
    approvedProfiles: 0,
    pendingReview: 0,
    rejectedProfiles: 0,
    newThisWeek: 0,
    completionRate: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<DetailedProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'analytics' | 'reminders' | 'activity' | 'admin-users' | 'contact-form'>('profiles');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [profileToReject, setProfileToReject] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchProfiles();
    fetchStats();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, statusFilter, jobTitleFilter, dateRangeFilter, completionFilter, locationFilter]);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDetailedProfile = async (profileId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/profiles/${profileId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProfile(data.profile);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching detailed profile:', error);
    }
  };

  const updateProfileStatus = async (profileId: string, status: string, feedback?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/profiles/${profileId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, feedback })
      });

      if (response.ok) {
        // Refresh profiles
        fetchProfiles();
        fetchStats();
        
        // Close modals
        setShowRejectionModal(false);
        setProfileToReject(null);
        setRejectionFeedback('');
        
        // Show success message
        alert(`Profile ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating profile status:', error);
      alert('Failed to update profile status');
    }
  };

  const handleRejectProfile = (profileId: string) => {
    setProfileToReject(profileId);
    setShowRejectionModal(true);
  };

  const confirmRejection = () => {
    if (profileToReject && rejectionFeedback.trim()) {
      updateProfileStatus(profileToReject, 'rejected', rejectionFeedback);
    } else {
      alert('Please provide rejection feedback');
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.phone.includes(searchTerm) ||
        profile.baseCity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(profile => profile.applicationStatus === statusFilter);
    }

    // Job title filter
    if (jobTitleFilter !== 'all') {
      filtered = filtered.filter(profile => profile.jobTitle === jobTitleFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(profile => profile.baseCity === locationFilter);
    }

    // Date range filter
    if (dateRangeFilter.start || dateRangeFilter.end) {
      filtered = filtered.filter(profile => {
        const profileDate = new Date(profile.createdAt);
        const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
        const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;

        if (startDate && endDate) {
          return profileDate >= startDate && profileDate <= endDate;
        } else if (startDate) {
          return profileDate >= startDate;
        } else if (endDate) {
          return profileDate <= endDate;
        }
        return true;
      });
    }

    // Completion filter
    if (completionFilter !== 'all') {
      filtered = filtered.filter(profile => {
        const completion = getCompletionPercentage(profile);
        switch (completionFilter) {
          case 'complete':
            return completion === 100;
          case 'incomplete':
            return completion < 100;
          case 'high':
            return completion >= 80;
          case 'medium':
            return completion >= 50 && completion < 80;
          case 'low':
            return completion < 50;
          default:
            return true;
        }
      });
    }

    setFilteredProfiles(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCompletionPercentage = (profile: Profile) => {
    const steps = [
      profile.personalInfoCompleted,
      profile.identityVerified,
      profile.professionalBackgroundCompleted,
      profile.healthAssessmentCompleted,
      profile.referencesCompleted,
      profile.documentsUploaded,
      profile.profileSubmitted
    ];
    
    const completedSteps = steps.filter(step => step).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not submitted';
    return new Date(dateString).toLocaleDateString();
  };

  const downloadDocument = (url: string, filename: string) => {
    console.log('Attempting to download document:', { url: url.substring(0, 50) + '...', filename });
    
    // Check if it's a base64 data URL
    if (url.startsWith('data:')) {
      console.log('Processing base64 data URL');
      // Handle base64 data URL
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (url.startsWith('blob:')) {
      console.log('Processing blob URL (may not work for downloaded files)');
      // Handle blob URL (for backward compatibility)
      console.warn('Blob URL detected - this may not work for downloaded files');
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('Processing regular URL');
      // Handle regular URL
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportProfiles = async (type: 'basic' | 'detailed' = 'basic') => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/export?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `profiles-${type}-export.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting profiles:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const exportStats = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/export/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'statistics-export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting stats:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleProfileSelection = (profileId: string, checked: boolean) => {
    if (checked) {
      setSelectedProfiles(prev => [...prev, profileId]);
    } else {
      setSelectedProfiles(prev => prev.filter(id => id !== profileId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProfiles(filteredProfiles.map(profile => profile._id));
    } else {
      setSelectedProfiles([]);
    }
  };

  const performBulkAction = async (action: 'approve' | 'reject', feedback?: string) => {
    if (selectedProfiles.length === 0) return;

    try {
      setBulkActionLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Perform bulk action for each selected profile
      const promises = selectedProfiles.map(profileId => 
        fetch(`${API_BASE_URL}/admin/profiles/${profileId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: action === 'approve' ? 'approved' : 'rejected',
            feedback: action === 'reject' ? feedback : undefined
          })
        })
      );

      await Promise.all(promises);
      
      // Refresh profiles and stats
      await fetchProfiles();
      await fetchStats();
      
      // Clear selection
      setSelectedProfiles([]);
      
      alert(`Successfully ${action}d ${selectedProfiles.length} profile(s)`);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(`Error performing bulk ${action}. Please try again.`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage candidate profiles and applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportProfiles('basic')}
                  disabled={exportLoading}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export Basic
                </button>
                <button
                  onClick={() => exportProfiles('detailed')}
                  disabled={exportLoading}
                  className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export Detailed
                </button>
                <button
                  onClick={exportStats}
                  disabled={exportLoading}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export Stats
                </button>
              </div>
              <span className="text-sm text-gray-500">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Profiles</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProfiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approvedProfiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejectedProfiles}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profiles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profiles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Profiles ({profiles.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reminders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Reminders
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Activity Log
              </button>
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin-users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Admin Users
              </button>
              <button
                onClick={() => setActiveTab('contact-form')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact-form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Contact Form
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'profiles' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <select
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Job Titles</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="caregiver">Caregiver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Locations</option>
                    {Array.from(new Set(profiles.map(p => p.baseCity))).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completion</label>
                  <select
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Completion</option>
                    <option value="complete">Complete (100%)</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (50-79%)</option>
                    <option value="low">Low (&lt;50%)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setJobTitleFilter('all');
                      setLocationFilter('all');
                      setCompletionFilter('all');
                      setDateRangeFilter({ start: '', end: '' });
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={dateRangeFilter.start}
                      onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Start Date"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRangeFilter.end}
                      onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Profiles ({filteredProfiles.length})</h3>
                  
                  {/* Bulk Actions */}
                  {selectedProfiles.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {selectedProfiles.length} profile(s) selected
                      </span>
                      <button
                        onClick={() => performBulkAction('approve')}
                        disabled={bulkActionLoading}
                        className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {bulkActionLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Approve Selected
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Enter rejection feedback (optional):');
                          if (feedback !== null) {
                            performBulkAction('reject', feedback);
                          }
                        }}
                        disabled={bulkActionLoading}
                        className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {bulkActionLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProfiles.map((profile) => (
                      <tr key={profile._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProfiles.includes(profile._id)}
                            onChange={(e) => handleProfileSelection(profile._id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{profile.fullName}</div>
                              <div className="text-sm text-gray-500">{profile.email}</div>
                              <div className="text-sm text-gray-500">{profile.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profile.applicationStatus)}`}>
                            {getStatusIcon(profile.applicationStatus)}
                            <span className="ml-1 capitalize">
                              {profile.profileSubmitted ? 
                                (profile.applicationStatus === 'approved' ? 'Approved' : 
                                 profile.applicationStatus === 'rejected' ? 'Rejected' : 'Submitted') 
                                : profile.applicationStatus.replace('_', ' ')}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${getCompletionPercentage(profile)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{getCompletionPercentage(profile)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {profile.baseCity}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">{profile.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(profile.submissionDate || profile.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => fetchDetailedProfile(profile._id)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Show approve button for submitted or rejected profiles */}
                            {(profile.applicationStatus === 'submitted' || profile.applicationStatus === 'under_review' || profile.applicationStatus === 'rejected') && (
                              <button
                                onClick={() => updateProfileStatus(profile._id, 'approved')}
                                className="text-green-600 hover:text-green-900 p-1"
                                title={profile.applicationStatus === 'rejected' ? 'Approve Again' : 'Approve'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Show reject button for submitted or approved profiles */}
                            {(profile.applicationStatus === 'submitted' || profile.applicationStatus === 'under_review' || profile.applicationStatus === 'approved') && (
                              <button
                                onClick={() => handleRejectProfile(profile._id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title={profile.applicationStatus === 'approved' ? 'Reject' : 'Reject'}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <AdminAnalytics />
        )}

        {activeTab === 'reminders' && (
          <ReminderManagement />
        )}

        {activeTab === 'activity' && (
          <AdminActivityDashboard />
        )}

        {activeTab === 'admin-users' && (
          <AdminUserManagement />
        )}

        {activeTab === 'contact-form' && (
          <ContactFormSubmissions />
        )}

        {/* Detailed Profile Modal */}
        {showProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProfile.fullName}</h3>
                    <p className="text-gray-600">{selectedProfile.email} • {selectedProfile.phone}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProfile.applicationStatus)}`}>
                      {getStatusIcon(selectedProfile.applicationStatus)}
                      <span className="ml-1 capitalize">{selectedProfile.applicationStatus.replace('_', ' ')}</span>
                    </span>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Profile Sections */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('personal')}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">Personal Information</span>
                        {selectedProfile.personalInfo?.completed && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                        )}
                      </div>
                      {expandedSections.includes('personal') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.includes('personal') && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedProfile.personalInfo?.dateOfBirth || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{selectedProfile.personalInfo?.gender || 'Not provided'}</p>
                          </div>
                          {selectedProfile.personalInfo?.address && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Address</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {selectedProfile.personalInfo.address.street}, {selectedProfile.personalInfo.address.city}, {selectedProfile.personalInfo.address.state} {selectedProfile.personalInfo.address.zipCode}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Identity Verification */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('identity')}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">Identity Verification</span>
                        {selectedProfile.identityVerification?.verified && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                        )}
                      </div>
                      {expandedSections.includes('identity') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                                         {expandedSections.includes('identity') && (
                       <div className="p-4 border-t border-gray-200">
                         {selectedProfile.identityVerification?.identityDocuments && selectedProfile.identityVerification.identityDocuments.length > 0 ? (
                           <div className="space-y-3">
                             {selectedProfile.identityVerification.identityDocuments.map((doc: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-gray-600">{doc.type}</p>
                                </div>
                                <button
                                  onClick={() => downloadDocument(doc.url, doc.name)}
                                  className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Download document"
                                >
                                  <FileDown className="w-4 h-4 mr-1" />
                                  <span className="text-sm">Download</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No identity documents uploaded</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Professional Background */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('professional')}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">Professional Background</span>
                        {selectedProfile.professionalBackground?.completed && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                        )}
                      </div>
                      {expandedSections.includes('professional') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.includes('professional') && (
                      <div className="p-4 border-t border-gray-200">
                                                 <div className="space-y-4">
                           {/* Experience */}
                           {selectedProfile.professionalBackground?.experience && selectedProfile.professionalBackground.experience.length > 0 && (
                             <div>
                               <h4 className="font-medium mb-2">Experience</h4>
                               {selectedProfile.professionalBackground.experience.map((exp: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                                  <p className="font-medium">{exp.title} at {exp.company}</p>
                                  <p className="text-sm text-gray-600">{exp.location}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(exp.startDate).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                                  </p>
                                  {exp.documentUrl && (
                                    <button
                                      onClick={() => downloadDocument(exp.documentUrl, `${exp.title}_${exp.company}.pdf`)}
                                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-sm transition-colors"
                                      title="Download experience document"
                                    >
                                      <FileDown className="w-4 h-4 mr-1" />
                                      Download Document
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                                                     {/* Education */}
                           {selectedProfile.professionalBackground?.education && selectedProfile.professionalBackground.education.length > 0 && (
                             <div>
                               <h4 className="font-medium mb-2">Education</h4>
                               {selectedProfile.professionalBackground.education.map((edu: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                                  <p className="font-medium">{edu.degree} in {edu.field}</p>
                                  <p className="text-sm text-gray-600">{edu.institution}</p>
                                  <p className="text-sm text-gray-600">Graduated: {edu.graduationYear}</p>
                                  {edu.documentUrl && (
                                    <button
                                      onClick={() => downloadDocument(edu.documentUrl, `${edu.degree}_${edu.institution}.pdf`)}
                                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-sm transition-colors"
                                      title="Download education document"
                                    >
                                      <FileDown className="w-4 h-4 mr-1" />
                                      Download Document
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                                                     {/* Certifications */}
                           {selectedProfile.professionalBackground?.certifications && selectedProfile.professionalBackground.certifications.length > 0 && (
                             <div>
                               <h4 className="font-medium mb-2">Certifications</h4>
                               {selectedProfile.professionalBackground.certifications.map((cert: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                                  <p className="font-medium">{cert.name}</p>
                                  <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                                  <p className="text-sm text-gray-600">
                                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                    {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                                  </p>
                                  {cert.documentUrl && (
                                    <button
                                      onClick={() => downloadDocument(cert.documentUrl, `${cert.name}.pdf`)}
                                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-sm transition-colors"
                                      title="Download certification document"
                                    >
                                      <FileDown className="w-4 h-4 mr-1" />
                                      Download Document
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('documents')}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">Documents</span>
                        {selectedProfile.documents?.uploaded && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                        )}
                      </div>
                      {expandedSections.includes('documents') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                                         {expandedSections.includes('documents') && (
                       <div className="p-4 border-t border-gray-200">
                         {selectedProfile.documents?.data && selectedProfile.documents.data.length > 0 ? (
                           <div className="space-y-3">
                             {selectedProfile.documents.data.map((doc: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-gray-600">{doc.category} • {doc.type}</p>
                                  <p className="text-sm text-gray-600">
                                    Uploaded: {typeof doc.uploadedAt === 'string' ? new Date(doc.uploadedAt).toLocaleDateString() : doc.uploadedAt.toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                    doc.status === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {doc.status}
                                  </span>
                                  <button
                                    onClick={() => downloadDocument(doc.url, doc.name)}
                                    className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Download document"
                                  >
                                    <FileDown className="w-4 h-4 mr-1" />
                                    <span className="text-sm">Download</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No documents uploaded</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes and Feedback */}
                  {selectedProfile.notes && selectedProfile.notes.length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
                        <div className="flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                          <span className="font-medium">Notes & Feedback</span>
                        </div>
                      </div>
                      <div className="p-4 border-t border-gray-200">
                        <div className="space-y-3">
                          {selectedProfile.notes.map((note: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{note.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {note.author} • {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  
                  {/* Show approve button for submitted, under_review, or rejected profiles */}
                  {(selectedProfile.applicationStatus === 'submitted' || selectedProfile.applicationStatus === 'under_review' || selectedProfile.applicationStatus === 'rejected') && (
                    <button
                      onClick={() => updateProfileStatus(selectedProfile._id, 'approved')}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {selectedProfile.applicationStatus === 'rejected' ? 'Approve Again' : 'Approve'}
                    </button>
                  )}
                  
                  {/* Show reject button for submitted, under_review, or approved profiles */}
                  {(selectedProfile.applicationStatus === 'submitted' || selectedProfile.applicationStatus === 'under_review' || selectedProfile.applicationStatus === 'approved') && (
                    <button
                      onClick={() => {
                        setProfileToReject(selectedProfile._id);
                        setShowRejectionModal(true);
                        setShowProfileModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Feedback Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Profile</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Feedback
                  </label>
                  <textarea
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    placeholder="Please provide feedback on why this profile is being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setProfileToReject(null);
                      setRejectionFeedback('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejection}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Reject Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
