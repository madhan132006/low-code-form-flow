/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, Upload, CheckCircle, AlertCircle, Calendar, Clock, Eye, Sparkles } from 'lucide-react';
import { Form, Field, UploadedFile, ConditionalRule } from '../types';

interface PublicFormProps {
  form: Form;
  isPreview?: boolean; // If true, does not submit to server analytics
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function PublicForm({ form, isPreview = false, onShowNotification }: PublicFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  // Track page loaded timestamp to compute completion duration
  const loadTimeRef = useRef<number>(Date.now());

  // Initialize form default values
  useEffect(() => {
    const defaults: Record<string, any> = {};
    form.fields.forEach(f => {
      if (f.defaultValue !== undefined && f.defaultValue !== '') {
        defaults[f.id] = f.defaultValue;
      } else if (f.type === 'checkbox') {
        defaults[f.id] = [];
      } else if (f.type === 'yesno') {
        defaults[f.id] = false;
      }
    });
    setAnswers(defaults);
    loadTimeRef.current = Date.now();
  }, [form]);

  // Dynamic evaluation of logic rules to determine field states
  // We compute which fields are currently visible and which are required
  const evaluateLogic = () => {
    const visibleFields = new Set<string>();
    const requiredFields = new Set<string>();

    // By default, fields with "Show" rules targeting them are hidden until triggered.
    // Fields without "Show" rules targeting them are visible by default.
    const hasShowRules = new Set<string>();
    (form.rules || []).forEach(r => {
      if (r.action === 'show') {
        hasShowRules.add(r.targetFieldId);
      }
    });

    // Initialize visibility and base requirements
    form.fields.forEach(f => {
      if (!hasShowRules.has(f.id)) {
        visibleFields.add(f.id);
      }
      if (f.required) {
        requiredFields.add(f.id);
      }
    });

    // Evaluate each rule
    (form.rules || []).forEach(rule => {
      const value = answers[rule.fieldId];
      let conditionMet = false;

      // Skip evaluation if trigger field is hidden (cascade logic)
      if (form.rules.some(r => r.targetFieldId === rule.fieldId && !visibleFields.has(rule.fieldId))) {
        return;
      }

      switch (rule.operator) {
        case 'equals':
          conditionMet = String(value || '').toLowerCase() === String(rule.value || '').toLowerCase();
          break;
        case 'not_equals':
          conditionMet = String(value || '').toLowerCase() !== String(rule.value || '').toLowerCase();
          break;
        case 'greater_than':
          conditionMet = Number(value || 0) > Number(rule.value || 0);
          break;
        case 'less_than':
          conditionMet = Number(value || 0) < Number(rule.value || 0);
          break;
        case 'contains':
          conditionMet = String(value || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
          break;
        case 'is_empty':
          conditionMet = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
          break;
        case 'is_not_empty':
          conditionMet = value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
          break;
      }

      if (conditionMet) {
        if (rule.action === 'show') {
          visibleFields.add(rule.targetFieldId);
        } else if (rule.action === 'hide') {
          visibleFields.delete(rule.targetFieldId);
        } else if (rule.action === 'require') {
          requiredFields.add(rule.targetFieldId);
        }
      }
    });

    return { visibleFields, requiredFields };
  };

  const { visibleFields, requiredFields } = evaluateLogic();

  // Handle value change for text input, dropdowns, etc.
  const handleValueChange = (fieldId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: val }));
    // Clear field validation error upon editing
    if (errors[fieldId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Handle multi-checkbox value toggle
  const handleCheckboxToggle = (fieldId: string, option: string) => {
    const current = answers[fieldId] || [];
    let updated;
    if (current.includes(option)) {
      updated = current.filter((o: string) => o !== option);
    } else {
      updated = [...current, option];
    }
    handleValueChange(fieldId, updated);
  };

  // Handle real-time file upload
  const handleFileUpload = async (fieldId: string, file: File, rules: any) => {
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });

    // Client-side file validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (rules.allowedFileTypes && rules.allowedFileTypes.length > 0) {
      if (!ext || !rules.allowedFileTypes.includes(ext)) {
        setErrors(prev => ({ ...prev, [fieldId]: `Allowed formats: ${rules.allowedFileTypes.join(', ')}` }));
        return;
      }
    }

    if (rules.maxFileSizeMB) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > rules.maxFileSizeMB) {
        setErrors(prev => ({ ...prev, [fieldId]: `Maximum file size is ${rules.maxFileSizeMB}MB` }));
        return;
      }
    }

    setUploadingFieldId(fieldId);
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const res = await fetch('/api/public/upload', {
        method: 'POST',
        body: formDataObj,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      handleValueChange(fieldId, data.file);
      onShowNotification('File uploaded successfully!', 'success');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [fieldId]: 'Upload failed. Please try again.' }));
    } finally {
      setUploadingFieldId(null);
    }
  };

  // Drag and drop file upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, fieldId: string, rules: any) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(fieldId, e.dataTransfer.files[0], rules);
    }
  };

  // Client-side submit validation check
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      if (!visibleFields.has(field.id)) return; // Don't validate hidden fields

      const val = answers[field.id];
      const isRequired = requiredFields.has(field.id);

      // Check requirement
      if (isRequired) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
          return;
        }
      }

      // If value is provided, evaluate other validations
      if (val !== undefined && val !== null && val !== '') {
        const rules = field.validationRules || {};

        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val))) {
            newErrors[field.id] = 'Please provide a valid email address';
          }
        }

        if (field.type === 'phone') {
          const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
          if (!phoneRegex.test(String(val))) {
            newErrors[field.id] = 'Please provide a valid phone number';
          }
        }

        if (field.type === 'text' || field.type === 'textarea') {
          const strVal = String(val);
          if (rules.minLength && strVal.length < rules.minLength) {
            newErrors[field.id] = `Must be at least ${rules.minLength} characters`;
          }
          if (rules.maxLength && strVal.length > rules.maxLength) {
            newErrors[field.id] = `Cannot exceed ${rules.maxLength} characters`;
          }
        }

        if (field.type === 'number') {
          const numVal = Number(val);
          if (rules.minValue !== undefined && numVal < rules.minValue) {
            newErrors[field.id] = `Value must be greater than or equal to ${rules.minValue}`;
          }
          if (rules.maxValue !== undefined && numVal > rules.maxValue) {
            newErrors[field.id] = `Value must be less than or equal to ${rules.maxValue}`;
          }
        }

        if (field.type === 'date') {
          const dateVal = new Date(val);
          if (rules.dateRangeStart && dateVal < new Date(rules.dateRangeStart)) {
            newErrors[field.id] = `Date must be after ${rules.dateRangeStart}`;
          }
          if (rules.dateRangeEnd && dateVal > new Date(rules.dateRangeEnd)) {
            newErrors[field.id] = `Date must be before ${rules.dateRangeEnd}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowNotification('Please resolve the validation errors on the form fields.', 'error');
      return;
    }

    setSubmitting(true);
    const durationSeconds = Math.round((Date.now() - loadTimeRef.current) / 1000);

    // Filter out answers for currently hidden fields
    const filteredAnswers: Record<string, any> = {};
    form.fields.forEach(field => {
      if (visibleFields.has(field.id)) {
        filteredAnswers[field.id] = answers[field.id];
      }
    });

    if (isPreview) {
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
        onShowNotification('Form submission simulated successfully!', 'success');
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`/api/public/forms/${form.shareId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: filteredAnswers,
          completionTimeSeconds: durationSeconds,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit form responses');
      setSubmitted(true);
      onShowNotification('Form responses submitted successfully!', 'success');
    } catch (err: any) {
      onShowNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div id="submit-success-page" className="text-center py-12 space-y-5 animate-fade-in">
        <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle className="w-12 h-12" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            Submission Received!
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Thank you for your response. Your form submission has been securely compiled and registered.
          </p>
        </div>
        {isPreview && (
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              loadTimeRef.current = Date.now();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
          >
            Fill Out Form Again
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in text-xs text-left">
      <div>
        <h1 className="text-xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 pb-4 border-b border-gray-100 dark:border-zinc-800">
            {form.description}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {form.fields
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(field => {
            if (!visibleFields.has(field.id)) return null;

            const value = answers[field.id];
            const error = errors[field.id];
            const isRequired = requiredFields.has(field.id);

            return (
              <div key={field.id} className="space-y-1.5">
                <label className="block font-semibold text-gray-800 dark:text-zinc-200">
                  {field.label}
                  {isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
                </label>

                {/* Single line text input */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Multiline textarea */}
                {field.type === 'textarea' && (
                  <textarea
                    placeholder={field.placeholder}
                    value={value || ''}
                    rows={3}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Numerical Input */}
                {field.type === 'number' && (
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Email address */}
                {field.type === 'email' && (
                  <input
                    type="email"
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Phone Selector */}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    placeholder={field.placeholder}
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Date Picker */}
                {field.type === 'date' && (
                  <div className="relative">
                    <input
                      type="date"
                      value={value || ''}
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Time Picker */}
                {field.type === 'time' && (
                  <input
                    type="time"
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                )}

                {/* Dropdown Options */}
                {field.type === 'dropdown' && (
                  <select
                    value={value || ''}
                    onChange={(e) => handleValueChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose Options...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {/* Radio Options List */}
                {field.type === 'radio' && (
                  <div className="space-y-1.5 pt-1">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-zinc-300">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={value === opt}
                          onChange={() => handleValueChange(field.id, opt)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multi-Checkbox Options */}
                {field.type === 'checkbox' && (
                  <div className="space-y-1.5 pt-1">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={(value || []).includes(opt)}
                          onChange={() => handleCheckboxToggle(field.id, opt)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Rating 1-5 Stars */}
                {field.type === 'rating' && (
                  <div className="flex items-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map(star => {
                      const active = star <= (value || 0);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleValueChange(field.id, star)}
                          className="p-1 text-gray-300 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-gray-350'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Yes/No switch */}
                {field.type === 'yesno' && (
                  <div className="flex items-center gap-3 py-1">
                    <button
                      type="button"
                      onClick={() => handleValueChange(field.id, !value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        value ? 'bg-indigo-600' : 'bg-gray-250 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {value ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}

                {/* Drag and Drop File upload */}
                {field.type === 'file' && (
                  <div className="space-y-2">
                    {value ? (
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <div>
                            <span className="font-semibold block">{value.originalName}</span>
                            <span className="text-3xs text-emerald-600/70">{Math.round(value.size / 1024)} KB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleValueChange(field.id, null)}
                          className="text-emerald-600 font-bold hover:underline cursor-pointer text-2xs"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, field.id, field.validationRules)}
                        className="border-2 border-dashed border-gray-250 dark:border-zinc-800 rounded-xl p-6 text-center hover:border-indigo-400 transition-all bg-gray-50/40 dark:bg-zinc-850/10 cursor-pointer flex flex-col items-center justify-center gap-2"
                        onClick={() => {
                          const fileInput = document.getElementById(`file-input-${field.id}`);
                          fileInput?.click();
                        }}
                      >
                        <input
                          type="file"
                          id={`file-input-${field.id}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(field.id, e.target.files[0], field.validationRules);
                            }
                          }}
                        />
                        {uploadingFieldId === field.id ? (
                          <div className="border-2 border-indigo-600 border-t-transparent rounded-full w-6 h-6 animate-spin mb-1" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                        <p className="font-semibold text-gray-700 dark:text-zinc-300">
                          {uploadingFieldId === field.id ? 'Uploading file...' : 'Drag and drop file, or click to upload'}
                        </p>
                        <p className="text-3xs text-gray-400">
                          Supports {field.validationRules?.allowedFileTypes?.join(', ').toUpperCase() || 'any format'} (up to {field.validationRules?.maxFileSizeMB || 5}MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Help text */}
                {field.helpText && (
                  <span className="text-3xs text-gray-400 dark:text-zinc-500 mt-1 block italic">
                    {field.helpText}
                  </span>
                )}

                {/* Validation error line */}
                {error && (
                  <span className="text-2xs text-red-500 mt-1 block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-8 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
      >
        {submitting ? (
          <span className="border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin" />
        ) : (
          <>Submit Form</>
        )}
      </button>
    </form>
  );
}
