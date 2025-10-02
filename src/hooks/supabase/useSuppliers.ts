import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Supplier } from '@/types'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      const formattedSuppliers = data.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contact_name || undefined,
        email: supplier.email || undefined,
        phone: supplier.phone || undefined,
        cnpj: (supplier as any).cnpj || undefined,
        address: supplier.address || undefined,
        notes: supplier.notes || undefined,
        isActive: supplier.is_active,
        createdAt: new Date(supplier.created_at),
        updatedAt: new Date(supplier.updated_at)
      }))

      setSuppliers(formattedSuppliers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name,
          contact_name: supplierData.contactName,
          email: supplierData.email,
          phone: supplierData.phone,
          cnpj: supplierData.cnpj,
          address: supplierData.address,
          notes: supplierData.notes,
          is_active: supplierData.isActive
        })
        .select()
        .single()

      if (error) throw error

      const newSupplier: Supplier = {
        id: data.id,
        name: data.name,
        contactName: data.contact_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        cnpj: (data as any).cnpj || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setSuppliers(prev => [...prev, newSupplier])
      return newSupplier
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar fornecedor')
    }
  }

  const updateSupplier = async (id: string, supplierData: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          name: supplierData.name,
          contact_name: supplierData.contactName,
          email: supplierData.email,
          phone: supplierData.phone,
          cnpj: supplierData.cnpj,
          address: supplierData.address,
          notes: supplierData.notes,
          is_active: supplierData.isActive
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedSupplier: Supplier = {
        id: data.id,
        name: data.name,
        contactName: data.contact_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        cnpj: (data as any).cnpj || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setSuppliers(prev => prev.map(supplier => 
        supplier.id === id ? updatedSupplier : supplier
      ))
      return updatedSupplier
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar fornecedor')
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir fornecedor')
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers
  }
}
