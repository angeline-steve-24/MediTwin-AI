/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicationAlternativeSuggestion, RegimenOptimizationAnalysis } from '../../models/alternativeTypes';
import { useRouter } from '../../services/router';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Pill,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  FlaskConical,
  Activity,
  HeartPulse,
} from 'lucide-react';

interface RegimenOptimizationPanelProps {
  optimization: RegimenOptimizationAnalysis | null;
  isLoading: boolean;
  onRefresh: () => void;
  userRole: 'PATIENT' | 'DOCTOR';
  patientId?: string;
}

export const RegimenOptimizationPanel: React.FC<RegimenOptimizationPanelProps> = ({
  optimization,
  isLoading,
  onRefresh,
  userRole,
  patientId,
}) => {
  const { navigate } = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/60 p-6 sm:p-7 rounded-2xl border border-indigo-200/80 shadow-xs">
        <div className="flex items-center space-x-3 text-indigo-900">
          <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold">AI Clinical Engine Analyzing Regimen &amp; Formulating Alternatives...</h4>
            <p className="text-xs text-indigo-700/80">
              Evaluating drug-drug interactions, Beers criteria, and dosage adjustments to optimize your Medication Safety Score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!optimization) {
    return null;
  }

  const { currentScore, projectedOptimalScore, totalScoreImprovement, summary, suggestions, clinicalDisclaimer } = optimization;

  const handleCopySuggestion = (sug: MedicationAlternativeSuggestion) => {
    const text = `MEDiTWIN AI Medication Optimization Recommendation:
- Target Drug: ${sug.targetMedicationName} (${sug.currentDosage || 'Current dose'})
- Action: ${sug.actionType.replace('_', ' ')}
- Recommended Alternative: ${sug.suggestedMedicationName} ${sug.suggestedDosage} (${sug.suggestedFrequency})
- Risk Mitigated: ${sug.riskMitigated}
- Score Improvement: +${sug.scoreImprovement} points
- Clinical Rationale: ${sug.clinicalRationale}
- Monitoring: ${sug.monitoringParameters.join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sug.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulateInWhatIf = (sug: MedicationAlternativeSuggestion) => {
    const baseRoute = userRole === 'DOCTOR' ? '/doctor/simulator' : '/patient/simulator';
    const params = new URLSearchParams();
    if (patientId && userRole === 'DOCTOR') params.set('patientId', patientId);
    params.set('simMedName', sug.suggestedMedicationName);
    params.set('simMedDose', sug.suggestedDosage);
    params.set('simMedFreq', sug.suggestedFrequency);
    params.set('removeMedName', sug.targetMedicationName);
    navigate(`${baseRoute}?${params.toString()}`);
  };

  const getActionBadge = (type: MedicationAlternativeSuggestion['actionType']) => {
    switch (type) {
      case 'ALTERNATIVE_MEDICATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wide flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-teal-600" />
            <span>Switch to Alternate Drug</span>
          </span>
        );
      case 'DOSAGE_ADJUSTMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wide flex items-center space-x-1">
            <Activity className="w-2.5 h-2.5 text-sky-600" />
            <span>Dosage / Frequency Adjustment</span>
          </span>
        );
      case 'DEPRESCRIBING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide flex items-center space-x-1">
            <ShieldCheck className="w-2.5 h-2.5 text-purple-600" />
            <span>Deprescribing Candidate</span>
          </span>
        );
      case 'TIMING_MODIFICATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide flex items-center space-x-1">
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            <span>Dosing Schedule Shift</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/70 p-6 sm:p-7 rounded-2xl border border-indigo-200 shadow-xs space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Risk Optimization &amp; Medication Alternates</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Evidence-Based Alternate Medications &amp; Dosage Tuning
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Score Improvement Visual Card */}
        {totalScoreImprovement > 0 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-indigo-200 shadow-xs flex items-center space-x-4 shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current</span>
              <span className="text-xl font-black text-slate-700">{currentScore}</span>
              <span className="text-[10px] text-slate-400 font-semibold block">/ 100</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center space-x-0.5 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{totalScoreImprovement} pts</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Projected</span>
              <span className="text-2xl font-black text-emerald-600">{projectedOptimalScore}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">Optimal / 100</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Cards */}
      {suggestions.length === 0 ? (
        <div className="p-5 bg-white/80 rounded-xl border border-indigo-100 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">Current Regimen Already Optimized</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            No high-priority medication substitutions were detected. Your active medications have acceptable safety scores based on current documentation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recommended Clinical Substitutions &amp; Dosing Adjustments ({suggestions.length})
            </span>
            <button
              onClick={onRefresh}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
            >
              Re-evaluate Alternates
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {suggestions.map((sug) => {
              const isExpanded = expandedSuggestionId === sug.id;
              const isCopied = copiedId === sug.id;

              return (
                <div
                  key={sug.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 p-5 transition-all shadow-xs space-y-4"
                >
                  {/* Top Bar: Action badge & Score gain */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getActionBadge(sug.actionType)}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{sug.therapeuticClass}</span>
                    </div>

                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+{sug.scoreImprovement} Safety Pts</span>
                      <span className="text-emerald-700/70 font-normal">({sug.projectedNewScore}/100)</span>
                    </div>
                  </div>

                  {/* Before vs After Visual Comparison Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    {/* Current Problematic Drug */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-600 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Current High-Risk Regimen</span>
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                        <Pill className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{sug.targetMedicationName}</span>
                      </div>
                      {sug.currentDosage && (
                        <p className="text-xs text-slate-500">
                          Current Dose: <strong className="text-slate-700">{sug.currentDosage}</strong> {sug.currentFrequency && `• ${sug.currentFrequency}`}
                        </p>
                      )}
                      <p className="text-[11px] text-rose-700 font-medium">
                        Identified Issue: {sug.riskMitigated}
                      </p>
                    </div>

                    {/* AI Proposed Alternative */}
                    <div className="space-y-1 md:border-l md:border-slate-200 md:pl-3">
                      <span className="text-[10px] uppercase font-bold text-teal-600 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-teal-500" />
                        <span>AI Recommended Safer Alternative</span>
                      </span>
                      <div className="text-sm font-bold text-teal-900 flex items-center space-x-1.5">
                        <Pill className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{sug.suggestedMedicationName}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Proposed Regimen: <strong className="text-teal-950 font-bold">{sug.suggestedDosage}</strong> {sug.suggestedFrequency && `• ${sug.suggestedFrequency}`}
                      </p>
                      <p className="text-[11px] text-teal-800 font-medium">
                        Route: {sug.suggestedRoute}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Rationale */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-800 block">Pharmacological Rationale &amp; Evidence:</span>
                    <p className="text-slate-600 leading-relaxed bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/60">
                      {sug.clinicalRationale}
                    </p>
                  </div>

                  {/* Expandable Clinical Details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-100 space-y-3 text-xs animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 space-y-1">
                          <span className="font-bold text-emerald-900 block text-[11px]">Key Safety Advantages:</span>
                          <ul className="list-disc list-inside text-emerald-800 space-y-0.5 text-[11px]">
                            {sug.safetyPros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100 space-y-1">
                          <span className="font-bold text-amber-900 block text-[11px]">Tradeoffs &amp; Precautions:</span>
                          <ul className="list-disc list-inside text-amber-800 space-y-0.5 text-[11px]">
                            {sug.potentialTradeoffs.map((to, i) => (
                              <li key={i}>{to}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px]">Required Clinical Monitoring:</span>
                        <p className="text-[11px] text-slate-600">
                          {sug.monitoringParameters.join(' • ')}
                        </p>
                        <span className="text-[10px] text-slate-400 block pt-1 italic">
                          Reference: {sug.guidelineReference}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSuggestionId(isExpanded ? null : sug.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Less clinical details' : 'View safety pharmacology & monitoring'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCopySuggestion(sug)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
                        title="Copy structured prescription summary"
                      >
                        {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{isCopied ? 'Copied to Clipboard' : 'Copy Recommendation'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateInWhatIf(sug)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Simulate this alternate in the What-If Simulator"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Simulate in What-If</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regulatory & Clinical Disclaimer */}
      <div className="p-3 bg-white/70 rounded-xl border border-indigo-100 text-[11px] text-slate-500 flex items-start space-x-2 leading-relaxed">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700">Clinical Decision Support Advisory: </span>
          {clinicalDisclaimer}
        </div>
      </div>

    </div>
  );
};
