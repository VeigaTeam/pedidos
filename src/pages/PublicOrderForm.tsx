import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { usePublicProducts, type ProductFilters } from '@/hooks/supabase/usePublicProducts'
import { ProductGrid } from '@/components/ProductGrid'
import { ProductFilters as ProductFiltersComponent } from '@/components/ProductFilters'
import { CartModal } from '@/components/CartModal'
import { ShoppingCart, Package } from 'lucide-react'


interface CartItem {
  productId: string
  variationId?: string
  quantity: number
  size?: string
  color?: string
}

export default function PublicOrderForm() {
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    showOffersOnly: false
  })
  
  const { products, loading: productsLoading } = usePublicProducts(filters)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  const addToCart = (productId: string, quantity: number, size?: string, color?: string, variationId?: string) => {
    const uniqueKey = variationId ? `${productId}-${variationId}` : `${productId}-${size}-${color}`
    const existingItem = cart.find(item => {
      const itemKey = item.variationId ? `${item.productId}-${item.variationId}` : `${item.productId}-${item.size}-${item.color}`
      return itemKey === uniqueKey
    })

    if (existingItem) {
      setCart(cart.map(item => {
        const itemKey = item.variationId ? `${item.productId}-${item.variationId}` : `${item.productId}-${item.size}-${item.color}`
        return itemKey === uniqueKey
          ? { ...item, quantity: item.quantity + quantity }
          : item
      }))
    } else {
      setCart([...cart, { productId, variationId, quantity, size, color }])
    }
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    setCart(cart.map((item, i) => i === index ? { ...item, quantity } : item))
  }

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
  }

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      showOffersOnly: false
    })
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/pedidos/logo.png" 
              alt="CT VEIGA TEAM" 
              className="w-24 h-24 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-gradient">
                CT VEIGA TEAM
              </h1>
              <p className="text-xl text-muted-foreground">
                Faça seu pedido de produtos da academia
              </p>
            </div>
          </div>
          
          {/* Botão do carrinho */}
          <Button
            onClick={() => setIsCartModalOpen(true)}
            className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white shadow-lg"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrinho
            {cart.length > 0 && (
              <span className="ml-2 bg-white text-red-600 rounded-full px-2 py-1 text-xs font-bold">
                {cart.length}
              </span>
            )}
          </Button>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Filtros */}
          <ProductFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          {/* Lista de Produtos */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <CardTitle className="flex items-center gap-3 text-white text-2xl font-bold">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  Produtos Disponíveis
                  {products.length > 0 && (
                    <span className="text-red-100 text-lg font-normal">
                      ({products.length} produto{products.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-red-100 mt-2 text-base">
                  Selecione os produtos que deseja pedir para a academia
                </CardDescription>
              </div>
              <div className="p-6">
                {productsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-gray-600 text-lg">Carregando produtos...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum produto encontrado</h3>
                    <p className="text-gray-500">Tente ajustar os filtros para encontrar produtos</p>
                  </div>
                ) : (
                  <ProductGrid products={products} onAddToCart={addToCart} />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal do Carrinho */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        onUpdateCart={updateCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  )
}
