import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  ShoppingCart,
  UserPlus
} from 'lucide-react'
import { useProducts } from '../hooks/supabase/useProducts'
import { useCategories } from '../hooks/supabase/useCategories'
import { useBrands } from '../hooks/supabase/useBrands'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatCurrency, formatDate } from '../lib/utils'

export default function PreSaleManagement() {
  const { products, loading: productsLoading, updateProduct } = useProducts()
  const { categories } = useCategories()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  
  const preSaleProducts = products.filter(product => 
    product.isPreSale || product.isPreSaleManual || product.isPreSaleAutoStock
  )
  
  const filteredProducts = preSaleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleTogglePreSale = async (productId: string, isPreSale: boolean) => {
    try {
      await updateProduct(productId, { isPreSale })
    } catch (error) {
      console.error('Erro ao atualizar pré-venda:', error)
    }
  }

  const handleBulkTogglePreSale = async (enabled: boolean) => {
    try {
      const promises = selectedProducts.map(productId =>
        updateProduct(productId, { isPreSale: enabled })
      )
      await Promise.all(promises)
      setSelectedProducts([])
    } catch (error) {
      console.error('Erro ao atualizar pré-venda em massa:', error)
    }
  }

  const preSaleStats = {
    totalPreSale: preSaleProducts.length,
    manualPreSale: products.filter(p => p.isPreSaleManual).length,
    autoPreSale: products.filter(p => p.isPreSaleAutoStock).length,
    activePreSale: products.filter(p => p.isPreSale && p.isActive).length,
  }

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestão de Pré-venda</h1>
          <p className="text-gray-600">Gerencie produtos em pré-venda e notificações</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleBulkTogglePreSale(true)}
            disabled={selectedProducts.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ativar Selecionados ({selectedProducts.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBulkTogglePreSale(false)}
            disabled={selectedProducts.length === 0}
          >
            <Package className="h-4 w-4 mr-2" />
            Desativar Selecionados
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pré-venda</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preSaleStats.totalPreSale}</div>
            <p className="text-xs text-muted-foreground">
              produtos em pré-venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual</CardTitle>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preSaleStats.manualPreSale}</div>
            <p className="text-xs text-muted-foreground">
              marcados manualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automático</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preSaleStats.autoPreSale}</div>
            <p className="text-xs text-muted-foreground">
              estoque zerado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preSaleStats.activePreSale}</div>
            <p className="text-xs text-muted-foreground">
              disponíveis para pedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrar por categoria"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos em Pré-venda ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`border rounded-lg p-4 ${
                    selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id])
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                          }
                        }}
                        className="rounded border-gray-300"
                        aria-label={`Selecionar produto ${product.name}`}
                      />
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={product.isPreSaleAutoStock ? 'destructive' : 'secondary'}>
                            {product.isPreSaleAutoStock ? 'Auto' : 'Manual'}
                          </Badge>
                          {product.preSaleUntil && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Até {formatDate(product.preSaleUntil)}
                            </Badge>
                          )}
                          {product.preSalePrice && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(product.preSalePrice)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Estoque: {product.stock} | Preço: {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePreSale(product.id, !product.isPreSale)}
                        className={product.isPreSale ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                      >
                        {product.isPreSale ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {product.preSaleReason && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <strong>Motivo:</strong> {product.preSaleReason}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum produto em pré-venda encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
