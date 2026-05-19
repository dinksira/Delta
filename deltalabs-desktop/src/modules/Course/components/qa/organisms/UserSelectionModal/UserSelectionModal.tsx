/** ################################ IMPORT ############################# */
import React, { useState } from "react";
import { Search, SlidersHorizontal, MessageSquare } from "lucide-react";
import { Modal } from "@/components/atoms/Modal/Modal";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES & INTERFACES ############################# */

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
}

/** ################################ /TYPES & INTERFACES ############################# */

/** ################################ CONSTANTS ############################# */

const MOCK_USERS: User[] = [
  { id: "1", name: "Abebe Kebede", role: "Professor", avatar: "https://i.pravatar.cc/150?u=abebe" },
  { id: "2", name: "Lomi Kebede", role: "Phd in physics", avatar: "https://i.pravatar.cc/150?u=lomi" },
  { id: "3", name: "Kid Alemu", role: "Ms quantum", avatar: "https://i.pravatar.cc/150?u=kid" },
  { id: "4", name: "Lomi Kebede", role: "Phd in physics", avatar: "https://i.pravatar.cc/150?u=lomi2" },
  { id: "5", name: "Kid Alemu", role: "Ms quantum", avatar: "https://i.pravatar.cc/150?u=kid2" },
  { id: "6", name: "Abebe Kebede", role: "Professor", avatar: "https://i.pravatar.cc/150?u=abebe2" },
  { id: "7", name: "Kid Alemu", role: "Ms quantum", avatar: "https://i.pravatar.cc/150?u=kid3" },
];

/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */

/**
 * UserSelectionModal
 * High-fidelity modal for selecting a tutor/user for individual request.
 */
export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = () => {
    const user = MOCK_USERS.find(u => u.id === selectedUserId);
    if (user) {
      onSelect(user);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Users"
      className="w-full max-w-[1000px]"
    >
      <div className="space-y-10">
        {/* Search Bar */}
        <div className="flex items-center gap-0 w-full max-w-[600px] mx-auto border border-border-subtle rounded-xl overflow-hidden focus-within:border-primary-900 focus-within:ring-2 focus-within:ring-primary-900/10 transition-all">
          <div className="pl-4 text-primary-900">
            <Search size={24} strokeWidth={2.5} />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 h-12 px-3 text-[15px] outline-none placeholder:text-text-tertiary"
          />
          <div className="px-4 py-3 bg-surface-secondary border-l border-border-subtle text-primary-900 cursor-pointer hover:bg-surface-primary transition-colors">
            <SlidersHorizontal size={20} strokeWidth={2.5} />
          </div>
        </div>

        {/* Recently Requested Section */}
        <div className="space-y-8">
          <Typography className="text-[14px] font-bold text-text-primary tracking-tight">
            Recently Requested
          </Typography>

          <div className="grid grid-cols-7 gap-4">
            {MOCK_USERS.map((user) => (
              <div 
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="flex flex-col gap-3 cursor-pointer group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm transition-all group-hover:scale-[1.02]">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                  {/* Selection Overlay */}
                  {selectedUserId === user.id && (
                    <div className="absolute inset-0 bg-primary-900/20 border-2 border-primary-900 rounded-xl" />
                  )}
                  {/* Mock corner badge */}
                  <div className="absolute top-2 right-2 w-4 h-4 border border-white/40 rounded-sm" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <Typography className="text-[13px] font-bold text-primary-900 truncate">
                    {user.name}
                  </Typography>
                  <Typography className="text-[11px] font-medium text-text-tertiary font-mono truncate">
                    {user.role}
                  </Typography>
                </div>

                <div className="flex items-center gap-2 text-primary-900/60 group-hover:text-primary-900 transition-colors">
                  <MessageSquare size={14} />
                  <span className="text-[11px] font-bold">Message</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
          <Button 
            disabled={!selectedUserId}
            onClick={handleSelect}
            className={cx(
              "h-12 px-12 rounded-xl font-bold text-[16px] shadow-lg transition-all",
              selectedUserId ? "!bg-primary-900 !text-white shadow-primary-900/20" : "opacity-50 grayscale"
            )}
          >
            Select
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserSelectionModal;
/** ################################ /COMPONENT ############################# */
