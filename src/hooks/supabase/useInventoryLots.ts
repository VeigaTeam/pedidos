import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface InventoryLot {
  id: string
  productId: string
  supplierOrderId?: string
  originalQuantity: number
  currentQuantity: number
  unitCost: number
  purchasePrice: number
  freightCostPerUnit: number
  lotNumber?: string
  receivedDate: Date
  expiryDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductCostInfo {
  productId: string
  averageCost: number
  totalQuantity: number
  lotCount: number
  oldestLotDate?: Date
  newestLotDate?: Date
}

export const useInventoryLots = () => {
  const [lots, setLots] = useState<InventoryLot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLots()
  }, [])

  const fetchLots = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('inventory_lots')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setLots(data as InventoryLot[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lotes')
    } finally {
      setLoading(false)
    }
  }

  const processSupplierOrderDelivery = async (orderId: string): Promise<string> => {
    try {
      setError(null)

      const { data, error } = await supabase
        .rpc('process_supplier_order_delivery', { order_id: orderId })

      if (error) {
        throw error
      }

      await fetchLots()
      return data || 'Entrega processada com sucesso'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar entrega'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const consumeInventory = async (
    productId: string,
    quantity: number,
    purpose: string = 'sale'
  ): Promise<string> => {
    try {
      setError(null)

      const { data, error } = await supabase
        .rpc('consume_inventory_by_fifo', {
          target_product_id: productId,
          quantity_to_consume: quantity,
          consumption_purpose: purpose
        })

      if (error) {
        throw error
      }

      await fetchLots()
      return data || 'Consumo realizado com sucesso'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao consumir estoque'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getProductAverageCost = async (productId: string): Promise<number> => {
    try {
      setError(null)

      const { data, error } = await supabase
        .rpc('get_product_average_cost', { target_product_id: productId })

      if (error) {
        throw error
      }

      return data || 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular custo médio'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getProductCostInfo = async (productId: string): Promise<ProductCostInfo> => {
    try {
      setError(null)

      const productLots = lots.filter(lot => lot.productId === productId)
      
      if (productLots.length === 0) {
        return {
          productId,
          averageCost: 0,
          totalQuantity: 0,
          lotCount: 0
        }
      }

      const totalQuantity = productLots.reduce((sum, lot) => sum + lot.currentQuantity, 0)
      const totalValue = productLots.reduce((sum, lot) => sum + (lot.unitCost * lot.currentQuantity), 0)
      const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0

      const sortedDates = productLots
        .map(lot => new Date(lot.receivedDate))
        .sort()

      return {
        productId,
        averageCost,
        totalQuantity,
        lotCount: productLots.length,
        oldestLotDate: sortedDates[0],
        newestLotDate: sortedDates[sortedDates.length - 1]
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular informações de custo'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getLotsByProduct = (productId: string): InventoryLot[] => {
    return lots.filter(lot => lot.productId === productId)
  }

  const getActiveLotsByProduct = (productId: string): InventoryLot[] => {
    return lots.filter(lot => 
      lot.productId === productId && 
      lot.currentQuantity > 0
    ).sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime())
  }

  const calculateFreightPerUnit = (
    itemQuantity: number,
    itemPurchasePrice: number,
    totalItemsValue: number,
    shippingCost: number
  ): number => {
    if (shippingCost === 0 || totalItemsValue === 0) return 0
    
    const itemValue = itemQuantity * itemPurchasePrice
    const freightProportion = itemValue / totalItemsValue
    return (freightProportion * shippingCost) / itemQuantity
  }

  const calculateRealCostPerUnit = (
    purchasePrice: number,
    freightPerUnit: number
  ): number => {
    return purchasePrice + freightPerUnit
  }

  return {
    lots,
    loading,
    error,
    processSupplierOrderDelivery,
    consumeInventory,
    getProductAverageCost,
    getProductCostInfo,
    getLotsByProduct,
    getActiveLotsByProduct,
    calculateFreightPerUnit,
    calculateRealCostPerUnit,
    refresh: fetchLots
  }
}
