"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const quickActions = [
  "Best setup right now?",
  "What is MACD divergence?",
  "Explain Regular vs Hidden",
  "Best BTC trade?",
  "Risk management tips",
];

function MessageContent({ content }: { content: string }) {
  return (
    <div className="whitespace-pre-wrap break-words">
      {content.split("\n").map((line, i) => (
        <p key={i} className="mb-0.5">{line}</p>
      ))}
    </div>
  );
}

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "Welcome! I am your MACD Divergence AI assistant. I can analyze trade setups, explain divergence patterns, and help with trading decisions. What would you like to know?",
  timestamp: 0,
};

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const apiMessages = [...messages, userMsg]
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.error || "Sorry, I could not generate a response.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Failed to connect to AI service. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25 flex items-center justify-center hover:shadow-blue-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:inset-auto md:bottom-20 md:right-4 z-50 md:w-[400px] md:h-[500px] md:max-h-[70vh] md:rounded-2xl bg-[#0a0e1a] border-0 md:border border-white/10 shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">MACD AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-500/20 text-blue-100 rounded-br-sm"
                        : "bg-white/5 text-slate-300 rounded-bl-sm"
                    }`}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="bg-white/5 rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/5 focus-within:border-blue-500/30 transition-colors px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about MACD, trades, setups..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-white/5 disabled:text-slate-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
