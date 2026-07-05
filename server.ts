/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import {
  dbAuth,
  dbForms,
  dbSubmissions,
  dbAnalytics,
  dbFiles,
  addLog,
  readDb
} from './server/db';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'formflow-super-secret-key-2026';

// Support body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Extend Request interface to include user info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// --- Auth APIs ---
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    const user = dbAuth.register(name, email, password);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = dbAuth.login(email, password);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// --- Admin Form APIs ---
app.get('/api/forms', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const forms = dbForms.list();
    res.json({ forms });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forms', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const form = dbForms.create(title, description);
    addLog(req.user?.id, req.user?.email, 'CREATE_FORM', `Created form "${form.title}"`);
    res.status(201).json({ form });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/forms/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const form = dbForms.getById(req.params.id);
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }
    res.json({ form });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/forms/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const form = dbForms.update(req.params.id, req.body);
    addLog(req.user?.id, req.user?.email, 'UPDATE_FORM', `Updated form "${form.title}" layout`);
    res.json({ form });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/forms/:id/duplicate', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const form = dbForms.duplicate(req.params.id);
    addLog(req.user?.id, req.user?.email, 'DUPLICATE_FORM', `Duplicated form layout to "${form.title}"`);
    res.json({ form });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/forms/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    dbForms.delete(req.params.id);
    addLog(req.user?.id, req.user?.email, 'DELETE_FORM', `Deleted form ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/forms/:id/publish', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const form = dbForms.publish(req.params.id);
    addLog(req.user?.id, req.user?.email, 'PUBLISH_FORM', `Published form "${form.title}"`);
    res.json({ form });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/forms/:id/archive', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const form = dbForms.archive(req.params.id);
    addLog(req.user?.id, req.user?.email, 'ARCHIVE_FORM', `Archived form "${form.title}"`);
    res.json({ form });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Submission Management for Admin ---
app.get('/api/forms/:id/responses', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = dbSubmissions.listByFormId(req.params.id);
    res.json({ submissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/responses/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    dbSubmissions.delete(req.params.id);
    addLog(req.user?.id, req.user?.email, 'DELETE_SUBMISSION', `Deleted response submission ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Analytics APIs ---
app.get('/api/analytics', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = dbAnalytics.getOverview();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forms/:id/analytics', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const formStats = dbAnalytics.getFormAnalytics(req.params.id);
    res.json(formStats);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Export API ---
app.get('/api/forms/:id/export/:format', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const formId = req.params.id;
    const format = req.params.format; // 'csv' or 'json'
    const form = dbForms.getById(formId);
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    const submissions = dbSubmissions.listByFormId(formId);

    if (format === 'csv') {
      // Build CSV
      const fields = form.fields.sort((a, b) => a.displayOrder - b.displayOrder);
      const headers = ['Submission ID', 'Submitted At', 'Completion Time (s)', ...fields.map(f => `"${f.label.replace(/"/g, '""')}"`)];

      const rows = submissions.map(sub => {
        const answersRow = fields.map(field => {
          const val = sub.answers[field.id];
          if (val === undefined || val === null) return '""';
          if (Array.isArray(val)) {
            return `"${val.join('; ').replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        return [sub.id, sub.submittedAt, sub.completionTimeSeconds, ...answersRow].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="form_${form.shareId}_responses.csv"`);
      res.send(csvContent);
      addLog(req.user?.id, req.user?.email, 'EXPORT_DATA', `Exported form "${form.title}" responses as CSV`);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="form_${form.shareId}_responses.json"`);
      res.json(submissions);
      addLog(req.user?.id, req.user?.email, 'EXPORT_DATA', `Exported form "${form.title}" responses as JSON`);
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Audit Log API ---
app.get('/api/logs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    res.json({ logs: db.logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public Respondent APIs (No Auth Required) ---
app.get('/api/public/forms/:shareId', (req: Request, res: Response) => {
  try {
    const form = dbForms.getByShareId(req.params.shareId);
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }
    if (form.status !== 'published') {
      res.status(403).json({ error: 'Form is not currently accepting responses' });
      return;
    }
    res.json({ form });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/public/forms/:shareId/submit', (req: Request, res: Response) => {
  try {
    const { answers, completionTimeSeconds } = req.body;
    const submission = dbSubmissions.submit(req.params.shareId, answers, completionTimeSeconds);
    res.status(201).json({ success: true, submissionId: submission.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// File upload for respondent
app.post('/api/public/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const savedFile = dbFiles.saveFile(req.file);
    res.status(201).json({ file: savedFile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Download secure file
app.get('/api/files/:id', (req: Request, res: Response) => {
  try {
    const fileData = dbFiles.getFileById(req.params.id);
    if (!fileData) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.setHeader('Content-Type', fileData.file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileData.file.originalName}"`);
    res.sendFile(fileData.filePath);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Full-Stack Dev & Production Assets integration ---
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build files from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start full-stack server:', err);
});
