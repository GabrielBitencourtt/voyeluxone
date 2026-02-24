// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';
import { authService } from '@/services/auth.service';
import { Alert } from '@/components/ui/Alert';
import { VerifiedUser } from '@/types/auth.types';  // ✅ Import correto

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Verificar se veio com email na URL (ex: de redirecionamento por email não verificado)
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setStep('verify');
      setStatusMessage('Verifique seu email para continuar.');
    }
  }, [searchParams]);

  // Verificar se há registro pendente ao carregar a página
  useEffect(() => {
    const checkPendingRegistration = async () => {
      const pendingEmail = sessionStorage.getItem('pendingRegistration');
      if (pendingEmail && !email) {
        try {
          const status = await authService.checkRegistrationStatus(pendingEmail);
          if (status.status === 'pending') {
            setEmail(pendingEmail);
            setStep('verify');
            setStatusMessage('Continue seu cadastro verificando seu email.');
          } else {
            sessionStorage.removeItem('pendingRegistration');
          }
        } catch (error) {
          sessionStorage.removeItem('pendingRegistration');
        }
      }
    };
    
    checkPendingRegistration();
  }, [email]);

  const handleRegisterSuccess = (registeredEmail: string) => {
    setEmail(registeredEmail);
    sessionStorage.setItem('pendingRegistration', registeredEmail);
    setStep('verify');
    setStatusMessage('Código enviado! Verifique seu email.');
  };

  // ✅ Agora com o tipo correto
  const handleVerificationSuccess = (userData: VerifiedUser) => {
    sessionStorage.removeItem('pendingRegistration');
    console.log('Usuário verificado:', userData);
    // Login automático já aconteceu no backend
    navigate('/dashboard');
  };

  const handleBack = () => {
    setStep('form');
    sessionStorage.removeItem('pendingRegistration');
    setStatusMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {statusMessage && (
          <div className="mb-4">
            <Alert 
              type="info" 
              message={statusMessage} 
              onClose={() => setStatusMessage(null)}
            />
          </div>
        )}
        
        {step === 'form' ? (
          <RegisterForm onSuccess={handleRegisterSuccess} />
        ) : (
          <EmailVerificationForm
            email={email}
            onSuccess={handleVerificationSuccess}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};