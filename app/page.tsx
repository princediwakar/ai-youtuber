'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Database, Youtube, AlertCircle, CheckCircle, Clock, Video, X } from 'lucide-react';
import { QuizJob as QuizJobType } from '@/lib/types';

interface JobStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

type QuizJob = QuizJobType;

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed bottom-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-up`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:bg-white/20 rounded-full p-1">
        <X size={18} />
      </button>
    </div>
  );
};

export default function QuizDashboard() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<QuizJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setStats(data.stats);
      setRecentJobs(data.recentJobs);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showNotification('Could not refresh dashboard data.', 'error');
    }
    setLoading(false);
  };

  const testPipeline = async (step: number) => {
    setTesting(step);
    try {
      const response = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ step })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || `Step ${step} failed with an unknown error.`);
      
      const processedCount = data.processed ?? data.created ?? data.summary?.[0]?.created ?? 0;
      showNotification(`Step ${step} triggered! Processed: ${processedCount}`, 'success');
      
      setTimeout(fetchDashboardData, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showNotification(errorMessage, 'error');
    }
    setTesting(null);
  };

  const getStepName = (step: number) => {
    const steps: { [key: number]: string } = {
      1: 'Generation',
      2: 'Frame Creation', 
      3: 'Video Assembly',
      4: 'YouTube Upload',
      5: 'Completed'
    };
    return steps[step] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6 font-sans">
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Automated Content Pipeline</h1>
          <p className="text-gray-400">Live monitor for the video generation and upload system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <StatCard icon={Database} title="Total Jobs" value={stats?.total || 0} color="blue" />
          <StatCard icon={Clock} title="Pending" value={stats?.pending || 0} color="yellow" />
          <StatCard icon={CheckCircle} title="Completed" value={stats?.completed || 0} color="green" />
          <StatCard icon={AlertCircle} title="Failed" value={stats?.failed || 0} color="red" />
        </div>

        <div className="bg-gray-800/50 rounded-lg shadow-lg mb-8 border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Pipeline Controls</h2>
            <p className="text-gray-400 mt-1">Manually trigger individual steps of the pipeline.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PipelineButton step={1} label="Generate" icon={Play} color="green" onClick={testPipeline} testing={testing} />
              <PipelineButton step={2} label="Frames" icon={Video} color="yellow" onClick={testPipeline} testing={testing} />
              <PipelineButton step={3} label="Assemble" icon={Video} color="purple" onClick={testPipeline} testing={testing} />
              <PipelineButton step={4} label="Upload" icon={Youtube} color="red" onClick={testPipeline} testing={testing} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
              <p className="text-gray-400 mt-1">Showing the last 20 jobs processed.</p>
            </div>
            <button onClick={fetchDashboardData} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Step</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{job.id.slice(-8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {job.topic_display_name || job.data?.topic_display_name || job.topic}
                      <div className="text-xs text-gray-400">{job.persona}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getStepName(job.step)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm text-white capitalize">{job.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-400 max-w-xs truncate">
                      {job.error_message && (<span title={job.error_message}>{job.error_message}</span>)}
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

// Helper components for a cleaner main component
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: number, color: string }) => {
  const colors = {
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };
  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg p-6 border border-gray-700 flex items-center">
      <Icon className={`w-8 h-8 ${colors[color as keyof typeof colors]} mr-4`} />
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

const PipelineButton = ({ step, label, icon: Icon, color, onClick, testing }: { step: number, label: string, icon: React.ElementType, color: string, onClick: (step: number) => void, testing: number | null }) => {
  const colors = {
    green: 'bg-green-500/10 hover:bg-green-500/20 text-green-300',
    yellow: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300',
    red: 'bg-red-500/10 hover:bg-red-500/20 text-red-300',
  };
  const isThisTesting = testing === step;
  return (
    <button
      onClick={() => onClick(step)}
      disabled={!!testing}
      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors[color as keyof typeof colors]}`}
    >
      {isThisTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
};

const getStatusIcon = (status: string) => {
  if (status.includes('pending')) return <Clock className="w-4 h-4 text-yellow-400" />;
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
    default: return <Clock className="w-4 h-4 text-yellow-400" />;
  }
};
