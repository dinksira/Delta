import React from 'react';
import { X, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Typography } from '@/components/theme';
import Modal from '@/components/atoms/Modal';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose,
  message = "Your invite is sent."
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding className="max-w-[420px] rounded-2xl">
      <div className="p-8 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#174A5F]/40 hover:text-[#174A5F] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-6">
          {/* Header row with back arrow and title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="text-[#174A5F] hover:opacity-70 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <Typography className="text-[18px] font-bold text-black">
              Success
            </Typography>
          </div>

          {/* Content row with checkmark and message */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-[#1C9E45] stroke-[1.5]" />
            </div>
            <Typography className="text-[16px] font-medium text-black">
              {message}
            </Typography>
          </div>
        </div>
      </div>
    </Modal>
  );
};
