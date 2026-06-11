import { createContext } from 'react';
import type { User, LoginInput, RegisterInput } from '@/types/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  registerInitiate: (data: RegisterInput) => Promise<void>;
  registerVerify: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; email: string; phone?: string }) => Promise<void>;
  deleteProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
