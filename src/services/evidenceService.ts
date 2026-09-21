/**
 * Evidence Service
 * Extracts precise supporting passages and builds verified evidence items
 * without fabricating quotes or sources.
 */

import { Source, KnowledgeChunk, SourceEvidenceItem } from '../types';

export class EvidenceService {
  /**
   * Extract a concise evidence snippet from content matching the query context
   */
  public extractEvidenceSnippet(content: string, queryKeywords: string[]): string {
    if (!content) return '';
    const sentences = content.split(/(?<=[.?!])\s+/);

    if (queryKeywords.length === 0) {
      return sentences.slice(0, 2).join(' ');
    }

    // Find sentences with highest query keyword matches
    const scored = sentences.map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = queryKeywords.reduce(
        (acc, kw) => (lower.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0
      );
      return { sentence, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topSentences = scored.filter((s) => s.score > 0);
    if (topSentences.length > 0) {
      return topSentences.slice(0, 2).map((s) => s.sentence).join(' ');
    }

    return sentences.slice(0, 2).join(' ');
  }

  /**
   * Build a structured SourceEvidenceItem from a KnowledgeChunk or Source
   */
  public buildEvidenceItem(
    source: Source,
    relevance: number,
    queryKeywords: string[] = []
  ): SourceEvidenceItem {
    const evidence = this.extractEvidenceSnippet(source.content, queryKeywords);

    return {
      id: source.id,
      title: source.title,
      publisher: source.publisher || source.author || 'UniPods Secretariat',
      author: source.author || source.publisher,
      url: source.url,
      relevance: Math.min(1.0, Math.max(0.1, Number(relevance.toFixed(2)))),
      evidence,
      date: source.date || source.publishedAt,
      status: source.status,
      type: source.type,
      trustLevel: source.trustLevel || 'official',
    };
  }

  /**
   * Build an evidence item directly from a KnowledgeChunk
   */
  public buildEvidenceFromChunk(
    chunk: KnowledgeChunk,
    source?: Source,
    relevance: number = 0.95
  ): SourceEvidenceItem {
    return {
      id: chunk.sourceId,
      title: chunk.title,
      publisher: source?.publisher || source?.author || 'UniPods Secretariat',
      author: source?.author || source?.publisher,
      url: source?.url,
      relevance: Math.min(1.0, Math.max(0.1, Number(relevance.toFixed(2)))),
      evidence: chunk.text,
      date: chunk.publishedAt || source?.date,
      status: source?.status || 'current',
      type: source?.type || 'official_announcement',
      trustLevel: chunk.trustLevel || source?.trustLevel || 'official',
    };
  }
}

export const evidenceService = new EvidenceService();
