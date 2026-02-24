import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Bem-vindo, {user?.full_name || user?.email}!
        </p>
        
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">
            Informações do Usuário
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.full_name || 'Não informado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user?.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Superusuário</dt>
              <dd className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user?.is_superuser ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.is_superuser ? 'Sim' : 'Não'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};