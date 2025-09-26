import { supabase } from '@/integrations/supabase/client'
import { emailService } from './emailService'

interface BackupData {
  products: any[]
  orders: any[]
  orderItems: any[]
  inventoryAlerts: any[]
  timestamp: string
  version: string
}

export class BackupService {
  private static instance: BackupService
  private backupInterval: NodeJS.Timeout | null = null
  private isBackupRunning = false

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  async createBackup(): Promise<{ success: boolean; error?: string; data?: BackupData }> {
    if (this.isBackupRunning) {
      return { success: false, error: 'Backup já está em execução' }
    }

    try {
      this.isBackupRunning = true
      console.log('🔄 Iniciando backup automático...')

      // Buscar todos os dados
      const [productsResult, ordersResult, orderItemsResult, inventoryAlertsResult] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('order_items').select('*'),
        supabase.from('inventory_alerts').select('*')
      ])

      // Verificar erros
      if (productsResult.error) throw productsResult.error
      if (ordersResult.error) throw ordersResult.error
      if (orderItemsResult.error) throw orderItemsResult.error
      if (inventoryAlertsResult.error) throw inventoryAlertsResult.error

      const backupData: BackupData = {
        products: productsResult.data || [],
        orders: ordersResult.data || [],
        orderItems: orderItemsResult.data || [],
        inventoryAlerts: inventoryAlertsResult.data || [],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }

      // Salvar backup no localStorage (fallback)
      this.saveBackupToLocalStorage(backupData)

      // Salvar backup no Supabase (tabela de backups)
      await this.saveBackupToDatabase(backupData)

      // Enviar backup por email (opcional)
      await this.sendBackupByEmail(backupData)

      console.log('✅ Backup concluído com sucesso')
      return { success: true, data: backupData }

    } catch (error) {
      console.error('❌ Erro no backup:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    } finally {
      this.isBackupRunning = false
    }
  }

  private saveBackupToLocalStorage(backupData: BackupData) {
    try {
      const backupKey = `backup_${new Date().toISOString().split('T')[0]}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))
      
      // Manter apenas os últimos 7 backups
      this.cleanOldLocalBackups()
      
      console.log('💾 Backup salvo no localStorage')
    } catch (error) {
      console.error('Erro ao salvar backup no localStorage:', error)
    }
  }

  private async saveBackupToDatabase(backupData: BackupData) {
    try {
      // Criar tabela de backups se não existir
      await this.createBackupTableIfNotExists()

      const { error } = await supabase
        .from('system_backups')
        .insert({
          backup_data: backupData,
          created_at: new Date().toISOString(),
          backup_type: 'automatic',
          size_bytes: JSON.stringify(backupData).length
        })

      if (error) throw error
      console.log('🗄️ Backup salvo no banco de dados')

    } catch (error) {
      console.error('Erro ao salvar backup no banco:', error)
      // Não falhar o backup por causa disso
    }
  }

  private async createBackupTableIfNotExists() {
    try {
      const { error } = await supabase.rpc('create_backup_table_if_not_exists')
      if (error && !error.message.includes('already exists')) {
        console.warn('Aviso: Não foi possível criar tabela de backups:', error.message)
      }
    } catch (error) {
      console.warn('Aviso: Função de criação de tabela não disponível')
    }
  }

  private async sendBackupByEmail(backupData: BackupData) {
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@academiaveiga.com'
      
      const backupSummary = {
        totalProducts: backupData.products.length,
        totalOrders: backupData.orders.length,
        totalOrderItems: backupData.orderItems.length,
        totalAlerts: backupData.inventoryAlerts.length,
        timestamp: backupData.timestamp,
        sizeBytes: JSON.stringify(backupData).length
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Backup Automático - Academia Veiga</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🥊 Academia Veiga</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Backup Automático Concluído</p>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #dc2626; margin-top: 0;">✅ Backup Realizado com Sucesso</h2>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                  <p><strong>Data/Hora:</strong> ${new Date(backupData.timestamp).toLocaleString('pt-BR')}</p>
                  <p><strong>Versão:</strong> ${backupData.version}</p>
                  <p><strong>Tamanho:</strong> ${(backupSummary.sizeBytes / 1024).toFixed(2)} KB</p>
                </div>

                <h3 style="color: #dc2626;">📊 Resumo dos Dados</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                  <p><strong>Produtos:</strong> ${backupSummary.totalProducts}</p>
                  <p><strong>Pedidos:</strong> ${backupSummary.totalOrders}</p>
                  <p><strong>Itens de Pedidos:</strong> ${backupSummary.totalOrderItems}</p>
                  <p><strong>Alertas de Estoque:</strong> ${backupSummary.totalAlerts}</p>
                </div>

                <div style="background: #e7f3ff; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>ℹ️ Informações:</strong></p>
                  <p style="margin: 5px 0 0 0;">Este backup foi gerado automaticamente pelo sistema.</p>
                  <p style="margin: 5px 0 0 0;">Os dados estão seguros e podem ser restaurados a qualquer momento.</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>Backup automático do Sistema de Pedidos da Academia Veiga.</p>
              </div>
            </div>
          </body>
        </html>
      `

      const text = `
        BACKUP AUTOMÁTICO - ACADEMIA VEIGA
        
        Backup realizado com sucesso!
        
        Data/Hora: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}
        Versão: ${backupData.version}
        Tamanho: ${(backupSummary.sizeBytes / 1024).toFixed(2)} KB
        
        RESUMO DOS DADOS:
        - Produtos: ${backupSummary.totalProducts}
        - Pedidos: ${backupSummary.totalOrders}
        - Itens de Pedidos: ${backupSummary.totalOrderItems}
        - Alertas de Estoque: ${backupSummary.totalAlerts}
        
        Este backup foi gerado automaticamente pelo sistema.
        Os dados estão seguros e podem ser restaurados a qualquer momento.
      `

      await emailService.sendEmail({
        to: adminEmail,
        subject: `🔄 Backup Automático - ${new Date().toLocaleDateString('pt-BR')}`,
        html,
        text
      })

      console.log('📧 Backup enviado por email')

    } catch (error) {
      console.error('Erro ao enviar backup por email:', error)
      // Não falhar o backup por causa disso
    }
  }

  private cleanOldLocalBackups() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('backup_'))
      if (keys.length > 7) {
        // Ordenar por data e remover os mais antigos
        keys.sort()
        const keysToRemove = keys.slice(0, keys.length - 7)
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`🧹 Removidos ${keysToRemove.length} backups antigos do localStorage`)
      }
    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error)
    }
  }

  startAutomaticBackup(intervalHours: number = 24) {
    if (this.backupInterval) {
      this.stopAutomaticBackup()
    }

    const intervalMs = intervalHours * 60 * 60 * 1000
    
    // Executar backup imediatamente
    this.createBackup()

    // Agendar próximos backups
    this.backupInterval = setInterval(() => {
      this.createBackup()
    }, intervalMs)

    console.log(`🔄 Backup automático iniciado (intervalo: ${intervalHours}h)`)
  }

  stopAutomaticBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
      console.log('⏹️ Backup automático parado')
    }
  }

  async restoreFromBackup(backupData: BackupData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Iniciando restauração do backup...')

      // Restaurar produtos
      if (backupData.products.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .upsert(backupData.products, { onConflict: 'id' })
        
        if (productsError) throw productsError
        console.log(`✅ Restaurados ${backupData.products.length} produtos`)
      }

      // Restaurar pedidos
      if (backupData.orders.length > 0) {
        const { error: ordersError } = await supabase
          .from('orders')
          .upsert(backupData.orders, { onConflict: 'id' })
        
        if (ordersError) throw ordersError
        console.log(`✅ Restaurados ${backupData.orders.length} pedidos`)
      }

      // Restaurar itens de pedidos
      if (backupData.orderItems.length > 0) {
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .upsert(backupData.orderItems, { onConflict: 'id' })
        
        if (orderItemsError) throw orderItemsError
        console.log(`✅ Restaurados ${backupData.orderItems.length} itens de pedidos`)
      }

      // Restaurar alertas de estoque
      if (backupData.inventoryAlerts.length > 0) {
        const { error: alertsError } = await supabase
          .from('inventory_alerts')
          .upsert(backupData.inventoryAlerts, { onConflict: 'id' })
        
        if (alertsError) throw alertsError
        console.log(`✅ Restaurados ${backupData.inventoryAlerts.length} alertas`)
      }

      console.log('✅ Restauração concluída com sucesso')
      return { success: true }

    } catch (error) {
      console.error('❌ Erro na restauração:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  getLocalBackups(): BackupData[] {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('backup_'))
      const backups = keys.map(key => {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      }).filter(Boolean)

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Erro ao obter backups locais:', error)
      return []
    }
  }

  async getDatabaseBackups(): Promise<BackupData[]> {
    try {
      const { data, error } = await supabase
        .from('system_backups')
        .select('backup_data, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data?.map(item => item.backup_data) || []
    } catch (error) {
      console.error('Erro ao obter backups do banco:', error)
      return []
    }
  }
}

export const backupService = BackupService.getInstance()
