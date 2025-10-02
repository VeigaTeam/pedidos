import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { CreditCard, Smartphone, Loader2 } from 'lucide-react'
import { CreditCardForm } from './CreditCardForm'
import { PixPaymentForm } from './PixPaymentForm'
import { PaymentService } from '../../lib/paymentService'
import { useToast } from '../../hooks/use-toast'
import type { PaymentResult } from '../../types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number
  onPaymentSuccess: (result: PaymentResult) => void
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  orderId, 
  amount, 
  onPaymentSuccess 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('credit_card')
  const { toast } = useToast()

  const handlePaymentSuccess = (result: PaymentResult) => {
    setIsProcessing(false)
    onPaymentSuccess(result)
    onClose()
    
    toast({
      title: result.success ? 'Pagamento realizado!' : 'Erro no pagamento',
      description: result.message || result.error,
      variant: result.success ? 'default' : 'destructive'
    })
  }

  const handlePaymentError = (error: string) => {
    setIsProcessing(false)
    toast({
      title: 'Erro no pagamento',
      description: error,
      variant: 'destructive'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Valor total: <span className="font-semibold text-lg">R$ {amount.toFixed(2)}</span>
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credit_card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cartão
              </TabsTrigger>
              <TabsTrigger value="pix" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                PIX
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credit_card" className="space-y-4">
              <CreditCardForm
                amount={amount}
                onPayment={async () => {
                  setIsProcessing(true)
                  try {
                    const result = await PaymentService.createManualPayment(
                      orderId,
                      amount,
                      'credit_card_manual'
                    )
                    handlePaymentSuccess(result)
                  } catch (error) {
                    handlePaymentError(error instanceof Error ? error.message : 'Erro desconhecido')
                  }
                }}
                isProcessing={isProcessing}
              />
            </TabsContent>

            <TabsContent value="pix" className="space-y-4">
              <PixPaymentForm
                amount={amount}
                onPayment={async (pixData) => {
                  setIsProcessing(true)
                  try {
                    const result = await PaymentService.processPixPayment(
                      orderId,
                      amount,
                      pixData
                    )
                    handlePaymentSuccess(result)
                  } catch (error) {
                    handlePaymentError(error instanceof Error ? error.message : 'Erro desconhecido')
                  }
                }}
                isProcessing={isProcessing}
              />
            </TabsContent>
          </Tabs>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando pagamento...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

