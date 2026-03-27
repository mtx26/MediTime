/**
 * Core User Type
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Medicine/Drug Type
 */
export interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calendar Type (for organizing medicines)
 */
export interface Calendar {
  id: string;
  uid: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Prescription Type
 */
export interface Prescription {
  id: string;
  uid: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate?: string;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Schedule/Reminder Type
 */
export interface Schedule {
  id: string;
  prescriptionId: string;
  uid: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // HH:mm format
  dayOfWeek?: number[] | null; // 0-6 for recurring, null for daily
  date?: string; // For one-time reminders
  taken: boolean;
  takenAt?: string;
  missed: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Notification Settings Type
 */
export interface NotificationSettings {
  uid: string;
  notificationTime: string; // HH:mm format
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth Session Type
 */
export interface AuthSession {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * API Response Type (Generic)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Pagination Type
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Paginated Response Type
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

/**
 * Log Event Type
 */
export interface LogEvent {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  origin?: string;
  code?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

/**
 * Token/Share Type (for public sharing)
 */
export interface ShareToken {
  id: string;
  uid: string;
  token: string;
  expiresAt?: string;
  createdAt?: string;
}
