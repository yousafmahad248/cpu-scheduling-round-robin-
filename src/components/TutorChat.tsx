import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Send, GraduationCap, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SimulationResult, ChatMessage } from "../types.ts";

interface TutorChatProps {
  simulationResults: SimulationResult | null;
}

export default function TutorChat({ simulationResults }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Seed default greetings on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "ai",
          text: `Hello! I am your **CPU Scheduling Academic Tutor** 🎓.

I can analyze your active **Round Robin** parameters and explain exactly why these process distributions took place.

Here are some typical academic concepts we can explore together:
- How our selected **Time Quantum** affects contextual overhead.
- Why certain processes suffer from higher **Response Time (RT)**.
- Review hand-calculations step-by-step to study for Operating Systems exams.

Feel free to choose a concept below or write your specific homework question!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, []);

  const commonQuestions = [
    {
      title: "Analyze these results",
      query: "Analyze this active simulation scenario in detail. Point out which process performed best vs worst and explain why."
    },
    {
      title: "Impact of Time Quantum",
      query: "How would making the Time Quantum much smaller (like 1) or much larger (like 20) affect preemption, context switching, and FCFS boundary behavior?"
    },
    {
      title: "Overhead of Context Switch",
      query: "What is context switch overhead and how does adding switching overhead (like 1 or 2 units) affect CPU utilization and average waiting times?"
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorDetails(null);
    const userMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/scheduler/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          results: simulationResults,
          query: textToSend
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response from backend tutor API.");
      }

      const aiMsg: ChatMessage = {
        sender: "ai",
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err.message || "An unexpected error occurred while communicating with the AI Tutor.");
      
      const errMsg: ChatMessage = {
        sender: "ai",
        text: `⚠️ **Tutor Unavailable**

It looks like the Gemini API is offline or the environment's \`GEMINI_API_KEY\` is not set.

Don't worry! You can configure your workspace key at **Settings > Secrets** in the panel of Google AI Studio, or double-check your connection!
${err.message ? `\n*Details: ${err.message}*` : ""}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: `Reset completed! Choose a prompt below or type your operating systems question about this simulation:`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setErrorDetails(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[520px] md:h-[600px] text-slate-100 shadow-xl overflow-hidden" id="tutor-chat">
      
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-1">
              AI Classroom Tutor <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            </h3>
            <span className="text-[10px] text-slate-500 font-sans block leading-none">Powered by Gemini 3.5 Flash</span>
          </div>
        </div>
        
        <button 
          onClick={clearChat}
          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-500 hover:text-slate-300 transition-all text-xs font-mono flex items-center gap-1.5"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-900/40">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            {/* Bubble */}
            <div 
              className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.sender === "user" 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-slate-950/70 border border-slate-850 text-slate-200 rounded-bl-none shadow-sm prose prose-invert prose-xs"
              }`}
            >
              {msg.sender === "user" ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="markdown-body text-slate-300">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
            {/* Timestamp */}
            <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2.5 max-w-[85%] mr-auto bg-slate-950/40 border border-slate-850 p-4 rounded-2xl rounded-bl-none text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="font-sans italic animate-pulse">Professor explaining scheduling steps...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pre-cooked prompt chips */}
      {!isLoading && (
        <div className="p-3 bg-slate-950/45 border-t border-slate-850 flex flex-wrap gap-2 overflow-x-auto select-none">
          {commonQuestions.map((cq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(cq.query)}
              disabled={!simulationResults}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-sans flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span>{cq.title}</span>
            </button>
          ))}
          {!simulationResults && (
            <span className="text-[10px] text-slate-600 italic m-auto">Run simulation to enable quick AI analysis.</span>
          )}
        </div>
      )}

      {/* Chat Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={simulationResults ? "Ask about preemption, waiting times..." : "First run simulation to query results..."}
          disabled={!simulationResults || isLoading}
          className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
