import React, { useState } from 'react';
import { MessageSquare, Lock, ChevronDown, UserPlus, Hash } from 'lucide-react';
import { Typography } from '@/components/theme';
import Modal from '@/components/atoms/Modal';
import Switch from '@/components/atoms/Switch';
import FileUploader from '@/components/molecules/FileUploader';

export interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Uploader */}
        <div className="h-[280px]">
          <FileUploader />
        </div>

        {/* Right: Form */}
        <div className="flex flex-col h-full space-y-4">
          {/* Description Textarea */}
          <div className="relative group">
            <div className="border border-[#174A5F]/10 rounded-xl overflow-hidden focus-within:border-[#174A5F]/30 transition-all bg-white">
              <textarea 
                placeholder="Describe your post, add hashtags"
                className="w-full h-24 p-4 text-[14px] text-[#174A5F] placeholder:text-[#174A5F]/30 outline-none resize-none bg-transparent"
              />
              <div className="flex items-center gap-2 p-3 pt-0">
                <button className="h-9 px-4 border border-[#174A5F]/10 rounded-lg flex items-center gap-2 text-[#174A5F]/60 hover:bg-[#174A5F]/5 transition-all">
                  <Hash className="h-4 w-4" />
                  <Typography className="text-[13px] font-bold text-[#174A5F]">Hashtags</Typography>
                </button>
                <button className="h-9 px-4 border border-[#174A5F]/10 rounded-lg flex items-center gap-2 text-[#174A5F]/60 hover:bg-[#174A5F]/5 transition-all">
                  <UserPlus className="h-4 w-4" />
                  <Typography className="text-[13px] font-bold text-[#174A5F]">Mention</Typography>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Dropdown */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#174A5F]/40">
              <Lock className="h-5 w-5" />
              <Typography className="text-[15px] font-medium text-[#174A5F]/60">
                Who can watch this video
              </Typography>
            </div>
            <button className="flex items-center gap-2 hover:bg-[#174A5F]/5 px-3 py-1.5 rounded-lg transition-all">
              <Typography className="text-[14px] font-medium text-[#174A5F]/60">
                Selected Option
              </Typography>
              <ChevronDown className="h-4 w-4 text-[#174A5F]/40" />
            </button>
          </div>

          {/* Settings Switches */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#174A5F]/40">
                <MessageSquare className="h-4 w-4" />
                <Typography className="text-[14px] font-medium text-[#174A5F]/60">
                  Allow Comments
                </Typography>
              </div>
              <Switch checked={allowComments} onChange={setAllowComments} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#174A5F]/40">
                <div className="w-4 h-4 border-2 border-current rounded-[3px] flex items-center justify-center text-[9px] font-bold">D</div>
                <Typography className="text-[14px] font-medium text-[#174A5F]/60">
                  Allow Duet
                </Typography>
              </div>
              <Switch checked={allowDuet} onChange={setAllowDuet} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 mt-auto">
            <button className="flex-1 h-[48px] border border-[#174A5F]/30 rounded-lg text-[#174A5F] font-bold text-[14px] hover:bg-[#174A5F]/5 transition-all">
              Drafts
            </button>
            <button className="flex-1 h-[48px] bg-[#174A5F] rounded-lg text-white font-bold text-[14px] hover:bg-[#133e50] transition-all shadow-lg shadow-[#174A5F]/20">
              Post
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PostModal;
