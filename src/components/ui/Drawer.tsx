import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    right: 'inset-y-0 right-0 w-full sm:max-w-md border-l',
    left: 'inset-y-0 left-0 w-full sm:max-w-md border-r',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t rounded-t-2xl',
  }[position];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E1B24]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed bg-white shadow-2xl border-[#4B2A7B]/15 flex flex-col z-10 transition-transform ${positionClasses}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4B2A7B]/10">
          <h3 className="text-lg font-semibold text-[#1E1B24] font-serif">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C5765] hover:text-[#1E1B24] hover:bg-[#F3EEF8] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
