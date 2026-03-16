export interface RepSalesperson {
  id: string;
  name: string;
  sales: number;
  percentage: number;
  avatarUrl: string;
}

export const mockBIMetrics = {
  totalRevenue: 1284500,
  revenueGrowth: 12.3,
  grossMargin: 42.5,
  marginGrowth: 2.1,
  cac: 150.20,
  cacImprovement: 5.4,
};

export const mockTopSalesReps: RepSalesperson[] = [
  {
    id: '1',
    name: 'Jane Cooper',
    sales: 245000,
    percentage: 95,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEtXzvsQ_hXUWRpYqcexkdZMNja7NuIlrdo9FPFwVpqks4nkaHQysC-xhQJZkZRn5yIzvU9hvtY8KAJvKB87IXdraT45xO2MvqUYOqkS427LyI8hi_iZ_LvJGgAD7_-Ie6r2BJfmwJetfLepZfcXtho-kMQY5mO33jMh4pI_Qb1n8L9FLh2A9KftGrtv1TT78Jm1J4iHTF0frgiXzlztT1wTDVQiuXocLaaZiTlnGZqpz8N8oMjJ1SSuAlxXI4pbeEMZUDSpJFbV8'
  },
  {
    id: '2',
    name: 'Alex Rivera',
    sales: 182300,
    percentage: 70,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5yv6Wy8cE5Z-F4WgK6ejEoqO6YegYhvMdV89-9bwbk9dJJt0mDj_Bo8vHwcVURrmSIfubFQatMRzEmzsTbz3pMUuO7cxECVbgMosnocrNn5UumV1SQqB3LzwpX7yd-0dM9lSavEjyWIfy1Z6ijZHju4GN_HHorJ8uMyPX0_we9dNoWkycq5hGWJVgvsjACgDpTI64M1I9UTHFPmk7-PAuPXI1E-P33rzQWnNB1ZBgTTye5cxowTc99DA-JPT4zeIVlyFYxvC_Gn0'
  },
  {
    id: '3',
    name: 'Marcus Smith',
    sales: 142000,
    percentage: 55,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoEoqcbwD6YAyKBWJH6RXXjhCkF0xSJ9H4XCmqYX09z46Pog9KPBPdOIp1GWj5BQ-1hfdLtmkXR1emCx0VpKWPuyqOZQ37tdCakDABQxd5EBOEYQiAH1Rht6Sw2Q7CTetuoMIw15ddqnKRk7cS55x-6swSiwk1FJWFPe_BEMO4wYSja__wuKH35qWf00xJiXZqKTRPSardYGEW1vgr3uB86z-4AOVjzFh6NxpcVCZ2o5q8kXPJNj1sHDC_jBM-5K5_QnBl51zCJzk'
  }
];