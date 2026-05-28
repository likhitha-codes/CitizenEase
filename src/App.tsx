/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import ConfirmationModal from './components/Modal';
import SpeakProgress from './components/SpeakProgress';

import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

import { User, Toast, HistoryItem } from './types';
import { splitTextIntoSentences } from './utils';

export default function App() {
  const [page, setPage] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Speech System States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speakingIdx, setSpeakingIdx] = useState<number>(0);
  const [speakingLang, setSpeakingLang] = useState<'en' | 'te' | 'hi' | null>(null);
  const [speakingSentences, setSpeakingSentences] = useState<string[]>([]);
  const [speed, setSpeed] = useState<number>(1.0);

  // References to keep speech callbacks synced and avoid stale scopes
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const speakingIdxRef = useRef<number>(0);
  const speakingLangRef = useRef<'en' | 'te' | 'hi' | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const speedRef = useRef<number>(1.0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Update references on state changes
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { speakingIdxRef.current = speakingIdx; }, [speakingIdx]);
  useEffect(() => { speakingLangRef.current = speakingLang; }, [speakingLang]);
  useEffect(() => { sentencesRef.current = speakingSentences; }, [speakingSentences]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Confirmation Modal states
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmTitle, setConfirmTitle] = useState<string>('');
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // System toast trigger
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check login session storage on startup and prep speech systems
  useEffect(() => {
    const storedToken = localStorage.getItem('docuease_token');
    const storedUser = localStorage.getItem('docuease_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      addToast('info', 'Citizen authentication session restored from local cache.');
    }

    // Warm up available voices list for TTS engine (fixes empty getVoices chrome bug)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      // Clean up listener
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }

    // Capture shared links of results on query mount
    const queryParams = new URLSearchParams(window.location.search);
    const shareId = queryParams.get('shareId');
    if (shareId) {
      handleLoadSharedResult(shareId);
    }
  }, []);

  // Sync history when user changes or links
  useEffect(() => {
    if (user && token) {
      fetchUserHistory();
    } else {
      setHistory([]);
    }
  }, [user, token]);

  const fetchUserHistory = async () => {
    try {
      const res = await fetch('/api/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data);
    } catch {
      console.warn("Failed syncing user history registers.");
    }
  };

  // Fetch shared document snapshots
  const handleLoadSharedResult = async (id: string) => {
    addToast('info', 'Importing shared simplified document snapshot from portal...');
    try {
      const res = await fetch(`/api/share/${id}`);
      if (!res.ok) {
        throw new Error('Shared document not found');
      }
      const data = await res.json();
      
      // Inject the shared result directly into Home Page state triggers
      const sharedHomeResult = {
        id: data.id,
        title: data.title,
        originalText: data.originalText,
        category: data.category,
        relevancePassed: true,
        relevanceExplanation: 'Imported via shared portal link',
        simplifiedEnglish: data.simplifiedEnglish,
        teluguTranslation: data.teluguTranslation,
        hindiTranslation: data.hindiTranslation,
        timestamp: data.createdAt
      };

      // Set page to home and wait short duration for Home page to load, then trigger loading
      setPage('home');
      setTimeout(() => {
        const homeComp = document.getElementById('upload-panel-anchor');
        if (homeComp) {
          // Dispatch a custom event to notify Home component to set shared result
          const event = new CustomEvent('load_shared_document', { detail: sharedHomeResult });
          window.dispatchEvent(event);
          addToast('success', `Loaded shared snapshot: "${data.title}"`);
        }
      }, 300);

    } catch (err: any) {
      addToast('error', 'The shared result link is invalid or expired.');
    }
  };

  const handleLoginSuccess = (usr: User, tkn: string) => {
    setUser(usr);
    setToken(tkn);
    localStorage.setItem('docuease_token', tkn);
    localStorage.setItem('docuease_user', JSON.stringify(usr));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('docuease_token');
    localStorage.removeItem('docuease_user');
    addToast('success', 'You have signed out of your portal session safely.');
    setPage('home');
  };

  // open confirmation action panels
  const handleOpenConfirmModal = (action: () => void, title: string, message: string) => {
    setConfirmAction(() => action);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmOpen(true);
  };

  // AUDIT SPEECH - Advanced Unicode-aware Speeking queue player logic
  const chunkTextForTTS = (text: string, lang: 'en' | 'te' | 'hi'): string[] => {
    if (!text) return [];

    // Remove markdown headers/formatting symbols and brackets to speak clean raw text
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/-\s+/g, '')          // Remove list dashes
      .trim();

    // Split text initially by major sentence terminators and newlines
    // (aware of English punctuation, Hindi Devanagari danda "।", and newlines)
    const rawBlocks = cleanText.split(/([.!?।\n\r]+)/gu);
    
    const initialSentences: string[] = [];
    let currentBlock = "";

    for (const part of rawBlocks) {
      if (!part) continue;
      // If it's a punctuation marker or newline, append to final block
      if (/^[.!?।\n\r\s]+$/u.test(part)) {
        if (currentBlock) {
          currentBlock += part;
        }
        continue;
      }
      
      if (currentBlock) {
        initialSentences.push(currentBlock.trim());
      }
      currentBlock = part;
    }
    if (currentBlock) {
      initialSentences.push(currentBlock.trim());
    }

    const filteredSentences = initialSentences.map(s => s.trim()).filter(s => s.length > 0);
    const finalizedChunks: string[] = [];

    // For Telugu and Hindi, limit chunk length strictly to prevent buffer overflow/skipping
    const isIndianLang = lang === 'te' || lang === 'hi';
    const maxCharLimit = isIndianLang ? 85 : 180;

    for (const sentence of filteredSentences) {
      if (sentence.length <= maxCharLimit) {
        finalizedChunks.push(sentence);
      } else {
        // Chunk into safe sub-phrases at commas or word boundary spaces to keep pronunciation intact
        const subunits = sentence.split(/([,;，、\s]+)/u);
        let accumulated = "";

        for (const subunit of subunits) {
          if (!subunit) continue;
          if ((accumulated + subunit).length > maxCharLimit && accumulated.trim().length > 0) {
            finalizedChunks.push(accumulated.trim());
            accumulated = "";
          }
          accumulated += subunit;
        }
        if (accumulated.trim()) {
          finalizedChunks.push(accumulated.trim());
        }
      }
    }

    return finalizedChunks.filter(chunk => chunk.length > 1);
  };

  const handleStartSpeakingQueue = (text: string, lang: 'en' | 'te' | 'hi') => {
    // Terminate existing spoken utterances immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const textSentences = chunkTextForTTS(text, lang);
    if (textSentences.length === 0) {
      addToast('warning', 'Narrator trigger failed: No readable text found.');
      return;
    }

    // Verify if system voices matching our target exist
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    let detectedMatch = false;
    if (lang === 'te') {
      detectedMatch = voices.some(v => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu'));
    } else if (lang === 'hi') {
      detectedMatch = voices.some(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    } else {
      detectedMatch = true;
    }

    if (!detectedMatch && (lang === 'te' || lang === 'hi')) {
      const langName = lang === 'te' ? 'Telugu' : 'Hindi';
      addToast('info', `Information: Native ${langName} voice not found in device. We'll start narration, but enable ${langName} in settings if silent.`);
    }

    setSpeakingSentences(textSentences);
    setSpeakingLang(lang);
    setSpeakingIdx(0);
    setIsPlaying(true);
    setIsPaused(false);

    // Trigger queue start asynchronously to let state update
    setTimeout(() => {
      speakSentenceByIndex(0, textSentences, lang);
    }, 100);
  };

  const speakSentenceByIndex = (index: number, sentencesList: string[], language: 'en' | 'te' | 'hi') => {
    if (!isPlayingRef.current) return;
    if (index >= sentencesList.length) {
      // Completed full text scope
      setIsPlaying(false);
      setSpeakingLang(null);
      setSpeakingIdx(0);
      addToast('success', 'Audio narration of simplified text completed.');
      return;
    }

    setSpeakingIdx(index);
    const utterance = new SpeechSynthesisUtterance(sentencesList[index]);
    
    // Voice Match Filters (Robust lookup with case-insensitive tags and regional fallback properties)
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (language === 'te') {
      utterance.lang = 'te-IN';
      selectedVoice = voices.find((v) => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        const vname = v.name ? v.name.toLowerCase() : '';
        return vl.startsWith('te') || vname.includes('telugu') || vname.includes('te-in');
      });
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('te'));
      }
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
      selectedVoice = voices.find((v) => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        const vname = v.name ? v.name.toLowerCase() : '';
        return vl.startsWith('hi') || vname.includes('hindi') || vname.includes('hi-in');
      });
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
      }
    } else {
      utterance.lang = 'en-US';
      selectedVoice = voices.find((v) => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        const vname = v.name ? v.name.toLowerCase() : '';
        return vl.startsWith('en') || vname.includes('english') || vname.includes('en-us');
      });
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn(`No native ${language} system TTS voice found. Allowing automated browser-side language routing.`);
    }

    utterance.rate = speedRef.current;
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        speakSentenceByIndex(index + 1, sentencesList, language);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Voice utterance interrupted or finished.', e);
      if (isPlayingRef.current && !isPausedRef.current && e.error !== 'interrupted') {
        speakSentenceByIndex(index + 1, sentencesList, language);
      }
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePauseSpeak = () => {
    if (isPlaying && !isPaused) {
      setIsPaused(true);
      if (window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    }
  };

  const handleResumeSpeak = () => {
    if (isPlaying && isPaused) {
      setIsPaused(false);
      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    }
  };

  const handleStopSpeak = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setSpeakingLang(null);
    setSpeakingIdx(0);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleReplaySpeak = () => {
    if (speakingSentences.length === 0 || !speakingLang) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(true);
    setIsPaused(false);
    setSpeakingIdx(0);
    setTimeout(() => {
      speakSentenceByIndex(0, speakingSentences, speakingLang);
    }, 100);
  };

  const handleSetSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    // If playing, restart the current sentence with the new speed rate for immediate high-fidelity feedback
    if (isPlayingRef.current && speakingSentences.length > 0 && speakingLangRef.current) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => {
        speakSentenceByIndex(speakingIdxRef.current, sentencesRef.current, speakingLangRef.current!);
      }, 120);
    }
  };

  // Global listener for shared document loads inside Home Page context
  useEffect(() => {
    const handleSharedDocLoad = (e: Event) => {
      const data = (e as CustomEvent).detail;
      // Triggers custom state binding inside Home Page
      const event = new CustomEvent('inject_doc_result', { detail: data });
      window.dispatchEvent(event);
    };

    window.addEventListener('load_shared_document', handleSharedDocLoad);
    return () => window.removeEventListener('load_shared_document', handleSharedDocLoad);
  }, []);

  // We render the stable Home component directly to prevent unmounting when parent states change

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg">
      {/* Dynamic Header Navbar navigation */}
      <Navbar currentPage={page} setPage={setPage} user={user} onLogout={handleLogout} />

      {/* Floating narration progress panel */}
      <SpeakProgress
        isPlaying={isPlaying}
        isPaused={isPaused}
        currentSentenceIdx={speakingIdx}
        totalSentences={speakingSentences.length}
        language={speakingLang || 'en'}
        speed={speed}
        setSpeed={handleSetSpeed}
        onPause={handlePauseSpeak}
        onResume={handleResumeSpeak}
        onStop={handleStopSpeak}
        onReplay={handleReplaySpeak}
        currentSentenceText={speakingSentences[speakingIdx] || ''}
      />

      {/* Responsive Workspace Page Render */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
          >
            {page === 'home' && (
              <Home
                user={user}
                token={token}
                setPage={setPage}
                onAddToast={addToast}
                recentHistory={history}
                fetchHistory={fetchUserHistory}
                onOpenConfirmModal={handleOpenConfirmModal}
                onStartSpeak={handleStartSpeakingQueue}
                currentSpeakingLang={speakingLang}
                speakingIdx={speakingIdx}
                isSpeechPaused={isPaused}
                onPauseSpeak={handlePauseSpeak}
                onResumeSpeak={handleResumeSpeak}
                onStopSpeak={handleStopSpeak}
              />
            )}
            {page === 'how-it-works' && <HowItWorks onStartNow={() => setPage('home')} />}
            {page === 'about' && <About />}
            {page === 'contact' && <Contact onAddToast={addToast} />}
            {page === 'login' && <Login setPage={setPage} onLoginSuccess={handleLoginSuccess} onAddToast={addToast} />}
            {page === 'register' && <Register setPage={setPage} onRegisterSuccess={handleLoginSuccess} onAddToast={addToast} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* NIC style Government Footer */}
      <Footer setPage={setPage} />

      {/* Toast Notification alerts float list */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Trust Confirmation Modal for Print/Save */}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
      />
    </div>
  );
}
