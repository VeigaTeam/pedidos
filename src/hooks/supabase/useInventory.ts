import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { InventoryAlert } from '@/types'

export const useInventory = () => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (*)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedAlerts: InventoryAlert[] = data?.map(alert => ({
        id: alert.id,
        productId: alert.product_id,
        product: {
          id: alert.products.id,
          name: alert.products.name,
          category: alert.products.category,
          description: alert.products.description,
          purchasePrice: alert.products.purchase_price,
          salePrice: alert.products.sale_price,
          profitMargin: alert.products.profit_margin,
          stock: alert.products.stock,
          minStock: alert.products.min_stock,
          sizes: alert.products.sizes,
          colors: alert.products.colors,
          image: alert.products.image_url,
          isActive: alert.products.is_active,
          createdAt: new Date(alert.products.created_at),
          updatedAt: new Date(alert.products.updated_at)
        },
        currentStock: alert.current_stock,
        minStock: alert.min_stock,
        alertType: alert.alert_type,
        createdAt: new Date(alert.created_at)
      })) || []

      setAlerts(transformedAlerts)
    } catch (err) {
      console.error('Error fetching inventory alerts:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar alertas de estoque')
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ is_resolved: true })
        .eq('id', alertId)

      if (error) {
        throw error
      }

      // Recarregar alertas
      await fetchAlerts()
    } catch (err) {
      console.error('Error resolving alert:', err)
      throw err
    }
  }

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)

      if (error) {
        throw error
      }

      // Recarregar alertas
      await fetchAlerts()
    } catch (err) {
      console.error('Error updating product stock:', err)
      throw err
    }
  }

  const getInventoryMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock, purchase_price, min_stock')

      if (error) {
        throw error
      }

      const totalValue = data?.reduce((sum, product) => 
        sum + (product.stock * product.purchase_price), 0
      ) || 0

      const lowStockCount = data?.filter(product => 
        product.stock <= product.min_stock
      ).length || 0

      const outOfStockCount = data?.filter(product => 
        product.stock === 0
      ).length || 0

      return {
        totalValue,
        lowStockCount,
        outOfStockCount,
        totalProducts: data?.length || 0
      }
    } catch (err) {
      console.error('Error getting inventory metrics:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    resolveAlert,
    updateProductStock,
    getInventoryMetrics
  }
}
