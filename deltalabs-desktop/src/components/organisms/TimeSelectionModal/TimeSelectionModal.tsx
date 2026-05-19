import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';
import { Typography, Button } from '@/components/theme';
import { cx } from '@/components/theme/utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TimeSelectionModalProps {
  isOpen: boolean;
  onClose: (date?: string) => void;
}

// ============================================================================
// COMPONENT: TimeSelectionModal
// ============================================================================

/**
 * TimeSelectionModal - Organism
 * 
 * An advanced Date & Time picker that follows the Delta Labs design language.
 * Features a calendar view and a time slot selector in a premium popover.
 */
export const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTime) {
      onClose(`March ${selectedDay}, 2024 at ${selectedTime}`);
    } else {
      onClose(`March ${selectedDay}, 2024`);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM"
  ];

  return (
    <div 
      className="absolute top-[calc(100%+12px)] right-0 z-[100] w-[580px] bg-white rounded-[32px] shadow-[0_25px_70px_rgba(23,74,95,0.18)] border border-slate-100 animate-in fade-in zoom-in-95 duration-300 origin-top overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-[420px]">
        {/* LEFT: CALENDAR PANE */}
        <div className="flex-[1.2] p-8 border-r border-slate-50 space-y-6">
          <div className="flex items-center justify-between px-1">
            <Typography className="text-[18px] font-bold text-[#1D4A44]">March 2024</Typography>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#1D4A44] hover:bg-[#1D4A44]/5 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#1D4A44] hover:bg-[#1D4A44]/5 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="text-center">
                  <Typography className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{day}</Typography>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {days.map(day => (
                <div 
                  key={day} 
                  onClick={() => setSelectedDay(day)}
                  className={cx(
                    "aspect-square flex items-center justify-center cursor-pointer rounded-xl transition-all text-[13px] font-bold",
                    day === selectedDay 
                      ? "bg-[#1D4A44] text-white shadow-lg shadow-[#1D4A44]/20" 
                      : "text-[#1D4A44] hover:bg-[#1D4A44]/5"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: TIME SLOTS PANE */}
        <div className="flex-1 bg-slate-50/50 p-8 flex flex-col space-y-6">
          <div className="flex items-center gap-2 text-[#1D4A44]">
            <Clock className="h-4 w-4" />
            <Typography className="text-[14px] font-bold uppercase tracking-widest">Available Slots</Typography>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {timeSlots.map(slot => (
              <div 
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={cx(
                  "w-full py-3 px-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group",
                  selectedTime === slot 
                    ? "bg-white border-[#1D4A44] shadow-md" 
                    : "bg-white/50 border-transparent hover:border-[#1D4A44]/30"
                )}
              >
                <Typography className={cx(
                  "text-[13px] font-bold transition-colors",
                  selectedTime === slot ? "text-[#1D4A44]" : "text-slate-500 group-hover:text-[#1D4A44]"
                )}>
                  {slot}
                </Typography>
                {selectedTime === slot && <Check className="h-3.5 w-3.5 text-[#1D4A44]" />}
              </div>
            ))}
          </div>

          <Button 
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl !bg-[#1D4A44] !text-white font-bold text-[14px] gap-2 shadow-lg shadow-[#1D4A44]/20"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionModal;

