"use client";

import { useState } from "react";
import ApprovalCard, { PendingApproval } from "@/components/ApprovalCard";

type Message = {
  role: "user" | "assistant";
  content: string;
};


export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);

  const handleApproval = async (decision: "approve" | "reject" | "edit", editedArgs?: Record<string, string | number | boolean>) => {
    setLoading(true);
    console.log("handleApproval", decision, editedArgs);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          editedArgs,
          thread_id: "chat-email-assistant",
        }),
      });

      const data = await res.json();
      
      if (data.status === "completed") {
        setHistory([
          ...history,
          { role: "assistant", content: data.response },
        ]);
      }
      
      setPendingApproval(null);
    } catch (err) {
      console.error(err);
      setHistory(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, there was an error processing your approval. Please try again." 
        }
      ]);
      setPendingApproval(null);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newHistory: Message[] = [...history, { role: "user", content: message }];
    setHistory(newHistory);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          thread_id: "chat-email-assistant",
        }),
      });

      const data = await res.json();

      if (data.status === "pending_approval") {
        setPendingApproval(data.interrupt[0]);
        setHistory([
          ...newHistory,
          { role: "assistant", content: "Waiting for your approval to execute an action..." },
        ]);
      } else {
        setHistory([
          ...newHistory,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (err) {
      console.error(err);
      setHistory(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, there was an error processing your request. Please try again." 
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans antialiased">

      {/* Header: Fixed at top, centered content on large screens */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <span className="font-bold tracking-tight text-slate-800">AI Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">v2.0</span>
          </div>
        </div>
      </header>

      {/* Chat messages: Responsive padding and message grouping */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-0 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="text-sm font-medium">No messages yet. Ask me anything!</p>
            </div>
          )}

          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`relative px-4 py-3 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-sm text-sm md:text-base ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Timestamp or Role Label (Optional) */}
                <div className={`text-[10px] mt-1 opacity-50 ${msg.role === "user" ? "text-right" : "text-left"
                  }`}>
                  {msg.role === "user" ? "You" : "Assistant"}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-200 px-4 py-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {pendingApproval && (
            <ApprovalCard
              pendingApproval={pendingApproval}
              onApproval={handleApproval}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Input Area: Centered with a floating appearance on desktop */}
      <div className="p-4 md:pb-8 bg-gradient-to-t from-slate-50 to-transparent">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>

          <div className="relative flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-xl">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-transparent border-none px-3 py-2 text-sm md:text-base outline-none focus:ring-0 placeholder:text-slate-400 disabled:opacity-50"
              placeholder={pendingApproval ? "Waiting for approval..." : "Type your message..."}
              disabled={!!pendingApproval || loading}
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading || !!pendingApproval}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:grayscale disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
            >
              {/* Simple Send SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
            Press Enter to send &bull; Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}