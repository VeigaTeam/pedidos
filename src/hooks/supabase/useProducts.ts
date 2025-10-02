import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Product, ProductVariation, VariationAttribute } from '@/types'

export const useProducts = () => {
  const [products, setProducts] = useState<(Product & { 
    variations: ProductVariation[], 
    requiredAttributes: VariationAttribute[],
    totalStock: number 
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*),
          supplier:suppliers(*),
          category:categories(*),
          variations:product_variations(*),
          required_attributes:product_required_attributes(
            *,
            attribute:variation_attributes(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedProducts = data?.map(item => {
        // Calcular estoque total das variações
        const variationsStock = item.variations?.reduce((total, variation) => 
          total + (variation.stock || 0), 0) || 0
        
        // Transformar variações
        const variations: ProductVariation[] = item.variations?.map((varItem: any) => ({
          id: varItem.id,
          productId: varItem.product_id,
          product: {} as Product, // Evita referência circular
          sku: varItem.sku,
          attributes: varItem.attributes || {},
          attributeValues: [],
          purchasePrice: varItem.purchase_price,
          salePrice: varItem.sale_price,
          profitMargin: varItem.profit_margin || 0,
          stock: varItem.stock || 0,
          minStock: varItem.min_stock || 0,
          image: varItem.image_url,
          isAvailable: varItem.is_available,
          sortOrder: varItem.sort_order,
          createdAt: new Date(varItem.created_at),
          updatedAt: new Date(varItem.updated_at)
        })) || []

        // Transformar atributos obrigatórios
        const requiredAttributes: VariationAttribute[] = item.required_attributes?.map((reqItem: any) => ({
          id: reqItem.attribute.id,
          name: reqItem.attribute.name,
          displayName: reqItem.attribute.display_name,
          description: reqItem.attribute.description,
          dataType: reqItem.attribute.data_type,
          isRequired: reqItem.attribute.is_required,
          sortOrder: reqItem.attribute.sort_order,
          isActive: reqItem.attribute.is_active,
          createdAt: new Date(reqItem.attribute.created_at),
          updatedAt: new Date(reqItem.attribute.updated_at)
        })) || []

        return {
          id: item.id,
          name: item.name,
          categoryId: item.category_id || undefined,
          category: item.category ? {
            id: item.category.id,
            name: item.category.name,
            description: item.category.description,
            isActive: item.category.is_active,
            createdAt: new Date(item.category.created_at),
            updatedAt: new Date(item.category.updated_at)
          } : undefined,
          description: item.description || undefined,
          brandId: item.brand_id || undefined,
          brand: item.brand ? {
            id: item.brand.id,
            name: item.brand.name,
            description: item.brand.description,
            supplierId: item.brand.supplier_id,
            isActive: item.brand.is_active,
            createdAt: new Date(item.brand.created_at),
            updatedAt: new Date(item.brand.updated_at)
          } : undefined,
          supplierId: item.supplier_id || undefined,
          supplier: item.supplier ? {
            id: item.supplier.id,
            name: item.supplier.name,
            contactName: item.supplier.contact_name,
            email: item.supplier.email,
            phone: item.supplier.phone,
            address: item.supplier.address,
            notes: item.supplier.notes,
            isActive: item.supplier.is_active,
            createdAt: new Date(item.supplier.created_at),
            updatedAt: new Date(item.supplier.updated_at)
          } : undefined,
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
          originalPrice: item.original_price || undefined,
          isPreSale: item.is_pre_sale || false,
          isPreSaleManual: item.is_pre_sale_manual || false,
          isPreSaleAutoStock: item.is_pre_sale_auto_stock || false,
          preSaleUntil: item.pre_sale_until ? new Date(item.pre_sale_until) : undefined,
          preSalePrice: item.pre_sale_price || undefined,
          availabilityStatus: item.availability_status || 'available',
          preSaleReason: item.pre_sale_reason || undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          variations,
          requiredAttributes,
          totalStock: item.variations?.length > 0 ? variationsStock : item.stock
        } as Product & { 
          variations: ProductVariation[], 
          requiredAttributes: VariationAttribute[],
          totalStock: number 
        }
      }) || []

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          category: productData.category,
          description: productData.description || null,
          brand_id: productData.brandId || null,
          supplier_id: productData.supplierId || null,
          purchase_price: productData.purchasePrice,
          sale_price: productData.salePrice,
          stock: productData.stock,
          min_stock: productData.minStock,
          sizes: productData.sizes || null,
          colors: productData.colors || null,
          image_url: productData.image || null,
          is_active: productData.isActive
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Recarregar lista de produtos
      await fetchProducts()
      return data
    } catch (err) {
      console.error('Error creating product:', err)
      throw err
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updateData: any = {}
      
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.brandId !== undefined) updateData.brand_id = updates.brandId
      if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId
      if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice
      if (updates.salePrice !== undefined) updateData.sale_price = updates.salePrice
      if (updates.stock !== undefined) updateData.stock = updates.stock
      if (updates.minStock !== undefined) updateData.min_stock = updates.minStock
      if (updates.sizes !== undefined) updateData.sizes = updates.sizes
      if (updates.colors !== undefined) updateData.colors = updates.colors
      if (updates.image !== undefined) updateData.image_url = updates.image
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.isPreSale !== undefined) updateData.is_pre_sale = updates.isPreSale
      if (updates.isPreSaleManual !== undefined) updateData.is_pre_sale_manual = updates.isPreSaleManual
      if (updates.isPreSaleAutoStock !== undefined) updateData.is_pre_sale_auto_stock = updates.isPreSaleAutoStock
      if (updates.preSaleUntil !== undefined) updateData.pre_sale_until = updates.preSaleUntil
      if (updates.preSalePrice !== undefined) updateData.pre_sale_price = updates.preSalePrice
      if (updates.preSaleReason !== undefined) updateData.pre_sale_reason = updates.preSaleReason
      if (updates.availabilityStatus !== undefined) updateData.availability_status = updates.availabilityStatus

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      // Recarregar lista de produtos
      await fetchProducts()
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // Recarregar lista de produtos
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const updateProductImage = async (id: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', id)

      if (error) {
        throw error
      }

      // Recarregar lista de produtos
      await fetchProducts()
    } catch (err) {
      console.error('Error updating product image:', err)
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductImage
  }
}
