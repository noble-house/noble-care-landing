import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';

interface AnalyticsData {
  totalProfiles: number;
  submittedProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  pendingProfiles: number;
  completionRates: Array<{
    step: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  monthlySubmissions: Array<{
    month: string;
    submissions: number;
    approvals: number;
    rejections: number;
  }>;
  locationDistribution: Array<{
    location: string;
    count: number;
  }>;
  jobTitleDistribution: Array<{
    jobTitle: string;
    count: number;
  }>;
  statusTrends: Array<{
    date: string;
    submitted: number;
    approved: number;
    rejected: number;
  }>;
  averageCompletionTime: number;
  topPerformingLocations: Array<{
    location: string;
    approvalRate: number;
    totalProfiles: number;
  }>;
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">No analytics data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into profile submissions and approvals</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalProfiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.approvedProfiles}</p>
                <p className="text-sm text-green-600">
                  {analyticsData.totalProfiles > 0 
                    ? `${((analyticsData.approvedProfiles / analyticsData.totalProfiles) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.pendingProfiles}</p>
                <p className="text-sm text-yellow-600">
                  {analyticsData.totalProfiles > 0 
                    ? `${((analyticsData.pendingProfiles / analyticsData.totalProfiles) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.rejectedProfiles}</p>
                <p className="text-sm text-red-600">
                  {analyticsData.totalProfiles > 0 
                    ? `${((analyticsData.rejectedProfiles / analyticsData.totalProfiles) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Submissions Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Submissions Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlySubmissions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="submissions" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Submissions"
                />
                <Area 
                  type="monotone" 
                  dataKey="approvals" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Approvals"
                />
                <Area 
                  type="monotone" 
                  dataKey="rejections" 
                  stackId="1" 
                  stroke="#ff8042" 
                  fill="#ff8042" 
                  name="Rejections"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: analyticsData.approvedProfiles, color: '#10B981' },
                    { name: 'Pending', value: analyticsData.pendingProfiles, color: '#F59E0B' },
                    { name: 'Rejected', value: analyticsData.rejectedProfiles, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Approved', value: analyticsData.approvedProfiles, color: '#10B981' },
                    { name: 'Pending', value: analyticsData.pendingProfiles, color: '#F59E0B' },
                    { name: 'Rejected', value: analyticsData.rejectedProfiles, color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Location Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.locationDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Job Title Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Title Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.jobTitleDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jobTitle" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rates */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Step Completion Rates</h3>
          <div className="space-y-4">
            {analyticsData.completionRates.map((step, index) => (
              <div key={step.step} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-32">{step.step}</span>
                  <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${step.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 ml-4 w-16 text-right">
                  {step.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Locations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Locations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Profiles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.topPerformingLocations.map((location, index) => (
                  <tr key={location.location}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {location.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.totalProfiles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`font-medium ${
                        location.approvalRate >= 80 ? 'text-green-600' :
                        location.approvalRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {location.approvalRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
