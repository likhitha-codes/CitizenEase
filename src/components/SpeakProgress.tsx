/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, Play, Pause, Square, RotateCcw } from 'lucide-react';

interface SpeakProgressProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIdx: number;
  totalSentences: number;
  language: 'en' | 'te' | 'hi';
  speed: number;
  setSpeed: (speed: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  currentSentenceText?: string;
}

export default function SpeakProgress({
  isPlaying,
  isPaused,
  currentSentenceIdx,
  totalSentences,
  language,
  speed,
  setSpeed,
  onPause,
  onResume,
  onStop,
  onReplay,
  currentSentenceText = ''
}: SpeakProgressProps) {
  if (!isPlaying) return null;

  const percent = totalSentences > 0 ? Math.round(((currentSentenceIdx + 1) / totalSentences) * 100) : 0;
  const langLabel = { en: 'English Voice', te: 'సహాయక తెలుగు音声', hi: 'सहायक हिंदी音声' }[language];

  return (
    <div className="bg-gov-navy text-gov-white rounded-xl border border-white/10 p-4 md:p-5 shadow-lg max-w-2xl mx-auto my-6 animate-slideUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 border-b border-white/10 pb-3">
        {/* Left Side Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gov-orange/15 rounded-lg flex items-center justify-center border border-gov-orange/30 animate-pulse">
            <Volume2 className="w-5 h-5 text-gov-orange" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight">AI Voice Narration Active</h4>
            <p className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">
              Currently Narrating in: <span className="text-gov-orange font-bold font-sans">{langLabel}</span>
            </p>
          </div>
        </div>

        {/* Right Speed & Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Play / Pause / Stop / Replay Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Play/Pause Button */}
            {isPaused ? (
              <button
                onClick={onResume}
                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-gov-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                title="Resume Playback"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="w-8 h-8 rounded-lg bg-gov-orange hover:bg-gov-orange/95 text-gov-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                title="Pause Playback"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {/* Stop Button */}
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-gov-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
              title="Stop Playback"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
            </button>

            {/* Replay Button */}
            <button
              onClick={onReplay}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-gov-white flex items-center justify-center cursor-pointer transition-colors shadow-sm border border-white/5"
              title="Replay from Beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:block h-6 w-[1px] bg-white/15 mx-0.5" />

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10 text-xs">
            <span className="text-[9px] text-gray-400 px-1.5 font-bold uppercase">Speed:</span>
            {[1.0, 1.25, 1.5, 2.0].map((val) => (
              <button
                key={val}
                onClick={() => setSpeed(val)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  speed === val
                    ? 'bg-gov-orange text-gov-white shadow-sm'
                    : 'text-gray-300 hover:text-gov-white hover:bg-white/5'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between text-[11px] text-gray-300">
          <span className="font-medium">
            Sentence {currentSentenceIdx + 1} of {totalSentences}
          </span>
          <span className="font-mono text-gov-orange font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            {percent}% Completed
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gov-orange rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Highlighted current sentence display text */}
        {currentSentenceText && (
          <div className="bg-white/5 border border-white/5 rounded-lg p-3 mt-2 text-xs text-gray-200 block text-left bg-gradient-to-r from-gov-navy via-gov-navy to-[#0c3c6d] relative overflow-hidden italic leading-relaxed">
            <span className="text-gov-orange absolute font-serif text-3xl opacity-15 leading-none left-1 top-1">“</span>
            <p className="pl-4 pr-2 select-none relative z-10">
              {currentSentenceText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
