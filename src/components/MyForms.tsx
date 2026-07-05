/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Edit2, Copy, Trash2, Send, Archive, Eye, CheckCircle, Clock, AlertCircle, FileSpreadsheet, Share2 } from 'lucide-react';
import { Form } from '../types';
import ShareFormModal from './ShareFormModal';

interface MyFormsProps {
  token: string;
  onNavigate: (view: string, formId?: string) => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function MyForms({ token, onNavigate, onShowNotification }: MyFormsProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalForm, setShareModalForm] = useState<Form | null>(null);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load forms');
      const data = await res.json();
      setForms(data.forms);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [token]);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });

      if (!res.ok) throw new Error('Failed to create form');
      const data = await res.json();
      onShowNotification('Form created successfully!', 'success');
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      // Navigate straight to builder
      onNavigate('builder', data.form.id);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleDuplicateForm = async (id: string) => {
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to duplicate form');
      onShowNotification('Form duplicated successfully!', 'success');
      setActionMenuOpenId(null);
      fetchForms();
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete form');
      onShowNotification('Form deleted successfully', 'success');
      setActionMenuOpenId(null);
      fetchForms();
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (id: string, action: 'publish' | 'archive') => {
    try {
      const res = await fetch(`/api/forms/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to ${action} form`);
      onShowNotification(`Form is now ${action === 'publish' ? 'published' : 'archived'}!`, 'success');
      setActionMenuOpenId(null);
      if (action === 'publish') {
        const publishedForm = forms.find(f => f.id === id);
        if (publishedForm) {
          setShareModalForm({ ...publishedForm, status: 'published' });
          setShareModalOpen(true);
        }
      }
      fetchForms();
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            <CheckCircle className="w-3.5 h-3.5" /> Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-200/50 dark:border-zinc-700/50">
            <Archive className="w-3.5 h-3.5" /> Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  return (
    <div id="forms-view" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            My Forms
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Build layouts, duplicate templates, configure logic, or explore responses.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Form
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'draft', 'published', 'archived'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-200 border border-indigo-100 dark:border-zinc-700'
                  : 'bg-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              {status} Forms
            </button>
          ))}
        </div>
      </div>

      {/* Forms Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-10 h-10 animate-spin" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm space-y-4">
          <div className="inline-flex p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-full text-gray-400 dark:text-zinc-500">
            <Send className="w-8 h-8" />
          </div>
          <div className="max-w-xs mx-auto">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base">No forms found</h4>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Create a new template to start compiling respondents' details.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => (
            <div
              key={form.id}
              className="relative p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  {getStatusBadge(form.status)}
                  
                  {/* Custom Action Popover Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpenId(actionMenuOpenId === form.id ? null : form.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-gray-400 dark:text-zinc-500"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {actionMenuOpenId === form.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpenId(null)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-20 text-sm">
                          <button
                            onClick={() => onNavigate('builder', form.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" /> Layout Builder
                          </button>
                          <button
                            onClick={() => handleDuplicateForm(form.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" /> Duplicate
                          </button>
                          {form.status !== 'published' && (
                            <button
                              onClick={() => handleUpdateStatus(form.id, 'publish')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-4 h-4" /> Publish Form
                            </button>
                          )}
                          {form.status === 'published' && (
                            <button
                              onClick={() => {
                                setShareModalForm(form);
                                setShareModalOpen(true);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" /> Share Link
                            </button>
                          )}
                          {form.status === 'published' && (
                            <button
                              onClick={() => handleUpdateStatus(form.id, 'archive')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 flex items-center gap-2 cursor-pointer"
                            >
                              <Archive className="w-4 h-4" /> Archive Form
                            </button>
                          )}
                          <hr className="my-1 border-gray-100 dark:border-zinc-800" />
                          <button
                            onClick={() => handleDeleteForm(form.id)}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Form
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-lg text-gray-900 dark:text-white font-display tracking-tight mb-1.5">
                  {form.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {form.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-zinc-850 mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-zinc-500">
                <div className="flex flex-col gap-0.5">
                  <span>Version {form.currentVersion}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {(form as any).responsesCount || 0} responses
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('responses', form.id)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                    title="View Responses"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Responses</span>
                  </button>

                  {form.status === 'published' && (
                    <a
                      href={`/?formId=${form.shareId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
                      title="Open Public Link"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Form</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 max-w-md w-full rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">
              Create New Dynamic Form
            </h3>
            <form onSubmit={handleCreateForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Form Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Customer Feedback Form"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe the goal of this data collection..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-gray-700 dark:text-zinc-300 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium cursor-pointer"
                >
                  Create and Design Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareModalForm && (
        <ShareFormModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareModalForm(null);
          }}
          formTitle={shareModalForm.title}
          shareId={shareModalForm.shareId}
          formId={shareModalForm.id}
          onShowNotification={onShowNotification}
        />
      )}
    </div>
  );
}
