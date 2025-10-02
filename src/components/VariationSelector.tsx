import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVariationAttributes } from '@/hooks/supabase/useVariationAttributes'
import { ColorSwatch } from '@/components/ColorSwatch'
import type { ProductVariation, VariationAttributeValue } from '@/types'
import { Plus, ShoppingCart } from 'lucide-react'

interface VariationSelectorProps {
  product: any // Produto com variações
  variations: ProductVariation[]
  onAddToCart: (variation: ProductVariation, quantity: number) => void
}

interface SelectedVariant {
  [attributeName: string]: string
}

export function VariationSelector({ product, variations, onAddToCart }: VariationSelectorProps) {
  const { attributes, attributeValues } = useVariationAttributes()
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant>({})
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [matchingVariation, setMatchingVariation] = useState<ProductVariation | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Definir atributos obrigatórios para este produto
  const requiredAttributes = product?.requiredAttributes?.map((ra: any) => ra.attribute) || []
  
  // Filtrar atributos e valores apenas para os obrigatórios
  const availableAttributeValues = attributeValues.filter(val => 
    requiredAttributes.some((attr: any) => attr.id === val.attributeId)
  )

  // Encontrar variação que corresponde à seleção atual
  useEffect(() => {
    if (Object.keys(selectedVariant).length === 0) {
      setMatchingVariation(null)
      return
    }

    const match = variations.find(variation => {
      return Object.keys(selectedVariant).every(attrName =>
        variation.attributes[attrName] === selectedVariant[attrName]
      )
    })

    setMatchingVariation(match || null)
  }, [selectedVariant, variations])

  // Obter valores disponíveis para um atributo específico
  const getAvailableValuesForAttribute = (attributeId: string) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute) return []

    return availableAttributeValues
      .filter(val => val.attributeId === attributeId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  // Obter variações disponíveis para um atributo específico
  const getVariationsForAttribute = (attributeId: string) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute) return []

    return variations
      .map(v => v.attributes[attribute.name])
      .filter((value, index, array) => array.indexOf(value) === index)
  }

  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedVariant(prev => ({
      ...prev,
      [attributeName]: value
    }))
  }

  const handleAddToCart = async () => {
    if (!matchingVariation) return

    setIsAddingToCart(true)
    try {
      await onAddToCart(matchingVariation, selectedQuantity)
      
      // Reset seleções após adicionar ao carrinho
      setSelectedVariant({})
      setSelectedQuantity(1)
      setMatchingVariation(null)
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const getCurrentPrice = () => {
    if (matchingVariation) {
      return matchingVariation.salePrice || product.salePrice
    }
    return product.salePrice
  }

  const isAllAttributesSelected = () => {
    return requiredAttributes.every((attr: any) => 
      selectedVariant[attr.name] !== undefined
    )
  }

  if (requiredAttributes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-600">
            R$ {getCurrentPrice().toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="quantity">Quantidade:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
            >
              -
            </Button>
            <span className="w-8 text-center font-semibold">{selectedQuantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedQuantity(selectedQuantity + 1)}
            >
            +
            </Button>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seleção de atributos */}
      <div className="space-y-3">
        {requiredAttributes.map((attribute: any) => {
          const availableValues = getAvailableValuesForAttribute(attribute.id)
          
          return (
            <div key={attribute.id}>
              <Label htmlFor={attribute.name}>
                {attribute.displayName} *
              </Label>
              <Select
                value={selectedVariant[attribute.name] || ''}
                onValueChange={(value) => handleAttributeChange(attribute.name, value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Selecione ${attribute.displayName}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableValues.map(value => (
                    <SelectItem key={value.value} value={value.value}>
                      <div className="flex items-center gap-2">
                        {value.colorCode && (
                          <ColorSwatch colorCode={value.colorCode} />
                        )}
                        {value.displayValue || value.value}
                        {!matchingVariation && 
                         getVariationsForAttribute(attribute.id).includes(value.value) &&
                         variations.filter(v => v.attributes[attribute.name] === value.value)
                           .every(v => !v.isAvailable || v.stock === 0) && (
                          <span className="text-xs text-red-500 ml-auto">
                            (Indisponível)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>

      {/* Informações da variação selecionada */}
      {matchingVariation && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {matchingVariation.sku && `SKU: ${matchingVariation.sku}`}
            </span>
            <span className="text-xl font-bold text-green-600">
              R$ {getCurrentPrice().toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Estoque:</span>
            <span className={`font-medium ${
              matchingVariation.stock > 10 
              ? 'text-green-600' 
              : matchingVariation.stock > 0 
              ? 'text-orange-600' 
              : 'text-red-600'
            }`}>
              {matchingVariation.stock} unidades
            </span>
          </div>

          {matchingVariation.stock === 0 && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              Esta variação está temporariamente fora de estoque
            </div>
          )}
        </div>
      )}

      {/* Seleção de quantidade e botão de adicionar ao carrinho */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="quantity">Quantidade:</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
            disabled={selectedQuantity <= 1}
          >
            -
          </Button>
          <span className="w-8 text-center font-semibold">{selectedQuantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedQuantity(selectedQuantity + 1)}
            disabled={matchingVariation && selectedQuantity >= matchingVariation.stock}
          >
            +
          </Button>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={
            !isAllAttributesSelected() || 
            !matchingVariation || 
            matchingVariation.stock === 0 ||
            isAddingToCart
          }
          className="flex-1"
        >
          {isAddingToCart ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adicionando...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar ao Carrinho
            </>
          )}
        </Button>
      </div>

      {/* Mensagens de ajuda */}
      {!isAllAttributesSelected() && (
        <p className="text-sm text-gray-500">
          Selecione todas as opções disponíveis para adicionar ao carrinho
        </p>
      )}

      {isAllAttributesSelected() && !matchingVariation && (
        <p className="text-sm text-red-500">
          Esta combinação não está disponível
        </p>
      )}
    </div>
  )
}
