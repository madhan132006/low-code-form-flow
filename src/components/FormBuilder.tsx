/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Save,
  Check,
  HelpCircle,
  ToggleLeft,
  Sliders,
  Sparkles,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Send,
  Share2,
  History
} from 'lucide-react';
import { Form, Field, FieldType, ValidationRules } from '../types';
import ConditionalLogic from './ConditionalLogic';
import PublicForm from './PublicForm';
import ShareFormModal from './ShareFormModal';

interface FormBuilderProps {
  token: string;
  formId: string;
  onBack: () => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Single Line Text', icon: '📝' },
  { type: 'textarea', label: 'Multi-line Text', icon: '📄' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'email', label: 'Email Address', icon: '📧' },
  { type: 'phone', label: 'Phone Number', icon: '📞' },
  { type: 'date', label: 'Date Selector', icon: '📅' },
  { type: 'time', label: 'Time Selector', icon: '⏰' },
  { type: 'dropdown', label: 'Dropdown List', icon: '🔽' },
  { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
  { type: 'checkbox', label: 'Checkboxes', icon: '☑️' },
  { type: 'file', label: 'File Upload', icon: '📁' },
  { type: 'rating', label: 'Rating (1-5)', icon: '⭐' },
  { type: 'yesno', label: 'Yes/No Switch', icon: '🔄' },
];

export default function FormBuilder({ token, formId, onBack, onShowNotification }: FormBuilderProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fields' | 'logic' | 'preview' | 'versions'>('fields');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Auto-save debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load form');
      const data = await res.json();
      setForm(data.form);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/forms/${formId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load version history');
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handlePublishForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to publish form');
      const data = await res.json();
      setForm(data.form);
      onShowNotification('Form published successfully!', 'success');
      setShareOpen(true);
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore the layout to Version ${versionNumber}? The current configuration will be saved as a snapshot first.`)) return;
    try {
      const res = await fetch(`/api/forms/${formId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to restore version');
      const data = await res.json();
      setForm(data.form);
      onShowNotification(`Successfully restored form layout to Version ${versionNumber}!`, 'success');
      setActiveTab('fields');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchForm();
  }, [formId]);

  useEffect(() => {
    if (activeTab === 'versions') {
      fetchVersions();
    }
  }, [activeTab]);

  // Handle auto-save layout whenever fields or rules change
  const triggerAutoSave = (updatedForm: Form) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/forms/${formId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fields: updatedForm.fields,
            rules: updatedForm.rules,
            title: updatedForm.title,
            description: updatedForm.description,
            category: updatedForm.category,
            preventDuplicates: updatedForm.preventDuplicates,
          }),
        });

        if (!res.ok) throw new Error('Auto-save failed');
        const data = await res.json();
        setForm(data.form); // Grab fresh copy
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error('Auto-save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1200); // 1.2s debounce
  };

  const handleAddField = (type: FieldType) => {
    if (!form) return;

    const newField: Field = {
      id: `field_${Math.random().toString(36).substring(2, 9)}`,
      type,
      label: `New ${FIELD_TYPES.find(f => f.type === type)?.label || 'Field'}`,
      placeholder: type === 'rating' ? '' : 'Enter text here...',
      required: false,
      defaultValue: type === 'yesno' ? false : type === 'rating' ? 0 : '',
      helpText: '',
      validationRules: type === 'file' ? { allowedFileTypes: ['pdf', 'docx', 'jpg', 'png'], maxFileSizeMB: 5 } : {},
      displayOrder: form.fields.length + 1,
      options: ['dropdown', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };

    const updatedForm = {
      ...form,
      fields: [...form.fields, newField],
    };

    setForm(updatedForm);
    setSelectedFieldId(newField.id);
    triggerAutoSave(updatedForm);
    onShowNotification('Field added!', 'success');
  };

  const handleUpdateField = (fieldId: string, updates: Partial<Field>) => {
    if (!form) return;

    const updatedFields = form.fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, ...updates };
      }
      return field;
    });

    const updatedForm = { ...form, fields: updatedFields };
    setForm(updatedForm);
    triggerAutoSave(updatedForm);
  };

  const handleRemoveField = (fieldId: string) => {
    if (!form) return;

    const updatedFields = form.fields
      .filter(field => field.id !== fieldId)
      .map((field, idx) => ({ ...field, displayOrder: idx + 1 }));

    // Also clear associated logic rules targeting this field
    const updatedRules = form.rules.filter(rule => rule.fieldId !== fieldId && rule.targetFieldId !== fieldId);

    const updatedForm = { ...form, fields: updatedFields, rules: updatedRules };
    setForm(updatedForm);
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
    triggerAutoSave(updatedForm);
    onShowNotification('Field removed', 'success');
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= form.fields.length) return;

    const updatedFields = [...form.fields];
    // Swap
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[targetIdx];
    updatedFields[targetIdx] = temp;

    // Reset display orders
    const orderedFields = updatedFields.map((field, idx) => ({ ...field, displayOrder: idx + 1 }));

    const updatedForm = { ...form, fields: orderedFields };
    setForm(updatedForm);
    triggerAutoSave(updatedForm);
  };

  const handleFormMetaChange = (key: 'title' | 'description' | 'category' | 'preventDuplicates', value: any) => {
    if (!form) return;
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    triggerAutoSave(updatedForm);
  };

  const handleSaveLayout = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fields: form.fields,
          rules: form.rules,
          title: form.title,
          description: form.description,
          category: form.category,
          preventDuplicates: form.preventDuplicates,
        }),
      });
      if (!res.ok) throw new Error('Failed to save layout');
      const data = await res.json();
      setForm(data.form);
      setLastSaved(new Date().toLocaleTimeString());
      onShowNotification('All changes saved successfully!', 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!form) return null;

  const selectedField = form.fields.find(f => f.id === selectedFieldId);

  return (
    <div id="form-builder-view" className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                Designing Form
              </h2>
              {form.status === 'published' && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  Published (v{form.currentVersion})
                </span>
              )}
            </div>
            <div className="text-2xs text-gray-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
              <span>{isSaving ? 'Saving changes...' : lastSaved ? `Last saved at ${lastSaved}` : 'All changes saved automatically'}</span>
              {isSaving && <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <div className="flex flex-wrap bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'fields'
                  ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Fields
            </button>
            <button
              onClick={() => setActiveTab('logic')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'logic'
                  ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Logic Rules ({form.rules?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'versions'
                  ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Version History
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview Form
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {form.status !== 'published' ? (
              <button
                onClick={handlePublishForm}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publish
              </button>
            ) : (
              <button
                onClick={() => setShareOpen(true)}
                className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            )}

            <button
              onClick={handleSaveLayout}
              className="p-2 border border-gray-250 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-750 dark:text-zinc-300 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Save Layout Configuration"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 text-center">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-300 font-semibold text-2xs uppercase tracking-wider">
              Interactive Preview Mode
            </span>
            <p className="text-2xs text-gray-400 dark:text-zinc-500 mt-1">
              Actions will simulate submission flow, but won't record analytical storage.
            </p>
          </div>
          <PublicForm
            form={form}
            isPreview={true}
            onShowNotification={onShowNotification}
          />
        </div>
      )}

      {activeTab === 'logic' && (
        <ConditionalLogic
          form={form}
          onUpdateRules={(rules) => {
            const updatedForm = { ...form, rules };
            setForm(updatedForm);
            triggerAutoSave(updatedForm);
          }}
          onShowNotification={onShowNotification}
        />
      )}

      {activeTab === 'fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Available Field Elements Side Drawer */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white font-display text-sm tracking-wide">
              Click to Add Field
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {FIELD_TYPES.map(elem => (
                <button
                  key={elem.type}
                  onClick={() => handleAddField(elem.type)}
                  className="px-3 py-2 border border-gray-150 dark:border-zinc-800 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/10 dark:hover:bg-zinc-800 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="text-base">{elem.icon}</span>
                  <span>{elem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Layout Canvas */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-zinc-850">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormMetaChange('title', e.target.value)}
                className="w-full text-2xl font-bold font-display text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-0.5"
                placeholder="Form Title"
              />
              <textarea
                value={form.description}
                onChange={(e) => handleFormMetaChange('description', e.target.value)}
                className="w-full text-sm text-gray-500 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-0.5"
                placeholder="Form description or directions for respondent..."
                rows={2}
              />
            </div>

            {form.fields.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-250 dark:border-zinc-800 rounded-xl space-y-2">
                <span className="text-2xl block">🗺️</span>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  Form layout canvas is empty.
                </p>
                <p className="text-2xs text-gray-400 dark:text-zinc-500">
                  Select available elements from the left panel to compose fields.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.fields
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((field, idx) => {
                    const isSelected = field.id === selectedFieldId;
                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`group p-4 border rounded-2xl transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/10 dark:bg-zinc-800/30'
                            : 'border-gray-150 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <span className="text-2xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                              {field.type}
                            </span>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mt-0.5">
                              {field.label || 'Unnamed Field'}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                          </div>

                          {/* Control actions inside card */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(idx, 'up');
                              }}
                              className="p-1 rounded hover:bg-gray-150 dark:hover:bg-zinc-750 text-gray-400 dark:text-zinc-500 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={idx === form.fields.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(idx, 'down');
                              }}
                              className="p-1 rounded hover:bg-gray-150 dark:hover:bg-zinc-750 text-gray-400 dark:text-zinc-500 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveField(field.id);
                              }}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Layout field mockup representation */}
                        {field.placeholder && field.type !== 'rating' && field.type !== 'yesno' && (
                          <div className="text-xs text-gray-400 dark:text-zinc-500 italic bg-gray-50 dark:bg-zinc-800/20 px-2 py-1 rounded border border-gray-100 dark:border-zinc-850 mt-1">
                            {field.placeholder}
                          </div>
                        )}

                        {field.options && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {field.options.map(opt => (
                              <span
                                key={opt}
                                className="px-2 py-0.5 bg-gray-50 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border border-gray-150 dark:border-zinc-800 rounded text-2xs"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {field.helpText && (
                          <span className="text-2xs text-gray-400 dark:text-zinc-500 mt-1 block italic flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 shrink-0" />
                            {field.helpText}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Configuration Inspector Right Drawer */}
          <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white font-display text-sm tracking-wide border-b border-gray-100 dark:border-zinc-850 pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              Field Inspector
            </h3>

            {!selectedField ? (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
                Click any field on the canvas to configure validations and layout values.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* General config */}
                <div>
                  <label className="block text-2xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                {['text', 'textarea', 'number', 'email', 'phone', 'date', 'time'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-2xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={selectedField.placeholder}
                      onChange={(e) => handleUpdateField(selectedField.id, { placeholder: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-2xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Help Text (Instructions)
                  </label>
                  <input
                    type="text"
                    value={selectedField.helpText}
                    onChange={(e) => handleUpdateField(selectedField.id, { helpText: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                {/* Switch required */}
                <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-zinc-300 block">Required Field</span>
                    <span className="text-2xs text-gray-400 dark:text-zinc-500">Must be answered before submitting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => handleUpdateField(selectedField.id, { required: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* Dropdown / Radio / Checkbox options list */}
                {selectedField.options && (
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
                    <label className="block text-2xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Options (One per row)
                    </label>
                    <textarea
                      value={selectedField.options.join('\n')}
                      onChange={(e) => handleUpdateField(selectedField.id, { options: e.target.value.split('\n').filter(o => o.trim() !== '') })}
                      rows={4}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                      placeholder="e.g.&#10;Option A&#10;Option B"
                    />
                  </div>
                )}

                {/* Validation rules specialized panel */}
                <div className="space-y-3 p-3 bg-indigo-50/20 dark:bg-zinc-800/20 rounded-xl border border-indigo-100/30 dark:border-zinc-800">
                  <h4 className="font-bold text-2xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Validation Rules
                  </h4>

                  {selectedField.type === 'text' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Min Length</label>
                        <input
                          type="number"
                          value={selectedField.validationRules.minLength || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, minLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Max Length</label>
                        <input
                          type="number"
                          value={selectedField.validationRules.maxLength || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, maxLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {selectedField.type === 'number' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Min Value</label>
                        <input
                          type="number"
                          value={selectedField.validationRules.minValue !== undefined ? selectedField.validationRules.minValue : ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, minValue: e.target.value ? parseFloat(e.target.value) : undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Max Value</label>
                        <input
                          type="number"
                          value={selectedField.validationRules.maxValue !== undefined ? selectedField.validationRules.maxValue : ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, maxValue: e.target.value ? parseFloat(e.target.value) : undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {selectedField.type === 'date' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Range Start</label>
                        <input
                          type="date"
                          value={selectedField.validationRules.dateRangeStart || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, dateRangeStart: e.target.value || undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-3xs"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Range End</label>
                        <input
                          type="date"
                          value={selectedField.validationRules.dateRangeEnd || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, dateRangeEnd: e.target.value || undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-3xs"
                        />
                      </div>
                    </div>
                  )}

                  {selectedField.type === 'file' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Allowed Formats (pdf, docx, etc.)</label>
                        <input
                          type="text"
                          value={selectedField.validationRules.allowedFileTypes?.join(', ') || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, allowedFileTypes: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } })}
                          placeholder="pdf, docx, jpg, png"
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs text-gray-400 uppercase mb-0.5">Max File Size (MB)</label>
                        <input
                          type="number"
                          value={selectedField.validationRules.maxFileSizeMB || ''}
                          onChange={(e) => handleUpdateField(selectedField.id, { validationRules: { ...selectedField.validationRules, maxFileSizeMB: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  <span className="text-3xs text-gray-400 dark:text-zinc-500 block">
                    Validations execute in real-time when respondents submit answers.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
