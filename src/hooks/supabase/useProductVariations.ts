import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { ProductVariation, VariationAttributeValue } from '@/types'

export const useProductVariations = (productId?: string) => {
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVariations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('product_variations')
        .select(`
          *,
          product:products(
            id,
            name,
            purchase_price,
            sale_price
          )
        `)

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query.order('sort_order')

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedVariations: ProductVariation[] = data?.map(item => ({
        id: item.id,
        productId: item.product_id,
        product: {
          id: item.product.id,
          name: item.product.name,
          category: 'camisetas' as const, // Será preenchido quando necessário
          description: '',
          purchasePrice: item.product.purchase_price,
          salePrice: item.product.sale_price,
          profitMargin: 0,
          stock: 0,
          minStock: 0,
          image: '',
          isActive: true,
          isOffer: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        sku: item.sku,
        attributes: item.attributes || {},
        attributeValues: [], // Será preenchido separadamente se necessário
        purchasePrice: item.purchase_price,
        salePrice: item.sale_price,
        profitMargin: item.profit_margin || 0,
        stock: item.stock,
        minStock: item.min_stock,
        image: item.image_url,
        isAvailable: item.is_available,
        sortOrder: item.sort_order,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []

      // Buscar valores de atributos para cada variação
      if (productId) {
        const enrichedVariations = await Promise.all(
          transformedVariations.map(async (variation) => {
            const attributeIds = Object.keys(variation.attributes)
            if (attributeIds.length === 0) return variation

            // Buscar valores de atributos
            const attributeValues = await Promise.all(
              attributeIds.map(async (attributeName) => {
                const valueKey = variation.attributes[attributeName]
                const { data: valueData } = await supabase
                  .from('variation_attribute_values')
                  .select(`
                    *,
                    attribute:variation_attributes(*)
                  `)
                  .eq('attribute.name', attributeName)
                  .eq('value', valueKey)
                  .single()

                if (!valueData) return null

                return {
                  id: valueData.id,
                  attributeId: valueData.attribute_id,
                  attribute: {
                    id: valueData.attribute.id,
                    name: valueData.attribute.name,
                    displayName: valueData.attribute.display_name,
                    description: valueData.attribute.description,
                    dataType: valueData.attribute.data_type,
                    isRequired: valueData.attribute.is_required,
                    sortOrder: valueData.attribute.sort_order,
                    isActive: valueData.attribute.is_active,
                    createdAt: new Date(valueData.attribute.created_at),
                    updatedAt: new Date(valueData.attribute.updated_at)
                  },
                  value: valueData.value,
                  displayValue: valueData.display_value,
                  colorCode: valueData.color_code,
                  sortOrder: valueData.sort_order,
                  isActive: valueData.is_active,
                  createdAt: new Date(valueData.created_at),
                  updatedAt: new Date(valueData.updated_at)
                } as VariationAttributeValue
              }).filter(Boolean)
            )

            return {
              ...variation,
              attributeValues: attributeValues.filter(Boolean) as VariationAttributeValue[]
            }
          })
        )

        setVariations(enrichedVariations)
      } else {
        setVariations(transformedVariations)
      }
    } catch (err) {
      console.error('Error fetching product variations:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar variações')
    } finally {
      setLoading(false)
    }
  }

  const createVariation = async (variationData: Omit<ProductVariation, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'attributeValues'>) => {
    try {
      const { data, error } = await supabase
        .from('product_variations')
        .insert({
          product_id: variationData.productId,
          sku: variationData.sku || null,
          attributes: variationData.attributes,
          purchase_price: variationData.purchasePrice || null,
          sale_price: variationData.salePrice || null,
          stock: variationData.stock,
          min_stock: variationData.minStock,
          image_url: variationData.image || null,
          is_available: variationData.isAvailable,
          sort_order: variationData.sortOrder
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      await fetchVariations()
      return data
    } catch (err) {
      console.error('Error creating product variation:', err)
      throw err
    }
  }

  const updateVariation = async (id: string, updates: Partial<ProductVariation>) => {
    try {
      const updateData: any = {}
      
      if (updates.sku !== undefined) updateData.sku = updates.sku
      if (updates.attributes !== undefined) updateData.attributes = updates.attributes
      if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice
      if (updates.salePrice !== undefined) updateData.sale_price = updates.salePrice
      if (updates.stock !== undefined) updateData.stock = updates.stock
      if (updates.minStock !== undefined) updateData.min_stock = updates.minStock
      if (updates.image !== undefined) updateData.image_url = updates.image
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

      const { error } = await supabase
        .from('product_variations')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchVariations()
    } catch (err) {
      console.error('Error updating product variation:', err)
      throw err
    }
  }

  const deleteVariation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchVariations()
    } catch (err) {
      console.error('Error deleting product variation:', err)
      throw err
    }
  }

  const bulkCreateVariations = async (productId: string, variations: Array<Omit<ProductVariation, 'id' | 'productId' | 'createdAt' | 'updatedAt' | 'product' | 'attributeValues'>>) => {
    try {
      const variationData = variations.map(variation => ({
        product_id: productId,
        sku: variation.sku || null,
        attributes: variation.attributes,
        purchase_price: variation.purchasePrice || null,
        sale_price: variation.salePrice || null,
        stock: variation.stock,
        min_stock: variation.minStock,
        image_url: variation.image || null,
        is_available: variation.isAvailable,
        sort_order: variation.sortOrder
      }))

      const { data, error } = await supabase
        .from('product_variations')
        .insert(variationData)
        .select()

      if (error) {
        throw error
      }

      await fetchVariations()
      return data
    } catch (err) {
      console.error('Error bulk creating variations:', err)
      throw err
    }
  }

  useEffect(() => {
    if (productId) {
      fetchVariations()
    }
  }, [productId])

  return {
    variations,
    loading,
    error,
    refetch: fetchVariations,
    createVariation,
    updateVariation,
    deleteVariation,
    bulkCreateVariations
  }
}
