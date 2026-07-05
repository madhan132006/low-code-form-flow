/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, FileDown, Download, AlertCircle, Eye, ArrowLeft, RefreshCw } from 'lucide-react';
import { Form, Submission } from '../types';

interface ResponsesProps {
  token: string;
  formId: string;
  onBack: () => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function Responses({ token, formId, onBack, onShowNotification }: ResponsesProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchFormDataAndResponses = async () => {
    try {
      // 1. Fetch form
      const formRes = await fetch(`/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!formRes.ok) throw new Error('Failed to load form schema');
      const formData = await formRes.json();
      setForm(formData.form);

      // 2. Fetch submissions
      const subRes = await fetch(`/api/forms/${formId}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!subRes.ok) throw new Error('Failed to load responses');
      const subData = await subRes.json();
      setSubmissions(subData.submissions);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormDataAndResponses();
  }, [formId]);

  const handleDeleteResponse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this response? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/responses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete response');
      onShowNotification('Response deleted successfully', 'success');
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!form) return;
    // Trigger download from backend API
    const downloadUrl = `/api/forms/${formId}/export/${format}?token=${token}`;
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    // Set customized headers via iframe window location bypass
    // Standard link click works beautifully on cloud run container endpoints!
    // Since the API requires Authorization header, let's construct it with search parameter if Express supports it,
    // wait, our Express API authenticates via Bearer token, so we can also fetch it directly as a blob and save it,
    // which is 100% immune to auth failures! Yes!
    
    fetch(`/api/forms/${formId}/export/${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to export responses');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = `form_${form.shareId}_responses.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification(`Responses exported as ${format.toUpperCase()}`, 'success');
    })
    .catch(err => {
      onShowNotification(err.message, 'error');
    });
  };

  const filteredSubmissions = submissions.filter(sub => {
    // 1. Search filter: check if search text is anywhere inside the sub's answers values
    const matchSearch = searchQuery ? Object.values(sub.answers).some(val => {
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (Array.isArray(val)) {
        return val.some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return false;
    }) : true;

    // 2. Date filter
    const matchDate = dateFilter ? sub.submittedAt.startsWith(dateFilter) : true;

    return matchSearch && matchDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!form) return null;

  const sortedFields = [...form.fields].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div id="responses-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
              Form Responses
            </h2>
            <p className="text-2xs text-gray-400 dark:text-zinc-500 mt-0.5">
              Explore submissions for "{form.title}" layout configurations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => handleExport('csv')}
            disabled={submissions.length === 0}
            className="flex-1 sm:flex-none px-3.5 py-2 border border-gray-250 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={submissions.length === 0}
            className="flex-1 sm:flex-none px-3.5 py-2 border border-gray-250 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      {/* Table search filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm text-xs">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-2xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Responses Table list */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm space-y-3">
          <div className="inline-flex p-4 bg-gray-50 dark:bg-zinc-850 rounded-full text-gray-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">No submissions found</h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">
            {submissions.length === 0
              ? 'This form is published but has not received any submission responses yet.'
              : 'Try relaxing your filter query to match entries.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-850/50 border-b border-gray-100 dark:border-zinc-800 text-3xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Submission Details</th>
                  {sortedFields.slice(0, 3).map(field => (
                    <th key={field.id} className="px-6 py-4">{field.label}</th>
                  ))}
                  {sortedFields.length > 3 && <th className="px-6 py-4">...</th>}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                {filteredSubmissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                    <td className="px-6 py-4 space-y-1">
                      <span className="font-bold text-gray-900 dark:text-white font-mono text-3xs">
                        {sub.id.substring(0, 8)}...
                      </span>
                      <div className="text-3xs text-gray-400">
                        {new Date(sub.submittedAt).toLocaleString()} • {sub.completionTimeSeconds}s
                      </div>
                    </td>

                    {sortedFields.slice(0, 3).map(field => {
                      const ans = sub.answers[field.id];
                      let displayVal = '-';
                      if (ans !== undefined && ans !== null) {
                        if (Array.isArray(ans)) {
                          displayVal = ans.join(', ');
                        } else if (typeof ans === 'boolean') {
                          displayVal = ans ? 'Yes' : 'No';
                        } else if (field.type === 'file' && ans.originalName) {
                          displayVal = ans.originalName;
                        } else {
                          displayVal = String(ans);
                        }
                      }
                      return (
                        <td key={field.id} className="px-6 py-4 text-gray-600 dark:text-zinc-300 max-w-[180px] truncate">
                          {displayVal}
                        </td>
                      );
                    })}

                    {sortedFields.length > 3 && (
                      <td className="px-6 py-4 text-gray-400 italic">
                        +{sortedFields.length - 3} fields
                      </td>
                    )}

                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/70 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer flex items-center gap-1 transition-all"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResponse(sub.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer transition-all"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail Popover Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 max-w-lg w-full rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-3xs text-indigo-600 font-bold uppercase tracking-wider">
                  Submission ID
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base font-mono">
                  {selectedSubmission.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-850/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-2xs">
                <div>
                  <span className="block text-gray-400">Date Completed</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200 block mt-0.5">
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400">Time Taken</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200 block mt-0.5">
                    {selectedSubmission.completionTimeSeconds} seconds
                  </span>
                </div>
              </div>

              {/* Answers Grid mapping */}
              <div className="space-y-3">
                <h4 className="font-bold text-2xs text-gray-400 uppercase tracking-wider">
                  Submitted Answers
                </h4>
                {sortedFields.map(field => {
                  const val = selectedSubmission.answers[field.id];
                  let display = <span className="text-gray-400 italic">No answer submitted</span>;

                  if (val !== undefined && val !== null && val !== '') {
                    if (field.type === 'file' && val.url) {
                      display = (
                        <a
                          href={val.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          📂 Download {val.originalName || 'Uploaded File'} ({Math.round(val.size / 1024)} KB)
                        </a>
                      );
                    } else if (Array.isArray(val)) {
                      display = <span className="font-semibold">{val.join(', ')}</span>;
                    } else if (typeof val === 'boolean') {
                      display = <span className="font-semibold">{val ? 'Yes' : 'No'}</span>;
                    } else {
                      display = <span className="font-semibold">{String(val)}</span>;
                    }
                  }

                  return (
                    <div key={field.id} className="p-3 bg-gray-50/50 dark:bg-zinc-850/20 rounded-lg border border-gray-150/40 dark:border-zinc-850">
                      <span className="text-3xs text-indigo-600 dark:text-indigo-400 font-semibold block uppercase tracking-wider">
                        {field.label}
                      </span>
                      <div className="text-gray-800 dark:text-zinc-200 mt-1">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-250 hover:dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Support for FileSpreadsheet fallback icon since we import Lucide
function FileSpreadsheet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}
