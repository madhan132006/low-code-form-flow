/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Calendar, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsProps {
  token: string;
}

export default function AuditLogs({ token }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load logs');
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    (log.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="audit-logs-view" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            System Audit Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Track user behavior, action types, metadata alterations, and version increments.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl border border-gray-250 dark:border-zinc-700 text-gray-600 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search logs by keyword or admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-10 h-10 animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm text-gray-400 text-xs">
          No audit logs recorded matching your search.
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-850/50 border-b border-gray-100 dark:border-zinc-800 text-3xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-3xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700 dark:text-zinc-300">
                      {log.userEmail || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 border border-indigo-100/30 dark:border-zinc-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-zinc-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
