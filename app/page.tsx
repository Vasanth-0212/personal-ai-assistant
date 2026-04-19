"use client";

import { useState, useRef, useEffect } from "react";
import ApprovalCard, { PendingApproval } from "@/components/ApprovalCard";
import MailIcon from "@/components/Icons/MailIcon";
import ShieldIcon from "@/components/Icons/ShieldIcon";
import SendIcon from "@/components/Icons/SendIcon";

type Message = {
  role: "user" | "assistant";
  content: string;
};


export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading, pendingApproval]);

  const handleQuickAction = (message: string) => {
    setMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  const handleApproval = async (decision: "approve" | "reject" | "edit", editedArgs?: { name: string; args: Record<string, string | number | boolean> }) => {
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-slate-900 font-sans antialiased">

      {/* Header: Email-themed header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <MailIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">Email AI Assistant</h1>
              <p className="text-xs text-slate-500">Manage your emails with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      {/* Chat messages: Responsive padding and message grouping */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-0 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MailIcon size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to Email AI Assistant</h3>
              <p className="text-sm text-slate-500 mb-4">I can help you send emails and manage your inbox</p>
              <div className="bg-white rounded-lg border border-blue-200 p-4 max-w-md">
                <p className="text-xs text-slate-600 mb-3 font-medium">Quick Actions:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickAction("Send an email")}
                    className="w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-blue-700"
                  >
                    <div className="font-medium">Send Email</div>
                    <div className="text-blue-600 opacity-75">Quick email sending</div>
                  </button>
                  <button
                    onClick={() => handleQuickAction("Delete emails")}
                    className="w-full text-left px-3 py-2 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-red-700"
                  >
                    <div className="font-medium">Clean Spam Emails</div>
                    <div className="text-red-600 opacity-75">Remove spam from your inbox</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`relative shadow-md text-sm md:text-base ${msg.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-none max-w-[85%] md:max-w-[75%]"
                  : "bg-white border border-blue-200 text-slate-800 rounded-2xl rounded-tl-none max-w-[90%] md:max-w-[80%]"
                  }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-blue-100 bg-blue-50 rounded-t-xl">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <ShieldIcon size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-700">Email Assistant</span>
                  </div>
                )}
                <div className={`whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "px-4 pb-2 pt-3" : "px-4 pb-2 pt-3"}`}>
                  {msg.content}
                </div>

                {/* Email-style footer */}
                <div className={`px-4 pb-3 text-[10px] opacity-70 ${msg.role === "user" ? "text-blue-100 text-right" : "text-slate-400 text-left"
                  }`}>
                  {msg.role === "user" ? "You" : "AI Assistant"}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-none shadow-md max-w-[90%] md:max-w-[80%]">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-blue-100 bg-blue-50 rounded-t-xl">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <ShieldIcon size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">Email Assistant</span>
                </div>
                <div className="px-4 py-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area: Email compose style */}
      <div className="p-4 md:pb-8 bg-white border-t border-blue-100">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-blue-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-200">
              <ShieldIcon size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Compose Message</span>
            </div>

            <div className="p-4">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-slate-400 disabled:opacity-50"
                placeholder={pendingApproval ? "Waiting for approval..." : "Ask me to send emails, delete messages, or manage your inbox..."}
                disabled={!!pendingApproval || loading}
              />
            </div>

            <div className="flex flex-col gap-3 px-4 py-3 bg-slate-50 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Press Enter to send &bull; Shift + Enter for new line
                </p>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || loading || !!pendingApproval}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SendIcon size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}