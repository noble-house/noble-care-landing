import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  Settings, 
  RefreshCw,
  Calendar,
  Mail,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';

interface Reminder {
  _id: string;
  userId: {
    _id: string;
    email: string;
  };
  profileId: {
    _id: string;
    fullName: string;
  };
  type: 'welcome' | 'progress' | 'completion' | 'submission';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduledFor: string;
  sentAt?: string;
  emailSent: boolean;
  emailError?: string;
  reminderData?: {
    completionPercentage: number;
    incompleteSteps: string[];
    daysSinceLastActivity: number;
    profileUrl: string;
  };
  metadata: {
    attemptCount: number;
    lastAttemptAt?: string;
    nextAttemptAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReminderStats {
  welcome?: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    successRate: number;
  };
  progress?: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    successRate: number;
  };
  completion?: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    successRate: number;
  };
  submission?: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    successRate: number;
  };
}

interface ReminderSummary {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  today: number;
}

const ReminderManagement: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats>({});
  const [summary, setSummary] = useState<ReminderSummary>({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    userId: ''
  });
  const [config, setConfig] = useState<any>({});
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [showConfig, setShowConfig] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showSendReminderModal, setShowSendReminderModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchReminders();
    fetchStats();
    fetchConfig();
  }, [currentPage, filters]);

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/reminders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setEditingConfig(JSON.parse(JSON.stringify(data.config))); // Deep copy for editing
      }
    } catch (error) {
      console.error('Error fetching reminder config:', error);
    }
  };

  const processReminders = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchReminders();
        await fetchStats();
        alert('Reminders processed successfully!');
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
      alert('Failed to process reminders');
    } finally {
      setProcessing(false);
    }
  };

  const sendReminderToUser = async (userId: string, type: string) => {
    try {
      setSendingReminder(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, type, delay: 0 })
      });

      if (response.ok) {
        // Add a small delay to ensure backend processing is complete
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchReminders();
        await fetchStats();
        alert('Reminder sent successfully!');
        setShowSendReminderModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to send reminder: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: editingConfig })
      });

      if (response.ok) {
        await fetchConfig();
        alert('Configuration updated successfully!');
      } else {
        alert('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const updateConfigValue = (type: string, field: string, value: number) => {
    setEditingConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const cancelReminder = async (reminderId: string, reason: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await fetchReminders();
        await fetchStats();
        alert('Reminder cancelled successfully!');
      }
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      alert('Failed to cancel reminder');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-blue-100 text-blue-800';
      case 'progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completion':
        return 'bg-green-100 text-green-800';
      case 'submission':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminder Management</h1>
          <p className="text-gray-600">Manage profile completion reminders and automated emails</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </button>
          <button
            onClick={processReminders}
            disabled={processing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>{processing ? 'Processing...' : 'Send Reminders'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reminders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{summary.sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{summary.failed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{summary.today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reminder Configuration</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingConfig(JSON.parse(JSON.stringify(config)))}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={saveConfig}
                disabled={savingConfig}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(editingConfig).map(([type, configData]: [string, any]) => (
              <div key={type} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 capitalize mb-3">{type} Reminders</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={configData.delay}
                      onChange={(e) => updateConfigValue(type, 'delay', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={configData.maxAttempts}
                      onChange={(e) => updateConfigValue(type, 'maxAttempts', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 border rounded-md text-sm"
                    />
                  </div>
                  {configData.interval && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interval (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={configData.interval}
                        onChange={(e) => updateConfigValue(type, 'interval', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="welcome">Welcome</option>
            <option value="progress">Progress</option>
            <option value="completion">Completion</option>
            <option value="submission">Submission</option>
          </select>

          <input
            type="text"
            placeholder="Search by user email..."
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Reminders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Reminders by User</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Reminders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                // Group reminders by user
                const userGroups = reminders.reduce((groups, reminder) => {
                  const userId = reminder.userId._id;
                  if (!groups[userId]) {
                    groups[userId] = {
                      user: reminder.userId,
                      profile: reminder.profileId,
                      reminders: []
                    };
                  }
                  groups[userId].reminders.push(reminder);
                  return groups;
                }, {} as any);

                return Object.values(userGroups).map((group: any) => {
                  const latestReminder = group.reminders.sort((a: any, b: any) => 
                    new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
                  )[0];

                  const pendingCount = group.reminders.filter((r: any) => r.status === 'pending').length;
                  const sentCount = group.reminders.filter((r: any) => r.status === 'sent').length;

                  return (
                    <tr key={group.user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {group.profile.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {group.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {latestReminder.reminderData ? (
                          <div className="text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${latestReminder.reminderData.completionPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600">
                                {latestReminder.reminderData.completionPercentage}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {latestReminder.reminderData.daysSinceLastActivity} days inactive
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex space-x-2">
                            {pendingCount > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {pendingCount} Pending
                              </span>
                            )}
                            {sentCount > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {sentCount} Sent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last: {formatDate(latestReminder.scheduledFor)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(group);
                            setShowSendReminderModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Send Reminder
                        </button>
                        {pendingCount > 0 && (
                          <button
                            onClick={() => {
                              group.reminders
                                .filter((r: any) => r.status === 'pending')
                                .forEach((r: any) => cancelReminder(r._id, 'Cancelled by admin'));
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel All
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
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
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Reminder Modal */}
      {showSendReminderModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Reminder to {selectedUser.profile.fullName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the type of reminder to send:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => sendReminderToUser(selectedUser.user._id, 'welcome')}
                  disabled={sendingReminder}
                  className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  <div className="font-medium text-blue-800">Welcome Email</div>
                  <div className="text-sm text-gray-600">Send welcome message to new users</div>
                </button>

                <button
                  onClick={() => sendReminderToUser(selectedUser.user._id, 'progress')}
                  disabled={sendingReminder}
                  className="w-full text-left p-3 border rounded-lg hover:bg-yellow-50 disabled:opacity-50"
                >
                  <div className="font-medium text-yellow-800">Profile Incomplete</div>
                  <div className="text-sm text-gray-600">Remind user to complete their profile</div>
                </button>

                <button
                  onClick={() => sendReminderToUser(selectedUser.user._id, 'completion')}
                  disabled={sendingReminder}
                  className="w-full text-left p-3 border rounded-lg hover:bg-green-50 disabled:opacity-50"
                >
                  <div className="font-medium text-green-800">Almost Complete</div>
                  <div className="text-sm text-gray-600">Encourage user to finish final steps</div>
                </button>

                <button
                  onClick={() => sendReminderToUser(selectedUser.user._id, 'submission')}
                  disabled={sendingReminder}
                  className="w-full text-left p-3 border rounded-lg hover:bg-purple-50 disabled:opacity-50"
                >
                  <div className="font-medium text-purple-800">Ready to Submit</div>
                  <div className="text-sm text-gray-600">Prompt user to submit their profile</div>
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSendReminderModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderManagement;
