/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, ShieldAlert, Award, FileText } from 'lucide-react';

interface FooterProps {
  setPage: (page: string) => void;
}

export default function Footer({ setPage }: FooterProps) {
  return (
    <footer className="bg-gov-navy text-gov-white pt-12 pb-6 px-4 md:px-8 mt-auto border-t-4 border-gov-orange">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
        {/* Col 1: About Platform */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-5 h-5 text-gov-orange" />
            <span className="font-sans font-bold text-lg tracking-wider">DocuEase</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed max-w-md">
            DocuEase is an artificial intelligence-powered accessibility platform designed to simplify official government documents, welfare scheme criteria, and legal notifications into direct, easily readable structures. It makes public notifications translation and auditory narration accessible for every citizen.
          </p>
          <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-wider font-semibold">
            Supported under Digital India and Accessible India initiatives
          </p>
        </div>

        {/* Col 2: Navigation Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gov-orange mb-3">Platform Links</h4>
          <ul className="space-y-2 text-xs text-gray-300">
            <li>
              <button onClick={() => setPage('home')} className="hover:text-gov-white hover:underline transition-colors text-left cursor-pointer">
                Government Document Space
              </button>
            </li>
            <li>
              <button onClick={() => setPage('how-it-works')} className="hover:text-gov-white hover:underline transition-colors text-left cursor-pointer">
                How our NLP works
              </button>
            </li>
            <li>
              <button onClick={() => setPage('about')} className="hover:text-gov-white hover:underline transition-colors text-left cursor-pointer">
                Vision and Mission
              </button>
            </li>
            <li>
              <button onClick={() => setPage('contact')} className="hover:text-gov-white hover:underline transition-colors text-left cursor-pointer">
                Citizen Support desk
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Safe Portal Trust Badges */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gov-orange mb-3">Core Certifications</h4>
          <div className="space-y-3 text-xs text-gray-300">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
              <span>Full SSL Security Encryption of uploaded assets</span>
            </div>
            <div className="flex items-start gap-2">
              <Award className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
              <span>W3C WAI-WCAG Level 2.1 AAA Accessibility Compliant</span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
              <span>Privacy-friendly processing - zero permanent retention without account save</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        {/* Required Footer Title */}
        <div>
          © 2024 DocuEase | National Informatics Centre (NIC) Style Footer
        </div>
        <div className="flex items-center gap-6 justify-center flex-wrap">
          <button onClick={() => setPage('about')} className="hover:text-gov-white hover:underline cursor-pointer">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setPage('how-it-works')} className="hover:text-gov-white hover:underline cursor-pointer">Accessibility Statement</button>
          <span>•</span>
          <button onClick={() => setPage('about')} className="hover:text-gov-white hover:underline cursor-pointer">Terms of Service</button>
          <span>•</span>
          <button onClick={() => setPage('contact')} className="hover:text-gov-white hover:underline cursor-pointer">Contact</button>
        </div>
      </div>
    </footer>
  );
}
