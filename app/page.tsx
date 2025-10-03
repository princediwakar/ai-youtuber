'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, Youtube, CheckCircle, Video, X } from 'lucide-react';

interface ChannelStats {
  accountId: string;
  channelName: string;
  totalVideos: number;
  totalViews: number;
  avgEngagementRate: number;
  lastUpload: string | null;
  status: 'active' | 'inactive';
}

interface PersonaStats {
  personaName: string;
  accountId: string;
  totalVideos: number;
  avgEngagementRate: number;
  lastVideo: string | null;
}

interface AnalyticsStats {
  videosPublished: number;
  totalViews: number;
  avgEngagement: number;
  bestChannel: string;
  channels: ChannelStats[];
  personas: PersonaStats[];
}


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
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, [setNotification]);



  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showNotification('Could not refresh dashboard data.', 'error');
    }
    setLoading(false);
  }, [showNotification]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);



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
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Performance metrics for your YouTube channels.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Analytics Cards */}
          <StatCard icon={Video} title="Videos Published" value={stats?.videosPublished || 0} color="blue" />
          <StatCard icon={Database} title="Total Views" value={stats?.totalViews || 0} color="green" />
          <StatCard icon={CheckCircle} title="Avg Engagement" value={`${stats?.avgEngagement || 0}%`} color="yellow" />
          <StatCard icon={Youtube} title="Best Channel" value={stats?.bestChannel || 'No Data'} color="red" />
        </div>

        {/* Channel Breakdown Section */}
        {stats?.channels && stats.channels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Channel Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.channels.map((channel) => (
                <ChannelCard key={channel.accountId} channel={channel} />
              ))}
            </div>
          </div>
        )}

        {/* Persona Breakdown Section */}
        {stats?.personas && stats.personas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Content Personas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.personas.map((persona, index) => (
                <PersonaCard key={`${persona.accountId}-${persona.personaName}`} persona={persona} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6 text-center">
          <div className="flex items-center justify-center">
            <button onClick={fetchDashboardData} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components for a cleaner main component
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: number | string, color: string }) => {
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

const ChannelCard = ({ channel }: { channel: ChannelStats }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{channel.channelName}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          channel.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {channel.status}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Videos:</span>
          <span className="text-white font-medium">{channel.totalVideos}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Views:</span>
          <span className="text-white font-medium">{channel.totalViews.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Engagement:</span>
          <span className="text-white font-medium">{channel.avgEngagementRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Last Upload:</span>
          <span className="text-white font-medium text-sm">{formatDate(channel.lastUpload)}</span>
        </div>
      </div>
    </div>
  );
};

const PersonaCard = ({ persona }: { persona: PersonaStats }) => {
  const formatPersonaName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg p-4 border border-gray-700">
      <h4 className="text-md font-semibold text-white mb-3">{formatPersonaName(persona.personaName)}</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Videos:</span>
          <span className="text-white font-medium">{persona.totalVideos}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Engagement:</span>
          <span className="text-white font-medium">{persona.avgEngagementRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Last Video:</span>
          <span className="text-white font-medium text-xs">{formatDate(persona.lastVideo)}</span>
        </div>
      </div>
    </div>
  );
};
