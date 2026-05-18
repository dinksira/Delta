/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Layout, Bold, Italic, List, ListOrdered, Link, Image, Underline, Quote, Code, Plus } from "lucide-react";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import { UserSelectionModal, type User } from "../components/qa/organisms/UserSelectionModal";
import { ConfigurePaymentModal, type PaymentConfig } from "../components/qa/organisms/ConfigurePaymentModal";
import { PaymentMethodModal, type PaymentMethod } from "../components/qa/organisms/PaymentMethodModal";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface AskQuestionViewProps {
  onBack: () => void;
  onNext: (data: any) => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * AskQuestionView
 * High-fidelity multi-step form for students to submit new questions.
 */
export const AskQuestionView: React.FC<AskQuestionViewProps> = ({ onBack, onNext }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [tags, setTags] = useState("");

  // Step 2 State
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [identityType, setIdentityType] = useState<"school" | "person">("school");
  const [priceType, setPriceType] = useState<"free" | "paid">("free");
  const [hasConfirmedNoDuplicate, setHasConfirmedNoDuplicate] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [questionType, setQuestionType] = useState("Selected Option");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const renderStep1 = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Field 1 - Title */}
      <div className="space-y-3">
        <div>
          <label className="text-[15px] font-bold text-text-primary block mb-1">Question title</label>
          <p className="text-[13px] text-text-tertiary">Be specific and imagine you're asking a question to another person.</p>
        </div>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="eg. What is Newton's 2nd Law"
          className="w-full h-[52px] px-4 rounded-xl border border-border-subtle bg-white text-[15px] focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900 transition-all outline-none placeholder:text-text-tertiary/40"
        />
      </div>

      {/* Field 2 - Details (Simulated Rich Text Editor) */}
      <div className="space-y-3">
        <div>
          <label className="text-[15px] font-bold text-text-primary block mb-1">What are the details of your problem?</label>
          <p className="text-[13px] text-text-tertiary">Introduce the problem and expand on what you put in the title. Minimum 20 characters.</p>
        </div>
        
        <div className="border border-border-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-900/10 focus-within:border-primary-900 transition-all">
          <div className="flex items-center gap-1 p-2 bg-surface-secondary border-b border-border-subtle overflow-x-auto">
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Bold size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Italic size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Underline size={16} /></button>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><List size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><ListOrdered size={16} /></button>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Quote size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Code size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Link size={16} /></button>
            <button className="p-1.5 hover:bg-white rounded transition-colors text-text-tertiary"><Image size={16} /></button>
          </div>
          <textarea 
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide context, what you've tried, and any relevant details..."
            className="w-full min-h-[240px] p-4 bg-white text-[15px] outline-none resize-none placeholder:text-text-tertiary/40"
          />
        </div>
      </div>

      {/* Field 3 - Tags */}
      <div className="space-y-3">
        <div>
          <label className="text-[15px] font-bold text-text-primary block mb-1">Tags</label>
          <p className="text-[13px] text-text-tertiary">Add up to 5 tags to describe what your question is about. Start typing to see suggestions.</p>
        </div>
        <input 
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tag"
          className="w-full h-[52px] px-4 rounded-xl border border-border-subtle bg-white text-[15px] focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900 transition-all outline-none placeholder:text-text-tertiary/40"
        />
      </div>

      <button className="flex items-center gap-4 group p-1 pr-6 hover:bg-primary-900/5 rounded-xl transition-all border border-transparent hover:border-primary-900/10">
        <div className="w-[52px] h-[52px] bg-primary-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-900/20 transition-transform group-hover:scale-105">
          <Layout size={24} />
        </div>
        <Typography className="text-xl font-bold text-primary-900">
          Select roadmap
        </Typography>
      </button>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => setStep(2)}
          className="flex items-center gap-3 py-4 px-8 rounded-xl transition-all hover:translate-x-1 active:scale-95 group"
        >
          <span className="text-[22px] font-bold text-primary-900">Next</span>
          <ChevronRight className="h-7 w-7 text-primary-900" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 1. Duplicate Check Section */}
      <div className="space-y-4">
        <Typography className="text-[14px] font-bold text-text-primary">
          Review questions already on Q & A to see if your question is a duplicate.
        </Typography>
        
        <div className="border border-border-subtle rounded-xl overflow-hidden">
          <div className="bg-surface-secondary/50 p-4 border-b border-border-subtle">
            <Typography className="text-[14px] text-text-secondary">
              Do any of these posts answer your question?
            </Typography>
          </div>
          <div className="p-8 bg-white text-center">
            <Typography className="text-[14px] font-medium text-primary-900/60 italic">
              No Duplicate questions found.
            </Typography>
          </div>
        </div>

        <div className="pt-2 space-y-4">
          <Typography className="text-[14px] font-bold text-text-primary">
            Confirm that none of these existing posts on Q&A answers your question.
          </Typography>
          
          <label className="flex items-center gap-4 cursor-pointer group">
            <div 
              onClick={() => setHasConfirmedNoDuplicate(!hasConfirmedNoDuplicate)}
              className={cx(
                "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                hasConfirmedNoDuplicate ? "bg-primary-900 border-primary-900" : "border-primary-900/20 bg-white group-hover:border-primary-900/40"
              )}
            >
              {hasConfirmedNoDuplicate && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <span className="text-[14px] text-primary-900/70 font-medium">
              I confirm that none of these posts answers my question.
            </span>
          </label>
        </div>
      </div>

      {/* 2. Configure Section */}
      <div className="space-y-8">
        <Typography className="text-[14px] font-bold text-text-primary uppercase tracking-wider">
          Configure your question
        </Typography>

        <div className="grid grid-cols-3 gap-12 items-center">
          {/* Post Anonymously */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <span className="text-[15px] font-bold text-primary-900/60">Post anonymously</span>
            <button 
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={cx(
                "w-12 h-6 rounded-full transition-all relative",
                isAnonymous ? "bg-primary-900" : "bg-primary-900/20"
              )}
            >
              <div className={cx(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                isAnonymous ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {/* Identity Selection */}
          <div className="flex items-center gap-8 col-span-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setIdentityType("school")}
                className={cx(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  identityType === "school" ? "border-primary-900" : "border-primary-900/20"
                )}
              >
                {identityType === "school" && <div className="w-3 h-3 bg-primary-900 rounded-full" />}
              </div>
              <span className={cx("text-[15px] font-bold transition-all", identityType === "school" ? "text-primary-900" : "text-primary-900/40")}>As a school</span>
              <div className="bg-primary-900/5 p-1.5 rounded-lg text-primary-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setIdentityType("person")}
                className={cx(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  identityType === "person" ? "border-primary-900" : "border-primary-900/20"
                )}
              >
                {identityType === "person" && <div className="w-3 h-3 bg-primary-900 rounded-full" />}
              </div>
              <span className={cx("text-[15px] font-bold transition-all", identityType === "person" ? "text-primary-900" : "text-primary-900/40")}>As a person</span>
              <div className="bg-primary-900 p-1.5 rounded-lg text-white shadow-lg shadow-primary-900/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5v3H5v2h2v1h10v-1h2v-2h-2V7a5 5 0 0 0-5-5z"/><path d="M17 14h-2a3 3 0 0 0-6 0H7a5 5 0 0 0 10 0z"/></svg>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-4">
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setPriceType("free")}
                className={cx(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  priceType === "free" ? "border-primary-900" : "border-primary-900/20"
                )}
              >
                {priceType === "free" && <div className="w-3 h-3 bg-primary-900 rounded-full" />}
              </div>
              <span className={cx("text-[15px] font-bold transition-all", priceType === "free" ? "text-primary-900" : "text-primary-900/40")}>Free question</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => {
                  setPriceType("paid");
                  setIsPaymentModalOpen(true);
                }}
                className={cx(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  priceType === "paid" ? "border-primary-900" : "border-primary-900/20"
                )}
              >
                {priceType === "paid" && <div className="w-3 h-3 bg-primary-900 rounded-full" />}
              </div>
              <span className={cx("text-[15px] font-bold transition-all", priceType === "paid" ? "text-primary-900" : "text-primary-900/40")}>
                Paid question {paymentConfig && `(${paymentConfig.amount})`}
              </span>
            </label>
          </div>

          <div className="space-y-2 relative">
            <label className="text-[14px] font-bold text-text-primary/60 block">Question Type</label>
            <div 
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className={cx(
                "w-full h-12 border rounded-xl px-4 flex items-center justify-between bg-white cursor-pointer transition-all",
                isTypeDropdownOpen ? "border-primary-900 ring-2 ring-primary-900/10" : "border-border-subtle hover:border-primary-900/30"
              )}
            >
              <span className={cx("text-[14px]", questionType === "Selected Option" ? "text-text-tertiary" : "text-primary-900 font-bold")}>
                {questionType}
              </span>
              <ChevronRight className={cx("h-4 w-4 text-text-tertiary transition-transform", isTypeDropdownOpen ? "-rotate-90" : "rotate-90")} />
            </div>

            {/* Dropdown Menu */}
            {isTypeDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div 
                  onClick={() => { setQuestionType("Open-Ended"); setIsTypeDropdownOpen(false); }}
                  className="px-4 py-3 text-[14px] text-text-tertiary hover:bg-surface-secondary hover:text-primary-900 cursor-pointer transition-colors"
                >
                  Open-Ended
                </div>
                <div 
                  onClick={() => { setQuestionType("Niche Questions"); setIsTypeDropdownOpen(false); }}
                  className="px-4 py-3 text-[14px] text-text-tertiary hover:bg-surface-secondary hover:text-primary-900 cursor-pointer transition-colors"
                >
                  Niche Questions
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Request Section */}
      <div className="space-y-6 pt-4">
        <Typography className="text-[13px] font-bold text-text-primary uppercase tracking-widest">
          Request
        </Typography>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 text-primary-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <Typography className="text-xl font-bold text-primary-900">
              {selectedUser ? `Requesting: ${selectedUser.name}` : "Request Individual"}
            </Typography>
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="w-8 h-8 rounded-full border-2 border-primary-900/60 flex items-center justify-center text-primary-900 hover:bg-primary-900 hover:text-white transition-all active:scale-90"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="w-fit">
          <button 
            onClick={() => setIsMethodModalOpen(true)}
            className="bg-primary-900 text-white px-6 py-3.5 rounded-lg font-bold text-[14px] shadow-lg shadow-primary-900/20 hover:scale-105 transition-all active:scale-95"
          >
            {selectedMethod ? `Method: ${selectedMethod.name}` : "Payment Requirements"}
          </button>
        </div>
      </div>

      {/* 4. Final Footer */}
      <div className="flex justify-end pt-8">
        <button 
          disabled={!hasConfirmedNoDuplicate}
          onClick={() => onNext({ title, details, tags, isAnonymous, identityType, priceType, selectedUser, paymentConfig, selectedMethod })}
          className={cx(
            "bg-primary-900 text-white px-12 py-3.5 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-primary-900/20",
            !hasConfirmedNoDuplicate && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 w-full max-w-[900px] mx-auto py-4">
      {/* 1. Header */}
      <div className="flex items-center gap-6">
        <button 
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="p-2 hover:bg-surface-secondary rounded-full transition-colors group"
        >
          <ArrowLeft className="h-6 w-6 text-primary-900 transition-transform group-hover:-translate-x-1" />
        </button>
        <Typography variant="h1" className="text-2xl !font-bold !text-primary-900">
          Ask a Question
        </Typography>
      </div>

      {/* 2. Step Rendering */}
      {step === 1 ? renderStep1() : renderStep2()}

      <UserSelectionModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSelect={setSelectedUser}
      />

      <ConfigurePaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={setPaymentConfig}
      />

      <PaymentMethodModal 
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        onSelect={setSelectedMethod}
      />
    </div>
  );
};

export default AskQuestionView;
/** ################################ /COMPONENT ############################# */
