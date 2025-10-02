import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Brand, Supplier } from '@/types'

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('brands')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      const formattedBrands = data.map(brand => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        supplierId: brand.supplier_id,
        supplier: brand.supplier ? {
          id: brand.supplier.id,
          name: brand.supplier.name,
          contactName: brand.supplier.contact_name,
          email: brand.supplier.email,
          phone: brand.supplier.phone,
          address: brand.supplier.address,
          notes: brand.supplier.notes,
          isActive: brand.supplier.is_active,
          createdAt: new Date(brand.supplier.created_at),
          updatedAt: new Date(brand.supplier.updated_at)
        } as Supplier : undefined,
        isActive: brand.is_active,
        createdAt: new Date(brand.created_at),
        updatedAt: new Date(brand.updated_at)
      }))

      setBrands(formattedBrands)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar marcas')
    } finally {
      setLoading(false)
    }
  }

  const createBrand = async (brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'supplier'>) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: brandData.name,
          description: brandData.description,
          supplier_id: brandData.supplierId,
          is_active: brandData.isActive
        })
        .select()
        .single()

      if (error) throw error

      const newBrand: Brand = {
        id: data.id,
        name: data.name,
        description: data.description,
        supplierId: data.supplier_id,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setBrands(prev => [...prev, newBrand])
      return newBrand
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar marca')
    }
  }

  const updateBrand = async (id: string, brandData: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'supplier'>>) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .update({
          name: brandData.name,
          description: brandData.description,
          supplier_id: brandData.supplierId,
          is_active: brandData.isActive
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedBrand: Brand = {
        id: data.id,
        name: data.name,
        description: data.description,
        supplierId: data.supplier_id,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setBrands(prev => prev.map(brand => 
        brand.id === id ? updatedBrand : brand
      ))
      return updatedBrand
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar marca')
    }
  }

  const deleteBrand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setBrands(prev => prev.filter(brand => brand.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir marca')
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  return {
    brands,
    loading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    refetch: fetchBrands
  }
}
