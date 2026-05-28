import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { NicAdvisoryCheck } from '../types';

interface NicAdvisoryPanelProps {
  check?: NicAdvisoryCheck;
  relevancePassed: boolean;
  relevanceExplanation: string;
}

export function NicAdvisoryPanel({ check, relevancePassed, relevanceExplanation }: NicAdvisoryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!check) {
    // If check doesn't exist (legacy), render a generic status based on relevancePassed
    return (
      <div className={`p-4 rounded-xl border-l-4 text-xs font-sans text-left space-y-2 ${
        relevancePassed 
          ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
          : 'bg-red-50 border-red-500 text-red-800'
      }`}>
        <div className="flex items-center gap-2 font-bold mb-1">
          {relevancePassed ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>NIC Document Relevance Assessment</span>
        </div>
        <p className="leading-relaxed">{relevanceExplanation}</p>
      </div>
    );
  }

  const {
    hasOfficialHeader,
    hasReferenceNumber,
    hasGovDomainOrEmail,
    hasOfficialDesignation,
    governmentBodyName,
    confidenceScore
  } = check;

  const scoreColor = confidenceScore >= 80 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
    : confidenceScore >= 50 
      ? 'text-amber-700 bg-amber-50 border-amber-200' 
      : 'text-red-700 bg-red-50 border-red-200';

  const scoreBarColor = confidenceScore >= 80
    ? 'bg-emerald-500'
    : confidenceScore >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="clay-card overflow-hidden bg-white border border-gov-border transition-all animate-scaleUp text-left font-sans">
      {/* Panel Header */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 bg-gov-navy/5 border-b border-gov-navy/10 hover:bg-gov-navy/10 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${relevancePassed ? 'bg-emerald-100/80 text-emerald-800' : 'bg-red-100/80 text-red-800'}`}>
            {relevancePassed ? (
              <ShieldCheck className="w-5 h-5 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-gov-navy uppercase tracking-wider">
              NIC Advisory Document Verification
            </h4>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
              {relevancePassed ? 'Official Government Related Origin Confirmed' : 'Fails Government Sourced Authentication'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${scoreColor}`}>
            NIC Trust Score: {confidenceScore}%
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Panel Contents */}
      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* Trust Meter Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span>Sovereign Identity Authentication Confidence</span>
              <span>{confidenceScore}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
              <div 
                className={`h-full ${scoreBarColor} transition-all duration-1000`} 
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist Matrix */}
            <div className="space-y-2.5 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200/40">
              <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-gov-navy border-b border-gray-200 pb-1.5">
                Authentication Markers Checked
              </h5>
              
              <ul className="space-y-2">
                {/* 1. Official Header */}
                <li className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    State/Ministry Letterhead Seals
                  </span>
                  {hasOfficialHeader ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </li>

                {/* 2. Reference numbers */}
                <li className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Standard File/Ref Codes (F.No/O.M.)
                  </span>
                  {hasReferenceNumber ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </li>

                {/* 3. gov domain or emails */}
                <li className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Official '.gov.in' / '.nic.in' Anchors
                  </span>
                  {hasGovDomainOrEmail ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </li>

                {/* 4. Official Sign-off and designation */}
                <li className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Official Sign-off Rank/Designation
                  </span>
                  {hasOfficialDesignation ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </li>
              </ul>
            </div>

            {/* Assessment feedback */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#D04A02]">
                    Detected Issuing Body
                  </h5>
                  <p className="text-xs font-extrabold text-gov-navy mt-1 leading-snug">
                    {governmentBodyName}
                  </p>
                </div>
                
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    NIC Security Assessment & Decision
                  </h5>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {relevanceExplanation}
                  </p>
                </div>
              </div>

              {/* Informative Footer banner inside panel */}
              <div className="flex gap-2 items-center bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-[10px] text-blue-700 leading-snug">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Directive:</strong> Ensure official files are only parsed from secure government portals. Report fake portals immediately.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
