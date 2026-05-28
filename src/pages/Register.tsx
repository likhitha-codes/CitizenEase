/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Landmark, User, ShieldCheck, CheckSquare, Phone } from 'lucide-react';
import { User as UserType } from '../types';

interface RegisterProps {
  setPage: (page: string) => void;
  onRegisterSuccess: (user: UserType, token: string) => void;
  onAddToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function Register({ setPage, onRegisterSuccess, onAddToast }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phoneNumber) {
      onAddToast('error', 'Please fill out all registration fields.');
      return;
    }

    if (!agreeTerms) {
      onAddToast('warning', 'Please agree to the official citizen declaration to finalize your registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onAddToast('success', 'Your Citizen Account has been successfully established!');
      onRegisterSuccess(data.user, data.token);
      setPage('home');
    } catch (err: any) {
      console.error(err);
      onAddToast('error', err.message || 'Registration failed. Try a different email address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 clay-card overflow-hidden bg-white rounded-2xl border border-gov-border shadow-md">
        
        {/* Left Informational Panel (Split-screen) - 5 Cols */}
        <div className="md:col-span-5 bg-gov-navy text-gov-white p-6 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <Landmark className="w-6 h-6 text-gov-orange" />
              <span className="font-sans font-bold text-xl tracking-wide uppercase">DocuEase Security Node</span>
            </div>
            
            <h2 className="text-xl font-bold font-sans text-gov-white mb-4 leading-tight">
              A Single Portal for All Public Simplifications
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Register an official profile to securely track important state schemes, tax revisions, land registry formats, and academic regulations in your localized language list.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex gap-3 items-start text-xs">
                <ShieldCheck className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gov-white">Zero Third-Party Scraping</p>
                  <p className="text-gray-300 mt-0.5">Your submitted papers remain encapsulated inside the server network for processing.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start text-xs">
                <CheckSquare className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gov-white">Accessible Voice Sync</p>
                  <p className="text-gray-300 mt-0.5">Enables precise auditory playbacks complete with highlights synchronized inline.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-[10px] text-gray-400">
            Ministry of Electronics & Information Technology • MEITY
          </div>
        </div>

        {/* Right Auth Form Panel - 7 Cols */}
        <div className="md:col-span-7 p-6 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-2xl font-bold text-gov-navy font-sans mb-1">Citizen Registration</h1>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Establish a secure credentials set to lock your document space.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gov-navy uppercase mb-1.5">
                  Full Citizen Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Likhitha Chettipally"
                    className="w-full text-xs pl-10 pr-4 py-3 clay-input bg-white text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gov-navy uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen@email.com"
                    className="w-full text-xs pl-10 pr-4 py-3 clay-input bg-white text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gov-navy uppercase mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs pl-10 pr-4 py-3 clay-input bg-white text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gov-navy uppercase mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Establish a complex password"
                    className="w-full text-xs pl-10 pr-10 py-3 clay-input bg-white text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Citizen Declaration */}
              <div className="flex gap-2.5 items-start text-xs text-gray-600 pt-2">
                <input
                  type="checkbox"
                  id="declaration-chk"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 border-gov-border text-gov-navy rounded cursor-pointer w-4 h-4 shrink-0"
                />
                <label htmlFor="declaration-chk" className="leading-snug select-none cursor-pointer text-[11px]">
                  I hereby declare that I will utilize DocuEase strictly to simplify and read official public notifications in goodwill, and that my actions conform to national e-governance integrity policies.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gov-orange text-gov-white hover:bg-gov-orange/90 disabled:bg-gov-orange/50 font-bold text-xs py-3 rounded-lg shadow transition-all hover:scale-[1.01] flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? 'Establishing Account...' : 'Initialize Citizen Workspace'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-600 pt-6 border-t border-gray-100">
              Already possess credentials?{' '}
              <button
                onClick={() => setPage('login')}
                className="text-gov-navy font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
