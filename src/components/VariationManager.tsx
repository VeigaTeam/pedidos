import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useVariationAttributes } from '@/hooks/supabase/useVariationAttributes'
import { useProductVariations } from '@/hooks/supabase/useProductVariations'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Product, ProductVariation } from '@/types'
import { ColorSwatch } from '@/components/ColorSwatch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Package,
  Palette,
  Ruler
} from 'lucide-react'

interface ProductVariationFormData {
  attributes: Record<string, string>
  purchasePrice: string
  salePrice: string
  stock: string
  minStock: string
  sku: string
  image: string
}

interface VariationManagerProps {
  product: Product
  onVariationsChange?: (variations: ProductVariation[]) => void
}

export function VariationManager({ product }: VariationManagerProps) {
  const { 
    attributes, 
    attributeValues
  } = useVariationAttributes()
  const {
    variations,
    loading,
    createVariation,
    updateVariation,
    deleteVariation,
    bulkCreateVariations
  } = useProductVariations(product.id)
  const { toast } = useToast()

  const [selectedRequiredAttributes, setSelectedRequiredAttributes] = useState<string[]>([])
  const [isCreatingVariations, setIsCreatingVariations] = useState(false)
  const [editingVariation, setEditingVariation] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductVariationFormData>({
    attributes: {},
    purchasePrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    sku: '',
    image: ''
  })

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedRequiredAttributes(prev => 
      prev.includes(attributeId) 
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    )
  }

  const handleAttributeValueChange = (attributeName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeName]: value
      }
    }))
  }

  const generateVariationCombinations = () => {
    if (selectedRequiredAttributes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um atributo obrigatório.",
        variant: "destructive"
      })
      return
    }

    const attributesToGenerate = selectedRequiredAttributes
    const attributeMap = new Map()
    
    // Organizar valores por atributo
    attributesToGenerate.forEach(attrId => {
      const attr = attributes.find(a => a.id === attrId)
      if (!attr) return
      
      const values = attributeValues.filter(v => v.attributeId === attrId)
      attributeMap.set(attr.name, values.map(v => v.value))
    })

    // Gerar todas as combinações possíveis
    const combinations = generateAllCombinations(attributeMap)
    
    if (combinations.length === 0) {
      toast({
        title: "Erro",
        description: "Não há valores suficientes para gerar combinações.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: `${combinations.length} variações serão criadas`,
      description: "Continuar com a criação das variações?",
    })

    setIsCreatingVariations(combinations.length > 50) // Se muitas variações, usar modo simplificado
  }

  const generateAllCombinations = (attributeMap: Map<string, string[]>) => {
    const keys = Array.from(attributeMap.keys())
    if (keys.length === 0) return []

    const generate = (index: number, current: Record<string, string>): Record<string, string>[] => {
      if (index === keys.length) {
        return [{ ...current }]
      }

      const attrName = keys[index]
      const values = attributeMap.get(attrName) || []
      
      const result: Record<string, string>[] = []
      values.forEach(value => {
        const combinations = generate(index + 1, { ...current, [attrName]: value })
        result.push(...combinations)
      })
      
      return result
    }

    return generate(0, {})
  }

  const createAllVariations = async () => {
    if (selectedRequiredAttributes.length === 0) return

    const attributeMap = new Map()
    selectedRequiredAttributes.forEach(attrId => {
      const attr = attributes.find(a => a.id === attrId)
      if (!attr) return
      
      const values = attributeValues.filter(v => v.attributeId === attrId)
      attributeMap.set(attr.name, values.map(v => v.value))
    })

    const combinations = generateAllCombinations(attributeMap)
    
    try {
      const variationsData = combinations.map((attributes, index) => ({
        attributes,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        profitMargin: 0, // Será calculado automaticamente pelo trigger do banco
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 0,
        sku: formData.sku ? `${formData.sku}-${index + 1}` : undefined,
        image: formData.image || undefined,
        isAvailable: true,
        sortOrder: index + 1
      }))

      await bulkCreateVariations(product.id, variationsData)
      
      toast({
        title: "Variações criadas",
        description: `${variationsData.length} variações foram criadas com sucesso.`,
      })

      setSelectedRequiredAttributes([])
      setFormData({
        attributes: {},
        purchasePrice: '',
        salePrice: '',
        stock: '',
        minStock: '',
        sku: '',
        image: ''
      })
      setIsCreatingVariations(false)
    } catch (error) {
      toast({
        title: "Erro ao criar variações",
        description: error instanceof Error ? error.message : "Erro ao criar variações.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const variationData = {
        productId: product.id,
        attributes: formData.attributes,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        profitMargin: 0, // Será calculado automaticamente pelo trigger do banco
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        sku: formData.sku || undefined,
        image: formData.image || undefined,
        isAvailable: true,
        sortOrder: variations.length + 1
      }

      if (editingVariation) {
        await updateVariation(editingVariation, variationData)
        toast({
          title: "Variação atualizada",
          description: "Variação atualizada com sucesso.",
        })
        setEditingVariation(null)
      } else {
        await createVariation(variationData)
        toast({
          title: "Variação criada",
          description: "Variação criada com sucesso.",
        })
      }
      
      resetForm()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar variação.",
        variant: "destructive"
      })
    }
  }

  const resetForm = () =>
    setFormData({
      attributes: {},
      purchasePrice: '',
      salePrice: '',
      stock: '',
      minStock: '',
      sku: '',
      image: ''
    })

  const handleEdit = (variation: ProductVariation) => {
    setFormData({
      attributes: variation.attributes,
      purchasePrice: variation.purchasePrice?.toString() || '',
      salePrice: variation.salePrice?.toString() || '',
      stock: variation.stock.toString(),
      minStock: variation.minStock.toString(),
      sku: variation.sku || '',
      image: variation.image || ''
    })
    setEditingVariation(variation.id)
  }

  const getAttributeDisplayValue = (attributeName: string, value: string) => {
    const attr = attributes.find(a => a.name === attributeName)
    if (!attr) return value
    
    const attrValue = attributeValues.find(v => 
      v.attributeId === attr.id && v.value === value
    )
    return attrValue?.displayValue || value
  }


  return (
    <div className="space-y-6">
      {/* Configuração de Atributos Obrigatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Atributos de Variação
          </CardTitle>
          <CardDescription>
            Selecione quais atributos são obrigatórios para este produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attributes.map((attribute) => (
                <div key={attribute.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={attribute.id}
                    checked={selectedRequiredAttributes.includes(attribute.id)}
                    onCheckedChange={() => handleAttributeToggle(attribute.id)}
                  />
                  <Label htmlFor={attribute.id} className="flex items-center gap-2">
                    {attribute.name === 'color' && <Palette className="w-4 h-4" />}
                    {attribute.name === 'size' && <Ruler className="w-4 h-4" />}
                    {attribute.displayName}
                  </Label>
                </div>
              ))}
            </div>

            {selectedRequiredAttributes.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={generateVariationCombinations}>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Variações Automaticamente
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulário para Variação Individual */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingVariation ? 'Editar Variação' : 'Adicionar Variação'}
          </CardTitle>
          <CardDescription>
            Crie uma variação específica para este produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRequiredAttributes.map(attrId => {
                const attribute = attributes.find(a => a.id === attrId)
                if (!attribute) return null

                const values = attributeValues.filter(bv => bv.attributeId === attrId)

                return (
                  <div key={attribute.id}>
                    <Label htmlFor={attribute.name}>
                      {attribute.displayName}
                    </Label>
                    <Select
                      value={formData.attributes[attribute.name] || ''}
                      onValueChange={(value) => handleAttributeValueChange(attribute.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${attribute.displayName}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {values.map(value => (
                          <SelectItem key={value.id} value={value.value}>
                            <div className="flex items-center gap-2">
              {value.colorCode && (
                <ColorSwatch colorCode={value.colorCode} />
              )}
                              {value.displayValue || value.value}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Preço de Compra</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Preço de Venda</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Código único da variação"
                />
              </div>
              <div>
                <Label htmlFor="image">URL da Imagem</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingVariation && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingVariation(null)
                    resetForm()
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingVariation ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>

      </Card>

      {/* Lista de Variações */}
      <Card>
        <CardHeader>
          <CardTitle>Variações do Produto ({variations.length})</CardTitle>
          <CardDescription>
            Variações criadas para {product.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando variações...</div>
          ) : variations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma variação criada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Atributos</TableHead>
                    <TableHead>Preço de Compra</TableHead>
                    <TableHead>Preço de Venda</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-medium">
                        {variation.sku || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(variation.attributes).map(([key, value]) => {
                            const displayValue = getAttributeDisplayValue(key, value)
                            const attr = attributes.find(a => a.name === key)
                            return (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{attr?.displayName || key}:</span>{' '}
                                <span>{displayValue}</span>
                              </div>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {variation.purchasePrice ? formatCurrency(variation.purchasePrice) : '-'}
                      </TableCell>
                      <TableCell>
                        {variation.salePrice ? formatCurrency(variation.salePrice) : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{variation.stock}</span>
                          {variation.stock <= variation.minStock && (
                            <span className="text-xs text-red-500 ml-1">(Baixo)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          variation.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {variation.isAvailable ? 'Disponível' : 'Indisponível'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(variation)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja excluir esta variação?')) {
                                try {
                                  await deleteVariation(variation.id)
                                  toast({
                                    title: "Variação excluída",
                                    description: "Variação excluída com sucesso.",
                                  })
                                } catch (error) {
                                  toast({
                                    title: "Erro",
                                    description: "Erro ao excluir variação.",
                                    variant: "destructive"
                                  })
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Criação em Massa */}
      {isCreatingVariations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Variações em Massa</CardTitle>
              <CardDescription>
                Configure os valores padrão para todas as variações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="massPurchasePrice">Preço de Compra Padrão</Label>
                <Input
                  id="massPurchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="massSalePrice">Preço de Venda Padrão</Label>
                <Input
                  id="massSalePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="massStock">Estoque Padrão</Label>
                <Input
                  id="massStock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingVariations(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={createAllVariations}>
                  Criar Todas as Variações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
