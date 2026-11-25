/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OptimizationActionType =
  | 'ALTERNATIVE_MEDICATION'
  | 'DOSAGE_ADJUSTMENT'
  | 'DEPRESCRIBING'
  | 'TIMING_MODIFICATION';

export interface MedicationAlternativeSuggestion {
  id: string;
  findingId?: string; // Associated safety finding ID
  targetMedicationName: string;
  targetMedicationId?: string;
  currentDosage?: string;
  currentFrequency?: string;

  actionType: OptimizationActionType;
  suggestedMedicationName: string;
  suggestedDosage: string;
  suggestedFrequency: string;
  suggestedRoute: string;
  therapeuticClass: string;

  // Impact on Medication Safety Score
  riskMitigated: string;
  scoreImprovement: number; // e.g., +25 points
  projectedNewScore: number; // e.g., 85

  // Clinical reasoning & pharmacology
  clinicalRationale: string;
  safetyPros: string[];
  potentialTradeoffs: string[];
  monitoringParameters: string[];
  guidelineReference: string;
}

export interface RegimenOptimizationAnalysis {
  patientId: string;
  analyzedAt: string;
  currentScore: number;
  projectedOptimalScore: number;
  totalScoreImprovement: number;
  summary: string;
  suggestions: MedicationAlternativeSuggestion[];
  clinicalDisclaimer: string;
}
