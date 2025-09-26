import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { emailService } from '@/lib/emailService'
import type { Order, OrderItem } from '@/types'

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedOrders: Order[] = data?.map(order => ({
        id: order.id,
        studentName: order.student_name,
        studentEmail: order.student_email,
        studentPhone: order.student_phone,
        totalAmount: order.total_amount,
        status: order.status,
        notes: order.notes || undefined,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          product: {
            id: item.products.id,
            name: item.products.name,
            category: item.products.category,
            description: item.products.description,
            purchasePrice: item.products.purchase_price,
            salePrice: item.products.sale_price,
            profitMargin: item.products.profit_margin,
            stock: item.products.stock,
            minStock: item.products.min_stock,
            sizes: item.products.sizes,
            colors: item.products.colors,
            image: item.products.image_url,
            isActive: item.products.is_active,
            createdAt: new Date(item.products.created_at),
            updatedAt: new Date(item.products.updated_at)
          },
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        })) || []
      })) || []

      setOrders(transformedOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (orderData: {
    studentName: string
    studentEmail: string
    studentPhone: string
    items: Array<{
      productId: string
      quantity: number
      size?: string
      color?: string
      unitPrice: number
      totalPrice: number
    }>
    totalAmount: number
    notes?: string
  }) => {
    try {
      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          student_name: orderData.studentName,
          student_email: orderData.studentEmail,
          student_phone: orderData.studentPhone,
          total_amount: orderData.totalAmount,
          notes: orderData.notes || null
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Criar os itens do pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      // Recarregar lista de pedidos
      await fetchOrders()
      
      // Enviar notificação por email
      try {
        const orderForEmail = {
          orderId: order.id,
          studentName: orderData.studentName,
          studentEmail: orderData.studentEmail,
          studentPhone: orderData.studentPhone,
          totalAmount: orderData.totalAmount,
          items: orderData.items,
          notes: orderData.notes,
          createdAt: new Date(order.created_at)
        }
        
        // Enviar email para admin
        await emailService.sendNewOrderNotification(orderForEmail)
        
        // Enviar email de confirmação para o cliente
        await emailService.sendOrderConfirmation(orderForEmail)
      } catch (emailError) {
        console.error('Erro ao enviar emails:', emailError)
        // Não falhar o pedido por erro de email
      }
      
      return order
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)

      if (error) {
        throw error
      }

      // Recarregar lista de pedidos
      await fetchOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      // Deletar itens do pedido primeiro
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id)

      if (itemsError) {
        throw itemsError
      }

      // Deletar o pedido
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (orderError) {
        throw orderError
      }

      // Recarregar lista de pedidos
      await fetchOrders()
    } catch (err) {
      console.error('Error deleting order:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder
  }
}
