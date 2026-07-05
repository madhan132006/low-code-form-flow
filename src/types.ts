/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Stored hashed/encrypted
  created_at: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'rating'
  | 'yesno';

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  allowedFileTypes?: string[]; // e.g. ['pdf', 'docx', 'jpg', 'png']
  maxFileSizeMB?: number;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  defaultValue: any;
  helpText: string;
  validationRules: ValidationRules;
  displayOrder: number;
  options?: string[]; // For dropdown, radio, checkbox
}

export type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty';

export type LogicAction = 'show' | 'hide' | 'require';

export interface ConditionalRule {
  id: string;
  fieldId: string; // The field whose value determines the logic
  operator: LogicOperator;
  value: string; // Comparison value
  targetFieldId: string; // The field affected by the outcome
  action: LogicAction;
}

export type FormStatus = 'draft' | 'published' | 'archived';

export interface Form {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  shareId: string; // Slug/hash for public link
  currentVersion: number;
  created_at: string;
  updated_at: string;
  fields: Field[];
  rules: ConditionalRule[];
  category?: string;
  preventDuplicates?: boolean;
}

export interface FormVersion {
  id: string;
  formId: string;
  version: number;
  fields: Field[];
  rules: ConditionalRule[];
  created_at: string;
  category?: string;
  preventDuplicates?: boolean;
}

export interface Submission {
  id: string;
  formId: string;
  formVersion: number;
  answers: Record<string, any>; // fieldId -> raw value(s)
  submittedAt: string;
  completionTimeSeconds: number; // Duration to complete the form
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string; // API URL to download
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DatabaseState {
  users: User[];
  forms: Form[];
  versions: FormVersion[];
  submissions: Submission[];
  files: UploadedFile[];
  logs: AuditLog[];
}
