// No imports needed as we're using type-only exports

export type UserRole = 'patient' | 'caregiver' | 'expert' | 'admin';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientUser extends BaseUser {
  role: 'patient';
  uniqueCode: string;
  points: number;
  level: number;
  badges: string[];
  cognitiveScore: number;
  caregiverId?: string;
  condition: string;
  age: number;
  mood: string;
  lastVisit?: Date;
  status?: 'active' | 'inactive' | 'needs-attention';
}

export interface CaregiverUser extends BaseUser {
  role: 'caregiver';
  uniqueCode: string;
  patients: string[]; // Array of patient IDs
  verified: boolean;
}

export interface ExpertUser extends BaseUser {
  role: 'expert';
  credentials: string[];
  specialization: string[];
  verified: boolean;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
}

export type User = PatientUser | CaregiverUser | ExpertUser | AdminUser;

// Type guards
export function isPatientUser(user: User): user is PatientUser {
  return user.role === 'patient';
}

export function isCaregiverUser(user: User): user is CaregiverUser {
  return user.role === 'caregiver';
}

export function isExpertUser(user: User): user is ExpertUser {
  return user.role === 'expert';
}

export function isAdminUser(user: User): user is AdminUser {
  return user.role === 'admin';
}
