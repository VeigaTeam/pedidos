import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import type { Payment, PaymentStatus } from '@/types'

interface PaymentStatusProps {
  payment: Payment
  onRefresh?: () => void
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  processing: {
    label: 'Processando',
    color: 'bg-blue-100 text-blue-800',
    icon: RefreshCw
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  },
  refunded: {
    label: 'Estornado',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  }
}

const methodConfig = {
  pix: {
    label: 'PIX',
    icon: Smartphone
  },
  credit_card_manual: {
    label: 'Cartão de Crédito (Manual)',
    icon: CreditCard
  }
}

export function PaymentStatus({ payment, onRefresh }: PaymentStatusProps) {
  const status = statusConfig[payment.status]
  const method = methodConfig[payment.method]
  const StatusIcon = status.icon
  const MethodIcon = method.icon

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MethodIcon className="h-5 w-5" />
            {method.label}
          </CardTitle>
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-semibold">{formatAmount(payment.amount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data:</span>
            <p className="font-semibold">{formatDate(payment.createdAt)}</p>
          </div>
        </div>

        {payment.transactionId && (
          <div>
            <span className="text-muted-foreground text-sm">ID da Transação:</span>
            <p className="font-mono text-sm">{payment.transactionId}</p>
          </div>
        )}

        {payment.method === 'credit_card_manual' && payment.paymentLink && (
          <div>
            <span className="text-muted-foreground text-sm">Link de Pagamento:</span>
            <a 
              href={payment.paymentLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm break-all"
            >
              {payment.paymentLink}
            </a>
          </div>
        )}

        {payment.method === 'pix' && payment.pixCode && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Código PIX:</span>
            <div className="bg-muted p-2 rounded font-mono text-xs break-all">
              {payment.pixCode}
            </div>
          </div>
        )}

        {payment.method === 'pix' && payment.pixQrCode && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">QR Code:</span>
            <div className="flex justify-center">
              <img 
                src={payment.pixQrCode} 
                alt="QR Code PIX" 
                className="w-32 h-32 border rounded"
              />
            </div>
          </div>
        )}

        {onRefresh && (
          <div className="pt-4 border-t">
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Atualizar Status
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

