/**
 * Versusfy Supreme Speech Utility
 * Standardizes the voice of all AI Agents to match the Supreme Omni-Assistant.
 */

interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export const speak = (text: string, options: SpeakOptions = {}) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Supreme Omni-Assistant Standard Configuration
  // Tone: Soft, calm, 25yo female (American)
  utterance.pitch = options.pitch ?? 1.05; 
  utterance.rate = options.rate ?? 0.85;  
  utterance.volume = options.volume ?? 1;

  const voices = window.speechSynthesis.getVoices();
  
  // Prioritize known young American female voices
  const femaleVoice = voices.find(v => 
    (v.name.includes('Samantha') || 
     v.name.includes('Victoria') || 
     v.name.includes('Zira') || 
     v.name.includes('Susan') || 
     v.name.includes('Female') || 
     v.name.includes('Google US English')) && 
    (v.lang === 'en-US' || v.lang.startsWith('en-'))
  ) || voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en-')) && !v.name.toLowerCase().includes('male')) || voices[0];

  if (femaleVoice) {
    utterance.voice = femaleVoice;
    // Standardize language to ensure consistent accent
    utterance.lang = femaleVoice.lang;
  }

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const getVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.getVoices();
  }
  return [];
};
