import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePayments } from '@/hooks/supabase/usePayments'
import { ManualPaymentForm } from '@/components/Payment'
import { PaymentService } from '@/lib/paymentService'
import { 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw,
  Download,
  Eye,
  Link,
  Smartphone
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { PaymentStatus as PaymentStatusType, PaymentMethod, Payment } from '@/types'

export default function PaymentManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)
  
  const { payments, loading, error, refetch } = usePayments()
  const { toast } = useToast()

  const createTestPayment = async () => {
    try {
      // Criar um pedido de teste primeiro
      const testOrderId = 'test-order-' + Date.now()
      
      const result = await PaymentService.createManualPayment(
        testOrderId,
        100.00,
        'credit_card_manual'
      )

      if (result.success) {
        toast({
          title: 'Pagamento de teste criado!',
          description: 'Agora você pode gerar um link manual para este pagamento.',
        })
        refetch()
      } else {
        toast({
          title: 'Erro ao criar pagamento de teste',
          description: result.error || 'Tente novamente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (!payment || !payment.id) return false
    
    const matchesSearch = payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadgeColor = (status: PaymentStatusType) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return <Smartphone className="h-4 w-4" />
      case 'credit_card_manual':
        return <Link className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const exportPayments = () => {
    const csvContent = [
      ['ID', 'Pedido', 'Valor', 'Método', 'Status', 'Data', 'ID Transação'].join(','),
      ...filteredPayments.map(payment => [
        payment.id,
        payment.orderId,
        payment.amount.toFixed(2),
        payment.method,
        payment.status,
        formatDate(payment.createdAt),
        payment.transactionId || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Carregando pagamentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar pagamentos: {error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Pagamentos</h1>
        <p className="text-gray-600">Gerencie todos os pagamentos do sistema</p>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ID do pagamento ou transação"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="refunded">Estornado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Método
              </label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card_manual">Cartão de Crédito (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={refetch} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={exportPayments} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={createTestPayment} variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                <CreditCard className="h-4 w-4 mr-2" />
                Teste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pagamentos ({filteredPayments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum pagamento encontrado
              </h3>
              <p className="text-gray-500">
                {payments.length === 0 
                  ? 'Ainda não há pagamentos registrados'
                  : 'Tente ajustar os filtros para encontrar pagamentos'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => {
                if (!payment || !payment.id) return null
                
                return (
                <Card key={payment.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getMethodIcon(payment.method)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </h4>
                            <Badge className={getStatusBadgeColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>ID: {payment.id?.slice(0, 8) || 'N/A'}...</p>
                            <p>Pedido: {payment.orderId?.slice(0, 8) || 'N/A'}...</p>
                            {payment.transactionId && (
                              <p>Transação: {payment.transactionId}</p>
                            )}
                            <p>Data: {formatDate(payment.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {payment.method === 'credit_card_manual' && payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setIsManualFormOpen(true)
                            }}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Gerar Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implementar visualização detalhada
                            alert('Funcionalidade em desenvolvimento')
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para gerar link manual */}
      {selectedPayment && (
        <ManualPaymentForm
          isOpen={isManualFormOpen}
          onClose={() => {
            setIsManualFormOpen(false)
            setSelectedPayment(null)
          }}
          payment={selectedPayment}
          onUpdate={refetch}
        />
      )}
    </div>
  )
}

