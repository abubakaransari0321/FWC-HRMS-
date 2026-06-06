/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, User, Sparkles, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import { ChatMessage } from "../types.js";

export default function AIAssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "Hello! I am your **FWC HRMS Intelligent Assistant**. I have real-time access to our personnel directories, pending leaves, and active candidate portfolios.\n\nHow can I help you manage operations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What are the employee department breakdowns?",
    "List pending time-off applications requiring audit",
    "Who are the top candidates in the recruitment pipeline?"
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg]
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Apologies, I encountered an issue synchronizing indices. Please try querying me again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-xs text-[#434655] min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div>
        <h2 className="text-display-lg font-bold text-[#191b23] tracking-tight">AI Personnel Assistant</h2>
        <p className="text-body-md text-[#505f76]">Conversational querying of HRMS records, directories, and candidate pipelines</p>
      </div>

      {/* Main chat UI */}
      <div className="flex-1 bg-white border border-[#c3c6d7] rounded-2xl shadow-card flex flex-col overflow-hidden min-h-[460px]">
        
        {/* Chat History Container */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 max-h-[400px]">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isAI ? "self-start" : "self-end flex-row-reverse"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isAI ? "bg-[#004ac6] text-white" : "bg-[#f3f3fe] border border-[#c3c6d7] text-slate-700"
                }`}>
                  {isAI ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className={`p-4 rounded-2xl flex flex-col gap-1.5 ${
                  isAI ? "bg-[#f3f3fe] text-[#434655]" : "bg-[#004ac6] text-white"
                }`}>
                  <p 
                    className="leading-relaxed whitespace-pre-line font-medium"
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  ></p>
                  <span className={`text-[9px] mt-1 self-end font-semibold ${
                    isAI ? "text-slate-400" : "text-white/70"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 self-start">
              <div className="w-8 h-8 rounded-xl bg-[#004ac6] text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-[#f3f3fe] p-4 rounded-2xl text-slate-400 font-bold italic animate-pulse">
                FWC Assistant is compiling response...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Quick chips */}
        <div className="px-5 py-3 border-t border-[#ededf9] bg-[#faf8ff] flex flex-col gap-2">
          <span className="font-bold text-[#737686] text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-[#004ac6]" />
            <span>Suggested Operations Guidance</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p, idx) => (
              <button
                id={`suggest-chip-${idx}`}
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="bg-white hover:bg-[#f3f3fe] hover:border-[#004ac6] text-slate-700 border border-[#c3c6d7] px-3 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-colors flex items-center gap-1 shadow-sm shrink-0"
              >
                <span>{p}</span>
                <ArrowRight size={10} className="text-[#004ac6]" />
              </button>
            ))}
          </div>
        </div>

        {/* Message Input submission bar */}
        <div className="p-4 border-t border-[#c3c6d7] flex gap-2 bg-white">
          <input 
            type="text"
            placeholder="Query personnel databases, employee codes, pending leaves..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
            className="flex-1 bg-[#f3f3fe] border border-[#c3c6d7] rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] font-semibold"
          />
          <button 
            id="btn-send-message"
            onClick={() => handleSendMessage(inputText)}
            className="bg-[#004ac6] hover:bg-[#2563eb] text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}
