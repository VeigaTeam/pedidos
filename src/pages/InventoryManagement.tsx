import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProducts } from '@/hooks/supabase/useProducts'
import { useInventory } from '@/hooks/supabase/useInventory'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { 
  Warehouse, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  Plus,
  Minus
} from 'lucide-react'

export default function InventoryManagement() {
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const { loading: alertsLoading, error: alertsError, updateProductStock } = useInventory()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.stock <= product.minStock) ||
                        (stockFilter === 'out' && product.stock === 0) ||
                        (stockFilter === 'good' && product.stock > product.minStock)
    return matchesSearch && matchesCategory && matchesStock
  })

  if (productsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando estoque...</div>
      </div>
    )
  }

  if (productsError || alertsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar dados: {productsError || alertsError}</div>
      </div>
    )
  }

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'camisetas', label: 'Camisetas' },
    { value: 'shorts', label: 'Shorts' },
    { value: 'equipamentos', label: 'Equipamentos' }
  ]

  const stockFilters = [
    { value: 'all', label: 'Todos os Produtos' },
    { value: 'good', label: 'Estoque OK' },
    { value: 'low', label: 'Estoque Baixo' },
    { value: 'out', label: 'Sem Estoque' }
  ]

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.label : category
  }

  const getStockStatus = (product: typeof products[0]) => {
    if (product.stock === 0) {
      return {
        status: 'out',
        color: 'bg-red-100 text-red-800',
        text: 'Sem Estoque',
        icon: <AlertTriangle className="w-4 h-4" />
      }
    }
    if (product.stock <= product.minStock) {
      return {
        status: 'low',
        color: 'bg-orange-100 text-orange-800',
        text: 'Estoque Baixo',
        icon: <AlertTriangle className="w-4 h-4" />
      }
    }
    return {
      status: 'good',
      color: 'bg-green-100 text-green-800',
      text: 'Estoque OK',
      icon: <CheckCircle className="w-4 h-4" />
    }
  }

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      await updateProductStock(productId, Math.max(0, newStock))
      toast({
        title: "Estoque atualizado",
        description: "Estoque do produto atualizado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estoque do produto.",
        variant: "destructive"
      })
    }
  }

  const handleAdjustStock = async (productId: string, adjustment: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      await handleUpdateStock(productId, product.stock + adjustment)
    }
  }

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  const outOfStockProducts = products.filter(p => p.stock === 0)
  const totalInventoryValue = products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0)

  const stats = [
    {
      title: 'Total de Produtos',
      value: products.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Valor do Estoque',
      value: formatCurrency(totalInventoryValue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Estoque Baixo',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    },
    {
      title: 'Sem Estoque',
      value: outOfStockProducts.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Gestão de Estoque</h1>
        <p className="text-muted-foreground">
          Controle e monitoramento do estoque de produtos
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de Estoque */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>
              Produtos que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...outOfStockProducts, ...lowStockProducts.filter(p => p.stock > 0)].map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <div key={product.id} className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Estoque atual: <span className="font-medium">{product.stock}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: <span className="font-medium">{product.minStock}</span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(product.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(product.id, -1)}
                        disabled={product.stock === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label htmlFor="stock">Status do Estoque</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            Estoque ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os produtos e seu estoque atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor do Estoque</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const stockValue = product.stock * product.purchasePrice
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getCategoryLabel(product.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{product.stock}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdjustStock(product.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdjustStock(product.id, -1)}
                              disabled={product.stock === 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{product.minStock}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {stockStatus.icon}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(stockValue)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(product.purchasePrice)} cada
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newStock = prompt('Novo estoque:', product.stock.toString())
                              if (newStock !== null && !isNaN(Number(newStock))) {
                                handleUpdateStock(product.id, Number(newStock))
                              }
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
