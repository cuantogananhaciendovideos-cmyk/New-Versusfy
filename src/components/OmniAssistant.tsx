import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, X, Volume2, VolumeX, Loader2, Wand2 } from 'lucide-react';
import { chatWithOmniAssistant } from '../services/geminiService';

import { speak as omniSpeak, stopSpeaking as omniStop } from '../lib/speech';

interface OmniAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComparisonRequested: (a: string, b: string) => void;
}

export const OmniAssistant: React.FC<OmniAssistantProps> = ({ isOpen, onClose, onComparisonRequested }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      speak("How can I assist you with today?");
    } else {
      stopSpeaking();
    }
  }, [isOpen]);

  const speak = (text: string) => {
    omniSpeak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    omniStop();
    setIsSpeaking(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResponse('');
    try {
      const result = await chatWithOmniAssistant(query);
      setResponse(result.response);
      setSuggestions(result.suggestions || []);
      speak(result.response);

      if (result.action === 'compare' && result.comparisonEntityA && result.comparisonEntityB) {
        onComparisonRequested(result.comparisonEntityA, result.comparisonEntityB);
      }
      setQuery('');
    } catch (error) {
      console.error(error);
      setResponse("I'm sorry, I couldn't process that. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Pulsating Sphere Header */}
            <div className="p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-emerald-green/10 to-transparent">
              <div className="relative w-32 h-32">
                {/* The 3-color sphere */}
                <div className="w-full h-full rounded-full flex flex-col overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  {/* Top: Green */}
                  <div className="flex-1 bg-emerald-green relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 blur-xl" />
                  </div>
                  
                  {/* Middle: White (Fixed Mouth) */}
                  <div className="h-10 bg-white flex items-center justify-center relative overflow-hidden">
                    <div className="bg-black/10 rounded-full h-1/2 w-1/2" />
                    <div className="absolute inset-0 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] mix-blend-overlay" />
                  </div>

                  {/* Bottom: Apple Red */}
                  <div className="flex-1 bg-[#ff0800] relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 blur-xl" />
                  </div>
                </div>
                
                {/* Glow effects */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 bg-emerald-green/40 h-4 blur-xl rounded-full" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 bg-apple-red/40 h-4 blur-xl rounded-full" />
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight text-center">
                Supreme Omni-Assistant
              </h2>
            </div>

            {/* Chat Area */}
            <div className="flex-grow p-6 overflow-y-auto max-h-[40vh] space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {response && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 p-4 rounded-2xl text-neutral-300 leading-relaxed italic"
                  >
                    <p className="text-sm font-medium text-emerald-green mb-2 flex items-center gap-2">
                      <button 
                        onClick={() => speak(response)}
                        className="p-1 hover:bg-emerald-green/10 rounded-full transition-colors flex items-center gap-2"
                        title="Read message"
                      >
                        <Volume2 size={14} className={isSpeaking ? 'text-white' : ''} />
                        <span>Omni-Assistant</span>
                      </button>
                    </p>
                    {response}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {loading && (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-emerald-green" size={24} />
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(s)}
                      className="text-[10px] uppercase tracking-widest bg-emerald-green/10 text-emerald-green px-3 py-1.5 rounded-full border border-emerald-green/20 hover:bg-emerald-green/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black/40 border-t border-white/5">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-4 rounded-xl transition ${isListening ? 'bg-apple-red text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                >
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  placeholder="How can I assist you with today, dear?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-grow bg-neutral-800 p-4 rounded-xl text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-emerald-green transition"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="p-4 bg-emerald-green text-white rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
              <p className="text-[9px] text-neutral-600 mt-3 text-center uppercase tracking-widest font-bold">
                Voice Commands & Text-to-Speech Active
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
