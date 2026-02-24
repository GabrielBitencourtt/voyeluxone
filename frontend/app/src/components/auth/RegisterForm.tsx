// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().optional(),
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

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register: registerUser, isRegisterLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Atualiza requisitos da senha em tempo real
  React.useEffect(() => {
    const errors = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma maiúscula');
    if (!/[a-z]/.test(password)) errors.push('Pelo menos uma minúscula');
    if (!/[0-9]/.test(password)) errors.push('Pelo menos um número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos um caractere especial');
    setPasswordErrors(errors);
  }, [password]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    
    try {
      await registerUser(data.email, data.password, data.full_name);
      toast.success('Código enviado! Verifique seu email.');
      onSuccess(data.email);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao iniciar cadastro');
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Criar Conta</h2>
      
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
          label="Nome Completo"
          type="text"
          placeholder="Seu Nome (opcional)"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        
        <div>
          <Input
            label="Senha"
            type="password"
            placeholder="******"
            error={errors.password?.message}
            {...register('password')}
          />
          
          {password && passwordErrors.length > 0 && (
            <div className="mt-2 text-sm">
              <p className="font-medium text-gray-700">A senha deve conter:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {passwordErrors.map((err, idx) => (
                  <li key={idx} className="text-red-600">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <Input
          label="Confirmar Senha"
          type="password"
          placeholder="******"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        
        {/* ✅ Botão com estilo explícito */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isRegisterLoading}
          className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3"
        >
          Continuar
        </Button>
        
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Já tem uma conta? Faça login
          </Link>
        </div>
      </form>
    </div>
  );
};