import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupplierOrders } from '@/hooks/supabase/useSupplierOrders'
import { useSuppliers } from '@/hooks/supabase/useSuppliers'
import { useProducts } from '@/hooks/supabase/useProducts'
import { SupplierOrder, SupplierOrderItem, Supplier, Product } from '@/types'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Truck, 
  Calendar, 
  DollarSign,
  ShoppingCart,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusLabels = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmado', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Enviado pelo Fornecedor', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
}

const SupplierOrderForm: React.FC<{
  suppliers: Supplier[]
  products: Product[]
  onSubmit: (order: Omit<SupplierOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}> = ({ suppliers, products, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [status, setStatus] = useState<'pending'>('pending')
  const [shippingCost, setShippingCost] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Omit<SupplierOrderItem, 'id'>[]>([])
  
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    purchasePrice: 0,
    isPreSale: false,
    notes: ''
  })

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) return

    const product = products.find(p => p.id === newItem.productId)
    if (!product) return

    const totalPrice = newItem.quantity * newItem.purchasePrice
    
    setItems([...items, {
      productId: newItem.productId,
      product: {
        ...product,
        purchasePrice: newItem.purchasePrice
      },
      quantity: newItem.quantity,
      purchasePrice: newItem.purchasePrice,
      totalPrice,
      isPreSale: newItem.isPreSale,
      notes: newItem.notes
    }])

    setNewItem({
      productId: '',
      quantity: 1,
      purchasePrice: 0,
      isPreSale: false,
      notes: ''
    })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) return

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    
    await onSubmit({
      supplierId,
      supplier: suppliers.find(s => s.id === supplierId)!,
      orderDate: new Date(orderDate),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      status,
      items,
      subtotal,
      shippingCost,
      totalAmount: subtotal + shippingCost,
      notes
    })

    setIsOpen(false)
    // Reset form
    setSupplierId('')
    setOrderDate(new Date().toISOString().split('T')[0])
    setDeliveryDate('')
    setShippingCost(0)
    setNotes('')
    setItems([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido ao Fornecedor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="orderDate">Data do Pedido</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryDate">Data Prevista de Entrega</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="shippingCost">Frete (R$)</Label>
              <Input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pedido..."
              rows={3}
            />
          </div>

          {/* Adicionar Item */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Adicionar Item</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Produto</Label>
                <Select value={newItem.productId} onValueChange={(value) => {
                  setNewItem({ ...newItem, productId: value })
                  const product = products.find(p => p.id === value)
                  if (product) {
                    setNewItem(prev => ({ ...prev, purchasePrice: product.purchasePrice }))
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.brand?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
                <Input
                  type="number"
                  value={newItem.purchasePrice}
                  onChange={(e) => setNewItem({ ...newItem, purchasePrice: Number(e.target.value) })}
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isPreSale"
                  checked={newItem.isPreSale}
                  onChange={(e) => setNewItem({ ...newItem, isPreSale: e.target.checked })}
                  aria-label="Marcar como pré-venda"
                />
                <Label htmlFor="isPreSale">Pré-venda</Label>
              </div>
              
              <div>
                <Label htmlFor="totalPrice">Total</Label>
                <Input
                  disabled
                  value={`R$ ${(newItem.quantity * newItem.purchasePrice).toFixed(2)}`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="itemNotes">Observações do Item</Label>
              <Textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Observações específicas do item..."
                rows={2}
              />
            </div>

            <Button onClick={handleAddItem} disabled={!newItem.productId || newItem.quantity <= 0}>
              Adicionar Item
            </Button>
          </div>

          {/* Itens Adicionados */}
          {items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Itens do Pedido</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Original</TableHead>
                      <TableHead>Custo Real*</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
                      const freightProportion = subtotal > 0 ? (item.totalPrice / subtotal) * shippingCost : 0
                      const freightPerUnit = item.quantity > 0 ? freightProportion / item.quantity : 0
                      const realCostPerUnit = item.purchasePrice + freightPerUnit
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">{item.product.brand?.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>R$ {item.purchasePrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <div>
                              <div>R$ {realCostPerUnit.toFixed(2)}</div>
                              <div className="text-xs text-gray-500">
                                (+R$ {freightPerUnit.toFixed(2)} frete)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.isPreSale ? 'default' : 'secondary'}>
                              {item.isPreSale ? 'Pré-venda' : 'Estoque'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>R$ {item.totalPrice.toFixed(2)}</div>
                              <div className="text-xs text-gray-500">
                                Total real: R$ {(realCostPerUnit * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Resumo do Pedido */}
          {items.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Pedido</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {(items.reduce((sum, item) => sum + item.totalPrice, 0) + shippingCost).toFixed(2)}</span>
                </div>
                
                {/* Detalhamento de Custos por Item */}
                {shippingCost > 0 && (
                  <div className="mt-4 pt-2 border-t">
                    <h5 className="font-medium mb-2 text-blue-600">Custo Real por Item (incluindo frete proporcional)</h5>
                    <div className="space-y-1">
                      {items.map((item, index) => {
                        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
                        const freightProportion = (item.totalPrice / subtotal) * shippingCost
                        const freightPerUnit = freightProportion / item.quantity
                        const realCostPerUnit = item.purchasePrice + freightPerUnit
                        
                        return (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="truncate max-w-[200px]">{item.product.name}</span>
                            <span>
                              {item.quantity} × R$ {realCostPerUnit.toFixed(2)} = R$ {(realCostPerUnit * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!supplierId || items.length === 0}>
              Criar Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const SupplierOrdersManagement: React.FC = () => {
  const { orders, loading, error, createOrder, deleteOrder, updateOrder, getStats } = useSupplierOrders()
  const { suppliers } = useSuppliers()
  const { products } = useProducts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (orders.length > 0) {
          const statsData = await getStats()
          setStats(statsData)
        } else {
          // Se não há pedidos, definir estatísticas zeradas
          setStats({
            totalPreSaleItems: 0,
            totalStockItems: 0,
            totalPreSaleValue: 0,
            totalStockValue: 0,
            averageDeliveryDays: 0,
            ordersByStatus: {}
          })
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        // Definir estatísticas zeradas em caso de erro
        setStats({
          totalPreSaleItems: 0,
          totalStockItems: 0,
          totalPreSaleValue: 0,
          totalStockValue: 0,
          averageDeliveryDays: 0,
          ordersByStatus: {}
        })
      }
    }
    fetchStats()
  }, [orders.length]) // Removido getStats da dependência para evitar loop infinito

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrder(orderId, { status: newStatus })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleEditOrder = (order: SupplierOrder) => {
    // Por enquanto, apenas mostra um alerta
    // TODO: Implementar modal completo de edição
    alert(`Funcionalidade de edição ainda não implementada.\n\nPedido: ${order.id}\nFornecedor: ${order.supplier.name}`)
  }

  const calculateDeliveryDays = (order: SupplierOrder) => {
    if (!order.deliveryDate || !order.orderDate) return null
    
    try {
      const orderDate = new Date(order.orderDate)
      const deliveryDate = new Date(order.deliveryDate)
      
      // Verificar se ambas as datas são válidas
      if (isNaN(orderDate.getTime()) || isNaN(deliveryDate.getTime())) {
        return null
      }
      
      const diffTime = deliveryDate.getTime() - orderDate.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch (error) {
      console.warn('Erro ao calcular dias de entrega:', error)
      return null
    }
  }

  const getDaysRemaining = (order: SupplierOrder) => {
    if (!order.deliveryDate) return null

    try {
      const today = new Date()
      const deliveryDate = new Date(order.deliveryDate)
      
      // Verificar se a data é válida
      if (isNaN(deliveryDate.getTime())) {
        return null
      }
      
      const diffTime = deliveryDate.getTime() - today.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return daysRemaining
    } catch (error) {
      console.warn('Erro ao calcular dias restantes:', error)
      return null
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pedidos aos Fornecedores</h1>
        <SupplierOrderForm 
          suppliers={suppliers}
          products={products}
          onSubmit={createOrder}
        />
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pré-vendas</p>
                  <p className="text-2xl font-bold">{stats.totalPreSaleItems}</p>
                  <p className="text-sm text-gray-500">R$ {stats.totalPreSaleValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Estoque</p>
                  <p className="text-2xl font-bold">{stats.totalStockItems}</p>
                  <p className="text-sm text-gray-500">R$ {stats.totalStockValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prazo Médio</p>
                  <p className="text-2xl font-bold">{stats.averageDeliveryDays}</p>
                  <p className="text-sm text-gray-500">dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="shipped">Enviado pelo Fornecedor</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data do Pedido</TableHead>
                <TableHead>Prazo de Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.supplier.name}</TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        if (!order.orderDate) return 'N/A'
                        const date = new Date(order.orderDate)
                        if (isNaN(date.getTime())) return 'Data inválida'
                        return format(date, 'dd/MM/yyyy', { locale: ptBR })
                      } catch (error) {
                        return 'Data inválida'
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {order.deliveryDate ? (
                      <div>
                        <div className="font-medium">
                          {(() => {
                            try {
                              const date = new Date(order.deliveryDate)
                              if (isNaN(date.getTime())) return 'Data inválida'
                              return format(date, 'dd/MM/yyyy', { locale: ptBR })
                            } catch (error) {
                              return 'Data inválida'
                            }
                          })()}
                        </div>
                        {(() => {
                          const daysRemaining = getDaysRemaining(order)
                          const totalDays = calculateDeliveryDays(order)
                          return (
                            <div className="text-sm">
                              {daysRemaining !== null && (
                                <div className={`font-medium ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` : 
                                   daysRemaining === 0 ? 'Hoje' : `${daysRemaining} dias restantes`}
                                </div>
                              )}
                              {totalDays && daysRemaining !== null && (
                                <div className="text-gray-500 text-xs">
                                  Prazo total: {totalDays} dias
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-500">Não definido</span>
                        <div className="text-xs text-gray-400">Defina uma data de entrega</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={order.status} 
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="shipped">Enviado pelo Fornecedor</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Total: {order.items.length} itens</div>
                      <div className="text-gray-500">
                        Pré-venda: {order.items.filter(item => item.isPreSale).length}
                      </div>
                      <div className="text-gray-500">
                        Estoque: {order.items.filter(item => !item.isPreSale).length}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        R$ {(order.totalAmount || order.subtotal + (order.shippingCost || 0)).toFixed(2)}
                      </div>
                      {(order.shippingCost || 0) > 0 && (
                      <div className="text-gray-500">

                        Frete: R$ {(order.shippingCost || 0).toFixed(2)}
                      </div>
                      )}
                      <div className="text-xs text-blue-600">
                        Subtotal: R$ {(order.subtotal || 0).toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                        title="Editar pedido"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o pedido para ${order.supplier.name}?`)) {
                            deleteOrder(order.id)
                          }
                        }}
                        title="Excluir pedido"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
