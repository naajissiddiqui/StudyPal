import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User as UserIcon, Loader2, Lightbulb, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AskStudyPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
}

const QUICK_PROMPTS = [
  '🎯 What should I prioritize on my study schedule today?',
  '⚡ Give me an active recall strategy for my hardest subject',
  '🧘 I am feeling overwhelmed with exams, help me reset',
  '🧠 How can I use the Feynman technique to study faster?'
];

export const AskStudyPalModal: React.FC<AskStudyPalModalProps> = ({ isOpen, onClose, planId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi! I'm your **StudyPal AI Coach**, powered by Google Gemini.\n\nI have full context on your subjects, upcoming exams, and today's schedule. Ask me anything about exam strategies, memory retention, or how to tackle difficult topics!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.askAssistant({
        query: textToSend.trim(),
        planId
      });

      const assistantMessage: Message = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: res.data?.answer || "I've analyzed your schedule! Keep focusing on your high-priority concept tasks today.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Error**: ${err.message || 'Unable to connect to StudyPal AI. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: "✨ Chat reset! What would you like guidance on today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '24px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #5448F8 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
              }}
            >
              <Bot size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Ask StudyPal AI</h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} color="#A7F3D0" /> Gemini
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, marginTop: '2px' }}>
                Context-aware personal academic tutor & study coach
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleResetChat}
              title="Reset Chat"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#E2E8F0',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#E2E8F0',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div
          style={{
            padding: '10px 16px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <Lightbulb size={12} color="#5448F8" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: msg.sender === 'user' ? '#5448F8' : '#ECEBFE',
                  color: msg.sender === 'user' ? '#FFFFFF' : '#5448F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={18} />}
              </div>

              <div
                style={{
                  maxWidth: '82%',
                  background: msg.sender === 'user' ? '#5448F8' : '#F8FAFC',
                  color: msg.sender === 'user' ? '#FFFFFF' : '#1E293B',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(84, 72, 248, 0.25)' : 'none',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#94A3B8',
                    marginTop: '6px',
                    textAlign: 'right'
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ECEBFE',
                  color: '#5448F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bot size={18} />
              </div>
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#5448F8',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                <span>StudyPal AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your study plan, exam strategies, or topics..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '14.5px',
                outline: 'none',
                background: '#F8FAFC'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: 'linear-gradient(135deg, #5448F8 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || loading ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(84, 72, 248, 0.3)'
              }}
            >
              <span>Send</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
