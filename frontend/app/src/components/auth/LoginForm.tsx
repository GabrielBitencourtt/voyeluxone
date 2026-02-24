import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoginLoading } = useAuth(); // ✅ Usar isLoginLoading específico
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // Erro já tratado no contexto
      console.error('Erro no login:', error);
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Login</h2>
        <p className="mt-2 text-sm text-gray-600">
          Entre com suas credenciais para acessar o sistema
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="input-field mt-1"
            placeholder="seu@email.com"
            disabled={isLoginLoading} // ✅ Desabilita durante loading
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="input-field mt-1"
            placeholder="******"
            disabled={isLoginLoading} // ✅ Desabilita durante loading
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoginLoading} // ✅ Desabilita durante loading
            className="btn-primary"
          >
            {isLoginLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Não tem uma conta? Registre-se
          </Link>
        </div>
      </form>
    </div>
  );
};