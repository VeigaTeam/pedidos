import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Category } from '@/types'

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Converter dados do banco (snake_case) para formato esperado (camelCase)
      const transformedData = (data || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        imageUrl: category.image_url,
        isActive: category.is_active,
        sortOrder: category.sort_order,
        createdAt: new Date(category.created_at),
        updatedAt: new Date(category.updated_at)
      }))
      
      setCategories(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name,
          description: categoryData.description,
          image_url: categoryData.imageUrl,
          is_active: categoryData.isActive ?? true,
          sort_order: 0
        }])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      await fetchCategories() // Recarregar lista
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria')
      throw err
    }
  }

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          description: categoryData.description,
          image_url: categoryData.imageUrl,
          is_active: categoryData.isActive,
          sort_order: categoryData.sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      await fetchCategories() // Recarregar lista
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria')
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      setError(null)

      // Primeiro, remover produtos desta categoria (seteando category_id como null)
      const { error: updateProductsError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id)

      if (updateProductsError) {
        throw updateProductsError
      }

      // Depois, marcar categoria como inativa (soft delete)
      const { error: deleteError } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      await fetchCategories() // Recarregar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria')
      throw err
    }
  }

  const toggleCategoryActive = async (id: string, isActive: boolean) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchCategories() // Recarregar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da categoria')
      throw err
    }
  }

  const updateCategoryOrder = async (categories: { id: string; sortOrder: number }[]) => {
    try {
      setError(null)

      // Atualizar ordens em lote
      const updates = categories.map(cat => 
        supabase
          .from('categories')
          .update({ sort_order: cat.sortOrder })
          .eq('id', cat.id)
      )

      const results = await Promise.all(updates)
      
      // Verificar se algum erro ocorreu
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw errors[0].error
      }

      await fetchCategories() // Recarregar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ordem das categorias')
      throw err
    }
  }

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id)
  }

  const getCategoryStats = () => {
    const totalCategories = categories.length
    const activeCategories = categories.filter(cat => cat.isActive).length
    const inactiveCategories = totalCategories - activeCategories
    const categoriesWithProducts = new Set() // Seria populado com joins mais tarde

    return {
      totalCategories,
      activeCategories,
      inactiveCategories,
      categoriesWithProducts: categoriesWithProducts.size
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    updateCategoryOrder,
    getCategoryById,
    getCategoryStats
  }
}
