/**
 * Retrieval Service
 * Normalizes questions, executes semantic/lexical matching over approved knowledge chunks,
 * and ranks evidence candidates based on relevance, trust level, freshness, and date matching.
 */

import { KnowledgeChunk, Source, SourceEvidenceItem } from '../types';
import { evidenceService } from './evidenceService';
import { defaultKnowledgeRepository, KnowledgeRepository } from './knowledgeRepository';

export interface RankedChunk {
  chunk: KnowledgeChunk;
  source?: Source;
  score: number;
  matchedKeywords: string[];
}

export class RetrievalService {
  /**
   * Normalize user question into clean query terms and intent tags
   */
  public normalizeQuery(rawQuery: string): {
    normalizedText: string;
    tokens: string[];
    intentTags: string[];
    isHistoricalQuestion: boolean;
  } {
    const text = (rawQuery || '').toLowerCase().trim();

    // Clean punctuation
    const stripped = text.replace(/['"?,!.:;()]/g, ' ');
    const rawTokens = stripped.split(/\s+/).filter((t) => t.length > 1);

    // Filter common stopwords
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'to', 'we', 'are', 'our',
      'can', 'you', 'tell', 'me', 'what', 'when', 'where', 'how', 'who', 'do', 'does', 'please'
    ]);

    const tokens = rawTokens.filter((t) => !stopwords.has(t));

    // Detect intent tags
    const intentTags: string[] = [];
    if (text.includes('deadline') || text.includes('due') || text.includes('submission') || text.includes('submit')) {
      intentTags.push('deadline', 'submission');
    }
    if (text.includes('session') || text.includes('meeting') || text.includes('class') || text.includes('call') || text.includes('live')) {
      intentTags.push('schedule', 'session', 'meeting');
    }
    if (text.includes('teams') || text.includes('zoom') || text.includes('link') || text.includes('platform') || text.includes('room')) {
      intentTags.push('link', 'teams', 'virtual_room');
    }
    if (text.includes('mit') || text.includes('module') || text.includes('lab') || text.includes('quiz') || text.includes('learn')) {
      intentTags.push('mit_learn', 'curriculum');
    }
    if (text.includes('prototype') || text.includes('milestone') || text.includes('concept deck') || text.includes('repo')) {
      intentTags.push('prototype', 'milestone');
    }
    if (text.includes('wadhwani') || text.includes('interview') || text.includes('customer') || text.includes('user testing')) {
      intentTags.push('wadhwani', 'market_validation', 'interviews');
    }
    if (text.includes('grant') || text.includes('prize') || text.includes('money') || text.includes('cash') || text.includes('dollar') || text.includes('$')) {
      intentTags.push('grants', 'budget', 'reimbursement');
    }
    if (text.includes('missed') || text.includes('what did i miss') || text.includes('catch up') || text.includes('today')) {
      intentTags.push('updates', 'summary');
    }

    // Detect historical intent (e.g. "previously", "before the extension", "original deadline")
    const isHistoricalQuestion =
      text.includes('previously') ||
      text.includes('before') ||
      text.includes('earlier') ||
      text.includes('originally') ||
      text.includes('original') ||
      text.includes('prior') ||
      text.includes('old');

    return {
      normalizedText: stripped,
      tokens,
      intentTags,
      isHistoricalQuestion,
    };
  }

  /**
   * Rank knowledge chunks against the normalized query
   */
  public rankChunks(
    chunks: KnowledgeChunk[],
    sourcesMap: Map<string, Source>,
    rawQuery: string
  ): RankedChunk[] {
    const { normalizedText, tokens, intentTags, isHistoricalQuestion } = this.normalizeQuery(rawQuery);

    const scored: RankedChunk[] = [];

    for (const chunk of chunks) {
      // Must belong to approved source if approved flag exists
      if (chunk.approved === false) continue;
      const parentSource = sourcesMap.get(chunk.sourceId);
      if (parentSource && !parentSource.approved) continue;

      let score = 0;
      const matchedKeywords: string[] = [];

      const chunkContent = `${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`.toLowerCase();

      // Exact phrase match bonus
      if (tokens.length >= 2) {
        const bigram = tokens.slice(0, 3).join(' ');
        if (chunkContent.includes(bigram)) {
          score += 5.0;
        }
      }

      // Keyword matches
      for (const token of tokens) {
        if (chunkContent.includes(token)) {
          score += 1.5;
          matchedKeywords.push(token);
          // Bonus if keyword is in the chunk title
          if (chunk.title.toLowerCase().includes(token)) {
            score += 1.0;
          }
        }
      }

      // Intent tag overlap bonus
      for (const tag of intentTags) {
        if (chunk.tags.includes(tag) || (parentSource && parentSource.tags.includes(tag))) {
          score += 2.0;
        }
      }

      // Trust level weighting
      const trust = chunk.trustLevel || parentSource?.trustLevel || 'official';
      if (trust === 'official') score += 1.2;
      else if (trust === 'verified') score += 1.0;
      else if (trust === 'organiser_confirmed') score += 0.8;

      // Freshness & status handling
      const status = parentSource?.status || 'current';
      if (status === 'current') {
        score += isHistoricalQuestion ? 0.5 : 2.0;
      } else if (status === 'superseded') {
        // If user explicitly asks for historical info, boost superseded chunks!
        if (isHistoricalQuestion) {
          score += 4.0;
        } else {
          score -= 1.0; // penalize superseded chunks for regular queries
        }
      }

      if (score > 0) {
        scored.push({
          chunk,
          source: parentSource,
          score,
          matchedKeywords,
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  /**
   * Convert top ranked chunks to structured evidence items
   */
  public toEvidenceItems(rankedChunks: RankedChunk[], limit: number = 3): SourceEvidenceItem[] {
    const items: SourceEvidenceItem[] = [];
    const seenSources = new Set<string>();

    for (const r of rankedChunks) {
      if (seenSources.has(r.chunk.sourceId)) continue;
      seenSources.add(r.chunk.sourceId);

      const normalizedScore = Math.min(1.0, Math.max(0.2, Number((r.score / 10).toFixed(2))));
      const item = evidenceService.buildEvidenceFromChunk(r.chunk, r.source, normalizedScore);
      items.push(item);

      if (items.length >= limit) break;
    }

    return items;
  }

  /**
   * Retrieve approved sources and ranked evidence candidates from repository (Supabase or local fallback)
   */
  public async retrieveFromRepository(
    query: string,
    repository: KnowledgeRepository = defaultKnowledgeRepository,
    cachedSources?: Source[]
  ): Promise<{
    sources: Source[];
    rankedChunks: RankedChunk[];
    candidateEvidence: SourceEvidenceItem[];
    topSources: Source[];
  }> {
    // 1. Fetch sources from repository (Supabase with local fallback)
    let sources = cachedSources;
    if (!sources || sources.length === 0) {
      try {
        sources = await repository.getSources();
      } catch (err) {
        console.warn('RetrievalService repository fetch fallback:', err);
      }
    }
    const approvedSources = (sources || []).filter((s) => s.approved);
    const sourcesMap = new Map<string, Source>();
    approvedSources.forEach((s) => sourcesMap.set(s.id, s));

    // 2. Build or collect chunks
    const chunks: KnowledgeChunk[] = [];
    approvedSources.forEach((src) => {
      chunks.push({
        id: `chk-${src.id}-main`,
        sourceId: src.id,
        title: src.title,
        text: src.content,
        tags: src.tags || [],
        publishedAt: src.date,
        effectiveFrom: src.effectiveFrom || src.date,
        expiresAt: src.expiresAt,
        trustLevel: src.trustLevel || 'official',
        approved: src.approved,
        metadata: {
          status: src.status,
          type: src.type,
          author: src.author || src.publisher,
          url: src.url,
        },
      });
    });

    // 3. Rank chunks against normalized query
    const rankedChunks = this.rankChunks(chunks, sourcesMap, query);

    // 4. Extract top evidence items
    const candidateEvidence = this.toEvidenceItems(rankedChunks, 3);
    const topSources = candidateEvidence
      .map((ev) => sourcesMap.get(ev.id))
      .filter((s): s is Source => Boolean(s));

    return {
      sources: approvedSources,
      rankedChunks,
      candidateEvidence,
      topSources,
    };
  }
}

export const retrievalService = new RetrievalService();
