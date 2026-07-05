/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  LogOut,
  ShieldAlert,
  User,
  Activity,
  Menu,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import MyForms from './components/MyForms';
import FormBuilder from './components/FormBuilder';
import PublicForm from './components/PublicForm';
import AuditLogs from './components/AuditLogs';
import Responses from './components/Responses';
import { Form } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('formflow_token'));
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(
    localStorage.getItem('formflow_user') ? JSON.parse(localStorage.getItem('formflow_user')!) : null
  );
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Navigation menu state for mobile responsive layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Theme state: dark/light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('formflow_theme') === 'dark';
  });

  // Public Respondent form state
  const [publicFormId, setPublicFormId] = useState<string | null>(null);
  const [publicForm, setPublicForm] = useState<Form | null>(null);
  const [publicFormLoading, setPublicFormLoading] = useState(false);
  const [publicFormError, setPublicFormError] = useState('');

  // 1. Check URL parameters for Respondent Shared Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formId = params.get('formId');
    if (formId) {
      setPublicFormId(formId);
      fetchPublicForm(formId);
    }
  }, []);

  // Apply dark mode styling class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('formflow_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('formflow_theme', 'light');
    }
  }, [isDarkMode]);

  const fetchPublicForm = async (shareId: string) => {
    setPublicFormLoading(true);
    setPublicFormError('');
    try {
      const res = await fetch(`/api/public/forms/${shareId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'This form is not accepting responses or does not exist');
      }
      setPublicForm(data.form);
    } catch (err: any) {
      setPublicFormError(err.message);
    } finally {
      setPublicFormLoading(false);
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: { id: string; name: string; email: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('formflow_token', newToken);
    localStorage.setItem('formflow_user', JSON.stringify(newUser));
    showNotification(`Welcome back, ${newUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('formflow_token');
    localStorage.removeItem('formflow_user');
    showNotification('Logged out successfully', 'success');
    setCurrentView('dashboard');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const navigateTo = (view: string, formId?: string) => {
    setCurrentView(view);
    if (formId) {
      setSelectedFormId(formId);
    } else {
      setSelectedFormId(null);
    }
    setIsSidebarOpen(false); // Close mobile menu upon navigation
  };

  // Render correct content depending on current admin navigation view
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard token={token!} onNavigate={navigateTo} />;
      case 'my-forms':
        return (
          <MyForms
            token={token!}
            onNavigate={navigateTo}
            onShowNotification={showNotification}
          />
        );
      case 'builder':
        return (
          <FormBuilder
            token={token!}
            formId={selectedFormId!}
            onBack={() => navigateTo('my-forms')}
            onShowNotification={showNotification}
          />
        );
      case 'responses':
        return (
          <Responses
            token={token!}
            formId={selectedFormId!}
            onBack={() => navigateTo('my-forms')}
            onShowNotification={showNotification}
          />
        );
      case 'audit-logs':
        return <AuditLogs token={token!} />;
      default:
        return <Dashboard token={token!} onNavigate={navigateTo} />;
    }
  };

  // --- RENDER 1: Public Respondent View ---
  if (publicFormId) {
    return (
      <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        {/* Respondent Header */}
        <header className="h-14 px-6 border-b border-gray-150 dark:border-zinc-850 flex justify-between items-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-200 rounded-lg text-sm font-bold flex items-center justify-center">
              FF
            </span>
            <span className="font-bold font-display text-base tracking-tight">FormFlow</span>
          </div>
          <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        </header>

        {/* Content canvas */}
        <main className="flex-grow flex items-center justify-center px-4 py-8 z-10">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-2xl shadow-xl p-8 relative">
            {publicFormLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-10 h-10 animate-spin" />
                <span className="text-2xs font-semibold text-gray-500">Loading dynamic form details...</span>
              </div>
            ) : publicFormError ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 rounded-full text-red-600">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="font-bold font-display text-gray-900 dark:text-white text-lg">
                  Form Link Error
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
                  {publicFormError}
                </p>
                <div className="pt-2">
                  <a
                    href="/"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Go back to platform home
                  </a>
                </div>
              </div>
            ) : publicForm ? (
              <PublicForm
                form={publicForm}
                onShowNotification={showNotification}
              />
            ) : null}
          </div>
        </main>

        <footer className="py-4 border-t border-gray-150 dark:border-zinc-850 text-center text-3xs text-gray-400 dark:text-zinc-500">
          <span>Powered by FormFlow Low-Code Platform • {new Date().getFullYear()}</span>
        </footer>

        {/* Toast Toast Notifications rendering */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 z-50 text-xs font-medium ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400'
              }`}
            >
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- RENDER 2: Unauthorized Admin View ---
  if (!token) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
          <div className="absolute top-5 right-5 z-20">
            <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
          </div>
          <LoginRegister onAuthSuccess={handleAuthSuccess} />

          {/* Toast notifications rendering */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 z-50 text-xs font-medium ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400'
                }`}
              >
                <span>{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- RENDER 3: Authorized Administrator Dashboard ---
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-forms', label: 'My Forms', icon: FileSpreadsheet },
    { id: 'audit-logs', label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white dark:bg-zinc-900 border-r border-gray-150 dark:border-zinc-850 w-64 z-40 transform lg:translate-x-0 lg:static transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-6 border-b border-gray-150 dark:border-zinc-850 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl text-xs font-bold font-display">FF</span>
            <span className="font-bold font-display text-base tracking-tight">FormFlow</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded lg:hidden hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 flex-grow">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'my-forms' && ['builder', 'responses'].includes(currentView));
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-200 border border-indigo-100/50 dark:border-zinc-750'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-850/50'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar user context panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-150 dark:border-zinc-850 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-zinc-850/50 rounded-xl border border-gray-150/40 dark:border-zinc-850 mb-3 text-xs">
            <div className="p-2 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-400 rounded-full">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-gray-800 dark:text-zinc-200 block truncate">
                {user?.name}
              </span>
              <span className="text-3xs text-gray-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all border border-red-200/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main body content canvas */}
      <div className="flex-1 flex flex-col min-h-screen lg:max-w-[calc(100vw-256px)]">
        {/* Top administration bar */}
        <header className="h-14 px-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-b border-gray-150 dark:border-zinc-850 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-400 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              FormFlow <span className="text-gray-400 font-normal">/</span> <span className="text-xs font-semibold text-gray-400">Administration workspace</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-grow p-6 lg:p-8 z-10 overflow-y-auto">
          {renderViewContent()}
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-6 bg-blue-600 text-white flex items-center justify-between px-4 text-[10px] flex-shrink-0 z-20">
          <div className="flex gap-4">
            <span>Version: 2.1.0-alpha</span>
            <span className="opacity-80">•</span>
            <span>Mode: High Density Workspace</span>
            <span className="opacity-80">•</span>
            <span>Rules: Active</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Connected to local JSON DB
            </span>
          </div>
        </footer>
      </div>

      {/* Toast notifications rendering */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 z-50 text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400'
            }`}
          >
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
