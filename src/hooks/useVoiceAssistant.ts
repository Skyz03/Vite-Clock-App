import { useState, useCallback, useEffect } from 'react';

export function useVoiceAssistant() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
      
      // Load voices - some browsers need this
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }
      
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!supported) {
      console.warn('Speech synthesis not supported');
      if (onEnd) onEnd();
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Wait a bit for cancellation to complete
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Get voices (may need to be called again)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                            voices.find(v => v.lang.startsWith('en')) || 
                            voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Adjust rate/pitch for a "Chief" persona
      utterance.pitch = 1; // Slightly deeper
      utterance.rate = 1.5;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    }, 100);
  }, [supported]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking, supported: supported && voicesLoaded };
}