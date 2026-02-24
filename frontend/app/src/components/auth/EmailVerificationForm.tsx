// src/components/auth/EmailVerificationForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { VerifiedUser } from '@/types/auth.types';  // ✅ Import correto
import toast from 'react-hot-toast';

const verifySchema = z.object({
  code: z.string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d+$/, 'Apenas números')
});

type VerifyFormData = z.infer<typeof verifySchema>;

interface EmailVerificationFormProps {
  email: string;
  onSuccess: (userData: VerifiedUser) => void;  // ✅ Tipo correto
  onBack: () => void;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  email,
  onSuccess,
  onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  useEffect(() => {
    if (!canResend) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [canResend]);

  const onSubmit = async (data: VerifyFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.verifyEmail({
        email,
        code: data.code
      });
      
      toast.success('Email verificado com sucesso!');
      onSuccess(response.user);  // ✅ Agora passa VerifiedUser
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    
    try {
      await authService.resendCode({ email });
      toast.success('Novo código enviado!');
      setCanResend(false);
      setTimeLeft(60);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao reenviar código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Verificar Email</h2>
      
      <p className="text-gray-600 mb-4">
        Enviamos um código de 6 dígitos para <strong>{email}</strong>.
        Digite o código abaixo para verificar seu email.
      </p>
      
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Código de verificação"
          placeholder="000000"
          maxLength={6}
          error={errors.code?.message}
          {...register('code')}
        />
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Voltar
          </Button>
          
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            Verificar
          </Button>
        </div>
        
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Enviando...' : 
             canResend ? 'Reenviar código' : 
             `Reenviar em ${timeLeft}s`}
          </button>
        </div>
      </form>
    </div>
  );
};