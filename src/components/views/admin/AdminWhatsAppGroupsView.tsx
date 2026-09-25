/**
 * Admin WhatsApp Groups Management View (Phase 6.1)
 * METI UniPods AI Innovation Programme 2026
 *
 * Provides complete administration of WhatsApp Groups via Meta Groups API:
 * 1. Diagnostic Status (Meta configuration, Webhook, Groups API, Invite Template, Mode)
 * 2. Group Creation with subject, description, join_approval_mode
 * 3. Group Catalog with invite links, reset link action, participant count
 * 4. WhatsApp Direct Invitation Modal with Meta Template checks
 * 5. Join Requests Management Drawer (Approve / Reject)
 * 6. Direct linkage to Phase 5 Group Memory Governance
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Link,
  Copy,
  Check,
  RefreshCw,
  Send,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  Info,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  WhatsAppGroup,
  WhatsAppGroupJoinRequest,
  WhatsAppGroupIntegrationStatus,
  WhatsAppJoinApprovalMode,
} from '../../../types';

interface AdminWhatsAppGroupsViewProps {
  onNavigateToGroupMemory?: (groupId?: string) => void;
}

export const AdminWhatsAppGroupsView: React.FC<AdminWhatsAppGroupsViewProps> = ({
  onNavigateToGroupMemory,
}) => {
  // State
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<WhatsAppGroupIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [joinApprovalMode, setJoinApprovalMode] = useState<WhatsAppJoinApprovalMode>('approval_required');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [lastCreatedGroup, setLastCreatedGroup] = useState<WhatsAppGroup | null>(null);

  // Copy states
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [resettingGroupId, setResettingGroupId] = useState<string | null>(null);

  // Invitation Modal state
  const [inviteModalGroup, setInviteModalGroup] = useState<WhatsAppGroup | null>(null);
  const [recipientsInput, setRecipientsInput] = useState<string>('+221770000001, +221770000002');
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    success: boolean;
    message: string;
    details?: Array<{ recipient: string; success: boolean; error?: string }>;
  } | null>(null);

  // Join Requests Modal state
  const [requestsModalGroup, setRequestsModalGroup] = useState<WhatsAppGroup | null>(null);
  const [joinRequests, setJoinRequests] = useState<WhatsAppGroupJoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [actioningRequestId, setActioningRequestId] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Diagnostics
      const statusRes = await fetch('/api/whatsapp/group-integration/status');
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setIntegrationStatus(sData);
      }

      // 2. Groups
      const groupsRes = await fetch('/api/whatsapp/groups');
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        const unique = Array.isArray(gData)
          ? gData.filter((g, index, self) => self.findIndex((s) => s.id === g.id) === index)
          : [];
        setGroups(unique);
      }
    } catch (err: any) {
      console.warn('Error fetching group data:', err);
      setErrorBanner('Erreur de connexion au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle group creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorBanner('Veuillez saisir un nom/sujet pour le groupe.');
      return;
    }

    setIsCreating(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const response = await fetch('/api/whatsapp/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          joinApprovalMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'META_GROUP_CAPACITY_ERROR') {
          setErrorBanner('Limite de capacité de groupes atteinte sur votre compte WhatsApp Business (META_GROUP_CAPACITY_ERROR).');
        } else {
          setErrorBanner(data.error || 'Échec de création du groupe.');
        }
        return;
      }

      const newGroup: WhatsAppGroup = data.group;
      setLastCreatedGroup(newGroup);
      setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
      setSubject('');
      setDescription('');
      setSuccessBanner(`Groupe "${newGroup.name}" créé avec succès via Meta Groups API !`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Erreur lors de la création du groupe.');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy invite link
  const handleCopyLink = (group: WhatsAppGroup) => {
    const link = group.inviteLink || `https://chat.whatsapp.com/INVITE_${group.whatsappGroupId}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(group.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  // Reset invite link
  const handleResetLink = async (groupId: string) => {
    setResettingGroupId(groupId);
    try {
      const response = await fetch(`/api/whatsapp/groups/${groupId}/invite-link/reset`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.inviteLink) {
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, inviteLink: data.inviteLink } : g))
        );
        setSuccessBanner("Lien d'invitation régénéré avec succès.");
      } else {
        setErrorBanner(data.error || 'Impossible de réinitialiser le lien.');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Erreur réseau.');
    } finally {
      setResettingGroupId(null);
    }
  };

  // Open requests modal
  const handleOpenRequestsModal = async (group: WhatsAppGroup) => {
    setRequestsModalGroup(group);
    setLoadingRequests(true);
    try {
      const response = await fetch(`/api/whatsapp/groups/${group.id}/join-requests`);
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data);
      }
    } catch (err) {
      console.warn('Error loading join requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve join request
  const handleApproveRequest = async (requestId: string) => {
    if (!requestsModalGroup) return;
    setActioningRequestId(requestId);
    try {
      const res = await fetch(
        `/api/whatsapp/groups/${requestsModalGroup.id}/join-requests/${requestId}/approve`,
        { method: 'POST' }
      );
      if (res.ok) {
        setJoinRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'APPROVED' } : r))
        );
      }
    } catch (err) {
      console.warn('Approve request error:', err);
    } finally {
      setActioningRequestId(null);
    }
  };

  // Reject join request
  const handleRejectRequest = async (requestId: string) => {
    if (!requestsModalGroup) return;
    setActioningRequestId(requestId);
    try {
      const res = await fetch(
        `/api/whatsapp/groups/${requestsModalGroup.id}/join-requests/${requestId}/reject`,
        { method: 'POST' }
      );
      if (res.ok) {
        setJoinRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' } : r))
        );
      }
    } catch (err) {
      console.warn('Reject request error:', err);
    } finally {
      setActioningRequestId(null);
    }
  };

  // Send Invitations
  const handleSendInvitations = async () => {
    if (!inviteModalGroup) return;
    setIsSendingInvite(true);
    setInviteFeedback(null);

    const recipients = recipientsInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (recipients.length === 0) {
      setInviteFeedback({
        success: false,
        message: 'Veuillez saisir au moins un numéro de téléphone valide.',
      });
      setIsSendingInvite(false);
      return;
    }

    try {
      const res = await fetch(`/api/whatsapp/groups/${inviteModalGroup.id}/invitations/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients }),
      });

      const data = await responseData(res);

      if (!res.ok) {
        setInviteFeedback({
          success: false,
          message: data.error || "Erreur lors de l'envoi des invitations.",
        });
        return;
      }

      setInviteFeedback({
        success: true,
        message: `${data.sentCount} invitation(s) envoyée(s) avec succès via WhatsApp Meta Cloud API.`,
        details: data.results,
      });
    } catch (err: any) {
      setInviteFeedback({
        success: false,
        message: err.message || "Erreur lors de l'envoi des invitations.",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  async function responseData(res: Response) {
    try {
      return await res.json();
    } catch {
      return { error: `HTTP ${res.status}` };
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Admin &rarr; WhatsApp Groups (Meta Groups API)
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Gestion officielle des groupes WhatsApp de la cohorte UniPods AI 2026 via Meta Cloud API v26.0.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Alert Banners */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Avertissement WhatsApp Groups</p>
            <p className="mt-0.5">{errorBanner}</p>
          </div>
        </div>
      )}

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Succès</p>
            <p className="mt-0.5">{successBanner}</p>
          </div>
        </div>
      )}

      {/* 1. Integration Status Diagnostic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Meta API</span>
            <span
              className={`w-2 h-2 rounded-full ${
                integrationStatus?.metaConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">
            {integrationStatus?.metaConfigured ? 'v26.0 Configuré' : 'Dry Run / Simulé'}
          </p>
          <span className="text-[10px] text-slate-600">POST /{'{id}'}/groups</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Mode Groupe</span>
            <Radio className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">
            {integrationStatus?.mode || 'OBSERVE'}
          </p>
          <span className="text-[10px] text-slate-600">Smart Silence actif</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Webhook Meta</span>
            <span
              className={`w-2 h-2 rounded-full ${
                integrationStatus?.webhookConfigured ? 'bg-emerald-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">/webhooks/whatsapp</p>
          <span className="text-[10px] text-slate-600">Événements cycle & membres</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Template Invite</span>
            <span
              className={`w-2 h-2 rounded-full ${
                integrationStatus?.inviteTemplateConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
            {integrationStatus?.inviteTemplateConfigured
              ? 'unipods_group_invite'
              : 'Configuré'}
          </p>
          <span className="text-[10px] text-slate-600">Modèle Cloud API</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Groupes Actifs</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1">{groups.length} Groupe(s)</p>
          <span className="text-[10px] text-slate-600">Supabase & Meta sync</span>
        </div>
      </div>

      {/* 2. Group Creation Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Plus className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Créer un groupe WhatsApp officiel via Meta Groups API</h2>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sujet / Nom du groupe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ex. UniPods Cohorte 2026 - Track Agro-Tech"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-600 mt-1">
                Ce titre sera transmis tel quel à l'API Meta WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode d'approbation des adhésions
              </label>
              <select
                value={joinApprovalMode}
                onChange={(e) => setJoinApprovalMode(e.target.value as WhatsAppJoinApprovalMode)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="approval_required">
                  Validation requise par un facilitateur / admin (Recommandé)
                </option>
                <option value="auto_approve">Adhésion automatique dès le clic sur le lien</option>
              </select>
              <p className="text-[10px] text-slate-600 mt-1">
                Contrôle si les participants doivent être approuvés avant de rejoindre.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description du groupe (Optionnelle)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Groupe de travail officiel pour le METI UniPods AI Innovation Programme 2026..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Exécution sécurisée côté serveur (token Meta protégé).</span>
            </div>

            <button
              type="submit"
              disabled={isCreating || !subject.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Création en cours via Meta...' : 'Créer le groupe WhatsApp'}</span>
            </button>
          </div>
        </form>

        {/* Immediate Feedback for Last Created Group */}
        {lastCreatedGroup && (
          <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Groupe créé avec succès : {lastCreatedGroup.name}
              </span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                ID: {lastCreatedGroup.whatsappGroupId}
              </span>
            </div>

            {lastCreatedGroup.inviteLink && (
              <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-emerald-200 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Link className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-slate-800 truncate select-all">
                    {lastCreatedGroup.inviteLink}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLink(lastCreatedGroup)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded-md hover:bg-emerald-700 transition-colors flex-shrink-0"
                >
                  {copiedLinkId === lastCreatedGroup.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier le lien</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Groups Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Groupes WhatsApp Enregistrés</h2>
            <p className="text-[11px] text-slate-600">
              Synchronisés entre Meta WhatsApp Cloud API et la base Supabase.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {groups.length} groupes
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-xs">
            Aucun groupe WhatsApp trouvé. Créez-en un ci-dessus.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groups
              .filter((group, index, self) => self.findIndex((s) => s.id === group.id) === index)
              .map((group) => {
              const inviteLink = group.inviteLink || `https://chat.whatsapp.com/INV_${group.whatsappGroupId}`;
              const isCopied = copiedLinkId === group.id;
              const isResetting = resettingGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-slate-50/40 hover:bg-indigo-50/10 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{group.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            group.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {group.status}
                        </span>
                        {group.isDemo && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            Démo Cohorte 2026
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {group.description || 'Aucune description spécifiée.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {group.joinApprovalMode === 'auto_approve'
                          ? 'Adhésion Libre'
                          : 'Validation Requise'}
                      </span>
                    </div>
                  </div>

                  {/* Group Meta details & Invite link box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-mono">
                        Group ID Meta : <strong className="text-slate-800">{group.whatsappGroupId}</strong>
                      </span>
                      <span>Créé le : {new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Invite link with copy and reset actions */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 truncate text-xs">
                        <Link className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <a
                          href={inviteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-indigo-700 hover:underline truncate"
                        >
                          {inviteLink}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(group)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-[11px] font-semibold transition-colors"
                          title="Copier le lien d'invitation"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-600" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetLink(group.id)}
                          disabled={isResetting}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50"
                          title="Régénérer le lien d'invitation Meta"
                        >
                          <RefreshCw className={`w-3 h-3 text-slate-600 ${isResetting ? 'animate-spin' : ''}`} />
                          <span>Régénérer</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInviteModalGroup(group);
                          setInviteFeedback(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Inviter des membres par WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRequestsModal(group)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Demandes d'adhésion</span>
                      </button>
                    </div>

                    {/* Link to Phase 5 Group Memory */}
                    {onNavigateToGroupMemory && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGroupMemory(group.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Mémoire de Groupe (Phase 5)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: Send WhatsApp Invitations */}
      {inviteModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Inviter des membres via WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalGroup(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <p className="font-bold">Groupe : {inviteModalGroup.name}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Lien inclus : {inviteModalGroup.inviteLink || `https://chat.whatsapp.com/INV_${inviteModalGroup.whatsappGroupId}`}
                </p>
              </div>

              {/* Template check warning banner */}
              {!integrationStatus?.inviteTemplateConfigured && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <p className="font-bold">Configuration du template Meta requise</p>
                    <p className="mt-0.5">
                      Le template d'invitation WhatsApp n'est pas encore configuré dans Meta.
                      En mode Dry Run / Démo, les envois sont simulés avec succès.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Numéros des destinataires (format E.164, séparés par virgules)
                </label>
                <textarea
                  rows={3}
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  placeholder="+221775550101, +221775550102"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Chaque numéro recevra un message template officiel avec le nom du groupe et le lien direct.
                </p>
              </div>

              {/* Feedback */}
              {inviteFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    inviteFeedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{inviteFeedback.message}</p>
                  {inviteFeedback.details && (
                    <ul className="mt-2 space-y-1 text-[11px]">
                      {inviteFeedback.details.map((d, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span>{d.recipient}</span>
                          <span
                            className={`font-semibold ${
                              d.success ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {d.success ? '✓ Envoyé' : `✗ ${d.error}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteModalGroup(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSendInvitations}
                disabled={isSendingInvite}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingInvite ? 'Envoi en cours...' : "Envoyer l'invitation WhatsApp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Join Requests Drawer / Modal */}
      {requestsModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Demandes d'adhésion — {requestsModalGroup.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestsModalGroup(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3 text-xs">
              {loadingRequests ? (
                <div className="text-center py-6 text-slate-600">Chargement des demandes...</div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  Aucune demande d'adhésion en attente pour ce groupe.
                </div>
              ) : (
                joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {req.userName || 'Participant WhatsApp'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-600">{req.phoneNumber}</p>
                      <p className="text-[10px] text-slate-600">
                        Demandé le {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={actioningRequestId === req.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Approuver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actioningRequestId === req.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Rejeter</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setRequestsModalGroup(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
