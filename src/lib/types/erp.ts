export type AppRole = "admin" | "ventas" | "finanzas" | "bodega" | "rrhh";
export type ProfileStatus = "active" | "inactive";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "cancelled"
  | "overdue";

export type ReceivableStatus = "open" | "partial" | "settled" | "overdue";
export type CashMovementStatus = "pending" | "confirmed" | "reversed";
export type CashMovementKind = "income" | "expense";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  tenantId: string;
  tenantName: string;
}

export interface ManagedUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  status: ProfileStatus;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  rut: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpportunityRecord {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string;
  stage: "prospect" | "qualified" | "proposal" | "negotiation" | "closed";
  amount: number;
  notes: string | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type QuoteStatus = "draft" | "approved" | "rejected" | "converted";

export interface QuoteRecord {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string;
  customerRut: string | null;
  customerEmail: string | null;
  sourceOpportunityId: string | null;
  description: string;
  amount: number;
  notes: string | null;
  status: QuoteStatus;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceLineInput {
  productId?: string | null;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceLineRecord extends InvoiceLineInput {
  id: string;
  invoiceId: string;
  tenantId: string;
  lineTotal: number;
}

export interface InvoiceRecord {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerRut: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  items: InvoiceLineRecord[];
  outstandingBalance: number;
  dteType?: number;
  dteStatus?: "none" | "pending" | "accepted" | "rejected" | "failed";
  dteXmlUrl?: string | null;
  dtePdfUrl?: string | null;
  dteSiiMessage?: string | null;
  siiTrackId?: string | null;
}

export interface AccountsReceivableRecord {
  id: string;
  tenantId: string;
  invoiceId: string;
  balance: number;
  status: ReceivableStatus;
  dueDate: string;
  lastPaymentAt: string | null;
}

export interface CashMovementRecord {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string | null;
  kind: CashMovementKind;
  amount: number;
  movementDate: string;
  reference: string | null;
  paymentMethod: string | null;
  status: CashMovementStatus;
  createdAt?: string;
}

export interface CreateInvoiceInput {
  customer: {
    name: string;
    rut: string;
    email?: string | null;
  };
  issueDate: string;
  dueDate: string;
  currency: string;
  notes?: string | null;
  taxRate?: number;
  items: InvoiceLineInput[];
}

export interface IssueInvoiceResult {
  invoice: InvoiceRecord;
  receivable: AccountsReceivableRecord;
}

export interface RegisterPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  reference?: string | null;
  method?: string | null;
}

export interface SalesSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface DashboardMetrics {
  monthlySales: number;
  pendingInvoicesCount: number;
  grossMarginPercentage: number;
  stockAlertCount: number;
  revenueTrendTotal: number;
  revenueTrendGrowth: string;
  latestInvoices: InvoiceRecord[];
}

export interface FinanceMetrics {
  cashFlow: {
    availableCash: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netFlow: number;
    projectedCash: number;
    pendingReceivables: number;
    committedPayments: number;
    expenseDistribution: Array<{ category: string; amount: number; percentage: number }>;
    movements: CashMovementRecord[];
  };
  profitAndLoss: {
    totalRevenue: number;
    costOfSales: number;
    grossMarginAmount: number;
    grossMarginPercentage: number;
    operatingExpenses: number;
    netProfit: number;
    netMarginPercentage: number;
    roiPercentage: number;
  };
  reconciliation: {
    statementBalance: number;
    erpBalance: number;
    difference: number;
    matchedTransactions: number;
    discrepancyTransactions: number;
    pendingTransactions: number;
    totalTransactions: number;
    progressPercentage: number;
  };
}

export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
}
