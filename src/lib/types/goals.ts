// ========== ENUMS ==========
export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Jumbo' | 'Non-QM' | 'Other';
export type OccupancyType = 'Primary' | 'Second Home' | 'Investment';
export type PlanStatus = 'draft' | 'active' | 'revised';
export type RevisionStatus = 'pending' | 'approved' | 'rejected';
export type AuditAction = 'created' | 'revised' | 'approved' | 'rejected';

// ========== BUSINESS PLAN ==========
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

export interface BusinessPlan extends BusinessPlanInputs {
  id: string;
  userId: string;
  planYear: number;
  status: PlanStatus;
  isOriginal: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== ACTUAL PRODUCTION ==========
export interface ActualProduction {
  id: string;
  userId: string;
  borrowerFullName: string;
  loanNumber: string;
  loanAmount: number;
  loBps: number;
  loCompensation: number;
  transactionType: string;
  loanType: LoanType;
  occupancy: OccupancyType;
  loanStatus: string;
  lienPosition?: string;
  closeDate: string;
  year: number;
  quarter: number;
  createdAt: string;
}

export interface ActualProductionRow {
  id: string;
  user_id: string;
  borrower_full_name: string;
  loan_number: string;
  loan_amount: number;
  lo_bps: number;
  lo_compensation: number;
  transaction_type: string;
  loan_type: LoanType;
  occupancy: OccupancyType;
  loan_status: string;
  lien_position?: string;
  close_date: string;
  year: number;
  quarter: number;
  created_at: string;
}

// ========== PLAN REVISIONS ==========
export interface PlanRevision {
  id: string;
  originalPlanId: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  loJustification: string;
  effectiveDate: string;
  status: RevisionStatus;
  fieldToChange: string;
  currentValue: number;
  requestedValue: number;
  reviewedBy?: string;
  reviewedAt?: string;
  managerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRevisionRow {
  id: string;
  original_plan_id: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  lo_justification: string;
  effective_date: string;
  status: RevisionStatus;
  field_to_change: string;
  current_value: number;
  requested_value: number;
  reviewed_by?: string;
  reviewed_at?: string;
  manager_notes?: string;
  created_at: string;
  updated_at: string;
}

// ========== AUDIT ENTRIES ==========
export interface AuditEntry {
  id: string;
  date: string;
  loanOfficer: string;
  action: AuditAction;
  details: string;
  approvedBy?: string;
  loJustification?: string;
  managerNotes?: string;
  fieldChanges?: Record<string, any>;
  createdAt: string;
}

export interface AuditEntryRow {
  id: string;
  date: string;
  loan_officer: string;
  action: AuditAction;
  details: string;
  approved_by?: string;
  lo_justification?: string;
  manager_notes?: string;
  field_changes?: any;
  created_at: string;
}

// ========== CHART CONFIGS ==========
export interface ChartCategory {
  value: string;
  label: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  dbColumn: string;
  categories: ChartCategory[];
  sortOrder: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChartConfigRow {
  id: string;
  title: string;
  db_column: string;
  categories: any;
  sort_order: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbColumnOption {
  id: string;
  columnName: string;
  displayLabel: string;
  sortOrder: number;
  createdBy?: string;
  createdAt: string;
}

export interface DbColumnOptionRow {
  id: string;
  column_name: string;
  display_label: string;
  sort_order: number;
  created_by?: string;
  created_at: string;
}

// ========== PERFORMANCE METRICS ==========
export interface PerformanceMetrics {
  ytdVolume: number;
  ytdUnits: number;
  ytdProfit: number;
  purchaseMix: number;
  volumeGoal: number;
  unitsGoal: number;
  incomeGoal: number;
  volumeAchievement: number;
  unitsAchievement: number;
  profitAchievement: number;
}

// ========== PERIOD AGGREGATES ==========
export interface MonthlyAggregate {
  month: number;
  monthName: string;
  volume: number;
  units: number;
  compensation: number;
  volumeGoal: number;
  unitsGoal: number;
}

export interface QuarterlyAggregate {
  quarter: number;
  volume: number;
  units: number;
  volumeGoal: number;
  unitsGoal: number;
}

// ========== MAPPERS ==========
export function mapBusinessPlan(row: any): BusinessPlan {
  return {
    id: row.id,
    userId: row.user_id,
    planYear: row.plan_year,
    status: row.status,
    isOriginal: row.is_original,
    incomeGoal: parseFloat(row.income_goal),
    purchaseBps: parseFloat(row.purchase_bps),
    refinanceBps: parseFloat(row.refinance_bps),
    purchasePercentage: parseFloat(row.purchase_percentage),
    avgLoanAmount: parseFloat(row.avg_loan_amount),
    pullThroughPurchase: parseFloat(row.pull_through_purchase),
    pullThroughRefinance: parseFloat(row.pull_through_refinance),
    conversionRatePurchase: parseFloat(row.conversion_rate_purchase),
    conversionRateRefinance: parseFloat(row.conversion_rate_refinance),
    leadsFromPartnersPercentage: parseFloat(row.leads_from_partners_percentage),
    leadsPerPartnerPerMonth: parseFloat(row.leads_per_partner_per_month),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActualProduction(row: ActualProductionRow): ActualProduction {
  return {
    id: row.id,
    userId: row.user_id,
    borrowerFullName: row.borrower_full_name,
    loanNumber: row.loan_number,
    loanAmount: parseFloat(String(row.loan_amount)),
    loBps: parseFloat(String(row.lo_bps)),
    loCompensation: parseFloat(String(row.lo_compensation)),
    transactionType: row.transaction_type,
    loanType: row.loan_type,
    occupancy: row.occupancy,
    loanStatus: row.loan_status,
    lienPosition: row.lien_position,
    closeDate: row.close_date,
    year: row.year,
    quarter: row.quarter,
    createdAt: row.created_at,
  };
}

export function mapPlanRevision(row: PlanRevisionRow): PlanRevision {
  return {
    id: row.id,
    originalPlanId: row.original_plan_id,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    requestedAt: row.requested_at,
    loJustification: row.lo_justification,
    effectiveDate: row.effective_date,
    status: row.status,
    fieldToChange: row.field_to_change,
    currentValue: parseFloat(String(row.current_value)),
    requestedValue: parseFloat(String(row.requested_value)),
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    managerNotes: row.manager_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuditEntry(row: AuditEntryRow): AuditEntry {
  return {
    id: row.id,
    date: row.date,
    loanOfficer: row.loan_officer,
    action: row.action,
    details: row.details,
    approvedBy: row.approved_by,
    loJustification: row.lo_justification,
    managerNotes: row.manager_notes,
    fieldChanges: row.field_changes,
    createdAt: row.created_at,
  };
}

export function mapChartConfig(row: ChartConfigRow): ChartConfig {
  return {
    id: row.id,
    title: row.title,
    dbColumn: row.db_column,
    categories: Array.isArray(row.categories) ? row.categories : JSON.parse(row.categories as string),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbColumnOption(row: DbColumnOptionRow): DbColumnOption {
  return {
    id: row.id,
    columnName: row.column_name,
    displayLabel: row.display_label,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
