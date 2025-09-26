import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Product } from '@/types'

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformar dados do Supabase para o formato local
      const transformedProducts: Product[] = data?.map(item => ({
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
        updatedAt: new Date(item.updated_at)
      })) || []

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
      if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice
      if (updates.salePrice !== undefined) updateData.sale_price = updates.salePrice
      if (updates.stock !== undefined) updateData.stock = updates.stock
      if (updates.minStock !== undefined) updateData.min_stock = updates.minStock
      if (updates.sizes !== undefined) updateData.sizes = updates.sizes
      if (updates.colors !== undefined) updateData.colors = updates.colors
      if (updates.image !== undefined) updateData.image_url = updates.image
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

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
