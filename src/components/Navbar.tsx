/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Landmark, User, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentPage: string;
  setPage: (page: string) => void;
  user: UserType | null;
  onLogout: () => void;
}

export default function Navbar({ currentPage, setPage, user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (pageId: string) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-gov-white border-b border-gov-border w-full py-3 px-4 md:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Government Logo & Brand */}
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
        >
          {/* Emblem of India style vector placeholder */}
          <div className="w-10 h-10 bg-gov-navy/5 text-gov-navy border border-gov-navy/20 rounded-lg flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-gov-navy" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-lg md:text-xl text-gov-navy tracking-tight leading-none">
                DocuEase
              </span>
              <span className="bg-gov-orange/10 text-gov-orange text-[10px] font-bold px-1.5 py-0.5 rounded border border-gov-orange/20">
                AI PORTAL
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-none mt-1 uppercase tracking-wider font-semibold">
              National Document Accessibility Service
            </p>
          </div>
        </button>

        {/* Center/Right: Desktop Navigation links */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`font-sans text-sm font-medium transition-colors py-1 relative cursor-pointer ${
                  currentPage === link.id
                    ? 'text-gov-navy font-bold'
                    : 'text-gray-600 hover:text-gov-navy'
                }`}
              >
                {link.label}
                {currentPage === link.id && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gov-orange rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-gov-border" />

          {/* User Section desktop */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gov-navy/5 px-3 py-1.5 rounded-lg border border-gov-navy/10">
                  <User className="w-4 h-4 text-gov-navy" />
                  <span className="text-xs font-semibold text-gov-navy max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gov-error transition-colors px-2 py-1.5 rounded cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-xs font-semibold text-gov-navy hover:text-gov-orange transition-colors px-3 py-1.5 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="text-xs font-semibold bg-gov-navy text-gov-white hover:bg-gov-navy/90 transition-all px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu and Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {user && (
            <div className="bg-gov-navy/5 text-gov-navy px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border border-gov-navy/10">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[70px] truncate">{user.fullName.split(' ')[0]}</span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gov-navy hover:text-gov-orange transition-colors p-1"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gov-white border-t border-gov-border py-4 px-6 flex flex-col gap-4 shadow-lg absolute left-0 right-0 top-[100%] animate-fadeIn">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`font-sans text-left text-sm font-medium py-2 border-b border-gray-50 cursor-pointer ${
                  currentPage === link.id ? 'text-gov-navy font-bold' : 'text-gray-600'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-gov-border my-1" />

          {/* User Section mobile */}
          <div>
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="text-xs font-medium text-gray-500">
                  Logged in as: <span className="font-semibold text-gov-navy">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold border border-gov-error text-gov-error hover:bg-gov-error/5 py-2 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-center text-sm font-semibold border border-gov-border text-gov-navy py-2 rounded-lg cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="text-center text-sm font-semibold bg-gov-navy text-gov-white py-2 rounded-lg cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
