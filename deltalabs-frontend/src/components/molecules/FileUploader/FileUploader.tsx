import React from 'react';
import { FileUp } from 'lucide-react';
import { Typography } from '@/components/theme';
import { cx } from '@/components/theme/utils';

export interface FileUploaderProps {
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ className }) => {
  return (
    <div className={cx(
      "w-full h-full border-2 border-dashed border-[#174A5F]/10 rounded-[12px] flex flex-col items-center justify-center p-8 bg-white hover:bg-[#174A5F]/5 transition-all cursor-pointer",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-6">
        <FileUp className="h-6 w-6 text-[#174A5F]" />
      </div>
      <div className="text-center space-y-1">
        <Typography className="text-sm font-medium text-[#174A5F]">
          <span className="font-bold underline">Click to Upload</span> or drag and drop
        </Typography>
        <Typography className="text-[11px] font-medium text-[#64748B]">
          (Max. File size: 25 MB)
        </Typography>
      </div>
    </div>
  );
};

export default FileUploader;
