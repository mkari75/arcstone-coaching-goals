import { describe, it, expect } from 'vitest';
import { calculateBusinessPlan, calculateAchievement, formatCurrency, formatPercentage, formatCurrencyShort } from '../calculations';
import type { BusinessPlanInputs } from '../calculations';

const defaultInputs: BusinessPlanInputs = {
  incomeGoal: 250000,
  purchaseBps: 200,
  refinanceBps: 150,
  purchasePercentage: 0.6,
  avgLoanAmount: 425000,
  pullThroughPurchase: 0.5,
  pullThroughRefinance: 0.5,
  conversionRatePurchase: 0.5,
  conversionRateRefinance: 0.5,
  leadsFromPartnersPercentage: 0.5,
  leadsPerPartnerPerMonth: 3,
};

describe('calculateBusinessPlan', () => {
  it('calculates correct weighted commission', () => {
    const result = calculateBusinessPlan(defaultInputs);
    // (0.6 * 200/10000) + (0.4 * 150/10000) = 0.012 + 0.006 = 0.018
    expect(result.weightedCommission).toBeCloseTo(0.018, 4);
  });

  it('calculates correct annual volume goal', () => {
    const result = calculateBusinessPlan(defaultInputs);
    // 250000 / 0.018 = 13,888,888.89
    expect(result.annualVolumeGoal).toBeCloseTo(13888888.89, 0);
  });

  it('calculates correct annual units goal', () => {
    const result = calculateBusinessPlan(defaultInputs);
    // 13888888.89 / 425000 ≈ 33
    expect(result.annualUnitsGoal).toBe(Math.round(13888888.89 / 425000));
  });

  it('calculates correct purchase/refinance volume split', () => {
    const result = calculateBusinessPlan(defaultInputs);
    expect(result.annualVolumePurchase).toBeCloseTo(result.annualVolumeGoal * 0.6, 0);
    expect(result.annualVolumeRefinance).toBeCloseTo(result.annualVolumeGoal * 0.4, 0);
  });

  it('calculates monthly breakdowns', () => {
    const result = calculateBusinessPlan(defaultInputs);
    expect(result.monthlyVolumeTotal).toBeCloseTo(result.annualVolumeGoal / 12, 0);
    expect(result.monthlyUnitsTotal).toBe(Math.round(result.annualUnitsGoal / 12));
  });

  it('calculates applications from pull-through rates', () => {
    const result = calculateBusinessPlan(defaultInputs);
    // apps = units / pull-through
    expect(result.annualAppsPurchase).toBe(Math.round(result.annualUnitsPurchase / 0.5));
    expect(result.annualAppsRefinance).toBe(Math.round(result.annualUnitsRefinance / 0.5));
  });

  it('calculates leads from conversion rates', () => {
    const result = calculateBusinessPlan(defaultInputs);
    expect(result.annualLeadsPurchase).toBe(Math.round(result.annualAppsPurchase / 0.5));
    expect(result.annualLeadsRefinance).toBe(Math.round(result.annualAppsRefinance / 0.5));
  });

  it('calculates partner and self-gen lead split', () => {
    const result = calculateBusinessPlan(defaultInputs);
    expect(result.annualPartnerLeads).toBe(Math.round(result.annualLeadsTotal * 0.5));
    expect(result.annualSelfGenLeads).toBe(result.annualLeadsTotal - result.annualPartnerLeads);
  });

  it('calculates partners needed', () => {
    const result = calculateBusinessPlan(defaultInputs);
    const monthlyPartner = Math.round(result.annualPartnerLeads / 12);
    expect(result.partnersNeeded).toBe(Math.ceil(monthlyPartner / 3));
  });

  it('handles zero income goal', () => {
    const result = calculateBusinessPlan({ ...defaultInputs, incomeGoal: 0 });
    expect(result.annualVolumeGoal).toBe(0);
    expect(result.annualUnitsGoal).toBe(0);
    expect(result.annualAppsTotal).toBe(0);
    expect(result.annualLeadsTotal).toBe(0);
  });

  it('handles 100% purchase mix', () => {
    const result = calculateBusinessPlan({ ...defaultInputs, purchasePercentage: 1.0 });
    expect(result.annualVolumeRefinance).toBe(0);
    expect(result.annualUnitsRefinance).toBe(0);
  });
});

describe('calculateAchievement', () => {
  it('calculates percentage correctly', () => {
    expect(calculateAchievement(50000, 100000)).toBe(50);
    expect(calculateAchievement(100000, 100000)).toBe(100);
  });

  it('handles zero goal', () => {
    expect(calculateAchievement(50000, 0)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(250000)).toBe('$250,000');
    expect(formatCurrency(1500000)).toBe('$1,500,000');
  });
});

describe('formatCurrencyShort', () => {
  it('formats millions', () => {
    expect(formatCurrencyShort(1500000)).toBe('$1.5M');
  });
  it('formats thousands', () => {
    expect(formatCurrencyShort(250000)).toBe('$250K');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.6)).toBe('60.0%');
    expect(formatPercentage(0.125)).toBe('12.5%');
  });
});
