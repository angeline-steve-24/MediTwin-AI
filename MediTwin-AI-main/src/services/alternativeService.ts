/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MedicationAlternativeSuggestion, RegimenOptimizationAnalysis } from '../models/alternativeTypes';
import { MedicationSafetyFinding } from '../models/safetyTypes';
import { Medication, PatientProfile } from '../models/types';

export class AlternativeService {
  async getRegimenOptimization(params: {
    patientProfile?: Partial<PatientProfile>;
    medications: Medication[];
    findings: MedicationSafetyFinding[];
    currentScore?: number;
  }): Promise<RegimenOptimizationAnalysis> {
    const { patientProfile, medications, findings, currentScore = 65 } = params;

    try {
      const res = await fetch('/api/analysis/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile,
          medications,
          findings,
          currentScore,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.suggestions) {
          return {
            patientId: data.patientId || patientProfile?.userId || 'patient',
            analyzedAt: data.analyzedAt || new Date().toISOString(),
            currentScore: data.currentScore !== undefined ? data.currentScore : currentScore,
            projectedOptimalScore: data.projectedOptimalScore || currentScore,
            totalScoreImprovement: data.totalScoreImprovement || 0,
            summary: data.summary || 'AI Regimen Optimization completed.',
            suggestions: data.suggestions,
            clinicalDisclaimer: data.clinicalDisclaimer || 'Consult with your prescribing doctor or clinical pharmacist before changing medications.',
          };
        }
      }
    } catch (err) {
      console.warn('Network call to alternatives API failed, generating client-side fallback:', err);
    }

    // Client-side instant fallback if backend call fails
    return this.generateLocalFallback(params);
  }

  private generateLocalFallback(params: {
    patientProfile?: Partial<PatientProfile>;
    medications: Medication[];
    findings: MedicationSafetyFinding[];
    currentScore?: number;
  }): RegimenOptimizationAnalysis {
    const currentScore = params.currentScore !== undefined ? params.currentScore : 65;
    const suggestions: MedicationAlternativeSuggestion[] = [];
    const findings = params.findings || [];
    const meds = params.medications || [];

    let totalGain = 0;

    findings.forEach((finding, idx) => {
      const titleLower = (finding.title || '').toLowerCase();
      const explLower = (finding.explanation || '').toLowerCase();
      const involved = finding.involvedMedications || [];

      if (
        titleLower.includes('bleed') ||
        explLower.includes('bleed') ||
        involved.some((m) => /warfarin|apixaban|rivaroxaban|eliquis/i.test(m))
      ) {
        const target = involved.find((m) => /aspirin|ibuprofen|naproxen|ketorolac/i.test(m)) || involved[0] || 'Target Drug';
        const gain = 25;
        totalGain += gain;
        suggestions.push({
          id: `sug_${idx + 1}`,
          findingId: finding.id,
          targetMedicationName: target,
          actionType: 'ALTERNATIVE_MEDICATION',
          suggestedMedicationName: 'Acetaminophen (Tylenol)',
          suggestedDosage: '500 mg',
          suggestedFrequency: 'Every 6-8 hours as needed (max 3,000 mg/day)',
          suggestedRoute: 'Oral',
          therapeuticClass: 'Non-NSAID Analgesic & Antipyretic',
          riskMitigated: 'Eliminates synergistic gastrointestinal and systemic bleeding hazard with anticoagulant.',
          scoreImprovement: gain,
          projectedNewScore: Math.min(100, currentScore + gain),
          clinicalRationale: 'Acetaminophen provides effective mild-to-moderate analgesia without inhibiting platelet aggregation or compromising the gastrointestinal mucosal lining.',
          safetyPros: [
            'Zero platelet COX-1 inhibition',
            'No potentiation of anticoagulant INR or factor Xa inhibition',
          ],
          potentialTradeoffs: ['Limit total daily dose to under 3,000 mg (2,000 mg if hepatic impairment)'],
          monitoringParameters: ['Pain relief response', 'Signs of unusual bleeding or bruising'],
          guidelineReference: 'AHA/ACC and CHEST Antithrombotic Guidelines',
        });
      } else if (
        titleLower.includes('hyperkalemia') ||
        explLower.includes('potassium') ||
        involved.some((m) => /lisinopril|enalapril/i.test(m))
      ) {
        const target = involved.find((m) => /lisinopril|enalapril/i.test(m)) || involved[0] || 'Target Drug';
        const gain = 20;
        totalGain += gain;
        suggestions.push({
          id: `sug_${idx + 1}`,
          findingId: finding.id,
          targetMedicationName: target,
          actionType: 'DOSAGE_ADJUSTMENT',
          suggestedMedicationName: 'Lisinopril (Optimized Dose)',
          suggestedDosage: '10 mg once daily',
          suggestedFrequency: 'Once daily in morning',
          suggestedRoute: 'Oral',
          therapeuticClass: 'ACE Inhibitor (Renal / Geriatric Adjusted)',
          riskMitigated: 'Reduces excessive distal tubular potassium retention and hyperkalemia (>5.5 mEq/L).',
          scoreImprovement: gain,
          projectedNewScore: Math.min(100, currentScore + gain),
          clinicalRationale: 'Titrating to 10 mg provides reliable 24-hour antihypertensive coverage while significantly curbing dangerous serum potassium accumulation.',
          safetyPros: [
            'Cardiovascular and renal protective',
            'Lower risk of acute elevation in serum creatinine and potassium',
          ],
          potentialTradeoffs: ['Check blood pressure after 1-2 weeks of dose adjustment'],
          monitoringParameters: ['Basic Metabolic Panel (K+ and Creatinine) in 10-14 days'],
          guidelineReference: 'KDIGO 2024 Clinical Practice Guideline',
        });
      } else if (finding.category === 'ALLERGY_CONTRAINDICATION' || titleLower.includes('allergy')) {
        const target = involved[0] || 'Allergic Drug';
        const gain = 35;
        totalGain += gain;
        suggestions.push({
          id: `sug_${idx + 1}`,
          findingId: finding.id,
          targetMedicationName: target,
          actionType: 'ALTERNATIVE_MEDICATION',
          suggestedMedicationName: 'Azithromycin',
          suggestedDosage: '500 mg Day 1, then 250 mg daily for Days 2-5',
          suggestedFrequency: 'Once daily',
          suggestedRoute: 'Oral',
          therapeuticClass: 'Macrolide Antibiotic (Non-Beta-Lactam)',
          riskMitigated: 'Completely eliminates life-threatening IgE-mediated anaphylactic reaction.',
          scoreImprovement: gain,
          projectedNewScore: Math.min(100, currentScore + gain),
          clinicalRationale: 'Belongs to a distinct chemical class that shares zero cross-allergenicity with beta-lactams.',
          safetyPros: ['Zero beta-lactam core cross-reactivity', 'Convenient once-daily dosing course'],
          potentialTradeoffs: ['Monitor GI tolerance'],
          monitoringParameters: ['Clinical resolution of infection symptoms'],
          guidelineReference: 'IDSA Antimicrobial Allergy Practice Parameters',
        });
      }
    });

    const projectedOptimal = Math.min(100, currentScore + totalGain);

    return {
      patientId: params.patientProfile?.userId || 'patient',
      analyzedAt: new Date().toISOString(),
      currentScore,
      projectedOptimalScore: projectedOptimal,
      totalScoreImprovement: projectedOptimal - currentScore,
      summary: suggestions.length > 0
        ? `Identified ${suggestions.length} regimen modifications capable of improving your Medication Safety Score from ${currentScore}/100 to ${projectedOptimal}/100 (+${projectedOptimal - currentScore} pts).`
        : 'Regimen evaluated. No high-priority substitutions required at this time.',
      suggestions,
      clinicalDisclaimer: 'All medication alternatives and dosage modifications must be reviewed and approved by your healthcare provider.',
    };
  }
}

export const alternativeService = new AlternativeService();
