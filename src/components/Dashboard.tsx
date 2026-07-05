/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText, CheckCircle, Edit, MessageSquare, Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';

interface DashboardProps {
  token: string;
  onNavigate: (view: string, formId?: string) => void;
}

export default function Dashboard({ token, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load dashboard analytics');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-700 dark:text-red-400 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Dashboard Error</h4>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Parse submissions by date for AreaChart
  const dateData = Object.keys(stats?.submissionsByDate || {})
    .sort()
    .map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Submissions: stats.submissionsByDate[date],
    }));

  // Parse submissions by form for BarChart
  const formData = (stats?.submissionsByForm || [])
    .slice(0, 5) // Top 5
    .map((item: any) => ({
      name: item.title.length > 15 ? item.title.slice(0, 15) + '...' : item.title,
      Submissions: item.count,
    }));

  return (
    <div id="dashboard-view" className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Real-time insights across all dynamic forms and respondent submissions.
          </p>
        </div>
        <button
          onClick={() => onNavigate('my-forms')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Manage Forms
        </button>
      </div>

      {/* Grid statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl col-span-2 lg:col-span-2 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600 dark:text-zinc-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Total Forms
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white block mt-1">
              {stats?.totalForms}
            </span>
            <div className="flex gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.publishedForms} Active</span>
              <span>•</span>
              <span>{stats?.draftForms} Drafts</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl col-span-2 lg:col-span-2 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-zinc-800 rounded-xl text-indigo-600 dark:text-zinc-200">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Submissions
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white block mt-1">
              {stats?.totalResponses}
            </span>
            <div className="flex gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-1">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">+{stats?.todayResponses} today</span>
              <span>submissions</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl col-span-2 lg:col-span-2 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-zinc-800 rounded-xl text-amber-600 dark:text-zinc-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Avg. Duration
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white block mt-1">
              {stats?.avgCompletionTime ? `${stats.avgCompletionTime}s` : 'N/A'}
            </span>
            <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1 block">
              Time elapsed to submit
            </span>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Submissions Timeline
            </h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">Last 30 Days</span>
          </div>
          <div className="h-64 w-full">
            {dateData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 text-sm gap-2">
                <BarChart3 className="w-8 h-8" />
                <span>No submissions recorded yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dateData}>
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Submissions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Forms */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Top Forms by Response Volume
            </h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">Top 5</span>
          </div>
          <div className="h-64 w-full">
            {formData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 text-sm gap-2">
                <BarChart3 className="w-8 h-8" />
                <span>No form data available</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="Submissions" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
