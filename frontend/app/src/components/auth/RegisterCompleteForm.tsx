import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const completeSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'A senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type CompleteFormData = z.infer<typeof completeSchema>;

interface RegisterCompleteFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const RegisterCompleteForm: React.FC<RegisterCompleteFormProps> = ({
  email,
  onSuccess,
  onBack,
}) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteFormData>({
    resolver: zodResolver(completeSchema),
  });

  React.useEffect(() => {
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

  const onSubmit = async (data: CompleteFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/register/complete', {
        email,
        code: data.code,
        password: data.password,
      });
      
      toast.success('Cadastro realizado com sucesso!');
      
      // Faz login automático
      await login(email, data.password);
      onSuccess();
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao completar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/register/resend', { email });
      toast.success('Novo código enviado!');
      setCanResend(false);
      setTimeLeft(60);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao reenviar código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Verificar email</h2>
      
      <p className="text-gray-600 mb-4">
        Enviamos um código de 6 dígitos para <strong>{email}</strong>.
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
        
        <Input
          label="Senha"
          type="password"
          placeholder="******"
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="******"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          
          <Button type="submit" isLoading={loading} className="flex-1">
            Cadastrar
          </Button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
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