import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';


const verifySchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números')
});

type VerifyData = z.infer<typeof verifySchema>;

interface TFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const TFASetup: React.FC<TFASetupProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qr_code: string;
    backup_codes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState<'authenticator' | 'email'>('authenticator');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyData>({
    resolver: zodResolver(verifySchema),
  });

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/tfa/setup');
      setSetupData(response.data);
      setStep('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao iniciar configuração 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (data: VerifyData) => {
    setLoading(true);
    try {
      await api.post('/auth/tfa/enable', {
        code: data.code,
        method: method
      });
      
      if (method === 'authenticator') {
        setStep('backup');
      } else {
        toast.success('2FA ativado com sucesso!');
        if (onComplete) onComplete();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backup_codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success('Códigos copiados!');
    }
  };

  const downloadBackupCodes = () => {
    if (setupData) {
      const content = setupData.backup_codes.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-codes-${user?.email}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Códigos baixados!');
    }
  };

  if (step === 'setup') {
    return (
      <div className="card max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Configurar 2FA</h2>
        <p className="text-gray-600 mb-6">
          A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
          Escolha como deseja receber os códigos:
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="method"
              value="authenticator"
              checked={method === 'authenticator'}
              onChange={() => setMethod('authenticator')}
              className="h-4 w-4 text-primary-600"
            />
            <div>
              <span className="font-medium">Aplicativo Autenticador</span>
              <p className="text-sm text-gray-500">Google Authenticator, Authy, etc.</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="method"
              value="email"
              checked={method === 'email'}
              onChange={() => setMethod('email')}
              className="h-4 w-4 text-primary-600"
            />
            <div>
              <span className="font-medium">Email</span>
              <p className="text-sm text-gray-500">Receber códigos por email</p>
            </div>
          </label>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={startSetup}
            isLoading={loading}
            fullWidth
          >
            Continuar
          </Button>
          
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              fullWidth
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'verify' && setupData) {
    return (
      <div className="card max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Verificar 2FA</h2>
        
        {method === 'authenticator' ? (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-center">
              <QRCodeCanvas value={setupData.qr_code} size={200} />
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Escaneie o código QR com seu aplicativo autenticador ou insira manualmente:
              <br />
              <code className="bg-gray-100 p-1 rounded block mt-2 text-center font-mono">
                {setupData.secret}
              </code>
            </p>
          </>
        ) : (
          <Alert
            type="info"
            message="Enviamos um código de verificação para seu email. Digite-o abaixo."
          />
        )}
        
        <form onSubmit={handleSubmit(verifyAndEnable)} className="space-y-4">
          <Input
            label="Código de verificação"
            placeholder="000000"
            maxLength={6}
            error={errors.code?.message}
            {...register('code')}
          />
          
          <Button
            type="submit"
            isLoading={loading}
            fullWidth
          >
            Verificar e ativar
          </Button>
        </form>
      </div>
    );
  }

  if (step === 'backup' && setupData) {
    return (
      <div className="card max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Códigos de Backup</h2>
        
        <Alert
          type="warning"
          message="Guarde estes códigos em local seguro. Cada código só pode ser usado UMA VEZ caso você perca acesso ao seu autenticador."
        />
        
        <div className="my-6 p-4 bg-gray-100 rounded-lg font-mono text-center">
          {setupData.backup_codes.map((code, idx) => (
            <div key={idx} className="py-1">{code}</div>
          ))}
        </div>
        
        <div className="space-y-3">
          <Button onClick={copyBackupCodes} fullWidth>
            {copied ? '✓ Copiado!' : 'Copiar códigos'}
          </Button>
          
          <Button variant="secondary" onClick={downloadBackupCodes} fullWidth>
            Download códigos
          </Button>
          
          <Button
            variant="primary"
            onClick={onComplete}
            fullWidth
          >
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return null;
};