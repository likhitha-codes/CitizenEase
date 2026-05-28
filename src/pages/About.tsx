/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Eye, Landmark, Star, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-left">
      <div className="mb-10 text-center">
        <h1 className="font-sans font-extrabold text-3xl md:text-4xl text-gov-navy tracking-tight">
          About DocuEase
        </h1>
        <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto">
          Advancing inclusive public administration and linguistic equity through intelligent neural design.
        </p>
      </div>

      {/* Main Philosophy Section */}
      <div className="clay-card p-6 md:p-8 mb-8 bg-white">
        <h2 className="text-lg font-bold text-gov-navy mb-4 border-b border-gray-100 pb-2">
          Bridging the Administrative Literacy Divide
        </h2>
        <p className="text-gray-600 text-xs md:text-sm leading-relaxed mb-4">
          Government circulars, policy notifications, and eligibility files often contain nested administrative, legal, and financial language. Studies show that a large portion of ordinary families struggle to accurately interpret criteria for pensions, welfare quotas, or local property tax structures.
        </p>
        <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
          <strong>DocuEase</strong> is an expert tool engineered to bridge this gap. Utilizing clean AI technologies, it scans complex filings and synthesizes plain, simplified summaries matched by certified Hindi and Telugu translations. The system provides auditory text integration to include visually challenged and under-literate citizens.
        </p>
      </div>

      {/* Vision & Mission Split Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="clay-card p-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-gov-orange shrink-0" />
            <h3 className="text-base font-bold text-gov-navy">Our Vision</h3>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">
            To establish a state-of-the-art national accessibility index where no citizen is locked out from their legal rights or public benefits due to language, vocabulary barrier, or physical limitation.
          </p>
        </div>

        <div className="clay-card p-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-5 h-5 text-gov-navy shrink-0" />
            <h3 className="text-base font-bold text-gov-navy">Our Mission</h3>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">
            To leverage modern NLP modules to create an intuitive, secure workspace converting complex, dense circulars into easily shareable transcripts, supporting the active inclusion of all regional communities.
          </p>
        </div>
      </div>

      {/* Compliance / Badges */}
      <div className="clay-card p-6 bg-[#003366]/5 border border-[#003366]/10">
        <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider mb-4">Core Principles of Government Portal Trust</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gov-navy mb-0.5">Absolute Protection</h4>
              <p className="text-[10px] text-gray-500">Inputs are strictly held in memory. Private data is never stored permanently without active authenticated consent.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gov-navy mb-0.5">Accessibility Verified</h4>
              <p className="text-[10px] text-gray-500">Syntactically compliant with visual highlights supporting both Unicode Hindi/Telugu and classical English narrations.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Star className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gov-navy mb-0.5">Citizen Centric</h4>
              <p className="text-[10px] text-gray-500">100% free of commercial advertisements or distracting telemetry panels, prioritizing official digital administration guidelines.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
