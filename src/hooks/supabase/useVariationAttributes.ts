import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { VariationAttribute, VariationAttributeValue } from '@/types'

export const useVariationAttributes = () => {
  const [attributes, setAttributes] = useState<VariationAttribute[]>([])
  const [attributeValues, setAttributeValues] = useState<VariationAttributeValue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttributes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('variation_attributes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        throw error
      }

      const transformedAttributes: VariationAttribute[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        displayName: item.display_name,
        description: item.description,
        dataType: item.data_type,
        isRequired: item.is_required,
        sortOrder: item.sort_order,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []

      setAttributes(transformedAttributes)
    } catch (err) {
      console.error('Error fetching variation attributes:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar atributos')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttributeValues = async () => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('variation_attribute_values')
        .select(`
          *,
          attribute:variation_attributes(*)
        `)
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        throw error
      }

      const transformedValues: VariationAttributeValue[] = data?.map(item => ({
        id: item.id,
        attributeId: item.attribute_id,
        attribute: {
          id: item.attribute.id,
          name: item.attribute.name,
          displayName: item.attribute.display_name,
          description: item.attribute.description,
          dataType: item.attribute.data_type,
          isRequired: item.attribute.is_required,
          sortOrder: item.attribute.sort_order,
          isActive: item.attribute.is_active,
          createdAt: new Date(item.attribute.created_at),
          updatedAt: new Date(item.attribute.updated_at)
        },
        value: item.value,
        displayValue: item.display_value,
        colorCode: item.color_code,
        sortOrder: item.sort_order,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []

      setAttributeValues(transformedValues)
    } catch (err) {
      console.error('Error fetching attribute values:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar valores de atributos')
    }
  }

  const createAttribute = async (attributeData: Omit<VariationAttribute, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('variation_attributes')
        .insert({
          name: attributeData.name,
          display_name: attributeData.displayName,
          description: attributeData.description || null,
          data_type: attributeData.dataType,
          is_required: attributeData.isRequired,
          sort_order: attributeData.sortOrder,
          is_active: attributeData.isActive
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      await fetchAttributes()
      return data
    } catch (err) {
      console.error('Error creating variation attribute:', err)
      throw err
    }
  }

  const updateAttribute = async (id: string, updates: Partial<VariationAttribute>) => {
    try {
      const updateData: any = {}
      
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.dataType !== undefined) updateData.data_type = updates.dataType
      if (updates.isRequired !== undefined) updateData.is_required = updates.isRequired
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await supabase
        .from('variation_attributes')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchAttributes()
    } catch (err) {
      console.error('Error updating variation attribute:', err)
      throw err
    }
  }

  const deleteAttribute = async (id: string) => {
    try {
      const { error } = await supabase
        .from('variation_attributes')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchAttributes()
    } catch (err) {
      console.error('Error deleting variation attribute:', err)
      throw err
    }
  }

  const createAttributeValue = async (valueData: Omit<VariationAttributeValue, 'id' | 'createdAt' | 'updatedAt' | 'attribute'>) => {
    try {
      const { data, error } = await supabase
        .from('variation_attribute_values')
        .insert({
          attribute_id: valueData.attributeId,
          value: valueData.value,
          display_value: valueData.displayValue || null,
          color_code: valueData.colorCode || null,
          sort_order: valueData.sortOrder,
          is_active: valueData.isActive
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      await fetchAttributeValues()
      return data
    } catch (err) {
      console.error('Error creating attribute value:', err)
      throw err
    }
  }

  const updateAttributeValue = async (id: string, updates: Partial<VariationAttributeValue>) => {
    try {
      const updateData: any = {}
      
      if (updates.attributeId !== undefined) updateData.attribute_id = updates.attributeId
      if (updates.value !== undefined) updateData.value = updates.value
      if (updates.displayValue !== undefined) updateData.display_value = updates.displayValue
      if (updates.colorCode !== undefined) updateData.color_code = updates.colorCode
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await supabase
        .from('variation_attribute_values')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchAttributeValues()
    } catch (err) {
      console.error('Error updating attribute value:', err)
      throw err
    }
  }

  const deleteAttributeValue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('variation_attribute_values')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchAttributeValues()
    } catch (err) {
      console.error('Error deleting attribute value:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchAttributes()
    fetchAttributeValues()
  }, [])

  return {
    attributes,
    attributeValues,
    loading,
    error,
    refetchAttributes: fetchAttributes,
    refetchAttributeValues: fetchAttributeValues,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    createAttributeValue,
    updateAttributeValue,
    deleteAttributeValue
  }
}
