/**
 * Admin Sources Management View
 * Control room for approving, updating, and superseding knowledge base sources.
 */

import React, { useState } from 'react';
import { BookOpen, Plus, ShieldCheck, Check, X, AlertCircle } from 'lucide-react';
import { Source } from '../../../types';

interface AdminSourcesViewProps {
  sources: Source[];
  onToggleApproval: (sourceId: string) => void;
  onMarkSuperseded: (sourceId: string) => void;
  onAddSource: (newSource: Omit<Source, 'id'>) => void;
}

export const AdminSourcesView: React.FC<AdminSourcesViewProps> = ({
  sources,
  onToggleApproval,
  onMarkSuperseded,
  onAddSource,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Dr. Aminata Touré');
  const [type, setType] = useState<Source['type']>('organiser_update');

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAddSource({
      title,
      type,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      author,
      content,
      status: 'current',
      approved: true,
      tags: ['Admin update', 'Official'],
    });

    setTitle('');
    setContent('');
    setShowAddModal(false);
  };

  return (
    <div id="admin-sources-view" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Knowledge Base Source Management</h2>
          </div>
          <p className="text-xs text-slate-700">
            Ask UniBot only consults sources marked Approved. You can deprecate outdated notices by marking them Superseded.
          </p>
        </div>

        <button
          id="btn-open-add-source"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Approved Source</span>
        </button>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((s) => (
          <div
            key={s.id}
            className={`p-5 rounded-2xl border bg-white shadow-xs space-y-3 transition-colors ${
              s.status === 'superseded' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 capitalize">
                    {s.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-700">{s.date}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.approved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {s.approved ? 'Approved Source' : 'Unapproved (Ignored by AI)'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-700 mt-1 italic line-clamp-2">"{s.content}"</p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-700">Author:</span>
                <p className="font-semibold text-slate-900">{s.author}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-slate-700">
                Status: <strong className="capitalize text-slate-900">{s.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                {s.status !== 'superseded' && (
                  <button
                    onClick={() => onMarkSuperseded(s.id)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    Mark Superseded
                  </button>
                )}

                <button
                  onClick={() => onToggleApproval(s.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    s.approved
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {s.approved ? 'Revoke Approval' : 'Approve for AI'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Approved Source</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-700 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Milestone 3 Guidelines & Cloud Voucher Distribution"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Content / Directive Text</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Exact announcement or policy excerpt that Ask UniBot will cite..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author / Authority</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="organiser_update">Organiser Update</option>
                    <option value="official_whatsapp">Official WhatsApp</option>
                    <option value="mit_learn">MIT Learn</option>
                    <option value="wadhwani">Wadhwani Foundation</option>
                    <option value="meeting_note">Meeting Note</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-950 font-bold"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
