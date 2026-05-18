import React from 'react';
import { X, FileText, Play, Headphones, Check } from 'lucide-react';
import { Typography } from '@/components/theme';
import Modal from '@/components/atoms/Modal';
import { cx } from '@/components/theme/utils';

export interface RoadmapSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSections?: string[];
  onToggleSection?: (sectionTitle: string) => void;
  selectedItems?: string[]; // New: for resource cards
  onToggleItem?: (itemId: string) => void;
}

export const RoadmapSelectionModal: React.FC<RoadmapSelectionModalProps> = ({ 
  isOpen, 
  onClose,
  selectedSections = [],
  onToggleSection,
  selectedItems = [],
  onToggleItem
}) => {
  const isSectionSelected = (title: string) => selectedSections.includes(title);
  const isItemSelected = (id: string) => selectedItems.includes(id);

  // Common selection style for cards
  const getSelectedCardStyles = (selected: boolean) => 
    selected 
      ? "bg-secondary-500 border-secondary-500 shadow-lg" 
      : "bg-white border-[#F1F5F9]";

  const getTextColor = (selected: boolean) => 
    selected ? "text-[#174A5F]" : "text-[#174A5F]"; // Based on secondary color being #C0CACC, dark teal text still works well

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding className="w-full max-w-[900px]">
      <div className="flex flex-col w-full h-[75vh] relative bg-white rounded-[32px] overflow-y-auto no-scrollbar">
        {/* 
          SCROLL CONTENT WRAPPER 
        */}
        <div className="relative w-full flex flex-col items-center py-6">
          
          {/* 
            BASE SPINE
          */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] bg-[#174A5F]/10 z-0" />
          
          {/* 
            ACTIVE SPINE (GREEN)
          */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[100px] bottom-[60px] w-[3px] bg-[#1C9E45] z-0" />

          <div className="relative w-full flex flex-col items-center z-10">
            {/* SECTION 1 - BIG CARD */}
            <div className="relative w-full flex justify-center pb-8">
              <div 
                onClick={() => onToggleSection?.("Section 1")}
                className={cx(
                  "w-[92%] max-w-[900px] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border transition-all cursor-pointer",
                  getSelectedCardStyles(isSectionSelected("Section 1"))
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <Typography className={cx("text-[22px] font-bold", getTextColor(isSectionSelected("Section 1")))}>
                    Section 1
                  </Typography>
                  {isSectionSelected("Section 1") && (
                    <div className="w-6 h-6 rounded-full bg-[#174A5F] flex items-center justify-center text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <Typography className={cx("text-[12px] leading-relaxed mb-5 max-w-[95%]", isSectionSelected("Section 1") ? "text-[#174A5F]/80" : "text-[#64748B]")}>
                  The technical task is attached as a file .doc Please read it carefully...
                </Typography>
                <div className="flex gap-2">
                  <span className={cx("px-2.5 py-1 rounded-md text-[10px] font-bold", isSectionSelected("Section 1") ? "bg-[#174A5F]/10 text-[#174A5F]" : "bg-[#F1F5F9] text-[#64748B]")}>
                    #biology
                  </span>
                  <span className={cx("px-2.5 py-1 rounded-md text-[10px] font-bold", isSectionSelected("Section 1") ? "bg-[#174A5F]/10 text-[#174A5F]" : "bg-[#F1F5F9] text-[#64748B]")}>
                    #biology
                  </span>
                </div>
              </div>
            </div>

            {/* CONNECTOR NODE (MINUS) */}
            <div className="relative flex justify-center z-20 -mt-6 mb-6">
              <div className="w-7 h-7 rounded-full bg-[#174A5F] border-[2px] border-white shadow-md flex items-center justify-center">
                <div className="w-2.5 h-[1.5px] bg-white rounded-full" />
              </div>
            </div>

            {/* SMALL CARDS GROUP 1 */}
            <div className="w-full space-y-8 pb-8">
              {/* Documents 1 (Left) */}
              <div className="relative flex items-center justify-center w-full min-h-[90px]">
                <div className="absolute left-1/2 -translate-x-full w-[60px] h-[2px] bg-[#1C9E45] top-1/2 -translate-y-1/2 z-0" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-full bg-[#1C9E45] border-[2px] border-white shadow-sm z-20" />
                <div className="w-full flex pr-[50%] mr-14 justify-end">
                  <div 
                    onClick={() => onToggleItem?.("doc1")}
                    className={cx(
                      "w-[260px] border rounded-lg p-3 relative shadow-sm cursor-pointer transition-all",
                      isItemSelected("doc1") ? "bg-secondary-500 border-secondary-500" : "bg-white border-[#1C9E45]"
                    )}
                  >
                    {!isItemSelected("doc1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-[#1C9E45] flex items-center justify-center text-[#1C9E45] shadow-xs">
                        <X className="h-2 w-2" />
                      </div>
                    )}
                    {isItemSelected("doc1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#174A5F] flex items-center justify-center text-white shadow-xs">
                        <Check className="h-2 w-2" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <FileText className={cx("h-3 w-3", isItemSelected("doc1") ? "text-[#174A5F]" : "text-[#174A5F]")} />
                      <Typography className={cx("text-[11px] font-bold", isItemSelected("doc1") ? "text-[#174A5F]" : "text-[#174A5F]")}>
                        Documents 1
                      </Typography>
                    </div>
                    <Typography className={cx("text-[8px] font-medium leading-tight mb-2", isItemSelected("doc1") ? "text-[#174A5F]/80" : "text-[#64748B]")}>
                      The task is attached... please read carefully.
                    </Typography>
                    <div className="flex gap-1.5 items-center">
                      <span className={cx("text-[6px] font-bold uppercase", isItemSelected("doc1") ? "text-[#174A5F]" : "text-[#64748B]")}>#Physics</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div className={cx("w-3.5 h-3.5 rounded-full flex items-center justify-center", isItemSelected("doc1") ? "bg-[#174A5F]/10" : "bg-[#174A5F]/5")}>
                          <svg className={cx("w-1.5 h-1.5", isItemSelected("doc1") ? "text-[#174A5F]" : "text-[#174A5F]")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <span className={cx("text-[6px] font-bold uppercase", isItemSelected("doc1") ? "text-[#174A5F]" : "text-[#174A5F]")}>Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video (Right) */}
              <div className="relative flex items-center justify-center w-full min-h-[90px]">
                <div className="absolute left-1/2 w-[60px] h-[2px] bg-[#1C9E45] top-1/2 -translate-y-1/2 z-0" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-full bg-[#1C9E45] border-[2px] border-white shadow-sm z-20" />
                <div className="w-full flex pl-[50%] ml-14 justify-start">
                  <div 
                    onClick={() => onToggleItem?.("video1")}
                    className={cx(
                      "w-[260px] border rounded-lg p-3 relative shadow-sm cursor-pointer transition-all",
                      isItemSelected("video1") ? "bg-secondary-500 border-secondary-500" : "bg-white border-[#1C9E45]"
                    )}
                  >
                    {!isItemSelected("video1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-[#1C9E45] flex items-center justify-center text-[#1C9E45] shadow-xs">
                        <X className="h-2 w-2" />
                      </div>
                    )}
                    {isItemSelected("video1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#174A5F] flex items-center justify-center text-white shadow-xs">
                        <Check className="h-2 w-2" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Play className={cx("h-3 w-3", isItemSelected("video1") ? "text-[#174A5F]" : "text-[#174A5F]")} />
                      <Typography className={cx("text-[11px] font-bold", isItemSelected("video1") ? "text-[#174A5F]" : "text-[#174A5F]")}>
                        Video
                      </Typography>
                    </div>
                    <Typography className={cx("text-[8px] font-medium leading-tight mb-2", isItemSelected("video1") ? "text-[#174A5F]/80" : "text-[#64748B]")}>
                      The task is attached... please read carefully.
                    </Typography>
                    <div className="flex gap-1.5 items-center">
                      <span className={cx("text-[6px] font-bold uppercase", isItemSelected("video1") ? "text-[#174A5F]" : "text-[#64748B]")}>#Physics</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div className={cx("w-3.5 h-3.5 rounded-full flex items-center justify-center", isItemSelected("video1") ? "bg-[#174A5F]/10" : "bg-[#174A5F]/5")}>
                          <svg className={cx("w-1.5 h-1.5", isItemSelected("video1") ? "text-[#174A5F]" : "text-[#174A5F]")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <span className={cx("text-[6px] font-bold uppercase", isItemSelected("video1") ? "text-[#174A5F]" : "text-[#174A5F]")}>Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio (Left) */}
              <div className="relative flex items-center justify-center w-full min-h-[90px]">
                <div className="absolute left-1/2 -translate-x-full w-[60px] h-[2px] bg-[#1C9E45] top-1/2 -translate-y-1/2 z-0" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-full bg-[#1C9E45] border-[2px] border-white shadow-sm z-20" />
                <div className="w-full flex pr-[50%] mr-14 justify-end">
                  <div 
                    onClick={() => onToggleItem?.("audio1")}
                    className={cx(
                      "w-[260px] border rounded-lg p-3 relative shadow-sm cursor-pointer transition-all",
                      isItemSelected("audio1") ? "bg-secondary-500 border-secondary-500" : "bg-white border-[#1C9E45]"
                    )}
                  >
                    {!isItemSelected("audio1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-[#1C9E45] flex items-center justify-center text-[#1C9E45] shadow-xs">
                        <X className="h-2 w-2" />
                      </div>
                    )}
                    {isItemSelected("audio1") && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#174A5F] flex items-center justify-center text-white shadow-xs">
                        <Check className="h-2 w-2" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Headphones className={cx("h-3 w-3", isItemSelected("audio1") ? "text-[#174A5F]" : "text-[#174A5F]")} />
                      <Typography className={cx("text-[11px] font-bold", isItemSelected("audio1") ? "text-[#174A5F]" : "text-[#174A5F]")}>
                        Audio
                      </Typography>
                    </div>
                    <Typography className={cx("text-[8px] font-medium leading-tight mb-2", isItemSelected("audio1") ? "text-[#174A5F]/80" : "text-[#64748B]")}>
                      The task is attached... please read carefully.
                    </Typography>
                    <div className="flex gap-1.5 items-center">
                      <span className={cx("text-[6px] font-bold uppercase", isItemSelected("audio1") ? "text-[#174A5F]" : "text-[#64748B]")}>#Physics</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div className={cx("w-3.5 h-3.5 rounded-full flex items-center justify-center", isItemSelected("audio1") ? "bg-[#174A5F]/10" : "bg-[#174A5F]/5")}>
                          <svg className={cx("w-1.5 h-1.5", isItemSelected("audio1") ? "text-[#174A5F]" : "text-[#174A5F]")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <span className={cx("text-[6px] font-bold uppercase", isItemSelected("audio1") ? "text-[#174A5F]" : "text-[#174A5F]")}>Review</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 - BIG CARD */}
            <div className="relative w-full flex justify-center pb-8">
              <div 
                onClick={() => onToggleSection?.("Section 2")}
                className={cx(
                  "w-[92%] max-w-[900px] rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border transition-all cursor-pointer",
                  getSelectedCardStyles(isSectionSelected("Section 2"))
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <Typography className={cx("text-[22px] font-bold", getTextColor(isSectionSelected("Section 2")))}>
                    Section 2
                  </Typography>
                  {isSectionSelected("Section 2") && (
                    <div className="w-6 h-6 rounded-full bg-[#174A5F] flex items-center justify-center text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                <Typography className={cx("text-[12px] leading-relaxed mb-5 max-w-[95%]", isSectionSelected("Section 2") ? "text-[#174A5F]/80" : "text-[#64748B]")}>
                  The technical task is attached...
                </Typography>
                <div className="flex gap-2">
                  <span className={cx("px-2.5 py-1 rounded-md text-[10px] font-bold", isSectionSelected("Section 2") ? "bg-[#174A5F]/10 text-[#174A5F]" : "bg-[#F1F5F9] text-[#64748B]")}>
                    #biology
                  </span>
                  <span className={cx("px-2.5 py-1 rounded-md text-[10px] font-bold", isSectionSelected("Section 2") ? "bg-[#174A5F]/10 text-[#174A5F]" : "bg-[#F1F5F9] text-[#64748B]")}>
                    #biology
                  </span>
                </div>
              </div>
            </div>

            {/* CONNECTOR NODE (MINUS) */}
            <div className="relative flex justify-center z-20 -mt-6">
              <div className="w-7 h-7 rounded-full bg-[#174A5F] border-[2px] border-white shadow-md flex items-center justify-center">
                <div className="w-2.5 h-[1.5px] bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Done Button */}
        <div className="sticky bottom-0 right-0 w-full flex justify-end p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-50">
          <button 
            onClick={onClose}
            className="pointer-events-auto h-10 px-8 bg-[#174A5F] text-white text-[12px] font-bold rounded-lg shadow-lg shadow-[#174A5F]/20 hover:scale-105 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoadmapSelectionModal;
