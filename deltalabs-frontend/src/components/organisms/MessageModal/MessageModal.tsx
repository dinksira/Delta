import React, { useState } from 'react';
import { ChevronLeft, Smile, Send, Check } from 'lucide-react';
import { Typography } from '@/components/theme';
import Modal from '@/components/atoms/Modal';

export interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
  status?: 'sent' | 'delivered' | 'read';
}

export const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, schoolName = "School" }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello sir, nice to meet you", timestamp: "18:12", sender: 'other' },
    { id: '2', text: "Hello", timestamp: "18:16", sender: 'me', status: 'read' },
    { id: '3', text: "Can you please elaborate on the article", timestamp: "18:16", sender: 'me', status: 'read' }
  ]);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      timestamp,
      sender: 'me',
      status: 'sent'
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ["😊", "😂", "🥰", "👍", "🔥", "🙏", "😮", "🤔"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[850px]">
      <div className="flex flex-col h-[400px]">
        {/* Custom Header (replacing standard Modal title) */}
        <div className="absolute top-0 left-0 right-10 h-[48px] flex items-center px-4 gap-4 pointer-events-none">
          <button onClick={onClose} className="pointer-events-auto text-[#174A5F]/60 hover:text-[#174A5F] transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Typography className="text-[14px] font-bold text-[#174A5F] pointer-events-auto">
            Message: {schoolName}
          </Typography>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto mt-2 px-2 space-y-4 no-scrollbar scroll-smooth"
        >
          {/* Date Separator */}
          <div className="flex justify-center">
            <div className="px-4 py-1.5 bg-[#94A3B8]/10 rounded-full">
              <Typography className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Today</Typography>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div className={`
                  max-w-[85%] px-4 py-2 rounded-2xl shadow-sm
                  ${msg.sender === 'me' 
                    ? 'bg-[#174A5F] text-white rounded-tr-none' 
                    : 'bg-slate-100 text-[#174A5F] rounded-tl-none'}
                `}>
                  <Typography className="text-[13px] font-medium leading-relaxed">
                    {msg.text}
                  </Typography>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <Typography className={`text-[8px] font-bold ${msg.sender === 'me' ? 'text-white/60' : 'text-[#174A5F]/40'}`}>
                      {msg.timestamp}
                    </Typography>
                    {msg.sender === 'me' && (
                      <Check className={`h-2.5 w-2.5 ${msg.status === 'read' ? 'text-cyan-400' : 'text-white/40'}`} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3 relative">
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-2xl border border-slate-100 flex gap-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
              {commonEmojis.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`transition-colors ${showEmojiPicker ? 'text-[#174A5F]' : 'text-[#174A5F]/40 hover:text-[#174A5F]'}`}
          >
            <Smile className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative bg-slate-50 rounded-xl px-4 py-2.5 border border-transparent focus-within:border-slate-200 transition-all">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="w-full text-[13px] text-[#174A5F] placeholder:text-[#174A5F]/30 outline-none bg-transparent"
            />
          </div>
          
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-[#174A5F] text-white p-2.5 rounded-xl hover:bg-[#1f5f7a] transition-all disabled:opacity-20 disabled:scale-95"
          >
            <Send className="h-5 w-5 fill-current" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MessageModal;
