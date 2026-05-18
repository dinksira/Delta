/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SharedSessionHeader Organism: Header for the collaboration lobby. */
import React from "react";
import { Typography, Button } from "@/components/theme";

export interface SharedSessionHeaderProps {
  onCreateSession?: () => void;
}

export const SharedSessionHeader: React.FC<SharedSessionHeaderProps> = ({
  onCreateSession,
}) => {
  return (
    <div className="flex items-center justify-between w-full pt-4">
      <Typography className="text-[24px] font-black text-[#114B5F]">
        Take with friend
      </Typography>
      
      <Button 
        onClick={onCreateSession}
        className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-md hover:brightness-110 transition-all"
      >
        Take with friend
      </Button>
    </div>
  );
};

export default SharedSessionHeader;
/** ################################ /COMPONENT ############################# */
