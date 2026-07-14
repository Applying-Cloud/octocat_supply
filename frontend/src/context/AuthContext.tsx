import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

interface UserPublic {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
  updatedAt: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: UserPublic | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_QUERY_KEY = ['auth', 'me'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Session query — GET /api/auth/me
  const { data: user, isLoading } = useQuery<UserPublic | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await axios.get<UserPublic>(`${API_BASE_URL}/api/auth/me`);
        return response.data;
      } catch {
        // 401 means not authenticated — not an error state
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await axios.post<UserPublic>(`${API_BASE_URL}/api/auth/login`, input);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const response = await axios.post<UserPublic>(`${API_BASE_URL}/api/auth/register`, input);
      return response.data;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const register = useCallback(async (input: RegisterInput) => {
    await registerMutation.mutateAsync(input);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoggedIn, isAdmin, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
