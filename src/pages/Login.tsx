/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Landmark, ShieldCheck, HelpCircle, Phone } from 'lucide-react';
import { User } from '../types';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

interface LoginProps {
  setPage: (page: string) => void;
  onLoginSuccess: (user: User, token: string) => void;
  onAddToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function Login({ setPage, onLoginSuccess, onAddToast }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onAddToast('error', 'Please fill out all registration and login fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onAddToast('success', `Welcome back, ${data.user.fullName}! Citizen session successfully created.`);
      onLoginSuccess(data.user, data.token);
      setPage('home');
    } catch (err: any) {
      console.error(err);
      onAddToast('error', err.message || 'Verification failed. Double check your email/password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const citizen_user: User = {
        id: user.uid,
        email: user.email || '',
        fullName: user.displayName || 'Authorized Citizen'
      };
      
      // Call mock or automated integration storage token setter
      onLoginSuccess(citizen_user, `firebase_token_${user.uid}`);
      onAddToast('success', `Welcome, ${citizen_user.fullName}! Successfully authenticated via Firebase Google Account.`);
      setPage('home');
    } catch (err: any) {
      console.error("Firebase auth flow error:", err);
      onAddToast('error', err.message || 'Google authentication failed or was cancelled.');
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
              Access Simplified Government Information Securely
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Create an official citizen workspace to save document summaries, translate circulars consistently into regional languages, and review offline activity history synchronized locally in the state logs.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex gap-3 items-start text-xs">
                <ShieldCheck className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gov-white">NIC-Inspired Core Standards</p>
                  <p className="text-gray-300 mt-0.5">Secure session key management protecting files and queries completely.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start text-xs">
                <HelpCircle className="w-4 h-4 text-gov-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gov-white">Localized Workspace Sync</p>
                  <p className="text-gray-300 mt-0.5">Automated history sync allows citizens to review complex policy files on multiple devices.</p>
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
            <h1 className="text-2xl font-bold text-gov-navy font-sans mb-1">Citizen Login</h1>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Access the secure dashboard using your credentials.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gov-navy uppercase mb-1.5">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-gray-300">/</span>
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen@email.com or +91 98765 43210"
                    className="w-full text-xs pl-16 pr-4 py-3 clay-input bg-white text-gray-800 focus:outline-none"
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
                    placeholder="Enter your system passcode"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gov-navy text-gov-white hover:bg-gov-navy/90 disabled:bg-gov-navy/50 font-bold text-xs py-3 rounded-lg shadow transition-all hover:scale-[1.01] flex items-center justify-center cursor-pointer font-sans uppercase tracking-wider"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Citizen Network'}
                </button>
              </div>
            </form>

            <div className="my-5 flex items-center justify-between">
              <span className="border-b border-gray-250 w-2/5"></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">OR</span>
              <span className="border-b border-gray-250 w-2/5"></span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 font-bold text-xs py-3 border border-gray-300 rounded-lg shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google Account
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-gray-600 pt-6 border-t border-gray-100">
              New to DocuEase?{' '}
              <button
                onClick={() => setPage('register')}
                className="text-gov-orange font-bold hover:underline cursor-pointer"
              >
                Register a New Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
