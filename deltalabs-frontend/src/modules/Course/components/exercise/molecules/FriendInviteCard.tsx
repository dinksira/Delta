/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** FriendInviteCard Molecule: Displays friend info with an invite action. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { StatusDot } from "../atoms/StatusDot";
import { UserPlus, Check } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface FriendInviteCardProps {
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  isInvited?: boolean;
  onInvite?: () => void;
  className?: string;
}

export const FriendInviteCard: React.FC<FriendInviteCardProps> = ({
  name,
  avatar,
  status,
  isInvited = false,
  onInvite,
  className,
}) => {
  return (
    <div 
      className={cx(
        "flex items-center justify-between p-4 rounded-2xl bg-white border border-border-primary shadow-sm hover:shadow-md transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with Status */}
        <div className="relative">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-border-subtle bg-slate-100 flex items-center justify-center">
            {avatar ? (
              <Image src={avatar} alt={name} width={48} height={48} className="object-cover" />
            ) : (
              <Typography className="text-lg font-bold text-slate-400">{name[0]}</Typography>
            )}
          </div>
          <StatusDot status={status} className="absolute -bottom-0.5 -right-0.5" />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Typography className="text-[15px] font-black text-primary-900 leading-tight">
            {name}
          </Typography>
          <Typography className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {status}
          </Typography>
        </div>
      </div>

      {/* Action */}
      <Button
        onClick={onInvite}
        disabled={status === "offline" || isInvited}
        variant={isInvited ? "secondary" : "primary"}
        size="sm"
        className={cx(
          "rounded-xl gap-2 min-w-[100px] h-9 transition-all duration-300",
          isInvited ? "!bg-emerald-50 !text-emerald-600 !border-emerald-200" : "!bg-primary-900 !text-white"
        )}
      >
        {isInvited ? (
          <>
            <Check size={16} />
            <span className="text-xs font-bold">Invited</span>
          </>
        ) : (
          <>
            <UserPlus size={16} />
            <span className="text-xs font-bold">Invite</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default FriendInviteCard;
/** ################################ /COMPONENT ############################# */
