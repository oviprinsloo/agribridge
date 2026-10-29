import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Send, Loader2, Info } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { language } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Map language
      recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone access was denied. Please allow microphone permissions or type below.');
        } else {
          setRecognitionError('Speech could not be recognized. You can type your question directly.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [language]);

  const toggleListening = () => {
    if (!speechSupported) {
      setRecognitionError('Voice input is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setQuery('');
        setResponse(null);
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const queryToSend = overrideText || query;
    if (!queryToSend.trim()) return;

    setIsLoading(true);
    try {
      const res: any = await api.post('/ai/assistant', {
        query: queryToSend,
        language,
      });

      if (res.success && res.data) {
        setResponse(res.data);
        if (res.data.audioText) {
          handleSpeak(res.data.audioText);
        }
      }
    } catch (error: any) {
      setResponse({
        answer: `[DATABASE FACT]\nPlatform services active.\n\n[AI EXPLANATION]\n${error.message || 'Unable to fetch assistant response at this moment.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">AgriBridge Assistant</h3>
              <p className="text-emerald-200 text-xs font-medium">
                Voice-First AI • Grounded Market & Scheme Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const sample = language === 'ta' ? 'இன்றைய தக்காளி விலை என்ன?' : language === 'hi' ? 'टमाटर का आज का भाव क्या है?' : 'What is today\'s tomato market price?';
                setQuery(sample);
                handleSubmit(undefined, sample);
              }}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-3 py-1 font-medium transition"
            >
              🍅 {language === 'ta' ? 'தக்காளி விலை' : language === 'hi' ? 'टमाटर भाव' : 'Tomato Prices'}
            </button>
            <button
              onClick={() => {
                const sample = language === 'ta' ? 'எனக்கு என்ன அரசு திட்டங்கள் கிடைக்கும்?' : language === 'hi' ? 'मेरे लिए कौन सी सरकारी योजनाएं हैं?' : 'Which government schemes am I eligible for?';
                setQuery(sample);
                handleSubmit(undefined, sample);
              }}
              className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full px-3 py-1 font-medium transition"
            >
              🏛️ {language === 'ta' ? 'அரசு திட்டங்கள்' : language === 'hi' ? 'सरकारी योजनाएं' : 'Govt Schemes'}
            </button>
            <button
              onClick={() => {
                const sample = language === 'ta' ? 'சப்ளை பூலிங் எப்படி வேலை செய்கிறது?' : language === 'hi' ? 'सप्लाई पूलिंग कैसे काम करती है?' : 'How does supply pooling work for small farmers?';
                setQuery(sample);
                handleSubmit(undefined, sample);
              }}
              className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-full px-3 py-1 font-medium transition"
            >
              🚚 {language === 'ta' ? 'பூலிங் விளக்கம்' : language === 'hi' ? 'पूलिंग प्रक्रिया' : 'How Pooling Works'}
            </button>
          </div>

          {/* Voice Input Indicator */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="relative mb-3">
              {isListening && (
                <div className="absolute -inset-3 bg-red-500/20 rounded-full animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105 ${isListening
                  ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                title={isListening ? 'Click to stop listening' : 'Click to speak'}
              >
                {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {isListening
                ? language === 'ta'
                  ? 'கேட்கிறது... பேசுங்கள்...'
                  : language === 'hi'
                    ? 'सुन रहा हूँ... बोलिए...'
                    : 'Listening... Speak your query...'
                : language === 'ta'
                  ? 'பேச மைக் பட்டனை அழுத்தவும்'
                  : language === 'hi'
                    ? 'बोलने के लिए माइक दबाएं'
                    : 'Click mic to speak in English, Tamil, or Hindi'}
            </p>
            {recognitionError && (
              <p className="text-xs text-amber-600 font-medium mt-2 flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5" />
                {recognitionError}
              </p>
            )}
          </div>

          {/* Assistant Answer Box */}
          {response && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Answer
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak(response.audioText || response.answer)}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded bg-white/80 border border-emerald-200 shadow-sm"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isSpeaking ? 'Stop Audio' : 'Listen'}
                </button>
              </div>

              <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {response.answer}
              </div>

              {response.suggestedActions && response.suggestedActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  {response.suggestedActions.map((action: any, idx: number) => (
                    <a
                      key={idx}
                      href={action.url}
                      onClick={() => onClose()}
                      className="text-xs bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50 transition"
                    >
                      → {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்...'
                : language === 'hi'
                  ? 'अपना प्रश्न यहां टाइप करें...'
                  : 'Type your agriculture or price question here...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};
