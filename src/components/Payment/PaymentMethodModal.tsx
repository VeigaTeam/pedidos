import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, CreditCard, Loader2 } from 'lucide-react'
import { PixPaymentModal } from './PixPaymentModal'
import { useToast } from '@/hooks/use-toast'
import { PaymentService } from '@/lib/paymentService'
import type { PaymentResult } from '@/types'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number
  onPaymentSuccess: (result: PaymentResult) => void
}

export function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  onPaymentSuccess 
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handlePixPayment = () => {
    setSelectedMethod('pix')
  }

  const handleCreditCardPayment = async () => {
    setIsProcessing(true)
    try {
      // Criar pagamento pendente para cartão de crédito
      const result = await PaymentService.createManualPayment(orderId, amount, 'credit_card_manual')
      
      if (result.success) {
        toast({
          title: 'Pedido criado com sucesso!',
          description: 'Você receberá um link de pagamento por email em breve.',
        })
        
        onPaymentSuccess(result)
        onClose()
      } else {
        toast({
          title: 'Erro ao processar pedido',
          description: result.error || 'Tente novamente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro no pagamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePixSuccess = (result: PaymentResult) => {
    onPaymentSuccess(result)
    onClose()
  }

  const handleClose = () => {
    setSelectedMethod(null)
    onClose()
  }

  if (selectedMethod === 'pix') {
    return (
      <PixPaymentModal
        isOpen={isOpen}
        onClose={handleClose}
        orderId={orderId}
        amount={amount}
        onPaymentSuccess={handlePixSuccess}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha a forma de pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Valor total: <span className="font-semibold text-lg">R$ {amount.toFixed(2)}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* PIX */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handlePixPayment}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  PIX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Pagamento instantâneo via PIX
                </p>
                <div className="space-y-1 text-xs text-green-600">
                  <p>• Pagamento imediato</p>
                  <p>• Sem taxas adicionais</p>
                  <p>• QR Code ou código PIX</p>
                </div>
              </CardContent>
            </Card>

            {/* Cartão de Crédito */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreditCardPayment}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Cartão de Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Link de pagamento será enviado por email
                </p>
                <div className="space-y-1 text-xs text-blue-600">
                  <p>• Parcelamento disponível</p>
                  <p>• Link seguro de pagamento</p>
                  <p>• Envio por email</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando pedido...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
