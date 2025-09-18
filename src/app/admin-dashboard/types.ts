export type OverviewStats = {
  totalEmployees: number;
  pendingRequests: number;
  leavesThisMonth: number;
  annualLeaveUsage: string;
  monthlyLeaveStats: {
    特休: number;
    補休: number;
    事假: number;
    病假: number;
    喪假: number;
    育嬰假: number;
    產假: number;
    婚假: number;
  };
};

export type OverviewActivity = {
  time: string;
  employee: string;
  action: string;
  status: "pending" | "approved" | "rejected" | string;
};

export type OverviewResponse = {
  stats: OverviewStats;
  activities: OverviewActivity[];
};

export type EmployeeItem = {
  name: string;
  email: string;
  password: string;
  hireDate: string;
  department: string;
  特休: number;
  補休: number;
  事假: number;
  病假: number;
  喪假: number;
  育嬰假: number;
  產假: number;
  婚假: number;
  剩餘特休: number;
  剩餘補休: number;
  剩餘事假: number;
  剩餘病假: number;
  剩餘喪假: number;
  剩餘育嬰假: number;
  剩餘產假: number;
  剩餘婚假: number;
  notes: string;
};

export type RequestItem = {
  employee: string;
  date: string;
  type: string;
  days: number;
  remainingDays: number;
  status: "pending" | "approved" | "rejected" | string;
  id: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type OvertimeActivity = {
  id: string;
  name: string;
  date: string;
  hours: string;
  participants: string;
  participantNames: string;
  participantEmails: string[];
  description?: string;
  created_at?: string;
  updated_at?: string;
};
