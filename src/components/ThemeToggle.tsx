/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 text-gray-700 dark:text-zinc-300 flex items-center justify-center border border-gray-200 dark:border-zinc-700 cursor-pointer"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400 animate-pulse" /> : <Moon className="w-5 h-5 text-indigo-600" />}
    </button>
  );
}
