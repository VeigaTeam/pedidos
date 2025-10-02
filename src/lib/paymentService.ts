import { supabase } from '../integrations/supabase/client'
import type { 
  Payment, 
  PaymentStatus, 
  PixPaymentData, 
  PaymentResult 
} from '../types'
import type { Database } from '../integrations/supabase/types'

type PaymentRow = Database['public']['Tables']['payments']['Row']

// Função para converter dados do Supabase para o tipo Payment
const mapPaymentFromSupabase = (row: PaymentRow): Payment => ({
  id: row.id,
  orderId: row.order_id,
  amount: row.amount,
  method: row.method,
  status: row.status,
  transactionId: row.transaction_id || undefined,
  pixCode: row.pix_code || undefined,
  pixQrCode: row.pix_qr_code || undefined,
  paymentLink: row.payment_link || undefined,
  notes: row.notes || undefined,
  gatewayResponse: row.gateway_response,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

// Configurações do gateway de pagamento
// const PAYMENT_CONFIG = {
//   // Configurações da InfinitePay (quando disponível)
//   infinityPay: {
//     apiUrl: import.meta.env.VITE_INFINITY_PAY_API_URL || 'https://api.infinitypay.com',
//     apiKey: import.meta.env.VITE_INFINITY_PAY_API_KEY,
//     merchantId: import.meta.env.VITE_INFINITY_PAY_MERCHANT_ID,
//   },
//   // Configurações genéricas para outros gateways
//   generic: {
//     apiUrl: import.meta.env.VITE_PAYMENT_API_URL,
//     apiKey: import.meta.env.VITE_PAYMENT_API_KEY,
//   }
// }

export class PaymentService {
  /**
   * Cria pagamento manual para cartão de crédito
   */
  static async createManualPayment(
    orderId: string, 
    amount: number, 
    method: 'credit_card_manual'
  ): Promise<PaymentResult> {
    try {
      console.log('💳 Criando pagamento manual:', { orderId, amount, method })
      
      // Criar registro de pagamento pendente no banco
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          method,
          status: 'pending',
          notes: 'Aguardando geração de link de pagamento manual'
        })
        .select()
        .single()

      console.log('📊 Resultado da criação:', { payment, error: paymentError })

      if (paymentError) {
        console.error('❌ Erro ao criar pagamento:', paymentError)
        throw new Error(`Erro ao criar pagamento: ${paymentError.message}`)
      }

      // Atualizar status do pedido para pendente
      await this.updateOrderPaymentStatus(orderId, 'pending')

      return {
        success: true,
        paymentId: payment.id,
        message: 'Pagamento criado com sucesso. Link será enviado por email.'
      }
    } catch (error) {
      console.error('Erro ao criar pagamento manual:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Processa pagamento via PIX
   */
  static async processPixPayment(
    orderId: string, 
    amount: number, 
    pixData: PixPaymentData
  ): Promise<PaymentResult> {
    try {
      // Criar registro de pagamento no banco
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          method: 'pix',
          status: 'pending'
        })
        .select()
        .single()

      if (paymentError) {
        throw new Error(`Erro ao criar pagamento: ${paymentError.message}`)
      }

      // Gerar PIX (simular - substituir pela integração real)
      const pixResult = await this.generatePix({
        amount,
        description: pixData.description || `Pedido ${orderId}`,
        paymentId: payment.id
      })

      // Atualizar pagamento com dados do PIX
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          pix_code: pixResult.pixCode,
          pix_qr_code: pixResult.pixQrCode,
          transaction_id: pixResult.transactionId,
          gateway_response: pixResult
        })
        .eq('id', payment.id)

      if (updateError) {
        throw new Error(`Erro ao atualizar pagamento: ${updateError.message}`)
      }

      return {
        success: true,
        paymentId: payment.id,
        transactionId: pixResult.transactionId,
        pixCode: pixResult.pixCode,
        pixQrCode: pixResult.pixQrCode,
        message: 'PIX gerado com sucesso'
      }
    } catch (error) {
      console.error('Erro no pagamento PIX:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Verifica status de um pagamento
   */
  static async checkPaymentStatus(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (error) {
        throw new Error(`Erro ao buscar pagamento: ${error.message}`)
      }

      return data ? mapPaymentFromSupabase(data) : null
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error)
      return null
    }
  }

  /**
   * Lista pagamentos de um pedido
   */
  static async getOrderPayments(orderId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Erro ao buscar pagamentos: ${error.message}`)
      }

      return data ? data.map(mapPaymentFromSupabase) : []
    } catch (error) {
      console.error('Erro ao buscar pagamentos do pedido:', error)
      return []
    }
  }

  /**
   * Cancela um pagamento
   */
  static async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentId)

      if (error) {
        throw new Error(`Erro ao cancelar pagamento: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error)
      return false
    }
  }

  /**
   * Atualiza link de pagamento manual
   */
  static async updatePaymentLink(
    paymentId: string, 
    paymentLink: string, 
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_link: paymentLink,
          notes: notes || 'Link de pagamento gerado manualmente',
          status: 'processing'
        })
        .eq('id', paymentId)

      if (error) {
        throw new Error(`Erro ao atualizar link de pagamento: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar link de pagamento:', error)
      return false
    }
  }

  /**
   * Gera PIX (simulação)
   * Substituir pela integração real com o gateway
   */
  private static async generatePix(data: {
    amount: number
    description: string
    paymentId: string
  }): Promise<{
    pixCode: string
    pixQrCode: string
    transactionId: string
  }> {
    // Simulação de geração de PIX
    // Em produção, substituir pela integração real
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const pixCode = `00020126580014br.gov.bcb.pix0136${data.paymentId}520400005303986540${data.amount.toFixed(2)}5802BR5913Academia Veiga6009Sao Paulo62070503***6304`
        const pixQrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
        
        resolve({
          pixCode,
          pixQrCode,
          transactionId: `PIX_${Date.now()}`
        })
      }, 1000)
    })
  }

  /**
   * Atualiza status de pagamento do pedido
   */
  private static async updateOrderPaymentStatus(
    orderId: string, 
    status: PaymentStatus
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId)

      if (error) {
        throw new Error(`Erro ao atualizar status do pedido: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error)
    }
  }

  /**
   * Webhook para receber notificações do gateway
   */
  static async handleWebhook(payload: any): Promise<boolean> {
    try {
      const { paymentId, status, transactionId } = payload

      if (!paymentId || !status) {
        throw new Error('Payload inválido')
      }

      // Atualizar status do pagamento
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          transaction_id: transactionId,
          gateway_response: payload
        })
        .eq('id', paymentId)

      if (error) {
        throw new Error(`Erro ao atualizar pagamento: ${error.message}`)
      }

      // Buscar pedido associado
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('id', paymentId)
        .single()

      if (payment) {
        // Atualizar status do pedido
        await this.updateOrderPaymentStatus(payment.order_id, status)
      }

      return true
    } catch (error) {
      console.error('Erro no webhook:', error)
      return false
    }
  }
}

