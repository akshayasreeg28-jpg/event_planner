import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          compact
            ? 'p-2 text-[#4B2A7B] bg-[#F3EEF8] hover:bg-[#E9DFFA]'
            : 'px-3 py-1.5 text-white bg-[#4B2A7B] hover:bg-[#371C5D] shadow-sm'
        }`}
        title="Install Event AI app"
      >
        <Download className="w-3.5 h-3.5" />
        {!compact && <span>Install App</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl text-xs font-medium text-[#4B2A7B] bg-[#F3EEF8] hover:bg-[#E9DFFA] transition-colors cursor-pointer ${
            compact ? 'p-2' : 'px-3 py-1.5'
          }`}
          title="Install Event AI on iOS"
        >
          <Download className="w-3.5 h-3.5" />
          {!compact && <span>Install</span>}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#4B2A7B]/15">
              <h3 className="text-base font-semibold text-[#1E1B24] font-serif">Install on iPhone / iPad</h3>
              <p className="mt-2 text-xs text-[#5C5765] leading-relaxed">
                1. Tap the <strong>Share</strong> button in your Safari browser bar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-[#F3EEF8] py-2 text-xs font-semibold text-[#4B2A7B] hover:bg-[#E9DFFA]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
