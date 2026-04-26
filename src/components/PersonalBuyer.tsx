import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Send, Bell, History, Trash2, CheckCircle, Loader2, MapPin, DollarSign, Tag, Sparkles, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { parseDesire, saveDesire, getUserDesires, getDesireAlerts, markAlertAsRead, simulateMatch, ShoppingDesire, PersonalBuyerAlert } from '../services/personalBuyerService';

import { speak as omniSpeak, stopSpeaking as omniStop } from '../lib/speech';

export const PersonalBuyer = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user', text: string, data?: any }[]>([
    { role: 'assistant', text: "Hello! I am My Personal Buyer, your intelligent personal shopping assistant. What is your desire today? Tell me what you want to buy, how much you want to spend, and in which area, and I'll take care of finding it and notifying you when it appears." }
  ]);
  const [desires, setDesires] = useState<ShoppingDesire[]>([]);
  const [alerts, setAlerts] = useState<PersonalBuyerAlert[]>([]);
  const [activeDesire, setActiveDesire] = useState<any>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const userId = "demo-user"; // In a real app, this would come from Auth

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default to English, can be dynamic
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const speak = (text: string, index: number) => {
    if (speakingIndex === index) {
      omniStop();
      setSpeakingIndex(null);
      return;
    }

    omniSpeak(text, {
      onEnd: () => setSpeakingIndex(null),
    });
    setSpeakingIndex(index);
  };

  useEffect(() => {
    // Warm up the voices (Web Speech API fix)
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    
    const fetchDesires = async () => {
      const data = await getUserDesires(userId);
      setDesires(data);
    };
    fetchDesires();

    const unsubscribe = getDesireAlerts(userId, (newAlerts) => {
      setAlerts(newAlerts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const parsed = await parseDesire(userMsg, userId);
      setActiveDesire({ ...parsed, rawInput: userMsg });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: parsed.confirmationMessage,
        data: parsed.unsupportedStore ? null : parsed
      }]);
    } catch (error) {
      console.error("PersonalBuyer Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I had a problem analyzing your desire. Could you repeat it? (Make sure GEMINI_API_KEY is set)" }]);
    } finally {
      setLoading(false);
    }
  };

  const activateAlert = async () => {
    if (!activeDesire) return;
    setLoading(true);
    try {
      const saved = await saveDesire({ ...activeDesire, whatsapp, email }, userId, activeDesire.rawInput);
      setDesires(prev => [saved, ...prev]);
      setMessages(prev => [...prev, { role: 'assistant', text: "Alert activated! I'll be watching 24/7 and will notify you via WhatsApp/Email as soon as it appears." }]);
      setActiveDesire(null);
      setWhatsapp('');
      setEmail('');

      // Simulate a match after 5 seconds for demo
      setTimeout(() => {
        simulateMatch(saved);
      }, 5000);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error al guardar la alerta. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
      {/* Chat Section */}
      <div className="lg:col-span-2 flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl h-[600px]">
        <div className="bg-emerald-green p-4 flex items-center gap-3 text-white">
          <ShoppingBag className="animate-bounce" />
          <div>
            <h3 className="font-bold">My Personal Buyer</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">Your 24/7 Assistant</p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-emerald-green text-white rounded-tr-none' 
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm flex-grow">{msg.text}</p>
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => speak(msg.text, i)}
                      className={`shrink-0 p-1 rounded-full transition-colors ${
                        speakingIndex === i 
                          ? 'bg-emerald-green/20 text-emerald-green animate-pulse' 
                          : 'text-neutral-400 hover:text-emerald-green hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      title={speakingIndex === i ? "Stop" : "Listen"}
                    >
                      {speakingIndex === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
                {msg.data && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20 text-xs space-y-1">
                    <div className="flex items-center gap-2"><Tag size={12} /> <strong>Category:</strong> {msg.data.category}</div>
                    <div className="flex items-center gap-2"><DollarSign size={12} /> <strong>Budget:</strong> ${msg.data.maxBudget}</div>
                    <div className="flex items-center gap-2"><MapPin size={12} /> <strong>Location:</strong> {msg.data.location}</div>
                    
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
                      <p className="text-[10px] opacity-70">Optional: Get real-time alerts</p>
                      <input 
                        type="text" 
                        placeholder="WhatsApp (e.g. +521...)" 
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded px-2 py-1 text-[10px] outline-none focus:border-white/40"
                      />
                      <input 
                        type="email" 
                        placeholder="Email address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded px-2 py-1 text-[10px] outline-none focus:border-white/40"
                      />
                    </div>

                    <button 
                      onClick={activateAlert}
                      disabled={loading}
                      className="w-full mt-2 bg-white text-emerald-green font-bold py-2 rounded hover:bg-neutral-100 transition flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin size-4" /> : <Bell size={14} />}
                      Activate Personal Alert
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-emerald-green'
              }`}
              title={isListening ? "Listening..." : "Voice Search"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Type your shopping desire..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-grow bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none focus:border-emerald-green transition text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-emerald-green text-white p-4 rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="space-y-6">
        {/* Alerts Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-lg">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-apple-red">
            <Bell size={18} /> Recent Alerts
          </h4>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">No alerts yet. Activate a desire to start.</p>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-xl border ${alert.read ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'} relative group`}
                >
                  {!alert.read && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
                  <h5 className="text-xs font-bold text-neutral-900 dark:text-white">{alert.productName}</h5>
                  <p className="text-[10px] text-emerald-green font-bold">${alert.price} at {alert.storeName}</p>
                  <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{alert.matchReason}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <a 
                      href={alert.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => markAlertAsRead(alert.id!)}
                      className="text-[10px] bg-emerald-green text-white px-2 py-1 rounded hover:bg-emerald-600 transition"
                    >
                      See now →
                    </a>
                    {desires.find(d => d.id === alert.desireId)?.whatsapp && (
                      <a 
                        href={`https://wa.me/${desires.find(d => d.id === alert.desireId)?.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`🛍️ My Personal Buyer Alert!\n\nI found a match for your desire: "${desires.find(d => d.id === alert.desireId)?.rawInput}"\n\nProduct: ${alert.productName}\nPrice: $${alert.price}\nStore: ${alert.storeName}\n\nCheck it out here: ${alert.link}`)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-[#25D366] text-white px-2 py-1 rounded hover:bg-[#128C7E] transition flex items-center gap-1"
                      >
                        Send to WhatsApp
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Saved Desires Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-lg">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-emerald-green">
            <History size={18} /> Active Desires
          </h4>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {desires.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">You have no saved desires.</p>
            ) : (
              desires.map((desire) => (
                <div key={desire.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-emerald-green/10 text-emerald-green px-2 py-0.5 rounded-full font-bold uppercase">{desire.category}</span>
                    <span className="text-[10px] text-neutral-400">{new Date(desire.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs mt-2 text-neutral-700 dark:text-neutral-300 font-medium line-clamp-2">"{desire.rawInput}"</p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500 flex items-center gap-1"><MapPin size={10} /> {desire.location}</span>
                    <span className="text-emerald-green font-bold flex items-center gap-1"><CheckCircle size={10} /> Monitoring</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
