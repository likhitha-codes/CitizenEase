/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileUp, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartNow: () => void;
}

export default function HowItWorks({ onStartNow }: HowItWorksProps) {
  const steps = [
    {
      num: '1',
      title: 'Upload or Paste Document',
      desc: 'Users upload central or state files (PDF or text), submit photographic clippings of official schedules, or paste dense legalese directly into the high-contrast input area.',
    },
    {
      num: '2',
      title: 'Automated AI Validation',
      desc: 'The intelligent semantic parser verifies the document against typical state registers. It immediately flags fake flyers, ensuring resources are preserved strictly for civic, tax, legal, and welfare notifications.',
    },
    {
      num: '3',
      title: 'Cognitive NLP Simplification',
      desc: 'Our advanced plain-language engine strips intimidating bureaucratic syntax, standardizing details on critical values, requirements, dates, and benefits at a clear 8th-grade reading level.',
    },
    {
      num: '4',
      title: 'Multimodal Local Synthesis',
      desc: 'DocuEase generates accurate parallel Hindi and Telugu transcripts alongside Simplified English. Read immediately online, listen directly with assistive visual highlighting, or download for local offline storage.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-left">
      <div className="text-center mb-12">
        <h1 className="font-sans font-extrabold text-3xl md:text-4xl text-gov-navy tracking-tight">
          How Our NLP Engine Operates
        </h1>
        <p className="text-gray-600 text-sm mt-3 max-w-2xl mx-auto">
          Connecting neural translation with intelligent plain-language rewriting to support citizen-first digital access.
        </p>
      </div>

      {/* Numbered Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {steps.map((step) => (
          <div key={step.num} className="clay-card p-6 flex gap-4 items-start relative overflow-hidden bg-white">
            <div className="w-12 h-12 rounded-lg bg-gov-navy text-gov-white shrink-0 flex items-center justify-center font-bold text-lg shadow-sm border border-gov-border">
              {step.num}
            </div>
            <div>
              <h3 className="text-base font-bold text-gov-navy mb-2">{step.title}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
            </div>
            {/* Ambient Watermark Back Number */}
            <span className="absolute right-3 bottom-0 text-7xl font-extrabold text-gray-50/70 select-none pointer-events-none font-mono">
              {step.num}
            </span>
          </div>
        ))}
      </div>

      {/* Trust Accordion segment */}
      <div className="bg-gov-navy/5 rounded-xl border border-gov-navy/10 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-gov-navy shrink-0" />
          <h2 className="text-base font-bold text-gov-navy uppercase tracking-wider">Certified Secure Processing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-gov-navy mb-1">Decentralized Auth</h4>
            <p>Utilizes resilient session cookies. Accounts remain encrypted and securely protected against information leaks.</p>
          </div>
          <div>
            <h4 className="font-bold text-gov-navy mb-1">Zero Persistent Cashing</h4>
            <p>Documents are parsed in real-time, and no text is cached on public servers without explicit save triggers from authenticated citizen profiles.</p>
          </div>
          <div>
            <h4 className="font-bold text-gov-navy mb-1">Full Accessibility Match</h4>
            <p>Engineered according to national accessibility indices—featuring text-to-speech with sentence indicators and full mobile responsive sizing.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onStartNow}
          className="bg-gov-orange text-gov-white hover:bg-gov-orange/90 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2 text-sm transition-all hover:scale-[1.02]"
        >
          Begin Document Processing <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
