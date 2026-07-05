/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Form, ConditionalRule, LogicOperator, LogicAction } from '../types';

interface ConditionalLogicProps {
  form: Form;
  onUpdateRules: (rules: ConditionalRule[]) => void;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

const OPERATORS: { value: LogicOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does Not Equal' },
  { value: 'greater_than', label: 'Is Greater Than' },
  { value: 'less_than', label: 'Is Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const ACTIONS: { value: LogicAction; label: string }[] = [
  { value: 'show', label: 'Show Field' },
  { value: 'hide', label: 'Hide Field' },
  { value: 'require', label: 'Make Required' },
];

export default function ConditionalLogic({ form, onUpdateRules, onShowNotification }: ConditionalLogicProps) {
  const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
    fieldId: '',
    operator: 'equals',
    value: '',
    targetFieldId: '',
    action: 'show',
  });

  const handleAddRule = () => {
    if (!newRule.fieldId || !newRule.targetFieldId || !newRule.operator || !newRule.action) {
      onShowNotification('Please select trigger field, condition, action, and target field', 'error');
      return;
    }

    if (newRule.fieldId === newRule.targetFieldId) {
      onShowNotification('A field cannot trigger a logic rule on itself', 'error');
      return;
    }

    const rule: ConditionalRule = {
      id: `rule_${Math.random().toString(36).substring(2, 9)}`,
      fieldId: newRule.fieldId,
      operator: newRule.operator as LogicOperator,
      value: newRule.value || '',
      targetFieldId: newRule.targetFieldId,
      action: newRule.action as LogicAction,
    };

    onUpdateRules([...(form.rules || []), rule]);
    onShowNotification('Conditional logic rule added!', 'success');
    setNewRule({
      fieldId: '',
      operator: 'equals',
      value: '',
      targetFieldId: '',
      action: 'show',
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    onUpdateRules((form.rules || []).filter(r => r.id !== ruleId));
    onShowNotification('Logic rule removed', 'success');
  };

  const getFieldName = (fieldId: string) => {
    const field = form.fields.find(f => f.id === fieldId);
    return field ? field.label : `[Deleted Field]`;
  };

  return (
    <div id="logic-rules-container" className="space-y-6">
      <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
            Add Conditional Rule
          </h3>
          <p className="text-2xs text-gray-500 dark:text-zinc-400 mt-1">
            Build dynamic branching flows. Control which fields show, hide, or become mandatory based on user input.
          </p>
        </div>

        {form.fields.length < 2 ? (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/40 rounded-xl text-amber-800 dark:text-amber-400/80 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>You need at least 2 fields in your form to construct conditional flow.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-4 bg-gray-50 dark:bg-zinc-850/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
            {/* Trigger field selector */}
            <div className="space-y-1">
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wider">
                IF Field
              </label>
              <select
                value={newRule.fieldId}
                onChange={(e) => setNewRule({ ...newRule, fieldId: e.target.value })}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Select Field...</option>
                {form.fields.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Operator selector */}
            <div className="space-y-1">
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wider">
                Condition
              </label>
              <select
                value={newRule.operator}
                onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as LogicOperator })}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            {/* Comparison value (not required for is_empty/is_not_empty) */}
            {newRule.operator !== 'is_empty' && newRule.operator !== 'is_not_empty' && (
              <div className="space-y-1">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wider">
                  Target Value
                </label>
                <input
                  type="text"
                  placeholder="Comparison value..."
                  value={newRule.value || ''}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Logic action and target field selector */}
            <div className="space-y-1">
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wider">
                THEN Action
              </label>
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as LogicAction })}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
              >
                {ACTIONS.map(ac => (
                  <option key={ac.value} value={ac.value}>{ac.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wider">
                Target Field
              </label>
              <select
                value={newRule.targetFieldId}
                onChange={(e) => setNewRule({ ...newRule, targetFieldId: e.target.value })}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Select Field...</option>
                {form.fields.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Logic Rule
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules listing summary list */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white font-display text-sm">
          Active Logic Flow
        </h3>

        {!form.rules || form.rules.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl space-y-2">
            <span className="text-xl block">⚡</span>
            <span>No conditional logic rules active for this form.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {form.rules.map((rule, idx) => {
              const opLabel = OPERATORS.find(op => op.value === rule.operator)?.label || rule.operator;
              const acLabel = ACTIONS.find(ac => ac.value === rule.action)?.label || rule.action;

              return (
                <div
                  key={rule.id}
                  className="p-4 border border-gray-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between text-xs hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-bold font-mono text-[10px] text-gray-500">
                      RULE {idx + 1}
                    </span>
                    <span className="text-gray-500 dark:text-zinc-400">If</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{getFieldName(rule.fieldId)}</strong>
                    <span className="italic text-gray-400">{opLabel.toLowerCase()}</span>
                    {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                      <strong className="text-gray-800 dark:text-zinc-200">"{rule.value}"</strong>
                    )}
                    <span className="text-gray-500 dark:text-zinc-400">then</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{acLabel}</strong>
                    <strong className="text-gray-800 dark:text-zinc-200">({getFieldName(rule.targetFieldId)})</strong>
                  </div>

                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 cursor-pointer transition-all"
                    title="Remove Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
