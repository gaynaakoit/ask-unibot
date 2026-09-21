/**
 * Approved Sources View
 * Transparent registry of official knowledge base documents powering Ask UniBot answers.
 */

import React, { useState } from 'react';
import { BookOpen, Search, Filter, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Source, SourceType, SourceStatus } from '../../types';
import { EvidenceCard } from '../common/EvidenceCard';

interface SourcesViewProps {
  sources: Source[];
  onViewSourceModal: (source: Source) => void;
}

export const SourcesView: React.FC<SourcesViewProps> = ({ sources, onViewSourceModal }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = sources.filter((s) => {
    if (selectedType !== 'all' && s.type !== selectedType) return false;
    if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = `${s.title} ${s.content} ${s.author} ${s.tags.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div id="approved-sources-view" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <BookOpen className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Approved Sources Registry</h2>
        </div>
        <p className="text-xs text-slate-700">
          Ask UniBot is strictly grounded in these verified materials. Unapproved rumors and informal peer assumptions are excluded from factual responses.
        </p>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-sources"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved sources, authors, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filters Row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Source Type:</span>
            <select
              id="select-source-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
            >
              <option value="all">All Types</option>
              <option value="organiser_update">Organiser Update</option>
              <option value="official_whatsapp">Official WhatsApp</option>
              <option value="mit_learn">MIT Learn</option>
              <option value="wadhwani">Wadhwani Foundation</option>
              <option value="meeting_note">Meeting Note</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Status:</span>
            <select
              id="select-source-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="current">Current</option>
              <option value="superseded">Superseded</option>
              <option value="expiring_soon">Expiring Soon</option>
            </select>
          </div>

          <span className="ml-auto text-xs text-slate-700 font-medium">
            Showing {filtered.length} of {sources.length} sources
          </span>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <EvidenceCard
            key={s.id}
            source={s}
            onOpenDetails={onViewSourceModal}
          />
        ))}
      </div>
    </div>
  );
};
