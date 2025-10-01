import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Validação de variáveis de ambiente com fallback para produção
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eglxlvzkrfjhfexipudj.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbHhsdnprcmZqaGZleGlwdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDE5OTUsImV4cCI6MjA2NzY3Nzk5NX0.NGSXF3dun82LWXlT8HdgLH_jBfhGJFH-m19y5SwiebQ'

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

// Validação de formato das chaves
if (!SUPABASE_URL.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format - must start with https://')
}

if (!SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
  console.warn('⚠️ Supabase key format warning - should start with "eyJ"')
  if (import.meta.env.PROD) {
    throw new Error('Invalid Supabase key format')
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'pedidos-academia-system',
      'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
})

// Função para verificar conexão
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return { success: false, error }
    }
    
    console.log('✅ Database connection successful')
    return { success: true, data }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: err }
  }
}

// Função para validar conexão segura
export const validateSecureConnection = async () => {
  try {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('HTTPS required for production')
    }
    
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }
    
    return { success: true, secure: true }
  } catch (error) {
    console.error('Security validation failed:', error)
    return { success: false, secure: false, error }
  }
}
