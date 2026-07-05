/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, ExternalLink, QrCode, X, Check } from 'lucide-react';

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  shareId: string;
  formId: string;
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function ShareFormModal({
  isOpen,
  onClose,
  formTitle,
  shareId,
  formId,
  onShowNotification,
}: ShareFormModalProps) {
  const [useShortLink, setUseShortLink] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sharePath = useShortLink ? `/f/${shareId}` : `/forms/${formId}`;
  const fullUrl = `${window.location.origin}${sharePath}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      onShowNotification('Copied share link to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowNotification('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 max-w-md w-full rounded-2xl shadow-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-3xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
              Form Published Successfully
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate max-w-[320px] mt-0.5">
              Share "{formTitle}"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-850 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Path Selection */}
        <div className="space-y-3 text-xs">
          <label className="block text-3xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Link Style
          </label>
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setUseShortLink(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                useShortLink
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Short Link (/f/{shareId})
            </button>
            <button
              onClick={() => setUseShortLink(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !useShortLink
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Secure UUID (/forms/{formId.substring(0, 8)}...)
            </button>
          </div>
        </div>

        {/* Copy Box */}
        <div className="space-y-2">
          <label className="block text-3xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Public Access Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-gray-600 dark:text-zinc-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-850/50 p-4 rounded-xl border border-gray-150/50 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-400">
            <QrCode className="w-4 h-4 text-indigo-500" />
            <span>Scan QR Code to submit responses</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-gray-250/20 shadow-xs">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-40 h-40 select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Perfect for printing, physical flyers, and tablet setups.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-250 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Done
          </button>
          <a
            href={sharePath}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100/70 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Form
          </a>
        </div>
      </div>
    </div>
  );
}
