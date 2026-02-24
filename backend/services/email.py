# services/email.py
import resend
import secrets
import string
from typing import List, Optional
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# Configurar API key
resend.api_key = settings.RESEND_API_KEY

class EmailService:
    """Serviço de email usando Resend"""
    
    @staticmethod
    async def send_tfa_code(email: str, code: str, user_name: Optional[str] = None) -> bool:
        """
        Envia código 2FA por email
        
        Args:
            email: Email do destinatário
            code: Código de 6 dígitos
            user_name: Nome do usuário (opcional)
        
        Returns:
            True se enviado com sucesso
        """
        try:
            name_display = user_name or email
            
            params = {
                "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                "to": [email],
                "subject": f"Seu código de verificação - {settings.TFA_ISSUER_NAME}",
                "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
                        <h1 style="color: #2563eb; margin-bottom: 20px;">🔐 Código de Verificação</h1>
                        
                        <p style="font-size: 16px; margin-bottom: 30px;">
                            Olá, <strong>{name_display}</strong>!
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Utilize o código abaixo para completar seu login:
                        </p>
                        
                        <div style="background-color: #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace;">
                                {code}
                            </span>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                            ⏰ Este código expira em {settings.TFA_TOKEN_EXPIRE_MINUTES} minutos.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #9ca3af;">
                            Se você não solicitou este código, ignore este email.<br>
                            © {settings.TFA_ISSUER_NAME}. Todos os direitos reservados.
                        </p>
                    </div>
                </body>
                </html>
                """,
                "text": f"""
                🔐 CÓDIGO DE VERIFICAÇÃO
                
                Olá {name_display}!
                
                Seu código de verificação é: {code}
                
                Este código expira em {settings.TFA_TOKEN_EXPIRE_MINUTES} minutos.
                
                Se você não solicitou este código, ignore este email.
                """,
            }
            
            email_response = resend.Emails.send(params)
            logger.info(f"✅ Email 2FA enviado para {email}: {email_response['id']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email 2FA: {e}")
            return False
    
    @staticmethod
    async def send_backup_codes(email: str, codes: List[str], user_name: Optional[str] = None) -> bool:
        """
        Envia códigos de backup por email
        
        Args:
            email: Email do destinatário
            codes: Lista de códigos de backup
            user_name: Nome do usuário (opcional)
        """
        try:
            name_display = user_name or email
            codes_html = "".join([f'<li style="font-family: monospace; font-size: 16px; margin-bottom: 5px;">{code}</li>' for code in codes])
            codes_text = "\n".join([f"  • {code}" for code in codes])
            
            params = {
                "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                "to": [email],
                "subject": f"🔑 Seus códigos de backup - {settings.TFA_ISSUER_NAME}",
                "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
                        <h1 style="color: #2563eb; margin-bottom: 20px;">🔑 Códigos de Backup</h1>
                        
                        <p style="font-size: 16px; margin-bottom: 30px;">
                            Olá, <strong>{name_display}</strong>!
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Guarde estes códigos em local seguro. Cada código pode ser usado apenas uma vez
                            caso você perca acesso ao seu email ou autenticador.
                        </p>
                        
                        <div style="background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <p style="font-size: 14px; color: #b91c1c; font-weight: bold; margin-bottom: 15px;">
                                ⚠️ IMPORTANTE: Cada código só pode ser usado UMA VEZ!
                            </p>
                            <ul style="list-style: none; padding: 0;">
                                {codes_html}
                            </ul>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #9ca3af;">
                            © {settings.TFA_ISSUER_NAME}. Todos os direitos reservados.
                        </p>
                    </div>
                </body>
                </html>
                """,
                "text": f"""
                🔑 CÓDIGOS DE BACKUP
                
                Olá {name_display}!
                
                Guarde estes códigos em local seguro. Cada código pode ser usado apenas uma vez
                caso você perca acesso ao seu email ou autenticador.
                
                ⚠️ IMPORTANTE: Cada código só pode ser usado UMA VEZ!
                
                {codes_text}
                
                © {settings.TFA_ISSUER_NAME}. Todos os direitos reservados.
                """,
            }
            
            email_response = resend.Emails.send(params)
            logger.info(f"✅ Códigos de backup enviados para {email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar códigos de backup: {e}")
            return False
    
    @staticmethod
    async def send_verification_code(email: str, code: str, user_name: Optional[str] = None) -> bool:
        """
        Envia código de verificação de email para cadastro
        
        Args:
            email: Email do destinatário
            code: Código de 6 dígitos
            user_name: Nome do usuário (opcional)
        
        Returns:
            True se enviado com sucesso
        """
        try:
            name_display = user_name or email
            
            params = {
                "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                "to": [email],
                "subject": f"Confirme seu email - {settings.TFA_ISSUER_NAME}",
                "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
                        <h1 style="color: #2563eb; margin-bottom: 20px;">📧 Confirme seu Email</h1>
                        
                        <p style="font-size: 16px; margin-bottom: 30px;">
                            Olá, <strong>{name_display}</strong>!
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Use o código abaixo para confirmar seu email e completar seu cadastro:
                        </p>
                        
                        <div style="background-color: #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace;">
                                {code}
                            </span>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                            ⏰ Este código expira em 15 minutos.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #9ca3af;">
                            Se você não solicitou este código, ignore este email.<br>
                            © {settings.TFA_ISSUER_NAME}. Todos os direitos reservados.
                        </p>
                    </div>
                </body>
                </html>
                """,
                "text": f"""
                📧 CONFIRME SEU EMAIL
                
                Olá {name_display}!
                
                Seu código de verificação é: {code}
                
                Este código expira em 15 minutos.
                
                Se você não solicitou este código, ignore este email.
                """,
            }
            
            email_response = resend.Emails.send(params)
            logger.info(f"✅ Email de verificação enviado para {email}: {email_response['id']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email de verificação: {e}")
            return False
    
    @staticmethod
    def generate_verification_code() -> str:
        """
        Gera um código aleatório de 6 dígitos para verificação
        
        Returns:
            String com 6 dígitos
        """
        return ''.join(secrets.choice(string.digits) for _ in range(6))