/**
 * Admin Group Memory Governance View (Phase 5)
 * METI UniPods AI Innovation Programme 2026
 *
 * Provides lead organisers and facilitators with complete control over
 * extracted group knowledge:
 * - Review PENDING memories before they enter Ask UniBot Core RAG
 * - Approve, Reject (with reason), or Supersede memories
 * - Trace memories back to original WhatsApp message & author
 * - Enforce Smart Governance: "Conversation ≠ vérité officielle"
 */

import React, { useState, useEffect } from 'react';
import {
  GroupMemory,
  GroupMemoryStatus,
  GroupMemoryType,
  WhatsAppGroup,
} from '../../../types';
import { groupMemoryService } from '../../../services/groupMemoryService';
import { useAuth } from '../../../contexts/AuthContext';

export const AdminGroupMemoryView: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-unipods-2026-demo');
  const [memories, setMemories] = useState<GroupMemory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReasonModalId, setRejectReasonModalId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [supersedeModalId, setSupersedeModalId] = useState<string | null>(null);
  const [supersedingTargetId, setSupersedingTargetId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch groups
      const groupList = await groupMemoryService.listGroups();
      setGroups(groupList);
      const activeGrp = selectedGroupId || (groupList[0]?.id ?? 'grp-unipods-2026-demo');

      // 2. Fetch memories
      const statusParam = statusFilter === 'ALL' ? undefined : (statusFilter as GroupMemoryStatus);
      const memList = await groupMemoryService.fetchMemories(activeGrp, statusParam);
      setMemories(memList);
    } catch (err) {
      console.warn('Error loading admin group memory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroupId, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const adminId = user?.id || '00000000-0000-4000-a000-000000000003';
      const updated = await groupMemoryService.approveMemory(id, adminId);
      if (updated) {
        setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
        showToast('Mémoire approuvée avec succès ! Désormais active dans Ask UniBot Core.');
      }
    } catch {
      showToast('Erreur lors de l\'approbation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReasonModalId) return;
    const id = rejectReasonModalId;
    setActionLoading(id);
    try {
      const adminId = user?.id || '00000000-0000-4000-a000-000000000003';
      const updated = await groupMemoryService.rejectMemory(
        id,
        adminId,
        rejectReasonText || 'Non conforme aux décisions officielles'
      );
      if (updated) {
        setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
        showToast('Mémoire rejetée. Exclue de tout RAG.');
      }
    } finally {
      setActionLoading(null);
      setRejectReasonModalId(null);
      setRejectReasonText('');
    }
  };

  const handleSupersedeConfirm = async () => {
    if (!supersedeModalId || !supersedingTargetId) return;
    const id = supersedeModalId;
    setActionLoading(id);
    try {
      const adminId = user?.id || '00000000-0000-4000-a000-000000000003';
      const updated = await groupMemoryService.supersedeMemory(id, supersedingTargetId, adminId);
      if (updated) {
        setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
        showToast(`Mémoire marquée comme remplacée par [${supersedingTargetId}].`);
      }
    } finally {
      setActionLoading(null);
      setSupersedeModalId(null);
      setSupersedingTargetId('');
    }
  };

  // Filter memories by type
  const filteredMemories = memories.filter((m) => {
    if (typeFilter !== 'ALL' && m.memoryType !== typeFilter) return false;
    return true;
  });

  const pendingCount = memories.filter((m) => m.approvalStatus === 'PENDING').length;
  const approvedCount = memories.filter((m) => m.approvalStatus === 'APPROVED').length;
  const rejectedCount = memories.filter((m) => m.approvalStatus === 'REJECTED').length;
  const supersededCount = memories.filter((m) => m.approvalStatus === 'SUPERSEDED').length;

  const currentGroup = groups.find((g) => g.id === selectedGroupId);

  const getStatusBadge = (status: GroupMemoryStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">✅ APPROVED</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">⏳ PENDING APPROVAL</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">❌ REJECTED</span>;
      case 'SUPERSEDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">🔄 SUPERSEDED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeIcon = (type: GroupMemoryType) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return '📢 Annonce';
      case 'DECISION':
        return '⚖️ Décision';
      case 'DEADLINE':
        return '⏰ Deadline';
      case 'EVENT':
        return '🗓️ Événement';
      case 'UNRESOLVED_QUESTION':
        return '❓ Question en suspens';
      default:
        return '📌 Note';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center space-x-3 transition-all">
          <span>✨</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-800/80 text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-3 border border-indigo-700">
              <span>Phase 5 — WhatsApp Group Memory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gouvernance de la Mémoire de Groupe</h1>
            <p className="text-indigo-200 text-sm mt-1.5 max-w-3xl leading-relaxed">
              Vérifiez, validez ou rejetez les faits extraits des discussions WhatsApp. 
              <strong className="text-white ml-1 font-semibold">« Conversation ≠ vérité officielle »</strong> : 
              seules les mémoires <span className="text-emerald-300 underline font-semibold">APPROVED</span> sont 
              utilisées par le Core RAG Ask UniBot.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/10">
            <label className="text-xs font-medium text-indigo-200">Groupe WhatsApp :</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-3 py-2 border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {groups
                .filter((g, index, self) => self.findIndex((s) => s.id === g.id) === index)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || g.groupName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/60">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-xs font-medium text-amber-300 block">En Attente (PENDING)</span>
            <span className="text-2xl font-bold text-white mt-1 block">{pendingCount}</span>
            <span className="text-[11px] text-indigo-300">Nécessitent validation</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-xs font-medium text-emerald-300 block">Validées (APPROVED)</span>
            <span className="text-2xl font-bold text-white mt-1 block">{approvedCount}</span>
            <span className="text-[11px] text-indigo-300">Actives dans le RAG</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-xs font-medium text-rose-300 block">Rejetées (REJECTED)</span>
            <span className="text-2xl font-bold text-white mt-1 block">{rejectedCount}</span>
            <span className="text-[11px] text-indigo-300">Exclues du savoir</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-xs font-medium text-slate-300 block">Remplacées (SUPERSEDED)</span>
            <span className="text-2xl font-bold text-white mt-1 block">{supersededCount}</span>
            <span className="text-[11px] text-indigo-300">Obsolètes / périmées</span>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm text-sm text-amber-900 flex items-start space-x-3">
        <span className="text-xl">⚠️</span>
        <div>
          <strong className="font-semibold text-amber-950">Principe d'intégrité Ask UniBot :</strong>
          <p className="mt-0.5 text-xs text-amber-800">
            Une information partagée par un participant dans un groupe n'est jamais considérée comme officielle sans revue humaine.
            Toute affirmation contradictoire ou non vérifiée reste en statut <strong>PENDING</strong> ou génère un ticket de handover 
            (<code>NEEDS_ADMIN_CONFIRMATION</code>).
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Statut :</span>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Tous' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type :</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">Tous les types</option>
            <option value="ANNOUNCEMENT">Annonces</option>
            <option value="DECISION">Décisions</option>
            <option value="DEADLINE">Deadlines</option>
            <option value="EVENT">Événements</option>
            <option value="UNRESOLVED_QUESTION">Questions en suspens</option>
          </select>
        </div>
      </div>

      {/* Memory Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium">Chargement des mémoires de groupe...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm text-slate-500">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm font-semibold text-slate-800">Aucune mémoire ne correspond à ce filtre.</p>
            <p className="text-xs text-slate-400 mt-1">Sélectionnez un autre statut ou attendez de nouveaux messages du groupe.</p>
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isPending = mem.approvalStatus === 'PENDING';
            const isApproved = mem.approvalStatus === 'APPROVED';

            return (
              <div
                key={mem.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/20 shadow-amber-500/5'
                    : isApproved
                    ? 'border-emerald-200 bg-white'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(mem.approvalStatus)}
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {getTypeIcon(mem.memoryType)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Confiance: <strong className="text-slate-700 font-semibold">{mem.confidence}</strong>
                      </span>
                      {mem.supersededBy && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded font-mono">
                          Remplacé par: {mem.supersededBy}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                      {mem.title || 'Extrait de discussion collective'}
                    </h3>

                    <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed font-normal">
                      {mem.content}
                    </p>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span>Source : <strong>Groupe WhatsApp UniPods</strong></span>
                      {mem.createdAt && <span>Date : {new Date(mem.createdAt).toLocaleString('fr-FR')}</span>}
                      {mem.approvedBy && <span className="text-emerald-700 font-medium">Validé par Facilitateur</span>}
                      {mem.rejectionReason && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                          Motif de rejet : {mem.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(mem.id)}
                          disabled={actionLoading === mem.id}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <span>✅</span>
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => setRejectReasonModalId(mem.id)}
                          disabled={actionLoading === mem.id}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <span>❌</span>
                          <span>Rejeter</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => setSupersedeModalId(mem.id)}
                        disabled={actionLoading === mem.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-300"
                      >
                        🔄 Marquer Remplacé
                      </button>
                    )}

                    {!isPending && !isApproved && (
                      <button
                        onClick={() => handleApprove(mem.id)}
                        disabled={actionLoading === mem.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold transition-all border border-slate-200"
                      >
                        Réactiver / Approuver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectReasonModalId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Motif de rejet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Précisez pourquoi cette information issue du groupe ne doit pas faire partie de la mémoire officielle.
            </p>

            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="Ex: Information contredite par l'équipe pédagogique / Date erronée..."
              className="w-full mt-4 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              rows={3}
            />

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setRejectReasonModalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supersede Modal */}
      {supersedeModalId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Remplacer cette mémoire</h3>
            <p className="text-xs text-slate-500 mt-1">
              Indiquez l'ID ou la référence de la nouvelle source ou mémoire officielle qui prévaut.
            </p>

            <input
              type="text"
              value={supersedingTargetId}
              onChange={(e) => setSupersedingTargetId(e.target.value)}
              placeholder="Ex: mem-announcement-m2-final ou src-guide-2026"
              className="w-full mt-4 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setSupersedeModalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSupersedeConfirm}
                disabled={!supersedingTargetId.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                Marquer comme remplacée
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
