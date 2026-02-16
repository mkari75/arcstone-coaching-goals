// Business Plan Calculation Engine

export interface BusinessPlanInputs {
  incomeGoal: number;
  purchaseBps: number;
  refinanceBps: number;
  purchasePercentage: number;
  avgLoanAmount: number;
  pullThroughPurchase: number;
  pullThroughRefinance: number;
  conversionRatePurchase: number;
  conversionRateRefinance: number;
  leadsFromPartnersPercentage: number;
  leadsPerPartnerPerMonth: number;
}

export interface CalculatedGoals {
  weightedCommission: number;
  refinancePercentage: number;
  annualVolumeGoal: number;
  annualUnitsGoal: number;
  annualVolumePurchase: number;
  annualVolumeRefinance: number;
  monthlyVolumePurchase: number;
  monthlyVolumeRefinance: number;
  monthlyVolumeTotal: number;
  weeklyVolumePurchase: number;
  weeklyVolumeRefinance: number;
  weeklyVolumeTotal: number;
  dailyVolumePurchase: number;
  dailyVolumeRefinance: number;
  dailyVolumeTotal: number;
  annualUnitsPurchase: number;
  annualUnitsRefinance: number;
  monthlyUnitsPurchase: number;
  monthlyUnitsRefinance: number;
  monthlyUnitsTotal: number;
  weeklyUnitsPurchase: number;
  weeklyUnitsRefinance: number;
  weeklyUnitsTotal: number;
  dailyUnitsPurchase: number;
  dailyUnitsRefinance: number;
  dailyUnitsTotal: number;
  annualAppsPurchase: number;
  annualAppsRefinance: number;
  annualAppsTotal: number;
  monthlyAppsPurchase: number;
  monthlyAppsRefinance: number;
  monthlyAppsTotal: number;
  weeklyAppsPurchase: number;
  weeklyAppsRefinance: number;
  weeklyAppsTotal: number;
  dailyAppsPurchase: number;
  dailyAppsRefinance: number;
  dailyAppsTotal: number;
  annualLeadsPurchase: number;
  annualLeadsRefinance: number;
  annualLeadsTotal: number;
  monthlyLeadsTotal: number;
  weeklyLeadsTotal: number;
  dailyLeadsTotal: number;
  annualPartnerLeads: number;
  annualSelfGenLeads: number;
  monthlyPartnerLeads: number;
  monthlySelfGenLeads: number;
  partnersNeeded: number;
}

export function calculateBusinessPlan(inputs: BusinessPlanInputs): CalculatedGoals {
  const {
    incomeGoal, purchaseBps, refinanceBps, purchasePercentage,
    avgLoanAmount, pullThroughPurchase, pullThroughRefinance,
    conversionRatePurchase, conversionRateRefinance,
    leadsFromPartnersPercentage, leadsPerPartnerPerMonth,
  } = inputs;

  const refinancePercentage = 1 - purchasePercentage;
  const weightedCommission = (purchasePercentage * (purchaseBps / 10000)) + (refinancePercentage * (refinanceBps / 10000));
  const annualVolumeGoal = incomeGoal / weightedCommission;
  const annualUnitsGoal = Math.round(annualVolumeGoal / avgLoanAmount);

  // Volume breakdown
  const annualVolumePurchase = annualVolumeGoal * purchasePercentage;
  const annualVolumeRefinance = annualVolumeGoal * refinancePercentage;
  const monthlyVolumeTotal = annualVolumeGoal / 12;
  const monthlyVolumePurchase = annualVolumePurchase / 12;
  const monthlyVolumeRefinance = annualVolumeRefinance / 12;
  const weeklyVolumeTotal = monthlyVolumeTotal / 4;
  const weeklyVolumePurchase = monthlyVolumePurchase / 4;
  const weeklyVolumeRefinance = monthlyVolumeRefinance / 4;
  const dailyVolumeTotal = weeklyVolumeTotal / 5;
  const dailyVolumePurchase = weeklyVolumePurchase / 5;
  const dailyVolumeRefinance = weeklyVolumeRefinance / 5;

  // Units breakdown
  const annualUnitsPurchase = Math.round(annualVolumePurchase / avgLoanAmount);
  const annualUnitsRefinance = Math.round(annualVolumeRefinance / avgLoanAmount);
  const monthlyUnitsTotal = Math.round(annualUnitsGoal / 12);
  const monthlyUnitsPurchase = Math.round(annualUnitsPurchase / 12);
  const monthlyUnitsRefinance = Math.round(annualUnitsRefinance / 12);
  const weeklyUnitsTotal = Math.round(monthlyUnitsTotal / 4);
  const weeklyUnitsPurchase = Math.round(monthlyUnitsPurchase / 4);
  const weeklyUnitsRefinance = Math.round(monthlyUnitsRefinance / 4);
  const dailyUnitsTotal = Math.round(weeklyUnitsTotal / 5);
  const dailyUnitsPurchase = Math.round(weeklyUnitsPurchase / 5);
  const dailyUnitsRefinance = Math.round(weeklyUnitsRefinance / 5);

  // Applications (units / pull-through)
  const annualAppsPurchase = Math.round(annualUnitsPurchase / pullThroughPurchase);
  const annualAppsRefinance = Math.round(annualUnitsRefinance / pullThroughRefinance);
  const annualAppsTotal = annualAppsPurchase + annualAppsRefinance;
  const monthlyAppsPurchase = Math.round(annualAppsPurchase / 12);
  const monthlyAppsRefinance = Math.round(annualAppsRefinance / 12);
  const monthlyAppsTotal = monthlyAppsPurchase + monthlyAppsRefinance;
  const weeklyAppsPurchase = Math.round(monthlyAppsPurchase / 4);
  const weeklyAppsRefinance = Math.round(monthlyAppsRefinance / 4);
  const weeklyAppsTotal = weeklyAppsPurchase + weeklyAppsRefinance;
  const dailyAppsPurchase = Math.round(weeklyAppsPurchase / 5);
  const dailyAppsRefinance = Math.round(weeklyAppsRefinance / 5);
  const dailyAppsTotal = dailyAppsPurchase + dailyAppsRefinance;

  // Lead Generation (applications / conversion rate)
  const annualLeadsPurchase = Math.round(annualAppsPurchase / conversionRatePurchase);
  const annualLeadsRefinance = Math.round(annualAppsRefinance / conversionRateRefinance);
  const annualLeadsTotal = annualLeadsPurchase + annualLeadsRefinance;
  const monthlyLeadsTotal = Math.round(annualLeadsTotal / 12);
  const weeklyLeadsTotal = Math.round(monthlyLeadsTotal / 4);
  const dailyLeadsTotal = Math.round(weeklyLeadsTotal / 5);

  // Lead Sources
  const annualPartnerLeads = Math.round(annualLeadsTotal * leadsFromPartnersPercentage);
  const annualSelfGenLeads = annualLeadsTotal - annualPartnerLeads;
  const monthlyPartnerLeads = Math.round(annualPartnerLeads / 12);
  const monthlySelfGenLeads = Math.round(annualSelfGenLeads / 12);
  const partnersNeeded = Math.ceil(monthlyPartnerLeads / leadsPerPartnerPerMonth);

  return {
    weightedCommission, refinancePercentage, annualVolumeGoal, annualUnitsGoal,
    annualVolumePurchase, annualVolumeRefinance,
    monthlyVolumePurchase, monthlyVolumeRefinance, monthlyVolumeTotal,
    weeklyVolumePurchase, weeklyVolumeRefinance, weeklyVolumeTotal,
    dailyVolumePurchase, dailyVolumeRefinance, dailyVolumeTotal,
    annualUnitsPurchase, annualUnitsRefinance,
    monthlyUnitsPurchase, monthlyUnitsRefinance, monthlyUnitsTotal,
    weeklyUnitsPurchase, weeklyUnitsRefinance, weeklyUnitsTotal,
    dailyUnitsPurchase, dailyUnitsRefinance, dailyUnitsTotal,
    annualAppsPurchase, annualAppsRefinance, annualAppsTotal,
    monthlyAppsPurchase, monthlyAppsRefinance, monthlyAppsTotal,
    weeklyAppsPurchase, weeklyAppsRefinance, weeklyAppsTotal,
    dailyAppsPurchase, dailyAppsRefinance, dailyAppsTotal,
    annualLeadsPurchase, annualLeadsRefinance, annualLeadsTotal,
    monthlyLeadsTotal, weeklyLeadsTotal, dailyLeadsTotal,
    annualPartnerLeads, annualSelfGenLeads,
    monthlyPartnerLeads, monthlySelfGenLeads, partnersNeeded,
  };
}

export function calculateAchievement(actual: number, goal: number): number {
  if (goal === 0) return 0;
  return (actual / goal) * 100;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
