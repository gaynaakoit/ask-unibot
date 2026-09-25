/**
 * WhatsApp Group Simulator Component (Phase 4.4 + Phase 5)
 * Demonstrates:
 * - Smart Silence in WhatsApp Groups (Peer chatter ignored)
 * - Autonomous Knowledge Extraction (Announcements & Decisions recorded)
 * - Group Memory Slash Commands (/missed, /memory, /decisions, /deadlines)
 * - Conflict Detection & Handover Triggering
 */

import React, { useState } from 'react';
import { Smartphone, Send, VolumeX, CheckCheck, Sparkles } from 'lucide-react';
import { whatsappWebhookService } from '../../services/whatsappWebhookService';
import { groupMemoryService } from '../../services/groupMemoryService';

interface SimMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isBot?: boolean;
  avatarColor?: string;
  botMeta?: {
    confidence?: string;
    sourceTitle?: string;
    nextStep?: string;
  };
}

export const WhatsAppSimView: React.FC = () => {
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'wm-1',
      sender: 'Dr. Aminata Touré (Lead Facilitator)',
      text: '📢 Annonce officielle : La prochaine session interactive sur l’éthique et l’IA se tiendra ce jeudi à 15h00 GMT sur MS Teams.',
      time: '09:10',
      avatarColor: 'bg-purple-600',
    },
    {
      id: 'wm-2',
      sender: 'Kofi Mensah (Ghana UniPod)',
      text: 'Super merci Dr Touré ! Est-ce que les slides du Milestone 1 sont déjà disponibles ?',
      time: '09:12',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'wm-3',
      sender: 'Fatou Sow (Senegal UniPod)',
      text: 'Oui Kofi, sur le portail GitHub UniPods sous /curriculum/week3.',
      time: '09:14',
      avatarColor: 'bg-indigo-600',
    },
    {
      id: 'wm-4',
      sender: 'Awa Diop (You)',
      text: '/memory',
      time: '09:18',
      avatarColor: 'bg-blue-600',
    },
    {
      id: 'wm-5',
      sender: 'Ask UniBot (Verified Group Assistant)',
      text: `🧠 UNIPODS GROUP MEMORY\n\n📢 Dernières annonces importantes :\n• Session interactive éthique & IA jeudi 15h00 (Source: Dr. Aminata Touré)\n\n⚖️ Décisions récentes validées :\n• Désignation d’un responsable technique par équipe (Statut: Confirmé)\n\n⏰ Deadlines confirmées :\n• 30 septembre à 23h59 GMT : Soumission Milestone 2\n\n🗓️ Événements à venir :\n• Jeudi 15h00 GMT : Session interactive MS Teams\n\nSources vérifiées par le comité de facilitation UniPods.`,
      time: '09:18',
      isBot: true,
      botMeta: {
        confidence: 'CONFIRMED',
        sourceTitle: 'UniPods WhatsApp Group Memory',
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [silenceNotice, setSilenceNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isProcessing) return;

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
    setIsProcessing(true);

    try {
      // Simulate WhatsApp Cloud API Webhook Event payload
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'wa-biz-demo',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+221330000000',
                    phone_number_id: 'phone-id-unipods-2026',
                  },
                  contacts: [
                    {
                      profile: { name: 'Awa Diop' },
                      wa_id: '221770000001',
                    },
                  ],
                  messages: [
                    {
                      id: `sim-wamid-${Date.now()}`,
                      from: '12036302212026-group', // WhatsApp Group JID
                      author: '+221770000001', // Awa Diop
                      recipient_type: 'group',
                      group_id: 'grp-unipods-2026-demo',
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text',
                      text: { body: textToSend },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await whatsappWebhookService.processIncomingEvent(payload);
      const processed = result.processed[0];

      if (processed) {
        if (processed.outboundSent) {
          // If a response was generated (command or direct question)
          setTimeout(async () => {
            let replyText = '';
            if (processed.command) {
              const summary = await groupMemoryService.getGroupSummary('grp-unipods-2026-demo');
              if (processed.command === 'missed') {
                replyText = `📌 WHAT YOU MISSED\n\nSince your last activity:\n\n📢 ${summary.announcements.length} announcements\n🗓️ ${summary.events.length} upcoming events\n⏰ ${summary.deadlines.length} confirmed deadlines\n✅ 2 actions assigned to you\n\nSources: UniPods WhatsApp group memory & approved programme records.`;
              } else if (processed.command === 'memory') {
                replyText = `🧠 UNIPODS GROUP MEMORY\n\n📢 Dernières annonces importantes :\n• Session interactive éthique & IA jeudi 15h00\n\n⚖️ Décisions récentes validées :\n• Désignation d’un responsable technique par équipe\n\n⏰ Deadlines confirmées :\n• 30 septembre à 23h59 GMT : Soumission Milestone 2\n\nSources vérifiées par le comité de facilitation UniPods.`;
              } else if (processed.command === 'decisions') {
                replyText = `⚖️ DÉCISIONS DU GROUPE UNIPODS\n\n1. Désignation d’un responsable technique par équipe\n• Date : 21 sept 2026\n• Source : Annonce officielle du groupe UniPods\n• Statut : Validé / Confirmé`;
              } else if (processed.command === 'deadlines') {
                replyText = `⏰ ÉCHÉANCES CONFIRMÉES (UNIPODS 2026)\n\n• 30 septembre 2026 à 23h59 GMT\n  Soumission finale Milestone 2 (Architecture et pipeline)\n  Source : Annonce officielle UniPods (Confirmé)`;
              } else {
                replyText = `🤖 Ask UniBot Command Execution Completed.\nType /help to see all available commands.`;
              }
            } else {
              // Direct Q&A
              if (textToSend.toLowerCase().includes('change') || textToSend.toLowerCase().includes('27')) {
                replyText = `I found conflicting information about the session time or deadline (unverified claims of September 27 vs verified September 30). I need an organiser to confirm the current time.`;
              } else {
                replyText = `Confirmed: the next AI session is Thursday at 3 PM (15h00 GMT) on MS Teams.\n\nSource: UniPods group announcement.`;
              }
            }

            const botReply: SimMessage = {
              id: `bot-reply-${Date.now()}`,
              sender: 'Ask UniBot (Verified Group Assistant)',
              text: replyText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBot: true,
              botMeta: {
                confidence: processed.confidence || 'CONFIRMED',
                sourceTitle: 'UniPods WhatsApp Group Memory',
              },
            };
            setMessages((prev) => [...prev, botReply]);
          }, 600);
        } else {
          // Smart Silence triggered!
          const cleanText = textToSend.toLowerCase();
          let silenceReason = 'Smart Silence : Ask UniBot écoute et enregistre en arrière-plan sans polluer le groupe.';
          if (cleanText.includes('bonjour') || cleanText.includes('salut') || cleanText.includes('merci') || cleanText.includes('slides')) {
            silenceReason = 'Smart Silence : Discussion informelle entre pairs. Ask UniBot reste silencieux.';
          } else if (cleanText.includes('annonce') || cleanText.includes('session') || cleanText.includes('jeudi')) {
            silenceReason = 'Smart Silence + Capture : Annonce enregistrée en mémoire de groupe avec statut PENDING/APPROVED.';
          }
          setSilenceNotice(silenceReason);
        }
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setIsProcessing(false);
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
          <h2 className="text-lg font-bold text-slate-900">Simulateur WhatsApp — Phase 5 Group Memory</h2>
        </div>
        <p className="text-xs text-slate-700">
          Observez comment Ask UniBot interagit au sein du groupe WhatsApp UniPods : Smart Silence sur les discussions informelles,
          capture autonome des annonces et réponses précises aux commandes <code>/missed</code>, <code>/memory</code>, <code>/decisions</code>.
        </p>

        {/* Smart Silence Rule Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
          <VolumeX className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-900 font-bold">Règles fondamentales du groupe :</strong>
            1. « Conversation ≠ vérité officielle » : les faits sont capturés pour approbation administrative.<br />
            2. Smart Silence : UniBot ne répond que sur summon direct ou commande slash (<code>/memory</code>, <code>/missed</code>, etc.).
          </div>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="max-w-md mx-auto bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800">
        <div className="bg-[#efeae2] rounded-[24px] overflow-hidden flex flex-col h-[580px]">
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border border-white/20">
                U26
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">UniPods AI Cohort 2026 — General</h4>
                <p className="text-[10px] text-emerald-200">120 participants • Ask UniBot écoute en silence</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100 font-mono">
              Group Memory
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
                  className={`max-w-[88%] rounded-xl p-2.5 shadow-2xs text-xs ${
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

                  <p className="whitespace-pre-line leading-relaxed text-[11px]">{m.text}</p>

                  <div className="text-[9px] text-slate-600 mt-1 flex items-center justify-end gap-1">
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
            <span className="font-bold text-slate-700 whitespace-nowrap">Commandes :</span>
            <button
              onClick={() => handleSend('/missed')}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 whitespace-nowrap"
            >
              /missed
            </button>
            <button
              onClick={() => handleSend('/memory')}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 whitespace-nowrap"
            >
              /memory
            </button>
            <button
              onClick={() => handleSend('/decisions')}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 whitespace-nowrap"
            >
              /decisions
            </button>
            <button
              onClick={() => handleSend('/deadlines')}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 whitespace-nowrap"
            >
              /deadlines
            </button>
            <button
              onClick={() => handleSend('@Ask UniBot when is the next AI session?')}
              className="px-2 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-200 whitespace-nowrap"
            >
              @Ask UniBot
            </button>
          </div>

          {/* WhatsApp Input Bar */}
          <div className="bg-white p-2 border-t border-slate-200 flex items-center gap-2">
            <input
              id="input-sim-whatsapp"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez un message ou /memory, /missed..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
            />
            <button
              id="btn-sim-send"
              onClick={() => handleSend()}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#128c7e] transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
