/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Activity,
  Database,
  CheckCircle,
  ArrowRightLeft,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';

interface LoginRegisterProps {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

export default function LoginRegister({ onAuthSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Decorative Logic Rule simulator states for premium feel
  const [logicTrigger, setLogicTrigger] = useState('Engineering');
  const [simulatedTime, setSimulatedTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="premium-auth-layout" className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden relative">
      {/* Background Subtle Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0" />

      {/* LEFT COLUMN: Premium High-Density Product Showcase (60% width on Desktop) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-8 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-indigo-50/10 dark:from-indigo-950/5 dark:to-transparent pointer-events-none" />
        
        {/* Header Branding */}
        <div className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md">
            <div className="w-4 h-4 border-2 border-white"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-display text-base tracking-tight text-slate-900 dark:text-white">FormFlow</span>
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase rounded">Enterprise v2</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Low-Code Workspace & Dynamic Forms Builder</span>
          </div>
        </div>

        {/* Dynamic Low-Code Mockup / Interactive Presentation */}
        <div className="my-auto max-w-2xl space-y-6 relative">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Low-Code & Analytics Suite</span>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white leading-tight">
              Compile complex data logic in a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">High-Density</span> canvas.
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
              Design enterprise-grade forms, evaluate complex branch scenarios in real-time, collect binary files, and monitor user audit footprints with persistent local integrity.
            </p>
          </div>

          {/* Interactive Canvas Presentation Mockup */}
          <div className="border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 rounded-xl p-4 shadow-sm space-y-4 text-[11px]">
            {/* Simulation Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-bold text-slate-700 dark:text-zinc-300 font-mono">FLOW_BUILDER_CANVAS // Live Preview</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{simulatedTime}</span>
            </div>

            {/* Simulated Logic Rule */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  Conditional logic controller
                </span>
                <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500">Rule #04</span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-zinc-950 p-2 rounded border border-slate-200/50 dark:border-zinc-800/40">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">IF TARGET</span>
                  <select 
                    value={logicTrigger}
                    onChange={(e) => setLogicTrigger(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Engineering">Department == "Engineering"</option>
                    <option value="Product">Department == "Product"</option>
                    <option value="Sales">Department == "Sales"</option>
                  </select>
                </div>
                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">THEN ACTION</span>
                  <span className="block font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 px-1.5 py-0.5 rounded text-[10px] text-center">
                    {logicTrigger === 'Engineering' ? 'Show "GitHub Handle"' : logicTrigger === 'Product' ? 'Show "Portfolio Link"' : 'Show "Quota Goal"'}
                  </span>
                </div>
              </div>
            </div>

            {/* High Density Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Database Schema</span>
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-zinc-200">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>JSON Persistent</span>
                </div>
              </div>
              <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Audit Trail Logs</span>
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-zinc-200">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Track Active</span>
                </div>
              </div>
              <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-0.5">
                <span className="text-[10px] text-slate-400 font-medium block">Execution Speed</span>
                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-zinc-200">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  <span>&lt; 0.1s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer System Parameters */}
        <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex justify-between items-center relative pt-4 border-t border-slate-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>All microservices operational</span>
          </div>
          <span className="font-mono">BUILD // PRODUCTION_RELEASE</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Minimalist Premium Authorization Form Area (40% width on Desktop) */}
      <div className="flex-1 lg:col-span-5 flex flex-col justify-center p-6 sm:p-12 md:p-16 relative z-10 bg-slate-50 dark:bg-zinc-950">
        <div className="w-full max-w-sm mx-auto space-y-6">
          
          {/* Logo element for mobile viewport, hidden on desktop */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white"></div>
            </div>
            <span className="font-bold font-display text-sm tracking-tight text-slate-900 dark:text-white">FormFlow</span>
          </div>

          <div className="space-y-1.5 text-left">
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {isLogin ? 'Sign in to platform' : 'Create administrator'}
              <Sparkles className="w-4 h-4 text-blue-500" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isLogin ? 'Welcome back! Fill credentials to launch your administrator dashboard.' : 'Sign up as a system operator to compile and manage workflows.'}
            </p>
          </div>

          {/* Error Prompt Line */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field (Register view only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Email Address field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="operator@formflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-xs"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Secret Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-xs"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In Operator Session' : 'Provision Admin Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Registration Mode */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-850 text-center space-y-3.5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
            >
              {isLogin ? "No admin login? Build a new administrator account" : 'Already have active credentials? Sign in here'}
            </button>

            {/* Sandbox notification / dynamic tip */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-150/40 dark:border-blue-900/10 rounded-xl text-center text-[11px] text-blue-800 dark:text-blue-400/80 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Sandbox registration is active. Simply complete the form to log in.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
