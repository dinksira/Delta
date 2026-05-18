import React from 'react';
import Image from 'next/image';
import { Typography } from '@/components/theme';

export type MyResourceTab = 'my-resources' | 'used' | 'rent' | 'shared' | 'sold' | 'rented' | 'orders';

export interface MyResourceCardProps {
  id: string;
  title: string;
  image: string;
  statusText: string;
  tab: MyResourceTab;
  sharedWith?: { avatar: string; name: string }[];
  sharedCount?: number;
  onAction?: (action: string) => void;
}

export const MyResourceCard: React.FC<MyResourceCardProps> = ({
  title,
  image,
  statusText,
  tab,
  sharedWith,
  sharedCount,
  onAction,
}) => {
  const isMyResources = tab === 'my-resources';
  const isUsed = tab === 'used';
  const isShared = tab === 'shared';

  return (
    <div className="flex flex-col bg-white w-full max-w-[240px] group transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[1.1] bg-[#F1F5F9] overflow-hidden flex flex-col">
        <div className="relative flex-1 p-4 flex items-center justify-center">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-6 mix-blend-multiply"
          />
        </div>
        
        {/* Marketplace Actions (Overlay/Bottom of image) */}
        {isMyResources && (
          <div className="flex w-full h-10 shrink-0">
            <button 
              onClick={() => onAction?.('add-to-rent')}
              className="flex-1 bg-[#174A5F] text-white text-[10px] font-bold border-r border-white/10 hover:bg-[#133e50] transition-colors"
            >
              Add To Rent
            </button>
            <button 
              onClick={() => onAction?.('add-to-sale')}
              className="flex-1 bg-[#174A5F] text-white text-[10px] font-bold hover:bg-[#133e50] transition-colors"
            >
              Add To Sale
            </button>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="pt-4 space-y-3">
        <Typography className="text-sm font-bold text-[#174A5F] line-clamp-1 leading-tight">
          {title}
        </Typography>

        {isShared && sharedWith ? (
          <div className="flex items-center gap-2 pt-1">
            <Typography className="text-[10px] font-bold text-[#174A5F]">Shared with</Typography>
            <div className="flex -space-x-2">
              {sharedWith.map((user, i) => (
                <div key={i} className="w-5 h-5 rounded-full border border-white bg-slate-200 overflow-hidden">
                  {user.avatar && <Image src={user.avatar} alt={user.name} width={20} height={20} />}
                </div>
              ))}
              {sharedCount && sharedCount > 0 && (
                <div className="flex items-center pl-4">
                  <Typography className="text-[10px] font-bold text-[#174A5F]">+{sharedCount} others</Typography>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Typography className="text-[11px] font-medium text-[#64748B]">
            {statusText}
          </Typography>
        )}

        {/* Vertical Actions */}
        {!isShared && (
          <div className="flex flex-col gap-2 pt-1">
            {isMyResources ? (
              <>
                <button 
                  onClick={() => onAction?.('remove')}
                  className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
                >
                  Remove Resource
                </button>
                <button 
                  onClick={() => onAction?.('share')}
                  className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
                >
                  Share resource
                </button>
              </>
            ) : isUsed ? (
              <>
                <button 
                  onClick={() => onAction?.('modify')}
                  className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
                >
                  Modify
                </button>
                <button 
                  onClick={() => onAction?.('remove')}
                  className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
                >
                  Remove Resource
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyResourceCard;
