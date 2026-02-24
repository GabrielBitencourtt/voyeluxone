// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ESSENCIAL para cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// ✅ INTERCEPTOR DE REQUISIÇÃO (único)
api.interceptors.request.use(config => {
  console.log('🚀 Enviando requisição:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
  });

  // ✅ Adicionar token CSRF apenas para métodos que modificam dados
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    // Tenta pegar o token CSRF do cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('🔐 Token CSRF adicionado');
    } else {
      console.warn('⚠️ Token CSRF não encontrado nos cookies');
      
      // Para registro, podemos tentar continuar mesmo sem CSRF
      if (config.url?.includes('/auth/register')) {
        console.log('📝 Registro sem CSRF token - pode causar erro 500 se o backend exigir');
      }
    }
  }
  
  return config;
});

// ✅ INTERCEPTOR DE RESPOSTA (único)
api.interceptors.response.use(
  response => {
    console.log('✅ Resposta recebida:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    console.error('❌ Erro na requisição:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Tratamento de erro 401 (não autorizado)
    if (error.response?.status === 401) {
      const isAuthPage = window.location.pathname === '/login' || 
                        window.location.pathname === '/register';
      
      if (!isAuthPage) {
        console.log('🔄 Redirecionando para login (401)');
        window.location.href = '/login';
      }
    }
    
    // Tratamento de erro 403 (CSRF)
    if (error.response?.status === 403) {
      console.error('🚫 Erro CSRF - token inválido ou ausente');
      
      // Se for registro e der 403, pode ser que o backend esteja exigindo CSRF
      if (error.config?.url?.includes('/auth/register')) {
        console.log('⚠️ O backend está exigindo CSRF no registro - isso pode ser um problema');
      }
    }

    // Tratamento de erro 500 (erro interno)
    if (error.response?.status === 500) {
      console.error('🔥 Erro interno do servidor');
    }
    
    // Tratamento de erro de rede
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Servidor não disponível. Verifique se o backend está rodando em:', API_URL);
    }
    
    // Tratamento de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout da requisição - servidor demorou muito para responder');
    }
    
    return Promise.reject(error);
  }
);