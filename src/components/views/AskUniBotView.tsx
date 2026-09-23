/**
 * Ask UniBot View
 * Primary grounded question-answering interface with transparent evidence,
 * precision confidence states, plain-language simplification, and human handover.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { ConfidenceState, Source, AiResponse, ActionItem } from '../../types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { EvidenceCard } from '../common/EvidenceCard';
import { geminiService } from '../../services/geminiService';
import { defaultKnowledgeRepository } from '../../services/knowledgeRepository';

interface ChatMessage {
  id: string;
  sender: 'user' | 'unibot';
  text: string;
  timestamp: string;
  responseMeta?: AiResponse;
  showSimpleExplanation?: boolean;
  showSources?: boolean;
}

interface AskUniBotViewProps {
  initialQuery?: string;
  allSources: Source[];
  userName?: string;
  userId?: string;
  onOpenHandoverModal: (initialQuestion: string, sourcesChecked: string[], reason: string) => void;
  onViewSourceModal: (source: Source) => void;
  onNavigateToActions: () => void;
}

export const AskUniBotView: React.FC<AskUniBotViewProps> = ({
  initialQuery = '',
  allSources,
  userName = 'Participant',
  userId,
  onOpenHandoverModal,
  onViewSourceModal,
  onNavigateToActions,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'unibot',
      text: `Hello ${userName}. I am Ask UniBot, your trusted group memory for the METI UniPods AI Innovation Programme.\n\nI answer strictly from verified programme announcements, syllabus requirements, and meeting records. If information is unconfirmed or conflicting, I will flag it for human admin verification rather than speculate.`,
      timestamp: '09:00 WAT',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const history = await defaultKnowledgeRepository.getQuestionHistory(8);
      setRecentQuestions(history);
    } catch (e) {
      console.warn('Failed to load question history:', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial query passed from dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (queryToSend?: string) => {
    const query = (queryToSend || input).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Gemini Service (server-side proxy with strict local fallback)
      const aiResponse = await geminiService.askUniBot(query, allSources, undefined, userId, userName);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'unibot',
        text: aiResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT',
        responseMeta: aiResponse,
        showSources: true,
        showSimpleExplanation: false,
      };

      setMessages((prev) => [...prev, botMsg]);
      // Refresh question history in the background
      loadHistory();
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'unibot',
        text: 'An error occurred while retrieving programme memory. Please try again or escalate to the secretariat.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSimpleExplanation = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, showSimpleExplanation: !msg.showSimpleExplanation }
          : msg
      )
    );
  };

  const toggleSources = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, showSources: !msg.showSources } : msg
      )
    );
  };

  const suggestedQuestions = [
    'When is the next live session and what platform are we using?',
    'When is the prototype submission deadline?',
    'Simulate Unresolved Deadline Conflict (27 vs 29 Sep)',
    'Who will be the MIT mentor assigned specifically to my team?',
    'What deadline was previously announced before the extension?',
    'What did I miss today?',
    'What are the requirements for MIT Learn Module 4?',
    'Is there a cash prize of $50,000?',
  ];

  return (
    <div id="ask-unibot-view" className="max-w-4xl mx-auto space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Ask UniBot</h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5">
                Strict Grounding Active
              </span>
            </div>
            <p className="text-xs text-slate-700">
              Ask about official UniPods information, meetings, deadlines, and actions. Answers are strictly sourced from approved materials.
            </p>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome-reset',
                  sender: 'unibot',
                  text: 'Conversation cleared. How can I help you navigate the UniPods programme today?',
                  timestamp: 'Now',
                },
              ])
            }
            className="text-xs font-semibold text-slate-700 hover:text-slate-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100"
            title="Reset Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Suggested Quick Questions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Suggested Verification Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`btn-suggested-ask-${idx}`}
                onClick={() => handleSend(q)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Past Questions Drawer */}
          {recentQuestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 hover:text-blue-900"
              >
                <span>My Past Queries (Supabase Persisted - {recentQuestions.length})</span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showHistory && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                  {recentQuestions.map((rq: any) => (
                    <button
                      key={rq.id}
                      onClick={() => handleSend(rq.question)}
                      className="p-2 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 text-xs text-slate-800 transition-colors group"
                    >
                      <span className="font-medium line-clamp-1 group-hover:text-blue-900">
                        {rq.question}
                      </span>
                      <span className="text-[10px] text-slate-700 flex items-center justify-between mt-1">
                        <span className="text-emerald-700 font-semibold">{rq.confidence}</span>
                        <span>{rq.created_at ? new Date(rq.created_at).toLocaleDateString() : 'Recent'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 sm:p-6 min-h-[420px] max-h-[640px] overflow-y-auto space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-700">
              <span className="font-semibold text-slate-700">
                {msg.sender === 'user' ? (userName || 'You') : 'Ask UniBot'}
              </span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-900 text-white rounded-tr-xs'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs space-y-3'
              }`}
            >
              {/* Confidence Badge (Bot Only) */}
              {msg.responseMeta && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <ConfidenceBadge
                    confidence={msg.responseMeta.confidence}
                    showDescription
                  />
                </div>
              )}

              {/* Main Answer Text */}
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                {msg.text}
              </div>

              {/* Conflict Summary Notice if Present */}
              {msg.responseMeta?.conflictSummary && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold mb-0.5">Discrepancy Detected in Programme Records:</p>
                  <p>{msg.responseMeta.conflictSummary}</p>
                </div>
              )}

              {/* Organiser Confirmation Requirement (Section 15) */}
              {msg.responseMeta?.confidence === 'NEEDS_ADMIN_CONFIRMATION' && (
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Human Support Required:</span>{' '}
                    <span>An organiser needs to confirm this information.</span>
                  </div>
                </div>
              )}

              {/* Freshness / Historical Status Notice (Section 12) */}
              {msg.responseMeta?.freshness && msg.responseMeta.freshness.status === 'expired' && (
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                  <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                    Archived / Superseded
                  </span>
                  <span>{msg.responseMeta.freshness.reason}</span>
                </div>
              )}

              {/* Plain Language Simplification Box */}
              {msg.showSimpleExplanation && msg.responseMeta?.explanationSimple && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 animate-in fade-in duration-150">
                  <span className="font-bold block mb-1">Plain Language Breakdown:</span>
                  <p>{msg.responseMeta.explanationSimple}</p>
                </div>
              )}

              {/* Next Step Box */}
              {msg.responseMeta?.nextStep && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Next Step:</span>{' '}
                    <span>{msg.responseMeta.nextStep}</span>
                  </div>
                </div>
              )}

              {/* Verified Sources / Evidence List */}
              {msg.responseMeta && msg.showSources && msg.responseMeta.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verifiable Programme Evidence ({msg.responseMeta.sources.length})</span>
                  </div>
                  <div className="space-y-2">
                    {msg.responseMeta.sources.map((src) => (
                      <EvidenceCard
                        key={src.id}
                        source={src}
                        onOpenDetails={onViewSourceModal}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Action Controls under Bot Bubble */}
              {msg.responseMeta && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                  {/* Toggle Simple Explanation */}
                  <button
                    id={`btn-explain-simply-${msg.id}`}
                    onClick={() => toggleSimpleExplanation(msg.id)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    {msg.showSimpleExplanation ? 'Hide simple explanation' : 'Explain simply'}
                  </button>

                  {/* Toggle Evidence */}
                  {msg.responseMeta.sources.length > 0 && (
                    <button
                      id={`btn-toggle-sources-${msg.id}`}
                      onClick={() => toggleSources(msg.id)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-slate-700" />
                      <span>{msg.showSources ? 'Hide source' : 'Show source'}</span>
                    </button>
                  )}

                  {/* Action Link */}
                  {msg.responseMeta.relatedActions && msg.responseMeta.relatedActions.length > 0 && (
                    <button
                      id={`btn-view-actions-${msg.id}`}
                      onClick={onNavigateToActions}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
                    >
                      View related action
                    </button>
                  )}

                  {/* Escalate to Human Admin */}
                  {msg.responseMeta.needsHuman && (
                    <button
                      id={`btn-escalate-admin-${msg.id}`}
                      onClick={() =>
                        onOpenHandoverModal(
                          msg.responseMeta?.answer || '',
                          msg.responseMeta?.sources.map((s) => s.title) || [],
                          msg.responseMeta?.conflictSummary || 'No approved programme update verifies this inquiry.'
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors flex items-center gap-1 shadow-xs ml-auto"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Escalate to Human Admin</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 text-xs text-slate-700 p-3 bg-white rounded-xl border border-slate-200 w-fit">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Checking approved UniPods sources...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-600"
      >
        <input
          id="input-ask-unibot"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the programme, deadlines, or meetings..."
          className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          disabled={isLoading}
        />
        <button
          id="btn-ask-unibot-send"
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
        >
          <span>Ask</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
