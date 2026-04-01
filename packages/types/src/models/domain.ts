/* -------------------------------------------------------------------------- */
/* Domain Types                                                               */
/* -------------------------------------------------------------------------- */

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

export interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface Schedule {
  id: string;
  uid: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  dayOfWeek?: number[] | null;
  date?: string;
  taken: boolean;
  takenAt?: string;
  missed: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  uid: string;
  notificationTime: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Language<TDateLocale = unknown, TFlagComponent = unknown> {
  flag: string;
  code: string;
  locale: string;
  label: string;
  dateLocale: TDateLocale;
  FlagComponent: TFlagComponent;
}
