import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOrders } from '@/hooks/supabase/useOrders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { pdfService } from '@/lib/pdfService'
import { 
  ShoppingCart, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
} from 'lucide-react'

export default function OrdersManagement() {
  const { orders, loading, error, updateOrderStatus } = useOrders()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.studentPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando pedidos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Erro ao carregar pedidos: {error}</div>
      </div>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'processing', label: 'Processando' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'cancelled', label: 'Cancelados' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'confirmed': return 'Confirmado'
      case 'processing': return 'Processando'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as any)
      toast({
        title: "Status atualizado",
        description: "Status do pedido atualizado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido.",
        variant: "destructive"
      })
    }
  }

  const exportToWhatsApp = (order: typeof orders[0]) => {
    const itemsText = order.items.map(item => 
      `• ${item.product.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` - ${item.color}` : ''} - Qtd: ${item.quantity} - ${formatCurrency(item.unitPrice)}`
    ).join('\n')

    const message = `📦 *NOVO PEDIDO - Academia Veiga*

👤 *Cliente:* ${order.studentName}
📧 *Email:* ${order.studentEmail}
📱 *Telefone:* ${order.studentPhone}

🛍️ *Itens:*
${itemsText}

💰 *Total:* ${formatCurrency(order.totalAmount)}

📅 *Data:* ${formatDateTime(order.createdAt)}
${order.notes ? `\n📝 *Observações:* ${order.notes}` : ''}

---
*Pedido ID: ${order.id}*`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const generateOrdersPDF = () => {
    try {
      const doc = pdfService.generateOrdersReport(orders)
      pdfService.downloadPDF(doc, `relatorio-pedidos-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Relatório gerado",
        description: "Relatório de pedidos baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      })
    }
  }

  const generateOrderDetailPDF = (order: typeof orders[0]) => {
    try {
      const doc = pdfService.generateOrderDetail(order)
      pdfService.downloadPDF(doc, `pedido-${order.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Relatório gerado",
        description: "Relatório do pedido baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      })
    }
  }

  const selectedOrderData = orders.find(o => o.id === selectedOrder)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos dos alunos
          </p>
        </div>
        <Button variant="outline" onClick={generateOrdersPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </div>

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
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pedidos ({filteredOrders.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os pedidos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {order.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{order.studentEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.studentPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDateTime(order.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToWhatsApp(order)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateOrderDetailPDF(order)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detalhes do Pedido</CardTitle>
                  <CardDescription>
                    ID: {selectedOrderData.id}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedOrderData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrderData.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedOrderData.studentPhone}</p>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Itens do Pedido</h3>
                <div className="space-y-3">
                  {selectedOrderData.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.size && `Tamanho: ${item.size}`}
                          {item.size && item.color && ' • '}
                          {item.color && `Cor: ${item.color}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Resumo do Pedido</h3>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrderData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrderData.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedOrderData.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <p className="p-4 bg-muted rounded-lg">{selectedOrderData.notes}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportToWhatsApp(selectedOrderData)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Exportar para WhatsApp
                </Button>
                <Button
                  onClick={() => setSelectedOrder(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
