import { useState, useEffect } from 'react'
import { supabase } from '../../integrations/supabase/client'
import type { Payment, PaymentStatus } from '../../types'

export function usePayments(orderId?: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando pagamentos...')

      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (orderId) {
        query = query.eq('order_id', orderId)
      }

      const { data, error: fetchError } = await query

      console.log('📊 Resultado da busca:', { data, error: fetchError })

      if (fetchError) {
        console.error('❌ Erro ao buscar pagamentos:', fetchError)
        throw fetchError
      }

      // Transformar dados do Supabase para o formato local
      const transformedPayments: Payment[] = data?.map(payment => ({
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transaction_id || undefined,
        pixCode: payment.pix_code || undefined,
        pixQrCode: payment.pix_qr_code || undefined,
        paymentLink: payment.payment_link || undefined,
        notes: payment.notes || undefined,
        gatewayResponse: payment.gateway_response || undefined,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      })) || []

      console.log('✅ Pagamentos transformados:', transformedPayments)
      setPayments(transformedPayments)
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status }
            : payment
        )
      )

      return true
    } catch (err) {
      console.error('Erro ao atualizar status do pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return false
    }
  }

  const cancelPayment = async (paymentId: string) => {
    return updatePaymentStatus(paymentId, 'cancelled')
  }

  useEffect(() => {
    fetchPayments()
  }, [orderId])

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    updatePaymentStatus,
    cancelPayment
  }
}

export function usePayment(paymentId: string) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayment = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Transformar dados do Supabase para o formato local
      const transformedPayment: Payment = {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        transactionId: data.transaction_id || undefined,
        pixCode: data.pix_code || undefined,
        pixQrCode: data.pix_qr_code || undefined,
        paymentLink: data.payment_link || undefined,
        notes: data.notes || undefined,
        gatewayResponse: data.gateway_response || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setPayment(transformedPayment)
    } catch (err) {
      console.error('Erro ao buscar pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  return {
    payment,
    loading,
    error,
    refetch: fetchPayment
  }
}

