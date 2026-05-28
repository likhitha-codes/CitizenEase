/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, FileUp, Clipboard, Image, Volume2, 
  Download, Copy, Share2, Landmark, HelpCircle, 
  CheckCircle, ShieldAlert, Split, Printer, FileDown, 
  RefreshCw, Loader2, Play, CircleAlert, Pause, Square
} from 'lucide-react';
import { User, DocResult, HistoryItem } from '../types';
import { splitTextIntoSentences, downloadAsPDF, downloadAsTxt } from '../utils';
import { NicAdvisoryPanel } from '../components/NicAdvisoryPanel';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface HomeProps {
  user: User | null;
  token: string | null;
  setPage: (page: string) => void;
  onAddToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  recentHistory: HistoryItem[];
  fetchHistory: () => void;
  onOpenConfirmModal: (action: () => void, title: string, message: string) => void;
  
  // Speech callbacks managed globally
  onStartSpeak: (text: string, lang: 'en' | 'te' | 'hi', onSentenceChange: (idx: number) => void) => void;
  currentSpeakingLang: 'en' | 'te' | 'hi' | null;
  speakingIdx: number;
  isSpeechPaused: boolean;
  onPauseSpeak: () => void;
  onResumeSpeak: () => void;
  onStopSpeak: () => void;
}

export default function Home({
  user,
  token,
  setPage,
  onAddToast,
  recentHistory,
  fetchHistory,
  onOpenConfirmModal,
  onStartSpeak,
  currentSpeakingLang,
  speakingIdx,
  isSpeechPaused,
  onPauseSpeak,
  onResumeSpeak,
  onStopSpeak
}: HomeProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'txt' | 'paste' | 'ocr'>('paste');
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('');
  
  // File Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);

  // Checkbox parameters
  const [languages, setLanguages] = useState({
    en: true,
    te: true,
    hi: true
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DocResult | null>(null);
  const [relevanceFailed, setRelevanceFailed] = useState<boolean>(false);
  const [relevanceExplanation, setRelevanceExplanation] = useState<string>('');
  const [isLargeTextSpacing, setIsLargeTextSpacing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const characterCount = inputText.length;

  // Print translation text cleanly
  const handlePrintTranslation = (langLabel: string, translationText: string) => {
    if (!result) return;
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        onAddToast('error', 'Popup blocker prevented opening print window. Please allow popups for printing.');
        return;
      }
      
      const titleClean = result.title || 'Official Simplified Report';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>\${titleClean} - \${langLabel}</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                color: #1a1a1a;
                padding: 40px;
                line-height: 1.6;
              }
              .header {
                border-bottom: 3px double #0d2a4a;
                padding-bottom: 12px;
                margin-bottom: 24px;
              }
              .org {
                font-weight: bold;
                color: #d04a02;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 1px;
              }
              .title {
                font-size: 24px;
                font-weight: 800;
                color: #0d2a4a;
                margin: 4px 0;
              }
              .meta {
                font-size: 11px;
                color: #666;
                margin-top: 6px;
              }
              .content {
                font-size: 14px;
                white-space: pre-wrap;
              }
              .footer {
                margin-top: 50px;
                border-top: 1px solid #ccc;
                padding-top: 10px;
                font-size: 10px;
                color: #888;
                text-align: center;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="org">DocuEase Citizen Simplification Portal</div>
              <div class="title">\${titleClean}</div>
              <div class="meta">Language Version: <strong>\${langLabel}</strong> | Processed: \${new Date(result.timestamp || Date.now()).toLocaleDateString()}</div>
            </div>
            <div class="content">\${translationText}</div>
            <div class="footer">
              Disclaimer: This document is an AI-assisted plain-language simplification designed to assist reading and comprehension. It does not replace original government gazette text or legal counsel.
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 550);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      onAddToast('success', `Initiated print sequence for \${langLabel} simplified text.`);
    } catch (err: any) {
      console.error(err);
      onAddToast('error', 'Unable to initialize printer view.');
    }
  };

  // Listen for shared documents or injected results
  useEffect(() => {
    const handleInjectResult = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data) {
        setResult(data);
        setTitle(data.title || '');
        setRelevanceFailed(false);
        setRelevanceExplanation('');
        if (data.originalText && !data.originalText.startsWith('[Uploaded')) {
          setInputText(data.originalText);
        }
      }
    };
    window.addEventListener('inject_doc_result', handleInjectResult);
    window.addEventListener('load_shared_document', handleInjectResult);
    return () => {
      window.removeEventListener('inject_doc_result', handleInjectResult);
      window.removeEventListener('load_shared_document', handleInjectResult);
    };
  }, []);

  // Toggle checklist languages
  const handleCheckboxChange = (lang: 'en' | 'te' | 'hi') => {
    setLanguages(prev => ({ ...prev, [lang]: !prev[lang] }));
  };

  // Convert uploaded file to Base64 helper
  const handleFileConversion = (file: File) => {
    setUploadedFile(file);
    setTitle(file.name.split('.')[0]);

    const reader = new FileReader();
    if (file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        if (e.target?.result) {
          setInputText(e.target.result as string);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        if (reader.result) {
          const base64Str = (reader.result as string).split(',')[1];
          setFileBase64(base64Str);
          setFileMime(file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.className = "flex flex-col items-center justify-center p-8 border-2 border-dashed border-gov-orange bg-gov-orange/5 rounded-xl transition-all cursor-pointer";
    }
  };

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.className = "flex flex-col items-center justify-center p-8 border-2 border-dashed border-gov-border hover:border-gov-navy/40 bg-gray-50 rounded-xl transition-all cursor-pointer";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragLeave();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Filter tab constraints
      if (activeTab === 'pdf' && !file.name.endsWith('.pdf')) {
        onAddToast('error', 'Please upload a PDF document (.pdf) only under this tab.');
        return;
      }
      if (activeTab === 'txt' && !file.name.endsWith('.txt')) {
        onAddToast('error', 'Please upload a Text file (.txt) only.');
        return;
      }
      if (activeTab === 'ocr' && !file.type.startsWith('image/')) {
        onAddToast('error', 'Please upload photographic JPEG or PNG images only.');
        return;
      }

      handleFileConversion(file);
      onAddToast('info', `File loaded: ${file.name}`);
    }
  };

  const fileChooseTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileConversion(files[0]);
    }
  };

  // Document simplification handler
  const handleSimplifyDocument = async () => {
    // Clear old result states
    setResult(null);
    setRelevanceFailed(false);
    setRelevanceExplanation('');

    if (activeTab === 'paste' && !inputText.trim()) {
      onAddToast('warning', 'Please paste or type the official document text inside the area.');
      return;
    }
    if ((activeTab === 'pdf' || activeTab === 'ocr' || activeTab === 'txt') && !uploadedFile && !inputText) {
      onAddToast('warning', 'Please select and upload an official document file first.');
      return;
    }

    setIsProcessing(true);
    onAddToast('info', 'Contacting Secure AI Simplification Node. Please wait...');

    try {
      const payload: any = {
        title: title || 'Official Report',
      };

      if (activeTab === 'paste') {
        payload.text = inputText;
      } else if (activeTab === 'txt') {
        payload.text = inputText;
      } else {
        payload.fileBase64 = fileBase64;
        payload.mimeType = fileMime;
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/process', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred during processing.');
      }

      const fullDocResult: DocResult = {
        id: `doc_${Math.random().toString(36).substring(2, 9)}`,
        title: data.detectedTitle || title || 'Document Analysis',
        originalText: inputText || `[Uploaded file: ${title}]`,
        category: data.category || 'General',
        relevancePassed: data.relevancePassed,
        relevanceExplanation: data.relevanceExplanation,
        simplifiedEnglish: data.simplifiedEnglish || '',
        teluguTranslation: data.teluguTranslation || '',
        hindiTranslation: data.hindiTranslation || '',
        timestamp: new Date().toISOString(),
        nicAdvisoryCheck: data.nicAdvisoryCheck
      };
      setResult(fullDocResult);

      // Write to Firebase Firestore securely if citizen profile exists
      if (user) {
        try {
          const docId = `doc_${Math.random().toString(36).substring(2, 9)}`;
          await setDoc(doc(db, 'citizen_history', docId), {
            title: fullDocResult.title,
            originalText: fullDocResult.originalText,
            category: fullDocResult.category,
            relevancePassed: fullDocResult.relevancePassed,
            simplifiedEnglish: fullDocResult.simplifiedEnglish,
            teluguTranslation: fullDocResult.teluguTranslation,
            hindiTranslation: fullDocResult.hindiTranslation,
            createdAt: serverTimestamp(),
            userEmail: user.email,
            userId: user.id
          });
          onAddToast('info', 'Secure Firebase Cloud Copy preserved successfully.');
        } catch (error: any) {
          // Check if this was a permission error or actual network issue
          if (error.code === 'permission-denied' || (error.message && error.message.includes('permission'))) {
            handleFirestoreError(error, OperationType.CREATE, `/citizen_history`);
          } else {
            console.warn("Firestore storage skipped due to user sign-in contexts:", error);
          }
        }
      }

      if (!data.relevancePassed) {
        setRelevanceFailed(true);
        setRelevanceExplanation(data.relevanceExplanation);
        onAddToast('error', 'Validation Fail: Document categorized as non-government related.');
      } else {
        setRelevanceFailed(false);
        setRelevanceExplanation('');
        onAddToast('success', 'Document validation and multilingual simplification completed!');
        
        // Refresh local history list if signed in
        if (user) {
          fetchHistory();
        }
      }
    } catch (err: any) {
      console.error(err);
      onAddToast('error', err.message || 'An unexpected networking failure occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-open history snapshot helper
  const handleReopenHistory = (item: HistoryItem) => {
    setResult(item.result);
    setRelevanceFailed(false);
    setRelevanceExplanation('');
    setTitle(item.title);
    
    // Jump scroll to result directly for accessibility
    setTimeout(() => {
      document.getElementById('docuease-results-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    onAddToast('info', `Reloaded: "${item.title}"`);
  };

  // Text-to-speech visual highlighter builder
  const renderHighlightedText = (text: string, lang: 'en' | 'te' | 'hi') => {
    const isThisSpeaking = currentSpeakingLang === lang;
    const sentences = splitTextIntoSentences(text);

    return (
      <p className={`text-gray-700 whitespace-pre-line text-left transition-all duration-300 ${
        isLargeTextSpacing 
          ? 'text-sm md:text-lg leading-loose tracking-wide font-medium bg-amber-50/20 p-2.5 rounded-lg border border-amber-100/30' 
          : 'text-xs md:text-sm leading-relaxed'
      }`}>
        {sentences.map((sentence, idx) => {
          const isActive = isThisSpeaking && speakingIdx === idx;
          return (
            <span
              key={idx}
              className={`voice-highlight inline mr-1 transition-all duration-300 ${
                isActive ? 'voice-highlight-active' : ''
              }`}
            >
              {sentence}
            </span>
          );
        })}
      </p>
    );
  };

  // Copy text to clipboard Utility
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onAddToast('success', `${label} content coped successfully to clipboard.`);
  };

  // Create shareable link
  const handleShareResult = async () => {
    if (!result) return;
    try {
      const shareId = `share_${Math.random().toString(36).substring(2, 9)}`;
      
      // Save directly to Firestore 'shares' collection
      await setDoc(doc(db, 'shares', shareId), {
        title: result.title,
        category: result.category,
        originalText: result.originalText,
        simplifiedEnglish: result.simplifiedEnglish,
        teluguTranslation: result.teluguTranslation,
        hindiTranslation: result.hindiTranslation,
        createdAt: new Date().toISOString()
      });

      // Create physical absolute link using APP_URL or simple state pathing
      const shareUrl = `${window.location.protocol}//${window.location.host}?shareId=${shareId}`;
      navigator.clipboard.writeText(shareUrl);
      
      onAddToast('success', 'Shareable snapshot compiled! Absolute URL copied to clipboard.');
      onOpenConfirmModal(
        () => {},
        'Share Saved Successfully',
        `Your shared snapshot contains the official simplified translations. You can send this link to other citizens directly: ${shareUrl}`,
      );
    } catch (err: any) {
      console.error(err);
      onAddToast('error', 'Failed to generate share link via Firestore, trying backup.');
      
      // Fallback post request
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: result.title,
            category: result.category,
            originalText: result.originalText,
            simplifiedEnglish: result.simplifiedEnglish,
            teluguTranslation: result.teluguTranslation,
            hindiTranslation: result.hindiTranslation,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const shareUrl = `${window.location.protocol}//${window.location.host}?shareId=${data.shareId}`;
        navigator.clipboard.writeText(shareUrl);
        
        onAddToast('success', 'Backup share link generated! Absolute URL copied to clipboard.');
        onOpenConfirmModal(
          () => {},
          'Share Saved Successfully',
          `Your shared snapshot contains the official simplified translations. You can send this link to other citizens directly: ${shareUrl}`,
        );
      } catch (backupErr) {
        onAddToast('error', 'Failed to generate share link.');
      }
    }
  };

  // Triggers for downloading PDFs/TXT with NIC safety confirmation
  const triggerPDFDownload = (lang: 'en' | 'te' | 'hi', text: string) => {
    onOpenConfirmModal(
      () => {
        downloadAsPDF(result?.title || title, text, result?.category || 'General', lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi');
        onAddToast('success', `PDF Document created successfully for ${lang === 'en' ? 'English' : 'Translation'}.`);
      },
      'Review Confirmation Disclouse',
      'By clicking confirm, you acknowledge that you have reviewed the AI-simplified translation output on screen. This output is an assistive plain-text simplification and does not replace the binding legal authority of initial government gazettes.'
    );
  };

  const triggerTXTDownload = (lang: 'en' | 'te' | 'hi', text: string) => {
    onOpenConfirmModal(
      () => {
        downloadAsTxt(result?.title || title, text, lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi', result?.category || 'General');
        onAddToast('success', `Unicode Text file downloaded securely.`);
      },
      'Discloser Verification',
      'Please confirm you have audited the rendering and wish to store the citizen assistive report in plain text format offline.'
    );
  };

  // Trigger speech synthesizer
  const triggerSpeech = (text: string, lang: 'en' | 'te' | 'hi') => {
    onStartSpeak(text, lang, (idx) => {
      // Highlights the matching index sentence on active change
    });
    onAddToast('info', `Auditory narration initiated in ${lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi'}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-10 text-left">
      
      {/* 1. Official Government Hero Section */}
      <div className="bg-gradient-to-r from-gov-navy to-[#0c3c6d] text-gov-white rounded-2xl p-6 md:p-10 border-b-4 border-gov-orange shadow flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-gov-orange">
            <Landmark className="w-3.5 h-3.5" /> Ministry Unified Digital Node
          </div>
          <h1 className="font-sans font-extrabold text-2xl md:text-4xl text-gov-white tracking-tight leading-tight">
            DocuEase Digital Portal
          </h1>
          <p className="text-gray-200 text-xs md:text-sm leading-relaxed font-sans font-medium">
            Simplifying Government Documents for Every Citizen. Instantly decode dense circulars, notifications, and municipal welfare charters into plain-language summaries paired with Telugu and Hindi narrations.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-300">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-gov-orange" /> Legal Plain-Speak</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-gov-orange" /> Auditory Narration highlight</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-gov-orange" /> Full WCAG Accessibility</span>
          </div>
        </div>

        {/* Action badges or brief guides */}
        <div className="w-full md:w-auto shrink-0 bg-white/5 border border-white/10 p-5 rounded-xl space-y-3 font-sans text-xs max-w-sm">
          <h4 className="font-bold text-gov-orange uppercase">Quick Platform Instructions</h4>
          <ol className="list-decimal pl-4 space-y-1.5 text-gray-200 text-[11px] leading-relaxed">
            <li>Choose document upload category or paste text</li>
            <li>Select translation checklist matches</li>
            <li>Analyze outputs with highlighting audio assists</li>
          </ol>
        </div>
      </div>

      {/* 2. Side-by-Side Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Upload / Paste Government Document template */}
        <div className="space-y-6">
          <div className="clay-card p-6 md:p-8 bg-white" id="upload-panel-anchor">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-gov-navy font-sans block">
                Upload or Paste Government Document
              </h2>
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setTitle('');
                  setUploadedFile(null);
                  setFileBase64(null);
                  setFileMime(null);
                  setResult(null);
                  setRelevanceFailed(false);
                  setRelevanceExplanation('');
                  onAddToast('info', 'All form entries, file attachments, and simplified results cleared.');
                }}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-center"
                title="Reset all inputs and current simplified result"
              >
                Clear All
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 font-medium">
              Submit policies, welfare notices, judicial rules, or tax updates.
            </p>

            {/* National Trust Advisory warning header banner */}
            <div className="mb-6 p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex gap-3 text-xs leading-relaxed text-left">
              <ShieldAlert className="w-5 h-5 text-gov-orange shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="font-extrabold text-[#D04A02] uppercase tracking-wide text-[10px] block">
                  NIC Verification Advisory
                </strong>
                <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                  Uploaded materials <strong>should be strictly government-related</strong>. Non-official documents or unrelated text (like ads or code) will fail validation or substantially degrade assessment trust scores.
                </p>
              </div>
            </div>

            {/* Custom Tab selectors with Motion slide */}
            <div className="flex border-b border-gov-border mb-6 overflow-x-auto gap-1">
              {[
                { id: 'paste', label: 'Paste Text', icon: <Clipboard className="w-4 h-4" /> },
                { id: 'pdf', label: 'Upload PDF', icon: <FileText className="w-4 h-4" /> },
                { id: 'txt', label: 'Upload Text', icon: <FileUp className="w-4 h-4" /> },
                { id: 'ocr', label: 'Photo Copy OCR', icon: <Image className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setUploadedFile(null);
                    setFileBase64(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-gov-orange text-gov-navy'
                      : 'border-transparent text-gray-500 hover:text-gov-navy'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Container animations */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Meta title Input */}
                <div>
                  <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Document Title / Label (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pension Scheme revision 2024"
                    className="w-full p-3 text-xs clay-input bg-white text-gray-800"
                  />
                </div>

                {activeTab === 'paste' ? (
                  <div>
                    <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Paste Official Text Content *</label>
                    <textarea
                      rows={10}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste the dense official government circular text here..."
                      className="w-full p-3 text-xs clay-input bg-white text-gray-800 focus:outline-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                      <span>Minimum 10 rows recommended</span>
                      <span className="font-mono font-bold text-gov-navy bg-gray-100 px-1.5 py-0.5 rounded">
                        {characterCount} characters typed
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">File Upload Attachment</label>
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={fileChooseTrigger}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gov-border hover:border-gov-navy/40 bg-gray-50 rounded-xl transition-all cursor-pointer"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={
                          activeTab === 'pdf' ? '.pdf' : activeTab === 'txt' ? '.txt' : 'image/*'
                        }
                        className="hidden"
                      />
                      <FileUp className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-xs font-semibold text-gov-navy">
                        Drag & Drop or Click to browse files
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {activeTab === 'pdf' ? 'Supports official .pdf documents' : activeTab === 'txt' ? 'Supports plain text .txt' : 'Supports photocopy clips .png, .jpg'}
                      </p>
                    </div>

                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-gov-navy/5 border border-gov-navy/10 rounded-lg flex items-center justify-between text-xs animate-scaleUp">
                        <div className="flex items-center gap-2">
                           <FileText className="w-4 h-4 text-gov-navy shrink-0" />
                           <span className="font-semibold text-gov-navy truncate max-w-xs">{uploadedFile.name}</span>
                           <span className="text-[10px] text-gray-400">({Math.round(uploadedFile.size / 1024)} KB)</span>
                        </div>
                        <button
                          onClick={() => {
                            setUploadedFile(null);
                            setFileBase64(null);
                            setTitle('');
                            setInputText('');
                          }}
                          className="text-red-600 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Language targeting scopes */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gov-border">
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider mb-2.5">Accessibility Target Output Checklist</h4>
              <div className="flex flex-wrap gap-4 select-none">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="rounded text-gov-navy accent-gov-navy w-4 h-4 cursor-not-allowed"
                  />
                  <span>Simplified English (Default)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={languages.te}
                    onChange={() => handleCheckboxChange('te')}
                    className="rounded text-gov-navy accent-gov-navy w-4 h-4 cursor-pointer"
                  />
                  <span>Telugu (తెలుగు సంస్కరణ)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={languages.hi}
                    onChange={() => handleCheckboxChange('hi')}
                    className="rounded text-gov-navy accent-gov-navy w-4 h-4 cursor-pointer"
                  />
                  <span>Hindi (सरल हिंदी संसकरण)</span>
                </label>
              </div>
            </div>

            {/* Action simplifier CTA button */}
            <div className="mt-6">
              <button
                onClick={handleSimplifyDocument}
                disabled={isProcessing}
                className="w-full bg-gov-orange text-gov-white hover:bg-gov-orange/90 disabled:bg-gov-orange/50 font-bold py-3 px-6 rounded-xl transition-all shadow hover:scale-[1.01] flex items-center justify-center gap-2.5 cursor-pointer text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing your document...
                  </>
                ) : (
                  <>
                    Simplify & Translate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Processing Skeletons, Errors, and Output Results */}
        <div className="space-y-6">
          
          {/* Skeleton Processing state indicator */}
          {isProcessing && (
            <div className="space-y-4 animate-pulse">
              <div className="clay-card p-6 bg-white space-y-4">
                <div className="h-6 bg-gray-200 rounded-md w-1/3 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded-md w-1/4" />
                <div className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alert relevance fails */}
          {!isProcessing && relevanceFailed && (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 border-2 border-red-200 bg-red-50 text-red-800 rounded-xl space-y-3 text-left animate-slideUp"
              >
                <div className="flex items-start gap-3">
                  <CircleAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">⚠ This document does not appear to be a government-related document.</h4>
                    <p className="text-[11px] font-semibold text-red-700/80 uppercase mt-0.5 tracking-wide">Validation Shield Triggered</p>
                  </div>
                </div>
                <p className="text-xs text-red-700 leading-relaxed font-sans pl-8 border-l border-red-200">
                  <strong>Administrative Audit Check:</strong> {relevanceExplanation || "DocuEase processes official schedules, legal gazettes, pensions, tax codes or public circulars strictly. Please recheck your inputs and provide official content only."}
                </p>
              </motion.div>

              {result && result.nicAdvisoryCheck && (
                <NicAdvisoryPanel 
                  check={result.nicAdvisoryCheck}
                  relevancePassed={false}
                  relevanceExplanation={relevanceExplanation || result.relevanceExplanation}
                />
              )}
            </div>
          )}

          {/* Output Translation Results section */}
          {!isProcessing && result && !relevanceFailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
              id="docuease-results-anchor"
            >
              {/* Relevance Category badge */}
              <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-r-xl p-4 flex items-center justify-between text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping" />
                  <span>Detected Category:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    {result.category}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Passed Shield ✓</span>
              </div>

              {/* Universal Citizen Accessibility Configuration Panel */}
              <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-gov-orange" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gov-navy uppercase tracking-wide">Citizen Comfort Center</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">Toggle spacing and layouts to help elderly or reader accessibility.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-xs font-bold text-gray-700">Large Fonts & Wide Line Spacing:</span>
                  <button
                    onClick={() => {
                      setIsLargeTextSpacing(!isLargeTextSpacing);
                      onAddToast('info', isLargeTextSpacing ? 'Standard reader size restored.' : 'Accessibility modes engaged: larger fonts, double row height.');
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isLargeTextSpacing ? 'bg-gov-orange' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isLargeTextSpacing ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* NIC Advisory Panel Details */}
              {result.nicAdvisoryCheck && (
                <NicAdvisoryPanel 
                  check={result.nicAdvisoryCheck}
                  relevancePassed={result.relevancePassed}
                  relevanceExplanation={result.relevanceExplanation || "Document verified and approved under sovereign validation procedures."}
                />
              )}

              {/* Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gov-navy/5 p-4 rounded-xl border border-gov-navy/10">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">Report Document Title</h3>
                  <h4 className="text-base font-extrabold text-gov-navy mt-1 truncate">{result.title}</h4>
                </div>
                <button
                  onClick={handleShareResult}
                  className="bg-gov-navy text-gov-white hover:bg-gov-navy/90 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2.5 shrink-0 shadow transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Report Link
                </button>
              </div>

              {/* Vertical Stacked Cards */}
              <div className="grid grid-cols-1 gap-6 items-stretch">
                
                {/* Simplified English Card */}
                <div className="clay-card p-5 bg-white flex flex-col justify-between border-t-4 border-b-2 border-gov-navy/60">
                  <div className="space-y-4">
                    {/* Header bar card */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <h4 className="text-xs font-extrabold text-gov-navy uppercase">Simplified English</h4>
                      <span className="bg-gov-navy/10 text-gov-navy text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-gov-navy/20">
                        Primary
                      </span>
                    </div>

                    {/* Scrollable text screen */}
                    <div className="max-h-80 overflow-y-auto pr-1">
                      {renderHighlightedText(result.simplifiedEnglish, 'en')}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerSpeech(result.simplifiedEnglish, 'en')}
                        className={`grow border-2 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          currentSpeakingLang === 'en'
                            ? 'bg-gov-navy text-gov-white border-gov-navy'
                            : 'border-gov-navy/10 hover:border-gov-navy/20 hover:bg-gov-navy/5 text-gov-navy'
                        }`}
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${currentSpeakingLang === 'en' && !isSpeechPaused ? 'animate-bounce' : ''}`} /> 
                        {currentSpeakingLang === 'en' ? 'English Voice Playing' : 'Listen to English'}
                      </button>

                      {/* Inline Pause/Resume controls */}
                      <button
                        onClick={isSpeechPaused ? onResumeSpeak : onPauseSpeak}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          currentSpeakingLang === 'en'
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                            : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title={isSpeechPaused ? 'Resume narration' : 'Pause narration'}
                        disabled={currentSpeakingLang !== 'en'}
                      >
                        {isSpeechPaused ? (
                          <Play className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <Pause className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        )}
                      </button>

                      {/* Inline Stop Controls */}
                      <button
                        onClick={onStopSpeak}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          currentSpeakingLang === 'en'
                            ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                            : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Stop narration"
                        disabled={currentSpeakingLang !== 'en'}
                      >
                        <Square className="w-3.5 h-3.5 fill-red-800 text-red-800" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleCopyToClipboard(result.simplifiedEnglish, 'English')}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => triggerPDFDownload('en', result.simplifiedEnglish)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                        title="Download government style PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 text-gov-navy" />
                      </button>
                      <button
                        onClick={() => triggerTXTDownload('en', result.simplifiedEnglish)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                        title="Save plain text file"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrintTranslation('English', result.simplifiedEnglish)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                        title="Print simplified English document"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Telugu Card */}
                {languages.te && (
                  <div className="clay-card p-5 bg-white flex flex-col justify-between border-t-4 border-b-2 border-emerald-600/60">
                    <div className="space-y-4">
                      {/* Header bar card */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <h4 className="text-xs font-extrabold text-emerald-800 uppercase">Telugu (తెలుగు)</h4>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-200">
                          సంస్కరణ
                        </span>
                      </div>

                      {/* Scrollable text screen */}
                      <div className="max-h-80 overflow-y-auto pr-1">
                        {renderHighlightedText(result.teluguTranslation, 'te')}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => triggerSpeech(result.teluguTranslation, 'te')}
                          className={`grow border-2 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            currentSpeakingLang === 'te'
                              ? 'bg-emerald-700 text-gov-white border-emerald-700'
                              : 'border-emerald-600/10 hover:border-emerald-600/20 hover:bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${currentSpeakingLang === 'te' && !isSpeechPaused ? 'animate-bounce' : ''}`} /> 
                          {currentSpeakingLang === 'te' ? 'Telugu Voice Playing' : 'ఉచ్చారణ వినండి (Listen)'}
                        </button>

                        {/* Inline Pause/Resume controls for Telugu */}
                        <button
                          onClick={isSpeechPaused ? onResumeSpeak : onPauseSpeak}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentSpeakingLang === 'te'
                              ? 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                              : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                          title={isSpeechPaused ? 'Resume narration' : 'Pause narration'}
                          disabled={currentSpeakingLang !== 'te'}
                        >
                          {isSpeechPaused ? (
                            <Play className="w-3.5 h-3.5 text-amber-700 font-bold" />
                          ) : (
                            <Pause className="w-3.5 h-3.5 text-amber-700 font-bold" />
                          )}
                        </button>

                        {/* Inline Stop Controls for Telugu */}
                        <button
                          onClick={onStopSpeak}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentSpeakingLang === 'te'
                              ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                              : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                          title="Stop narration"
                          disabled={currentSpeakingLang !== 'te'}
                        >
                          <Square className="w-3.5 h-3.5 fill-red-800 text-red-800" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleCopyToClipboard(result.teluguTranslation, 'Telugu')}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerPDFDownload('te', result.teluguTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Save translation reports"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                        </button>
                        <button
                          onClick={() => triggerTXTDownload('te', result.teluguTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Save plain text file"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintTranslation('Telugu', result.teluguTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Print simplified Telugu translation"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#059669]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hindi Card */}
                {languages.hi && (
                  <div className="clay-card p-5 bg-white flex flex-col justify-between border-t-4 border-b-2 border-gov-orange/60">
                    <div className="space-y-4">
                      {/* Header bar card */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <h4 className="text-xs font-extrabold text-[#D04A02] uppercase font-sans">Hindi (सरल हिंदी)</h4>
                        <span className="bg-orange-50 text-[#D04A02] text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-gov-orange/20">
                          अनुवाद
                        </span>
                      </div>

                      {/* Scrollable text screen */}
                      <div className="max-h-80 overflow-y-auto pr-1">
                        {renderHighlightedText(result.hindiTranslation, 'hi')}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => triggerSpeech(result.hindiTranslation, 'hi')}
                          className={`grow border-2 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            currentSpeakingLang === 'hi'
                              ? 'bg-amber-600 text-gov-white border-amber-600'
                              : 'border-gov-orange/15 hover:border-gov-orange/25 hover:bg-orange-50/50 text-[#D04A02]'
                          }`}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${currentSpeakingLang === 'hi' && !isSpeechPaused ? 'animate-bounce' : ''}`} /> 
                          {currentSpeakingLang === 'hi' ? 'Hindi Voice Playing' : 'हिंदी अनुवाद सुनें (Listen)'}
                        </button>

                        {/* Inline Pause/Resume controls for Hindi */}
                        <button
                          onClick={isSpeechPaused ? onResumeSpeak : onPauseSpeak}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentSpeakingLang === 'hi'
                              ? 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                              : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                          title={isSpeechPaused ? 'Resume narration' : 'Pause narration'}
                          disabled={currentSpeakingLang !== 'hi'}
                        >
                          {isSpeechPaused ? (
                            <Play className="w-3.5 h-3.5 text-amber-700 font-bold" />
                          ) : (
                            <Pause className="w-3.5 h-3.5 text-amber-700 font-bold" />
                          )}
                        </button>

                        {/* Inline Stop Controls for Hindi */}
                        <button
                          onClick={onStopSpeak}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentSpeakingLang === 'hi'
                              ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                              : 'bg-gray-100/50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                          title="Stop narration"
                          disabled={currentSpeakingLang !== 'hi'}
                        >
                          <Square className="w-3.5 h-3.5 fill-red-800 text-red-800" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleCopyToClipboard(result.hindiTranslation, 'Hindi')}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Copy translation contents"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerPDFDownload('hi', result.hindiTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Download report to PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-gov-orange" />
                        </button>
                        <button
                          onClick={() => triggerTXTDownload('hi', result.hindiTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Download text file"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintTranslation('Hindi', result.hindiTranslation)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-200"
                          title="Print simplified Hindi translation"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#D04A02]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Default Placeholder Card when there is no current document loaded or processing */}
          {!isProcessing && !result && !relevanceFailed && (
            <div className="clay-card p-6 md:p-8 bg-white/50 border border-dashed border-gov-border rounded-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[480px]">
              <div className="w-16 h-16 bg-gov-navy/5 text-gov-navy rounded-full flex items-center justify-center border border-gov-navy/10">
                <FileText className="w-8 h-8 opacity-60" />
              </div>
              <div className="max-w-sm space-y-2">
                <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">Simplified Outputs Panel</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Your simplified translations, plain-speak summaries, and auditory narrations will render right here.
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  Provide an official circular or welfare scheme document on the left, then click "Simplify & Translate" to begin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Downside Section: Citizen History & Platform Accessibility Guide side-by-side at bottom of page */}
      <div className="border-t border-gov-border pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Citizen History Section (7/12th grid width) */}
        <div className="lg:col-span-7">
          <div className="clay-card p-6 bg-white space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gov-navy border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>Citizen History</span>
              <span className="bg-gov-navy/10 text-gov-navy text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                {user ? recentHistory.length : 'Local Only'}
              </span>
            </h3>

            {user ? (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {recentHistory.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    No recent simplification tasks saved under your account. Your tasks will be logged here.
                  </div>
                ) : (
                  recentHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 text-left transition-colors space-y-2 group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-gov-navy line-clamp-2 leading-tight">
                          {item.title}
                        </h4>
                        <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-1 py-0.5 rounded uppercase shrink-0">
                          {item.category.split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleReopenHistory(item)}
                          className="text-gov-navy hover:text-gov-orange font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Open Reports <RefreshCw className="w-2.5 h-2.5 animate-spin-hover" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4 py-3">
                <p className="text-xs text-gray-500 leading-relaxed text-left">
                  Sign in or register an official account to unlock persistent history storage, multi-language tracking, and cloud sharing snapshots securely.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPage('login')}
                    className="flex-1 text-center text-xs font-bold bg-gov-navy text-gov-white py-2 px-4 rounded-lg cursor-pointer hover:bg-gov-navy/90 transition-all"
                  >
                    Login with Email
                  </button>
                  <button
                    onClick={() => setPage('register')}
                    className="flex-1 text-center text-xs font-bold border border-gov-border hover:bg-gray-50 py-2 px-4 rounded-lg text-gov-navy cursor-pointer transition-all"
                  >
                    Register Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Accessibility Guide Guidelines Banner (5/12th grid width) */}
        <div className="lg:col-span-5">
          <div className="clay-card p-6 bg-gov-white border border-gov-border border-l-4 border-gov-orange space-y-3 text-left">
            <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              💡 Platform Accessibility Guide
            </h4>
            <ul className="list-disc pl-4 text-[11px] text-gray-500 space-y-2 leading-snug">
              <li>Use **Listen** feature to read and visually audit translations inline.</li>
              <li>Save documents in **.txt** format if you use localized mobile screen readers.</li>
              <li>You can download files in beautiful professional **PDF** format using our watermark tools.</li>
              <li>Verify that you have read the discloser checklist before public print exports.</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
