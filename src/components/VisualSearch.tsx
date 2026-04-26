import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Search, Image as ImageIcon, Video, Share2, Send, Mic, Sparkles, Footprints, Shirt, Wand2, Home, PartyPopper, Lightbulb, Palette, Sprout, Shovel, Droplets, Wrench, HardHat, Briefcase, Volume2, Users, Zap, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { identifyProduct, analyzePersonalStyle, analyzeSpaceContext, analyzeGardeningContext, analyzeMechanicContext, analyzeBuilderContext, analyzeOfficeContext } from '../services/geminiService';

import { speak as omniSpeak } from '../lib/speech';

interface VisualSearchProps {
  onIdentified: (productName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const VisualSearch: React.FC<VisualSearchProps> = ({ onIdentified, isOpen, onClose }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'upload' | 'video' | 'sharing' | 'style-report' | 'space-report' | 'gardening-report' | 'mechanic-report' | 'builder-report' | 'office-report'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [identifiedName, setIdentifiedName] = useState<string | null>(null);
  const [styleReport, setStyleReport] = useState<any>(null);
  const [spaceReport, setSpaceReport] = useState<any>(null);
  const [gardeningReport, setGardeningReport] = useState<any>(null);
  const [mechanicReport, setMechanicReport] = useState<any>(null);
  const [builderReport, setBuilderReport] = useState<any>(null);
  const [officeReport, setOfficeReport] = useState<any>(null);
  const [isStyleMode, setIsStyleMode] = useState(false);
  const [isSpaceMode, setIsSpaceMode] = useState(false);
  const [isGardeningMode, setIsGardeningMode] = useState(false);
  const [isMechanicMode, setIsMechanicMode] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [isOfficeMode, setIsOfficeMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    omniSpeak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const startCamera = async (isForVideo = false, isStyle = false, isSpace = false, isGardening = false, isMechanic = false, isBuilder = false, isOffice = false) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: (isStyle || isGardening) ? 'user' : 'environment' },
        audio: isForVideo 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStyleMode(isStyle);
      setIsSpaceMode(isSpace);
      setIsGardeningMode(isGardening);
      setIsMechanicMode(isMechanic);
      setIsBuilderMode(isBuilder);
      setIsOfficeMode(isOffice);
      setMode(isForVideo ? 'video' : 'camera');
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    recorder.onstop = () => {
      // After recording, we'll simulate the "Forward" flow
      setMode('sharing');
    };
    recorder.start();
    setIsRecording(true);
    setTimeout(() => stopRecording(), 5000); // Max 5 seconds for tactical clips
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    if (isStyleMode) {
      processStyle(base64, 'image/jpeg');
    } else if (isSpaceMode) {
      processSpace(base64, 'image/jpeg');
    } else if (isGardeningMode) {
      processGardening(base64, 'image/jpeg');
    } else if (isMechanicMode) {
      processMechanic(base64, 'image/jpeg');
    } else if (isBuilderMode) {
      processBuilder(base64, 'image/jpeg');
    } else if (isOfficeMode) {
      processOffice(base64, 'image/jpeg');
    } else {
      processImage(base64, 'image/jpeg');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (isStyleMode) {
        processStyle(base64, file.type);
      } else if (isSpaceMode) {
        processSpace(base64, file.type);
      } else if (isGardeningMode) {
        processGardening(base64, file.type);
      } else if (isMechanicMode) {
        processMechanic(base64, file.type);
      } else if (isBuilderMode) {
        processBuilder(base64, file.type);
      } else if (isOfficeMode) {
        processOffice(base64, file.type);
      } else {
        processImage(base64, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const processGardening = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzeGardeningContext(base64, mimeType);
      if (report) {
        setGardeningReport(report);
        setMode('gardening-report');
      } else {
        setError("Gardening analysis failed. Try a wider shot of your terrain.");
      }
    } catch (err) {
      setError("Gardening Scout analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processMechanic = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzeMechanicContext(base64, mimeType);
      if (report) {
        setMechanicReport(report);
        setMode('mechanic-report');
      } else {
        setError("Mechanical analysis failed. Try a clearer shot of the vehicle/part.");
      }
    } catch (err) {
      setError("Mechanical Scout analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processBuilder = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzeBuilderContext(base64, mimeType);
      if (report) {
        setBuilderReport(report);
        setMode('builder-report');
      } else {
        setError("Construction analysis failed. Try a wider shot of the element/site.");
      }
    } catch (err) {
      setError("Master Builder analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processOffice = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzeOfficeContext(base64, mimeType);
      if (report) {
        setOfficeReport(report);
        setMode('office-report');
      } else {
        setError("Office analysis failed. Try a wider shot of your workspace.");
      }
    } catch (err) {
      setError("Productivity Architect analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processSpace = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzeSpaceContext(base64, mimeType);
      if (report) {
        setSpaceReport(report);
        setMode('space-report');
      } else {
        setError("Space analysis failed. Try a wider shot.");
      }
    } catch (err) {
      setError("Space Architect analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processStyle = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const report = await analyzePersonalStyle(base64, mimeType);
      if (report) {
        setStyleReport(report);
        setMode('style-report');
      } else {
        setError("Style analysis failed. Try a clearer selfie.");
      }
    } catch (err) {
      setError("Personal stylist analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const productName = await identifyProduct(base64, mimeType);
      if (productName) {
        setIdentifiedName(productName);
        setMode('sharing');
      } else {
        setError("Could not identify product. Try a clearer shot.");
      }
    } catch (err) {
      setError("Identification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const shareViaWhatsApp = () => {
    const text = identifiedName 
      ? `Hey Squad! I just found this on Versusfy: ${identifiedName}. Check if I should buy it here: ${window.location.href}`
      : `Check out this tactical product find on Versusfy: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaGmail = () => {
    const subject = `Versusfy Tactical Intel: ${identifiedName || 'Product Find'}`;
    const body = `I used Versusfy to analyze this product: ${identifiedName || 'Check it out'}.\n\nView tactical comparison: ${window.location.href}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const executeAndClose = () => {
    if (identifiedName) onIdentified(identifiedName);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    stopRecording();
    setMode('idle');
    setIdentifiedName(null);
    setStyleReport(null);
    setSpaceReport(null);
    setIsStyleMode(false);
    setIsSpaceMode(false);
    setIsGardeningMode(false);
    setIsMechanicMode(false);
    setIsBuilderMode(false);
    setIsOfficeMode(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
      >
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
          <div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <Camera className="text-emerald-green" /> Supreme Visual Search
            </h3>
            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Identify products with AI Vision</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {mode === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-emerald-green/5 p-4 rounded-xl border border-emerald-green/10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-green mb-2">Tactical Intelligence Guide</h4>
                  <ul className="space-y-2 text-[10px] text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider">
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> PHOTO SCAN: Point at one product to identify it and find the lowest global price.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> VIDEO SCOUT: Record a shelf for 5s to save context or share with your WhatsApp squad.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> DAILY SAVINGS: Use this in supermarkets to instantly check if online deals beat local prices.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> STYLE ADVISOR: Take a selfie to get instant clothing, makeup, jewelry, and footwear suggestions.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> SPACE SCOUT: Scan a room or empty salon for furniture, paint, or event decor ideas.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> GARDENING SCOUT: Take a photo of your terrain for plant, soil, and irrigation suggestions.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> MECHANICAL SCOUT: Analyze car engines or bodywork damage for parts and tools.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> BUILDER SCOUT: Identify construction phases and materials needed for your project.
                    </li>
                    <li className="flex items-start gap-2">
                       <span className="text-emerald-green">▶</span> OFFICE SCOUT: Optimize your workspace for ergonomics and productivity.
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                  onClick={() => startCamera(false)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-green/5 border-2 border-dashed border-emerald-green/20 hover:border-emerald-green transition-all group"
                >
                  <Camera size={40} className="text-emerald-green group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Photo Scan</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Single Item ID</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-pink-500/5 border-2 border-dashed border-pink-500/20 hover:border-pink-500 transition-all group"
                >
                  <Sparkles size={40} className="text-pink-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Style Advisor</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Personal Stylist</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-blue-500/5 border-2 border-dashed border-blue-500/20 hover:border-blue-500 transition-all group"
                >
                  <Home size={40} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Space Scout</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Home/Event Decor</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, false, false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-green/5 border-2 border-dashed border-emerald-green/20 hover:border-emerald-green transition-all group"
                >
                  <Sprout size={40} className="text-emerald-green group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Gardening Scout</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Terrain Analysis</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, false, false, false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-neutral-900 text-white border-2 border-dashed border-neutral-700 hover:border-emerald-green transition-all group"
                >
                  <Wrench size={40} className="text-emerald-green group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black uppercase tracking-tighter">Mech Scout</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold">Auto & Bodywork</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, false, false, false, false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-orange-500/5 border-2 border-dashed border-orange-500/20 hover:border-orange-500 transition-all group"
                >
                  <HardHat size={40} className="text-orange-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter text-sm">Builder Scout</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Construction Intel</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(false, false, false, false, false, false, true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 hover:border-indigo-500 transition-all group"
                >
                  <Briefcase size={40} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Office Scout</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Workspace Architect</span>
                  </div>
                </button>

                <button 
                  onClick={() => startCamera(true)}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-orange-500/5 border-2 border-dashed border-orange-500/20 hover:border-orange-500 transition-all group"
                >
                  <Video size={40} className="text-orange-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Video Scout</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Field Intel</span>
                  </div>
                </button>
                
                <div className="md:col-span-2 relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase font-black text-neutral-400"><span className="bg-white dark:bg-neutral-900 px-2 tracking-widest">OR</span></div>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="md:col-span-2 flex flex-col items-center gap-4 p-8 rounded-2xl bg-blue-500/5 border-2 border-dashed border-blue-500/20 hover:border-blue-500 transition-all group"
                >
                  <Upload size={48} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Upload Intelligence</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Process stored images</span>
                  </div>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                </div>
              </motion.div>
            )}

            {(mode === 'camera' || mode === 'video') && (
              <motion.div 
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-inner"
              >
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-x-0 top-6 flex justify-center pointer-events-none">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                       {mode === 'camera' ? 'Tactical Lens Active' : 'Field Video Recording'}
                       {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/20 rounded-3xl">
                    <div className="absolute inset-0 border border-white/10 m-4 rounded-2xl"></div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                   {mode === 'camera' ? (
                     <button 
                      onClick={captureImage}
                      disabled={isProcessing}
                      className="w-16 h-16 bg-white rounded-full border-4 border-emerald-green flex items-center justify-center shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="animate-spin text-emerald-green" /> : <Search className="text-emerald-green" />}
                    </button>
                   ) : (
                     <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-2xl active:scale-95 transition-all ${isRecording ? 'bg-red-500 border-white' : 'bg-white border-orange-500'}`}
                    >
                      {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <div className="w-6 h-6 bg-red-500 rounded-full" />}
                    </button>
                   )}
                </div>
              </motion.div>
            )}

            {mode === 'sharing' && (
              <motion.div 
                key="sharing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-20 h-20 bg-emerald-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="text-emerald-green" size={32} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Squad Forwarding Ready</h4>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-1">Intelligence Captured for {identifiedName || 'Field Product'}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={shareViaWhatsApp}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-xl font-black uppercase tracking-tighter hover:bg-[#128C7E] transition shadow-lg shadow-[#25D366]/20"
                  >
                    <Send size={20} /> Forward to WhatsApp Squad
                  </button>
                  <button 
                    onClick={shareViaGmail}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-neutral-900 text-white rounded-xl font-black uppercase tracking-tighter hover:bg-black transition shadow-lg"
                  >
                    <ImageIcon size={20} /> Transmit via Gmail Intel
                  </button>
                  <button 
                    onClick={executeAndClose}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                  >
                    <Search size={20} /> Execute Comparison Now
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                  Intelligence remains encrypted and private
                </p>
              </motion.div>
            )}

            {mode === 'style-report' && styleReport && (
              <motion.div 
                key="style-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-pink-500/10 rounded-2xl mb-2">
                    <Wand2 className="text-pink-500" size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Personal Style Intelligence</h4>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-pink-600 dark:text-pink-400 uppercase text-xs mb-2">
                      <Sparkles size={14} /> Makeup Suggestion
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{styleReport.makeup.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {styleReport.makeup.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-pink-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 uppercase text-xs mb-2">
                      <Shirt size={14} /> Clothing (Vestuario)
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{styleReport.clothing.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {styleReport.clothing.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Footprints size={14} /> Footwear (Calzado)
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{styleReport.footwear.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {styleReport.footwear.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {styleReport.jewelry && (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                      <h5 className="flex items-center gap-2 font-black text-yellow-600 dark:text-yellow-400 uppercase text-xs mb-2">
                        <Gem size={14} /> Jewelry (Joyería)
                      </h5>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{styleReport.jewelry.suggestion}</p>
                      <div className="flex flex-wrap gap-2">
                        {styleReport.jewelry.products.map((p: string, i: number) => (
                          <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-yellow-500 transition font-bold uppercase tracking-tighter">
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-emerald-green">Supreme Verdict</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{styleReport.verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-emerald-500/20"
                  >
                    Close & Track
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'space-report' && spaceReport && (
              <motion.div 
                key="space-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-blue-500/10 rounded-2xl mb-2">
                    {spaceReport.type === 'home' ? <Home className="text-blue-500" size={32} /> : <PartyPopper className="text-blue-500" size={32} />}
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    {spaceReport.type === 'home' ? 'Interior Architect Plan' : 'Event Design Intel'}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-emerald-green/5 border border-emerald-green/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-emerald-green uppercase text-xs mb-2">
                      <Palette size={14} /> Paint & Flooring
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{spaceReport.paint_and_flooring.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {spaceReport.paint_and_flooring.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-emerald-green transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 uppercase text-xs mb-2">
                      <Home size={14} /> {spaceReport.type === 'home' ? 'Furniture & Decor' : 'Event Arrangements'}
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{spaceReport.furniture_and_decor.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {spaceReport.furniture_and_decor.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Lightbulb size={14} /> Lighting & Ambience
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{spaceReport.lighting_and_ambience.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {spaceReport.lighting_and_ambience.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-emerald-green">Tactical Budget Verdict</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{spaceReport.budget_verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-emerald-500/20"
                  >
                    Set Intel & Search
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'gardening-report' && gardeningReport && (
              <motion.div 
                key="gardening-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-emerald-green/10 rounded-2xl mb-2">
                    <Sprout className="text-emerald-green" size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    Gardening Scout Report
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Palette size={14} /> Soil & Climate Advice
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{gardeningReport.soil_and_climate.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {gardeningReport.soil_and_climate.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-green/5 border border-emerald-green/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-emerald-green uppercase text-xs mb-2">
                      <Sprout size={14} /> Plant Recommendations
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{gardeningReport.plant_recommendations.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {gardeningReport.plant_recommendations.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-emerald-green transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 uppercase text-xs mb-2">
                      <Shovel size={14} /> Tools & Irrigation
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{gardeningReport.tools_and_irrigation.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {gardeningReport.tools_and_irrigation.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-emerald-green">Landscape Vision</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{gardeningReport.verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-emerald-500/20"
                  >
                    Transmit Intel
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'mechanic-report' && mechanicReport && (
              <motion.div 
                key="mechanic-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-emerald-green/10 rounded-2xl mb-2">
                    <Wrench className="text-emerald-green" size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    Mechanical Scout Report
                  </h4>
                  <button 
                    onClick={() => speak(mechanicReport.verdict)}
                    className={`mt-2 p-2 rounded-full transition ${isSpeaking ? 'bg-emerald-green text-white animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-emerald-green'}`}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-red-600 dark:text-red-400 uppercase text-xs mb-2">
                      <Search size={14} /> Diagnosis
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{mechanicReport.diagnosis.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {mechanicReport.diagnosis.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-red-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Droplets size={14} /> Maintenance
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{mechanicReport.maintenance.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {mechanicReport.maintenance.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 uppercase text-xs mb-2">
                      <Palette size={14} /> Bodywork Intel
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{mechanicReport.bodywork.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {mechanicReport.bodywork.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-emerald-green">Tactical Auto Verdict</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{mechanicReport.verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-emerald-green text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-emerald-500/20"
                  >
                    Save Intel
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'builder-report' && builderReport && (
              <motion.div 
                key="builder-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-orange-500/10 rounded-2xl mb-2">
                    <HardHat className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    Master Builder Report
                  </h4>
                  <button 
                    onClick={() => speak(builderReport.verdict)}
                    className={`mt-2 p-2 rounded-full transition ${isSpeaking ? 'bg-orange-500 text-white animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-orange-500'}`}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Home size={14} /> Structural Analysis
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{builderReport.structure.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {builderReport.structure.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-green/5 border border-emerald-green/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-emerald-green uppercase text-xs mb-2">
                      <Palette size={14} /> Materials Intel
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{builderReport.materials.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {builderReport.materials.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-emerald-green transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 uppercase text-xs mb-2">
                      <Shovel size={14} /> Power Tools & Safety
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{builderReport.power_tools.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {builderReport.power_tools.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-orange-400">Architect Verdict</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{builderReport.verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-orange-500 text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-orange-500/20"
                  >
                    Set Project Intel
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'office-report' && officeReport && (
              <motion.div 
                key="office-report"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="text-center">
                  <div className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-2">
                    <Briefcase className="text-indigo-500" size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    Productivity Architect Report
                  </h4>
                  <button 
                    onClick={() => speak(officeReport.verdict)}
                    className={`mt-2 p-2 rounded-full transition ${isSpeaking ? 'bg-indigo-500 text-white animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-500'}`}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-indigo-600 dark:text-indigo-400 uppercase text-xs mb-2">
                      <Users size={14} /> Ergonomics
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{officeReport.ergonomics.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {officeReport.ergonomics.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-indigo-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-green/5 border border-emerald-green/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-emerald-green uppercase text-xs mb-2">
                      <Zap size={14} /> Efficiency & Tech
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{officeReport.efficiency.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {officeReport.efficiency.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-emerald-green transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <h5 className="flex items-center gap-2 font-black text-orange-600 dark:text-orange-400 uppercase text-xs mb-2">
                      <Lightbulb size={14} /> Lighting Optima
                    </h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">{officeReport.lighting.suggestion}</p>
                    <div className="flex flex-wrap gap-2">
                      {officeReport.lighting.products.map((p: string, i: number) => (
                        <button key={i} onClick={() => { onIdentified(p); handleClose(); }} className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition font-bold uppercase tracking-tighter">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 rounded-2xl text-white">
                    <h5 className="font-black uppercase text-xs mb-2 text-indigo-400">Workspace Verdict</h5>
                    <p className="text-xs italic leading-relaxed opacity-80">{officeReport.verdict}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setMode('idle')}
                    className="flex-grow py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-black uppercase tracking-tighter transition"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-grow py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-tighter transition shadow-lg shadow-indigo-500/20"
                  >
                    Apply Optimizations
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isProcessing && mode === 'upload' && (
            <div className="flex flex-col items-center gap-4 p-12">
              <Loader2 size={48} className="text-emerald-green animate-spin" />
              <p className="font-black uppercase tracking-tighter text-neutral-900 dark:text-white">Analyzing Product Vision...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <ImageIcon size={16} /> {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/30 text-center">
           <p className="text-[9px] uppercase tracking-[0.2em] font-black text-neutral-400">
             Powered by Versusfy Visual Intelligence Engine
           </p>
        </div>
      </motion.div>
    </div>
  );
};
