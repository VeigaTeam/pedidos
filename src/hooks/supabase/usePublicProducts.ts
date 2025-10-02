import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Product } from '@/types'

export interface ProductFilters {
  search: string
  category: string
  sortBy: 'name' | 'price' | 'created_at'
  sortOrder: 'asc' | 'desc'
  showOffersOnly: boolean
}

export const usePublicProducts = (filters: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('products')
        .select(`
          *,
          variations:product_variations(*),
          required_attributes:product_required_attributes(
            *,
            attribute:variation_attributes(*)
          )
        `)
        .eq('is_active', true)

      // Aplicar filtros
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as 'camisetas' | 'shorts' | 'equipamentos')
      }

      if (filters.showOffersOnly) {
        query = query.eq('is_offer', true)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Aplicar ordenação
      const ascending = filters.sortOrder === 'asc'
      switch (filters.sortBy) {
        case 'name':
          query = query.order('name', { ascending })
          break
        case 'price':
          query = query.order('sale_price', { ascending })
          break
        case 'created_at':
          query = query.order('created_at', { ascending })
          break
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedProducts = data?.map(item => {
        // Calcular estoque total das variações
        const variationsStock = item.variations?.reduce((total: number, variation: any) => 
          total + (variation.stock || 0), 0) || 0
        
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description || undefined,
          purchasePrice: item.purchase_price,
          salePrice: item.sale_price,
          profitMargin: item.profit_margin,
          stock: item.stock,
          minStock: item.min_stock,
          sizes: item.sizes as string[] | undefined,
          colors: item.colors as string[] | undefined,
          image: item.image_url || undefined,
          isActive: item.is_active,
          isOffer: item.is_offer || false,
          offerPrice: item.offer_price || undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          variations: item.variations?.map((v: any) => ({
            id: v.id,
            productId: v.product_id,
            product: {} as Product,
            sku: v.sku,
            attributes: v.attributes || {},
            attributeValues: [],
            purchasePrice: v.purchase_price,
            salePrice: v.sale_price,
            profitMargin: v.profit_margin || 0,
            stock: v.stock || 0,
            minStock: v.min_stock || 0,
            image: v.image_url,
            isAvailable: v.is_available,
            sortOrder: v.sort_order,
            createdAt: new Date(v.created_at),
            updatedAt: new Date(v.updated_at)
          })) || [],
          requiredAttributes: item.required_attributes?.map((ra: any) => ({
            id: ra.attribute.id,
            name: ra.attribute.name,
            displayName: ra.attribute.display_name,
            description: ra.attribute.description,
            dataType: ra.attribute.data_type,
            isRequired: ra.attribute.is_required,
            sortOrder: ra.attribute.sort_order,
            isActive: ra.attribute.is_active,
            createdAt: new Date(ra.attribute.created_at),
            updatedAt: new Date(ra.attribute.updated_at)
          })) || [],
          totalStock: item.variations?.length > 0 ? variationsStock : item.stock
        }
      }) || []

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching public products:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filters.search, filters.category, filters.sortBy, filters.sortOrder, filters.showOffersOnly])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  }
}
