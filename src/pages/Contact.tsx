/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, Landmark, CheckCircle, Send } from 'lucide-react';

interface ContactProps {
  onAddToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function Contact({ onAddToast }: ContactProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback regarding simplification');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      onAddToast('error', 'Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    // Simulate support ticket registered
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
      onAddToast('success', 'Your Support Case has been successfully submitted! Response will be sent to your email.');
      setName('');
      setEmail('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-left">
      <div className="text-center mb-10">
        <h1 className="font-sans font-extrabold text-3xl md:text-4xl text-gov-navy tracking-tight">
          Citizen Desk & Feedback Support
        </h1>
        <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto">
          Registered complaints and accessibility requests are monitored by public officers in accordance with digital inclusion timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Contact Info Col */}
        <div className="md:col-span-1 space-y-6">
          <div className="clay-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gov-navy border-b border-gray-100 pb-2">
              Official Channels
            </h3>
            
            <div className="flex gap-3 text-xs text-gray-600 items-start">
              <Mail className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gov-navy">Ministry Support Email</p>
                <p className="font-mono mt-0.5">support.docuease@gov.in</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-gray-600 items-start">
              <Phone className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gov-navy">Toll Free Citizen Helpline</p>
                <p className="font-mono mt-0.5">1800-425-33550 (9AM - 6PM)</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-gray-600 items-start">
              <Landmark className="w-4 h-4 text-gov-navy shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gov-navy">Informatics Core Node</p>
                <p className="mt-0.5">Department of Citizen Welfare Technology, CGO Complex, New Delhi</p>
              </div>
            </div>
          </div>

          <div className="clay-card p-6 bg-gov-navy text-gov-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gov-orange mb-2">Service Promise</h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              We aim to review suggestions regarding linguistic translations or rendering layout bugs within 48 official working hours. Accessibility inquiries from differently-abled citizens receive top system processing rankings.
            </p>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-2">
          <div className="clay-card p-6 md:p-8 bg-white">
            <h3 className="text-base font-bold text-gov-navy mb-5 border-b border-gray-100 pb-2">
              Raise an Inquiry / Register Sugession
            </h3>

            {isDone ? (
              <div className="py-8 text-center space-y-4 animate-scaleUp">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-gov-navy">Citizen Ticket Successfully Registered</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thank you for your valuable feedback. A verification receipt with reference number has been compiled in our records. Our administrative officer will correspond back soon.
                </p>
                <button
                  onClick={() => setIsDone(false)}
                  className="bg-gov-navy text-gov-white hover:bg-gov-navy/90 font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Register Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Likhitha Chettipally"
                      className="w-full text-xs p-3 clay-input bg-white text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@domain.com"
                      className="w-full text-xs p-3 clay-input bg-white text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Subject Context</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs p-3 clay-input bg-white text-gray-800 focus:outline-none"
                  >
                    <option value="Feedback regarding simplification">Feedback regarding document simplification</option>
                    <option value="Translation precision concerns">Translation precision concerns (Telugu/Hindi)</option>
                    <option value="Screen reader or TTS Bug report">Screen reader, Voice Narration or Accessibility Bug</option>
                    <option value="Welfare scheme partnerships">Educational/Welfare scheme translation inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gov-navy mb-1.5 uppercase">Detailed Query / Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide official notification number or specific lines of translation feedback you would like to raise with our accessibility desk..."
                    className="w-full text-xs p-3 clay-input bg-white text-gray-800 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gov-orange text-gov-white hover:bg-gov-orange/90 disabled:bg-gov-orange/50 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow hover:scale-[1.01] flex items-center gap-2 cursor-pointer w-full sm:w-auto text-center justify-center justify-items-center"
                  >
                    {isSubmitting ? 'Registering Ticket...' : 'Submit Official Enquiry'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
