// Authentication & Authorization Types
export type UserRole = 'admin' | 'customer' | 'capster' | 'barbershop';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  customer_phone?: string; // Link to barbershop_customers table
  customer_name?: string;
  capster_id?: string; // Link to capsters table for capster role
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, expectedRole?: UserRole) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole, customerData?: { phone: string; name: string }) => Promise<{ error: Error | null }>;
  signInWithGoogle: (expectedRole?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  customerPhone?: string;
  customerName?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
