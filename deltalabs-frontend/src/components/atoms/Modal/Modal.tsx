import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cx } from '@/components/theme/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  noPadding?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHeader = true,
  noPadding = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#174A5F]/25 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cx(
        "relative bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
        !className?.includes('rounded') && "rounded-[32px]",
        !className?.includes('max-w') && "w-full max-w-[960px]",
        className
      )}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-12 py-6">
            <div className="flex-1 text-center">
              {title && (
                <h2 className="text-[24px] font-bold text-[#174A5F]">
                  {title}
                </h2>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-[#174A5F]/40 hover:text-[#174A5F] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cx(
          !noPadding && "px-12 pb-8",
          noPadding && "p-0"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
