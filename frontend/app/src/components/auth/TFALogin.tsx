import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const tfaSchema = z.object({
  code: z.string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d+$/, 'Apenas números')
});

type TFAFormData = z.infer<typeof tfaSchema>;

interface TFALoginProps {
  tfaToken: string;
  email: string;
  onSuccess: () => void;  // ← Callback em vez de navigate direto
  onBack: () => void;
  onResend?: () => void;  // Opcional
}

export const TFALogin: React.FC<TFALoginProps> = ({
  tfaToken,
  email,
  onSuccess,
  onBack,
  onResend
}) => {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFAFormData>({
    resolver: zodResolver(tfaSchema),
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

  const onSubmit = async (data: TFAFormData) => {
    setLoading(true);
    try {
      await api.post('/auth/login/complete', {
        tfa_token: tfaToken,
        code: data.code
      });
      toast.success('Login realizado com sucesso!');
      onSuccess(); // ← Chama o callback em vez de navigate
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Muitas tentativas. Aguarde 30 minutos.');
      } else {
        toast.error(error.response?.data?.detail || 'Código inválido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (onResend) {
      setResending(true);
      try {
        await onResend();
        setCanResend(false);
        setTimeLeft(60);
      } finally {
        setResending(false);
      }
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Verificação em duas etapas</h2>
      
      <p className="text-gray-600 mb-6">
        Enviamos um código de verificação para <strong>{email}</strong>.
        Digite o código abaixo para continuar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Código de 6 dígitos"
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

        {onResend && (
          <div className="text-center">
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
        )}
      </form>
    </div>
  );
};