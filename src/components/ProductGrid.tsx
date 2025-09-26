import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Package, Play, Image as ImageIcon } from 'lucide-react'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (productId: string, quantity: number, size?: string, color?: string) => void
}

interface CartItem {
  productId: string
  quantity: number
  size?: string
  color?: string
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({})
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const handleAddToCart = (product: Product) => {
    const cartItem = cartItems[product.id]
    if (!cartItem) {
      toast({
        title: "Erro",
        description: "Selecione a quantidade antes de adicionar ao carrinho.",
        variant: "destructive"
      })
      return
    }

    if (product.stock === 0) {
      toast({
        title: "Produto indisponível",
        description: "Este produto está fora de estoque.",
        variant: "destructive"
      })
      return
    }

    onAddToCart(
      product.id,
      cartItem.quantity,
      selectedSizes[product.id],
      selectedColors[product.id]
    )

    // Limpar seleções após adicionar
    setCartItems(prev => {
      const newItems = { ...prev }
      delete newItems[product.id]
      return newItems
    })
    setSelectedSizes(prev => {
      const newSizes = { ...prev }
      delete newSizes[product.id]
      return newSizes
    })
    setSelectedColors(prev => {
      const newColors = { ...prev }
      delete newColors[product.id]
      return newColors
    })

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`,
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => {
        const newItems = { ...prev }
        delete newItems[productId]
        return newItems
      })
    } else {
      setCartItems(prev => ({
        ...prev,
        [productId]: { ...prev[productId], productId, quantity }
      }))
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'camisetas':
        return '👕'
      case 'shorts':
        return '🩳'
      case 'equipamentos':
        return '🥊'
      default:
        return '📦'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'camisetas':
        return 'Camisetas'
      case 'shorts':
        return 'Shorts'
      case 'equipamentos':
        return 'Equipamentos'
      default:
        return category
    }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { text: 'Sem estoque', variant: 'destructive' as const }
    if (stock <= minStock) return { text: 'Estoque baixo', variant: 'secondary' as const }
    return { text: 'Em estoque', variant: 'default' as const }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const renderMedia = (product: Product) => {
    if (product.image) {
      // Verificar se é vídeo ou imagem
      const isVideo = product.image.match(/\.(mp4|webm|ogg|avi|mov)$/i)
      
      if (isVideo) {
        return (
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <video
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              controls
              preload="metadata"
              poster={product.image.replace(/\.(mp4|webm|ogg|avi|mov)$/i, '.jpg')}
            >
              <source src={product.image} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-black/70 text-white border-0 shadow-lg">
                <Play className="w-3 h-3 mr-1" />
                Vídeo
              </Badge>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )
      } else {
        return (
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Imagem não disponível</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )
      }
    }

    // Placeholder quando não há imagem
    return (
      <div className="aspect-square bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
        <div className="text-center text-gray-400 z-10">
          <div className="w-20 h-20 mx-auto mb-3 bg-white/50 rounded-full flex items-center justify-center shadow-lg">
            <Package className="w-10 h-10" />
          </div>
          <p className="text-lg font-bold text-gray-600">{getCategoryIcon(product.category)}</p>
          <p className="text-sm font-medium text-gray-500">{getCategoryLabel(product.category)}</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent" />
        <div className="absolute top-4 right-4 w-16 h-16 bg-red-100/50 rounded-full blur-xl" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-blue-100/50 rounded-full blur-lg" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock, product.minStock)
        const cartItem = cartItems[product.id]
        const isInCart = !!cartItem

        return (
          <Card key={product.id} className="group hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-0 shadow-md bg-white">
            {/* Mídia do produto */}
            <div className="relative overflow-hidden">
              {renderMedia(product)}
              
              {/* Overlay de hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              
              {/* Badge de categoria */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-white/95 text-gray-700 shadow-sm border-0 font-medium">
                  {getCategoryIcon(product.category)}
                </Badge>
              </div>

              {/* Badge de status do estoque */}
              <div className="absolute bottom-3 left-3">
                <Badge 
                  variant={stockStatus.variant} 
                  className={`shadow-sm border-0 font-medium ${
                    stockStatus.variant === 'destructive' 
                      ? 'bg-red-500 text-white' 
                      : stockStatus.variant === 'secondary'
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {stockStatus.text}
                </Badge>
              </div>

              {/* Indicador de oferta */}
              {product.isOffer && (
                <div className="absolute top-3 left-3">
                  <Badge variant="destructive" className="bg-red-600 text-white shadow-sm border-0 font-bold">
                    OFERTA
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Informações do produto */}
              <div className="space-y-2">
                <h3 className="font-bold text-xl leading-tight mb-2 group-hover:text-red-600 transition-colors text-gray-800">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Preço e estoque */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(product.isOffer && product.offerPrice ? product.offerPrice : product.salePrice)}
                  </span>
                  {product.isOffer && product.offerPrice && product.offerPrice < product.salePrice && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(product.salePrice)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Estoque: {product.stock}
                  </span>
                  {product.stock <= product.minStock && (
                    <p className="text-xs text-orange-600 font-medium">
                      Últimas unidades!
                    </p>
                  )}
                </div>
              </div>

              {/* Opções de tamanho e cor */}
              <div className="space-y-3">
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Tamanho
                    </label>
                    <Select
                      value={selectedSizes[product.id] || ''}
                      onValueChange={(value) => setSelectedSizes(prev => ({ ...prev, [product.id]: value }))}
                    >
                      <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Escolha o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.sizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Cor
                    </label>
                    <Select
                      value={selectedColors[product.id] || ''}
                      onValueChange={(value) => setSelectedColors(prev => ({ ...prev, [product.id]: value }))}
                    >
                      <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Escolha a cor" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Controle de quantidade e adicionar ao carrinho */}
              <div className="space-y-3 pt-2">
                {!isInCart ? (
                  <Button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.stock === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Quantidade:</span>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                          disabled={cartItem.quantity <= 1}
                          className="w-8 h-8 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-bold text-lg text-gray-800">
                          {cartItem.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                          disabled={cartItem.quantity >= product.stock}
                          className="w-8 h-8 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Confirmar Pedido
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
