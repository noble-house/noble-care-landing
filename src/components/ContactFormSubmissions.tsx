import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  User,
  Calendar,
  Phone,
  Tag
} from 'lucide-react';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'completed' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  assignedTo?: {
    _id: string;
    userId: {
      _id: string;
      email: string;
      fullName: string;
    };
  };
  tags: string[];
  isRead: boolean;
  readAt?: string;
  respondedAt?: string;
  responseMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'website' | 'mobile' | 'api';
  createdAt: string;
  updatedAt: string;
}

interface ContactStats {
  statusStats: {
    [key: string]: number;
  };
  totalSubmissions: number;
  unreadSubmissions: number;
  todaySubmissions: number;
  thisWeekSubmissions: number;
}

const ContactFormSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    isRead: '',
    search: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [currentPage, filters]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/contact-form?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setTotalPages(data.totalPages);
      } else {
        console.error('Error fetching submissions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/contact-form/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateSubmission = async (submissionId: string, updateData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/contact-form/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedSubmission(null);
        fetchSubmissions();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission');
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/contact-form/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchSubmissions();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      spam: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    const icons = {
      low: <Star className="w-3 h-3" />,
      medium: <Star className="w-3 h-3" />,
      high: <AlertCircle className="w-3 h-3" />,
      urgent: <AlertCircle className="w-3 h-3" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {icons[priority as keyof typeof icons]}
        {priority.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Form Submissions</h2>
          <p className="text-gray-600">Manage and respond to contact form submissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadSubmissions}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todaySubmissions}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekSubmissions}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="spam">Spam</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
            <select
              value={filters.isRead}
              onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, subject..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contact Form Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
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
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <tr key={submission._id} className={`hover:bg-gray-50 ${!submission.isRead ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.name}
                          {!submission.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{submission.email}</div>
                        {submission.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {submission.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{submission.subject}</div>
                      <div className="text-sm text-gray-500">{truncateText(submission.message, 80)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(submission.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(submission._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No contact form submissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubmission(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSubmission && (
        <SubmissionEditModal
          submission={selectedSubmission}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubmission(null);
          }}
          onSubmit={handleUpdateSubmission}
        />
      )}
    </div>
  );
};

// Detail Modal Component
const SubmissionDetailModal: React.FC<{ submission: ContactSubmission; onClose: () => void }> = ({ submission, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Contact Form Submission Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-sm text-gray-900">{submission.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{submission.email}</span>
              </div>
              {submission.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Phone:</span>
                  <span className="ml-2 text-sm text-gray-900">{submission.phone}</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-600">Submitted:</span>
                <span className="ml-2 text-sm text-gray-900">{new Date(submission.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Submission Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className="ml-2">{getStatusBadge(submission.status)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Priority:</span>
                <span className="ml-2">{getPriorityBadge(submission.priority)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Source:</span>
                <span className="ml-2 text-sm text-gray-900 capitalize">{submission.source}</span>
              </div>
              {submission.ipAddress && (
                <div>
                  <span className="text-sm font-medium text-gray-600">IP Address:</span>
                  <span className="ml-2 text-sm text-gray-900">{submission.ipAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Message</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-600">Subject:</span>
              <span className="ml-2 text-sm text-gray-900">{submission.subject}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Message:</span>
              <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{submission.message}</div>
            </div>
          </div>
        </div>

        {submission.adminNotes && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Admin Notes</h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{submission.adminNotes}</div>
            </div>
          </div>
        )}

        {submission.responseMessage && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Response Message</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{submission.responseMessage}</div>
            </div>
          </div>
        )}

        {submission.tags.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {submission.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Modal Component
const SubmissionEditModal: React.FC<{ 
  submission: ContactSubmission; 
  onClose: () => void; 
  onSubmit: (submissionId: string, data: any) => void;
}> = ({ submission, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: submission.status,
    priority: submission.priority,
    adminNotes: submission.adminNotes || '',
    responseMessage: submission.responseMessage || '',
    tags: submission.tags.join(', ')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    onSubmit(submission._id, updateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Submission</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">From: {submission.name} ({submission.email})</p>
          <p className="text-sm text-gray-600">Subject: {submission.subject}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add internal notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Message</label>
            <textarea
              value={formData.responseMessage}
              onChange={(e) => setFormData({ ...formData, responseMessage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Response message to send to the contact..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function for status badge (defined outside component)
const getStatusBadge = (status: string) => {
  const colors = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    spam: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Helper function for priority badge (defined outside component)
const getPriorityBadge = (priority: string) => {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  const icons = {
    low: <Star className="w-3 h-3" />,
    medium: <Star className="w-3 h-3" />,
    high: <AlertCircle className="w-3 h-3" />,
    urgent: <AlertCircle className="w-3 h-3" />
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
      {icons[priority as keyof typeof icons]}
      {priority.toUpperCase()}
    </span>
  );
};

export default ContactFormSubmissions;
