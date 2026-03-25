/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Brain, 
  HelpCircle, 
  Zap, 
  ArrowRight, 
  X,
  Loader2,
  MessageSquare,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "./lib/utils";
import { analyzeImage } from "./services/gemini";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, response]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setMimeType(file.type);
        setResponse("");
        setMessages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (prompt: string) => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setResponse("");
    
    try {
      const stream = analyzeImage(image, mimeType, prompt);
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setResponse(fullText);
      }
      setMessages(prev => [...prev, { role: "ai", content: fullText }]);
    } catch (error) {
      console.error("Analysis failed:", error);
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't analyze that image. Please try again." }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAction = (action: string) => {
    const prompts: Record<string, string> = {
      explain: "Explain what is happening in this image in detail, step-by-step.",
      summarize: "Provide a concise summary of the key concepts shown in this image.",
      quiz: "Generate 3 multiple-choice questions based on the content of this image to test my understanding.",
      eli5: "Explain the concepts in this image like I'm 5 years old.",
    };
    
    setMessages(prev => [...prev, { role: "user", content: action.charAt(0).toUpperCase() + action.slice(1) }]);
    startAnalysis(prompts[action]);
  };

  const reset = () => {
    setImage(null);
    setResponse("");
    setMessages([]);
    setMimeType("");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-black/5 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">CogniSketch</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-widest text-black/40">Visual Intelligence</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        {!image ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6 leading-tight">
                Turn any image into a <span className="italic font-serif">learning experience.</span>
              </h2>
              <p className="text-lg text-black/60 mb-10 leading-relaxed">
                Upload a diagram, handwritten notes, or a complex chart. 
                CogniSketch uses AI to explain, summarize, and quiz you on visual information.
              </p>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-black/5 to-black/10 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col items-center justify-center p-12 bg-white border border-dashed border-black/20 rounded-2xl hover:border-black/40 transition-all">
                  <Upload className="w-10 h-10 mb-4 text-black/20 group-hover:text-black transition-colors" />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                  <span className="text-xs text-black/40 mt-1">Supports PNG, JPG, WEBP</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Image & Actions */}
            <div className="space-y-6 sticky top-24">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white p-2 rounded-2xl shadow-sm border border-black/5 overflow-hidden group"
              >
                <img 
                  src={image} 
                  alt="Uploaded content" 
                  className="w-full h-auto rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <ActionButton 
                  icon={<Brain className="w-4 h-4" />} 
                  label="Explain Step-by-Step" 
                  onClick={() => handleAction("explain")}
                  disabled={isAnalyzing}
                />
                <ActionButton 
                  icon={<BookOpen className="w-4 h-4" />} 
                  label="Concise Summary" 
                  onClick={() => handleAction("summarize")}
                  disabled={isAnalyzing}
                />
                <ActionButton 
                  icon={<HelpCircle className="w-4 h-4" />} 
                  label="Quiz Me" 
                  onClick={() => handleAction("quiz")}
                  disabled={isAnalyzing}
                />
                <ActionButton 
                  icon={<Zap className="w-4 h-4" />} 
                  label="Simplify (ELI5)" 
                  onClick={() => handleAction("eli5")}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            {/* Right Column: Chat/Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 flex flex-col h-[70vh]">
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Analysis Workspace</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs font-medium text-black/40">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing...
                  </div>
                )}
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
              >
                {messages.length === 0 && !response && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <ImageIcon className="w-12 h-12 mb-4" />
                    <p className="text-sm">Select an action on the left to begin analysis.</p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex flex-col",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user" 
                        ? "bg-black text-white rounded-tr-none" 
                        : "bg-[#f9f9f9] border border-black/5 rounded-tl-none markdown-body"
                    )}>
                      {msg.role === "ai" ? (
                        <Markdown>{msg.content}</Markdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isAnalyzing && response && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[85%] p-4 rounded-2xl bg-[#f9f9f9] border border-black/5 rounded-tl-none text-sm leading-relaxed markdown-body">
                      <Markdown>{response}</Markdown>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-black/5">
                <div className="relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && input.trim() && (startAnalysis(input), setMessages(prev => [...prev, { role: "user", content: input }]), setInput(""))}
                    placeholder="Ask a specific question about the image..."
                    className="w-full bg-[#f5f5f5] border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-black/10 transition-all outline-none"
                    disabled={isAnalyzing}
                  />
                  <button 
                    onClick={() => input.trim() && (startAnalysis(input), setMessages(prev => [...prev, { role: "user", content: input }]), setInput(""))}
                    disabled={!input.trim() || isAnalyzing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-lg disabled:opacity-20 transition-opacity"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Stats (Recipe 8 Style) */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-black/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat label="AI Model" value="Gemini 3 Flash" />
          <Stat label="Processing" value="Real-time" />
          <Stat label="Capabilities" value="Multimodal" />
          <Stat label="Status" value="Ready" />
        </div>
      </footer>
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 p-4 bg-white border border-black/5 rounded-xl text-left hover:border-black/20 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="p-2 bg-black/[0.03] rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-xs font-semibold tracking-tight uppercase">{label}</span>
    </button>
  );
}

function Stat({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
