export interface PLData {
  period: string;
  netProfit: number;
  netProfitGrowth: string;
  totalRevenue: number;
  cogs: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  netMarginPercentage: number;
  roiPercentage: number;
  chartData: { month: string; percentage: number; isActive?: boolean }[];
}

export const mockPLData: PLData = {
  period: 'Junio 2024',
  netProfit: 45200000,
  netProfitGrowth: '+12.5%',
  totalRevenue: 120500000,
  cogs: 48200000,
  grossMarginAmount: 72300000,
  grossMarginPercentage: 60,
  operatingExpenses: 27100000,
  netMarginPercentage: 37.5,
  roiPercentage: 14.2,
  chartData: [
    { month: 'Ene', percentage: 40 },
    { month: 'Feb', percentage: 55 },
    { month: 'Mar', percentage: 45 },
    { month: 'Abr', percentage: 70 },
    { month: 'May', percentage: 60 },
    { month: 'Jun', percentage: 100, isActive: true },
  ]
};