import { z } from 'zod';

// ========== BUSINESS PLAN VALIDATION ==========
export const businessPlanSchema = z.object({
  incomeGoal: z.number()
    .min(1000, 'Income goal must be at least $1,000')
    .max(10000000, 'Income goal cannot exceed $10,000,000'),
  purchaseBps: z.number()
    .min(50, 'Purchase BPS must be at least 50')
    .max(500, 'Purchase BPS cannot exceed 500'),
  refinanceBps: z.number()
    .min(50, 'Refinance BPS must be at least 50')
    .max(500, 'Refinance BPS cannot exceed 500'),
  purchasePercentage: z.number()
    .min(0.01, 'Purchase percentage must be at least 1%')
    .max(0.99, 'Purchase percentage cannot exceed 99%'),
  avgLoanAmount: z.number()
    .min(50000, 'Average loan amount must be at least $50,000')
    .max(5000000, 'Average loan amount cannot exceed $5,000,000'),
  pullThroughPurchase: z.number()
    .min(0.01, 'Pull through must be at least 1%')
    .max(1.0, 'Pull through cannot exceed 100%'),
  pullThroughRefinance: z.number()
    .min(0.01, 'Pull through must be at least 1%')
    .max(1.0, 'Pull through cannot exceed 100%'),
  conversionRatePurchase: z.number()
    .min(0.01, 'Conversion rate must be at least 1%')
    .max(1.0, 'Conversion rate cannot exceed 100%'),
  conversionRateRefinance: z.number()
    .min(0.01, 'Conversion rate must be at least 1%')
    .max(1.0, 'Conversion rate cannot exceed 100%'),
  leadsFromPartnersPercentage: z.number()
    .min(0, 'Partners percentage must be at least 0%')
    .max(1.0, 'Partners percentage cannot exceed 100%'),
  leadsPerPartnerPerMonth: z.number()
    .min(0.5, 'Leads per partner must be at least 0.5')
    .max(20, 'Leads per partner cannot exceed 20'),
});

export type BusinessPlanFormData = z.infer<typeof businessPlanSchema>;

// ========== REVISION REQUEST VALIDATION ==========
export const revisionRequestSchema = z.object({
  fieldToChange: z.string().min(1, 'Field to change is required'),
  requestedValue: z.number().min(0, 'Value must be positive'),
  loJustification: z.string()
    .min(100, 'Justification must be at least 100 characters')
    .max(2000, 'Justification cannot exceed 2000 characters'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
});

export type RevisionRequestFormData = z.infer<typeof revisionRequestSchema>;

// ========== REVISION APPROVAL VALIDATION ==========
export const revisionApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected'], { required_error: 'Decision is required' }),
  managerNotes: z.string()
    .min(200, 'Manager notes must be at least 200 characters')
    .max(2000, 'Manager notes cannot exceed 2000 characters'),
});

export type RevisionApprovalFormData = z.infer<typeof revisionApprovalSchema>;

// ========== ACTUAL PRODUCTION VALIDATION ==========
export const actualProductionSchema = z.object({
  borrowerFullName: z.string()
    .min(2, 'Borrower name must be at least 2 characters')
    .max(100, 'Borrower name cannot exceed 100 characters'),
  loanNumber: z.string()
    .min(5, 'Loan number must be at least 5 characters')
    .max(50, 'Loan number cannot exceed 50 characters'),
  loanAmount: z.number()
    .min(1000, 'Loan amount must be at least $1,000')
    .max(100000000, 'Loan amount cannot exceed $100,000,000'),
  loBps: z.number()
    .min(0, 'LO BPS must be positive')
    .max(1000, 'LO BPS cannot exceed 1000'),
  loCompensation: z.number()
    .min(0, 'LO compensation must be positive'),
  transactionType: z.string().min(1, 'Transaction type is required'),
  loanType: z.enum(['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Non-QM', 'Other']),
  occupancy: z.enum(['Primary', 'Second Home', 'Investment']),
  loanStatus: z.string().optional(),
  lienPosition: z.string().optional(),
  closeDate: z.string().min(1, 'Close date is required'),
});

export type ActualProductionFormData = z.infer<typeof actualProductionSchema>;

// ========== HELPER VALIDATION FUNCTIONS ==========
export function validateBpsRange(bps: number): boolean {
  return bps >= 50 && bps <= 500;
}

export function validatePercentage(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function validateYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 5 && year <= currentYear + 5;
}

// ========== FIELD DISPLAY NAMES ==========
export const fieldDisplayNames: Record<string, string> = {
  incomeGoal: 'Income Goal',
  purchaseBps: 'Purchase BPS',
  refinanceBps: 'Refinance BPS',
  purchasePercentage: 'Purchase Percentage',
  avgLoanAmount: 'Average Loan Amount',
  pullThroughPurchase: 'Purchase Pull Through',
  pullThroughRefinance: 'Refinance Pull Through',
  conversionRatePurchase: 'Purchase Conversion Rate',
  conversionRateRefinance: 'Refinance Conversion Rate',
  leadsFromPartnersPercentage: 'Leads from Partners %',
  leadsPerPartnerPerMonth: 'Leads per Partner per Month',
};

export function formatFieldValue(fieldName: string, value: number): string {
  if (fieldName === 'incomeGoal' || fieldName === 'avgLoanAmount') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  }
  if (fieldName.includes('Bps')) return `${value} BPS`;
  if (fieldName.includes('Percentage') || fieldName.includes('Rate') || fieldName.includes('Through')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (fieldName === 'leadsPerPartnerPerMonth') return value.toFixed(1);
  return value.toString();
}

export const revisionFieldOptions = [
  { value: 'incomeGoal', label: 'Income Goal' },
  { value: 'purchaseBps', label: 'Purchase BPS' },
  { value: 'refinanceBps', label: 'Refinance BPS' },
  { value: 'purchasePercentage', label: 'Purchase Percentage' },
  { value: 'avgLoanAmount', label: 'Average Loan Amount' },
  { value: 'pullThroughPurchase', label: 'Purchase Pull Through' },
  { value: 'pullThroughRefinance', label: 'Refinance Pull Through' },
  { value: 'conversionRatePurchase', label: 'Purchase Conversion Rate' },
  { value: 'conversionRateRefinance', label: 'Refinance Conversion Rate' },
  { value: 'leadsFromPartnersPercentage', label: 'Leads from Partners %' },
  { value: 'leadsPerPartnerPerMonth', label: 'Leads per Partner per Month' },
];
