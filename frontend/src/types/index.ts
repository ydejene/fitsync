// src/types/index.ts

export type Role = "ADMIN" | "STAFF" | "MEMBER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type FeeStatus = "PAID" | "UNPAID" | "OVERDUE";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "TELEBIRR" | "CBE_BIRR" | "CASH" | "CARD";
export type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type BatchTime = "MORNING" | "EVENING";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  medicalHistory?: string;
  role: Role;
  status: UserStatus;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  nameAm?: string;
  description?: string;
  priceEtb: number;
  billingCycle: BillingCycle;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  feeStatus: FeeStatus;
  batch: BatchTime;
  autoRenew: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  plan?: Plan;
}

export interface Payment {
  id: string;
  userId: string;
  membershipId?: string;
  amountEtb: number;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
  user?: User;
  membership?: Membership;
}

export interface Class {
  id: string;
  name: string;
  nameAm?: string;
  instructor?: string;
  scheduleAt: string;
  durationMin: number;
  capacity: number;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  classId?: string;
  bookedAt: string;
  attended: boolean;
  cancelled: boolean;
  cancelReason?: string;
  user?: User;
  class?: Class;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  mrr: number;
  overduePayments: number;
  expiringThisWeek: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  churnRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: Record<string, string> | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  profilePhotoUrl?: string;
}

export interface StaffPermissions {
  canManageMembers: boolean;
  canManagePayments: boolean;
  canManageBookings: boolean;
  canViewReports: boolean;
  canManagePlans: boolean;
}