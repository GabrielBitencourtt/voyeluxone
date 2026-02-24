import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../components/ui/Button';
import { TFASetup } from '@/components/auth/TFASetup';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTFASetup, setShowTFASetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  if (!user) return null;

  const handleDisableTFA = async () => {
    if (!disablePassword) {
      toast.error('Digite sua senha para desativar o 2FA');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/tfa/disable', {
        password: disablePassword
      });
      toast.success('2FA desativado com sucesso');
      setShowDisableConfirm(false);
      setDisablePassword('');
      // Recarrega usuário
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao desativar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/tfa/backup-codes');
      setBackupCodes(response.data);
      setShowBackupCodes(true);
    } catch (error) {
      toast.error('Erro ao carregar códigos de backup');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Códigos copiados!');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="card">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Perfil do Usuário
          </h1>
          <Button variant="danger" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informações Pessoais
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.id}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.email}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nome Completo</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.full_name || 'Não informado'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Data de Criação</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Último Login</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.last_login 
                    ? format(new Date(user.last_login), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                    : 'Nunca'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Seção 2FA */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Segurança da Conta
            </h3>
          </div>
          
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">
                  Autenticação de Dois Fatores (2FA)
                </h4>
                <p className="text-sm text-gray-600">
                  {user.tfa_enabled 
                    ? '✅ 2FA está ativo. Sua conta está mais segura.'
                    : '❌ 2FA não está ativo. Ative para maior segurança.'}
                </p>
              </div>
              
              {!user.tfa_enabled ? (
                <Button
                  variant="primary"
                  onClick={() => setShowTFASetup(true)}
                >
                  Ativar 2FA
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    onClick={handleViewBackupCodes}
                    isLoading={loading}
                  >
                    Ver códigos de backup
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowDisableConfirm(true)}
                  >
                    Desativar
                  </Button>
                </div>
              )}
            </div>

            {/* Códigos de Backup */}
            {showBackupCodes && backupCodes.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Códigos de Backup
                </h5>
                <p className="text-sm text-yellow-700 mb-3">
                  Guarde estes códigos em local seguro. Cada código só pode ser usado UMA VEZ.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="font-mono text-sm bg-white p-2 rounded border border-yellow-300">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={copyBackupCodes}>
                    Copiar códigos
                  </Button>
                  <Button variant="secondary" onClick={() => setShowBackupCodes(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmação de Desativação */}
            {showDisableConfirm && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="font-medium text-red-800 mb-2">
                  ⚠️ Desativar 2FA
                </h5>
                <p className="text-sm text-red-700 mb-3">
                  Digite sua senha para confirmar a desativação do 2FA.
                </p>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Sua senha"
                  className="input-field mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={handleDisableTFA}
                    isLoading={loading}
                  >
                    Confirmar desativação
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setDisablePassword('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Setup 2FA */}
      {showTFASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <TFASetup
              onComplete={() => {
                setShowTFASetup(false);
                window.location.reload();
              }}
              onCancel={() => setShowTFASetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};