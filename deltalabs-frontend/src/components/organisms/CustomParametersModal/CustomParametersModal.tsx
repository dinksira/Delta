"use client";

import React, { useState } from "react";
import { MinusCircle, PlusCircle } from "lucide-react";
import { Typography, Button } from "@/components/theme";
import { Modal } from "@/components/atoms/Modal/Modal";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CustomParameter {
  id: string;
  name: string;
  value: string;
}

export interface CustomParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (parameters: CustomParameter[]) => void;
}

// ============================================================================
// COMPONENT: CustomParametersModal
// ============================================================================

/**
 * CustomParametersModal - Organism
 * 
 * A high-fidelity modal for adding custom parameters to a tutor request.
 * Features dynamic row addition and precise design alignment.
 */
export const CustomParametersModal: React.FC<CustomParametersModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [parameters, setParameters] = useState<CustomParameter[]>([
    { id: "1", name: "", value: "" },
    { id: "2", name: "", value: "" },
  ]);

  const handleAddRow = () => {
    const newId = (parameters.length + 1).toString();
    setParameters([...parameters, { id: newId, name: "", value: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (parameters.length > 1) {
      setParameters(parameters.filter((p) => p.id !== id));
    }
  };

  const handleInputChange = (id: string, field: "name" | "value", newValue: string) => {
    setParameters(
      parameters.map((p) => (p.id === id ? { ...p, [field]: newValue } : p))
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      showHeader={false}
      className="max-w-[850px] w-full"
    >
      <div className="bg-white rounded-none p-8 space-y-8">
        {/* HEADER SECTION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Typography className="text-[14px] font-bold text-[#1D4A44] uppercase tracking-wider">
                Custom Parameters
              </Typography>
              <Typography className="text-[12px] text-slate-400 font-medium ml-4">
                Select
              </Typography>
            </div>
            
            <div className="flex items-center gap-3 text-[#1D4A44]/60">
              <PlusCircle 
                onClick={handleAddRow}
                className="h-5 w-5 cursor-pointer hover:text-[#1D4A44] transition-colors" 
              />
              <div className="w-px h-4 bg-slate-200" />
              <MinusCircle 
                onClick={() => {
                  if (parameters.length > 0) {
                    handleRemoveRow(parameters[parameters.length - 1].id);
                  }
                }}
                className="h-5 w-5 cursor-pointer hover:text-red-500 transition-colors" 
              />
            </div>
          </div>
          <div className="h-px w-full bg-[#1D4A44]/20 mt-2" />
        </div>

        {/* PARAMETERS LIST */}
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {parameters.map((param) => (
            <div 
              key={param.id}
              className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-50 relative group"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Parameter Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                    Parameter Name
                  </label>
                  <input 
                    type="text"
                    value={param.name}
                    onChange={(e) => handleInputChange(param.id, "name", e.target.value)}
                    placeholder="Value"
                    className="w-full h-12 px-4 rounded-lg border border-slate-200 text-[13px] text-text-primary outline-none focus:border-[#1D4A44] transition-all"
                  />
                </div>

                {/* Parameter Value */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                    Parameter Value
                  </label>
                  <input 
                    type="text"
                    value={param.value}
                    onChange={(e) => handleInputChange(param.id, "value", e.target.value)}
                    placeholder="Value"
                    className="w-full h-12 px-4 rounded-lg border border-slate-200 text-[13px] text-text-primary outline-none focus:border-[#1D4A44] transition-all"
                  />
                </div>
              </div>

              {/* Resize Handle / Indicator (matching design) */}
              <div className="absolute bottom-2 right-2">
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-300 rounded-br-[2px]" />
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col items-center pt-4">
          <Button 
            onClick={() => onAdd(parameters)}
            className="h-12 px-16 rounded-lg !bg-[#1D4A44] !text-white font-bold text-[15px] shadow-lg shadow-[#1D4A44]/20 hover:scale-[1.02] transition-transform"
          >
            Add
          </Button>
          
        </div>
      </div>
    </Modal>
  );
};

export default CustomParametersModal;
