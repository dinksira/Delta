import React, { useState } from 'react';
import { Search, Check, MessageSquare, Settings } from 'lucide-react';
import { Typography } from '@/components/theme';
import Modal from '@/components/atoms/Modal';
import Image from 'next/image';
import { cx } from '@/components/theme/utils';

export interface Tutor {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface TutorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTutorIds?: string[];
  onToggleTutor?: (tutor: Tutor) => void;
}

const DUMMY_TUTORS: Tutor[] = [
  { id: '1', name: 'Abebe Kebede', title: 'Professor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Lomi Kebede', title: 'Phd in physics', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Kid Alemu', title: 'Ms quantum', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Lomi Kebede', title: 'Phd in physics', avatar: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Kid Alemu', title: 'Ms quantum', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Abebe Kebede', title: 'Professor', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
  { id: '7', name: 'Kid Alemu', title: 'Ms quantum', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
  { id: '8', name: 'Abebe Kebede', title: 'Professor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
];

export const TutorSelectionModal: React.FC<TutorSelectionModalProps> = ({ 
  isOpen, 
  onClose,
  selectedTutorIds = [],
  onToggleTutor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoMatch, setAutoMatch] = useState(false);

  const filteredTutors = DUMMY_TUTORS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tutors" className="max-w-[1200px]">
      <div className="flex flex-col gap-6 p-4 pt-1 h-[480px]">
        
        {/* Search Header */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="relative w-full max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <input 
              type="text" 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-white border border-[#E2E8F0] rounded-lg text-[13px] outline-none shadow-sm focus:ring-2 focus:ring-[#174A5F]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 self-start pl-1">
            <button 
              onClick={() => setAutoMatch(!autoMatch)}
              className={cx(
                "w-10 h-5 rounded-full relative transition-all duration-300 flex items-center px-1 border",
                autoMatch ? "bg-[#174A5F] border-[#174A5F]" : "bg-[#F1F5F9] border-[#E2E8F0]"
              )}
            >
              <div className={cx(
                "w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center",
                autoMatch ? "translate-x-5" : "translate-x-0"
              )}>
                <Settings className={cx("h-2 w-2", autoMatch ? "text-[#174A5F]" : "text-[#64748B]")} />
              </div>
            </button>
            <span className="text-[12px] font-medium text-[#64748B]">Auto match</span>
          </div>
        </div>

        {/* Grid of Tutors */}
        <div className="grid grid-cols-7 gap-x-2 gap-y-5 overflow-y-auto max-h-[45vh] no-scrollbar py-1">
          {filteredTutors.map((tutor) => {
            const isSelected = selectedTutorIds.includes(tutor.id);
            return (
              <div 
                key={tutor.id}
                className="flex flex-col gap-1 group cursor-pointer"
                onClick={() => onToggleTutor?.(tutor)}
              >
                {/* Tutor Card Image - Ultra Compact */}
                <div className="relative aspect-[1/1] w-full rounded-md overflow-hidden bg-[#F1F5F9]">
                  <Image 
                    src={tutor.avatar} 
                    alt={tutor.name} 
                    fill 
                    sizes="70px"
                    className="object-cover"
                  />
                  {/* Micro Checkbox */}
                  <div className={cx(
                    "absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-[3px] border-2 flex items-center justify-center transition-all",
                    isSelected ? "bg-white border-white" : "border-white/50"
                  )}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-[#174A5F] stroke-[4]" />}
                  </div>
                </div>

                {/* Name & Title - Readable Typography */}
                <div className="flex flex-col items-center">
                  <Typography className="text-[12px] font-bold text-black uppercase tracking-tight text-center font-mono leading-tight truncate w-full">
                    {tutor.name}
                  </Typography>
                  <Typography className="text-[10px] font-medium text-[#64748B] text-center leading-tight truncate w-full">
                    {tutor.title}
                  </Typography>
                </div>

                {/* Message Action - Visible */}
                <div className="flex items-center justify-center gap-1.5 mt-1 text-[#174A5F] hover:opacity-70 transition-opacity">
                  <MessageSquare className="h-3.5 w-3.5 fill-current" />
                  <span className="text-[10px] font-bold">Message</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="mt-auto pt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="h-11 px-10 bg-[#174A5F] text-white text-[13px] font-bold rounded-lg shadow-lg shadow-[#174A5F]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Invite
          </button>
        </div>
      </div>
    </Modal>
  );
};
