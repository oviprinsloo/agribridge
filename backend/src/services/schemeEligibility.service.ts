import prisma from '../config/database';
import { SchemeEligibilityResult } from '../types';

export interface EligibilityInput {
  state: string;
  totalLandAcres: number;
  cropsGrown?: string[];
  farmerCategory?: string; // e.g. "Marginal (Under 2.5 acres)", "Small (2.5 to 5 acres)", "Medium (5 to 10 acres)", "Large (>10 acres)"
  annualIncome?: number;
  hasIrrigation?: boolean;
}

export class SchemeEligibilityService {
  /**
   * Evaluates a farmer profile or input criteria against all active government schemes
   */
  async evaluateEligibility(input: EligibilityInput): Promise<{
    results: SchemeEligibilityResult[];
    disclaimer: string;
  }> {
    const schemes = await prisma.governmentScheme.findMany({
      where: { isActive: true },
    });

    const evaluatedResults: SchemeEligibilityResult[] = [];

    for (const scheme of schemes) {
      const reasons: string[] = [];
      let isEligible = true;
      let isPossible = false;

      // 1. State check
      if (scheme.state !== 'All India' && scheme.state.toLowerCase() !== input.state.toLowerCase()) {
        isEligible = false;
        reasons.push(`Scheme is restricted to farmers in ${scheme.state} (your location: ${input.state}).`);
      } else {
        reasons.push(`State requirement met: Applicable in ${scheme.state}.`);
      }

      // 2. Land Acre Criteria
      if (scheme.maxLandAcres !== null && input.totalLandAcres > scheme.maxLandAcres) {
        isEligible = false;
        reasons.push(`Your land holding (${input.totalLandAcres} acres) exceeds the maximum ceiling of ${scheme.maxLandAcres} acres.`);
      } else if (scheme.minLandAcres !== null && input.totalLandAcres < scheme.minLandAcres) {
        isEligible = false;
        reasons.push(`Minimum land size required is ${scheme.minLandAcres} acres.`);
      } else {
        reasons.push(`Land size criteria satisfied (${input.totalLandAcres} acres).`);
      }

      // 3. Annual Income criteria
      if (scheme.maxAnnualIncome !== null && input.annualIncome && input.annualIncome > scheme.maxAnnualIncome) {
        isEligible = false;
        reasons.push(`Reported income exceeds the income threshold of ₹${scheme.maxAnnualIncome.toLocaleString('en-IN')}.`);
      }

      // 4. Crop category matching
      try {
        const applicableCrops: string[] = JSON.parse(scheme.applicableCropsJson || '["All"]');
        if (!applicableCrops.includes('All') && input.cropsGrown && input.cropsGrown.length > 0) {
          const hasOverlap = input.cropsGrown.some((c) =>
            applicableCrops.some((ac) => ac.toLowerCase() === c.toLowerCase())
          );
          if (!hasOverlap) {
            isPossible = true; // Still possibly eligible if they cultivate next season
            reasons.push(`Primarily designated for crops: ${applicableCrops.join(', ')}.`);
          } else {
            reasons.push(`Cultivated crop matches eligible category.`);
          }
        }
      } catch (e) {
        // Default to All
      }

      let status: 'ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'NOT_ELIGIBLE' = 'NOT_ELIGIBLE';
      if (isEligible) {
        status = isPossible ? 'POSSIBLY_ELIGIBLE' : 'ELIGIBLE';
      } else if (reasons.filter((r) => r.includes('exceeds') || r.includes('restricted')).length === 1) {
        status = 'POSSIBLY_ELIGIBLE';
      }

      evaluatedResults.push({
        schemeId: scheme.id,
        schemeName: scheme.schemeName,
        shortCode: scheme.shortCode,
        ministry: scheme.ministry,
        status,
        benefitAmount: scheme.benefitAmount || undefined,
        benefitsDescription: scheme.benefitsDescription,
        applicationUrl: scheme.applicationUrl,
        reasons,
      });
    }

    // Sort by ELIGIBLE first, then POSSIBLY_ELIGIBLE, then NOT_ELIGIBLE
    const statusOrder = { ELIGIBLE: 1, POSSIBLY_ELIGIBLE: 2, NOT_ELIGIBLE: 3 };
    evaluatedResults.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return {
      results: evaluatedResults,
      disclaimer:
        'Scheme eligibility shown here is an informational estimate. Eligibility criteria and required documentation are determined by the respective government ministries. Verify requirements on the official government portal before applying.',
    };
  }
}

export const schemeEligibilityService = new SchemeEligibilityService();
