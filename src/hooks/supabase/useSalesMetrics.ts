import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { SalesMetrics } from '@/types'

export const useSalesMetrics = () => {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados de pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)

      if (ordersError) {
        throw ordersError
      }

      // Calcular métricas
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      
      // Calcular lucro total
      const totalProfit = orders?.reduce((sum, order) => {
        const orderProfit = order.order_items?.reduce((itemSum: number, item: any) => {
          const profit = (item.unit_price - item.products.purchase_price) * item.quantity
          return itemSum + profit
        }, 0) || 0
        return sum + orderProfit
      }, 0) || 0

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Top produtos
      const productSales = new Map()
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id
          const existing = productSales.get(productId) || {
            product: item.products,
            quantitySold: 0,
            revenue: 0
          }
          existing.quantitySold += item.quantity
          existing.revenue += item.total_price
          productSales.set(productId, existing)
        })
      })

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Pedidos por status
      const ordersByStatus = orders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Receita por mês (últimos 6 meses)
      const revenueByMonth = []
      const currentDate = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear()
        }) || []

        const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total_amount, 0)
        const monthProfit = monthOrders.reduce((sum, order) => {
          const orderProfit = order.order_items?.reduce((itemSum: number, item: any) => {
            const profit = (item.unit_price - item.products.purchase_price) * item.quantity
            return itemSum + profit
          }, 0) || 0
          return sum + orderProfit
        }, 0)

        revenueByMonth.push({
          month: monthKey,
          revenue: monthRevenue,
          profit: monthProfit
        })
      }

      const salesMetrics: SalesMetrics = {
        totalOrders,
        totalRevenue,
        totalProfit,
        averageOrderValue,
        topProducts,
        ordersByStatus,
        revenueByMonth
      }

      setMetrics(salesMetrics)
    } catch (err) {
      console.error('Error fetching sales metrics:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas de vendas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  }
}
