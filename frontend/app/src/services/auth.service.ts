// src/services/auth.service.ts
import { api } from './api';
import { 
  User, 
  LoginCredentials, 
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendCodeRequest,
  RegistrationStatus
} from '@/types/auth.types';



export const authService = {
  // ===== REGISTRO COM VERIFICAÇÃO =====
  
  /**
   * Primeira etapa: enviar dados e solicitar código
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log('📤 Enviando registro:', { email: data.email, full_name: data.full_name });
    
    try {
      const response = await api.post<RegisterResponse>('/auth/register', data);
      console.log('📥 Resposta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      throw error;
    }
  },

  /**
   * Segunda etapa: verificar código e criar conta
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    console.log('📤 Verificando código para:', data.email);
    
    try {
      const response = await api.post<VerifyEmailResponse>('/auth/register/verify', data);
      console.log('📥 Email verificado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      throw error;
    }
  },

  

  /**
   * Reenviar código de verificação
   */
  async resendCode(data: ResendCodeRequest): Promise<{ message: string }> {
    console.log('📤 Reenviando código para:', data.email);
    
    try {
      const response = await api.post<{ message: string }>('/auth/register/resend', data);
      console.log('📥 Código reenviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao reenviar código:', error);
      throw error;
    }
  },

  /**
   * Verificar status do registro
   */
  async checkRegistrationStatus(email: string): Promise<RegistrationStatus> {
    console.log('📤 Verificando status para:', email);
    
    try {
      const response = await api.get<RegistrationStatus>(`/auth/register/status/${email}`);
      console.log('📥 Status:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  },

  // ===== LOGIN =====
  async login(credentials: LoginCredentials): Promise<User> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    try {
      const response = await api.post<{user: User}>('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.user;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  },

  // ===== USUÁRIO ATUAL =====
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<{user: User}>('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      throw error;
    }
  },

  // ===== LOGOUT =====
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  },
};