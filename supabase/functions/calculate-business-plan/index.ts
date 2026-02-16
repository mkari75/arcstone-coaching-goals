import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculationInputs {
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

function calculatePlan(inputs: CalculationInputs) {
  const {
    incomeGoal, purchaseBps, refinanceBps, purchasePercentage,
    avgLoanAmount, pullThroughPurchase, pullThroughRefinance,
    conversionRatePurchase, conversionRateRefinance,
    leadsFromPartnersPercentage, leadsPerPartnerPerMonth,
  } = inputs;

  const refinancePercentage = 1 - purchasePercentage;
  const weightedCommission = (purchasePercentage * (purchaseBps / 10000)) + (refinancePercentage * (refinanceBps / 10000));
  const annualVolumeGoal = weightedCommission > 0 ? incomeGoal / weightedCommission : 0;
  const annualUnitsGoal = avgLoanAmount > 0 ? Math.round(annualVolumeGoal / avgLoanAmount) : 0;

  const annualVolumePurchase = annualVolumeGoal * purchasePercentage;
  const annualVolumeRefinance = annualVolumeGoal * refinancePercentage;

  const annualUnitsPurchase = avgLoanAmount > 0 ? Math.round(annualVolumePurchase / avgLoanAmount) : 0;
  const annualUnitsRefinance = avgLoanAmount > 0 ? Math.round(annualVolumeRefinance / avgLoanAmount) : 0;

  const annualAppsPurchase = pullThroughPurchase > 0 ? Math.round(annualUnitsPurchase / pullThroughPurchase) : 0;
  const annualAppsRefinance = pullThroughRefinance > 0 ? Math.round(annualUnitsRefinance / pullThroughRefinance) : 0;
  const annualAppsTotal = annualAppsPurchase + annualAppsRefinance;

  const annualLeadsPurchase = conversionRatePurchase > 0 ? Math.round(annualAppsPurchase / conversionRatePurchase) : 0;
  const annualLeadsRefinance = conversionRateRefinance > 0 ? Math.round(annualAppsRefinance / conversionRateRefinance) : 0;
  const annualLeadsTotal = annualLeadsPurchase + annualLeadsRefinance;

  const annualPartnerLeads = Math.round(annualLeadsTotal * leadsFromPartnersPercentage);
  const annualSelfGenLeads = annualLeadsTotal - annualPartnerLeads;
  const monthlyPartnerLeads = Math.round(annualPartnerLeads / 12);
  const partnersNeeded = leadsPerPartnerPerMonth > 0 ? Math.ceil(monthlyPartnerLeads / leadsPerPartnerPerMonth) : 0;

  return {
    weightedCommission,
    annualVolumeGoal: Math.round(annualVolumeGoal),
    annualUnitsGoal,
    annualVolumePurchase: Math.round(annualVolumePurchase),
    annualVolumeRefinance: Math.round(annualVolumeRefinance),
    monthlyVolumeTotal: Math.round(annualVolumeGoal / 12),
    quarterlyVolume: Math.round(annualVolumeGoal / 4),
    annualUnitsPurchase,
    annualUnitsRefinance,
    monthlyUnitsTotal: Math.round(annualUnitsGoal / 12),
    annualAppsTotal,
    annualAppsPurchase,
    annualAppsRefinance,
    monthlyAppsTotal: Math.round(annualAppsTotal / 12),
    annualLeadsTotal,
    annualLeadsPurchase,
    annualLeadsRefinance,
    monthlyLeadsTotal: Math.round(annualLeadsTotal / 12),
    annualPartnerLeads,
    annualSelfGenLeads,
    partnersNeeded,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { inputs }: { inputs: CalculationInputs } = await req.json();
    const calculated = calculatePlan(inputs);

    return new Response(JSON.stringify(calculated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
