'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Database, Youtube, AlertCircle, CheckCircle, Clock, Video } from 'lucide-react';

interface JobStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

interface QuizJob {
  id: string;
  persona: string;
  category: string;
  difficulty: string;
  status: string;
  step: number;
  created_at: string;
  error_message?: string;
}

export default function QuizDashboard() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<QuizJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/quiz-dashboard');
      const data = await response.json();
      setStats(data.stats);
      setRecentJobs(data.recentJobs);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const testDatabase = async () => {
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      alert(data.success ? 'Database connection successful!' : `Database error: ${data.error}`);
    } catch (error) {
      alert(`Test failed: ${error}`);
    }
  };

  const testPipeline = async (step: number) => {
    setTesting(true);
    try {
      const endpoints = {
        1: '/api/jobs/generate-quiz',
        2: '/api/jobs/create-frames',
        3: '/api/jobs/assemble-video',
        4: '/api/jobs/upload-quiz-videos'
      };

      const response = await fetch(endpoints[step], {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      alert(data.success 
        ? `Step ${step} completed successfully! Processed: ${data.processed || data.created || 0}` 
        : `Step ${step} failed: ${data.error}`
      );
      
      fetchDashboardData(); // Refresh data
    } catch (error) {
      alert(`Test failed: ${error}`);
    }
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStepName = (step: number) => {
    const steps = {
      1: 'Question Generation',
      2: 'Frame Creation', 
      3: 'Video Assembly',
      4: 'YouTube Upload'
    };
    return steps[step] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Video Generation Dashboard</h1>
          <p className="text-gray-600">Monitor the automated quiz video creation pipeline</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Pipeline Controls</h2>
            <p className="text-gray-600 mt-1">Test individual steps of the quiz generation pipeline</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={testDatabase}
                className="flex items-center justify-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>Test DB</span>
              </button>
              
              <button
                onClick={() => testPipeline(1)}
                disabled={testing}
                className="flex items-center justify-center space-x-2 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Step 1: Generate</span>
              </button>
              
              <button
                onClick={() => testPipeline(2)}
                disabled={testing}
                className="flex items-center justify-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>Step 2: Frames</span>
              </button>
              
              <button
                onClick={() => testPipeline(3)}
                disabled={testing}
                className="flex items-center justify-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>Step 3: Video</span>
              </button>
              
              <button
                onClick={() => testPipeline(4)}
                disabled={testing}
                className="flex items-center justify-center space-x-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Youtube className="w-4 h-4" />
                <span>Step 4: Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
                <p className="text-gray-600 mt-1">Latest quiz generation jobs</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.persona} {job.category}
                      <div className="text-xs text-gray-500">{job.difficulty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStepName(job.step)}
                      <div className="text-xs text-gray-500">Step {job.step}/4</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm text-gray-900">{job.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                      {job.error_message && (
                        <span title={job.error_message}>
                          {job.error_message.slice(0, 50)}...
                        </span>
                      )}
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
}