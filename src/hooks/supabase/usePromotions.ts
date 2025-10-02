// ... existing code ...

import { useState, useEffect } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { PromotionFormData } from '../../types'

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setPromotions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar promoções')
    } finally {
      setLoading(false)
    }
  }

  const createPromotion = async (promotionData: PromotionFormData) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from('promotions')
        .insert([{
          name: promotionData.name,
          description: promotionData.description,
          code: promotionData.code || null,
          promotion_type: promotionData.promotionType,
          discount_value: promotionData.discountValue,
          discount_percentage: promotionData.promotionType === 'percentage_discount' ? promotionData.discountValue : null,
          min_quantity: promotionData.minQuantity,
          min_cart_value: promotionData.minCartValue || null,
          min_discount_value: promotionData.minDiscountValue || null,
          max_discount_value: promotionData.maxDiscountValue || null,
          max_uses: promotionData.maxUses || null,
          max_uses_per_user: promotionData.maxUsesPerUser || null,
          start_date: promotionData.startDate,
          end_date: promotionData.endDate,
          is_active: promotionData.isActive,
          is_public: promotionData.isPublic !== undefined ? promotionData.isPublic : true,
          auto_apply: promotionData.autoApply || false,
          excluded_products: promotionData.excludedProducts || [],
          required_products: promotionData.requiredProducts || []
        }])
        .select()
        .single()
      
      if (createError) throw createError
      await fetchPromotions()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar promoção')
      throw err
    }
  }

  const updatePromotion = async (id: string, promotionData: Partial<PromotionFormData>) => {
    try {
      setError(null)
      const updateData: any = { updated_at: new Date().toISOString() }
      
      if (promotionData.name !== undefined) updateData.name = promotionData.name
      if (promotionData.description !== undefined) updateData.description = promotionData.description
      if (promotionData.code !== undefined) updateData.code = promotionData.code
      if (promotionData.promotionType !== undefined) updateData.promotion_type = promotionData.promotionType
      if (promotionData.discountValue !== undefined) updateData.discount_value = promotionData.discountValue
      if (promotionData.minQuantity !== undefined) updateData.min_quantity = promotionData.minQuantity
      if (promotionData.minCartValue !== undefined) updateData.min_cart_value = promotionData.minCartValue
      if (promotionData.minDiscountValue !== undefined) updateData.min_discount_value = promotionData.minDiscountValue
      if (promotionData.maxDiscountValue !== undefined) updateData.max_discount_value = promotionData.maxDiscountValue
      if (promotionData.maxUses !== undefined) updateData.max_uses = promotionData.maxUses
      if (promotionData.maxUsesPerUser !== undefined) updateData.max_uses_per_user = promotionData.maxUsesPerUser
      if (promotionData.startDate !== undefined) updateData.start_date = promotionData.startDate
      if (promotionData.endDate !== undefined) updateData.end_date = promotionData.endDate
      if (promotionData.isActive !== undefined) updateData.is_active = promotionData.isActive
      if (promotionData.isPublic !== undefined) updateData.is_public = promotionData.isPublic
      if (promotionData.autoApply !== undefined) updateData.auto_apply = promotionData.autoApply
      if (promotionData.excludedProducts !== undefined) updateData.excluded_products = promotionData.excludedProducts
      if (promotionData.requiredProducts !== undefined) updateData.required_products = promotionData.requiredProducts
      
      if (promotionData.promotionType === 'percentage_discount') {
        updateData.discount_percentage = promotionData.discountValue
      }
      
      const { error: updateError } = await supabase
        .from('promotions')
        .update(updateData)
        .eq('id', id)
      
      if (updateError) throw updateError
      await fetchPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar promoção')
      throw err
    }
  }

  const deletePromotion = async (id: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      await fetchPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir promoção')
      throw err
    }
  }

  const togglePromotionActive = async (id: string, isActive: boolean) => {
    try {
      setError(null)
      const { error: updateError } = await supabase
        .from('promotions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (updateError) throw updateError
      await fetchPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da promoção')
      
      throw err
    }
  }

  const applyPromotionToProducts = async (promotionId: string, productIds: string[]) => {
    try {
      setError(null)
      
      // Para múltiplos produtos, aplicar um por vez usando as funções PostgreSQL
      const promises = productIds.map(async (productId) => {
        const { data, error: applyError } = await supabase
          .rpc('apply_promotion_to_product', {
            p_product_id: productId,
            p_promotion_id: promotionId
          })
        
        if (applyError) throw applyError
        return data
      })
      
      await Promise.all(promises)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar promoção aos produtos')
      throw err
    }
  }

  const removePromotionFromProducts = async (promotionId: string, productIds: string[]) => {
    try {
      setError(null)
      
      // Para múltiplos produtos, remover um por vez usando as funções PostgreSQL
      const promises = productIds.map(async (productId) => {
        const { data, error: removeError } = await supabase
          .rpc('remove_promotion_from_product', {
            p_product_id: productId,
            p_promotion_id: promotionId
          })
        
        if (removeError) throw removeError
        return data
      })
      
      await Promise.all(promises)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover promoção dos produtos')
      throw err
    }
  }

  const getActivePromotions = () => {
    return promotions.filter(promo => 
      promo.is_active && 
      new Date(promo.start_date) <= new Date() && 
      new Date(promo.end_date) >= new Date() &&
      (promo.max_uses === null || promo.current_uses < promo.max_uses)
    )
  }

  const getPublicPromotions = () => {
    return getActivePromotions().filter(promo => promo.is_public)
  }

  const validatePromotionCode = async (code: string) => {
    try {
      const activePromotions = getActivePromotions()
      const promotion = activePromotions.find(p => p.code === code)
      
      if (!promotion) {
        return { valid: false, error: 'Código de promoção inválido ou expirado' }
      }

      if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
        return { valid: false, error: 'Promoção atingiu limite de uso' }
      }

      return { valid: true, promotion }
    } catch (err) {
      return { valid: false, error: 'Erro ao validar código de promoção' }
    }
  }

  const calculatePromotionDiscount = async (promotionId: string, productId: string, quantity: number = 1) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_discount', {
          p_promotion_id: promotionId,
          p_product_id: productId,
          p_quantity: quantity
        })
      
      if (error) throw error
      return data || 0
    } catch (err) {
      console.error('Erro ao calcular desconto:', err)
      return 0
    }
  }

  const getPromotionStats = async (promotionId?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_promotion_stats', {
          p_promotion_id: promotionId || null
        })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      return []
    }
  }

  const recordCouponUsage = async (promotionId: string, customerEmail: string, couponCode: string, discountApplied: number, orderId?: string) => {
    try {
      const { error } = await supabase
        .from('coupon_usages')
        .insert([{
          promotion_id: promotionId,
          customer_email: customerEmail,
          coupon_code: couponCode,
          discount_applied: discountApplied,
          order_id: orderId
        }])
      
      if (error) throw error
    } catch (err) {
      console.error('Erro ao registrar uso do cupom:', err)
    }
  }

  const recordPromotionApplication = async (promotionId: string, discountAmount: number, orderId?: string, customerEmail?: string, cartItems?: any[], appliedProducts?: string[]) => {
    try {
      const { error } = await supabase
        .from('promotion_applications')
        .insert([{
          promotion_id: promotionId,
          order_id: orderId,
          customer_email: customerEmail,
          discount_amount: discountAmount,
          cart_items: cartItems,
          applied_products: appliedProducts
        }])
      
      if (error) throw error
    } catch (err) {
      console.error('Erro ao registrar aplicação da promoção:', err)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

  const getDetailedStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_detailed_promotion_stats')
      
      if (error) throw error
      
      return data?.[0] || {}
    } catch (error) {
      console.error('Error fetching detailed stats:', error)
      throw error
    }
  }

  const applyPromotionToProduct = async (productId: string, promotionId: string, appliedBy: string = 'admin') => {
    try {
      const { error } = await supabase.rpc('apply_promotion_to_product', {
        p_product_id: productId,
        p_promotion_id: promotionId,
        p_applied_by: appliedBy
      })
      
      if (error) throw error
      
      await fetchPromotions()
      return true
    } catch (error) {
      console.error('Error applying promotion to product:', error)
      throw error
    }
  }

  const removePromotionFromProduct = async (productId: string, promotionId: string) => {
    try {
      const { error } = await supabase.rpc('remove_promotion_from_product', {
        p_product_id: productId,
        p_promotion_id: promotionId
      })
      
      if (error) throw error
      
      await fetchPromotions()
      return true
    } catch (error) {
      console.error('Error removing promotion from product:', error)
      throw error
    }
  }

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionActive,
    applyPromotionToProducts,
    removePromotionFromProducts,
    getActivePromotions,
    getPublicPromotions,
    validatePromotionCode,
    calculatePromotionDiscount,
    getPromotionStats,
    getDetailedStats,
    applyPromotionToProduct,
    removePromotionFromProduct,
    recordCouponUsage,
    recordPromotionApplication
  }
}