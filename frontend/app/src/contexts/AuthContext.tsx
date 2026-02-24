// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoginLoading: boolean;
  isRegisterLoading: boolean;  // ✅ Declarado aqui
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);  // ✅ Declarado aqui
  const hasCheckedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (hasCheckedRef.current) return;
    
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
      hasCheckedRef.current = true;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    if (isLoginLoading) return;
    
    try {
      setIsLoginLoading(true);
      const userData = await authService.login({ username: email, password });
      setUser(userData);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      // Se for erro de email não verificado, redireciona para verificação
      if (error.response?.status === 403 && 
          error.response?.data?.detail?.includes('Email não verificado')) {
        toast.error('Email não verificado. Redirecionando...');
        window.location.href = `/register?email=${encodeURIComponent(email)}`;
      } else {
        const message = error.response?.data?.detail || 'Erro ao fazer login';
        toast.error(message);
      }
      throw error;
    } finally {
      setIsLoginLoading(false);
    }
  };

  // ===== REGISTER =====
  const register = async (email: string, password: string, fullName?: string) => {
    if (isRegisterLoading) return;
    
    try {
      setIsRegisterLoading(true);
      const response = await authService.register({
        email,
        password,
        full_name: fullName
      });
      
      toast.success(response.message);
      
      // Não seta o user aqui porque ainda precisa verificar email
      // O usuário será redirecionado para a página de verificação
      
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao registrar';
      toast.error(message);
      throw error;
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      hasCheckedRef.current = false;
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isLoginLoading,
        isRegisterLoading,  // ✅ Incluído no value
        login, 
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};