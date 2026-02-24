// src/types/auth.types.ts

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  tfa_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

// ===== TIPOS PARA REGISTRO COM VERIFICAÇÃO =====

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  existing?: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifiedUser {
  id: number;
  email: string;
  full_name: string | null;
}

export interface VerifyEmailResponse {
  message: string;
  user: VerifiedUser;
}

export interface ResendCodeRequest {
  email: string;
}

export interface ResendCodeResponse {
  message: string;
}

export interface RegistrationStatus {
  status: 'completed' | 'pending' | 'not_found';
  message: string;
  can_resend?: boolean;
}

// ===== TIPOS DE RESPOSTA DA API =====

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ===== TIPOS PARA 2FA =====

export interface TFASetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TFAVerifyRequest {
  code: string;
}

export interface TFAEnableRequest {
  code: string;
  method: 'email' | 'authenticator';
}

export interface TFALoginResponse {
  tfa_required: boolean;
  tfa_token?: string;
  message: string;
  user?: User;
}

export interface TFACompleteLoginRequest {
  tfa_token: string;
  code: string;
}