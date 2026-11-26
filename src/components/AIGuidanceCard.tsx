import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  RefreshCw,
  Info,
  CornerDownRight,
} from 'lucide-react';
import {
  queryVerifiedKnowledge,
  SUGGESTED_QUESTIONS,
  VERIFIED_KNOWLEDGE_ARTICLES,
} from '../data/verifiedKnowledgeBase';
import { PassengerProfile, JourneyDetails, AIChatMessage } from '../types';

interface AIGuidanceCardProps {
  profile?: PassengerProfile | null;
  journey?: JourneyDetails | null;
  onShowToast: (msg: string) => void;
}

export const AIGuidanceCard: React.FC<AIGuidanceCardProps> = ({
  profile,
  journey,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${profile?.fullName ? profile.fullName.split(' ')[0] : 'traveller'}! I am Pearl Travel's AI Guidance Assistant. I provide answers strictly grounded in our Administrator-Verified Knowledge Base (DCIC Immigration & URA Customs). How can I guide your journey via ${
        journey?.intendedBorderPoint || 'Malaba One-Stop Border Post (OSBP)'
      }?`,
      timestamp: 'Just now',
      groundedSource: 'DCIC Border Regulations & Verified Knowledge Base',
      verifiedBadge: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle Question Submission
  const handleAsk = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Simulate grounded RAG retrieval
    setTimeout(() => {
      const result = queryVerifiedKnowledge(trimmed, profile, journey);

      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundedSource: result.citations.join(' • '),
        verifiedBadge: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      // Auto-read snippet if user enabled speech
      if (isSpeaking && 'speechSynthesis' in window) {
        speakText(result.answer);
      }
    }, 450);
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      onShowToast('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    onShowToast('Reading answer aloud...');
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice Recognition (Speech to Text)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast('Voice recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        onShowToast('Listening... Speak your border travel question.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          setInputText(transcript);
          handleAsk(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        onShowToast('Could not capture audio. Please type your query.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      onShowToast('Microphone access unavailable. Please type your query.');
    }
  };

  return (
    <div className="bg-pearl-dark rounded-2xl p-5 sm:p-6 border border-pearl-border flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-pearl-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pearl-navy text-pearl-gold flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-pearl-text uppercase tracking-wide font-heading">
                Ask Pearl Travel (AI Guidance)
              </h3>
              <span className="text-[10px] font-bold uppercase text-pearl-success-light flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified RAG
              </span>
            </div>
            <p className="text-[11px] text-pearl-text-secondary font-medium">
              Grounded in official DCIC immigration, Port Health & URA customs knowledge base
            </p>
          </div>
        </div>

        {/* Audio / Voice Controls */}
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <button
              type="button"
              onClick={stopSpeaking}
              className="px-3 py-1.5 rounded-lg bg-pearl-danger/15 text-pearl-danger-light text-xs font-bold flex items-center gap-1.5 hover:bg-pearl-danger/25 transition-colors cursor-pointer"
              title="Stop voice readout"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute Voice</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const lastMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
                if (lastMsg) speakText(lastMsg.text);
              }}
              className="px-3 py-1.5 rounded-lg bg-pearl-surface border border-pearl-border text-pearl-text text-xs font-bold flex items-center gap-1.5 hover:bg-pearl-input transition-colors cursor-pointer"
              title="Listen to last assistant answer"
            >
              <Volume2 className="w-3.5 h-3.5 text-pearl-text-secondary" />
              <span>Voice Response</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              handleAsk(
                `What documents do I need for ${profile?.travelPurpose || journey?.travelPurpose || 'my'} travel to Uganda?`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-pearl-gold hover:bg-pearl-gold-light text-pearl-navy text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Show Documents</span>
          </button>

          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center border ${
              isListening
                ? 'bg-pearl-danger border-pearl-danger text-pearl-text'
                : 'bg-pearl-surface border-pearl-border text-pearl-text hover:bg-pearl-input'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Ask using your voice microphone'}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Suggested Questions */}
      <div>
        <span className="text-[10px] font-bold uppercase text-pearl-placeholder block mb-1.5 tracking-wider">
          Suggested Official Q&A
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => handleAsk(q)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-pearl-surface text-pearl-text hover:bg-pearl-input whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-pearl-border"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto space-y-3.5 p-3 rounded-xl bg-pearl-surface border border-pearl-border text-xs">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-3.5 leading-relaxed ${
                  isAssistant
                    ? 'bg-pearl-input text-pearl-text border border-pearl-border'
                    : 'bg-pearl-navy text-pearl-text'
                }`}
              >
                {isAssistant && (
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-pearl-placeholder">
                    <span className="w-2 h-2 rounded-full bg-pearl-success-light" />
                    <span className="text-pearl-text font-bold uppercase">Pearl Travel Verified AI</span>
                    <span>•</span>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>

                {isAssistant && msg.groundedSource && (
                  <div className="mt-2.5 pt-2 border-t border-pearl-border/70 text-[10px] text-pearl-text-secondary flex items-start gap-1.5 font-medium">
                    <BookOpen className="w-3 h-3 text-pearl-gold-light shrink-0 mt-0.5" />
                    <span>Source: {msg.groundedSource}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-pearl-text-secondary italic p-2">
            <div className="w-3 h-3 rounded-full border-2 border-pearl-border border-t-transparent animate-spin" />
            <span>Retrieving grounded answer from verified knowledge base...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputText);
        }}
        className="pt-2 border-t border-pearl-border flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            id="input-ai-guidance-query"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about Malaba OSBP, Yellow Fever, customs, or visas..."
            className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-pearl-input border border-pearl-border text-xs font-semibold text-pearl-text focus:outline-none focus:ring-2 focus:ring-pearl-gold transition"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          id="btn-ai-guidance-send"
          className="px-4 py-2.5 rounded-xl bg-pearl-gold hover:bg-pearl-gold-light text-pearl-text text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Governance Footer */}
      <div className="text-[10px] text-pearl-placeholder text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3 text-pearl-success-light" />
        <span>Content managed and approved by Uganda Immigration Administration.</span>
      </div>
    </div>
  );
};
