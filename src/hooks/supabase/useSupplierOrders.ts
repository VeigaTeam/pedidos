import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { SupplierOrder, SupplierOrderItem, SupplierOrderStats } from '@/types'

export const useSupplierOrders = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('supplier_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:supplier_order_items(
            *,
            product:products(
              *,
              brand:brands(*),
              supplier:suppliers(*)
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Garantir que os pedidos tenham dados corretos calculados
      // Debug: Log dos dados brutos
      console.log('📊 Dados brutos dos pedidos:', data)

      const ordersWithCalculations = data.map((order: any) => {
        console.log('🔍 Processando pedido:', order.id, {
          orderDate: order.order_date,
          deliveryDate: order.delivery_date,
          orderDateCamel: order.orderDate,
          deliveryDateCamel: order.deliveryDate,
          totalAmount: order.total_amount,
          totalAmountCamel: order.totalAmount,
          subtotal: order.subtotal,
          shippingCost: order.shipping_cost,
          shippingCostCamel: order.shippingCost
        })

        // Usar nomes de colunas corretos do banco (snake_case)
        const rawOrderDate = order.order_date || order.orderDate
        const rawDeliveryDate = order.delivery_date || order.deliveryDate
        const rawTotalAmount = order.total_amount || order.totalAmount
        const rawSubtotal = order.subtotal
        const rawShippingCost = order.shipping_cost || order.shippingCost

        // Transformar datas com validação
        let orderDateResult: Date | undefined
        let deliveryDateResult: Date | undefined
        
        try {
          if (rawOrderDate) {
            const orderDate = new Date(rawOrderDate)
            orderDateResult = isNaN(orderDate.getTime()) ? undefined : orderDate
            console.log('📅 Data do pedido processada:', rawOrderDate, '→', orderDateResult)
          }
          
          if (rawDeliveryDate) {
            const deliveryDate = new Date(rawDeliveryDate)
            deliveryDateResult = isNaN(deliveryDate.getTime()) ? undefined : deliveryDate
            console.log('📅 Data de entrega processada:', rawDeliveryDate, '→', deliveryDateResult)
          }
        } catch (error) {
          console.warn('❌ Erro ao processar datas do pedido:', order.id, error)
        }

        // Calcular valores
        const finalSubtotal = rawSubtotal || 0
        const finalShippingCost = rawShippingCost || 0
        const calculatedTotal = finalSubtotal + finalShippingCost
        const finalTotalAmount = rawTotalAmount || calculatedTotal

        console.log('💰 Valores calculados:', {
          subtotal: finalSubtotal,
          shippingCost: finalShippingCost,
          calculatedTotal,
          finalTotalAmount
        })

        return {
          ...order,
          id: order.id,
          supplierId: order.supplier_id || order.supplierId,
          supplier: order.supplier,
          orderDate: orderDateResult,
          deliveryDate: deliveryDateResult,
          status: order.status,
          items: order.items || [],
          subtotal: finalSubtotal,
          shippingCost: finalShippingCost,
          totalAmount: finalTotalAmount,
          notes: order.notes,
          trackingNumber: order.tracking_number || order.trackingNumber,
          createdAt: new Date(order.created_at || order.createdAt),
          updatedAt: new Date(order.updated_at || order.updatedAt)
        }
      })

      setOrders(ordersWithCalculations as SupplierOrder[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (orderData: Omit<SupplierOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)

      const { data: order, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          supplier_id: orderData.supplierId,
          order_date: orderData.orderDate.toISOString(),
          delivery_date: orderData.deliveryDate?.toISOString(),
          status: orderData.status,
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shippingCost,
          notes: orderData.notes,
          tracking_number: orderData.trackingNumber
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Inserir itens do pedido
      if (orderData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('supplier_order_items')
          .insert(
            orderData.items.map(item => ({
              order_id: order.id,
              product_id: item.productId,
              quantity: item.quantity,
              purchase_price: item.purchasePrice,
              total_price: item.totalPrice,
              is_pre_sale: item.isPreSale,
              notes: item.notes
            }))
          )

        if (itemsError) {
          throw itemsError
        }
      }

      await fetchOrders()
      return order
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido')
      throw err
    }
  }

  const updateOrder = async (id: string, updates: Partial<SupplierOrder>) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('supplier_orders')
        .update({
          status: updates.status,
          delivery_date: updates.deliveryDate?.toISOString(),
          shipping_cost: updates.shippingCost,
          notes: updates.notes,
          tracking_number: updates.trackingNumber
        })
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pedido')
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('supplier_orders')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir pedido')
      throw err
    }
  }

  const addOrderItem = async (orderId: string, item: Omit<SupplierOrderItem, 'id'>) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('supplier_order_items')
        .insert({
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          purchase_price: item.purchasePrice,
          total_price: item.totalPrice,
          is_pre_sale: item.isPreSale,
          notes: item.notes
        })

      if (error) {
        throw error
      }

      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item')
      throw err
    }
  }

  const updateOrderItem = async (itemId: string, updates: Partial<SupplierOrderItem>) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('supplier_order_items')
        .update({
          quantity: updates.quantity,
          purchase_price: updates.purchasePrice,
          total_price: updates.totalPrice,
          is_pre_sale: updates.isPreSale,
          notes: updates.notes
        })
        .eq('id', itemId)

      if (error) {
        throw error
      }

      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item')
      throw err
    }
  }

  const deleteOrderItem = async (itemId: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('supplier_order_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        throw error
      }

      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item')
      throw err
    }
  }

  const getStats = async (): Promise<SupplierOrderStats> => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('supplier_orders')
        .select(`
          status,
          items:supplier_order_items(
            is_pre_sale,
            total_price,
            quantity,
            order_id
          )
        `)

      if (ordersError) {
        console.error('Erro ao buscar dados de pedidos:', ordersError)
        throw ordersError
      }

      let totalPreSaleItems = 0
      let totalStockItems = 0
      let totalPreSaleValue = 0
      let totalStockValue = 0
      let totalDeliveryDays = 0
      let deliveredOrdersCount = 0

      const ordersByStatus: Record<string, number> = {}

      if (!ordersData || ordersData.length === 0) {
        return {
          totalPreSaleItems: 0,
          totalStockItems: 0,
          totalPreSaleValue: 0,
          totalStockValue: 0,
          averageDeliveryDays: 0,
          ordersByStatus: {}
        }
      }

      ordersData.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.is_pre_sale) {
              totalPreSaleItems += item.quantity || 0
              totalPreSaleValue += item.total_price || 0
            } else {
              totalStockItems += item.quantity || 0
              totalStockValue += item.total_price || 0
            }
          })
        }
      })

      // Calcular média de dias de entrega para pedidos entregues
      const { data: deliveredOrders, error: deliveredError } = await supabase
        .from('supplier_orders')
        .select('order_date, delivery_date')
        .eq('status', 'delivered')
        .not('delivery_date', 'is', null)

      if (!deliveredError && deliveredOrders) {
        deliveredOrders.forEach(order => {
          const orderDate = new Date(order.order_date)
          const deliveryDate = new Date(order.delivery_date)
          const diffTime = deliveryDate.getTime() - orderDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 0) {
            totalDeliveryDays += diffDays
            deliveredOrdersCount++
          }
        })
      }

      return {
        totalPreSaleItems,
        totalStockItems,
        totalPreSaleValue,
        totalStockValue,
        averageDeliveryDays: deliveredOrdersCount > 0 ? Math.round(totalDeliveryDays / deliveredOrdersCount) : 0,
        ordersByStatus
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erro ao calcular estatísticas')
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    getStats,
    refresh: fetchOrders
  }
}
