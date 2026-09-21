/**
 * WhatsApp Group Simulator Component
 * Demonstrates Smart Silence in realistic WhatsApp environment:
 * UniBot remains silent during conversational banter and peer troubleshooting,
 * activating only upon direct summon or explicit official inquiry.
 */

import React, { useState } from 'react';
import { Smartphone, Send, ShieldCheck, VolumeX, CheckCheck, Sparkles, AlertCircle } from 'lucide-react';
import { whatsAppService, InboundWhatsAppMessage } from '../../services/whatsAppService';
import { defaultKnowledgeService } from '../../services/knowledgeService';

interface SimMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isBot?: boolean;
  avatarColor?: string;
  botMeta?: {
    confidence: string;
    sourceTitle?: string;
    nextStep?: string;
  };
}

export const WhatsAppSimView: React.FC = () => {
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'wm-1',
      sender: 'Kofi Mensah (Ghana UniPod)',
      text: 'Good morning everyone! Did anyone manage to resolve the PyTorch CUDA memory error in MIT Colab 4?',
      time: '09:12',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'wm-2',
      sender: 'Fatou Sow (Senegal UniPod)',
      text: 'Yes Kofi! Set batch_size=8 and restart runtime. Works smoothly.',
      time: '09:14',
      avatarColor: 'bg-indigo-600',
    },
    {
      id: 'wm-3',
      sender: 'Kofi Mensah (Ghana UniPod)',
      text: 'Awesome, thanks Fatou! Life saver.',
      time: '09:15',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'wm-4',
      sender: 'Awa Diop (You)',
      text: '@Ask UniBot when is the next live session?',
      time: '09:20',
      avatarColor: 'bg-blue-600',
    },
    {
      id: 'wm-5',
      sender: 'Ask UniBot (Verified Assistant)',
      text: 'Next live session is Tuesday, 22 September 2026 at 10:00 WAT on Microsoft Teams.\n\nSource: UniPods Announcement #12\nNext step: Join room at 09:55 WAT and prepare your 2-minute prototype link.',
      time: '09:20',
      isBot: true,
      botMeta: {
        confidence: 'CONFIRMED',
        sourceTitle: 'UniPods Official Announcement #12',
        nextStep: 'Join MS Teams room at 09:55 WAT',
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [silenceNotice, setSilenceNotice] = useState<string | null>(null);

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend) return;

    const userMsg: SimMessage = {
      id: `wm-${Date.now()}`,
      sender: 'Awa Diop (You)',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarColor: 'bg-blue-600',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSilenceNotice(null);

    // Evaluate with WhatsApp Smart Silence engine
    const inbound: InboundWhatsAppMessage = {
      id: `in-${Date.now()}`,
      from: '+221770000000',
      senderName: 'Awa Diop',
      body: textToSend,
      timestamp: new Date().toISOString(),
      isGroupMessage: true,
      groupId: 'unipods-2026-group-3',
    };

    const decision = whatsAppService.evaluateSmartSilence(inbound);

    if (decision.shouldRespond) {
      setTimeout(() => {
        const query = decision.cleanedPrompt || textToSend;
        const result = defaultKnowledgeService.queryKnowledge(query);

        const botReply: SimMessage = {
          id: `bot-reply-${Date.now()}`,
          sender: 'Ask UniBot (Verified Assistant)',
          text: `${result.answer}\n\n[Verified Source: ${result.sources[0]?.title || 'UniPods Programme Records'}]\nNext Step: ${result.nextStep}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isBot: true,
          botMeta: {
            confidence: result.confidence,
            sourceTitle: result.sources[0]?.title,
            nextStep: result.nextStep || undefined,
          },
        };
        setMessages((prev) => [...prev, botReply]);
      }, 700);
    } else {
      setSilenceNotice(decision.reason);
    }
  };

  return (
    <div id="whatsapp-simulator-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Smartphone className="w-4 h-4 text-emerald-700" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">WhatsApp Smart Silence Simulator</h2>
        </div>
        <p className="text-xs text-slate-700">
          Observe how Ask UniBot operates peacefully within high-volume cohort groups without spamming or intruding on casual peer chatter.
        </p>

        {/* Smart Silence Rule Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
          <VolumeX className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-900 font-bold">Smart Silence In Action:</strong>
            UniBot stays quiet unless explicitly summoned with <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-bold">@Ask UniBot</code> or in direct 1:1 message. It never interrupts peer troubleshooting or casual greetings.
          </div>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="max-w-md mx-auto bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800">
        <div className="bg-[#efeae2] rounded-[24px] overflow-hidden flex flex-col h-[560px]">
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border border-white/20">
                U3
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">UniPods AI Cohort 2026 (Group 3)</h4>
                <p className="text-[10px] text-emerald-200">62 participants • Ask UniBot listening silently</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100 font-mono">
              WhatsApp Cloud API
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.isBot ? 'items-start' : m.sender.includes('You') ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 shadow-2xs text-xs ${
                    m.isBot
                      ? 'bg-white border-l-4 border-emerald-600 text-slate-900'
                      : m.sender.includes('You')
                      ? 'bg-[#dcf8c6] text-slate-900'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  <div className="text-[10px] font-bold text-emerald-900 mb-0.5 flex items-center gap-1">
                    {m.isBot && <Sparkles className="w-3 h-3 text-emerald-600" />}
                    <span>{m.sender}</span>
                  </div>

                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                  <div className="text-[9px] text-slate-700 mt-1 flex items-center justify-end gap-1">
                    <span>{m.time}</span>
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              </div>
            ))}

            {/* Smart Silence Notice Overlay */}
            {silenceNotice && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 text-white text-[11px] flex items-center gap-2 animate-in fade-in duration-150">
                <VolumeX className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="flex-1">{silenceNotice}</span>
              </div>
            )}
          </div>

          {/* Simulation Quick Trigger Chips */}
          <div className="bg-slate-100 p-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="font-bold text-slate-700 whitespace-nowrap">Test:</span>
            <button
              onClick={() => handleSend('Hey guys, who has the link for the quiz?')}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              Peer Chat (Triggers Silence)
            </button>
            <button
              onClick={() => handleSend('@Ask UniBot when is the prototype deadline?')}
              className="px-2 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-200 whitespace-nowrap"
            >
              @Ask UniBot Summon
            </button>
          </div>

          {/* WhatsApp Input Bar */}
          <div className="bg-white p-2 border-t border-slate-200 flex items-center gap-2">
            <input
              id="input-sim-whatsapp"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message or '@Ask UniBot ...'"
              className="flex-1 text-xs px-3 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
            />
            <button
              id="btn-sim-send"
              onClick={() => handleSend()}
              className="w-8 h-8 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#128c7e] transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
