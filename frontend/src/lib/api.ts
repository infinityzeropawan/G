/**
 * GymSmart API Client
 * Centralised fetch wrapper for all backend API calls.
 * Base URL: http://localhost:5000/api
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── User Helper (reads from non-HttpOnly cookie set by server) ───────────────

export function getUser(): { name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const c = document.cookie.split(';').find(x => x.trim().startsWith('gymsmart_user='));
  if (!c) return null;
  try { return JSON.parse(decodeURIComponent(c.split('=').slice(1).join('='))); } catch { return null; }
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.replace('/login');
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = true, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  // Token is in HttpOnly cookie — read via Next.js proxy to avoid CORS/exposure
  if (auth) {
    const tokenRes = await fetch('/api/auth/token').catch(() => null);
    if (tokenRes?.ok) {
      const { token } = await tokenRes.json();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      // Session expired — clear cookies and redirect
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.replace('/login');
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(json.message || `API Error: ${res.status}`);
  }

  return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ success: boolean; data: { accessToken: string; user: unknown } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }), auth: false }
    ),

  me: () => apiFetch('/auth/me'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => apiFetch<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
};

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalStaff: number;
  activeStaff: number;
  totalProducts: number;
  lowStockCount: number;
  totalInquiries: number;
  newInquiries: number;
  memberGrowth: { month: string; count: number }[];
  revenueChart: { month: string; revenue: number }[];
  membersByPlan: { plan: string; count: number }[];
  membersByStatus: { active: number; pending: number; expired: number };
  recentMembers: RecentMember[];
  recentPayments: RecentPayment[];
  pendingPaymentsList: PendingPayment[];
}

export interface RecentMember {
  id: number; name: string; plan: { id: number; name: string; tier: string }; status: string;
  joinDate: string; paidAmount: number;
}
export interface RecentPayment {
  id: number; invoiceNo: string; amount: number; method: string; paidAt: string;
  member: { name: string };
}
export interface PendingPayment {
  id: number; name: string; pendingAmount: number; expiryDate: string;
}

// ─── Members ──────────────────────────────────────────────────────────────────

export const membersApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: { members: Member[]; total: number; page: number; limit: number } }>(`/members${q}`);
  },
  getOne: (id: number) => apiFetch<{ success: boolean; data: Member }>(`/members/${id}`),
  getStats: () => apiFetch<{ success: boolean; data: MemberStats }>('/members/stats'),
  create: (body: Partial<Member>) =>
    apiFetch('/members', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Member>) =>
    apiFetch(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/members/${id}`, { method: 'DELETE' }),
  renew: (id: number, body: unknown) =>
    apiFetch(`/members/${id}/renew`, { method: 'POST', body: JSON.stringify(body) }),
};

export interface Member {
  id: number; name: string; email: string; phone: string;
  gender: string; address?: string; branch: string;
  planId: number; plan?: { id: number; name: string; tier: string };
  billingCycle: string; status: string;
  joinDate: string; expiryDate: string;
  paidAmount: number; pendingAmount: number; photo?: string;
  createdAt: string;
}
export interface MemberStats {
  total: number; active: number; pending: number; expired: number;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plansApi = {
  getAll: () => apiFetch<{ success: boolean; data: Plan[] }>('/plans'),
  getOne: (id: number) => apiFetch<{ success: boolean; data: Plan }>(`/plans/${id}`),
  create: (body: Partial<Plan>) =>
    apiFetch('/plans', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Plan>) =>
    apiFetch(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/plans/${id}`, { method: 'DELETE' }),
};

export interface Plan {
  id: number; name: string; tier: string;
  price1Month: number; price3Month: number;
  price6Month: number; price12Month: number;
  features: string[]; isActive: boolean;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export const financeApi = {
  getPayments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: { payments: Payment[]; total: number } }>(`/finance/payments${q}`);
  },
  createPayment: (body: Partial<Payment>) =>
    apiFetch('/finance/payments', { method: 'POST', body: JSON.stringify(body) }),
  getSummary: () => apiFetch<{ success: boolean; data: FinanceSummary }>('/finance/summary'),
  getByMember: (memberId: number) =>
    apiFetch<{ success: boolean; data: Payment[] }>(`/finance/payments/member/${memberId}`),
};

export interface Payment {
  id: number; memberId: number; amount: number; method: string;
  status: string; notes?: string; invoiceNo: string; paidAt: string;
  member?: { name: string; email: string; phone: string; plan?: { name: string } };
}
export interface FinanceSummary {
  totalRevenue: number; monthlyRevenue: number; pendingAmount: number;
  totalPayments: number;
  revenueByMethod: { UPI: number; Cash: number; Card: number; NetBanking: number };
  monthlyData: { month: string; revenue: number }[];
}

// ─── HR ───────────────────────────────────────────────────────────────────────

export const hrApi = {
  getStaff: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: Staff[] }>(`/hr/staff${q}`);
  },
  getOneStaff: (id: number) => apiFetch<{ success: boolean; data: Staff }>(`/hr/staff/${id}`),
  createStaff: (body: Partial<Staff>) =>
    apiFetch('/hr/staff', { method: 'POST', body: JSON.stringify(body) }),
  updateStaff: (id: number, body: Partial<Staff>) =>
    apiFetch(`/hr/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeStaff: (id: number) => apiFetch(`/hr/staff/${id}`, { method: 'DELETE' }),
  getPayrolls: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: Payroll[] }>(`/hr/payrolls${q}`);
  },
  createPayroll: (body: Partial<Payroll>) =>
    apiFetch('/hr/payrolls', { method: 'POST', body: JSON.stringify(body) }),
  updatePayrollStatus: (id: number, status: string) =>
    apiFetch(`/hr/payrolls/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getSummary: () => apiFetch<{ success: boolean; data: HrSummary }>('/hr/summary'),
};

export interface Staff {
  id: number; name: string; email: string; phone: string;
  role: string; salary: number; branch: string; gender: string;
  address?: string; joinDate: string; isActive: boolean;
}
export interface Payroll {
  id: number; staffId: number; month: string; amount: number;
  status: string; paidAt?: string; notes?: string;
  staff?: { name: string; role: string };
}
export interface HrSummary {
  totalStaff: number; activeStaff: number;
  totalPayrollThisMonth: number; paidCount: number; pendingCount: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  mark: (body: { memberId?: number; staffId?: number; date: string; checkIn?: string; type: string }) =>
    apiFetch('/attendance', { method: 'POST', body: JSON.stringify(body) }),
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: Attendance[] }>(`/attendance${q}`);
  },
  getTodayStats: () =>
    apiFetch<{ success: boolean; data: { totalCheckIns: number; memberCheckIns: number; staffCheckIns: number } }>(
      '/attendance/today-stats'
    ),
};

export interface Attendance {
  id: number; memberId?: number; staffId?: number;
  date: string; checkIn?: string; checkOut?: string; type: string;
  member?: { name: string }; staff?: { name: string };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const storeApi = {
  getProducts: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: Product[] }>(`/store/products${q}`);
  },
  createProduct: (body: Partial<Product>) =>
    apiFetch('/store/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number, body: Partial<Product>) =>
    apiFetch(`/store/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeProduct: (id: number) => apiFetch(`/store/products/${id}`, { method: 'DELETE' }),
  getOrders: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: { orders: Order[]; total: number } }>(`/store/orders${q}`);
  },
  createOrder: (body: { items: { productId: number; qty: number }[]; method: string; notes?: string }) =>
    apiFetch('/store/orders', { method: 'POST', body: JSON.stringify(body) }),
  getStoreSummary: () => apiFetch<{ success: boolean; data: StoreSummary }>('/store/summary'),
};

export interface Product {
  id: number; name: string; category: string; price: number;
  stock: number; description?: string; imageUrl?: string; isActive: boolean;
}
export interface Order {
  id: number; total: number; method: string; status: string;
  notes?: string; createdAt: string;
  items?: { id: number; qty: number; price: number; product: { name: string } }[];
}
export interface StoreSummary {
  totalProducts: number; totalOrders: number;
  totalRevenue: number; lowStockProducts: Product[];
}

// ─── Workout ──────────────────────────────────────────────────────────────────

export const workoutApi = {
  getExercises: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: Exercise[] }>(`/workout/exercises${q}`);
  },
  createExercise: (body: Partial<Exercise>) =>
    apiFetch('/workout/exercises', { method: 'POST', body: JSON.stringify(body) }),
  updateExercise: (id: number, body: Partial<Exercise>) =>
    apiFetch(`/workout/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeExercise: (id: number) => apiFetch(`/workout/exercises/${id}`, { method: 'DELETE' }),
  getDietPlans: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: DietPlan[] }>(`/workout/diet-plans${q}`);
  },
  createDietPlan: (body: Partial<DietPlan>) =>
    apiFetch('/workout/diet-plans', { method: 'POST', body: JSON.stringify(body) }),
  updateDietPlan: (id: number, body: Partial<DietPlan>) =>
    apiFetch(`/workout/diet-plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeDietPlan: (id: number) => apiFetch(`/workout/diet-plans/${id}`, { method: 'DELETE' }),
};

export interface Exercise {
  id: number; name: string; category: string; muscleGroup: string[];
  sets?: number; reps?: string; duration?: string;
  difficulty: string; description?: string; videoUrl?: string; imageUrl?: string; isActive: boolean;
}
export interface DietPlan {
  id: number; name: string; goal: string;
  calories?: number; protein?: number; carbs?: number; fats?: number;
  description?: string; meals: string[]; isActive: boolean;
}

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const inquiriesApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; data: { inquiries: Inquiry[]; total: number } }>(`/inquiries${q}`);
  },
  getOne: (id: number) => apiFetch<{ success: boolean; data: Inquiry }>(`/inquiries/${id}`),
  getStats: () => apiFetch<{ success: boolean; data: InquiryStats }>('/inquiries/stats'),
  create: (body: Partial<Inquiry>) =>
    apiFetch('/inquiries', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Inquiry>) =>
    apiFetch(`/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch(`/inquiries/${id}`, { method: 'DELETE' }),
};

export interface Inquiry {
  id: number; name: string; phone: string; email?: string;
  interest: string; status: string; source?: string;
  notes?: string; followUpDate?: string; createdAt: string;
}
export interface InquiryStats {
  total: number; new: number; followUp: number; converted: number; lost: number;
}
