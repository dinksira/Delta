"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  AlignJustify,
  Send,
  Smile,
  CheckCheck
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarColors: string[];
}

interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
}

const CONTACTS: Contact[] = [
  {
    id: "haramaya",
    name: "Haramaya University",
    lastMessage: "Please make your statement clear",
    time: "10:48",
    unread: 1,
    avatarColors: ["#1a6e4b", "#2d9d6e", "#f4a234"]
  },
  {
    id: "addis",
    name: "Addis Ababa University",
    lastMessage: "Hello sir, we need a document",
    time: "18:30",
    avatarColors: ["#c0392b", "#e74c3c", "#f39c12"]
  }
];

const CHAT_HISTORY: Record<string, Message[]> = {
  addis: [
    { id: "1", text: "Hello sir, we need a document", time: "18:12", isMe: false },
    { id: "2", text: "what document sir", time: "18:16", isMe: true },
    { id: "3", text: "I have already attached my documents.", time: "18:18", isMe: true }
  ],
  haramaya: [
    { id: "1", text: "Please make your statement clear", time: "10:48", isMe: false }
  ]
};

function UniversityAvatar({ colors, size = 40 }: { colors: string[]; size?: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0 overflow-hidden relative"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
    >
      {/* Decorative ring element */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.55,
          height: size * 0.55,
          border: `${size * 0.07}px solid ${colors[2]}`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      />
    </div>
  );
}

export const CourseMessageView: React.FC = () => {
  const [activeContactId, setActiveContactId] = useState<string>("addis");
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState(CHAT_HISTORY);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = CONTACTS.find(c => c.id === activeContactId)!;
  const messages = chatHistory[activeContactId] ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      isMe: true
    };
    setChatHistory(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] ?? []), newMessage]
    }));
    setInputText("");
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-[220px] flex-shrink-0 flex flex-col border-r border-gray-100">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm px-4 pt-6 pb-4">
          <Link href="/features/course" className="text-gray-400 hover:text-gray-600 transition-colors">
            Course
          </Link>
          <span className="text-gray-300">{">"}</span>
          <span className="text-[#1F4156] font-medium">Message</span>
        </div>

        {/* Search */}
        <div className="px-3 mb-4">
          <div className="flex items-center h-9 bg-[#F5F7F8] rounded-lg border border-gray-100 px-3 gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              className="flex-1 bg-transparent text-xs outline-none text-gray-600 placeholder:text-gray-400"
            />
            <AlignJustify className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map(contact => (
            <button
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${
                contact.id === activeContactId ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              <UniversityAvatar colors={contact.avatarColors} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] font-bold text-[#1F4156] truncate">{contact.name}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400 truncate">{contact.lastMessage}</p>
                  {contact.unread && (
                    <span className="ml-1 flex-shrink-0 w-4 h-4 bg-[#1F4156] rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CHAT PANEL */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <UniversityAvatar colors={activeContact.avatarColors} size={44} />
          <div>
            <p className="text-[14px] font-bold text-[#1F4156]">{activeContact.name}</p>
            <p className="text-[11px] text-gray-400">last seen 5 mins ago</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col">
          {/* Date divider */}
          <div className="flex justify-center my-4">
            <span className="bg-[#D8DEE2] text-[#6B7B8D] text-[11px] font-medium px-4 py-1 rounded-full">
              Today
            </span>
          </div>

          {/* Messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex mb-3 ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              {msg.isMe ? (
                <div className="flex flex-col items-end max-w-[60%]">
                  <div className="bg-[#1F4156] text-white text-[13px] rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 mr-1">
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                    <CheckCheck className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start max-w-[60%]">
                  <div className="bg-transparent text-gray-700 text-[13px] px-0 py-1">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5">{msg.time}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button className="text-gray-400 hover:text-[#1F4156] transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <div className="flex-1 h-10 bg-[#F5F7F8] rounded-lg border border-gray-100 px-4 flex items-center">
            <input
              type="text"
              placeholder="Message"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            className="text-[#1F4156] hover:opacity-70 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
