import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';

const startSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().optional(),
});

type StartFormData = z.infer<typeof startSchema>;

interface RegisterStartFormProps {
  onSuccess: (email: string) => void;
}

export const RegisterStartForm: React.FC<RegisterStartFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartFormData>({
    resolver: zodResolver(startSchema),
  });

  const onSubmit = async (data: StartFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/register/start', data);
      toast.success('Código enviado para seu email!');
      onSuccess(data.email);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao iniciar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Criar conta</h2>
      
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          label="Nome completo (opcional)"
          type="text"
          placeholder="Seu nome"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        
        <p className="text-sm text-gray-600">
          Enviaremos um código de verificação para seu email.
        </p>
        
        <Button type="submit" isLoading={loading} fullWidth>
          Enviar código
        </Button>
      </form>
    </div>
  );
};