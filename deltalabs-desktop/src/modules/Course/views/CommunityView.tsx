import React, { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Smile, Send, SquareDashedIcon } from 'lucide-react';
import { Typography } from '@/components/theme';
import ChatMessage, { ChatMessageProps } from '@/components/molecules/ChatMessage';
import CommunityContactItem, { CommunityContactItemProps } from '@/components/molecules/CommunityContactItem';
import { cx } from '@/components/theme/utils';

export const CommunityView: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'community' | 'group' | 'setting'>('community');

  const messages: ChatMessageProps[] = [
    {
      id: '1',
      text: 'next time you\'ll be awake at this hour why not now',
      timestamp: 'Sat 2:10 AM',
      senderName: 'Suzana Colin',
      senderAvatar: '/university_student_avatar_profile_1776871573394.png',
      isSelf: false,
    },
    {
      id: '2',
      text: 'Didn\'t I tell you not to put your phone on charge just because weekend?',
      timestamp: 'Sat 2:10 AM',
      senderName: 'Suzana Colin',
      senderAvatar: '/university_student_avatar_profile_1776871573394.png',
      isSelf: false,
    },
    {
      id: '3',
      emojiText: '🥺 🥺 🥺',
      timestamp: 'Sat 2:10 AM',
      senderName: 'Suzana Colin',
      senderAvatar: '/university_student_avatar_profile_1776871573394.png',
      isSelf: false,
    }
  ];

  const contacts: CommunityContactItemProps[] = [
    {
      id: 'c1',
      name: 'Suzana Colin',
      handle: '@suzaaa',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'Chris Martin reacted with',
      onlineStatus: 'Online',
      isActive: true,
    },
    {
      id: 'c2',
      name: 'Suzana Colin',
      handle: '@suzaaa',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'Chris Martin reacted with',
      onlineStatus: 'Online',
    },
    {
      id: 'c3',
      name: 'Suzana Colin',
      handle: '@suzaaa',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'Chris Martin reacted with',
      onlineStatus: 'Oct 12',
    },
    {
      id: 'c4',
      name: 'Suzana Colin',
      handle: '@suzaaa',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'Chris Martin reacted with',
      onlineStatus: 'last seen recently',
    },
    {
      id: 'c5',
      name: 'Suzana Colin',
      handle: '@suzaaa',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'Chris Martin reacted with',
      onlineStatus: 'last seen recently',
    },
    {
      id: 'c6',
      name: 'Suzana Colin',
      handle: '@suzana',
      avatar: '/university_student_avatar_profile_1776871573394.png',
      statusText: 'wow, if you can do this anymore',
      onlineStatus: 'Dec 13',
    }
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
      {/* Left Area: Chat (70%) */}
      <div className="flex-1 flex flex-col border-r border-[#174A5F]/5">
        {/* Chat Header */}
        <div className="px-8 py-6 space-y-8">
          <Typography className="text-[28px] font-bold text-[#174A5F]">
            Community
          </Typography>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden relative">
              <Image src="/university_student_avatar_profile_1776871573394.png" alt="Suzana" fill className="object-cover" />
            </div>
            <div>
              <Typography className="text-base font-bold text-[#174A5F]">
                Suzana Colin
              </Typography>
              <Typography className="text-[10px] font-medium text-[#64748B]">
                @suzana
              </Typography>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 flex flex-col-reverse justify-start scroll-smooth">
          {/* Using flex-col-reverse to simulate bottom-up flow for this mock */}
          <div className="space-y-6 flex flex-col">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} />
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-8 py-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[#174A5F]/40">
              <button className="hover:text-[#174A5F] transition-colors">
                <ImageIcon className="h-6 w-6" />
              </button>
              <button className="hover:text-[#174A5F] transition-colors">
                <SquareDashedIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 h-[56px] bg-white border border-[#174A5F]/20 rounded-full flex items-center px-6 gap-3 group focus-within:border-[#174A5F]/40 transition-all">
              <input 
                type="text" 
                placeholder="Start a message" 
                className="flex-1 h-full bg-transparent outline-none text-[15px] text-[#174A5F] placeholder:text-[#174A5F]/30 font-medium"
              />
              <button className="text-[#174A5F]/40 hover:text-[#174A5F] transition-colors">
                <Smile className="h-6 w-6" />
              </button>
            </div>

            <button className="w-12 h-12 flex items-center justify-center text-[#174A5F] hover:scale-110 transition-transform">
              <Send className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Area: Sidebar (30%) */}
      <div className="w-[380px] flex flex-col p-8 space-y-10">
        {/* Right Tabs */}
        <div className="flex items-center justify-between border-b border-[#174A5F]/5">
          {[
            { id: 'community', label: 'Community' },
            { id: 'group', label: 'Group' },
            { id: 'setting', label: 'Setting' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id as any)}
              className={cx(
                "pb-4 text-[18px] font-bold transition-all relative",
                activeSidebarTab === tab.id ? "text-[#174A5F]" : "text-[#174A5F]/40 hover:text-[#174A5F]/60"
              )}
            >
              {tab.label}
              {activeSidebarTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
              )}
            </button>
          ))}
        </div>

        {/* Contact/Group/Setting List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
          {activeSidebarTab === 'community' && (
            <>
              {/* Online Indicator */}
              <div className="flex items-center gap-2 mb-6">
                <Typography className="text-xl font-bold text-[#174A5F]">
                  2 online
                </Typography>
              </div>
              {contacts.map((contact) => (
                <CommunityContactItem key={contact.id} {...contact} />
              ))}
            </>
          )}

          {activeSidebarTab === 'group' && (
            <div className="space-y-6">
              {/* Create Group Button */}
              <button className="w-full h-12 border-2 border-dashed border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[13px] font-medium text-[#174A5F] hover:bg-[#174A5F]/5 transition-all mb-8">
                Create Group
              </button>
              
              <div className="space-y-4">
                {[
                  { id: 'g1', name: 'Physics Group', date: 'Dec 13' },
                  { id: 'g2', name: 'Motion Group', date: 'Dec 13' },
                ].map((group) => (
                  <div key={group.id} className="flex items-center gap-4 p-2 hover:bg-[#174A5F]/5 rounded-xl cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center p-2">
                      <Image src="/biology_neural_network_hero.png" alt={group.name} width={32} height={32} className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Typography className="text-sm font-bold text-[#174A5F]">{group.name}</Typography>
                        <Typography className="text-[10px] text-[#64748B]">{group.date}</Typography>
                      </div>
                      <Typography className="text-[11px] text-[#64748B]">Chris Martin reacted with</Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSidebarTab === 'setting' && (
            <div className="space-y-8 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Typography className="text-[13px] font-medium text-[#174A5F]">
                    Recieve notifications
                  </Typography>
                  <div className="relative group">
                    <div className="h-9 px-4 border border-[#174A5F]/10 rounded-lg flex items-center justify-between gap-4 min-w-[100px] bg-white cursor-pointer hover:border-[#174A5F]/20">
                      <Typography className="text-[11px] font-bold text-[#174A5F]">Allowed</Typography>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#174A5F]/40">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityView;
