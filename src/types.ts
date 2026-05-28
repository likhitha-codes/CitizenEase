/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface NicAdvisoryCheck {
  hasOfficialHeader: boolean;
  hasReferenceNumber: boolean;
  hasGovDomainOrEmail: boolean;
  hasOfficialDesignation: boolean;
  governmentBodyName: string;
  confidenceScore: number;
}

export interface DocResult {
  id: string;
  title: string;
  originalText: string;
  category: string;
  relevancePassed: boolean;
  relevanceExplanation: string;
  simplifiedEnglish: string;
  teluguTranslation: string;
  hindiTranslation: string;
  timestamp: string;
  nicAdvisoryCheck?: NicAdvisoryCheck;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  languageSelected: string[];
  result: DocResult;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface SpeakSentence {
  text: string;
  sentenceIndex: number;
  language: 'en' | 'te' | 'hi';
}
