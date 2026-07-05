/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseState, User, Form, FormVersion, Submission, UploadedFile, AuditLog, Field, ConditionalRule } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure database and uploads directory exist
function initDb() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialState: DatabaseState = {
      users: [],
      forms: [],
      versions: [],
      submissions: [],
      files: [],
      logs: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
  }
}

initDb();

// Helper to read database
export function readDb(): DatabaseState {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { users: [], forms: [], versions: [], submissions: [], files: [], logs: [] };
  }
}

// Helper to write database
export function writeDb(state: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// Password hashing
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate unique IDs
export function generateId(): string {
  return crypto.randomUUID();
}

export function generateShareId(): string {
  return crypto.randomBytes(4).toString('hex'); // 8 character random string
}

// Log action
export function addLog(userId: string | undefined, email: string | undefined, action: string, details: string) {
  const db = readDb();
  const log: AuditLog = {
    id: generateId(),
    userId,
    userEmail: email,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  db.logs.unshift(log);
  writeDb(db);
}

// Auth operations
export const dbAuth = {
  register: (name: string, email: string, password: string): User => {
    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashPassword(password),
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    addLog(newUser.id, newUser.email, 'USER_REGISTER', `User ${newUser.name} registered`);
    return { id: newUser.id, name: newUser.name, email: newUser.email, created_at: newUser.created_at };
  },

  login: (email: string, password: string): User => {
    const db = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === hashedPassword);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    addLog(user.id, user.email, 'USER_LOGIN', `User ${user.name} logged in`);
    return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
  }
};

// Form operations
export const dbForms = {
  list: (): Form[] => {
    const db = readDb();
    return db.forms;
  },

  getById: (id: string): Form | undefined => {
    const db = readDb();
    return db.forms.find(f => f.id === id);
  },

  getByShareId: (shareId: string): Form | undefined => {
    const db = readDb();
    return db.forms.find(f => f.shareId === shareId);
  },

  create: (title: string, description: string): Form => {
    const db = readDb();
    const newForm: Form = {
      id: generateId(),
      title: title || 'Untitled Form',
      description: description || '',
      status: 'draft',
      shareId: generateShareId(),
      currentVersion: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: [],
      rules: [],
      category: 'General',
      preventDuplicates: false,
    };

    db.forms.push(newForm);
    writeDb(db);

    addLog(undefined, undefined, 'CREATE_FORM', `Form "${newForm.title}" created`);
    return newForm;
  },

  update: (id: string, updates: Partial<Form>): Form => {
    const db = readDb();
    const formIndex = db.forms.findIndex(f => f.id === id);
    if (formIndex === -1) {
      throw new Error('Form not found');
    }

    const currentForm = db.forms[formIndex];
    let nextVersion = currentForm.currentVersion;

    // Check versioning: if published and changes are fields or rules, create a new version of historical data
    const fieldsChanged = updates.fields !== undefined && JSON.stringify(updates.fields) !== JSON.stringify(currentForm.fields);
    const rulesChanged = updates.rules !== undefined && JSON.stringify(updates.rules) !== JSON.stringify(currentForm.rules);

    if (currentForm.status === 'published' && (fieldsChanged || rulesChanged)) {
      // 1. Create a snapshot of the current state before applying updates
      const versionSnapshot: FormVersion = {
        id: generateId(),
        formId: currentForm.id,
        version: currentForm.currentVersion,
        fields: currentForm.fields,
        rules: currentForm.rules,
        created_at: new Date().toISOString(),
        category: currentForm.category || 'General',
        preventDuplicates: currentForm.preventDuplicates || false,
      };
      db.versions.push(versionSnapshot);

      // 2. Increment version number for the updated form
      nextVersion += 1;
      addLog(undefined, undefined, 'CREATE_VERSION', `Form "${currentForm.title}" incremented to version ${nextVersion}`);
    }

    const updatedForm: Form = {
      ...currentForm,
      ...updates,
      currentVersion: nextVersion,
      updated_at: new Date().toISOString(),
    };

    db.forms[formIndex] = updatedForm;
    writeDb(db);

    addLog(undefined, undefined, 'UPDATE_FORM', `Form "${updatedForm.title}" updated`);
    return updatedForm;
  },

  duplicate: (id: string): Form => {
    const db = readDb();
    const original = db.forms.find(f => f.id === id);
    if (!original) {
      throw new Error('Form not found');
    }

    const duplicatedForm: Form = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      status: 'draft',
      shareId: generateShareId(),
      currentVersion: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Deep copy fields and rules
      fields: original.fields.map(field => ({
        ...field,
        id: generateId(), // Create new IDs for fields
      })),
      rules: original.rules.map(rule => ({
        ...rule,
        id: generateId(),
      })),
    };

    // Re-map targetFieldId in rules since field IDs changed
    const idMap: Record<string, string> = {};
    original.fields.forEach((field, index) => {
      idMap[field.id] = duplicatedForm.fields[index].id;
    });

    duplicatedForm.rules = duplicatedForm.rules.map(rule => ({
      ...rule,
      fieldId: idMap[rule.fieldId] || rule.fieldId,
      targetFieldId: idMap[rule.targetFieldId] || rule.targetFieldId,
    }));

    db.forms.push(duplicatedForm);
    writeDb(db);

    addLog(undefined, undefined, 'DUPLICATE_FORM', `Form "${original.title}" duplicated to "${duplicatedForm.title}"`);
    return duplicatedForm;
  },

  delete: (id: string) => {
    const db = readDb();
    const form = db.forms.find(f => f.id === id);
    if (!form) {
      throw new Error('Form not found');
    }

    db.forms = db.forms.filter(f => f.id !== id);
    // Keep submissions but delete associated versions if we want, or keep them for history. Let's keep versions and submissions.
    writeDb(db);

    addLog(undefined, undefined, 'DELETE_FORM', `Form "${form.title}" deleted`);
  },

  publish: (id: string): Form => {
    return dbForms.update(id, { status: 'published' });
  },

  archive: (id: string): Form => {
    return dbForms.update(id, { status: 'archived' });
  }
};

// Submission operations
export const dbSubmissions = {
  submit: (shareId: string, answers: Record<string, any>, completionTimeSeconds: number): Submission => {
    const db = readDb();
    const form = db.forms.find(f => f.shareId === shareId);
    if (!form) {
      throw new Error('Form not found');
    }
    if (form.status !== 'published') {
      throw new Error('Form is not accepting submissions');
    }

    const newSubmission: Submission = {
      id: generateId(),
      formId: form.id,
      formVersion: form.currentVersion,
      answers,
      submittedAt: new Date().toISOString(),
      completionTimeSeconds: completionTimeSeconds || 0,
    };

    db.submissions.push(newSubmission);
    writeDb(db);

    addLog(undefined, undefined, 'SUBMIT_RESPONSE', `Response submitted for Form "${form.title}" (Version ${form.currentVersion})`);
    return newSubmission;
  },

  listByFormId: (formId: string): Submission[] => {
    const db = readDb();
    return db.submissions.filter(s => s.formId === formId);
  },

  delete: (id: string) => {
    const db = readDb();
    db.submissions = db.submissions.filter(s => s.id !== id);
    writeDb(db);
    addLog(undefined, undefined, 'DELETE_SUBMISSION', `Submission ${id} deleted`);
  }
};

// Analytics helper
export const dbAnalytics = {
  getOverview: () => {
    const db = readDb();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalForms = db.forms.length;
    const publishedForms = db.forms.filter(f => f.status === 'published').length;
    const draftForms = db.forms.filter(f => f.status === 'draft').length;
    const totalResponses = db.submissions.length;
    const todayResponses = db.submissions.filter(s => s.submittedAt.startsWith(todayStr)).length;

    const completionTimes = db.submissions.map(s => s.completionTimeSeconds).filter(t => t > 0);
    const avgCompletionTime = completionTimes.length
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    // Submissions by date
    const submissionsByDate: Record<string, number> = {};
    db.submissions.forEach(s => {
      const date = s.submittedAt.split('T')[0];
      submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
    });

    // Submissions by form
    const submissionsByForm = db.forms.map(f => {
      const count = db.submissions.filter(s => s.formId === f.id).length;
      return {
        id: f.id,
        title: f.title,
        count,
      };
    }).sort((a, b) => b.count - a.count);

    return {
      totalForms,
      publishedForms,
      draftForms,
      totalResponses,
      todayResponses,
      avgCompletionTime,
      submissionsByDate,
      submissionsByForm,
    };
  },

  getFormAnalytics: (formId: string) => {
    const db = readDb();
    const form = db.forms.find(f => f.id === formId);
    if (!form) throw new Error('Form not found');

    const submissions = db.submissions.filter(s => s.formId === formId);

    // Dynamic field analytics based on field types
    const fieldAnalytics: Record<string, any> = {};

    form.fields.forEach(field => {
      const answers = submissions.map(s => s.answers[field.id]).filter(v => v !== undefined && v !== null && v !== '');

      if (field.type === 'rating') {
        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        answers.forEach(val => {
          const num = Number(val);
          if (ratingCounts[num] !== undefined) {
            ratingCounts[num]++;
            sum += num;
          }
        });
        fieldAnalytics[field.id] = {
          type: 'rating',
          avg: answers.length ? (sum / answers.length).toFixed(1) : 0,
          distribution: ratingCounts,
          total: answers.length,
        };
      } else if (field.type === 'yesno') {
        const counts = { Yes: 0, No: 0 };
        answers.forEach(val => {
          const str = String(val).toLowerCase();
          if (str === 'true' || str === 'yes' || val === true) {
            counts.Yes++;
          } else {
            counts.No++;
          }
        });
        fieldAnalytics[field.id] = {
          type: 'yesno',
          distribution: counts,
          total: answers.length,
        };
      } else if (field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox') {
        const counts: Record<string, number> = {};
        if (field.options) {
          field.options.forEach(opt => counts[opt] = 0);
        }

        answers.forEach(val => {
          if (Array.isArray(val)) {
            val.forEach(v => {
              counts[v] = (counts[v] || 0) + 1;
            });
          } else {
            counts[val] = (counts[val] || 0) + 1;
          }
        });

        fieldAnalytics[field.id] = {
          type: 'categorical',
          distribution: counts,
          total: answers.length,
        };
      } else if (field.type === 'number') {
        const nums = answers.map(Number).filter(n => !isNaN(n));
        const min = nums.length ? Math.min(...nums) : 0;
        const max = nums.length ? Math.max(...nums) : 0;
        const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0;
        fieldAnalytics[field.id] = {
          type: 'numerical',
          min,
          max,
          avg,
          total: answers.length,
        };
      } else {
        // Text/Email/Phone/Date/Time etc. -> simple list of responses or counts
        fieldAnalytics[field.id] = {
          type: 'textual',
          responses: answers.slice(-5), // Get last 5 responses
          total: answers.length,
        };
      }
    });

    return {
      form,
      totalResponses: submissions.length,
      fieldAnalytics,
    };
  }
};

// File operations
export const dbFiles = {
  saveFile: (file: Express.Multer.File): UploadedFile => {
    const db = readDb();
    const id = generateId();
    const ext = path.extname(file.originalname);
    const filename = `${id}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save actual file content
    fs.writeFileSync(filePath, file.buffer);

    const uploadedFile: UploadedFile = {
      id,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/api/files/${id}`,
    };

    db.files.push(uploadedFile);
    writeDb(db);

    return uploadedFile;
  },

  getFileById: (id: string): { file: UploadedFile; filePath: string } | undefined => {
    const db = readDb();
    const file = db.files.find(f => f.id === id);
    if (!file) return undefined;

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) return undefined;

    return { file, filePath };
  }
};
